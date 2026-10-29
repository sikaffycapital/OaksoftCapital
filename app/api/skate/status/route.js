// GET /api/skate/status?chainId&txHash
// Tracks a swap through Skate: source tx -> hub processing -> settlement on destination.

import { skateApi, json } from "../_utils/skate";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const q = new URL(req.url).searchParams;
  const chainId = Number(q.get("chainId"));
  const txHash = q.get("txHash");

  if (!Number.isInteger(chainId) || !/^0x[0-9a-fA-F]{64}$/.test(txHash || "")) {
    return json({ ok: false, error: "Bad params" }, { status: 400 });
  }

  // Same endpoint the SDK's apiGetActionDetails uses.
  const res = await skateApi(`action/chain/${chainId}/${txHash}`);
  if (!res) return json({ ok: false, error: "Status lookup failed" }, { status: 502 });

  const d = res.data;
  if (!d) return json({ ok: true, status: "PENDING_INDEX" }); // not indexed yet

  const tasks = Array.isArray(d.tasks) ? d.tasks : [];
  const settled = tasks.find((t) => t.destTxHash) || d;

  return json({
    ok: true,
    status: d.status, // ACTION_* or TASK_*
    destChainId: settled.destChainId ?? d.destChainId ?? null,
    destTxHash: settled.destTxHash ?? d.destTxHash ?? null,
    kernelTxHash: d.kernelTxHash ?? null,
  });
}
