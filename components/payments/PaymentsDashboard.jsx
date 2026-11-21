"use client";

// components/payments/PaymentsDashboard.jsx
// Employer dashboard PREVIEW for Oaksoft Payments. Sample data only.
// Later the sample imports get replaced with live data from our API.

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  SAMPLE_EMPLOYER,
  SAMPLE_EMPLOYER_STATS,
  SAMPLE_PAYROLL_RUNS,
  SAMPLE_WORKERS,
} from "@/lib/payments/sampleData";
import {
  usd,
  formatDate,
  formatStat,
  cardClass,
  Pill,
  SampleBanner,
  eyebrowStyle,
} from "@/components/payments/ui";

const RUN_STATUS = {
  completed: { label: "Completed", tone: "good" },
  processing: { label: "Processing", tone: "info" },
  scheduled: { label: "Scheduled", tone: "neutral" },
  needs_review: { label: "Needs review", tone: "warn" },
  failed: { label: "Failed", tone: "bad" },
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "completed", label: "Completed" },
  { key: "processing", label: "Processing" },
  { key: "scheduled", label: "Scheduled" },
  { key: "needs_review", label: "Needs review" },
  { key: "failed", label: "Failed" },
];

const ACTIONS = [
  { key: "run", label: "Run payroll", icon: "/assets/iconamoon_send.svg" },
  { key: "csv", label: "Upload payroll CSV", icon: "/assets/bills.svg" },
  { key: "fund", label: "Fund account", icon: "/assets/icons8_bank-card.svg" },
  { key: "invite", label: "Invite workers", icon: "/assets/system-uicons_graph-bar.svg" },
];

export default function PaymentsDashboard() {
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const counts = useMemo(() => {
    const c = { all: SAMPLE_PAYROLL_RUNS.length };
    for (const r of SAMPLE_PAYROLL_RUNS) c[r.status] = (c[r.status] || 0) + 1;
    return c;
  }, []);

  const runs = useMemo(
    () =>
      filter === "all"
        ? SAMPLE_PAYROLL_RUNS
        : SAMPLE_PAYROLL_RUNS.filter((r) => r.status === filter),
    [filter],
  );

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-[1300px] px-4 pt-[40px] pb-16 lg:px-0">
        <SampleBanner>
          This is a preview of the employer dashboard. No real money moves here.
        </SampleBanner>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-white/60 uppercase mb-2" style={eyebrowStyle}>
              Employer dashboard
            </p>
            <h1 className="text-white font-bold text-[30px] leading-[36px] md:text-[40px] md:leading-[46px]">
              {SAMPLE_EMPLOYER.name}
            </h1>
            <p className="mt-1 text-white/60 text-[15px]">
              {SAMPLE_EMPLOYER.type} · {SAMPLE_EMPLOYER.country} ·{" "}
              {SAMPLE_EMPLOYER.plan} client
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="good">KYB {SAMPLE_EMPLOYER.kybStatus.toLowerCase()}</Pill>
            <Link
              href="/payments/wallet"
              className="text-[14px] text-[#95E100] underline underline-offset-4"
            >
              See what workers see
            </Link>
          </div>
        </div>

        {/* Stats */}
        <section aria-label="Account summary" className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {SAMPLE_EMPLOYER_STATS.map((s) => (
            <div key={s.key} className={`${cardClass} p-5`}>
              <p className="text-white/60 text-[13px] leading-[18px] md:text-[14px]">{s.label}</p>
              <p className="mt-2 text-white font-semibold tabular-nums text-[20px] leading-[26px] md:text-[28px] md:leading-[34px] break-words">
                {formatStat(s)}
              </p>
              {s.hint && <p className="mt-1 text-white/40 text-[12px] md:text-[13px]">{s.hint}</p>}
            </div>
          ))}
        </section>

        {/* Quick actions */}
        <section aria-label="Quick actions" className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setNotice(`${a.label} goes live with the pilot. Request access to join.`)}
              className="flex items-center justify-center gap-3 rounded-[8px] border border-white/15 bg-white/5 px-4 py-4 text-white transition-colors hover:border-[#95E100] hover:text-[#95E100] cursor-pointer"
            >
              <img src={a.icon} alt="" className="h-6 w-6" />
              <span className="text-[15px] font-medium">{a.label}</span>
            </button>
          ))}
        </section>

        {notice && (
          <div
            role="status"
            className="mt-3 flex flex-col gap-2 rounded-[8px] border border-[#95E100]/40 bg-[#95E100]/10 px-4 py-3 text-[14px] text-white sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{notice}</span>
            <div className="flex items-center gap-4">
              <Link href="/payments#request-access" className="text-[#95E100] underline underline-offset-4">
                Request access
              </Link>
              <button type="button" onClick={() => setNotice("")} className="text-white/60 hover:text-white cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Payroll runs + workers */}
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section aria-labelledby="runs-heading" className={`${cardClass} p-5 md:p-6 lg:col-span-2`}>
            <div className="flex flex-col gap-4">
              <h2 id="runs-heading" className="text-white font-semibold text-[20px] md:text-[24px]">
                Payroll runs
              </h2>
              <div role="group" aria-label="Filter payroll runs by status" className="flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                  const active = filter === f.key;
                  return (
                    <button
                      key={f.key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setFilter(f.key)}
                      className={`rounded-full px-3 py-1.5 text-[13px] transition-colors cursor-pointer ${
                        active ? "bg-[#95E100] text-black font-semibold" : "bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {f.label}{" "}
                      <span className={active ? "text-black/60" : "text-white/40"}>{counts[f.key] || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="mt-5 divide-y divide-white/10">
              {runs.map((r) => {
                const s = RUN_STATUS[r.status] || RUN_STATUS.scheduled;
                return (
                  <li key={r.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                    <div className="min-w-0">
                      <p className="text-white text-[16px] font-medium">{r.name}</p>
                      <p className="text-white/50 text-[13px] leading-[20px]">
                        {r.id} · {r.workers} {r.workers === 1 ? "worker" : "workers"} · {formatDate(r.date)}
                      </p>
                      {r.note && <p className="text-amber-200/80 text-[13px] leading-[20px]">{r.note}</p>}
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                      <span className="text-white text-[16px] font-semibold tabular-nums">{usd.format(r.amountUsd)}</span>
                      <Pill tone={s.tone}>{s.label}</Pill>
                    </div>
                  </li>
                );
              })}
              {runs.length === 0 && (
                <li className="py-8 text-center text-white/50 text-[14px]">No payroll runs with this status.</li>
              )}
            </ul>
          </section>

          <section aria-labelledby="workers-heading" className={`${cardClass} p-5 md:p-6`}>
            <h2 id="workers-heading" className="text-white font-semibold text-[20px] md:text-[24px]">
              Workers
            </h2>
            <p className="mt-1 text-white/50 text-[13px]">
              Showing {SAMPLE_WORKERS.length} of 124 · each holds their own wallet
            </p>
            <ul className="mt-4 divide-y divide-white/10">
              {SAMPLE_WORKERS.map((w) => (
                <li key={w.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-white text-[15px] font-medium leading-[22px]">{w.name}</p>
                    <Pill tone={w.wallet === "active" ? "good" : "warn"}>
                      {w.wallet === "active" ? "Wallet active" : "Invite sent"}
                    </Pill>
                  </div>
                  <p className="mt-1 text-white/50 text-[13px] leading-[20px]">
                    {w.role} · {w.country} · KYC {w.kyc}
                  </p>
                  <p className="text-white/40 text-[12px] leading-[18px]">
                    {w.preference} · Last paid: {formatDate(w.lastPaid)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <p className="mt-10 text-center text-white/40 text-[13px]">
          Every number on this page is sample data for illustration only.
        </p>
      </div>
    </div>
  );
}
