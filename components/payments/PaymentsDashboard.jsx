"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePayrollDemo } from "./DemoProvider";
import { parsePayrollCsv, validatePayroll, parseMoney } from "@/lib/payments/demo.mjs";
import { SAMPLE_EMPLOYER, SAMPLE_PAYROLL_RUNS } from "@/lib/payments/sampleData";
import { usd, formatDate, cardClass, Pill, SampleBanner, eyebrowStyle } from "@/components/payments/ui";

const moneyFromCents = (cents) => usd.format((cents || 0) / 100);
const csvSample = "worker_id,amount_usdc\nW-102,800.00\n";
const statusTone = { completed: "good", simulated: "good", processing: "info", scheduled: "neutral", needs_review: "warn", failed: "bad" };

function Dialog({ open, title, close, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return <dialog ref={ref} aria-label={title} onCancel={close} className="pay-dialog w-[min(94vw,620px)] rounded-2xl border border-white/15 bg-[#171d27] p-0 text-white shadow-2xl backdrop:bg-black/70">
    <div className="flex items-start justify-between border-b border-white/10 px-5 py-5 sm:px-7">
      <div><p className="mb-1 text-[11px] uppercase tracking-[.22em] text-[#b7d687]">Oaksoft · simulated</p><h2 className="text-xl font-semibold">{title}</h2></div>
      <button type="button" onClick={close} aria-label="Close dialog" className="rounded-full px-3 py-1 text-white/60 hover:bg-white/10 hover:text-white">Close</button>
    </div>
    <div className="px-5 py-6 sm:px-7">{children}</div>
  </dialog>;
}

function Field({ label, children }) { return <label className="block text-sm text-white/75">{label}<span className="mt-2 block">{children}</span></label>; }
const inputClass = "w-full rounded-lg border border-white/15 bg-[#0e131b] px-3.5 py-3 text-white outline-none transition focus:border-[#a8dc55] focus:ring-2 focus:ring-[#a8dc55]/15";
const buttonPrimary = "inline-flex min-h-11 items-center justify-center rounded-lg bg-[#a8dc55] px-5 py-2.5 font-semibold text-[#151b13] transition hover:bg-[#b9e873] disabled:cursor-not-allowed disabled:opacity-45";
const buttonQuiet = "inline-flex min-h-11 items-center justify-center rounded-lg border border-white/15 px-4 py-2.5 text-sm text-white/80 transition hover:border-white/35 hover:bg-white/5";

export default function PaymentsDashboard() {
  const { state, dispatch } = usePayrollDemo();
  const [dialog, setDialog] = useState("");
  const [runName, setRunName] = useState("Weekly payroll");
  const [csv, setCsv] = useState("");
  const [rows, setRows] = useState(null);
  const [csvErrors, setCsvErrors] = useState([]);
  const [filter, setFilter] = useState("all");
  const [invite, setInvite] = useState({ name: "", country: "Guatemala", role: "" });
  const [fundAmount, setFundAmount] = useState("");
  const [fundCents, setFundCents] = useState(0);
  const [fundError, setFundError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitLatch = useRef(false);
  const fileRead = useRef(0);

  const activeWorkers = state.workers.filter((w) => w.stage === "active" || w.wallet === "active");
  const availableCents = state.employerCents - state.reservedCents;
  const runs = useMemo(() => state.runs || SAMPLE_PAYROLL_RUNS, [state.runs]);
  const filteredRuns = filter === "all" ? runs : runs.filter((r) => r.status === filter);
  const totalWorkers = state.workers.length;
  const paidCount = state.workers.filter((w) => (state.balances[w.id] || 0) > 0).length;

  const starterRows = () => {
    const ana = activeWorkers.find((w) => w.id === "W-102") || activeWorkers[0];
    return ana ? [{ workerId: ana.id, amountCents: 80000 }] : [];
  };
  const startRun = () => {
    fileRead.current++;
    const initial = starterRows();
    setRows(initial);
    setCsv(`worker_id,amount_usdc\n${initial.map((r) => `${r.workerId},${(r.amountCents / 100).toFixed(2)}`).join("\n")}`);
    setCsvErrors([]);
    setDialog("run");
  };
  const parseRows = (text) => {
    fileRead.current++;
    setCsv(text);
    const result = parsePayrollCsv(text, state.workers);
    setRows(result.rows);
    setCsvErrors(result.errors);
  };
  const validate = () => {
    try {
      if (csvErrors.length) throw new Error(csvErrors[0]);
      if (!runName.trim() || runName.trim().length > 80) throw new Error("Give this payroll a name between 1 and 80 characters.");
      validatePayroll(state, rows || []);
      setCsvErrors([]);
      setDialog("review");
    } catch (error) { setCsvErrors([error.message]); }
  };
  const submit = (type, payload) => {
    if (submitLatch.current) return;
    submitLatch.current = true;
    setBusy(true);
    dispatch({ type, payload });
    window.setTimeout(() => { submitLatch.current = false; setBusy(false); }, 250);
    setDialog("");
  };
  const downloadSample = () => {
    const url = URL.createObjectURL(new Blob([csvSample], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = "oaksoft-payroll-sample.csv"; anchor.click();
    URL.revokeObjectURL(url);
  };
  const uploadFile = async (file) => {
    if (!file) return;
    const read = ++fileRead.current;
    setRows([]);
    if (file.size > 100 * 1024) { setRows([]); setCsvErrors(["CSV must be 100 KB or smaller."]); return; }
    setCsvErrors(["Reading CSV. Please wait before reviewing."]);
    try {
      const text = await file.text();
      if (read === fileRead.current) parseRows(text);
    } catch {
      if (read === fileRead.current) {
        setRows([]);
        setCsvErrors(["This CSV file could not be read. Try another file or paste the CSV contents."]);
      }
    }
  };
  const saveInvite = (event) => {
    event.preventDefault();
    submit("INVITE", invite);
    setInvite({ name: "", country: "Guatemala", role: "" });
  };
  const saveFund = (event) => {
    event.preventDefault();
    try {
      const cents = parseMoney(fundAmount);
      if (state.employerCents + cents > 1_000_000_000) throw new Error("The account would exceed the demo limit.");
      setFundCents(cents);
      setFundError("");
      setDialog("fund-review");
    } catch (error) { setFundError(error.message); }
  };
  const allErrors = [...csvErrors, ...(state.error ? [state.error] : [])];

  return <main className="payments-ui min-h-[100dvh] bg-transparent text-white">
    <div className="mx-auto w-full max-w-[1280px] px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-10">
      <SampleBanner>Connected payroll demo. Actions change only this browser session; refresh resets the simulation.</SampleBanner>
      <header className="mb-8 flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
        <div><p className="mb-2 uppercase text-white/55" style={eyebrowStyle}>Employer workspace · {SAMPLE_EMPLOYER.country}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[40px]">{SAMPLE_EMPLOYER.name}</h1>
          <p className="mt-2 text-sm text-white/55">{SAMPLE_EMPLOYER.type} · {SAMPLE_EMPLOYER.country} · demo workspace</p></div>
        <Link href="/payments/wallet" className={buttonQuiet}>Open worker wallet <span className="ml-2 text-[#b7df78]">↗</span></Link>
      </header>

      <section aria-label="Payroll account summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Payroll account", moneyFromCents(state.employerCents), "Simulated account balance"],
          ["Reserved", moneyFromCents(state.reservedCents), "Set aside for payroll"],
          ["Available", moneyFromCents(availableCents), "Ready for a demo run"],
          ["Workers", `${totalWorkers}`, `${paidCount} with a demo balance`],
        ].map(([label, value, hint], i) => <article key={label} className={`${cardClass} relative overflow-hidden p-5 sm:p-6`}>
          <span className="absolute right-5 top-5 font-mono text-xs text-white/25">0{i + 1}</span>
          <p className="text-sm text-white/55">{label}</p><p className="mt-4 break-words text-[27px] font-semibold tabular-nums tracking-tight sm:text-[31px]">{value}</p><p className="mt-1 text-xs text-white/40">{hint}</p>
        </article>)}
      </section>

      <section aria-label="Payroll actions" className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ["Run payroll", "Prepare, check, and simulate a payment batch.", startRun],
          ["Fund account", "Add demo dollars to available balance.", () => setDialog("fund")],
          ["Invite worker", "Create an invitation and advance its demo stages.", () => setDialog("invite")],
        ].map(([title, desc, onClick], i) => <button key={title} onClick={onClick} type="button" className="group flex min-h-[118px] items-start gap-4 rounded-xl border border-white/10 bg-[#171d27]/85 p-5 text-left transition hover:-translate-y-0.5 hover:border-[#a8dc55]/50 hover:bg-[#1b232b]">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#a8dc55]/10 font-mono text-sm text-[#b9e873]">0{i + 1}</span><span><strong className="block text-[15px] font-semibold">{title}<span className="ml-2 text-[#a8dc55] opacity-0 transition group-hover:opacity-100">↗</span></strong><span className="mt-1.5 block text-sm leading-5 text-white/50">{desc}</span></span>
        </button>)}
      </section>

      {state.lastReceipt && <aside role="status" className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-[#a8dc55]/25 bg-[#a8dc55]/[.07] p-4 sm:flex-row sm:items-center">
        <div><p className="text-xs uppercase tracking-[.16em] text-[#bddb8e]">Last demo action · {state.lastReceipt.id}</p><p className="mt-1 text-sm text-white/85">{state.lastReceipt.kind === "payroll" ? "Payroll simulated" : state.lastReceipt.kind === "fund" ? "Demo funds added" : "Cashout simulated"} · {moneyFromCents(state.lastReceipt.amountCents)}</p></div>
        <Link href="/payments/wallet" className="text-sm text-[#c3e894] underline underline-offset-4">View shared activity</Link>
      </aside>}
      {state.error && <div role="alert" className="mt-4 flex items-start justify-between gap-4 rounded-lg border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100"><p>{state.error}</p><button type="button" onClick={() => dispatch({ type: "CLEAR_FEEDBACK" })} className="shrink-0 text-xs underline underline-offset-4">Dismiss</button></div>}

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_.85fr]">
        <section className={`${cardClass} min-w-0 p-5 sm:p-6`} aria-labelledby="runs-title">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div><p className="text-[11px] uppercase tracking-[.18em] text-white/40">History & simulation</p><h2 id="runs-title" className="mt-1 text-xl font-semibold">Payroll runs</h2></div>
            <div className="flex flex-wrap gap-2">{["all", "completed", "processing", "scheduled", "needs_review", "failed"].map((key) => <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)} className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${filter === key ? "bg-[#a8dc55] font-medium text-[#151b13]" : "bg-white/[.06] text-white/60 hover:bg-white/10"}`}>{key === "needs_review" ? "Review" : key}</button>)}</div>
          </div>
          <ul className="mt-5 divide-y divide-white/[.08]">{filteredRuns.map((r) => <li key={r.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="truncate text-sm font-medium">{r.name}</p><p className="mt-1 text-xs text-white/45">{r.id} · {r.workers} {r.workers === 1 ? "worker" : "workers"} · {formatDate(r.date)}</p>{r.note && <p className="mt-1 text-xs text-amber-200/75">{r.note}</p>}</div>
            <div className="flex items-center justify-between gap-3 sm:justify-end"><span className="font-mono text-sm tabular-nums">{moneyFromCents(r.amountCents ?? Math.round((r.amountUsd || 0) * 100))}</span><Pill tone={statusTone[r.status] || "neutral"}>{r.status === "simulated" ? "Simulated" : (r.status || "completed").replace("_", " ")}</Pill></div>
          </li>)}
          {filteredRuns.length === 0 && <li className="py-10 text-center text-sm text-white/45">No runs match this filter. Start a demo run to add one.</li>}</ul>
          <button type="button" onClick={() => setDialog("reset")} className="mt-3 text-xs text-white/40 underline decoration-white/20 underline-offset-4 hover:text-white/70">Reset this demo session</button>
        </section>

        <section className={`${cardClass} p-5 sm:p-6`} aria-labelledby="workers-title">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[.18em] text-white/40">People</p><h2 id="workers-title" className="mt-1 text-xl font-semibold">Workers</h2></div><span className="rounded-full bg-white/[.07] px-2.5 py-1 text-xs text-white/60">{totalWorkers}</span></div>
          <ul className="mt-4 divide-y divide-white/[.08]">{state.workers.map((w) => {
            const active = w.stage === "active" || w.wallet === "active";
            const next = w.stage === "invited" ? "verification_pending" : w.stage === "verification_pending" ? "active" : "";
            return <li key={w.id} className="py-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-medium">{w.name}</p><p className="mt-1 text-xs text-white/45">{w.id} · {w.role} · {w.country}</p></div><Pill tone={active ? "good" : "warn"}>{active ? "Active" : w.stage === "verification_pending" ? "Verification" : "Invited"}</Pill></div>
              <div className="mt-3 flex items-center justify-between gap-2"><span className="text-xs text-white/40">{active ? "Ready for simulated payroll" : "No cashout until active"}</span><div className="flex gap-3">{active && <Link className="text-xs text-[#b9e873] underline underline-offset-4" href={`/payments/wallet?worker=${encodeURIComponent(w.id)}`}>Wallet</Link>}{next && <button type="button" onClick={() => dispatch({ type: "SET_WORKER_STAGE", payload: { workerId: w.id, stage: next } })} className="text-xs text-[#b9e873] underline underline-offset-4">Simulate {next === "active" ? "verification" : "accept invite"}</button>}</div></div>
            </li>;
          })}</ul>
        </section>
      </div>
      <footer className="mt-9 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-5 text-center text-xs text-white/35 sm:flex-row sm:text-left"><span>Oaksoft Capital Management · Demo only. No real funds, identity checks, or wallet actions.</span><Link href="/payments/wallet" className="text-white/50 hover:text-white">Worker view →</Link></footer>
    </div>

    <Dialog open={dialog === "run"} title="Prepare payroll" close={() => setDialog("")}>
      <div className="space-y-4">
        <Field label="Payroll name"><input className={inputClass} value={runName} maxLength={80} onChange={(e) => { setRunName(e.target.value); const result = parsePayrollCsv(csv, state.workers); setCsvErrors(result.errors); }} /></Field>
        <div className="rounded-lg border border-white/10 bg-white/[.03] p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Import recipient amounts</p><button type="button" onClick={downloadSample} className="text-xs text-[#c4e794] underline underline-offset-4">Download sample CSV</button></div>
          <p className="mt-1 text-xs text-white/45">CSV columns: worker_id, amount_usdc · up to 100 KB. You can also paste rows below.</p>
          <input type="file" accept=".csv,text/csv" onChange={(e) => uploadFile(e.target.files?.[0])} className="mt-3 block w-full text-xs text-white/60 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white hover:file:bg-white/15" />
          <textarea aria-label="Payroll CSV contents" rows={5} value={csv} onChange={(e) => parseRows(e.target.value)} placeholder={"worker_id,amount_usdc\nW-102,800.00"} className={`${inputClass} mt-3 resize-y font-mono text-sm`} />
        </div>
        {allErrors.length > 0 && <div role="alert" className="rounded-lg border border-rose-300/25 bg-rose-300/10 p-3 text-sm text-rose-100"><p className="font-medium">Please fix before reviewing</p><ul className="mt-1 list-inside list-disc">{allErrors.map((e, i) => <li key={`${i}-${e}`}>{e}</li>)}</ul></div>}
        <div className="flex flex-col-reverse justify-between gap-2 sm:flex-row"><button type="button" onClick={() => setDialog("")} className={buttonQuiet}>Cancel</button><button type="button" onClick={validate} className={buttonPrimary}>Check recipients</button></div>
      </div>
    </Dialog>
    <Dialog open={dialog === "review"} title="Review payroll" close={() => setDialog("")}>
      <p className="text-sm text-white/55">Confirm the recipient list and total before the simulation. Nothing is sent or transferred.</p>
      <div className="mt-4 max-h-64 overflow-auto rounded-lg border border-white/10"><ul className="divide-y divide-white/10">{(rows || []).map((r) => { const worker = state.workers.find((w) => w.id === r.workerId); return <li key={r.workerId} className="flex justify-between gap-3 px-4 py-3 text-sm"><span>{worker?.name || r.workerId}<span className="ml-2 text-xs text-white/40">{r.workerId}</span></span><span className="font-mono">{moneyFromCents(r.amountCents)}</span></li>; })}</ul></div>
      <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-sm"><span className="text-white/55">{rows?.length || 0} recipients · {runName}</span><strong className="font-mono">{moneyFromCents((rows || []).reduce((n, r) => n + r.amountCents, 0))}</strong></div>
      <div className="mt-6 flex flex-col-reverse justify-between gap-2 sm:flex-row"><button type="button" onClick={() => setDialog("run")} className={buttonQuiet}>Back to edit</button><button type="button" disabled={busy} onClick={() => submit("PAYROLL", { name: runName.trim(), rows })} className={buttonPrimary}>Simulate payroll</button></div>
    </Dialog>
    <Dialog open={dialog === "fund"} title="Add demo funds" close={() => setDialog("")}>
      <form onSubmit={saveFund} className="space-y-4"><p className="text-sm leading-6 text-white/55">Adjusts only the simulated account balance in this session. No deposit is made.</p><Field label="Amount in US dollars"><input required className={inputClass} inputMode="decimal" placeholder="2,500.00" value={fundAmount} onChange={(e) => { setFundAmount(e.target.value); setFundError(""); }} /></Field>{fundError && <p role="alert" className="text-sm text-rose-200">{fundError}</p>}<div className="flex flex-col-reverse justify-between gap-2 sm:flex-row"><button type="button" onClick={() => setDialog("")} className={buttonQuiet}>Cancel</button><button disabled={busy} className={buttonPrimary}>Review demo funds</button></div></form>
    </Dialog>
    <Dialog open={dialog === "fund-review"} title="Review demo funds" close={() => setDialog("")}>
      <p className="text-sm leading-6 text-white/55">Confirm this simulated adjustment. It does not represent a deposit or money received.</p>
      <div className="mt-5 rounded-lg border border-white/10 bg-black/10 p-4"><div className="flex justify-between gap-3 text-sm"><span className="text-white/50">Current simulated account</span><span className="font-mono">{moneyFromCents(state.employerCents)}</span></div><div className="mt-3 flex justify-between gap-3 border-t border-white/10 pt-3 text-sm"><span className="text-white/50">Add to demo account</span><strong className="font-mono text-[#c4e794]">{moneyFromCents(fundCents)}</strong></div><div className="mt-3 flex justify-between gap-3 border-t border-white/10 pt-3 text-sm"><span className="font-medium">New simulated balance</span><strong className="font-mono">{moneyFromCents(state.employerCents + fundCents)}</strong></div></div>
      <div className="mt-6 flex flex-col-reverse justify-between gap-2 sm:flex-row"><button type="button" onClick={() => setDialog("fund")} className={buttonQuiet}>Back to edit</button><button type="button" disabled={busy} onClick={() => { submit("FUND", { amountText: fundAmount }); setFundAmount(""); }} className={buttonPrimary}>Confirm adjustment</button></div>
    </Dialog>
    <Dialog open={dialog === "invite"} title="Invite a worker" close={() => setDialog("")}>
      <form onSubmit={saveInvite} className="space-y-4"><p className="text-sm leading-6 text-white/55">Creates a demo invitation. The worker must simulate accepting it and verification before becoming active.</p><Field label="Worker name"><input required maxLength={80} className={inputClass} value={invite.name} onChange={(e) => setInvite({ ...invite, name: e.target.value })} /></Field><Field label="Role"><input required maxLength={80} className={inputClass} placeholder="Customer support" value={invite.role} onChange={(e) => setInvite({ ...invite, role: e.target.value })} /></Field><Field label="Country"><select className={inputClass} value={invite.country} onChange={(e) => setInvite({ ...invite, country: e.target.value })}>{["Guatemala", "Panama", "El Salvador", "Honduras", "Nicaragua", "Costa Rica"].map((c) => <option key={c}>{c}</option>)}</select></Field><div className="flex flex-col-reverse justify-between gap-2 sm:flex-row"><button type="button" onClick={() => setDialog("")} className={buttonQuiet}>Cancel</button><button disabled={busy} className={buttonPrimary}>Create demo invitation</button></div></form>
    </Dialog>
    <Dialog open={dialog === "reset"} title="Reset demo session?" close={() => setDialog("")}>
      <p className="text-sm leading-6 text-white/55">This restores the original sample balances, workers, and activity in this browser session. This cannot be undone.</p>
      <div className="mt-6 flex flex-col-reverse justify-between gap-2 sm:flex-row"><button type="button" onClick={() => setDialog("")} className={buttonQuiet}>Keep current demo</button><button type="button" onClick={() => { dispatch({ type: "RESET" }); setDialog(""); }} className="min-h-11 rounded-lg border border-rose-200/25 bg-rose-300/10 px-4 font-medium text-rose-100 hover:bg-rose-300/15">Reset demo</button></div>
    </Dialog>
  </main>;
}
