/**
 * Liveness probe endpoint.
 *
 * Returns 200 if the process is alive. No dependency checks.
 * Used by K8s liveness probe to determine if the container
 * should be restarted.
 */

import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({ status: "alive" });
}
