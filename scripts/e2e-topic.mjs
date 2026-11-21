import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { build, preview } from "vite";

const origin = new URL(process.env.SPA_ORIGIN);
assert.equal(origin.href, `http://localhost:${origin.port}/`, "SPA_ORIGIN must be an HTTP localhost origin with an explicit port");
assert.ok(Number(origin.port) > 0, "SPA_ORIGIN needs a fixed port");
assert.ok(process.env.API_PROXY_TARGET, "the chain fixture must supply its API address");
const checkVote = process.argv.includes("--vote");
const refreshOnly = process.argv.includes("--refresh");
const checkProposal = checkVote || process.argv.includes("--proposal");
if (checkProposal) assert.ok(process.env.PROVISION_TOPIC_URL, "the proposal test needs the chain fixture's provisioner");
process.chdir(fileURLToPath(new URL("../", import.meta.url)));

async function createAccountAndLogIn(page) {
  const email = `topic-${randomUUID()}@example.test`;
  const password = randomUUID().replace(/(.)\1{2,}/g, "$1$1") + "!Aa1";
  await page.goto(new URL("/sign-up", origin).href);
  await page.locator("input[name=name]").fill("Browser Tester");
  await page.locator("input[name=email]").fill(email);
  await page.getByRole("combobox").selectOption("US");
  await page.locator("input[name=password]").fill(password);
  await page.locator("input[name=passwordConfirmation]").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Register", exact: true }).click();
  try {
    await page.waitForURL("**/dashboard");
  } catch (error) {
    const notices = await page.locator('[role="alert"], [role="status"]').allTextContents();
    throw new Error("Sign-up failed. " + notices.join(" "), { cause: error });
  }
  await page.getByRole("button", { name: "Log out" }).click();
  await page.waitForURL("**/log-in");
  await page.reload();
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(password);
  const selfURL = new URL("/metacensus/api/v1/self", origin);
  const [selfResponse] = await Promise.all([
    page.waitForResponse(response => response.url() === selfURL.href && response.status() === 200),
    page.getByRole("button", { name: "Log in", exact: true }).click(),
  ]);
  await page.waitForURL("**/dashboard");
  const self = await selfResponse.json();
  assert.equal(self.content.email, email);
  assert.ok(self.id, "the logged-in user must have an ID");
  return self.id;
}

function parseRefreshPayload(text) {
  try {
    return JSON.parse(text);
  } catch {
    // Parser diagnostics can include fragments of a credential-bearing payload.
    throw new Error("Invalid JSON in the refresh exchange");
  }
}

async function checkReload(page, userBeforeReload) {
  const refreshURL = new URL("/metacensus/api/v1/refresh", origin).href;
  const selfURL = new URL("/metacensus/api/v1/self", origin).href;
  const [refresh, self] = await Promise.all([
    page.waitForRequest(req => req.method() === "POST" && req.url() === refreshURL),
    page.waitForRequest(req => req.method() === "GET" && req.url() === selfURL),
    page.reload(),
  ]);
  const cookieSent = /(?:^|;\s*)mc_refresh=[^;\s]+/.test(await refresh.headerValue("cookie") ?? "");
  assert.ok(cookieSent, "reload must send mc_refresh on the refresh request");
  const body = parseRefreshPayload(refresh.postData() || "{}");
  assert.ok(!body?.refreshToken && !body?.refresh_token, "refresh must use the cookie as its credential");
  const refreshed = await refresh.response();
  assert.equal(refreshed?.status(), 200, "the real API must accept the refresh");
  const session = parseRefreshPayload(await refreshed.text());
  assert.ok(session.token && await self.headerValue("authorization") === `Bearer ${session.token}`,
    "the post-reload identity request must use the refreshed access token");
  const identified = await self.response();
  assert.equal(identified?.status(), 200, "the real API must identify the restored session");
  const userAfterReload = (await identified.json()).id;
  assert.equal(userAfterReload, userBeforeReload);
  await page.getByRole("button", { name: "Log out", exact: true }).waitFor();
  assert.equal(page.url(), new URL("/dashboard", origin).href);
  console.log(JSON.stringify({ refreshCookieSent: cookieSent, refreshStatus: refreshed.status(),
    selfStatus: identified.status(), userBeforeReload, userAfterReload, page: page.url() }));
}

async function submitSignedRecord(page, credential, { path, notice, button, content }) {
  const dialog = page.getByRole("dialog");
  await dialog.getByText(notice, { exact: true }).waitFor();
  const before = await credential();
  const createURL = new URL(path, origin);
  const voteList = path.endsWith("/vote");
  const [created] = await Promise.all([
    page.waitForResponse((response) => response.url() === createURL.href && response.request().method() === "POST"),
    dialog.getByRole("button", { name: button, exact: true }).click(),
  ]);
  assert.equal(created.status(), 200, `POST ${path} failed`);
  const record = await created.json();
  if (!voteList) assert.ok(record.id, "creation must return the minted ID");
  const authorization = await created.request().headerValue("authorization");
  assert.ok(authorization, "creation must use the logged-in session");
  await dialog.waitFor({ state: "hidden" });

  const readPath = voteList ? path : path + "/" + encodeURIComponent(record.id);
  const readURL = new URL(readPath, process.env.API_PROXY_TARGET);
  const read = await page.request.get(readURL.href, { headers: { authorization }, maxRedirects: 0 });
  assert.equal(read.status(), 200, `GET ${readURL.pathname} failed`);
  const body = await read.json();
  if (voteList) assert.equal(body.items.length, 1, "the fresh proposal must have exactly one vote");
  const stored = voteList ? body.items[0] : body;
  assert.deepEqual(stored, record, "the direct chain read must return the record just written");
  assert.deepEqual(stored.userSignature.assertion, created.request().postDataJSON().userSignature.assertion);
  assert.partialDeepStrictEqual(stored.content, content);
  const after = await credential();
  assert.equal(after.credentialId, before.credentialId);
  assert.equal(after.signCount - before.signCount, 1, "one submit must produce exactly one passkey assertion");
  // WebAuthn puts the four-byte signature counter after the RP ID hash and flags.
  const authData = Buffer.from(stored.userSignature.assertion.authenticatorData, "base64url");
  const ledgerCount = authData.readUInt32BE(33);
  assert.equal(ledgerCount, after.signCount, "ledger signature must match the submitted assertion counter");
  return {
    id: stored.id, content: stored.content, signingNoticeVisible: true,
    beforeCount: before.signCount, afterCount: after.signCount, ledgerCount,
    createStatus: created.status(), readStatus: read.status(),
  };
}

async function checkWrites(browser) {
  const page = await browser.newPage();
  page.setDefaultTimeout(30_000);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.enable");
  const { authenticatorId } = await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  });
  const userId = await createAccountAndLogIn(page);
  if (refreshOnly || checkVote) await checkReload(page, userId);
  if (refreshOnly) {
    if (process.env.BROWSER_REFRESH_RESULT) {
      await writeFile(process.env.BROWSER_REFRESH_RESULT, userId, { flag: "wx" });
    }
    return;
  }
  await page.getByRole("link", { name: "Topics", exact: true }).first().click();
  await page.getByRole("button", { name: "Create Topic" }).click();
  const dialog = page.getByRole("dialog");
  const name = `Browser topic ${randomUUID()}`;
  const description = "Topic signed in Chromium and read back from Fabric.";
  await dialog.getByLabel("Topic Name").fill(name);
  await dialog.getByLabel("Topic Description").fill(description);

  async function credential() {
    const { credentials } = await cdp.send("WebAuthn.getCredentials", { authenticatorId });
    assert.equal(credentials.length, 1, "sign-up must register one credential");
    return credentials[0];
  }
  const topicPath = "/metacensus/api/v1/topic";
  const topic = await submitSignedRecord(page, credential, {
    path: topicPath, notice: "Creating a topic asks your device for Face ID, Touch ID or your PIN.",
    button: "Create Topic", content: { name, description },
  });
  console.log(JSON.stringify({ chromium: browser.version(), origin: origin.origin, topic }));
  if (!checkProposal) return;

  const topicID = encodeURIComponent(topic.id);
  const provisioned = await fetch(process.env.PROVISION_TOPIC_URL + "/" + topicID, { method: "PUT", redirect: "error" });
  const channel = await provisioned.text();
  assert.equal(provisioned.status, 200, `provision topic channel: ${channel}`);
  await page.goto(new URL(`/topics/${topicID}/topic-consensus-statements`, origin).href);
  await page.getByRole("button", { name: "Create Consensus Statement", exact: true }).click();
  const statement = "Review the evidence for this topic.";
  await dialog.getByLabel("Consensus Statement", { exact: true }).fill(statement);
  const proposal = await submitSignedRecord(page, credential, {
    path: `${topicPath}/${topicID}/prop`, notice: "Proposing a statement asks your device for Face ID, Touch ID or your PIN.",
    button: "Submit", content: { topicId: topic.id, type: "Statement", description: statement },
  });
  console.log(JSON.stringify({ channel, proposal }));
  if (process.env.BROWSER_PROPOSAL_RESULT) {
    await writeFile(process.env.BROWSER_PROPOSAL_RESULT, proposal.id, { flag: "wx" });
  }
  if (!checkVote) return;

  const row = page.getByRole("row").filter({ has: page.getByText(statement, { exact: true }) });
  await row.getByRole("button", { name: "Vote", exact: true }).click();
  await dialog.getByLabel("Toggle accept").click();
  const explanation = "I support this statement.";
  await dialog.getByPlaceholder("Comment on Vote").fill(explanation);
  const vote = await submitSignedRecord(page, credential, {
    path: `${topicPath}/${topicID}/prop/${encodeURIComponent(proposal.id)}/vote`,
    notice: "Casting a vote asks your device for Face ID, Touch ID or your PIN.",
    button: "Cast Vote",
    content: { topicId: topic.id, propId: proposal.id, userId, position: "For", explanation },
  });
  console.log(JSON.stringify({ channel, vote }));
  if (process.env.BROWSER_VOTE_RESULT) {
    await writeFile(process.env.BROWSER_VOTE_RESULT, vote.content.userId, { flag: "wx" });
  }
}

await build({ logLevel: "warn" });
const server = await preview({
  preview: { host: origin.hostname, port: Number(origin.port), strictPort: true, open: false },
});
try {
  const browser = await chromium.launch();
  try {
    await checkWrites(browser);
  } finally {
    await browser.close();
  }
} finally {
  await server.close();
}
