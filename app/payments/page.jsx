// app/payments/page.jsx
// Public landing page for Oaksoft Payments (server component).

import Link from "next/link";
import RequestAccessForm from "@/components/payments/RequestAccessForm";
import PaydayPreview from "@/components/payments/PaydayPreview";
import { cardClass } from "@/components/payments/ui";

export const metadata = {
  title: "Payments | Oaksoft Capital",
  description:
    "Dollar payroll for remote teams in markets exposed to currency risk. Fund payroll in USD; workers hold digital dollars and choose when to convert. Private pilot.",
};

const HIGHLIGHTS = [
  { value: "Seconds", label: "for pay to reach a worker on Stellar" },
  { value: "USDC", label: "a dollar-backed stablecoin" },
  { value: "Their keys", label: "each worker controls their own wallet" },
];

const AUDIENCES = [
  {
    icon: "/assets/bills.svg",
    title: "Staffing companies",
    description:
      "Run payroll for every placed worker from one dashboard, in one batch, from a CSV.",
  },
  {
    icon: "/assets/hugeicons_blockchain-02.svg",
    title: "Nearshore and BPO teams",
    description:
      "Pay agents and developers across borders without a wire per person.",
  },
  {
    icon: "/assets/icons8_bank-card.svg",
    title: "Businesses with remote workers",
    description:
      "Pay contractors abroad in dollars, with every payment's status in one place.",
  },
  {
    icon: "/assets/iconamoon_send.svg",
    title: "Remote workers",
    description:
      "Hold your pay in dollars and convert to local currency when the rate suits you, not on the bank's schedule.",
  },
  {
    title: "Payroll platforms",
    description: "Connect your payroll system by API and pay workers in USDC.",
    coming: true,
  },
];

const STEPS = [
  {
    title: "Fund payroll",
    description: "The employer funds payroll in USD from the dashboard.",
  },
  {
    title: "Convert to USDC",
    description: "We convert it 1:1 into USDC, digital dollars on the Stellar network.",
  },
  {
    title: "Pay every worker",
    description: "Each worker is paid in seconds, into a wallet they control.",
  },
  {
    title: "Workers choose",
    description:
      "Keep dollars, cash out to a bank account or at a cash pickup point. Card and bill pay are coming.",
  },
];

const CORRIDORS = [
  { to: "Nigeria", currency: "Nigerian naira" },
  { to: "Ghana", currency: "Ghanaian cedi" },
  { to: "Egypt", currency: "Egyptian pound" },
  { to: "Ethiopia", currency: "Ethiopian birr" },
  { to: "Malawi", currency: "Malawian kwacha" },
  { to: "Angola", currency: "Angolan kwanza" },
];

const titleStyle = {
  fontFamily: "var(--font-abhaya-libre), serif",
  fontWeight: 800,
};

const glassPanel = {
  borderRadius: "12.917px",
  border: "2.348px solid rgba(255, 255, 255, 0.10)",
  background:
    "linear-gradient(149deg, rgba(255, 255, 255, 0.05) 3.34%, rgba(25, 120, 237, 0.10) 102.38%)",
  boxShadow: "0 14.091px 137.856px 0 rgba(0, 0, 0, 0.25)",
  backdropFilter: "blur(20.138256072998047px)",
};

function SectionTitle({ children }) {
  return (
    <h2
      className="text-white uppercase text-center mb-10"
      style={{
        ...titleStyle,
        fontSize: "clamp(22px, 4vw, 32px)",
        letterSpacing: "clamp(2px, 0.8vw, 6px)",
        lineHeight: 1.3,
      }}
    >
      {children}
    </h2>
  );
}

export default function PaymentsPage() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Page title (same style as the other pages) */}
      <div className="flex justify-center pt-[60px] mb-[60px] px-4">
        <h1
          className="text-white text-center align-middle uppercase"
          style={{
            ...titleStyle,
            fontSize: "clamp(32px, 6vw, 48px)",
            lineHeight: "1.3",
            letterSpacing: "clamp(4px, 1.2vw, 11px)",
          }}
        >
          Payments
        </h1>
      </div>

      {/* Hero */}
      <section className="w-full">
        <div className="mx-auto w-full max-w-[1300px] px-4 py-6 lg:px-0">
          <div
            className="flex flex-col gap-10 px-6 py-10 md:px-10 md:py-[50px] lg:flex-row lg:items-center"
            style={glassPanel}
          >
            <div className="lg:flex-[0_0_58%] lg:min-w-0">
              <p
                className="text-[#95E100] uppercase mb-4"
                style={{ ...titleStyle, fontSize: "15px", letterSpacing: "3px" }}
              >
                Oaksoft Payments · Private pilot
              </p>
              <h2 className="text-white font-bold tracking-[0.5px] text-[34px] leading-[40px] md:text-[56px] md:leading-[60px]">
                Pay your remote team in dollars they control
              </h2>
              <p className="mt-6 text-white/80 text-[16px] leading-[26px] md:text-[18px] md:leading-[30px] max-w-[640px]">
                Fund payroll in USD from one dashboard. Each worker gets a USDC
                wallet they control and converts to local currency only when
                they choose, instead of taking the bank&apos;s rate on payday.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#request-access"
                  className="inline-flex justify-center items-center rounded-[8px] bg-[#95E100] text-black font-semibold px-[28px] py-[16px] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]"
                >
                  Request access
                </a>
                <Link
                  href="/payments/dashboard"
                  className="inline-flex justify-center items-center rounded-[8px] border border-white/30 text-white px-[24px] py-[16px] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#95E100] hover:text-[#95E100] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]"
                >
                  Try the demo, no sign-up
                </Link>
              </div>
              <p className="mt-3 text-[13px] text-white/55">Free preview. No account or wallet needed.</p>
              <p className="mt-4 text-white/60 text-[15px]">
                Paid by an employer?{" "}
                <Link href="/payments/wallet" className="text-[#95E100] underline underline-offset-4">
                  See the worker wallet
                </Link>
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1 lg:flex-1">
              {HIGHLIGHTS.map((h) => (
                <div key={h.value} className="rounded-[12px] border border-white/10 bg-black/20 px-6 py-5">
                  <p className="text-[#95E100] font-bold text-[28px] leading-[34px] md:text-[34px] md:leading-[40px]">
                    {h.value}
                  </p>
                  <p className="text-white/70 text-[15px] leading-[22px]">{h.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PaydayPreview />

      {/* Who it's for */}
      <section className="w-full pt-16">
        <div className="mx-auto w-full max-w-[1300px] px-4 lg:px-0">
          <SectionTitle>Built for</SectionTitle>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className={`${cardClass} p-[30px_25px] flex flex-col items-start gap-[18px] transition-transform duration-200 hover:-translate-y-1`}>
                {a.icon ? <img src={a.icon} alt="" className="w-[40px] h-[40px]" /> : <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#95E100]/30 bg-[#95E100]/10 text-[#95E100] text-lg font-semibold">API</span>}
                <div className="flex w-full items-center justify-between gap-2">
                  <h3 className="text-white font-medium text-[20px] leading-[26px] md:text-[22px]">{a.title}</h3>
                  {a.coming && <span className="shrink-0 rounded-full border border-white/15 bg-white/[.05] px-2.5 py-1 text-[11px] text-white/65">Coming</span>}
                </div>
                <p className="text-white/80 text-[15px] leading-[24px]">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full pt-20">
        <div className="mx-auto w-full max-w-[1300px] px-4 lg:px-0">
          <SectionTitle>How it works</SectionTitle>
          <ol className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className={`${cardClass} p-[30px_25px]`}>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#95E100] text-black font-bold text-[18px]"
                  aria-hidden="true"
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-white font-medium text-[22px] leading-[28px]">{s.title}</h3>
                <p className="mt-2 text-white/80 text-[15px] leading-[24px]">{s.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Corridors */}
      <section className="w-full pt-20">
        <div className="mx-auto w-full max-w-[1300px] px-4 lg:px-0">
          <SectionTitle>Where workers get paid</SectionTitle>
          <p className="text-white/70 text-center text-[15px] leading-[24px] max-w-[680px] mx-auto -mt-4 mb-8">
            We focus on markets where currency volatility and devaluation can
            erode the value of a paycheck. These African markets illustrate where
            holding pay in digital dollars could help workers manage currency risk.
            Examples only; payout availability is not yet confirmed.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CORRIDORS.map((c) => {
              return (
                <div key={c.to} className="rounded-[12px] border border-white/10 bg-black/20 px-6 py-5">
                  <span
                    className="inline-flex rounded-full bg-[#95E100]/15 px-3 py-1 text-[12px] font-medium text-[#95E100]"
                  >
                    Example market
                  </span>
                  <p className="mt-4 text-white text-[18px] font-medium leading-[24px]">{c.to}</p>
                  <p className="text-white/60 text-[14px]">Local currency: {c.currency}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Request access */}
      <section id="request-access" className="w-full pt-20 pb-20 scroll-mt-8">
        <div className="mx-auto w-full max-w-[900px] px-4 lg:px-0">
          <SectionTitle>Request access</SectionTitle>
          <p className="text-white/70 text-center text-[15px] leading-[24px] max-w-[640px] mx-auto -mt-4 mb-8">
            We&apos;re onboarding a small group of pilot employers. Tell us about
            your team and we&apos;ll be in touch.
          </p>
          <div className="relative px-6 py-8 md:px-10 md:py-10" style={glassPanel}>
            <RequestAccessForm />
          </div>
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-center text-[13px] text-white/55">Free preview. No account or wallet needed.</p>
            <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
              <a href="#request-access" className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-[#95E100] px-7 py-3 font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]">Request access</a>
              <Link href="/payments/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-white/30 px-7 py-3 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#95E100] hover:text-[#95E100] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]">Try the demo, no sign-up</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-white/40 text-[13px] leading-[20px]">
            Oaksoft Payments is in a private pilot. Availability depends on your
            workers&apos; countries and our partners&apos; coverage.
          </p>
        </div>
      </section>
    </div>
  );
}
