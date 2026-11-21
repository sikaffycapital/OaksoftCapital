// lib/payments/sampleData.js
// SAMPLE DATA ONLY for the Oaksoft Payments previews:
//   /payments/dashboard (employer view) and /payments/wallet (worker view).
// Nothing here is real. Later we replace these exports with live data from
// the Stellar Disbursement Platform API. Keep the same shapes so the pages
// don't need to change.

// ---------- Employer view ----------

export const SAMPLE_EMPLOYER = {
  name: "Acme Staffing S.A.",
  type: "Staffing company",
  country: "Panama",
  plan: "Pilot",
  kybStatus: "Verified",
};

// format: "usd" | "number" | "percent" | "text"
export const SAMPLE_EMPLOYER_STATS = [
  {
    key: "payrollAccount",
    label: "Payroll account",
    value: 182400,
    format: "usd",
    hint: "Client funds, held in USD",
  },
  {
    key: "nextPayroll",
    label: "Next payroll",
    value: 96800,
    format: "usd",
    hint: "Dec 1 · 124 workers",
  },
  {
    key: "paidThisMonth",
    label: "Paid to workers this month",
    value: 96000,
    format: "usd",
    hint: "Nov 15 payroll",
  },
  {
    key: "activeWallets",
    label: "Workers with active wallets",
    value: "118 of 124",
    format: "text",
    hint: "6 invites pending",
  },
  {
    key: "successRate",
    label: "Payroll success rate",
    value: 99.2,
    format: "percent",
    hint: "Last 90 days",
  },
  {
    key: "delivery",
    label: "Average delivery",
    value: "6 sec",
    format: "text",
    hint: "On-chain leg",
  },
];

// status: "completed" | "processing" | "scheduled" | "needs_review" | "failed"
// date: YYYY-MM-DD (UTC)
export const SAMPLE_PAYROLL_RUNS = [
  {
    id: "PR-2412",
    name: "December 1 payroll",
    workers: 124,
    amountUsd: 96800,
    status: "scheduled",
    date: "2026-12-01",
  },
  {
    id: "PR-2411",
    name: "Performance bonuses",
    workers: 18,
    amountUsd: 9000,
    status: "processing",
    date: "2026-11-20",
  },
  {
    id: "PR-2410",
    name: "November 15 payroll",
    workers: 120,
    amountUsd: 96000,
    status: "completed",
    date: "2026-11-15",
  },
  {
    id: "PR-2409",
    name: "Contractor top-up",
    workers: 1,
    amountUsd: 950,
    status: "needs_review",
    date: "2026-11-14",
    note: "Worker hasn't accepted the wallet invite yet",
  },
  {
    id: "PR-2408",
    name: "November 1 payroll",
    workers: 119,
    amountUsd: 95200,
    status: "completed",
    date: "2026-11-01",
  },
  {
    id: "PR-2407",
    name: "Equipment stipend",
    workers: 1,
    amountUsd: 300,
    status: "failed",
    date: "2026-10-28",
    note: "Returned: worker ID check not complete",
  },
  {
    id: "PR-2406",
    name: "October 15 payroll",
    workers: 118,
    amountUsd: 94400,
    status: "completed",
    date: "2026-10-15",
  },
];

// wallet: "active" | "invited"
// kyc: "verified" | "pending"
export const SAMPLE_WORKERS = [
  {
    id: "W-101",
    name: "María López",
    role: "Customer support",
    country: "Panama",
    wallet: "active",
    kyc: "verified",
    preference: "Keeps USDC",
    lastPaid: "2026-11-15",
  },
  {
    id: "W-102",
    name: "Ana Morales",
    role: "Developer",
    country: "Guatemala",
    wallet: "active",
    kyc: "verified",
    preference: "Cashes out to bank",
    lastPaid: "2026-11-15",
  },
  {
    id: "W-103",
    name: "José Ramírez",
    role: "Sales",
    country: "El Salvador",
    wallet: "active",
    kyc: "verified",
    preference: "Keeps USDC",
    lastPaid: "2026-11-15",
  },
  {
    id: "W-104",
    name: "Lucía Torres",
    role: "Recruiter",
    country: "Panama",
    wallet: "active",
    kyc: "verified",
    preference: "Cash pickup",
    lastPaid: "2026-11-15",
  },
  {
    id: "W-105",
    name: "Carlos Hernández",
    role: "QA analyst",
    country: "Honduras",
    wallet: "invited",
    kyc: "pending",
    preference: "Not set yet",
    lastPaid: null,
  },
];

// ---------- Worker view ----------

// Illustrative local-currency units per USDC; never fetched or used as live quotes.
export const SAMPLE_RATES = {
  Guatemala: { code: "GTQ", symbol: "Q", rate: 7.7 },
  Honduras: { code: "HNL", symbol: "L", rate: 26.9 },
  Panama: { code: "USD", symbol: "$", rate: 1 },
  "El Salvador": { code: "USD", symbol: "$", rate: 1 },
};

export const SAMPLE_WALLET = {
  workerName: "Ana Morales",
  employer: "Acme Staffing S.A.",
  country: "Guatemala",
  balanceUsdc: 1840.5,
  localCurrency: "GTQ",
  localSymbol: "Q",
  sampleRate: 7.7, // SAMPLE ONLY: local currency per 1 USDC, not a quote
  sampleFeePct: 1, // SAMPLE ONLY: our cash-out fee, in percent
  bankLabel: "Bank account •••• 4417",
};

// type: "payroll" | "cashout"
// amountUsdc: positive = money in, negative = money out
export const SAMPLE_WALLET_ACTIVITY = [
  {
    id: "T-206",
    type: "payroll",
    label: "Salary from Acme Staffing",
    amountUsdc: 800,
    date: "2026-11-15",
  },
  {
    id: "T-205",
    type: "cashout",
    label: "Cash out to bank (GTQ)",
    amountUsdc: -300,
    date: "2026-11-10",
  },
  {
    id: "T-204",
    type: "payroll",
    label: "Salary from Acme Staffing",
    amountUsdc: 800,
    date: "2026-11-01",
  },
  {
    id: "T-203",
    type: "cashout",
    label: "Cash pickup",
    amountUsdc: -150,
    date: "2026-10-20",
  },
  {
    id: "T-202",
    type: "payroll",
    label: "Salary from Acme Staffing",
    amountUsdc: 800,
    date: "2026-10-15",
  },
];
