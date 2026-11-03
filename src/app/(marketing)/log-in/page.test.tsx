import { RouterProvider, createMemoryHistory } from "@tanstack/react-router";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LOGIN_PATH } from "@/lib/session";
import { router } from "@/router";

describe(LOGIN_PATH, () => {
  it("links to sign-up, with no closed-beta or invitation copy", async () => {
    router.update({ ...router.options, history: createMemoryHistory({ initialEntries: [LOGIN_PATH] }) });
    await router.load();
    const markup = renderToString(<RouterProvider router={router} />);

    expect(markup).toContain('href="/sign-up"');
    expect(markup).not.toContain("closed beta");
    expect(markup).not.toMatch(/invit/i);
  });
});
