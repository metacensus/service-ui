import { Prop_Type, Vote_Position } from "@metacensus/api";
import {
  assert,
  authenticatorData,
  decodePublicKey,
  encodePublicKey,
  FLAG_UP,
  FLAG_UV,
  generateKeyPair,
  participantPolicy,
  TYPE_GET,
  verifyUser,
} from "@metacensus/api/signing";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./apiClient";
import { type Passkey, PasskeyError } from "./passkey";
import { passkeySigner } from "./passkeySigner";

const { getPasskey } = vi.hoisted(() => ({
  getPasskey: vi.fn<() => Promise<Passkey | undefined>>(),
}));
vi.mock("./passkey", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./passkey")>()),
  getPasskey,
}));

const ORIGIN = "http://localhost:5173";
const credentialId = new Uint8Array([1, 2, 3]).buffer;
const topic = { name: "Signed in the browser", description: "" };

const get = vi.fn<CredentialsContainer["get"]>();
const fetchMock = vi.fn<typeof fetch>();

let keys: CryptoKeyPair;
let stored: Passkey;

const bytes = (base64url: string) =>
  new Uint8Array(Buffer.from(base64url, "base64url")).buffer;

/** This device's passkey, signing whatever challenge it is given as a browser would. */
const authenticator: CredentialsContainer["get"] = async (options) => {
  const assertion = await assert(
    keys.privateKey,
    options?.publicKey?.challenge as Uint8Array<ArrayBuffer>,
    await authenticatorData("localhost", FLAG_UP | FLAG_UV),
    { type: TYPE_GET, origin: ORIGIN }
  );
  return {
    response: {
      authenticatorData: bytes(assertion.authenticatorData),
      clientDataJSON: bytes(assertion.clientDataJson),
      signature: bytes(assertion.signature),
    },
  } as unknown as PublicKeyCredential;
};

const sign = () => passkeySigner(topic, "metacensus.v1.Topic");

const bodySent = () => JSON.parse(String(fetchMock.mock.calls[0][1]?.body));

beforeAll(async () => {
  keys = await generateKeyPair();
  stored = { credentialId, publicKey: await encodePublicKey(keys.publicKey) };
});

beforeEach(() => {
  getPasskey.mockReset().mockResolvedValue(stored);
  get.mockReset().mockImplementation(authenticator);
  fetchMock.mockReset().mockImplementation(async () => new Response("{}"));
  vi.stubGlobal("navigator", { credentials: { get } });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("passkeySigner", () => {
  it("signs with the stored passkey, verified, in a signature the participant policy accepts", async () => {
    const { interpretation, publicKey, signature } = await sign();

    const { allowCredentials, userVerification } = get.mock.calls[0][0]!.publicKey!;
    expect(allowCredentials).toHaveLength(1);
    expect(allowCredentials![0]).toMatchObject({ type: "public-key" });
    expect(allowCredentials![0].id).toBe(credentialId);
    expect(userVerification).toBe("required");
    expect(publicKey).toBe(stored.publicKey);
    expect(interpretation.contentType).toBe("metacensus.v1.Topic");
    expect(
      await verifyUser(
        await decodePublicKey(stored.publicKey),
        topic,
        interpretation,
        signature,
        participantPolicy(ORIGIN)
      )
    ).toBe(true);
  });

  it("encodes the assertion as unpadded base64url", async () => {
    const { signature } = await sign();

    for (const field of Object.values(signature.assertion!)) {
      expect(field).toMatch(/^[\w-]+$/);
    }
  });

  it("signs the time in whole seconds", async () => {
    vi.useFakeTimers({ toFake: ["Date"], now: new Date("2026-11-02T12:00:00.000Z") });

    const { signature } = await sign();

    expect(signature.time).toBe("2026-11-02T12:00:00Z");
  });

  it.each([
    ["NotAllowedError", "cancelled"],
    ["InvalidStateError", "failed"],
  ])("maps a %s from the prompt to %s", async (name, reason) => {
    const cause = new DOMException("no", name);
    get.mockRejectedValue(cause);

    const error = await sign().catch((e) => e);

    expect(error).toBeInstanceOf(PasskeyError);
    expect(error).toMatchObject({ reason, cause });
  });

  it("rejects failed without a prompt on a device with no passkey", async () => {
    getPasskey.mockResolvedValue(undefined);

    await expect(sign()).rejects.toMatchObject({ reason: "failed" });
    expect(get).not.toHaveBeenCalled();
  });
});

describe("apiClient writes", () => {
  it.each([
    ["createTopic", () => apiClient.createTopic({ content: topic })],
    [
      "createProp",
      () =>
        apiClient.createProp({
          topicId: "t",
          content: { topicId: "t", type: Prop_Type.Statement, description: "" },
        }),
    ],
    [
      "setVote",
      () =>
        apiClient.setVote({
          topicId: "t",
          propId: "p",
          content: {
            topicId: "t",
            propId: "p",
            userId: "u",
            position: Vote_Position.For,
            explanation: "",
            citations: [],
          },
        }),
    ],
  ])("%s sends a signature and no publicKey", async (_, write) => {
    await write();

    expect(bodySent()).toHaveProperty("userSignature.assertion");
    expect(bodySent()).not.toHaveProperty("publicKey");
  });

  it("signUp sends the publicKey it enrols", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token: "t", expiresIn: 900, refreshToken: "" }))
    );

    await apiClient.signUp({
      content: { name: "Ada", email: "ada@example.com", country: "GB" },
      password: "pw",
    });

    expect(bodySent()).toMatchObject({
      publicKey: stored.publicKey,
      userSignature: { assertion: expect.any(Object) },
    });
  });

  it("sends nothing when the prompt is cancelled", async () => {
    get.mockRejectedValue(new DOMException("no", "NotAllowedError"));

    await expect(apiClient.createTopic({ content: topic })).rejects.toBeInstanceOf(
      PasskeyError
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
