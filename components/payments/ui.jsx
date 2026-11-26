// components/payments/ui.jsx
// Small shared pieces for the Payments previews (formatters, card style,
// status pill, sample-data banner). Safe to use in server and client files.

import Link from "next/link";

export const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const number2 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const whole = new Intl.NumberFormat("en-US");

// Dates are stored as YYYY-MM-DD and shown in UTC so server and browser match.
export function formatDate(isoDay, empty = "Not paid yet") {
  if (!isoDay) return empty;
  return new Date(`${isoDay}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatStat(stat) {
  if (stat.format === "usd") return usd.format(stat.value);
  if (stat.format === "number") return whole.format(stat.value);
  if (stat.format === "percent") return `${Number(stat.value).toFixed(1)}%`;
  return String(stat.value);
}

export const cardClass =
  "rounded-2xl bg-[#161B26] shadow-[-6px_-4px_10.3px_0_rgba(75,84,98,0.20),_0_4px_20.6px_0_rgba(0,0,0,0.50)]";

export const TONES = {
  good: "bg-[#95E100]/15 text-[#95E100]",
  info: "bg-sky-400/15 text-sky-300",
  neutral: "bg-white/10 text-white/80",
  warn: "bg-amber-400/15 text-amber-300",
  bad: "bg-red-500/15 text-red-300",
};

export function Pill({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function SampleBanner({ children }) {
  return (
    <div
      role="note"
      className="mb-8 flex flex-col gap-3 rounded-[12px] border border-amber-300/30 bg-amber-300/10 px-5 py-4 md:flex-row md:items-center md:justify-between"
    >
      <p className="text-amber-100 text-[15px] leading-[22px]">
        <span className="font-semibold">Sample data.</span> {children}
      </p>
      <Link
        href="/payments#request-access"
        className="inline-flex shrink-0 justify-center items-center rounded-[8px] bg-[#95E100] text-black font-semibold px-5 py-2 text-[14px] hover:opacity-90"
      >
        Request access
      </Link>
    </div>
  );
}

export const eyebrowStyle = {
  fontFamily: "var(--font-abhaya-libre), serif",
  fontWeight: 800,
  fontSize: "16px",
  letterSpacing: "3px",
};
