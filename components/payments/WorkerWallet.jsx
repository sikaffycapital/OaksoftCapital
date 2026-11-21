"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useEffect } from "react";
import { usePayrollDemo } from "./DemoProvider";
import { quoteCashout } from "@/lib/payments/demo.mjs";
import { SAMPLE_EMPLOYER } from "@/lib/payments/sampleData";
import { usd, number2, formatDate, cardClass, Pill, SampleBanner, eyebrowStyle } from "@/components/payments/ui";

const moneyFromCents = (cents) => usd.format((cents || 0) / 100);
const inputClass = "w-full rounded-lg border border-white/15 bg-[#0e131b] px-3.5 py-3 text-white outline-none transition focus:border-[#a8dc55] focus:ring-2 focus:ring-[#a8dc55]/15";
const primary = "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#a8dc55] px-5 py-3 font-semibold text-[#151b13] transition hover:bg-[#b9e873] disabled:cursor-not-allowed disabled:opacity-45";

function Dialog({ open, title, close, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return <dialog ref={ref} aria-label={title} onCancel={close} className="pay-dialog w-[min(94vw,500px)] rounded-2xl border border-white/15 bg-[#171d27] p-0 text-white shadow-2xl backdrop:bg-black/70">
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={close} className="rounded-full px-3 py-1 text-sm text-white/55 hover:bg-white/10 hover:text-white">Close</button></div>
    <div className="px-5 py-5">{children}</div>
  </dialog>;
}

export default function WorkerWallet() {
  const { state, dispatch } = usePayrollDemo();
  const router = useRouter();
  const [workerId, setWorkerId] = useState("W-102");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("worker");
    if (requested) setWorkerId(requested);
  }, []);
  const worker = state.workers.find((w) => w.id === workerId) || state.workers.find((w) => w.id === "W-102") || state.workers[0];
  const balanceCents = state.balances[worker?.id] || 0;
  const active = worker?.stage === "active" || worker?.wallet === "active";
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("bank");
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitLatch = useRef(false);
  const [localError, setLocalError] = useState("");
  const cashoutReceipt = state.lastReceipt?.kind === "cashout" && state.lastReceipt.workerId === worker?.id ? state.lastReceipt : null;
  const activities = state.activities[worker?.id] || [];
  const quote = useMemo(() => {
    try { return amount ? quoteCashout(amount, balanceCents) : null; } catch { return null; }
  }, [amount, balanceCents]);
  const quoteError = useMemo(() => {
    if (!amount) return "";
    try { quoteCashout(amount, balanceCents); return ""; } catch (error) { return error.message; }
  }, [amount, balanceCents]);
  const closeDialog = () => setDialog(false);
  const openReview = (event) => {
    event.preventDefault();
    setLocalError("");
    if (!active) { setLocalError("This worker is not active yet. Finish the demo invitation and verification steps first."); return; }
    try { quoteCashout(amount, balanceCents); setDialog(true); } catch (error) { setLocalError(error.message); }
  };
  const confirmCashout = () => {
    if (submitLatch.current) return;
    submitLatch.current = true;
    setBusy(true);
    dispatch({ type: "CASHOUT", payload: { workerId: worker.id, amountText: amount, destination } });
    setDialog(false);
    setAmount("");
    window.setTimeout(() => { submitLatch.current = false; setBusy(false); }, 250);
  };

  if (!worker) return <main className="payments-ui mx-auto min-h-[100dvh] max-w-lg px-4 py-10 text-white"><SampleBanner>Simulated balance only.</SampleBanner><p>No workers are available in this demo.</p><Link href="/payments/dashboard" className="mt-4 inline-block text-[#b9e873] underline">Open employer dashboard</Link></main>;
  return <main className="payments-ui min-h-[100dvh] bg-transparent text-white">
    <div className="mx-auto w-full max-w-[620px] px-4 pb-14 pt-7 sm:px-6 sm:pt-10">
      <SampleBanner>Worker wallet demo. Balances and cashouts are simulated in this browser only; refreshing resets the demo.</SampleBanner>
      <div className="mb-6 flex items-center justify-between gap-3"><div><p className="mb-2 uppercase text-white/50" style={eyebrowStyle}>Worker wallet</p><h1 className="text-3xl font-semibold tracking-tight">Your dollars, clearly.</h1></div><Link href="/payments/dashboard" className="shrink-0 text-sm text-[#b9e873] underline underline-offset-4">Employer view</Link></div>
      <label className="mb-2 block text-xs uppercase tracking-[.14em] text-white/45" htmlFor="wallet-worker">Viewing worker</label>
      <select id="wallet-worker" className={inputClass} value={worker.id} onChange={(e) => { setWorkerId(e.target.value); router.push(`/payments/wallet?worker=${encodeURIComponent(e.target.value)}`); }}>
        {state.workers.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}
      </select>

      <section aria-label="Wallet balance" className="relative mt-4 overflow-hidden rounded-2xl border border-[#a8dc55]/30 bg-[#a8dc55]/[.07] p-6 sm:p-7">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-[#a8dc55]/10" /><div className="absolute -right-5 -top-9 h-32 w-32 rounded-full border border-[#a8dc55]/10" />
        <div className="relative flex items-center justify-between gap-3"><p className="text-sm text-white/65">Available balance · USDC</p><Pill tone={active ? "good" : "warn"}>{active ? "Active" : worker.stage === "verification_pending" ? "Verification pending" : "Invite sent"}</Pill></div>
        <p className="relative mt-4 text-[42px] font-semibold leading-none tracking-tight tabular-nums sm:text-[48px]">{moneyFromCents(balanceCents)}</p>
        <p className="relative mt-3 text-sm text-white/50">Digital dollar balance shown for demonstration. No account or passkey is connected.</p>
        <div className="relative mt-5 border-t border-white/10 pt-4 text-sm"><p className="text-white/80">{worker.name}</p><p className="mt-1 text-xs text-white/45">Paid by {SAMPLE_EMPLOYER.name} · {worker.country}</p></div>
      </section>

      {!active && <section className={`${cardClass} mt-4 border border-amber-200/15 p-5`}><div className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-amber-200" /><div><h2 className="font-medium">Wallet setup is simulated</h2><p className="mt-1 text-sm leading-5 text-white/55">Accept the invitation, then simulate verification from the employer view. Cashout remains unavailable until the worker is active.</p><Link href="/payments/dashboard" className="mt-3 inline-block text-sm text-[#c4e794] underline underline-offset-4">Continue setup in employer view</Link></div></div></section>}

      <section aria-labelledby="cashout-heading" className={`${cardClass} mt-4 p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[.17em] text-white/40">Convert a demo balance</p><h2 id="cashout-heading" className="mt-1 text-xl font-semibold">Cash out</h2></div><span className="rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[.12em] text-white/40">Simulation</span></div>
        <form onSubmit={openReview} className="mt-5 space-y-4">
          <label className="block text-sm text-white/70" htmlFor="cashout-amount">Amount to convert <span className="mt-2 flex items-center rounded-lg border border-white/15 bg-[#0e131b] focus-within:border-[#a8dc55]"><span className="pl-3 text-white/40">$</span><input id="cashout-amount" value={amount} onChange={(e) => { setAmount(e.target.value); setLocalError(""); }} inputMode="decimal" placeholder="100.00" className="w-full bg-transparent px-2 py-3 text-white outline-none placeholder:text-white/25" aria-describedby="cashout-hint" /></span></label>
          <div id="cashout-hint" className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-white/40"><span>Available: {moneyFromCents(balanceCents)}</span><button type="button" disabled={!active || balanceCents <= 0} onClick={() => setAmount((balanceCents / 100).toFixed(2))} className="text-[#c4e794] underline underline-offset-4 disabled:opacity-40">Use full balance</button></div>
          {quote && <dl className="rounded-lg border border-white/[.08] bg-black/15 px-4 py-3 text-sm">
            <div className="flex justify-between py-1.5"><dt className="text-white/50">Demo conversion rate</dt><dd className="tabular-nums">1 USDC = Q{number2.format(7.7)} GTQ</dd></div>
            <div className="flex justify-between py-1.5"><dt className="text-white/50">Demo fee · 1%</dt><dd className="tabular-nums">{moneyFromCents(quote.feeCents)}</dd></div>
            <div className="mt-1 flex justify-between border-t border-white/10 pt-3"><dt className="font-medium">Estimated demo amount</dt><dd className="font-semibold tabular-nums text-[#c4e794]">Q{number2.format(quote.receiveCents / 100)} GTQ</dd></div>
          </dl>}
          {quoteError && <p className="text-xs text-rose-200/90">{quoteError}</p>}
          {localError && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{localError}</p>}
          {state.error && <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100"><p>{state.error}</p><button type="button" onClick={() => dispatch({ type: "CLEAR_FEEDBACK" })} className="shrink-0 text-xs underline underline-offset-4">Dismiss</button></div>}
          <div role="group" aria-label="Demo destination" className="grid grid-cols-2 gap-2">{[["bank", "Bank transfer"], ["cash", "Cash pickup"]].map(([key, label]) => <button key={key} type="button" aria-pressed={destination === key} onClick={() => setDestination(key)} className={`rounded-lg border px-3 py-3 text-sm transition ${destination === key ? "border-[#a8dc55]/70 bg-[#a8dc55]/[.08] text-white" : "border-white/10 bg-white/[.025] text-white/55 hover:text-white"}`}>{label}<span className="mt-1 block text-[10px] text-white/35">Demo destination</span></button>)}</div>
          <button type="submit" disabled={!active || !amount || !!quoteError} className={primary}>Review cashout</button>
        </form>
        <p className="mt-3 text-xs leading-5 text-white/40">The fixed GTQ conversion is an illustrative Guatemala sample shown consistently for all selected demo workers; it is not country-specific or connected to a local cashout rail. Rate and fee are not an offer or quote. No bank, cash network, or payment provider is contacted.</p>
      </section>

      {cashoutReceipt && <section role="status" className="mt-4 rounded-xl border border-[#a8dc55]/30 bg-[#a8dc55]/[.07] p-5"><p className="text-[11px] uppercase tracking-[.15em] text-[#c4e794]">Demo receipt · {cashoutReceipt.id}</p><h2 className="mt-2 text-lg font-semibold">Cashout simulated</h2><p className="mt-1 text-sm text-white/55">{moneyFromCents(cashoutReceipt.amountCents)} converted to Q{number2.format(cashoutReceipt.receiveCents / 100)} GTQ · {cashoutReceipt.destination === "bank" ? "bank transfer" : "cash pickup"}</p><p className="mt-1 text-xs text-white/45">Sample fee: {moneyFromCents(cashoutReceipt.feeCents)} · {formatDate(cashoutReceipt.date)}</p><p className="mt-2 text-xs text-white/45">Remaining demo balance: {moneyFromCents(balanceCents)} · Reference {cashoutReceipt.id}</p><p className="mt-1 text-xs text-white/40">No real money was sent.</p><button type="button" onClick={() => dispatch({ type: "CLEAR_FEEDBACK" })} className="mt-3 text-xs text-white/50 underline underline-offset-4">Dismiss receipt</button></section>}

      <section aria-label="Coming soon features" className="mt-4 grid grid-cols-2 gap-3">{[["Debit card", "Card access is not available in this demo."], ["Pay bills", "Bill payments are not available in this demo."]].map(([name, description]) => <article key={name} className={`${cardClass} p-4`}><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-medium">{name}</h2><Pill>Coming</Pill></div><p className="mt-2 text-xs leading-5 text-white/45">{description}</p></article>)}</section>

      <section aria-labelledby="activity-heading" className={`${cardClass} mt-4 p-5 sm:p-6`}><div className="flex items-end justify-between"><div><p className="text-[11px] uppercase tracking-[.17em] text-white/40">Shared demo ledger</p><h2 id="activity-heading" className="mt-1 text-xl font-semibold">Activity</h2></div><span className="text-xs text-white/35">{activities.length} entries</span></div>
        {activities.length ? <ul className="mt-3 divide-y divide-white/[.08]">{activities.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm">{entry.label}</p><p className="mt-1 text-xs text-white/40">{formatDate(entry.date)}</p></div><span className={`shrink-0 font-mono text-sm tabular-nums ${entry.amountCents > 0 ? "text-[#c4e794]" : "text-white/75"}`}>{entry.amountCents > 0 ? "+" : "−"}{moneyFromCents(Math.abs(entry.amountCents))}</span></li>)}</ul> : <div className="mt-4 rounded-lg border border-dashed border-white/10 px-4 py-7 text-center"><p className="text-sm text-white/60">No activity yet</p><p className="mt-1 text-xs text-white/35">Simulated payroll payments and cashouts will appear here.</p></div>}
      </section>
      <footer className="mt-8 text-center text-xs text-white/35">Oaksoft Capital Management · Digital dollar payroll demo · <Link href="/payments/dashboard" className="text-white/55 underline underline-offset-4">Employer dashboard</Link></footer>
    </div>
    <Dialog open={dialog} title="Review cashout" close={closeDialog}>
      <p className="text-sm leading-6 text-white/55">Review the demo values before confirming. This does not contact a provider or move real money.</p>
      <dl className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10 bg-black/10 px-4">
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">From your balance</dt><dd className="font-mono">{moneyFromCents(quote?.amountCents)}</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">Demo fee · 1%</dt><dd className="font-mono">{moneyFromCents(quote?.feeCents)}</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">Demo rate</dt><dd>Q7.70 / USDC</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">Destination</dt><dd>{destination === "bank" ? "Bank transfer" : "Cash pickup"}</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="font-medium">Estimated receipt</dt><dd className="font-semibold text-[#c4e794]">Q{number2.format((quote?.receiveCents || 0) / 100)} GTQ</dd></div>
      </dl>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={closeDialog} className="min-h-11 flex-1 rounded-lg border border-white/15 px-4 text-sm text-white/75 hover:bg-white/5">Back</button><button type="button" disabled={busy} onClick={confirmCashout} className="min-h-11 flex-1 rounded-lg bg-[#a8dc55] px-4 font-semibold text-[#151b13] hover:bg-[#b9e873] disabled:opacity-45">Confirm simulation</button></div>
    </Dialog>
  </main>;
}
