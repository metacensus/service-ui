import { getDocument } from "pdfjs-dist";

// Every PDF this app opens is untrusted input, so pdf.js must never compile
// code from one. Open documents through here, never with getDocument directly.
export function openPdf(url: string) {
  return getDocument({ url, isEvalSupported: false });
}
