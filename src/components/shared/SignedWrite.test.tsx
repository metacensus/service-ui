import { ApiError } from "@metacensus/api";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PasskeyError } from "@/lib/passkey";
import { SignPrompt, signedWriteError } from "./SignedWrite";

describe("SignPrompt", () => {
  it("names the prompt the write raises", () => {
    expect(renderToStaticMarkup(<SignPrompt action="Creating a topic" />)).toContain(
      "Creating a topic asks your device for Face ID, Touch ID or your PIN."
    );
  });
});

describe("signedWriteError", () => {
  it("tells a cancelled prompt from a failed passkey", () => {
    expect(signedWriteError(new PasskeyError("cancelled"))).toMatch(/didn't finish/);
    expect(signedWriteError(new PasskeyError("failed"))).toMatch(/couldn't use its passkey/);
  });

  it("does not show the server's body", () => {
    const error = new ApiError("POST", "/topic", 400, "pq: violates constraint");
    expect(signedWriteError(error)).not.toContain("pq:");
  });
});
