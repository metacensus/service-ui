import {
  ApiError,
  apiPrefix,
  Client,
  type LoginRequest,
  type LogoutRequest,
  type LogoutResponse,
  type RefreshRequest,
  type Session,
} from "@metacensus/api";

import { passkeySigner } from "@/lib/passkeySigner";
import { LOGIN_PATH } from "@/lib/session";

/** A 401 from these is the caller's: a wrong password, or no session left. */
const exempt = new Set(
  ["/login", "/signup", "/refresh"].map((path) => apiPrefix + path)
);

export const is4xx = (error: unknown): boolean =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

const send: typeof globalThis.fetch = (input, init) =>
  fetch(input, { ...init, signal: AbortSignal.timeout(10_000) });

/**
 * The seam under the generated Client. A 401 refreshes once and retries with
 * the new token. A refresh the server rejects, or a second 401, ends the
 * session; any other failed refresh fails the request.
 */
const apiTransport: typeof globalThis.fetch = async (input, init) => {
  const response = await send(input, init);
  if (response.status !== 401 || exempt.has(String(input))) return response;
  const retried = await apiClient.refresh().then(
    () => {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${apiClient.token}`);
      return send(input, { ...init, headers });
    },
    (error) => {
      if (is4xx(error)) return response;
      throw error;
    }
  );
  if (retried.status === 401) window.location.assign(LOGIN_PATH);
  return retried;
};

/**
 * The Client, plus how long its session lives: the token is opaque, so
 * `expiresIn` is the only expiry signal.
 */
class SessionClient extends Client {
  #expiresAt = 0;
  #refreshing?: Promise<Session>;

  #record = (session: Session): Session => {
    this.#expiresAt = Date.now() + session.expiresIn * 1000;
    return session;
  };

  login(req: LoginRequest): Promise<Session> {
    return super.login(req).then(this.#record);
  }

  signUp(req: Parameters<Client["signUp"]>[0]): Promise<Session> {
    return super.signUp(req).then(this.#record);
  }

  /** `mc_refresh` rotates on use, so concurrent callers share one call. */
  refresh(req: RefreshRequest = { refreshToken: "" }): Promise<Session> {
    this.#refreshing ??= super
      .refresh(req)
      .then(this.#record)
      .finally(() => {
        this.#refreshing = undefined;
      });
    return this.#refreshing;
  }

  async logout(
    req: LogoutRequest = { refreshToken: "" }
  ): Promise<LogoutResponse> {
    await this.#refreshing?.catch(() => {});
    const response = await super.logout(req);
    this.#expiresAt = 0;
    return response;
  }

  async resume(): Promise<boolean> {
    if (Date.now() < this.#expiresAt) return true;
    return this.refresh().then(
      () => true,
      (error) => {
        if (is4xx(error)) return false;
        throw error;
      }
    );
  }
}

/**
 * The one `@metacensus/api` Client the SPA calls the API through, on the SPA's
 * own origin: `credentials` stays at fetch's `same-origin`, which carries
 * `mc_refresh`.
 */
export const apiClient = new SessionClient({
  baseUrl: "",
  fetch: apiTransport,
  signer: passkeySigner,
});
