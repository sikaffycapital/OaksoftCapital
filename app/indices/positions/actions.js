"use server";

import { headers } from "next/headers";
import { Cesto } from "@cesto/sdk";
import { getIndices } from "../../../lib/cestoIndices";
import { createChallenge, verifyProof, loadPositionData } from "./positions-data";

function isConfigured() {
  return Boolean(process.env.CESTO_SECRET_KEY && process.env.SESSION_SECRET);
}

async function requestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") || requestHeaders.get("host");
  if (!host) throw new Error("Unable to verify this website.");
  const protocol = requestHeaders.get("x-forwarded-proto") || "https";
  return `${protocol}://${host}`;
}

export async function createPositionsChallenge(wallet) {
  if (!isConfigured()) {
    return { ok: false, code: "not_configured", message: "Position tracking is not connected yet. The site owner needs to configure a read-only Cesto connection." };
  }
  try {
    const challenge = createChallenge(wallet, process.env.SESSION_SECRET, await requestOrigin());
    return { ok: true, ...challenge };
  } catch (error) {
    return { ok: false, code: "verification_error", message: error.message };
  }
}

export async function readPositions(proof) {
  if (!isConfigured()) {
    return { ok: false, code: "not_configured", message: "Position tracking is not connected yet." };
  }
  let wallet;
  try {
    wallet = verifyProof(proof, process.env.SESSION_SECRET, await requestOrigin());
  } catch (error) {
    return { ok: false, code: "verification_error", message: error.message };
  }
  try {
    const { items, live } = await getIndices();
    const client = new Cesto({ apiKey: process.env.CESTO_SECRET_KEY, timeout: 5000, maxRetries: 0 });
    const data = await loadPositionData(client, wallet, items);
    if (!live) data.warnings.push("The live basket catalogue is unavailable. Position coverage is limited to the saved catalogue.");
    return { ok: true, wallet, ...data };
  } catch {
    // Do not expose API responses, request headers, or credentials to the browser.
    return { ok: false, code: "positions_unavailable", message: "Cesto positions could not be loaded. Please retry or ask the site owner to check the read-only connection." };
  }
}
