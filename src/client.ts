/**
 * MCP client for the Continuum Praxis DaVinci tunnel.
 *
 * Tunnel: https://davinci.continuumpraxisapp.com/mcp → native wrapper 127.0.0.1:8795
 * Auth: Bearer via {{secret:davinciBridgeToken}} — never in code.
 * Protocol: MCP Streamable HTTP (initialize → session → tools/call).
 *
 * callTool accepts native 14-tool names and the old 77 resolve_* names.
 */

import { DIRECT_ALIAS, GAP_TOOLS, isNativeTool, NATIVE_TOOLS } from "./mapping";
import { gapScript, scriptForLegacy } from "./scripts";

const BRIDGE_URL = "https://davinci.continuumpraxisapp.com/mcp";

let sessionId: string | null = null;

interface McpResponse {
  result?: any;
  error?: { code: number; message: string };
}

async function mcpRequest(
  method: string,
  params: Record<string, unknown> = {},
  id: number | null = 1,
  token: string,
): Promise<McpResponse> {
  const headers: Record<string, string> = {
    Accept: "application/json, text/event-stream",
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
  }

  const body: Record<string, unknown> = { jsonrpc: "2.0", method, params };
  if (id !== null) body.id = id;

  const resp = await fetch(BRIDGE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const sid = resp.headers.get("Mcp-Session-Id") || resp.headers.get("mcp-session-id");
  if (sid && !sessionId) sessionId = sid;

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    if (resp.status === 400) sessionId = null;
    throw new Error(`Bridge HTTP ${resp.status}: ${text.slice(0, 200)}`);
  }

  const raw = (await resp.text()).trim();
  if (!raw) return {};

  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (t.startsWith("data:")) {
      return JSON.parse(t.slice(5).trim());
    }
  }
  return JSON.parse(raw);
}

async function ensureSession(token: string): Promise<void> {
  if (sessionId) return;
  const resp = await mcpRequest(
    "initialize",
    {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "kody-davinci-package", version: "1.1.0" },
    },
    1,
    token,
  );
  if (resp.error) throw new Error(`MCP initialize failed: ${resp.error.message}`);
  try {
    await mcpRequest("notifications/initialized", {}, null, token);
  } catch {
    // notification
  }
}

function unwrap(result: any): any {
  if (result?.isError) {
    const texts = (result.content || [])
      .filter((b: any) => b?.type === "text")
      .map((b: any) => b.text);
    throw new Error(texts.join("\n") || "MCP tool error");
  }
  const texts: string[] = [];
  for (const block of result?.content || []) {
    if (block.type === "text") texts.push(block.text);
  }
  if (texts.length === 0) return result;
  const joined = texts.join("\n");
  try {
    const parsed = JSON.parse(joined);
    if (parsed && typeof parsed === "object" && typeof parsed.output === "string") {
      const out = parsed.output.trim();
      try {
        return JSON.parse(out);
      } catch {
        return { output: parsed.output };
      }
    }
    return parsed;
  } catch {
    return joined;
  }
}

function resolveCall(
  tool: string,
  args: Record<string, unknown>,
): { name: string; arguments: Record<string, unknown> } {
  if (isNativeTool(tool)) {
    return { name: tool, arguments: args };
  }
  const direct = DIRECT_ALIAS[tool];
  if (direct) {
    return { name: direct, arguments: args };
  }
  const gap = GAP_TOOLS[tool];
  if (gap) {
    return { name: "run_script", arguments: { script: gapScript(tool, gap) } };
  }
  const script = scriptForLegacy(tool, args);
  if (script) {
    return { name: "run_script", arguments: { script, timeout: args.timeout ?? 30 } };
  }
  return {
    name: "run_script",
    arguments: {
      script: gapScript(
        tool,
        "Unknown legacy tool; no mapping. Call a native tool or pass Python to run_script.",
      ),
    },
  };
}

/**
 * Call a native MCP tool, or a legacy resolve_* name mapped onto the native 14.
 *
 * @param tool - Native name (e.g. get_resolve_status) or legacy resolve_* name
 * @param args - Tool arguments
 * @param token - Bearer token (from {{secret:davinciBridgeToken}})
 * @returns Unwrapped JSON result
 *
 * @example
 * import { callTool } from 'kody:@continuumpraxis/davinci/client'
 * await callTool('get_resolve_status', {}, '{{secret:davinciBridgeToken}}')
 */
export async function callTool(
  tool: string,
  args: Record<string, unknown> = {},
  token: string,
): Promise<any> {
  await ensureSession(token);
  const mapped = resolveCall(tool, args);
  const resp = await mcpRequest(
    "tools/call",
    { name: mapped.name, arguments: mapped.arguments },
    3,
    token,
  );
  if (resp.error) throw new Error(`Tool ${tool} failed: ${resp.error.message}`);
  return unwrap(resp.result || {});
}

/**
 * List native MCP tools on the live bridge (14 names).
 *
 * @param token - Bearer token (from {{secret:davinciBridgeToken}})
 * @returns Native tool name list
 *
 * @example
 * import { listTools } from 'kody:@continuumpraxis/davinci/client'
 * await listTools('{{secret:davinciBridgeToken}}')
 */
export async function listTools(token: string): Promise<string[]> {
  await ensureSession(token);
  const resp = await mcpRequest("tools/list", {}, 2, token);
  if (resp.error) throw new Error(`tools/list failed: ${resp.error.message}`);
  const names = (resp.result?.tools || []).map((t: any) => t.name);
  return names.length ? names : [...NATIVE_TOOLS];
}

export function _resetSession(): void {
  sessionId = null;
}
