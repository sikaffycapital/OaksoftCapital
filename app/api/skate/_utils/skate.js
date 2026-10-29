// app/api/skate/_utils/skate.js
// Server-only helpers for the Skate AMM widget.
// The Skate SDK runs here (not in the browser) so the client bundle stays light
// and calls to Skate's API never hit CORS.

import {
  SkateAmmCoreSDK,
  VM,
  vmTypeFromChain,
  PeripheryPool_ABI,
} from "@skate-org/skate-app-amm";
import { decodeAbiParameters, decodeFunctionData, erc20Abi, isAddress, pad, getAddress, parseAbiParameters } from "viem";

// "PRODUCTION" = mainnet. Set SKATE_ENV=STAGING to point at Skate's testnet.
export const SKATE_ENV = process.env.SKATE_ENV === "STAGING" ? "STAGING" : "PRODUCTION";
export const sdk = new SkateAmmCoreSDK(SKATE_ENV);

// Skate's live app calls api.skatechain.org/amm-action-v2 (checked Oct 29, 2026).
// The hosts baked into SDK v3.7.2 (api.amm.skatechain.org, hub.skatechain.org/amm) did not respond.
// Override with SKATE_API_URL if Skate moves it again.
const SKATE_API_URLS = [
  process.env.SKATE_API_URL || "https://api.skatechain.org/amm-action-v2",
  "https://api.amm.skatechain.org",
  "https://hub.skatechain.org/amm",
];

/** GET a Skate AMM API path, trying each known host. Returns parsed JSON or null. */
export async function skateApi(path) {
  for (const base of SKATE_API_URLS) {
    try {
      const r = await fetch(`${base}/${path}`, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      const body = await r.json().catch(() => null);
      if (body && typeof body === "object" && "success" in body) return body;
    } catch {
      /* try next host */
    }
  }
  return null;
}

const lower = (a) => String(a || "").toLowerCase();

/** Every EVM periphery pool Skate has deployed, flattened for the UI. */
export function listEvmPools() {
  const all = sdk.getAllPoolInfo();
  const pools = [];
  for (const [poolKey, pool] of Object.entries(all)) {
    for (const [cid, per] of Object.entries(pool.peripheryInfo)) {
      const chainId = Number(cid);
      if (vmTypeFromChain(chainId) !== VM.EVM) continue;
      const tok = (t) => ({
        address: getAddress(t.address),
        symbol: t.symbol,
        decimals: t.decimal,
      });
      pools.push({
        poolKey,
        feeBps: pool.feeBps,
        chainId,
        chain: per.chain,
        poolAddress: getAddress(per.address),
        token0: tok(per.token0),
        token1: tok(per.token1),
      });
    }
  }
  return pools;
}

/** Find the periphery pool for a token pair on a chain. */
export function findPool(chainId, tokenIn, tokenOut) {
  return (
    listEvmPools().find((p) => {
      if (p.chainId !== chainId) return false;
      const set = [lower(p.token0.address), lower(p.token1.address)];
      return set.includes(lower(tokenIn)) && set.includes(lower(tokenOut)) && lower(tokenIn) !== lower(tokenOut);
    }) || null
  );
}

/** Does the same Skate pool also exist on the destination chain? */
export function poolExistsOnChain(poolKey, chainId) {
  return listEvmPools().some((p) => p.poolKey === poolKey && p.chainId === chainId);
}

export function isEvmAddress(a) {
  // Format check only; getAddress() normalizes casing before use.
  return typeof a === "string" && isAddress(a, { strict: false });
}

/**
 * Defense in depth: never pass Skate API calldata to a user's wallet without
 * checking it matches what the user asked for.
 *  - swap must target the known periphery pool, pay the user, spend exactly amountIn,
 *    settle on the chain the user picked, and carry price protection
 *  - approval (if any) must be on tokenIn and name the pool as spender
 */
export function verifyEvmQuote({ payload, pool, tokenIn, user, amountIn, destChainId }) {
  const problems = [];
  const swapCall = payload?.swapCall;

  if (!swapCall?.target || !swapCall?.calldata) {
    problems.push("Quote has no swap transaction");
  } else {
    if (lower(swapCall.target) !== lower(pool.poolAddress)) {
      problems.push("Swap target is not the known Skate pool");
    }
    try {
      const { functionName, args } = decodeFunctionData({ abi: PeripheryPool_ABI, data: swapCall.calldata });
      if (functionName !== "swap") problems.push(`Unexpected function: ${functionName}`);
      const [recipient, zeroForOne, amountSpecified, sqrtPriceLimitX96, extraData] = args;
      if (lower(recipient) !== lower(pad(user, { size: 32 }))) problems.push("Swap recipient is not your wallet");
      const expectZeroForOne = lower(tokenIn) === lower(pool.token0.address);
      if (Boolean(zeroForOne) !== expectZeroForOne) problems.push("Swap direction mismatch");
      if (BigInt(amountSpecified) !== BigInt(amountIn)) problems.push("Swap amount mismatch");

      // extraData = (minAmountOut, destChainId, destVmType, deadline) per Skate SDK
      const [minAmountOut, destChain, destVm] = decodeAbiParameters(
        parseAbiParameters("uint256,uint256,uint256,uint256"),
        extraData
      );
      if (Number(destChain) !== Number(destChainId)) problems.push("Settlement chain is not the one you picked");
      if (Number(destVm) !== VM.EVM) problems.push("Settlement VM is not EVM");
      if (minAmountOut === 0n && BigInt(sqrtPriceLimitX96) === 0n) problems.push("Swap has no price protection");
    } catch (e) {
      problems.push("Could not decode swap calldata");
    }
  }

  // Spender for the approval step. Default: the pool itself.
  let spender = pool.poolAddress;
  const approvalCall = payload?.approvalCall;
  if (approvalCall?.calldata) {
    if (lower(approvalCall.target) !== lower(tokenIn)) {
      problems.push("Approval is not on the token you are paying with");
    }
    try {
      const { functionName, args } = decodeFunctionData({ abi: erc20Abi, data: approvalCall.calldata });
      if (functionName !== "approve") problems.push("Approval call is not an ERC-20 approve");
      else if (lower(args[0]) !== lower(pool.poolAddress)) problems.push("Approval spender is not the Skate pool");
      else spender = getAddress(args[0]);
    } catch (e) {
      problems.push("Could not decode approval calldata");
    }
  }

  return { ok: problems.length === 0, problems, spender };
}

export function json(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: { "Cache-Control": "no-store", ...(init.headers || {}) },
  });
}
