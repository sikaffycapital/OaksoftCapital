import test from "node:test";
import assert from "node:assert/strict";
import { initialDemoState, parseMoney, parsePayrollCsv, validatePayroll, quoteCashout, demoReducer } from "./demo.mjs";

const pay = (state, amountCents = 80000) => demoReducer(state, { type: "PAYROLL", payload: { name: "Weekly payroll", rows: [{ workerId: "W-102", amountCents }] } });

test("strict integer money avoids truncation, exponents and sub-cent values", () => {
  assert.equal(parseMoney("100.01"), 10001);
  for (const bad of ["", "0", "-1", "1.001", "1e4", "Infinity", "NaN", "=100", "10000001"]) assert.throws(() => parseMoney(bad));
});
test("payroll conserves funds and updates Ana's history exactly", () => {
  const before = initialDemoState(), after = pay(before);
  assert.equal(after.employerCents, before.employerCents - 80000);
  assert.equal(after.balances["W-102"], 264050);
  assert.equal(after.reservedCents, before.reservedCents);
  assert.equal(after.runs.length, before.runs.length + 1);
  assert.equal(after.activities["W-102"][0].amountCents, 80000);
  assert.equal(before.balances["W-102"], 184050);
});
test("scheduled funds cannot be spent; invalid rows are atomic", () => {
  const s = initialDemoState();
  for (const rows of [[], [{ workerId: "W-105", amountCents: 100 }], [{ workerId: "unknown", amountCents: 100 }], [{ workerId: "W-102", amountCents: 0 }], [{ workerId: "W-102", amountCents: 1.5 }], [{ workerId: "W-102", amountCents: 100 }, { workerId: "W-102", amountCents: 100 }]]) assert.throws(() => validatePayroll(s, rows));
  const after = pay(s, s.employerCents - s.reservedCents + 1);
  assert.ok(after.error);
  assert.equal(after.employerCents, s.employerCents);
  assert.equal(after.balances, s.balances);
});
test("CSV headers, quoted values, BOM and CRLF parse; rejects malformed and unsafe rows", () => {
  const workers = initialDemoState().workers;
  assert.deepEqual(parsePayrollCsv('\uFEFFworker_id,amount_usdc\r\n"W-102","800.00"\r\n', workers), { rows: [{ workerId: "W-102", amountCents: 80000 }], errors: [] });
  for (const csv of ["bad,header\nW-102,100", "worker_id,amount_usdc\n", "worker_id,amount_usdc\nW-102,1\nW-102,2", "worker_id,amount_usdc\nW-105,1", 'worker_id,amount_usdc\n"W-102,100', "worker_id,amount_usdc\nW-102,=100", "worker_id,amount_usdc\nW-102,1,2", "worker_id,amount_usdc\nunknown,1", "a".repeat(102401)]) assert.ok(parsePayrollCsv(csv, workers).errors.length);
  assert.equal(parsePayrollCsv("worker_id,amount_usdc\n" + Array(201).fill("W-102,1").join("\n"), workers).rows.length, 0);
});
test("sample quote is Q762.30 for 100 USDC and cashout deducts only once per action", () => {
  assert.deepEqual(quoteCashout("100", 184050), { amountCents: 10000, feeCents: 100, receiveCents: 76230 });
  const s = initialDemoState();
  const after = demoReducer(s, { type: "CASHOUT", payload: { workerId: "W-102", amountText: "100", destination: "bank" } });
  assert.equal(after.balances["W-102"], 174050);
  assert.equal(after.lastReceipt.receiveCents, 76230);
  assert.equal(after.activities["W-102"][0].amountCents, -10000);
  assert.throws(() => quoteCashout("1840.51", 184050));
  assert.throws(() => quoteCashout("0.01", 184050));
  const bad = demoReducer(s, { type: "CASHOUT", payload: { workerId: "W-102", amountText: "100", destination: "invalid" } });
  assert.ok(bad.error); assert.equal(bad.balances, s.balances);
});
test("onboarding cannot skip verification; activated worker can receive payroll", () => {
  let s = initialDemoState();
  const skipped = demoReducer(s, { type: "SET_WORKER_STAGE", payload: { workerId: "W-105", stage: "active" } });
  assert.ok(skipped.error);
  for (const stage of ["verification_pending", "active"]) s = demoReducer(s, { type: "SET_WORKER_STAGE", payload: { workerId: "W-105", stage } });
  assert.equal(s.workers.find((w) => w.id === "W-105").kyc, "verified");
  assert.equal(validatePayroll(s, [{ workerId: "W-105", amountCents: 100 }]), 100);
});
test("invites, funding, reset and feedback are simulated and bounded", () => {
  let s = initialDemoState();
  s = demoReducer(s, { type: "INVITE", payload: { name: "Demo Worker", role: "Engineer", country: "Guatemala" } });
  assert.equal(s.workers.length, 6); assert.equal(s.workers[5].stage, "invited");
  s = demoReducer(s, { type: "FUND", payload: { amountText: "500" } });
  assert.equal(s.employerCents, 18290000);
  assert.equal(s.lastReceipt.kind, "fund");
  s = demoReducer(s, { type: "CLEAR_FEEDBACK" }); assert.equal(s.lastReceipt, null);
  s = demoReducer(s, { type: "RESET" }); assert.equal(s.workers.length, 5); assert.equal(s.employerCents, 18240000);
});
