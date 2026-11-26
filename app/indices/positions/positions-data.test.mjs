import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFile } from "node:fs/promises";

// The project intentionally keeps its original package.json module settings.
const source = await readFile(new URL("./positions-data.js", import.meta.url), "utf8");
const { createChallenge, verifyProof, loadPositionData } = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function base58(bytes) {
  let number = BigInt(`0x${bytes.toString("hex")}`);
  let encoded = "";
  while (number) {
    encoded = alphabet[Number(number % 58n)] + encoded;
    number /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    encoded = `1${encoded}`;
  }
  return encoded;
}
const keys = generateKeyPairSync("ed25519");
const wallet = base58(keys.publicKey.export({ type: "spki", format: "der" }).subarray(-32));
const origin = "https://positions.example";
const secret = "unit-test-only-not-a-real-credential";
const now = 1700000000000;
const challenge = createChallenge(wallet, secret, origin, now);
const proof = { token: challenge.token, signature: [...sign(null, Buffer.from(challenge.message), keys.privateKey)] };

test("authenticates the wallet that signed a read-only challenge", () => {
  assert.equal(verifyProof(proof, secret, origin, now + 1000), wallet);
  assert.match(challenge.message, /does not authorise a transaction/);
  assert.equal(challenge.expiresAt, now + 300000);
});
test("rejects unsigned, malformed, altered and wrong-wallet proofs", () => {
  const otherKeys = generateKeyPairSync("ed25519");
  for (const invalid of [
    null, { token: "invalid", signature: [] },
    { ...proof, signature: Array(64).fill(0) },
    { ...proof, signature: [...sign(null, Buffer.from(challenge.message), otherKeys.privateKey)] },
    { ...proof, token: `${proof.token}tampered` },
    { ...proof, signature: Array(64).fill(-1) },
  ]) assert.throws(() => verifyProof(invalid, secret, origin, now + 1000));
});
test("rejects expired, future-issued, cross-origin and incorrectly signed tokens", () => {
  assert.throws(() => verifyProof(proof, secret, origin, challenge.expiresAt));
  assert.throws(() => verifyProof(proof, secret, origin, now - 1));
  assert.throws(() => verifyProof(proof, secret, "https://other.example", now + 1));
  assert.throws(() => verifyProof(proof, "incorrect-test-key", origin, now + 1));
});
test("validates Solana addresses and supports leading zero bytes", () => {
  assert.throws(() => createChallenge("not-a-wallet", secret, origin, now));
  assert.throws(() => createChallenge("1".repeat(33), secret, origin, now));
  assert.ok(createChallenge("1".repeat(32), secret, origin, now).token);
});

const products = [{ slug: "test-basket", name: "Test basket", image: null }];
const emptyAccount = { positions: [], pendingClosePositions: [] };
const emptyHoldings = { hasPosition: false, lastExecution: null };

test("reports an empty portfolio only after successful reads of both position types", async () => {
  const result = await loadPositionData({ positions: {
    list: async () => emptyAccount, getHoldings: async () => emptyHoldings,
  } }, wallet, products);
  assert.deepEqual(result.positions, []);
  assert.deepEqual(result.warnings, []);
});
test("keeps missing data distinct from real zero balances and reads SDK holdings", async () => {
  const result = await loadPositionData({ positions: {
    list: async () => emptyAccount,
    getHoldings: async () => ({
      hasPosition: true, totalValueUsd: 0, productId: "product",
      holdings: [{ symbol: "TEST", amount: "1000000", decimals: 6, valueUsd: 0 }],
      lastExecution: { executionId: "execution", type: "OPEN", status: "COMPLETED", startedAt: "2024-01-01" },
    }),
  } }, wallet, products);
  assert.equal(result.positions[0].valueUsd, 0);
  assert.equal(result.positions[0].investedUsd, null);
  assert.equal(result.positions[0].pnlUsd, null);
  assert.equal(result.positions[0].holdings[0].amount, "1000000");
  assert.equal(result.activity[0].type, "Investment");
});
test("combines account valuations without treating unavailable buckets as zero", async () => {
  const product = { id: "account", slug: "test-basket", name: "Test basket" };
  const result = await loadPositionData({ positions: {
    list: async () => ({ positions: [{
      productId: "account", product, aggregatedData: { live: { totalCurrentValueUsd: "125" } },
      investments: [{ id: "investment", totalInvestedUsd: "100", openedAt: "2024-01-01" }],
    }], pendingClosePositions: [{
      productId: "pending", product, aggregatedData: null, investments: [],
    }] }),
    getHoldings: async () => emptyHoldings,
  } }, wallet, products);
  assert.equal(result.positions[0].pnlUsd, 25);
  assert.equal(result.positions[1].status, "Closing");
  assert.equal(result.positions[1].valueUsd, null);
});
test("warns on partial failure and fails explicitly if every source fails", async () => {
  const failure = async () => { throw new Error("Test API unavailable"); };
  const partial = await loadPositionData({ positions: {
    list: failure, getHoldings: async () => emptyHoldings,
  } }, wallet, products);
  assert.equal(partial.positions.length, 0);
  assert.equal(partial.warnings.length, 1);
  await assert.rejects(loadPositionData({ positions: { list: failure, getHoldings: failure } }, wallet, products));
});
test("treats malformed responses as unreadable, not an empty portfolio", async () => {
  await assert.rejects(loadPositionData({ positions: {
    list: async () => ({}), getHoldings: async () => ({}),
  } }, wallet, products));
});
test("bounds API concurrency", async () => {
  let active = 0;
  let maximum = 0;
  const pause = async (response) => {
    active++;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 2));
    active--;
    return response;
  };
  await loadPositionData({ positions: {
    list: () => pause(emptyAccount), getHoldings: () => pause(emptyHoldings),
  } }, wallet, Array.from({ length: 12 }, (_, index) => ({ ...products[0], slug: `basket-${index}` })));
  assert.equal(maximum, 4);
});
