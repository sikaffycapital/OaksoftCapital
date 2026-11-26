// app/payments/page.jsx
// Public landing page for Oaksoft Payments (server component).

import Link from "next/link";
import RequestAccessForm from "@/components/payments/RequestAccessForm";
import PaydayPreview from "@/components/payments/PaydayPreview";
import { cardClass } from "@/components/payments/ui";
import BenefitPreviews from "@/components/payments/BenefitPreviews";

export const metadata = {
  title: "Payments | Oaksoft Capital",
  description:
    "A proposed USDC payroll wallet concept: remote workers may choose to hold or convert part of their pay. Pilot fit, custody, and country eligibility are under evaluation.",
};

const HIGHLIGHTS = [
  { value: "Your call", label: "hold pay in USDC or choose when to convert" },
  { value: "USDC", label: "a stablecoin designed to track the US dollar" },
  { value: "Prototype", label: "wallet setup and custody still require validation" },
];

const AUDIENCES = [
  {
    icon: "/assets/bills.svg",
    title: "Staffing companies",
    description:
      "A workflow to explore: prepare batch payroll and model a worker's USDC balance.",
  },
  {
    icon: "/assets/hugeicons_blockchain-02.svg",
    title: "Payroll providers & EORs",
    description:
      "Explore a payroll wallet model with a potential pilot or distribution partner.",
  },
  {
    icon: "/assets/icons8_bank-card.svg",
    title: "Remote-first employers",
    description:
      "Consider how dollar-denominated pay could fit existing worker and employer workflows.",
  },
  {
    icon: "/assets/iconamoon_send.svg",
    title: "Remote workers",
    description:
      "Explore holding all or part of pay in USDC, then choosing whether and when to convert.",
  },
];

const STEPS = [
  {
    title: "Fund payroll",
    description: "An employer or payroll partner funds a simulated USDC payroll.",
  },
  {
    title: "Pay in USDC",
    description: "The concept is a USDC-denominated wallet balance. Funding and custody models are still being evaluated.",
  },
  {
    title: "Worker decides",
    description: "Workers could hold all or part of pay in USDC, or choose a partial conversion when useful.",
  },
  {
    title: "Convert what is needed",
    description:
      "No automatic payday conversion is intended. Local cashout options, setup, and custody remain subject to validation.",
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
                Oaksoft Payments · Concept, exploring pilot fit
              </p>
              <h2 className="text-white font-bold tracking-[0.5px] text-[34px] leading-[40px] md:text-[56px] md:leading-[60px]">
                Pay your remote team in dollars they control
              </h2>
              <p className="mt-6 text-white/80 text-[16px] leading-[26px] md:text-[18px] md:leading-[30px] max-w-[640px]">
                A proposed payroll wallet lets workers choose whether to hold
                pay in USDC or convert part of it, and when. We&apos;re exploring
                potential distribution and pilot partners; wallet setup, custody,
                and country eligibility still need validation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#request-access"
                  className="inline-flex justify-center items-center rounded-[8px] bg-[#95E100] text-black font-semibold px-[28px] py-[16px] transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]"
                >
                  Request pilot information
                </a>
                <Link
                  href="/payments/wallet"
                  className="inline-flex justify-center items-center rounded-[8px] border border-white/30 text-white px-[24px] py-[16px] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#95E100] hover:text-[#95E100] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]"
                >
                  Explore worker wallet demo
                </Link>
              </div>
              <p className="mt-3 text-[13px] text-white/55">Browser-only simulation. No account, wallet, or live payments.</p>
              <p className="mt-4 text-white/60 text-[15px]">
                Employer or payroll team?{" "}
                <Link href="/payments/dashboard" className="text-[#95E100] underline underline-offset-4">
                  Explore the employer demo
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

      <section className="w-full pt-16">
        <div className="mx-auto w-full max-w-[1100px] px-4 lg:px-0">
          <SectionTitle>Ideas under review</SectionTitle>
          <p className="mx-auto -mt-4 mb-8 max-w-[680px] text-center text-[15px] leading-6 text-white/65">
            These are benefit concepts, not features or offers. Nothing can be enrolled in or activated here.
          </p>
          <BenefitPreviews />
        </div>
      </section>

      {/* Who it's for */}
      <section className="w-full pt-16">
        <div className="mx-auto w-full max-w-[1300px] px-4 lg:px-0">
          <SectionTitle>Potential fit to explore</SectionTitle>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((a) => (
              <div key={a.title} className={`${cardClass} p-[30px_25px] flex flex-col items-start gap-[18px] transition-transform duration-200 hover:-translate-y-1`}>
                {a.icon ? <img src={a.icon} alt="" className="w-[40px] h-[40px]" /> : <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#95E100]/30 bg-[#95E100]/10 text-[#95E100] text-lg font-semibold">API</span>}
                <div className="flex w-full items-center justify-between gap-2">
                  <h3 className="text-white font-medium text-[20px] leading-[26px] md:text-[22px]">{a.title}</h3>
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
          <SectionTitle>Example currencies to consider</SectionTitle>
          <p className="text-white/70 text-center text-[15px] leading-[24px] max-w-[680px] mx-auto -mt-4 mb-8">
            These African currencies are examples for exploring the problem of currency risk—not launch markets or confirmed payout coverage. Holding USDC does not guarantee purchasing power or a better exchange rate.
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
            We&apos;re gathering pilot interest from payroll providers, employers of record, staffing companies, and remote teams. Tell us about your organization; no enrollment or live service is offered here.
          </p>
          <div className="relative px-6 py-8 md:px-10 md:py-10" style={glassPanel}>
            <RequestAccessForm />
          </div>
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="text-center text-[13px] text-white/55">Browser-only simulation. No account, wallet, or live payments.</p>
            <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
              <a href="#request-access" className="inline-flex min-h-12 items-center justify-center rounded-[8px] bg-[#95E100] px-7 py-3 font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]">Request pilot information</a>
              <Link href="/payments/wallet" className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-white/30 px-7 py-3 text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-[#95E100] hover:text-[#95E100] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#95E100]">Explore worker wallet demo</Link>
            </div>
            <Link href="/payments/dashboard" className="text-sm text-[#95E100] underline underline-offset-4">Employer / payroll funding demo</Link>
          </div>
          <p className="mt-6 text-center text-white/40 text-[13px] leading-[20px]">
            Oaksoft Capital Management is evaluating a proposed payroll wallet concept. This is not a launched or licensed service. Pilot fit, providers, custody, country eligibility, and availability are not confirmed. USDC is not a bank deposit and may lose its dollar peg.
          </p>
        </div>
      </section>
    </div>
  );
}
