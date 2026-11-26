"use client";

// components/payments/RequestAccessForm.jsx
// "Request access" form on /payments. Posts to /api/payments/access-request.
// The option lists below MUST match the lists in that API route.

import { useState } from "react";

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

const EMPTY = {
  name: "",
  email: "",
  company: "",
  companyType: "",
  workerCount: "",
  workerCountry: "",
  monthlyPayroll: "",
  message: "",
  website: "", // honeypot, hidden from people
};

function validate(v) {
  const errors = {};
  if (!v.name.trim()) errors.name = "Enter your name";
  if (!v.email.trim()) errors.email = "Enter your work email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()))
    errors.email = "Enter a valid email";
  if (!v.company.trim()) errors.company = "Enter your company";
  if (!v.companyType) errors.companyType = "Pick what describes your company";
  if (!v.workerCount) errors.workerCount = "Pick how many workers you pay";
  if (!v.workerCountry)
    errors.workerCountry = "Pick where most of your workers are";
  if (!v.monthlyPayroll) errors.monthlyPayroll = "Pick a monthly payroll range";
  return errors;
}

const inputBase =
  "w-full rounded-[8px] bg-[#0F131B] border px-4 py-3 text-white text-[15px] placeholder:text-white/30 outline-none transition-colors focus:border-[#95E100]";

function fieldClass(hasError) {
  return `${inputBase} ${hasError ? "border-red-400/70" : "border-white/15"}`;
}

// One labelled field: a text input, or a select when `options` is given.
function Field({ id, name, label, type = "text", placeholder, autoComplete, options, value, error, onChange }) {
  const errorId = `${id}-error`;
  const shared = {
    id,
    name,
    value,
    onChange,
    "aria-invalid": !!error,
    "aria-describedby": error ? errorId : undefined,
    className: fieldClass(error),
  };

  return (
    <div>
      <label htmlFor={id} className="block text-white/80 text-[14px] mb-2">
        {label}
      </label>
      {options ? (
        <select {...shared}>
          <option value="">Select one</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : (
        <input {...shared} type={type} placeholder={placeholder} autoComplete={autoComplete} />
      )}
      {error && (
        <p id={errorId} className="mt-1 text-[13px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

export default function RequestAccessForm() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | submitting | success | error
  const [serverError, setServerError] = useState("");

  const onChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    setStatus("submitting");

    // Give up after 20 seconds so the button never spins forever.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);

    try {
      const res = await fetch("/api/payments/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.fields) setErrors(data.fields);
        setServerError(data?.error || "Something went wrong. Try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch (err) {
      setServerError(
        err?.name === "AbortError"
          ? "This is taking too long. Try again in a minute."
          : "Network error. Check your connection and try again.",
      );
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  };

  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[#95E100]/40 bg-[#95E100]/10 p-8 text-center"
      >
        <p
          className="text-[#95E100] uppercase mb-3"
          style={{
            fontFamily: "var(--font-abhaya-libre), serif",
            fontWeight: 800,
            fontSize: "22px",
            letterSpacing: "3px",
          }}
        >
          Request received
        </p>
        <p className="text-white text-[16px] leading-[26px]">
          Thanks, {values.name.trim().split(" ")[0]}. We&apos;ll reach out at{" "}
          <span className="text-[#95E100]">{values.email.trim()}</span> about
          the pilot.
        </p>
      </div>
    );
  }

  const f = (name) => ({ name, value: values[name], error: errors[name], onChange });

  return (
    <form onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* Honeypot: hidden from people and screen readers */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
        <label htmlFor="pay-website">Website</label>
        <input
          id="pay-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={onChange}
        />
      </div>

      <Field id="pay-name" label="Full name" placeholder="María López" autoComplete="name" {...f("name")} />
      <Field id="pay-email" label="Work email" type="email" placeholder="name@company.com" autoComplete="email" {...f("email")} />
      <Field id="pay-company" label="Company" placeholder="Acme Staffing S.A." autoComplete="organization" {...f("company")} />
      <Field id="pay-type" label="What best describes your company?" options={COMPANY_TYPES} {...f("companyType")} />
      <Field id="pay-workers" label="How many workers do you pay abroad?" options={WORKER_COUNTS} {...f("workerCount")} />
      <Field id="pay-country" label="Where are most of your workers?" options={WORKER_COUNTRIES} {...f("workerCountry")} />
      <Field id="pay-volume" label="Monthly payroll volume" options={PAYROLL_VOLUMES} {...f("monthlyPayroll")} />

      <div className="md:col-span-2">
        <label htmlFor="pay-message" className="block text-white/80 text-[14px] mb-2">
          Anything else? <span className="text-white/40">(optional)</span>
        </label>
        <textarea
          id="pay-message"
          name="message"
          rows={4}
          maxLength={1000}
          placeholder="How you pay your team today, which countries, timing"
          value={values.message}
          onChange={onChange}
          className={fieldClass(false)}
        />
      </div>

      <div className="md:col-span-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-white/50 text-[13px] leading-[20px] md:max-w-[60%]">
          We only use this to contact you about the Oaksoft Payments pilot.
        </p>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex w-full md:w-auto justify-center items-center rounded-[8px] bg-[#95E100] text-black font-semibold px-[41px] py-[16px] transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-wait"
        >
          {status === "submitting" ? "Sending…" : "Request access"}
        </button>
      </div>

      {serverError && (
        <p role="alert" className="md:col-span-2 text-[14px] text-red-300">
          {serverError}
        </p>
      )}
    </form>
  );
}
