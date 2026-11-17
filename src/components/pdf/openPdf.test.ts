import { expect, it, vi } from "vitest";

const { getDocument } = vi.hoisted(() => ({ getDocument: vi.fn() }));
vi.mock("pdfjs-dist", () => ({ getDocument }));

import { openPdf } from "./openPdf";

it("opens a PDF with eval disabled", () => {
  openPdf("/papers/p.pdf");

  expect(getDocument).toHaveBeenCalledWith({
    url: "/papers/p.pdf",
    isEvalSupported: false,
  });
});
