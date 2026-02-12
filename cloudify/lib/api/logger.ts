import { createLogger } from "@/lib/logging/logger";

export function getRouteLogger(routeName: string) {
  return createLogger(`api:${routeName}`);
}
