"use client";

import { useMemo, useState } from "react";
import { SAMPLE_RATES, SAMPLE_WALLET } from "@/lib/payments/sampleData";
import { usd, number2 } from "@/components/payments/ui";

const countries = ["Panama", "El Salvador", "Guatemala", "Honduras"];
const initialAmount = "500";
const fieldClass = "w-full rounded-lg border border-white/15 bg-[#10151e] px-4 py-3 text-white outline-none transition-colors placeholder:text-white/30 hover:border-white/30 focus:border-[#a8dc55] focus:ring-2 focus:ring-[#a8dc55]/15";

export default function PaydayPreview() {
  const [amount, setAmount] = useState(initialAmount);
  const [country, setCountry] = useState("Panama");
  const [view, setView] = useState("employer");
  const rate = SAMPLE_RATES[country];
  const feeRate = SAMPLE_WALLET.sampleFeePct / 100;
  const numericAmount = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(numericAmount) && numericAmount > 0 && numericAmount <= 1e12;
  const workerAmount = valid ? numericAmount * (1 - feeRate) : 0;
  const converted = workerAmount * rate.rate;
  const resultIsValid = valid && Number.isFinite(workerAmount) && Number.isFinite(converted);
  const formattedAmount = useMemo(() => resultIsValid ? usd.format(numericAmount) : "", [numericAmount, resultIsValid]);
  const formattedWorker = resultIsValid
    ? rate.code === "USD" ? usd.format(workerAmount) : `${rate.symbol}${number2.format(converted)}`
    : "";

  return (
    <section aria-labelledby="payday-preview-title" className="w-full px-4 pt-14 md:pt-20">
      <div className="mx-auto grid w-full max-w-[1100px] gap-8 overflow-hidden rounded-2xl border border-white/10 bg-[#141a24] shadow-[0_18px_60px_rgba(0,0,0,.25)] md:grid-cols-[.85fr_1.15fr]">
        <div className="flex flex-col justify-center border-b border-white/10 bg-[#95E100]/[.045] p-6 sm:p-9 md:border-b-0 md:border-r">
          <p className="mb-3 text-[12px] uppercase tracking-[.2em] text-[#b7e878]">A payday, made clear</p>
          <h2 id="payday-preview-title" className="text-3xl font-semibold leading-tight text-white sm:text-[38px]">See what payday could look like.</h2>
          <p className="mt-4 max-w-md text-sm leading-6 text-white/65">A simple, illustrative view of dollar payroll and the amount a worker may receive after the sample fee.</p>
          <p className="mt-6 text-xs leading-5 text-white/45">This is a browser-only preview. No money moves, and no live rates are used.</p>
        </div>
        <div className="p-5 sm:p-8">
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <label className="block text-sm text-white/70" htmlFor="preview-amount">
              Amount in USD
              <span className="mt-2 flex items-center rounded-lg border border-white/15 bg-[#10151e] transition-colors focus-within:border-[#a8dc55]">
                <span className="pl-4 text-white/45">$</span>
                <input id="preview-amount" type="number" min="0" step="any" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} className="w-full bg-transparent px-2 py-3 text-white outline-none placeholder:text-white/30" aria-invalid={!valid} aria-describedby="preview-validation" />
              </span>
            </label>
            <label className="block text-sm text-white/70" htmlFor="preview-country">
              Worker&apos;s country
              <select id="preview-country" value={country} onChange={(event) => setCountry(event.target.value)} className={`${fieldClass} mt-2`}>
                {countries.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
          <p id="preview-validation" role={valid ? undefined : "alert"} className={`mt-2 min-h-5 text-xs ${valid ? "text-white/40" : "text-rose-200"}`}>
            {valid ? "Enter an amount greater than zero." : "Enter a finite amount greater than zero (up to $1 trillion)."}
          </p>
          <div role="group" aria-label="Preview perspective" className="mt-4 grid grid-cols-2 rounded-lg border border-white/10 bg-black/15 p-1">
            {[["employer", "Employer sends"], ["worker", "Worker receives"]].map(([key, label]) => (
              <button key={key} type="button" aria-pressed={view === key} onClick={() => setView(key)} className={`min-h-11 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a8dc55] ${view === key ? "bg-[#a8dc55] font-semibold text-[#151b13]" : "text-white/60 hover:bg-white/[.06] hover:text-white"}`}>{label}</button>
            ))}
          </div>
          <div aria-live="polite" className="mt-4 rounded-xl border border-[#a8dc55]/20 bg-[#a8dc55]/[.055] p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[.17em] text-[#b7e878]">{view === "employer" ? "Employer sends" : "Worker receives"}</p>
            {valid && resultIsValid ? (
              view === "employer" ? (
                <p className="mt-3 text-lg font-medium leading-7 text-white sm:text-xl">{formattedAmount} USD arrives as {number2.format(numericAmount)} USDC in seconds.</p>
              ) : (
                <>
                  <p className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{formattedWorker}</p>
                  <p className="mt-2 text-sm leading-5 text-white/60">{rate.code === "USD" ? "No currency conversion needed." : `${country} · illustrative rate ${number2.format(rate.rate)} ${rate.code} per USDC.`}</p>
                  <p className="mt-3 text-xs text-white/45">Amount × (1 − {number2.format(SAMPLE_WALLET.sampleFeePct)}% sample fee) × sample rate</p>
                </>
              )
            ) : <p className="mt-3 text-sm leading-6 text-white/55">Enter a valid amount to see the illustrative preview.</p>}
          </div>
          <p className="mt-3 text-center text-xs text-white/45">Sample rates and fee, for illustration only.</p>
        </div>
      </div>
    </section>
  );
}
