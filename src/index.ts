/**
 * @continuumpraxis/davinci — Drive DaVinci Resolve Studio 21.1 through Kody.
 *
 * Tunnel fronts the native ResolveMCP HTTP wrapper (14 tools). Legacy
 * resolve_* names still work via callTool mapping (direct alias or run_script).
 */
export { callTool, listTools } from "./client";
export { getStatus, listTimelines, getCurrentTimeline, getTools } from "./status";
export {
  setTimeline,
  duplicateTimeline,
  getPlayhead,
  setPlayhead,
  getClipTransform,
  setClipTransform,
} from "./timeline";
export { NATIVE_TOOLS, DIRECT_ALIAS, GAP_TOOLS, LEGACY_TOOLS } from "./mapping";

import { getStatus } from "./status";

/**
 * Quick Resolve status check via native get_resolve_status.
 *
 * @param params - Bridge bearer token
 * @returns `{ ok: true, status: { running, version } }`
 *
 * @example
 * import davinci from 'kody:@continuumpraxis/davinci'
 * const result = await davinci({ token: '{{secret:davinciBridgeToken}}' })
 */
export default async function davinci(params: { token: string }) {
  if (!params?.token) {
    return {
      ok: false,
      error: "Missing token. Pass {{secret:davinciBridgeToken}}.",
    };
  }
  const status = await getStatus(params);
  return { ok: true, status };
}
