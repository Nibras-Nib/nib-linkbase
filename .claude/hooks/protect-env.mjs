// PreToolUse hook: blocks Claude from editing .env and .env.local.
// File tools are checked by file_path; Bash and PowerShell are checked by any
// mention of a protected file in the command, which also blocks reads.
import { basename } from "node:path";

const PROTECTED = new Set([".env", ".env.local"]);
// ".env" or ".env.local" as a whole word: not ".env.example", ".envrc", or "process.env".
const COMMAND_PATTERN = /(?<![\w.-])\.env(?:\.local)?(?![\w.-])/;

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

const input = JSON.parse(raw || "{}");
const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path ?? "";
const command = input.tool_input?.command ?? "";

let blocked = "";
if (PROTECTED.has(basename(target))) {
  blocked = basename(target);
} else {
  const match = command.match(COMMAND_PATTERN);
  if (match) blocked = match[0];
}

if (blocked) {
  console.error(`${blocked} is a protected file. Ask the user before editing it.`);
  // Exit code 2 tells Claude Code to block the tool call; stderr is shown to Claude as the reason.
  process.exit(2);
}

process.exit(0);
