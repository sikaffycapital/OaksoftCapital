"use client";

import { createContext, useContext, useReducer } from "react";
import { demoReducer, initialDemoState } from "@/lib/payments/demo.mjs";

const DemoContext = createContext(null);

export default function DemoProvider({ children }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, initialDemoState);
  return <DemoContext.Provider value={{ state, dispatch }}>{children}</DemoContext.Provider>;
}

export function usePayrollDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("Payroll previews must be inside DemoProvider.");
  return value;
}
