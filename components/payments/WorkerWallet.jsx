"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useEffect } from "react";
import { usePayrollDemo } from "./DemoProvider";
import { quoteCashout } from "@/lib/payments/demo.mjs";
import { SAMPLE_EMPLOYER } from "@/lib/payments/sampleData";
import { usd, number2, cardClass, Pill, eyebrowStyle } from "@/components/payments/ui";

const moneyFromCents = (cents) => usd.format((cents || 0) / 100);
const inputClass = "w-full rounded-lg border border-white/15 bg-[#0e131b] px-3.5 py-3 text-white outline-none transition focus:border-[#a8dc55] focus:ring-2 focus:ring-[#a8dc55]/15";
const primary = "inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#a8dc55] px-5 py-3 font-semibold text-[#151b13] transition hover:bg-[#b9e873] disabled:cursor-not-allowed disabled:opacity-45";

function Dialog({ open, title, close, closeLabel, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);
  return <dialog ref={ref} aria-label={title} onCancel={close} className="pay-dialog w-[min(94vw,500px)] rounded-2xl border border-white/15 bg-[#171d27] p-0 text-white shadow-2xl backdrop:bg-black/70">
    <div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={close} className="rounded-full px-3 py-1 text-sm text-white/55 transition-colors hover:bg-white/10 hover:text-white">{closeLabel}</button></div>
    <div className="px-5 py-5">{children}</div>
  </dialog>;
}

export default function WorkerWallet() {
  const { state, dispatch } = usePayrollDemo();
  const router = useRouter();
  const [language, setLanguage] = useState("en");
  const strings = {
    en: {
      languageLabel: "Language", english: "English", spanish: "Español", sample: "Sample data.", banner: "Worker wallet demo. Balances and cashouts are simulated in this browser only; refreshing resets the demo.",
      noWorker: "No workers are available in this demo.", dashboard: "Open employer dashboard", wallet: "Worker wallet", headline: "Your dollars, clearly.", employerView: "Employer view",
      walletBalance: "Wallet balance", requestAccess: "Request access", convertedTo: "converted to", coming: "Coming", close: "Close",
      viewingWorker: "Viewing worker", balanceLabel: "Available balance · USDC", active: "Active", verificationPending: "Verification pending", inviteSent: "Invite sent", balanceNote: "Digital dollar balance shown for demonstration. No account or passkey is connected.",
      paidBy: "Paid by", setupTitle: "Wallet setup is simulated", setupText: "Accept the invitation, then simulate verification from the employer view. Cashout remains unavailable until the worker is active.", continueSetup: "Continue setup in employer view",
      convertBalance: "Convert a demo balance", cashOut: "Cash out", simulation: "Simulation", amountConvert: "Amount to convert", available: "Available:", fullBalance: "Use full balance",
      rate: "Demo conversion rate", fee: "Demo fee · 1%", estimated: "Estimated demo amount", dismiss: "Dismiss", destination: "Demo destination", bankTransfer: "Bank transfer", cashPickup: "Cash pickup", destinationDemo: "Demo destination", review: "Review cashout",
      explanation: "The fixed GTQ conversion is an illustrative Guatemala sample shown consistently for all selected demo workers; it is not country-specific or connected to a local cashout rail. Rate and fee are not an offer or quote. No bank, cash network, or payment provider is contacted.",
      receipt: "Demo receipt", simulated: "Cashout simulated", sampleFee: "Sample fee:", remaining: "Remaining demo balance:", reference: "Reference", noMoney: "No real money was sent.", dismissReceipt: "Dismiss receipt",
      comingFeatures: "Coming soon features", debitCard: "Debit card", cardUnavailable: "Card access is not available in this demo.", payBills: "Pay bills", billsUnavailable: "Bill payments are not available in this demo.",
      ledger: "Shared demo ledger", activity: "Activity", entries: "entries", noActivity: "No activity yet", emptyActivity: "Simulated payroll payments and cashouts will appear here.",
      footer: "Oaksoft Capital Management · Digital dollar payroll demo ·", employerDashboard: "Employer dashboard", reviewCashout: "Review cashout",
      reviewText: "Review the demo values before confirming. This does not contact a provider or move real money.", fromBalance: "From your balance", demoRate: "Demo rate",
      estimatedReceipt: "Estimated receipt", back: "Back", confirm: "Confirm simulation", noWorkerFallback: "This worker is not active yet. Finish the demo invitation and verification steps first.",
      genericError: "We could not complete that demo action. Please check your details and try again.", amountError: "Enter a positive amount with at most two decimal places.",
      limitError: "Amount must be between $0.01 and $10,000,000.00.", exceedsBalance: "That's more than your available balance.", smallAmount: "Amount is too small after the sample fee.",
      bankCash: "Simulated bank cash-out", cashHistory: "Simulated cash pickup", salary: "Salary from", payrollSuffix: "simulated payroll",
      country: { Panama: "Panama", Guatemala: "Guatemala", "El Salvador": "El Salvador", Honduras: "Honduras" },
      errors: {
        "Enter a positive amount with at most two decimal places.": "Enter a positive amount with at most two decimal places.",
        "Amount must be between $0.01 and $10,000,000.00.": "Amount must be between $0.01 and $10,000,000.00.",
        "That's more than your available balance.": "That's more than your available balance.",
        "Amount is too small after the sample fee.": "Amount is too small after the sample fee.",
        "Complete simulated worker onboarding before cashing out.": "Complete the simulated worker setup before cashing out.",
        "Choose bank account or cash pickup.": "Choose bank transfer or cash pickup.",
        "This worker is not active yet. Finish the demo invitation and verification steps first.": "This worker is not active yet. Finish the demo invitation and verification steps first.",
      },
    },
    es: {
      languageLabel: "Idioma", english: "English", spanish: "Español", sample: "Datos de muestra.", banner: "Billetera de demostración. Los saldos y retiros se simulan solo en este navegador; al actualizar, se reinicia la demostración.",
      noWorker: "No hay trabajadores disponibles en esta demostración.", dashboard: "Abrir panel del empleador", wallet: "Billetera del trabajador", headline: "Tus dólares, con claridad.", employerView: "Vista del empleador",
      walletBalance: "Saldo de la billetera", requestAccess: "Solicitar acceso", convertedTo: "convertidos a", coming: "Próximamente", close: "Cerrar",
      viewingWorker: "Trabajador seleccionado", balanceLabel: "Saldo disponible · USDC", active: "Activa", verificationPending: "Verificación pendiente", inviteSent: "Invitación enviada", balanceNote: "Saldo en dólares digitales mostrado solo como demostración. No hay ninguna cuenta ni clave de acceso conectada.",
      paidBy: "Pagado por", setupTitle: "La configuración de la billetera es simulada", setupText: "Acepta la invitación y luego simula la verificación desde la vista del empleador. El retiro no estará disponible hasta que el trabajador esté activo.", continueSetup: "Continuar configuración en la vista del empleador",
      convertBalance: "Convertir un saldo de demostración", cashOut: "Retirar", simulation: "Simulación", amountConvert: "Monto a convertir", available: "Disponible:", fullBalance: "Usar todo el saldo",
      rate: "Tipo de cambio de demostración", fee: "Comisión de demostración · 1%", estimated: "Monto estimado de demostración", dismiss: "Cerrar", destination: "Destino de demostración", bankTransfer: "Transferencia bancaria", cashPickup: "Retiro en efectivo", destinationDemo: "Destino simulado", review: "Revisar retiro",
      explanation: "La conversión fija a GTQ es una muestra ilustrativa de Guatemala, igual para todos los trabajadores seleccionados; no es específica del país ni está conectada a un servicio local de retiro. El tipo de cambio y la comisión no son una oferta ni una cotización. No se contacta a ningún banco, red de efectivo ni proveedor de pagos.",
      receipt: "Comprobante de demostración", simulated: "Retiro simulado", sampleFee: "Comisión de muestra:", remaining: "Saldo restante de demostración:", reference: "Referencia", noMoney: "No se envió dinero real.", dismissReceipt: "Cerrar comprobante",
      comingFeatures: "Funciones próximas", debitCard: "Tarjeta de débito", cardUnavailable: "El acceso a tarjetas no está disponible en esta demostración.", payBills: "Pagar facturas", billsUnavailable: "El pago de facturas no está disponible en esta demostración.",
      ledger: "Registro compartido de demostración", activity: "Actividad", entries: "movimientos", noActivity: "Aún no hay actividad", emptyActivity: "Los pagos de nómina y retiros simulados aparecerán aquí.",
      footer: "Oaksoft Capital Management · Demostración de nómina en dólares digitales ·", employerDashboard: "Panel del empleador", reviewCashout: "Revisar retiro",
      reviewText: "Revisa los valores de demostración antes de confirmar. No se contacta a ningún proveedor ni se mueve dinero real.", fromBalance: "De tu saldo", demoRate: "Tipo de cambio de demostración",
      estimatedReceipt: "Monto estimado recibido", back: "Volver", confirm: "Confirmar simulación", noWorkerFallback: "Este trabajador aún no está activo. Completa primero la invitación y los pasos de verificación de demostración.",
      genericError: "No se pudo completar esa acción de demostración. Revisa los datos e inténtalo de nuevo.", amountError: "Ingresa un monto positivo con un máximo de dos decimales.",
      limitError: "El monto debe estar entre $0.01 y $10,000,000.00.", exceedsBalance: "El monto supera tu saldo disponible.", smallAmount: "El monto es demasiado pequeño después de la comisión de muestra.",
      bankCash: "Retiro bancario simulado", cashHistory: "Retiro en efectivo simulado", salary: "Salario de", payrollSuffix: "nómina simulada",
      country: { Panama: "Panamá", Guatemala: "Guatemala", "El Salvador": "El Salvador", Honduras: "Honduras" },
      errors: {
        "Enter a positive amount with at most two decimal places.": "Ingresa un monto positivo con un máximo de dos decimales.",
        "Amount must be between $0.01 and $10,000,000.00.": "El monto debe estar entre $0.01 y $10,000,000.00.",
        "That's more than your available balance.": "El monto supera tu saldo disponible.",
        "Amount is too small after the sample fee.": "El monto es demasiado pequeño después de la comisión de muestra.",
        "Complete simulated worker onboarding before cashing out.": "Completa la configuración simulada del trabajador antes de retirar.",
        "Choose bank account or cash pickup.": "Elige transferencia bancaria o retiro en efectivo.",
        "This worker is not active yet. Finish the demo invitation and verification steps first.": "Este trabajador aún no está activo. Completa primero la invitación y los pasos de verificación de demostración.",
      },
    },
  };
  const t = strings[language];
  const translatedError = (message) => t.errors[message] || (language === "en" ? message : t.genericError);
  const countryName = (name) => t.country[name] || name;
  const localizedDate = (isoDay) => isoDay
    ? new Date(`${isoDay}T00:00:00Z`).toLocaleDateString(language === "es" ? "es" : "en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    : "";
  const activityLabel = (label) => {
    if (label === "Salary from Acme Staffing") return `${t.salary} Acme Staffing`;
    if (label === "Cash out to bank (GTQ)") return `${t.bankTransfer} (GTQ)`;
    if (label === "Cash pickup") return t.cashPickup;
    if (label === "Simulated bank cash-out") return t.bankCash;
    if (label === "Simulated cash pickup") return t.cashHistory;
    const suffix = " · simulated payroll";
    return label.endsWith(suffix) ? `${label.slice(0, -suffix.length)} · ${t.payrollSuffix}` : label;
  };
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
  const rawQuoteError = useMemo(() => {
    if (!amount) return "";
    try { quoteCashout(amount, balanceCents); return ""; } catch (error) { return error.message; }
  }, [amount, balanceCents]);
  const quoteError = rawQuoteError ? translatedError(rawQuoteError) : "";
  const closeDialog = () => setDialog(false);
  const openReview = (event) => {
    event.preventDefault();
    setLocalError("");
    if (!active) { setLocalError(strings.en.noWorkerFallback); return; }
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

  if (!worker) return <main className="payments-ui mx-auto min-h-[100dvh] max-w-lg px-4 py-10 text-white"><div role="note" className="mb-8 rounded-xl border border-amber-300/30 bg-amber-300/10 px-5 py-4 text-amber-100"><strong>{t.sample}</strong> {t.banner}</div><p>{t.noWorker}</p><Link href="/payments/dashboard" className="mt-4 inline-block text-[#b9e873] underline">{t.dashboard}</Link></main>;
  return <main className="payments-ui min-h-[100dvh] bg-transparent text-white">
    <div className="mx-auto w-full max-w-[620px] px-4 pb-14 pt-7 sm:px-6 sm:pt-10">
      <div className="mb-5 flex justify-end" role="group" aria-label={t.languageLabel}><button type="button" onClick={() => setLanguage("en")} aria-pressed={language === "en"} className={`min-h-10 rounded-l-lg border px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9e873] ${language === "en" ? "border-[#a8dc55]/50 bg-[#a8dc55]/10 text-white" : "border-white/15 text-white/55 hover:text-white"}`}>{t.english}</button><button type="button" onClick={() => setLanguage("es")} aria-pressed={language === "es"} className={`min-h-10 rounded-r-lg border border-l-0 px-3 text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#b9e873] ${language === "es" ? "border-[#a8dc55]/50 bg-[#a8dc55]/10 text-white" : "border-white/15 text-white/55 hover:text-white"}`}>{t.spanish}</button></div>
      <div role="note" className="mb-8 flex flex-col gap-3 rounded-[12px] border border-amber-300/30 bg-amber-300/10 px-5 py-4 md:flex-row md:items-center md:justify-between"><p className="text-amber-100 text-[15px] leading-[22px]"><span className="font-semibold">{t.sample}</span> {t.banner}</p><Link href="/payments#request-access" className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg bg-[#95E100] px-5 py-2 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:opacity-90">{t.requestAccess}</Link></div>
      <div className="mb-6 flex items-center justify-between gap-3"><div><p className="mb-2 uppercase text-white/50" style={eyebrowStyle}>{t.wallet}</p><h1 className="text-3xl font-semibold tracking-tight">{t.headline}</h1></div><Link href="/payments/dashboard" className="shrink-0 text-sm text-[#b9e873] underline underline-offset-4">{t.employerView}</Link></div>
      <label className="mb-2 block text-xs uppercase tracking-[.14em] text-white/45" htmlFor="wallet-worker">{t.viewingWorker}</label>
      <select id="wallet-worker" className={inputClass} value={worker.id} onChange={(e) => { setWorkerId(e.target.value); router.push(`/payments/wallet?worker=${encodeURIComponent(e.target.value)}`); }}>
        {state.workers.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.id}</option>)}
      </select>

      <section aria-label={t.walletBalance} className="relative mt-4 overflow-hidden rounded-2xl border border-[#a8dc55]/30 bg-[#a8dc55]/[.07] p-6 sm:p-7">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full border border-[#a8dc55]/10" /><div className="absolute -right-5 -top-9 h-32 w-32 rounded-full border border-[#a8dc55]/10" />
        <div className="relative flex items-center justify-between gap-3"><p className="text-sm text-white/65">{t.balanceLabel}</p><Pill tone={active ? "good" : "warn"}>{active ? t.active : worker.stage === "verification_pending" ? t.verificationPending : t.inviteSent}</Pill></div>
        <p className="relative mt-4 text-[42px] font-semibold leading-none tracking-tight tabular-nums sm:text-[48px]">{moneyFromCents(balanceCents)}</p>
        <p className="relative mt-3 text-sm text-white/50">{t.balanceNote}</p>
        <div className="relative mt-5 border-t border-white/10 pt-4 text-sm"><p className="text-white/80">{worker.name}</p><p className="mt-1 text-xs text-white/45">{t.paidBy} {SAMPLE_EMPLOYER.name} · {countryName(worker.country)}</p></div>
      </section>

      {!active && <section className={`${cardClass} mt-4 border border-amber-200/15 p-5`}><div className="flex items-start gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-amber-200" /><div><h2 className="font-medium">{t.setupTitle}</h2><p className="mt-1 text-sm leading-5 text-white/55">{t.setupText}</p><Link href="/payments/dashboard" className="mt-3 inline-block text-sm text-[#c4e794] underline underline-offset-4">{t.continueSetup}</Link></div></div></section>}

      <section aria-labelledby="cashout-heading" className={`${cardClass} mt-4 p-5 sm:p-6`}>
        <div className="flex items-start justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[.17em] text-white/40">{t.convertBalance}</p><h2 id="cashout-heading" className="mt-1 text-xl font-semibold">{t.cashOut}</h2></div><span className="rounded-md border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[.12em] text-white/40">{t.simulation}</span></div>
        <form onSubmit={openReview} className="mt-5 space-y-4">
          <label className="block text-sm text-white/70" htmlFor="cashout-amount">{t.amountConvert} <span className="mt-2 flex items-center rounded-lg border border-white/15 bg-[#0e131b] focus-within:border-[#a8dc55]"><span className="pl-3 text-white/40">$</span><input id="cashout-amount" value={amount} onChange={(e) => { setAmount(e.target.value); setLocalError(""); }} inputMode="decimal" placeholder="100.00" className="w-full bg-transparent px-2 py-3 text-white outline-none placeholder:text-white/25" aria-describedby="cashout-hint" /></span></label>
          <div id="cashout-hint" className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs text-white/40"><span>{t.available} {moneyFromCents(balanceCents)}</span><button type="button" disabled={!active || balanceCents <= 0} onClick={() => setAmount((balanceCents / 100).toFixed(2))} className="text-[#c4e794] underline underline-offset-4 disabled:opacity-40">{t.fullBalance}</button></div>
          {quote && <dl className="rounded-lg border border-white/[.08] bg-black/15 px-4 py-3 text-sm">
             <div className="flex justify-between py-1.5"><dt className="text-white/50">{t.rate}</dt><dd className="tabular-nums">1 USDC = Q{number2.format(7.7)} GTQ</dd></div>
             <div className="flex justify-between py-1.5"><dt className="text-white/50">{t.fee}</dt><dd className="tabular-nums">{moneyFromCents(quote.feeCents)}</dd></div>
             <div className="mt-1 flex justify-between border-t border-white/10 pt-3"><dt className="font-medium">{t.estimated}</dt><dd className="font-semibold tabular-nums text-[#c4e794]">Q{number2.format(quote.receiveCents / 100)} GTQ</dd></div>
          </dl>}
          {quoteError && <p className="text-xs text-rose-200/90">{quoteError}</p>}
          {localError && <p role="alert" className="rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{translatedError(localError)}</p>}
          {state.error && <div role="alert" className="flex items-start justify-between gap-3 rounded-lg border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100"><p>{translatedError(state.error)}</p><button type="button" onClick={() => dispatch({ type: "CLEAR_FEEDBACK" })} className="shrink-0 text-xs underline underline-offset-4">{t.dismiss}</button></div>}
          <div role="group" aria-label={t.destination} className="grid grid-cols-2 gap-2">{[["bank", t.bankTransfer], ["cash", t.cashPickup]].map(([key, label]) => <button key={key} type="button" aria-pressed={destination === key} onClick={() => setDestination(key)} className={`rounded-lg border px-3 py-3 text-sm transition ${destination === key ? "border-[#a8dc55]/70 bg-[#a8dc55]/[.08] text-white" : "border-white/10 bg-white/[.025] text-white/55 hover:text-white"}`}>{label}<span className="mt-1 block text-[10px] text-white/35">{t.destinationDemo}</span></button>)}</div>
          <button type="submit" disabled={!active || !amount || !!quoteError} className={primary}>{t.review}</button>
        </form>
        <p className="mt-3 text-xs leading-5 text-white/40">{t.explanation}</p>
      </section>

      {cashoutReceipt && <section role="status" className="mt-4 rounded-xl border border-[#a8dc55]/30 bg-[#a8dc55]/[.07] p-5"><p className="text-[11px] uppercase tracking-[.15em] text-[#c4e794]">{t.receipt} · {cashoutReceipt.id}</p><h2 className="mt-2 text-lg font-semibold">{t.simulated}</h2><p className="mt-1 text-sm text-white/55">{moneyFromCents(cashoutReceipt.amountCents)} {t.convertedTo} Q{number2.format(cashoutReceipt.receiveCents / 100)} GTQ · {cashoutReceipt.destination === "bank" ? t.bankTransfer.toLowerCase() : t.cashPickup.toLowerCase()}</p><p className="mt-1 text-xs text-white/45">{t.sampleFee} {moneyFromCents(cashoutReceipt.feeCents)} · {localizedDate(cashoutReceipt.date)}</p><p className="mt-2 text-xs text-white/45">{t.remaining} {moneyFromCents(balanceCents)} · {t.reference} {cashoutReceipt.id}</p><p className="mt-1 text-xs text-white/40">{t.noMoney}</p><button type="button" onClick={() => dispatch({ type: "CLEAR_FEEDBACK" })} className="mt-3 text-xs text-white/50 underline underline-offset-4">{t.dismissReceipt}</button></section>}

      <section aria-label={t.comingFeatures} className="mt-4 grid grid-cols-2 gap-3">{[[t.debitCard, t.cardUnavailable], [t.payBills, t.billsUnavailable]].map(([name, description]) => <article key={name} className={`${cardClass} p-4`}><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-medium">{name}</h2><Pill>{t.coming}</Pill></div><p className="mt-2 text-xs leading-5 text-white/45">{description}</p></article>)}</section>

      <section aria-labelledby="activity-heading" className={`${cardClass} mt-4 p-5 sm:p-6`}><div className="flex items-end justify-between"><div><p className="text-[11px] uppercase tracking-[.17em] text-white/40">{t.ledger}</p><h2 id="activity-heading" className="mt-1 text-xl font-semibold">{t.activity}</h2></div><span className="text-xs text-white/35">{activities.length} {t.entries}</span></div>
        {activities.length ? <ul className="mt-3 divide-y divide-white/[.08]">{activities.map((entry) => <li key={entry.id} className="flex items-center justify-between gap-4 py-3"><div className="min-w-0"><p className="truncate text-sm">{activityLabel(entry.label)}</p><p className="mt-1 text-xs text-white/40">{localizedDate(entry.date)}</p></div><span className={`shrink-0 font-mono text-sm tabular-nums ${entry.amountCents > 0 ? "text-[#c4e794]" : "text-white/75"}`}>{entry.amountCents > 0 ? "+" : "−"}{moneyFromCents(Math.abs(entry.amountCents))}</span></li>)}</ul> : <div className="mt-4 rounded-lg border border-dashed border-white/10 px-4 py-7 text-center"><p className="text-sm text-white/60">{t.noActivity}</p><p className="mt-1 text-xs text-white/35">{t.emptyActivity}</p></div>}
      </section>
      <footer className="mt-8 text-center text-xs text-white/35">{t.footer} <Link href="/payments/dashboard" className="text-white/55 underline underline-offset-4">{t.employerDashboard}</Link></footer>
    </div>
    <Dialog open={dialog} title={t.reviewCashout} close={closeDialog} closeLabel={t.close}>
      <p className="text-sm leading-6 text-white/55">{t.reviewText}</p>
      <dl className="mt-4 divide-y divide-white/10 rounded-lg border border-white/10 bg-black/10 px-4">
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">{t.fromBalance}</dt><dd className="font-mono">{moneyFromCents(quote?.amountCents)}</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">{t.fee}</dt><dd className="font-mono">{moneyFromCents(quote?.feeCents)}</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">{t.demoRate}</dt><dd>Q7.70 / USDC</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="text-white/50">{t.destination}</dt><dd>{destination === "bank" ? t.bankTransfer : t.cashPickup}</dd></div>
        <div className="flex justify-between gap-3 py-3 text-sm"><dt className="font-medium">{t.estimatedReceipt}</dt><dd className="font-semibold text-[#c4e794]">Q{number2.format((quote?.receiveCents || 0) / 100)} GTQ</dd></div>
      </dl>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={closeDialog} className="min-h-11 flex-1 rounded-lg border border-white/15 px-4 text-sm text-white/75 hover:bg-white/5">{t.back}</button><button type="button" disabled={busy} onClick={confirmCashout} className="min-h-11 flex-1 rounded-lg bg-[#a8dc55] px-4 font-semibold text-[#151b13] hover:bg-[#b9e873] disabled:opacity-45">{t.confirm}</button></div>
    </Dialog>
  </main>;
}
