#!/usr/bin/env node
/**
 * Cursor secret-guard hook (davinci-bridge is a TypeScript/Node package).
 *
 * Blocks agent tool actions that would print, read, or write real secret
 * material: `.env` files (not `.env.example`), token files such as
 * `.token-native`, and `KEY=literal` assignments for secret-like names.
 * `{{secret:...}}` indirection is the sanctioned pattern and stays allowed.
 * Never echoes a suspected secret value back in its messages.
 *
 * Wired from `.cursor/hooks.json` on Cursor's before-execution events
 * (confirm the event names against your installed Cursor version).
 * Reads one JSON event on stdin, prints one JSON verdict on stdout.
 */
import { readFileSync } from "node:fs";

const REASON =
  "Secret guard: this action could expose or write real credentials " +
  "(.env contents, a token file, or a KEY=literal assignment). " +
  "This is a public repo: use {{secret:...}} indirection, read secrets " +
  "from the environment in code, and let a human handle real values " +
  "outside the agent.";

const SENSITIVE_FILE =
  /(?:^|[\s'"\\/])(\.env(?!\.(?:example|sample|template)\b)[\w.\-]*|\.token[\w.\-]*|[\w.\-]*\.token|credentials\.(?:json|ya?ml|toml|ini|txt)|[\w.\-]*secrets?\.(?:json|ya?ml|toml|ini|txt)|id_(?:rsa|ed25519|ecdsa))(?=$|[\s'"\\/:;|&>])/i;
const READ_VERBS =
  /\b(cat|type|get-content|gc|head|tail|less|more|grep|rg|select-string|printenv|set-content|out-file|tee|cp|copy|mv|move|echo|printf|print)\b/i;
const ASSIGNMENT =
  /\b(?:[A-Za-z_][A-Za-z0-9_]*?)?(?:API_?KEY|SECRET|TOKEN|PASSWORD|PASSWD|PASSPHRASE|CLIENT_?SECRET|ACCESS_?KEY|PRIVATE_?KEY|CREDENTIAL)[A-Za-z0-9_]*\s*[:=]\s*(["']?)([^\s"',;}\]]{8,})\1/gi;
const PROVIDER_PATTERNS = [
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /sk-[A-Za-z0-9_\-]{16,}/,
  /AKIA[0-9A-Z]{16}/,
  /xox[baprs]-[A-Za-z0-9\-]{10,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /[a-z][a-z0-9+.\-]*:\/\/[^\s/:@]+:[^\s/@]{4,}@/,
];
const PLACEHOLDER =
  /^(\$\{?.*|\{\{secret:.*|<.*>|your[-_].*|change[-_]?me.*|example.*|x{3,}.*|none|null|true|false|process\.env\..*|os\.environ.*|os\.getenv.*|getenv.*|settings\..*|env\(.*|placeholder.*|redacted.*)$/i;
const PATH_KEYS = new Set([
  "file_path", "filepath", "path", "target_file", "targetfile", "filename",
]);

function flatten(value, out) {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => flatten(v, out));
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => flatten(v, out));
}

function checkPaths(node) {
  if (Array.isArray(node)) return node.some(checkPaths);
  if (node && typeof node === "object") {
    return Object.entries(node).some(
      ([k, v]) =>
        (PATH_KEYS.has(k.toLowerCase()) && typeof v === "string" && SENSITIVE_FILE.test(v)) ||
        checkPaths(v),
    );
  }
  return false;
}

function isLiteralAssignment(text) {
  const scrubbed = text
    .replace(/\{\{secret:[^}]*\}\}/g, "")
    .replace(/\$\{[^}]*\}/g, "");
  for (const m of scrubbed.matchAll(ASSIGNMENT)) {
    const value = m[2].trim().replace(/^["']|["']$/g, "");
    // Regex/pattern source (e.g. this file's own patterns) is not a literal.
    if (/[\[\\{|<*]/.test(value)) continue;
    if (value && !PLACEHOLDER.test(value)) return true;
  }
  return false;
}

function verdict(allow, detail = "") {
  const payload = allow
    ? { permission: "allow" }
    : {
        permission: "deny",
        userMessage: REASON,
        agentMessage: REASON + (detail ? ` Blocked pattern class: ${detail}.` : ""),
      };
  process.stdout.write(JSON.stringify(payload) + "\n");
}

let event;
try {
  event = JSON.parse(readFileSync(0, "utf8"));
} catch {
  verdict(false, "unparseable hook event");
  process.exit(0);
}
if (!event || typeof event !== "object") {
  verdict(false, "unexpected hook event shape");
  process.exit(0);
}

const strings = [];
flatten(event, strings);
const blob = strings.join("\n");

if (PROVIDER_PATTERNS.some((p) => p.test(blob))) {
  verdict(false, "provider-shaped credential");
} else if (isLiteralAssignment(blob)) {
  verdict(false, "KEY=literal assignment for a secret-like name");
} else if (checkPaths(event)) {
  verdict(false, "direct access to a sensitive file");
} else {
  const shellText = typeof event.command === "string" ? event.command
    : typeof event.cmd === "string" ? event.cmd : "";
  if (shellText) {
    const scrubbed = shellText.replace(
      /\b(?:cp|copy|Copy-Item)\s+\S*\.env\.(?:example|sample|template)\s+\S*\.env[\w.\-]*/gi,
      "",
    );
    const writesFile = /(>|>>|set-content|out-file|tee)\s*[^\n]*?\.env/i.test(scrubbed);
    if (SENSITIVE_FILE.test(scrubbed) && (READ_VERBS.test(scrubbed) || writesFile)) {
      verdict(false, "shell access to a sensitive file");
      process.exit(0);
    }
    if (/\bprintenv\b|\benv\s*$|\bexport\s+-p\b/.test(scrubbed)) {
      verdict(false, "environment dump");
      process.exit(0);
    }
  }
  verdict(true);
}
