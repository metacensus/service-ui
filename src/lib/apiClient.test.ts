import { ApiError } from "@metacensus/api";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./passkeySigner", () => ({
  passkeySigner: async () => ({}),
}));

const LOGIN_URL = "/metacensus/api/v1/login";
const SIGNUP_URL = "/metacensus/api/v1/signup";
const REFRESH_URL = "/metacensus/api/v1/refresh";
const SELF_URL = "/metacensus/api/v1/self";
const EXPIRES_IN = 900;

const fetchMock = vi.fn<typeof fetch>();
/** mock for calls to `location.assign()` */
const assign = vi.fn();

const session = (token: string) =>
  new Response(
    JSON.stringify({ token, expiresIn: EXPIRES_IN, refreshToken: "" }),
    { status: 200 }
  );

const urlsSent = () => fetchMock.mock.calls.map(([url]) => url);

const authorizationSent = (call: number) =>
  new Headers(fetchMock.mock.calls[call][1]?.headers).get("Authorization");

/** `apiClient` is a singleton, so each test takes a fresh one. */
const freshClient = async () => {
  vi.resetModules();
  const { apiClient } = await import("./apiClient");
  return apiClient;
};

type ApiClient = Awaited<ReturnType<typeof freshClient>>;

/** Answers `/refresh` with `refresh`, and anything else with a 401 unless it bears `accepted`. */
const backend = (
  refresh: (...args: Parameters<typeof fetch>) => Response | Promise<Response>,
  accepted?: string
) =>
  fetchMock.mockImplementation(async (url, init) => {
    if (url === REFRESH_URL) return refresh(url, init);
    const bearer = new Headers(init?.headers).get("Authorization");
    return new Response("{}", { status: bearer === `Bearer ${accepted}` ? 200 : 401 });
  });

/** A fetch that never answers, and fails only when its signal aborts. */
const hang: typeof fetch = (_, init) =>
  new Promise((_, reject) =>
    init?.signal?.addEventListener("abort", () => reject(init.signal?.reason))
  );

/** Failures that are not the server rejecting the request. */
const transient: Array<[string, typeof fetch]> = [
  ["times out", hang],
  ["meets a network error", () => Promise.reject(new TypeError("Failed to fetch"))],
  ["gets a 500", async () => new Response("", { status: 500 })],
];

const loggedInClient = async () => {
  const apiClient = await freshClient();
  fetchMock.mockImplementationOnce(async () => session("logged-in"));
  await apiClient.login({ email: "a@b.c", password: "pw" });
  fetchMock.mockClear();
  return apiClient;
};

const timeout = AbortSignal.timeout.bind(AbortSignal);

beforeEach(() => {
  fetchMock.mockReset();
  assign.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubGlobal("window", { location: { pathname: "/topics", assign } });
  // Every fetch times out after 1ms, so `hang` fails fast.
  vi.spyOn(AbortSignal, "timeout").mockImplementation(() => timeout(1));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiClient", () => {
  it("sends no Authorization before a session and the bearer token after login", async () => {
    const apiClient = await freshClient();
    fetchMock.mockImplementationOnce(async () => session("logged-in"));
    fetchMock.mockImplementation(
      async () => new Response("{}", { status: 200 })
    );

    await apiClient.login({ email: "a@b.c", password: "pw" });
    await apiClient.getSelf({});

    expect(authorizationSent(0)).toBeNull();
    expect(authorizationSent(1)).toBe("Bearer logged-in");
  });

  it.each([
    ["login", LOGIN_URL, (c: ApiClient) => c.login({ email: "a@b.c", password: "pw" })],
    [
      "signUp",
      SIGNUP_URL,
      (c: ApiClient) =>
        c.signUp({ content: { name: "A", email: "a@b.c", country: "GB" }, password: "pw" }),
    ],
  ])("rejects a 401 from %s with an ApiError, refreshing nothing and navigating nowhere", async (_, url, call) => {
    const apiClient = await freshClient();
    fetchMock.mockImplementation(async () => new Response("", { status: 401 }));

    await expect(call(apiClient)).rejects.toBeInstanceOf(ApiError);
    expect(urlsSent()).toEqual([url]);
    expect(assign).not.toHaveBeenCalled();
  });

  it.each(transient)("keeps the session when /self %s", async (_, self) => {
    const apiClient = await loggedInClient();
    fetchMock.mockImplementation(self);

    await expect(apiClient.getSelf({})).rejects.toThrow();

    expect(urlsSent()).toEqual([SELF_URL]);
    expect(assign).not.toHaveBeenCalled();
    expect(apiClient.token).toBe("logged-in");
  });
});

describe("apiClient on a 401", () => {
  it("refreshes once and retries with the new token", async () => {
    const apiClient = await loggedInClient();
    backend(() => session("refreshed"), "refreshed");

    await apiClient.getSelf({});

    expect(urlsSent()).toEqual([SELF_URL, REFRESH_URL, SELF_URL]);
    expect(authorizationSent(2)).toBe("Bearer refreshed");
    expect(assign).not.toHaveBeenCalled();
  });

  it.each([
    ["the refresh fails", () => new Response("", { status: 401 }), [SELF_URL, REFRESH_URL]],
    ["the retry gets a 401", () => session("refreshed"), [SELF_URL, REFRESH_URL, SELF_URL]],
  ])("ends the session when %s", async (_, refresh, urls) => {
    const apiClient = await loggedInClient();
    backend(refresh);

    await expect(apiClient.getSelf({})).rejects.toBeInstanceOf(ApiError);

    expect(urlsSent()).toEqual(urls);
    expect(assign).toHaveBeenCalledWith("/log-in");
  });

  it.each(transient)("keeps the session when the refresh %s", async (_, refresh) => {
    const apiClient = await loggedInClient();
    backend(refresh);

    await expect(apiClient.getSelf({})).rejects.not.toMatchObject({ status: 401 });

    expect(urlsSent()).toEqual([SELF_URL, REFRESH_URL]);
    expect(assign).not.toHaveBeenCalled();
    expect(apiClient.token).toBe("logged-in");
  });

  it("keeps the session when the retry times out", async () => {
    const apiClient = await loggedInClient();
    fetchMock.mockImplementationOnce(async () => new Response("", { status: 401 }));
    fetchMock.mockImplementationOnce(async () => session("refreshed"));
    fetchMock.mockImplementationOnce(hang);

    await expect(apiClient.getSelf({})).rejects.toMatchObject({ name: "TimeoutError" });

    expect(urlsSent()).toEqual([SELF_URL, REFRESH_URL, SELF_URL]);
    expect(assign).not.toHaveBeenCalled();
  });

  it("shares one refresh among concurrent 401s", async () => {
    const apiClient = await loggedInClient();
    backend(() => session("refreshed"), "refreshed");

    await Promise.all([apiClient.getSelf({}), apiClient.getSelf({})]);

    expect(urlsSent().filter((url) => url === REFRESH_URL)).toHaveLength(1);
  });
});

describe("apiClient.refresh", () => {
  it("shares one request among concurrent callers and sends another later", async () => {
    const apiClient = await freshClient();
    fetchMock.mockImplementation(async () => session("refreshed"));

    await Promise.all([apiClient.refresh(), apiClient.refresh()]);
    expect(urlsSent()).toEqual([REFRESH_URL]);

    await apiClient.refresh();
    expect(urlsSent()).toEqual([REFRESH_URL, REFRESH_URL]);
  });
});

describe("apiClient.resume", () => {
  it("sends nothing within expiresIn", async () => {
    vi.useFakeTimers();
    const apiClient = await loggedInClient();

    vi.advanceTimersByTime((EXPIRES_IN - 1) * 1000);

    await expect(apiClient.resume()).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refreshes once past expiresIn", async () => {
    vi.useFakeTimers();
    const apiClient = await loggedInClient();
    fetchMock.mockImplementation(async () => session("refreshed"));

    vi.advanceTimersByTime(EXPIRES_IN * 1000);

    await expect(apiClient.resume()).resolves.toBe(true);
    expect(urlsSent()).toEqual([REFRESH_URL]);
  });

  it("resolves false when the refresh fails", async () => {
    const apiClient = await freshClient();
    fetchMock.mockResolvedValue(new Response("", { status: 401 }));

    await expect(apiClient.resume()).resolves.toBe(false);
  });

  it.each(transient)("rejects rather than resolving false when the refresh %s", async (_, refresh) => {
    const apiClient = await freshClient();
    fetchMock.mockImplementation(refresh);

    await expect(apiClient.resume()).rejects.toThrow();
  });

  it("refreshes again after logout", async () => {
    const apiClient = await loggedInClient();
    fetchMock.mockImplementationOnce(
      async () => new Response("{}", { status: 200 })
    );
    await apiClient.logout();
    fetchMock.mockClear();
    fetchMock.mockImplementation(async () => session("refreshed"));

    await expect(apiClient.resume()).resolves.toBe(true);
    expect(urlsSent()).toEqual([REFRESH_URL]);
  });
});

describe("apiClient session state", () => {
  it("lets the next call send again after a shared refresh fails", async () => {
    const apiClient = await freshClient();
    fetchMock.mockImplementation(async () => new Response("", { status: 401 }));

    const calls = await Promise.allSettled([apiClient.refresh(), apiClient.refresh()]);
    expect(calls.map((c) => c.status)).toEqual(["rejected", "rejected"]);
    expect(urlsSent()).toEqual([REFRESH_URL]);

    await apiClient.refresh().catch(() => {});
    expect(urlsSent()).toEqual([REFRESH_URL, REFRESH_URL]);
  });

  it("keeps a login that lands while a refresh fails", async () => {
    const apiClient = await freshClient();
    let failRefresh!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => (failRefresh = resolve))
    );
    const refreshing = apiClient.refresh().catch(() => {});
    fetchMock.mockImplementationOnce(async () => session("logged-in"));
    await apiClient.login({ email: "a@b.c", password: "pw" });
    failRefresh(new Response("", { status: 401 }));
    await refreshing;
    fetchMock.mockClear();

    await expect(apiClient.resume()).resolves.toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(apiClient.token).toBe("logged-in");
  });

  it("sends nothing on a resume right after a refresh", async () => {
    const apiClient = await freshClient();
    fetchMock.mockImplementation(async () => session("refreshed"));

    await apiClient.resume();
    await apiClient.resume();
    expect(urlsSent()).toEqual([REFRESH_URL]);
  });

  it("ends the session when a logout overlaps a refresh", async () => {
    const apiClient = await loggedInClient();
    let finishRefresh!: (response: Response) => void;
    fetchMock.mockImplementationOnce(
      () => new Promise((resolve) => (finishRefresh = resolve))
    );
    const refreshing = apiClient.refresh();
    fetchMock.mockImplementationOnce(async () => new Response("{}", { status: 200 }));
    const loggingOut = apiClient.logout();
    finishRefresh(session("refreshed"));
    await Promise.all([refreshing, loggingOut]);

    expect(apiClient.token).toBeUndefined();
  });
});
