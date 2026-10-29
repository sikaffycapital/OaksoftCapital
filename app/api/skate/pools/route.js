// GET /api/skate/pools
// Skate's EVM pools + whether Skate reports maintenance mode.

import { SKATE_ENV, listEvmPools, skateApi, json } from "../_utils/skate";

export const dynamic = "force-dynamic";

export async function GET() {
  // Pause only on an explicit maintenance flag. If the status endpoint is unreachable,
  // stay open — every quote is still checked live, so a down API just shows "no quote".
  const status = await skateApi("config/status");
  const paused = status?.data?.maintenanceMode === "ON";

  return json({
    env: SKATE_ENV,
    paused,
    pools: listEvmPools(),
  });
}
