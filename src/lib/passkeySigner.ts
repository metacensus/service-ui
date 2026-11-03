import type { Signer } from "@metacensus/api";
import {
  decodePublicKey,
  interpretation,
  keyId,
  userChallenge,
} from "@metacensus/api/signing";

import { getPasskey, passkeyCeremony, PasskeyError } from "@/lib/passkey";

const base64url = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

export const passkeySigner: Signer = async (content, contentType) => {
  const passkey = await getPasskey();
  if (!passkey) throw new PasskeyError("failed");

  const interp = interpretation(contentType);
  const kid = await keyId(await decodePublicKey(passkey.publicKey));
  // Whole seconds: the server re-emits `time` through protojson, which drops a
  // `.000` and breaks the digest (metacensus/api#109).
  const time = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const challenge = await userChallenge(content, interp, kid, time);

  const credential = await passkeyCeremony(() =>
    navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [{ type: "public-key", id: passkey.credentialId }],
        userVerification: "required",
      },
    })
  );
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    interpretation: interp,
    publicKey: passkey.publicKey,
    signature: {
      keyId: kid,
      time,
      assertion: {
        authenticatorData: base64url(response.authenticatorData),
        clientDataJson: base64url(response.clientDataJSON),
        signature: base64url(response.signature),
      },
    },
  };
};
