# @continuumpraxis/davinci

Drive **DaVinci Resolve Studio 21.1** remotely through Kody. Agents can check
status, list timelines, and run scripting-backed edits — no local Resolve
install on the agent side.

## Intent

This package exists so Continuum agents can talk to the native Resolve MCP
wrapper on the ASUS (`127.0.0.1:8795`) through
`https://davinci.continuumpraxisapp.com`. Success is: bearer auth works, native
`get_resolve_status` reports running 21.1.1, and `run_script` executes. Legacy
`resolve_*` names keep working via a mapping layer.

## How it works

```
Kody agent → this package → Cloudflare tunnel → native HTTP wrapper → ResolveMCP.exe
```

Native MCP exposes **14 tools**. The old guycochran server (77 `resolve_*`
tools on loopback `:8794`) is not on the tunnel. `callTool` maps those names:
direct aliases, `run_script` Python, or an explicit `{ gap: true }` payload.
See [TOOL-MAPPING.md](./TOOL-MAPPING.md).

Bearer token lives in Kody as `davinciBridgeToken` (native `.token-native` file).
Never put the value in code.

## Setup

1. Resolve Studio 21.1+ running on the host with the native wrapper on 8795.
2. Save `davinciBridgeToken` in Kody and approve host
   `davinci.continuumpraxisapp.com`.
3. Call this package.

## Usage

```typescript
import davinci from 'kody:@continuumpraxis/davinci'

const result = await davinci({ token: '{{secret:davinciBridgeToken}}' })
// => { ok: true, status: { running: true, version: "21.1.1" } }
```

### Read-only

```typescript
import { getStatus, listTimelines } from 'kody:@continuumpraxis/davinci/status'
import { getPlayhead, getClipTransform } from 'kody:@continuumpraxis/davinci/timeline'

await getStatus({ token })
await listTimelines({ token })
```

### Mutations (dryRun + confirm)

```typescript
import { duplicateTimeline, setClipTransform } from 'kody:@continuumpraxis/davinci/timeline'

await duplicateTimeline({ token, dryRun: true })
await duplicateTimeline({ token, confirm: true, name: "MONTAGE_v8" })
```

### Raw tools

```typescript
import { callTool, listTools } from 'kody:@continuumpraxis/davinci/client'

await listTools(token) // native 14
await callTool("get_resolve_status", {}, token)
await callTool("run_script", { script: 'print("ok")' }, token)
await callTool("resolve_save_project", {}, token) // mapped → run_script
```

## Bridge

Host loopback only: `launch_native.py` → `native_mcp_http.py` on
`127.0.0.1:8795`, bearer from `.token-native`. Do not bind beyond loopback.
Studio must be running; the wrapper does not launch Resolve except via
`launch_resolve`.

## Safety

- Reads are free.
- Writes need `confirm: true`. Use `dryRun: true` first.
- The bearer is full Resolve access. Keep it in Kody secrets.

Built by Continuum Praxis.
