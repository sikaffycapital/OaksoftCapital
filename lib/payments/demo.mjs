// Browser-only demonstration domain. Never signs, submits, or persists money.
import { SAMPLE_PAYROLL_RUNS, SAMPLE_WORKERS, SAMPLE_WALLET_ACTIVITY } from "./sampleData.js";

const MAX_CENTS = 1_000_000_000;
const fail = (message) => { throw new Error(message); };
const today = () => new Date().toISOString().slice(0, 10);

export function parseMoney(value) {
  const text = String(value ?? "").trim();
  if (!/^\d{1,8}(?:\.\d{1,2})?$/.test(text)) fail("Enter a positive amount with at most two decimal places.");
  const [whole, fraction = ""] = text.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0 || cents > MAX_CENTS) fail("Amount must be between $0.01 and $10,000,000.00.");
  return cents;
}

export function initialDemoState() {
  return {
    employerCents: 18_240_000,
    reservedCents: 9_680_000,
    paidCents: 9_600_000,
    workers: SAMPLE_WORKERS.map((w) => ({ ...w, stage: w.wallet === "active" ? "active" : "invited" })),
    balances: Object.fromEntries(SAMPLE_WORKERS.map((w) => [w.id, w.id === "W-102" ? 184_050 : 0])),
    runs: SAMPLE_PAYROLL_RUNS.map((r) => ({ ...r })),
    activities: Object.fromEntries(SAMPLE_WORKERS.map((w) => [w.id, w.id === "W-102"
      ? SAMPLE_WALLET_ACTIVITY.map((a) => ({ ...a, amountCents: Math.round(a.amountUsdc * 100) }))
      : []])),
    sequence: 1,
    error: null,
    lastReceipt: null,
  };
}

export function validatePayroll(state, rows) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 200) fail("Choose between 1 and 200 workers.");
  const seen = new Set();
  let total = 0;
  for (const row of rows) {
    const worker = state.workers.find((w) => w.id === row.workerId);
    if (!worker) fail(`Unknown worker: ${row.workerId || "(empty)"}.`);
    if (seen.has(worker.id)) fail(`Duplicate worker: ${worker.name}.`);
    if (worker.stage !== "active") fail(`${worker.name} must finish simulated onboarding first.`);
    if (!Number.isSafeInteger(row.amountCents) || row.amountCents <= 0 || row.amountCents > MAX_CENTS) fail(`Enter a valid amount for ${worker.name}.`);
    seen.add(worker.id);
    total += row.amountCents;
    if (!Number.isSafeInteger(total) || total > MAX_CENTS) fail("Payroll total exceeds the demo limit.");
    if ((state.balances[worker.id] || 0) + row.amountCents > MAX_CENTS) fail(`${worker.name}'s demo wallet would exceed its limit.`);
  }
  if (total > state.employerCents - state.reservedCents) fail("Not enough available payroll funds. Scheduled payroll reserves cannot be spent.");
  return total;
}

// Small RFC-style CSV reader: supports quotes, escaped quotes, CRLF and BOM.
function csvRecords(text) {
  const records = [];
  let record = [], cell = "", quoted = false, closed = false;
  const source = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (c === '"' && source[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { quoted = false; closed = true; }
      else cell += c;
    } else if (c === "," || c === "\n") {
      record.push(cell.trim()); cell = ""; closed = false;
      if (c === "\n") { if (record.some(Boolean)) records.push(record); record = []; }
    } else if (c === '"' && !cell && !closed) quoted = true;
    else if (closed && c.trim()) fail("Invalid CSV: unexpected text after a quoted field.");
    else if (c === '"') fail("Invalid CSV quotation.");
    else cell += c;
  }
  if (quoted) fail("Invalid CSV: an unclosed quoted field.");
  record.push(cell.trim());
  if (record.some(Boolean)) records.push(record);
  return records;
}

export function parsePayrollCsv(text, workers) {
  try {
    if (typeof text !== "string" || new TextEncoder().encode(text).length > 100 * 1024) fail("CSV must be no larger than 100 KB.");
    const records = csvRecords(text);
    const header = records.shift();
    if (!header || header.join(",") !== "worker_id,amount_usdc") fail("CSV header must be worker_id,amount_usdc.");
    if (!records.length || records.length > 200) fail("CSV must contain 1 to 200 payroll rows.");
    const rows = [], errors = [], seen = new Set();
    records.forEach((record, i) => {
      try {
        if (record.length !== 2) fail("Expected exactly two columns.");
        const [workerId, amount] = record;
        const worker = workers.find((w) => w.id === workerId);
        if (!worker) fail(`Unknown worker ${workerId || "(empty)"}.`);
        if (seen.has(workerId)) fail(`Duplicate worker ${workerId}.`);
        seen.add(workerId);
        if (worker.stage !== "active") fail(`${worker.name} is not active yet.`);
        rows.push({ workerId, amountCents: parseMoney(amount) });
      } catch (e) { errors.push(`Row ${i + 2}: ${e.message}`); }
    });
    return { rows: errors.length ? [] : rows, errors };
  } catch (e) { return { rows: [], errors: [e.message] }; }
}

export function quoteCashout(amountText, balanceCents) {
  const amountCents = parseMoney(amountText);
  if (amountCents > balanceCents) fail("That's more than your available balance.");
  const feeCents = Math.max(1, Math.round(amountCents / 100));
  const receiveCents = Math.round((amountCents - feeCents) * 770 / 100);
  if (receiveCents <= 0) fail("Amount is too small after the sample fee.");
  return { amountCents, feeCents, receiveCents };
}

function checkedName(value, label, max = 80) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > max) fail(`${label} must contain 1 to ${max} characters.`);
  return text;
}

export function demoReducer(state, action) {
  if (action.type === "RESET") return initialDemoState();
  if (action.type === "CLEAR_FEEDBACK") return { ...state, error: null, lastReceipt: null };
  try {
    const p = action.payload || {};
    const id = `DEMO-${String(state.sequence).padStart(4, "0")}`;
    const date = today();
    const base = { ...state, error: null, lastReceipt: null };
    if (action.type === "PAYROLL") {
      const name = checkedName(p.name, "Payroll name");
      const amountCents = validatePayroll(state, p.rows);
      const balances = { ...state.balances }, activities = { ...state.activities };
      for (const row of p.rows) {
        balances[row.workerId] = (balances[row.workerId] || 0) + row.amountCents;
        activities[row.workerId] = [{ id: `${id}-${row.workerId}`, label: `${name} · simulated payroll`, amountCents: row.amountCents, date, type: "payroll" }, ...(activities[row.workerId] || [])];
      }
      return { ...base, sequence: state.sequence + 1, employerCents: state.employerCents - amountCents,
        paidCents: state.paidCents + amountCents, balances, activities,
        workers: state.workers.map((w) => p.rows.some((r) => r.workerId === w.id) ? { ...w, lastPaid: date } : w),
        runs: [{ id, name, workers: p.rows.length, amountUsd: amountCents / 100, status: "completed", date, note: "Simulated transfer — no real money moved." }, ...state.runs],
        lastReceipt: { id, kind: "payroll", amountCents, date, count: p.rows.length } };
    }
    if (action.type === "CASHOUT") {
      const worker = state.workers.find((w) => w.id === p.workerId);
      if (!worker || worker.stage !== "active") fail("Complete simulated worker onboarding before cashing out.");
      if (!["bank", "cash"].includes(p.destination)) fail("Choose bank account or cash pickup.");
      const quote = quoteCashout(p.amountText, state.balances[worker.id] || 0);
      return { ...base, sequence: state.sequence + 1,
        balances: { ...state.balances, [worker.id]: state.balances[worker.id] - quote.amountCents },
        activities: { ...state.activities, [worker.id]: [{ id, type: "cashout", label: `Simulated ${p.destination === "bank" ? "bank cash-out" : "cash pickup"}`, amountCents: -quote.amountCents, date }, ...(state.activities[worker.id] || [])] },
        lastReceipt: { id, kind: "cashout", date, workerId: worker.id, destination: p.destination, ...quote } };
    }
    if (action.type === "FUND") {
      const amountCents = parseMoney(p.amountText);
      if (state.employerCents + amountCents > MAX_CENTS) fail("The account would exceed the demo limit.");
      return { ...base, employerCents: state.employerCents + amountCents, sequence: state.sequence + 1,
        lastReceipt: { id, kind: "fund", amountCents, date } };
    }
    if (action.type === "INVITE") {
      if (state.workers.length >= 200) fail("Demo supports up to 200 workers.");
      const name = checkedName(p.name, "Worker name");
      const role = checkedName(p.role, "Role");
      const country = checkedName(p.country, "Country");
      if (state.workers.some((w) => w.name.toLowerCase() === name.toLowerCase())) fail("A demo worker with this name already exists.");
      const workerId = `W-DEMO-${state.sequence}`;
      return { ...base, sequence: state.sequence + 1, workers: [...state.workers, { id: workerId, name, role, country, wallet: "invited", kyc: "pending", stage: "invited", preference: "Not set yet", lastPaid: null }],
        balances: { ...state.balances, [workerId]: 0 }, activities: { ...state.activities, [workerId]: [] } };
    }
    if (action.type === "SET_WORKER_STAGE") {
      const worker = state.workers.find((w) => w.id === p.workerId);
      const next = { invited: "verification_pending", verification_pending: "active" };
      if (!worker || !next[worker.stage] || next[worker.stage] !== p.stage) fail("Follow the simulated invitation and verification steps in order.");
      return { ...base, workers: state.workers.map((w) => w.id !== worker.id ? w : { ...w, stage: p.stage,
        wallet: p.stage === "active" ? "active" : "invited", kyc: p.stage === "active" ? "verified" : "pending" }) };
    }
    return state;
  } catch (e) { return { ...state, error: e.message, lastReceipt: null }; }
}
