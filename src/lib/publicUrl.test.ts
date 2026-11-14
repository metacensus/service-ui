import { describe, expect, it } from "vitest";
import { publicOrigin, publicUrl } from "./publicUrl";

const at = (hostname: string, protocol = "https:", port = "") => ({
  protocol,
  hostname,
  port,
});

describe("publicOrigin", () => {
  it("drops the app. prefix on staging", () => {
    expect(publicOrigin(at("app.staging.example.test"))).toBe(
      "https://staging.example.test"
    );
  });

  it("drops the app. prefix on production", () => {
    expect(publicOrigin(at("app.metacensus.org"))).toBe("https://metacensus.org");
  });

  it("keeps protocol and port", () => {
    expect(publicOrigin(at("app.example.test", "http:", "8080"))).toBe(
      "http://example.test:8080"
    );
  });

  it("falls back to production off an app. host", () => {
    expect(publicOrigin(at("localhost", "http:", "5173"))).toBe(
      "https://metacensus.org"
    );
    expect(publicOrigin(at("staging.example.test"))).toBe(
      "https://metacensus.org"
    );
  });
});

describe("publicUrl", () => {
  it("joins a path", () => {
    expect(publicUrl("/partner", at("app.staging.example.test"))).toBe(
      "https://staging.example.test/partner"
    );
  });
});
