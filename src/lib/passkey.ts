import { encodePublicKey } from "@metacensus/api/signing";
import { get, set } from "@/lib/indexdb";

const STORE_KEY = "passkey";

export interface Passkey {
  credentialId: ArrayBuffer;
  publicKey: string;
}

export class PasskeyError extends Error {
  constructor(
    options?: ErrorOptions
  ) {
    super(`Passkey ${reason}`, options);
    this.name = "PasskeyError";
  }
}

/**
 * `call` runs before the first await, so it keeps the page's user gesture.
 * WebAuthn's NotAllowedError covers a cancel, a timeout and a lost gesture alike.
 */
export async function passkeyCeremony(
  call: () => Promise<Credential | null>
): Promise<PublicKeyCredential> {
  let credential: Credential | null;
  try {
    credential = await call();
  } catch (cause) {
    const cancelled =
      cause instanceof DOMException && cause.name === "NotAllowedError";
    throw new PasskeyError(cancelled ? "cancelled" : "failed", { cause });
  }
  if (!credential) throw new PasskeyError("failed");
  return credential as PublicKeyCredential;
}

const randomBytes = () => crypto.getRandomValues(new Uint8Array(32));

export async function registerPasskey(user: {
  name: string;
  email: string;
}): Promise<void> {
  const credential = await passkeyCeremony(() =>
    navigator.credentials.create({
      publicKey: {
        rp: { name: "MetaCensus" },
        // Nothing reads the handle or verifies this response: signUp proves
        // possession with an assertion, so both are random and unstored.
        user: {
          id: randomBytes(),
          name: user.email,
          displayName: user.name,
        },
        challenge: randomBytes(),
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          residentKey: "required",
          userVerification: "required",
        },
      },
    })
  );

  const response = credential.response as AuthenticatorAttestationResponse;
  const spki = response.getPublicKey();
  if (!spki) throw new PasskeyError("failed");

  const publicKey = await crypto.subtle.importKey(
    "spki",
    spki,
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"]
  );
  await set<Passkey>(STORE_KEY, {
    credentialId: credential.rawId,
    publicKey: await encodePublicKey(publicKey),
  });
}

export function getPasskey(): Promise<Passkey | undefined> {
  return get<Passkey>(STORE_KEY);
}
