import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const chainRepository = "https://github.com/metacensus/service-api-chain.git";
const chainRevision = "afd8b6336cd7e31f07aab2d12ab2c62ee3117c37";
const fixture = mkdtempSync(join(tmpdir(), "metacensus-browser-"));
const voteResult = join(fixture, "browser-vote-result");
const serviceImage = `metacensus/service-api-chain:e2e-${chainRevision}`;
const chaincodeImage = `metacensus/service-api-chain-chaincode:e2e-${chainRevision}`;

function run(program, args, options) {
  execFileSync(program, args, { cwd: fixture, stdio: "inherit", ...options });
}

try {
  run("git", ["init", "--quiet"]);
  run("git", ["config", "core.autocrlf", "false"]);
  run("git", ["fetch", "--quiet", "--depth=1", chainRepository, chainRevision]);
  run("git", ["checkout", "--quiet", "--detach", chainRevision]);
  run("git", ["apply", "--whitespace=error", fileURLToPath(new URL("./fabric-browser.patch", import.meta.url))]);

  run("docker", ["build", "--target", "service", "-t", serviceImage, "."]);
  run("docker", ["build", "--target", "chaincode", "-t", chaincodeImage, "."]);
  run("go", ["test", "-tags=artifact", "-count=1", "-v", "-timeout=10m", "-run", "^TestImages_Browser$", "./integration"], {
    env: {
      ...process.env,
      SERVICE_IMAGE: serviceImage,
      CHAINCODE_IMAGE: chaincodeImage,
      SPA_ORIGIN: process.env.SPA_ORIGIN || "http://localhost:41731",
      BROWSER_TEST_SCRIPT: fileURLToPath(new URL("./e2e-topic.mjs", import.meta.url)),
      BROWSER_VOTE_RESULT: voteResult,
      BROWSER_PROPOSAL_RESULT: "",
    },
  });
  assert.ok(statSync(voteResult, { throwIfNoEntry: false })?.size, "Chromium did not complete the vote read-back");
} finally {
  rmSync(fixture, { recursive: true, force: true, maxRetries: 3 });
}
