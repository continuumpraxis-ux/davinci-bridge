# AGENTS.md — @continuumpraxis/davinci

## What this is

Kody package for the Continuum DaVinci **native** tunnel bridge (Resolve 21.1
MCP, 14 tools). Legacy `resolve_*` names are mapped in `src/client.ts`.

## Imports

```typescript
import davinci from 'kody:@continuumpraxis/davinci'
import { getStatus, listTimelines } from 'kody:@continuumpraxis/davinci/status'
import { duplicateTimeline, setClipTransform } from 'kody:@continuumpraxis/davinci/timeline'
import { callTool, listTools } from 'kody:@continuumpraxis/davinci/client'
```

## Auth

Every call needs `token: '{{secret:davinciBridgeToken}}'`. That secret is the
native wrapper bearer (host file `.token-native`), not the archived guycochran
`.token`. Never log it.

Approve host `davinci.continuumpraxisapp.com` or fetch placeholders 403.

## Smoke tests

```typescript
const s = await davinci({ token: '{{secret:davinciBridgeToken}}' });
// expect: { ok: true, status: { running: true, version: "21.1.1" } }

const tools = await listTools('{{secret:davinciBridgeToken}}');
// expect: includes "get_resolve_status" and "run_script" (~14 names)

await callTool("run_script", { script: 'print("ok")' }, '{{secret:davinciBridgeToken}}');

await duplicateTimeline({ token: '{{secret:davinciBridgeToken}}', dryRun: true });
```

## Edge cases

- Resolve not running: `get_resolve_status` → `{ running: false }` or error.
- Token wrong: HTTP 401. Compare to `.token-native` (not archived `.token`).
- Tunnel down / CF challenge off-network: fetch fails. Probe from the ASUS.
- Unknown `resolve_*` AI helpers: `{ gap: true }` via run_script. See TOOL-MAPPING.md.
- Mutations without confirm: `{ ok: false, error }` preview, no execute.

## Safety

Reads free. Writes need `confirm: true`. Always `{{secret:...}}`.
