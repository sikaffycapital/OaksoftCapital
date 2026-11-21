"use client";

// components/payments/WorkerWallet.jsx
// Worker wallet PREVIEW for Oaksoft Payments. Phone-first. Sample data only:
// the rate and fee below are placeholders, not quotes.

import Link from "next/link";
import { useState } from "react";
import { SAMPLE_WALLET, SAMPLE_WALLET_ACTIVITY } from "@/lib/payments/sampleData";
import {
  usd,
  number2,
  formatDate,
  cardClass,
  Pill,
  SampleBanner,
  eyebrowStyle,
} from "@/components/payments/ui";

const DESTINATIONS = [
  { key: "bank", label: SAMPLE_WALLET.bankLabel },
  { key: "cash", label: "Cash pickup" },
];

const COMING = [
  { key: "card", title: "Debit card", text: "Spend your dollars anywhere cards work." },
  { key: "bills", title: "Pay bills", text: "Pay local bills straight from your balance." },
];

export default function WorkerWallet() {
  const w = SAMPLE_WALLET;
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("bank");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const value = Number(amount);
  const valid = Number.isFinite(value) && value > 0 && value <= w.balanceUsdc;
  const fee = valid ? (value * w.sampleFeePct) / 100 : 0;
  const receive = valid ? (value - fee) * w.sampleRate : 0;

  const onCashOut = (e) => {
    e.preventDefault();
    setNotice("");
    if (!amount || !Number.isFinite(value) || value <= 0) {
      setError("Enter an amount");
      return;
    }
    if (value > w.balanceUsdc) {
      setError("That's more than your balance");
      return;
    }
    setError("");
    setNotice("Cash out goes live with the pilot. This preview doesn't move money.");
  };

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-[520px] px-4 pt-[40px] pb-16">
        <SampleBanner>This is a preview of a worker&apos;s wallet. No real money moves here.</SampleBanner>

        {/* Header */}
        <p className="text-white/60 uppercase mb-2" style={eyebrowStyle}>
          Worker wallet
        </p>
        <h1 className="text-white font-bold text-[30px] leading-[36px]">
          Hi, {w.workerName.split(" ")[0]}
        </h1>
        <p className="mt-1 text-white/60 text-[15px]">
          Paid by {w.employer} · {w.country}
        </p>

        {/* Balance */}
        <section
          aria-label="Balance"
          className="mt-6 rounded-2xl border-2 border-[#95E100]/60 bg-[#95E100]/10 p-6"
        >
          <p className="text-white/70 text-[14px]">USDC balance</p>
          <p className="mt-1 text-white font-bold tabular-nums text-[36px] leading-[42px]">
            {usd.format(w.balanceUsdc)}
          </p>
          <p className="mt-2 text-white/70 text-[14px] leading-[22px]">
            Digital dollars, yours until you choose to convert. Secured with a passkey on your phone.
          </p>
        </section>

        {/* Cash out */}
        <section aria-labelledby="cashout-heading" className={`${cardClass} mt-6 p-5`}>
          <h2 id="cashout-heading" className="text-white font-semibold text-[20px]">
            Cash out
          </h2>
          <form onSubmit={onCashOut} noValidate className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="cashout-amount" className="block text-white/80 text-[14px] mb-2">
                Amount in USDC
              </label>
              <input
                id="cashout-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="100.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError("");
                }}
                aria-invalid={!!error}
                aria-describedby={error ? "cashout-error" : undefined}
                className={`w-full rounded-[8px] bg-[#0F131B] border px-4 py-3 text-white text-[16px] placeholder:text-white/30 outline-none focus:border-[#95E100] ${
                  error ? "border-red-400/70" : "border-white/15"
                }`}
              />
              {error && (
                <p id="cashout-error" className="mt-1 text-[13px] text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div role="group" aria-label="Where to send it" className="grid grid-cols-2 gap-2">
              {DESTINATIONS.map((d) => {
                const active = destination === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setDestination(d.key)}
                    className={`rounded-[8px] border px-3 py-3 text-[14px] transition-colors cursor-pointer ${
                      active
                        ? "border-[#95E100] bg-[#95E100]/10 text-white"
                        : "border-white/15 bg-white/5 text-white/70 hover:text-white"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            <dl className="rounded-[8px] bg-black/20 px-4 py-3 text-[14px] leading-[24px]">
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Sample rate</dt>
                <dd className="text-white tabular-nums">
                  1 USDC = {w.localSymbol}
                  {number2.format(w.sampleRate)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-white/60">Fee ({w.sampleFeePct}%, sample)</dt>
                <dd className="text-white tabular-nums">{usd.format(fee)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 mt-2 pt-2">
                <dt className="text-white font-medium">You receive</dt>
                <dd className="text-[#95E100] font-semibold tabular-nums">
                  {w.localSymbol}
                  {number2.format(receive)} {w.localCurrency}
                </dd>
              </div>
            </dl>

            <button
              type="submit"
              className="inline-flex justify-center items-center rounded-[8px] bg-[#95E100] text-black font-semibold px-6 py-[14px] hover:opacity-90 cursor-pointer"
            >
              Cash out
            </button>

            {notice && (
              <p role="status" className="text-[14px] text-white/80">
                {notice}
              </p>
            )}
          </form>
          <p className="mt-3 text-white/40 text-[12px] leading-[18px]">
            You choose when to convert. Rates and fees here are sample values, not quotes.
          </p>
        </section>

        {/* Coming soon */}
        <section aria-label="Coming with the pilot" className="mt-6 grid grid-cols-2 gap-3">
          {COMING.map((c) => (
            <div key={c.key} className={`${cardClass} p-4`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-white font-medium text-[15px]">{c.title}</p>
                <Pill>Coming</Pill>
              </div>
              <p className="mt-2 text-white/60 text-[13px] leading-[20px]">{c.text}</p>
            </div>
          ))}
        </section>

        {/* Activity */}
        <section aria-labelledby="activity-heading" className={`${cardClass} mt-6 p-5`}>
          <h2 id="activity-heading" className="text-white font-semibold text-[20px]">
            Activity
          </h2>
          <ul className="mt-3 divide-y divide-white/10">
            {SAMPLE_WALLET_ACTIVITY.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-white text-[15px]">{t.label}</p>
                  <p className="text-white/40 text-[12px]">{formatDate(t.date)}</p>
                </div>
                <span
                  className={`tabular-nums text-[15px] font-semibold ${
                    t.amountUsdc > 0 ? "text-[#95E100]" : "text-white"
                  }`}
                >
                  {t.amountUsdc > 0 ? "+" : "−"}
                  {usd.format(Math.abs(t.amountUsdc))}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-10 text-center text-white/40 text-[13px]">
          Every number on this page is sample data.{" "}
          <Link href="/payments/dashboard" className="text-[#95E100] underline underline-offset-4">
            See the employer dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
