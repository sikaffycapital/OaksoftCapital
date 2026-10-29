// GET /api/skate/quote?chainId&tokenIn&tokenOut&amount&user&slippage[&destChainId]
// Proxies Skate's swap quote and verifies the returned transactions.

import { getAddress } from "viem";
import { skateApi, findPool, poolExistsOnChain, isEvmAddress, verifyEvmQuote, json } from "../_utils/skate";

export const dynamic = "force-dynamic";

const MAX_SLIPPAGE = 0.05; // 5% hard cap

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const chainId = Number(q.get("chainId"));
  const destChainId = q.get("destChainId") ? Number(q.get("destChainId")) : chainId;
  const tokenIn = q.get("tokenIn");
  const tokenOut = q.get("tokenOut");
  const amount = q.get("amount");
  const user = q.get("user");
  const slippage = Number(q.get("slippage") ?? "0.005");

  // --- validate input ---
  if (!Number.isInteger(chainId) || !Number.isInteger(destChainId)) return json({ ok: false, error: "Bad chain id" }, { status: 400 });
  if (!isEvmAddress(tokenIn) || !isEvmAddress(tokenOut) || !isEvmAddress(user)) return json({ ok: false, error: "Bad address" }, { status: 400 });
  if (!/^\d+$/.test(amount || "") || BigInt(amount) <= 0n) return json({ ok: false, error: "Bad amount" }, { status: 400 });
  if (!(slippage > 0 && slippage <= MAX_SLIPPAGE)) return json({ ok: false, error: "Slippage must be between 0 and 5%" }, { status: 400 });

  const pool = findPool(chainId, tokenIn, tokenOut);
  if (!pool) return json({ ok: false, error: "No Skate pool for this pair on this chain" }, { status: 404 });
  if (destChainId !== chainId && !poolExistsOnChain(pool.poolKey, destChainId)) {
    return json({ ok: false, error: "Pool not available on the destination chain" }, { status: 400 });
  }

  // --- fetch quote from Skate (same query shape as the SDK's apiGetSwapQuote) ---
  const qs = new URLSearchParams({
    tokenA: getAddress(tokenIn),
    tokenB: getAddress(tokenOut),
    amount: BigInt(amount).toString(10),
    chainId: String(chainId),
    user: getAddress(user),
    recipient: getAddress(user),
    slippageLimit: String(slippage),
  });
  if (destChainId !== chainId) qs.set("destChainId", String(destChainId));

  const res = await skateApi(`quote/swap?${qs}`);
  if (!res) return json({ ok: false, error: "Skate quote service unreachable" }, { status: 502 });

  const payload = res.data;
  if (!res.success || !payload?.swapQuote) {
    // e.g. "Insufficient liquidity for swap", "Exceeded slippage limit"
    return json({ ok: false, error: res.message || "No quote available" });
  }

  const sq = payload.swapQuote;
  const base = {
    pool,
    destChainId,
    expectedAmountOut: sq.expectedAmountOut,
    expectedAmountUnused: sq.expectedAmountUnUsed,
    expectedSlippage: sq.expectedSlippage,
    tokenIn: { address: getAddress(payload.tokenIn.address), symbol: payload.tokenIn.symbol, decimals: payload.tokenIn.decimal },
    tokenOut: { address: getAddress(payload.tokenOut.address), symbol: payload.tokenOut.symbol, decimals: payload.tokenOut.decimal },
  };

  if (!sq.success) {
    return json({ ok: false, ...base, code: sq.code, error: sq.failedReason || "Quote failed" });
  }

  // --- verify calldata before it ever reaches the wallet ---
  const check = verifyEvmQuote({ payload, pool, tokenIn, user, amountIn: amount, destChainId });
  if (!check.ok) {
    console.error("[skate/quote] verification failed", check.problems);
    return json({ ok: false, ...base, error: "Quote failed safety checks", problems: check.problems }, { status: 502 });
  }

  return json({
    ok: true,
    ...base,
    spender: check.spender,
    swapTx: { to: getAddress(payload.swapCall.target), data: payload.swapCall.calldata },
  });
}
