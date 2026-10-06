/**
 * Read-only DaVinci Resolve status and project info.
 * Safe to call freely — no mutations.
 */
import { callTool, listTools } from "./client";

export interface StatusInput {
  /** Bearer token for the bridge. Use {{secret:davinciBridgeToken}}. */
  token: string;
}

/**
 * Get Resolve running state and version via native get_resolve_status.
 *
 * @param params - Bridge token
 * @returns `{ running, version }` from native MCP (e.g. 21.1.1)
 *
 * @example
 * import { getStatus } from 'kody:@continuumpraxis/davinci/status'
 * await getStatus({ token: '{{secret:davinciBridgeToken}}' })
 */
export async function getStatus(params: StatusInput) {
  return callTool("get_resolve_status", {}, params.token);
}

/**
 * List timelines in the current project (run_script mapping of resolve_list_timelines).
 *
 * @param params - Bridge token
 * @returns Timeline names and current timeline
 *
 * @example
 * import { listTimelines } from 'kody:@continuumpraxis/davinci/status'
 * await listTimelines({ token: '{{secret:davinciBridgeToken}}' })
 */
export async function listTimelines(params: StatusInput) {
  return callTool("resolve_list_timelines", {}, params.token);
}

/**
 * Get the current timeline (run_script mapping of resolve_get_current_timeline).
 *
 * @param params - Bridge token
 * @returns Name, start/end frames, fps
 *
 * @example
 * import { getCurrentTimeline } from 'kody:@continuumpraxis/davinci/status'
 * await getCurrentTimeline({ token: '{{secret:davinciBridgeToken}}' })
 */
export async function getCurrentTimeline(params: StatusInput) {
  return callTool("resolve_get_current_timeline", {}, params.token);
}

/**
 * List native tools on the live bridge.
 *
 * @param params - Bridge token
 * @returns Native tool names
 *
 * @example
 * import { getTools } from 'kody:@continuumpraxis/davinci/status'
 * await getTools({ token: '{{secret:davinciBridgeToken}}' })
 */
export async function getTools(params: StatusInput) {
  return listTools(params.token);
}

/**
 * Default status export: native get_resolve_status wrapped with ok.
 *
 * @param params - Bridge token
 * @returns `{ ok, status }`
 *
 * @example
 * import davinciStatus from 'kody:@continuumpraxis/davinci/status'
 * await davinciStatus({ token: '{{secret:davinciBridgeToken}}' })
 */
export default async function davinciStatus(params: StatusInput = {} as StatusInput) {
  if (!params.token) {
    return {
      ok: false,
      error: "Missing token. Pass {{secret:davinciBridgeToken}}.",
    };
  }
  const status = await getStatus(params);
  return { ok: true, status };
}
