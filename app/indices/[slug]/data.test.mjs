import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Keep the repository's existing CommonJS package configuration unchanged.
const source = (await readFile(new URL("./data.js", import.meta.url), "utf8"))
  .replace('import catalogue from "../catalogue.json";', "const catalogue = [];");
const { loadBasketDetail } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
const saved = [{ slug: "basket-one", name: "Saved basket", image: "/art.webp", performance: { value: 99 } }];
const product = {
  slug: "basket-one", name: "Live basket", isActive: true, isPublished: true,
  trading: { state: "open" }, geoStatus: { canView: true, canInvest: true },
  version: { legs: [{ weightBps: 10000 }], minimumInvestment: "50000000", inputToken: { symbol: "USDC", decimals: 6 } },
  performance: { return7d: 0 },
};
const response = (body, status = 200) => async () => ({ ok: status === 200, status, json: async () => body });

test("returns official product weights, minimum and genuine zero return", async () => {
  const result = await loadBasketDetail("basket-one", response(product), saved);
  assert.equal(result.live, true);
  assert.equal(result.product.performance.return7d, 0);
  assert.equal(result.product.version.legs[0].weightBps, 10000);
  assert.equal(result.product.version.minimumInvestment, "50000000");
});

test("rejects invalid slugs before making a request", async () => {
  for (const slug of ["../secrets", "", "a/b", "x?foo=1", null, "x".repeat(121)]) {
    assert.equal(await loadBasketDetail(slug, () => { throw new Error("must not fetch"); }), null);
  }
});

test("does not resurrect removed or restricted products", async () => {
  for (const status of [403, 404, 410]) {
    assert.equal(await loadBasketDetail("basket-one", response({}, status), saved), null);
  }
  for (const overrides of [{ geoStatus: { canView: false } }, { isPublished: false }, { isLabsProduct: true }]) {
    assert.equal(await loadBasketDetail("basket-one", response({ ...product, ...overrides }), saved), null);
  }
});

test("outage fallback has no returns, allocation or trading permission", async () => {
  const result = await loadBasketDetail("basket-one", response({}, 503), saved);
  assert.equal(result.live, false);
  assert.equal(result.product.name, "Saved basket");
  for (const field of ["version", "performance", "trading", "geoStatus"]) assert.equal(result.product[field], null);
  assert.equal(result.product.isActive, false);
});

test("malformed responses fall back safely; unknown slugs do not", async () => {
  assert.equal((await loadBasketDetail("basket-one", response({}), saved)).live, false);
  assert.equal(await loadBasketDetail("unknown-basket", response({}, 503), saved), null);
});

test("uses the public endpoint without sending credentials", async () => {
  await loadBasketDetail("basket-one", async (url, options) => {
    assert.equal(url, "https://api.cesto.co/v1/products/basket-one");
    assert.deepEqual(options.headers, { Accept: "application/json" });
    return { ok: true, status: 200, json: async () => product };
  });
});
