// app/api/payments/access-request/route.js
// Saves "Request access" submissions from /payments to Firestore
// (collection: payments_access_requests). Public endpoint, no login needed.
export const runtime = "nodejs";

import { NextResponse } from "next/server";

// These lists MUST match components/payments/RequestAccessForm.jsx
const COMPANY_TYPES = [
  "Staffing company",
  "Nearshore or BPO firm",
  "Business with remote workers",
  "Other",
];

const WORKER_COUNTS = ["1-10", "11-50", "51-200", "200+"];

const WORKER_COUNTRIES = [
  "Panama",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "Other Latin American country",
  "Outside Latin America",
];

const PAYROLL_VOLUMES = [
  "Under $25k",
  "$25k-$100k",
  "$100k-$500k",
  "$500k+",
];

// If Firestore doesn't answer in 10 seconds, stop waiting and tell the user.
const SAVE_TIMEOUT_MS = 10000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function clean(value, max) {
  return String(value ?? "")
    .trim()
    .slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req) {
  // 1) Read the JSON body
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // 2) Honeypot: real people never fill the hidden "website" field.
  //    Bots do. Pretend it worked and save nothing.
  if (clean(body?.website, 200)) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // 3) Clean and validate every field
  const data = {
    name: clean(body?.name, 120),
    email: clean(body?.email, 200).toLowerCase(),
    company: clean(body?.company, 160),
    companyType: clean(body?.companyType, 60),
    workerCount: clean(body?.workerCount, 20),
    workerCountry: clean(body?.workerCountry, 60),
    monthlyPayroll: clean(body?.monthlyPayroll, 40),
    message: clean(body?.message, 1000),
  };

  const errors = {};
  if (!data.name) errors.name = "Enter your name";
  if (!data.email) errors.email = "Enter your work email";
  else if (!isValidEmail(data.email)) errors.email = "Enter a valid email";
  if (!data.company) errors.company = "Enter your company";
  if (!COMPANY_TYPES.includes(data.companyType))
    errors.companyType = "Pick what describes your company";
  if (!WORKER_COUNTS.includes(data.workerCount))
    errors.workerCount = "Pick how many workers you pay";
  if (!WORKER_COUNTRIES.includes(data.workerCountry))
    errors.workerCountry = "Pick where most of your workers are";
  if (!PAYROLL_VOLUMES.includes(data.monthlyPayroll))
    errors.monthlyPayroll = "Pick a monthly payroll range";

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { error: "Check the highlighted fields", fields: errors },
      { status: 400 },
    );
  }

  // 4) Save to Firestore. firebaseAdmin is imported here (not at the top)
  //    so a missing env var returns a clean error instead of crashing.
  try {
    const { adminDB } = await import("@/lib/firebaseAdmin");
    const now = new Date();

    const ref = await withTimeout(
      adminDB.collection("payments_access_requests").add({
        ...data,
        status: "new",
        source: "payments_landing_v2",
        createdAt: now.getTime(),
        createdAtIso: now.toISOString(),
        userAgent: clean(req.headers.get("user-agent"), 300),
      }),
      SAVE_TIMEOUT_MS,
    );

    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch (e) {
    console.error("[payments] access request save failed:", e);
    return NextResponse.json(
      { error: "We couldn't save your request. Try again in a minute." },
      { status: 500 },
    );
  }
}
