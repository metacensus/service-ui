import {
  decodePublicKey,
  encodePublicKey,
  generateKeyPair,
  keyId,
} from "@metacensus/api/signing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, unknown>();
vi.mock("@/lib/indexdb", () => ({
  get: vi.fn(async (key: string) => store.get(key)),
  set: vi.fn(async (key: string, val: unknown) => {
    store.set(key, val);
  }),
}));

import { getPasskey, PasskeyError, registerPasskey } from "./passkey";

const user = { name: "Ada Lovelace", email: "ada@example.com" };
const rawId = new Uint8Array([1, 2, 3]).buffer;

const create = vi.fn<CredentialsContainer["create"]>();

function credential(spki: ArrayBuffer | null) {
  return {
    rawId,
    response: { getPublicKey: () => spki },
  } as unknown as PublicKeyCredential;
}

async function generatedKey() {
  const { publicKey } = await generateKeyPair();
  const encoded = await encodePublicKey(publicKey);
  const spki = new Uint8Array(Buffer.from(encoded, "base64url")).buffer;
  return { publicKey, encoded, spki };
}

async function expectRejection(match: object) {
  const error = await registerPasskey(user).catch((e) => e);
  expect(error).toBeInstanceOf(PasskeyError);
  expect(error).toMatchObject(match);
}

beforeEach(() => {
  store.clear();
  create.mockReset();
  vi.stubGlobal("navigator", { credentials: { create } });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("registerPasskey", () => {
  it("asks for an ES256 resident platform passkey, verified, with the RP ID left to the origin", async () => {
    create.mockResolvedValue(credential((await generatedKey()).spki));

    await registerPasskey(user);

    const options = create.mock.calls[0][0]?.publicKey;
    expect(options).toMatchObject({
      rp: { name: "MetaCensus" },
      user: { name: user.email, displayName: user.name },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        userVerification: "required",
      },
    });
    expect(options?.rp).not.toHaveProperty("id");
    expect(options?.attestation).toBeUndefined();
    expect(options?.user.id).toHaveLength(32);
    expect(options?.challenge).toHaveLength(32);
  });

  it("calls create() before anything awaits, so the page's gesture holds", async () => {
    create.mockResolvedValue(credential((await generatedKey()).spki));

    const registered = registerPasskey(user);

    expect(create).toHaveBeenCalledOnce();
    await registered;
  });

  it("stores only the credential id and the public key that keyId hashes", async () => {
    const { publicKey, encoded, spki } = await generatedKey();
    create.mockResolvedValue(credential(spki));

    await registerPasskey(user);

    const stored = await getPasskey();
    expect(stored).toStrictEqual({ credentialId: rawId, publicKey: encoded });
    expect(await keyId(await decodePublicKey(stored!.publicKey))).toBe(
      await keyId(publicKey)
    );
  });

  it.each([
    ["NotAllowedError", "cancelled"],
    ["InvalidStateError", "failed"],
  ])("maps a %s rejection to %s and stores nothing", async (name, reason) => {
    const cause = new DOMException("no", name);
    create.mockRejectedValue(cause);

    await expectRejection({ reason, cause });
    expect(store.size).toBe(0);
  });

  it.each([
    ["a null result", null],
    ["a credential without a public key", credential(null)],
  ])("rejects failed and stores nothing on %s", async (_, result) => {
    create.mockResolvedValue(result);

    await expectRejection({ reason: "failed" });
    expect(store.size).toBe(0);
  });

    vi.stubGlobal("navigator", {});

    expect(store.size).toBe(0);
  });
});

describe("getPasskey", () => {
  it("resolves undefined on a device without a passkey", async () => {
    await expect(getPasskey()).resolves.toBeUndefined();
  });
});
