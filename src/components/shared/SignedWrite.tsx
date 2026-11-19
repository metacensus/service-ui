import { PasskeyError } from "@/lib/passkey";
import { ApiError } from "@metacensus/api";

/** Every write is signed, so each is its own passkey prompt. */
export const SignPrompt = ({ action }: { action: string }) => (
  <p className="text-xs text-muted-foreground">
    {action} asks your device for Face ID, Touch ID or your PIN.
  </p>
);

export function signedWriteError(error: unknown): string {
  if (error instanceof PasskeyError) {
    return error.reason === "cancelled"
      ? "The passkey prompt didn't finish. Try again."
      : "Your device couldn't use its passkey.";
  }
  if (error instanceof ApiError) {
    return "We couldn't save this. Check your details and try again.";
  }
  return error instanceof Error
    ? error.message
    : "There was a problem with your request.";
}
