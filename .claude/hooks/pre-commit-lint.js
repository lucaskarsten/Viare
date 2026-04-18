#!/usr/bin/env node
// Blocking pre-commit lint gate

const input = JSON.parse(process.stdin.read() || "{}");
const cmd = input?.tool_input?.command || "";

if (!cmd.includes("git commit")) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

const { execSync } = require("child_process");
const cwd = "/home/lucas/Projects/Viare";

function check(label, command) {
  try {
    execSync(command, { cwd, stdio: "pipe" });
    return null;
  } catch (e) {
    return `${label}:\n${e.stdout?.toString() || e.stderr?.toString() || e.message}`;
  }
}

const errors = [
  check("Prettier", "npx prettier --check ."),
  check("ESLint", "npx eslint ."),
  check("TypeScript", "npx tsc --noEmit"),
  check("Tests", "npm test"),
].filter(Boolean);

if (errors.length > 0) {
  console.log(JSON.stringify({
    continue: false,
    stopReason: `Pre-commit gate failed:\n\n${errors.join("\n\n")}\n\nFix the issues above before committing.`
  }));
} else {
  console.log(JSON.stringify({ continue: true }));
}
process.exit(0);
