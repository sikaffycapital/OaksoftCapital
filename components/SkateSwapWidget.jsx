// components/SkateSwapWidget.jsx
// White-label swap widget on Skate AMM (one shared liquidity pool across chains).
// Users trade from their own wallet; Oaksoft never holds funds.
//
// Flow: quote (/api/skate/quote, verified server-side) -> approve exact amount (if needed)
//       -> swap tx on the source chain -> track settlement (/api/skate/status).
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useConfig, useReadContract } from "wagmi";
import { readContract, sendTransaction, switchChain, waitForTransactionReceipt, writeContract } from "wagmi/actions";
import { useAppKit } from "@reown/appkit/react";
import { erc20Abi, formatUnits, parseUnits } from "viem";

const PREVIEW_USER = "0x000000000000000000000000000000000000dEaD"; // quote preview before wallet connects
const SLIPPAGE_OPTIONS = [0.001, 0.005, 0.01];
const QUOTE_DEBOUNCE_MS = 450;
const QUOTE_REFRESH_MS = 20_000;
const STATUS_POLL_MS = 4_000;
const STATUS_TIMEOUT_MS = 15 * 60_000;
// Tokens that require allowance reset to 0 before a new approve (USDT on Ethereum).
const ZERO_RESET_TOKENS = new Set(["1:0xdac17f958d2ee523a2206206994597c13d831ec7"]);

const lower = (a) => String(a || "").toLowerCase();
const same = (a, b) => lower(a) === lower(b);

function fmt(raw, decimals, max = 6) {
  if (raw === undefined || raw === null) return "";
  const s = formatUnits(BigInt(raw), decimals);
  const [i, d = ""] = s.split(".");
  const dec = d.slice(0, max).replace(/0+$/, "");
  return dec ? `${Number(i).toLocaleString("en-US")}.${dec}` : Number(i).toLocaleString("en-US");
}

function shortError(e) {
  const msg = e?.shortMessage || e?.message || String(e);
  if (/user rejected|denied|rejected the request/i.test(msg)) return "Transaction rejected in wallet";
  return msg.length > 160 ? msg.slice(0, 157) + "…" : msg;
}

function TokenSelect({ value, tokens, onChange, disabled }) {
  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || !tokens.length}
      className="shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white outline-none hover:bg-white/15 disabled:opacity-50"
    >
      {tokens.map((t) => (
        <option key={t.address} value={t.address} className="bg-[#1F2937]">
          {t.symbol}
        </option>
      ))}
    </select>
  );
}

function ChainSelect({ value, chains, onChange, disabled, label }) {
  return (
    <label className="flex items-center gap-2 text-xs text-white/60">
      {label}
      <select
        value={value || ""}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={disabled || chains.length < 2}
        className="rounded-lg bg-white/5 px-2 py-1 text-xs font-medium text-white outline-none hover:bg-white/10 disabled:opacity-70"
      >
        {chains.map((c) => (
          <option key={c.id} value={c.id} className="bg-[#1F2937]">
            {c.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function SkateSwapWidget({
  defaultChainId = 8453, // Base
  onSellTokenChange,
  onBuyTokenChange,
  title = "Cross-chain swap",
  showPoweredBy = true,
}) {
  const config = useConfig();
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { open } = useAppKit();

  // ---------- pools ----------
  const [pools, setPools] = useState([]);
  const [paused, setPaused] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/skate/pools")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setPools(d.pools || []);
        setPaused(Boolean(d.paused));
      })
      .catch(() => alive && setLoadError("Could not load Skate pools"));
    return () => {
      alive = false;
    };
  }, []);

  // Only chains that both Skate and this app's wallet config support.
  const chainById = useMemo(() => new Map(config.chains.map((c) => [c.id, c])), [config.chains]);
  const usablePools = useMemo(() => pools.filter((p) => chainById.has(p.chainId)), [pools, chainById]);
  const srcChains = useMemo(() => {
    const ids = [...new Set(usablePools.map((p) => p.chainId))];
    return ids.map((id) => chainById.get(id));
  }, [usablePools, chainById]);

  // ---------- selection ----------
  const [chainId, setChainId] = useState(null);
  const [tokenInAddr, setTokenInAddr] = useState(null);
  const [tokenOutAddr, setTokenOutAddr] = useState(null);
  const [destChainId, setDestChainId] = useState(null);
  const [amountStr, setAmountStr] = useState("");
  const [slippage, setSlippage] = useState(0.005);

  const chainPools = useMemo(() => usablePools.filter((p) => p.chainId === chainId), [usablePools, chainId]);

  const tokensOnChain = useMemo(() => {
    const m = new Map();
    for (const p of chainPools) for (const t of [p.token0, p.token1]) m.set(lower(t.address), t);
    return [...m.values()];
  }, [chainPools]);

  const outTokens = useMemo(() => {
    const m = new Map();
    for (const p of chainPools) {
      if (same(p.token0.address, tokenInAddr)) m.set(lower(p.token1.address), p.token1);
      if (same(p.token1.address, tokenInAddr)) m.set(lower(p.token0.address), p.token0);
    }
    return [...m.values()];
  }, [chainPools, tokenInAddr]);

  const pool = useMemo(
    () =>
      chainPools.find(
        (p) =>
          (same(p.token0.address, tokenInAddr) && same(p.token1.address, tokenOutAddr)) ||
          (same(p.token1.address, tokenInAddr) && same(p.token0.address, tokenOutAddr))
      ) || null,
    [chainPools, tokenInAddr, tokenOutAddr]
  );

  const destChains = useMemo(() => {
    if (!pool) return [];
    const ids = usablePools.filter((p) => p.poolKey === pool.poolKey).map((p) => p.chainId);
    return [...new Set(ids)].map((id) => chainById.get(id));
  }, [pool, usablePools, chainById]);

  const tokenIn = tokensOnChain.find((t) => same(t.address, tokenInAddr)) || null;
  const tokenOut = outTokens.find((t) => same(t.address, tokenOutAddr)) || null;

  // Pick defaults once pools load / chain changes.
  useEffect(() => {
    if (!srcChains.length) return;
    if (!chainId || !srcChains.some((c) => c.id === chainId)) {
      setChainId(srcChains.some((c) => c.id === defaultChainId) ? defaultChainId : srcChains[0].id);
    }
  }, [srcChains, chainId, defaultChainId]);

  useEffect(() => {
    if (!tokensOnChain.length) return;
    if (!tokensOnChain.some((t) => same(t.address, tokenInAddr))) {
      const usdc = tokensOnChain.find((t) => t.symbol === "USDC");
      setTokenInAddr((usdc || tokensOnChain[0]).address);
    }
  }, [tokensOnChain, tokenInAddr]);

  useEffect(() => {
    if (!outTokens.length) return;
    if (!outTokens.some((t) => same(t.address, tokenOutAddr))) setTokenOutAddr(outTokens[0].address);
  }, [outTokens, tokenOutAddr]);

  useEffect(() => {
    if (!destChains.length) return;
    if (!destChains.some((c) => c.id === destChainId)) setDestChainId(chainId);
  }, [destChains, destChainId, chainId]);

  // Keep the page chart in sync.
  useEffect(() => {
    if (tokenIn) onSellTokenChange?.({ symbol: tokenIn.symbol, name: tokenIn.symbol, address: tokenIn.address, chainId });
  }, [tokenIn?.address, chainId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tokenOut) onBuyTokenChange?.({ symbol: tokenOut.symbol, name: tokenOut.symbol, address: tokenOut.address, chainId });
  }, [tokenOut?.address, chainId]); // eslint-disable-line react-hooks/exhaustive-deps

  const amountRaw = useMemo(() => {
    if (!tokenIn || !amountStr) return 0n;
    try {
      return parseUnits(amountStr, tokenIn.decimals);
    } catch {
      return 0n;
    }
  }, [amountStr, tokenIn]);

  // ---------- balance ----------
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: tokenIn?.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address],
    chainId: chainId || undefined,
    query: { enabled: Boolean(address && tokenIn && chainId) },
  });
  const insufficient = balance !== undefined && amountRaw > balance;

  // ---------- quote ----------
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const fetchQuote = useCallback(
    async (user, signal) => {
      const params = new URLSearchParams({
        chainId: String(chainId),
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amount: amountRaw.toString(),
        user,
        slippage: String(slippage),
      });
      if (destChainId && destChainId !== chainId) params.set("destChainId", String(destChainId));
      const r = await fetch(`/api/skate/quote?${params}`, { signal });
      return r.json();
    },
    [chainId, tokenIn, tokenOut, amountRaw, slippage, destChainId]
  );

  // ---------- swap state ----------
  const [phase, setPhase] = useState("idle"); // idle|switching|quoting|approving|swapping|tracking|done|error
  const [errorMsg, setErrorMsg] = useState(null);
  const [txHash, setTxHash] = useState(null);
  const [txChainId, setTxChainId] = useState(null);
  const [skateStatus, setSkateStatus] = useState(null);
  const [destTx, setDestTx] = useState(null);
  const busy = ["switching", "quoting", "approving", "swapping", "tracking"].includes(phase);

  useEffect(() => {
    if (busy) return; // don't swap the quote out from under an in-flight trade
    setQuote(null);
    if (!tokenIn || !tokenOut || amountRaw <= 0n || paused) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setQuoting(true);
      try {
        setQuote(await fetchQuote(address || PREVIEW_USER, ctrl.signal));
      } catch (e) {
        if (e.name !== "AbortError") setQuote({ ok: false, error: "Quote unavailable" });
      } finally {
        if (!ctrl.signal.aborted) setQuoting(false);
      }
    }, QUOTE_DEBOUNCE_MS);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [fetchQuote, address, tokenIn, tokenOut, amountRaw, paused, refreshTick, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (busy) return;
    const id = setInterval(() => setRefreshTick((n) => n + 1), QUOTE_REFRESH_MS);
    return () => clearInterval(id);
  }, [busy]);

  // ---------- execute ----------
  const onSwap = async () => {
    if (!isConnected) {
      open?.({ view: "Connect", namespace: "eip155" });
      return;
    }
    setErrorMsg(null);
    setTxHash(null);
    setDestTx(null);
    setSkateStatus(null);
    try {
      if (walletChainId !== chainId) {
        setPhase("switching");
        await switchChain(config, { chainId });
      }

      setPhase("quoting");
      let q = await fetchQuote(address);
      if (!q.ok) throw new Error(q.error || "Quote failed");

      const allowance = await readContract(config, {
        address: tokenIn.address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, q.spender],
        chainId,
      });

      if (allowance < amountRaw) {
        setPhase("approving");
        if (allowance > 0n && ZERO_RESET_TOKENS.has(`${chainId}:${lower(tokenIn.address)}`)) {
          const h0 = await writeContract(config, { address: tokenIn.address, abi: erc20Abi, functionName: "approve", args: [q.spender, 0n], chainId });
          await waitForTransactionReceipt(config, { hash: h0, chainId });
        }
        // Exact-amount approval only — never unlimited.
        const h = await writeContract(config, { address: tokenIn.address, abi: erc20Abi, functionName: "approve", args: [q.spender, amountRaw], chainId });
        await waitForTransactionReceipt(config, { hash: h, chainId });
        // Approval took time: refresh the quote so price + deadline are current.
        q = await fetchQuote(address);
        if (!q.ok) throw new Error(q.error || "Quote failed after approval");
      }

      setPhase("swapping");
      const hash = await sendTransaction(config, { to: q.swapTx.to, data: q.swapTx.data, chainId });
      setTxHash(hash);
      setTxChainId(chainId);
      const rcpt = await waitForTransactionReceipt(config, { hash, chainId });
      if (rcpt.status !== "success") throw new Error("Swap transaction reverted on-chain");

      setPhase("tracking");
      refetchBalance();
    } catch (e) {
      setPhase("error");
      setErrorMsg(shortError(e));
    }
  };

  // ---------- settlement tracking ----------
  const startedAt = useRef(0);
  useEffect(() => {
    if (phase !== "tracking" || !txHash) return;
    startedAt.current = Date.now();
    let stop = false;
    const poll = async () => {
      if (stop) return;
      try {
        const r = await fetch(`/api/skate/status?chainId=${txChainId}&txHash=${txHash}`).then((x) => x.json());
        if (r.ok) {
          setSkateStatus(r.status);
          if (r.destTxHash) setDestTx({ hash: r.destTxHash, chainId: r.destChainId });
          if (r.status === "TASK_EXECUTED") {
            setPhase("done");
            return;
          }
          if (/FAILED|CORRUPTED/.test(r.status || "")) {
            setPhase("error");
            setErrorMsg(`Skate reported ${r.status}. Funds are handled by Skate's refund flow — check the explorer link.`);
            return;
          }
        }
      } catch {
        /* keep polling */
      }
      if (Date.now() - startedAt.current > STATUS_TIMEOUT_MS) {
        setPhase("error");
        setErrorMsg("Still settling after 15 min. Check the explorer link or Skate support.");
        return;
      }
      setTimeout(poll, STATUS_POLL_MS);
    };
    poll();
    return () => {
      stop = true;
    };
  }, [phase, txHash, txChainId]);

  // ---------- derived UI ----------
  const explorer = (cid, hash) => {
    const base = chainById.get(cid)?.blockExplorers?.default?.url;
    return base && hash ? `${base}/tx/${hash}` : null;
  };

  const outDecimals = quote?.tokenOut?.decimals ?? tokenOut?.decimals ?? 18;
  const amountOutText = quote?.ok ? fmt(quote.expectedAmountOut, outDecimals) : "";
  const minOutText = quote?.ok
    ? fmt((BigInt(quote.expectedAmountOut) * BigInt(Math.round((1 - slippage) * 10_000))) / 10_000n, outDecimals)
    : "";
  const rateText =
    quote?.ok && amountRaw > 0n
      ? (Number(formatUnits(BigInt(quote.expectedAmountOut), outDecimals)) / Number(formatUnits(amountRaw, tokenIn.decimals))).toPrecision(6)
      : null;

  let cta = "Swap";
  let ctaDisabled = false;
  if (loadError) [cta, ctaDisabled] = [loadError, true];
  else if (paused) [cta, ctaDisabled] = ["Skate is in maintenance", true];
  else if (!pools.length) [cta, ctaDisabled] = ["Loading pools…", true];
  else if (!isConnected) cta = "Connect wallet";
  else if (amountRaw <= 0n) [cta, ctaDisabled] = ["Enter an amount", true];
  else if (insufficient) [cta, ctaDisabled] = [`Insufficient ${tokenIn?.symbol}`, true];
  else if (quoting && !quote) [cta, ctaDisabled] = ["Getting quote…", true];
  else if (quote && !quote.ok) [cta, ctaDisabled] = [quote.error?.includes("slippage") ? "Price impact too high" : "No quote", true];
  else if (walletChainId !== chainId) cta = `Switch to ${chainById.get(chainId)?.name} & swap`;

  const phaseLabel = {
    switching: "Switching network…",
    quoting: "Refreshing quote…",
    approving: `Approving ${tokenIn?.symbol}… (confirm in wallet)`,
    swapping: "Confirm swap in wallet…",
    tracking: "Settling through Skate…",
  }[phase];

  const flip = () => {
    if (!tokenOut || busy) return;
    const prevIn = tokenInAddr;
    setTokenInAddr(tokenOutAddr);
    setTokenOutAddr(prevIn);
    setAmountStr("");
  };

  return (
    <div className="w-full max-w-[480px] rounded-xl border border-white/10 bg-[#1F2937] p-5 text-left text-white">
      {/* header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="flex items-center gap-1">
          {SLIPPAGE_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              disabled={busy}
              className={`rounded-md px-2 py-1 text-xs ${slippage === s ? "bg-[#95E100] text-[#0B1220]" : "bg-white/5 text-white/70 hover:bg-white/10"}`}
              title="Max slippage"
            >
              {(s * 100).toFixed(s < 0.01 ? 1 : 0)}%
            </button>
          ))}
        </div>
      </div>

      {/* pay */}
      <div className="rounded-xl bg-[#151A23] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-white/60">You pay</span>
          <ChainSelect label="on" value={chainId} chains={srcChains} onChange={setChainId} disabled={busy} />
        </div>
        <div className="flex items-center gap-3">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={amountStr}
            disabled={busy}
            onChange={(e) => {
              const v = e.target.value.replace(",", ".");
              if (/^\d*\.?\d*$/.test(v)) setAmountStr(v);
            }}
            className="w-full min-w-0 bg-transparent text-2xl font-semibold outline-none placeholder:text-white/30"
          />
          <TokenSelect value={tokenInAddr} tokens={tokensOnChain} onChange={setTokenInAddr} disabled={busy} />
        </div>
        {balance !== undefined && tokenIn && (
          <div className="mt-2 flex justify-end gap-2 text-xs text-white/50">
            Balance: {fmt(balance, tokenIn.decimals)}
            <button className="font-semibold text-[#95E100] hover:underline" disabled={busy} onClick={() => setAmountStr(formatUnits(balance, tokenIn.decimals))}>
              MAX
            </button>
          </div>
        )}
      </div>

      {/* flip */}
      <div className="relative z-10 -my-3 flex justify-center">
        <button
          onClick={flip}
          disabled={busy}
          aria-label="Flip tokens"
          className="rounded-lg border border-white/10 bg-[#1F2937] p-2 text-white/80 hover:text-white"
        >
          ↓↑
        </button>
      </div>

      {/* receive */}
      <div className="rounded-xl bg-[#151A23] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-white/60">You receive</span>
          <ChainSelect label="on" value={destChainId} chains={destChains} onChange={setDestChainId} disabled={busy} />
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-full min-w-0 truncate text-2xl font-semibold ${amountOutText ? "" : "text-white/30"}`}>
            {quoting && !amountOutText ? "…" : amountOutText || "0.0"}
          </div>
          <TokenSelect value={tokenOutAddr} tokens={outTokens} onChange={setTokenOutAddr} disabled={busy} />
        </div>
      </div>

      {/* details */}
      {quote?.ok && (
        <div className="mt-4 space-y-1 text-xs text-white/60">
          {rateText && (
            <div className="flex justify-between">
              <span>Rate</span>
              <span className="text-white/80">
                1 {tokenIn?.symbol} ≈ {rateText} {tokenOut?.symbol}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Price impact</span>
            <span className="text-white/80">{(Math.max(0, quote.expectedSlippage) * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Min. received ({(slippage * 100).toFixed(1)}% slippage)</span>
            <span className="text-white/80">
              {minOutText} {tokenOut?.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Pool fee</span>
            <span className="text-white/80">{(pool?.feeBps ?? 0) / 100}%</span>
          </div>
          {destChainId !== chainId && (
            <div className="flex justify-between">
              <span>Route</span>
              <span className="text-white/80">
                {chainById.get(chainId)?.name} → {chainById.get(destChainId)?.name}
              </span>
            </div>
          )}
        </div>
      )}
      {quote && !quote.ok && !busy && amountRaw > 0n && <p className="mt-3 text-xs text-amber-300/90">{quote.error}</p>}

      {/* action */}
      <button
        onClick={onSwap}
        disabled={ctaDisabled || busy}
        className="mt-5 w-full rounded-[10px] bg-[#95E100] py-3 text-sm font-semibold text-[#0B1220] transition hover:bg-[#7AB800] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
      >
        {busy ? phaseLabel : cta}
      </button>

      {/* progress */}
      {(txHash || phase === "error" || phase === "done") && (
        <div className="mt-4 space-y-1 rounded-lg bg-white/5 p-3 text-xs">
          {txHash && (
            <div className="flex justify-between">
              <span className="text-white/60">Source tx</span>
              <a className="text-[#95E100] hover:underline" href={explorer(txChainId, txHash) || "#"} target="_blank" rel="noreferrer">
                {txHash.slice(0, 10)}…
              </a>
            </div>
          )}
          {skateStatus && (
            <div className="flex justify-between">
              <span className="text-white/60">Skate status</span>
              <span className="text-white/80">{skateStatus.replace(/^(ACTION|TASK)_/, "").toLowerCase()}</span>
            </div>
          )}
          {destTx && (
            <div className="flex justify-between">
              <span className="text-white/60">Settlement tx</span>
              <a className="text-[#95E100] hover:underline" href={explorer(destTx.chainId, destTx.hash) || "#"} target="_blank" rel="noreferrer">
                {destTx.hash.slice(0, 10)}…
              </a>
            </div>
          )}
          {phase === "done" && <p className="pt-1 font-semibold text-[#95E100]">Swap complete ✓</p>}
          {phase === "error" && errorMsg && <p className="pt-1 text-red-300">{errorMsg}</p>}
          {(phase === "done" || phase === "error") && (
            <button className="pt-1 text-white/60 underline hover:text-white" onClick={() => setPhase("idle")}>
              New swap
            </button>
          )}
        </div>
      )}

      {showPoweredBy && (
        <p className="mt-4 text-center text-[11px] text-white/40">Non-custodial · Liquidity by Skate AMM</p>
      )}
    </div>
  );
}
