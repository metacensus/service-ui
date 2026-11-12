import { ApiError } from "@metacensus/api";
import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/apiClient";
import { PasskeyError, getPasskey, registerPasskey } from "@/lib/passkey";
import { passkeySigner } from "@/lib/passkeySigner";
import { router } from "@/router";
import { signUpNotice, submitSignUp } from "./page";

vi.mock("@/lib/passkey", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/passkey")>()),
  registerPasskey: vi.fn(),
  getPasskey: vi.fn(async () => undefined),
}));
vi.mock("@/lib/passkeySigner", () => ({ passkeySigner: vi.fn(async () => ({})) }));

const fetchMock = vi.fn<typeof fetch>(
  async () => new Response(JSON.stringify({ token: "t", expiresIn: 900, refreshToken: "" }))
);
vi.stubGlobal("fetch", fetchMock);

const input = {
  name: "Ada",
  email: "ada@example.com",
  country: "GB",
  password: "a long password",
  passwordConfirmation: "a long password",
  verify: true,
};
const cancelled = new PasskeyError("cancelled");

beforeEach(() => {
  vi.resetAllMocks();
});

describe("submitSignUp", () => {
  it("registers a passkey, then signs up with the password outside content, into a session the guard passes", async () => {
    await submitSignUp({ current: false }, input);

    expect(registerPasskey).toHaveBeenCalledWith({ name: "Ada", email: "ada@example.com" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/metacensus/api/v1/signup");
    const body = JSON.parse(String(init?.body));
    expect(body.content).toEqual({ name: "Ada", email: "ada@example.com", country: "GB" });
    expect(body.password).toBe("a long password");
    await expect(apiClient.resume()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("only signs on a resubmit after the signature is rejected", async () => {
    vi.mocked(passkeySigner).mockRejectedValueOnce(cancelled);
    const registered = { current: false };

    await expect(submitSignUp(registered, input)).rejects.toBe(cancelled);
    await submitSignUp(registered, input);

    expect(registerPasskey).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sends nothing when registering is cancelled, and registers on the resubmit", async () => {
    vi.mocked(registerPasskey).mockRejectedValueOnce(cancelled);
    const registered = { current: false };

    await expect(submitSignUp(registered, input)).rejects.toBe(cancelled);
    expect(fetchMock).not.toHaveBeenCalled();
    await submitSignUp(registered, input);

    expect(registerPasskey).toHaveBeenCalledTimes(2);
  });
});

describe("signUpNotice", () => {
  it.each([
    ["a cancelled prompt", cancelled, false],
    ["a failed passkey", new PasskeyError("failed"), true],
    ["a browser below the passkey floor", new PasskeyError("unsupported"), true],
    ["a rejected sign-up", new ApiError("POST", "/signup", 409, ""), true],
  ])("says whether %s is an error, in words of its own", (_, error, isError) => {
    const notice = signUpNotice(error);
    expect(notice.isError).toBe(isError);
    expect(notice.text).not.toBe(error.message);
  });

  it("says the browser can't create a passkey when it is below the passkey floor", async () => {
    const { registerPasskey } = await vi.importActual<typeof import("@/lib/passkey")>("@/lib/passkey");
    const toBase64 = Object.getOwnPropertyDescriptor(Uint8Array.prototype, "toBase64")!;
    delete (Uint8Array.prototype as { toBase64?: unknown }).toBase64;
    const error = await registerPasskey(input).catch((e) => e);
    Object.defineProperty(Uint8Array.prototype, "toBase64", toBase64);

    expect(error).toMatchObject({ reason: "unsupported" });
    expect(signUpNotice(error)).toEqual({ text: expect.stringContaining("can't create a passkey"), isError: true });
  });
});

describe("/sign-up", () => {
  const renderSignUp = async () => {
    router.update({ ...router.options, history: createMemoryHistory({ initialEntries: ["/sign-up"] }) });
    await router.load();
    return renderToString(<RouterProvider router={router} />);
  };

  it("renders the page, telling the user to expect two prompts", async () => {
    const markup = await renderSignUp();

    expect(router.state.location.pathname).toBe("/sign-up");
    expect(markup).toContain("asks your device twice");
    expect(markup).not.toContain("already has a passkey");
  });

  it("warns that registering replaces this device's passkey", async () => {
    vi.mocked(getPasskey).mockResolvedValue({ credentialId: new ArrayBuffer(0), publicKey: "" });

    expect(await renderSignUp()).toContain("already has a passkey, and registering replaces it");
  });

  it("renders the page when the passkey lookup fails", async () => {
    vi.mocked(getPasskey).mockRejectedValue(new Error("no IndexedDB"));

    expect(await renderSignUp()).toContain("asks your device twice");
  });
});
