import { createHmac, createPublicKey, randomBytes, timingSafeEqual, verify } from "node:crypto";

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const PROOF_LIFETIME = 5 * 60 * 1000;

function decodeAddress(address) {
  if (typeof address !== "string" || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
    throw new Error("Connect a valid Solana wallet.");
  }
  let value = 0n;
  for (const character of address) value = value * 58n + BigInt(BASE58.indexOf(character));
  const bytes = [];
  while (value) {
    bytes.unshift(Number(value & 255n));
    value >>= 8n;
  }
  for (const character of address) {
    if (character !== "1") break;
    bytes.unshift(0);
  }
  if (bytes.length !== 32) throw new Error("Connect a valid Solana wallet.");
  return Buffer.from(bytes);
}

function proofMessage(payload) {
  return [
    "Oaksoft Capital Management — View Cesto positions",
    "",
    `Website: ${payload.origin}`,
    `Wallet: ${payload.wallet}`,
    "Purpose: Read-only access to your positions and available activity.",
    "This does not authorise a transaction or transfer.",
    `Nonce: ${payload.nonce}`,
    `Issued at: ${new Date(payload.issuedAt).toISOString()}`,
    `Expires at: ${new Date(payload.expiresAt).toISOString()}`,
  ].join("\n");
}

export function createChallenge(wallet, secret, origin, now = Date.now()) {
  decodeAddress(wallet);
  const payload = {
    wallet, origin, issuedAt: now, expiresAt: now + PROOF_LIFETIME,
    nonce: randomBytes(24).toString("base64url"),
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret).update(encoded).digest("base64url");
  return { token: `${encoded}.${mac}`, message: proofMessage(payload), expiresAt: payload.expiresAt };
}

export function verifyProof(proof, secret, origin, now = Date.now()) {
  if (typeof proof?.token !== "string" || proof.token.length > 2048) {
    throw new Error("Verify your wallet to view positions.");
  }
  const [encoded, suppliedMac, extra] = proof.token.split(".");
  if (!encoded || !suppliedMac || extra) throw new Error("Invalid wallet verification.");
  const expectedMac = createHmac("sha256", secret).update(encoded).digest();
  const actualMac = Buffer.from(suppliedMac, "base64url");
  if (actualMac.length !== expectedMac.length || !timingSafeEqual(actualMac, expectedMac)) {
    throw new Error("Invalid wallet verification.");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  if (
    payload.origin !== origin || !Number.isFinite(payload.issuedAt) ||
    !Number.isFinite(payload.expiresAt) || payload.issuedAt > now ||
    payload.expiresAt <= now || payload.expiresAt - payload.issuedAt !== PROOF_LIFETIME
  ) {
    throw new Error("Wallet verification expired. Verify your wallet again.");
  }
  const signature = proof.signature;
  if (!Array.isArray(signature) || signature.length !== 64 ||
    !signature.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
    throw new Error("Invalid wallet signature.");
  }
  const publicKey = createPublicKey({
    key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), decodeAddress(payload.wallet)]),
    format: "der", type: "spki",
  });
  if (!verify(null, Buffer.from(proofMessage(payload)), publicKey, Buffer.from(signature))) {
    throw new Error("Wallet signature could not be verified.");
  }
  return payload.wallet;
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function sumKnown(values) {
  return values.length && values.every((value) => value !== null)
    ? values.reduce((sum, value) => sum + value, 0) : null;
}

function accountData(result) {
  if (!Array.isArray(result?.positions)) throw new Error("Invalid account positions response.");
  const activity = [];
  const positions = [
    ...result.positions.map((position) => ({ position, pending: false })),
    ...(result.pendingClosePositions || []).map((position) => ({ position, pending: true })),
  ].map(({ position, pending }) => {
    if (!position.product?.slug) throw new Error("Invalid position product.");
    const investments = position.investments || [];
    for (const investment of investments) {
      if (investment.openedAt) {
        activity.push({
          id: `${investment.id}-open`, name: position.product.name,
          type: "Investment", status: investment.displayStatus || "Recorded",
          at: investment.openedAt,
        });
      }
      if (investment.closedAt) {
        activity.push({
          id: `${investment.id}-close`, name: position.product.name,
          type: "Close", status: investment.closedReason || "Closed", at: investment.closedAt,
        });
      }
    }
    const buckets = [position.aggregatedData?.live, position.aggregatedData?.partial].filter(Boolean);
    const valueUsd = sumKnown(buckets.map((bucket) => numberOrNull(bucket.totalCurrentValueUsd)));
    const investedUsd = sumKnown(
      investments.filter((investment) => !investment.closedAt).map((investment) => numberOrNull(investment.totalInvestedUsd))
    );
    return {
      id: `account-${position.productId}`, name: position.product.name,
      slug: position.product.slug, image: position.product.logoUrl || null,
      status: pending ? "Closing" : "Open", source: "Cesto account",
      valueUsd, investedUsd,
      pnlUsd: valueUsd !== null && investedUsd !== null ? valueUsd - investedUsd : null,
      holdings: [],
    };
  });
  return { positions, activity };
}

function holdingsData(result, product) {
  if (typeof result?.hasPosition !== "boolean") throw new Error("Invalid holdings response.");
  const execution = result.lastExecution;
  const activity = execution ? [{
    id: `execution-${execution.executionId}`, name: product.name,
    type: execution.type === "OPEN" ? "Investment" : execution.type === "CLOSE" ? "Close" : execution.type,
    status: execution.status, at: execution.completedAt || execution.startedAt,
  }] : [];
  if (!result.hasPosition) return { positions: [], activity };
  const valueUsd = numberOrNull(result.totalValueUsd);
  const investedUsd = numberOrNull(result.investedUsd);
  return {
    positions: [{
      id: `wallet-${result.productId || product.slug}`, name: product.name, slug: product.slug,
      image: product.image, status: "Open", source: "Self-custody",
      valueUsd, investedUsd,
      pnlUsd: numberOrNull(result.pnlUsd) ?? (
        valueUsd !== null && investedUsd !== null ? valueUsd - investedUsd : null
      ),
      holdings: (result.holdings || []).map((holding) => ({
        symbol: holding.symbol, valueUsd: numberOrNull(holding.valueUsd),
        amount: holding.amount, decimals: holding.decimals,
      })),
    }],
    activity,
  };
}

export async function loadPositionData(client, wallet, products) {
  const jobs = [
    { name: "Cesto account", run: async () => accountData(await client.positions.list({ wallet })) },
    ...products.map((product) => ({
      name: product.name,
      run: async () => holdingsData(
        await client.positions.getHoldings({ wallet, product: product.slug }), product
      ),
    })),
  ];
  const results = [];
  const failed = [];
  let next = 0;
  // Bound concurrency: do not fan out a request for every basket simultaneously.
  await Promise.all(Array.from({ length: Math.min(4, jobs.length) }, async () => {
    while (next < jobs.length) {
      const job = jobs[next++];
      try { results.push(await job.run()); }
      catch { failed.push(job.name); }
    }
  }));
  if (!results.length) throw new Error("Cesto positions could not be loaded. Please retry or ask the site owner to check the read-only connection.");
  const warnings = failed.length
    ? [`Could not load ${failed.length} of ${jobs.length} position sources. This view may be incomplete; retry before relying on these balances.`]
    : [];
  const activityById = new Map(results.flatMap((result) => result.activity).map((entry) => [entry.id, entry]));
  return {
    positions: results.flatMap((result) => result.positions),
    activity: [...activityById.values()].sort((a, b) => (Date.parse(b.at) || 0) - (Date.parse(a.at) || 0)),
    warnings, updatedAt: new Date().toISOString(),
  };
}
