import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { del, render } = vi.hoisted(() => ({ del: vi.fn(), render: vi.fn() }));
vi.mock("@/lib/indexdb", () => ({ del }));
vi.mock("react-dom/client", () => ({ default: { createRoot: () => ({ render }) } }));
vi.mock("./router", () => ({ router: {} }));

const store = new Map<string, unknown>();

beforeEach(() => {
  del.mockImplementation(async (key: string) => {
    store.delete(key);
  });
  vi.stubGlobal("document", { getElementById: () => null });
});

afterEach(() => {
  store.clear();
  render.mockClear();
  vi.unstubAllGlobals();
  vi.resetModules();
});

  await import("./main");

  expect([...store.keys()]).toStrictEqual(["passkey", "recentlyViewedTopics"]);
});

it("starts the app when the delete fails", async () => {
  del.mockRejectedValue(new Error("blocked"));

  await import("./main");

  expect(render).toHaveBeenCalledOnce();
});

it("renders before the delete settles", async () => {
  del.mockReturnValue(new Promise(() => {}));

  await import("./main");

  expect(render).toHaveBeenCalledOnce();
});
