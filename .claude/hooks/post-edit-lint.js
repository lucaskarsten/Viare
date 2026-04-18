#!/usr/bin/env node
// Informational post-edit lint — always exits 0, errors go to stderr

const { execSync } = require("child_process");
const input = JSON.parse(process.stdin.read() || "{}");
const filePath = input?.tool_input?.file_path || "";

if (!filePath.match(/\.(ts|tsx)$/)) process.exit(0);

const cwd = "/home/lucas/Projects/Viare";

function run(cmd) {
  try {
    execSync(cmd, { cwd, stdio: "pipe" });
  } catch (e) {
    process.stderr.write(`[post-edit-lint] ${cmd}\n${e.stdout?.toString() || e.message}\n`);
  }
}

run(`npx tsc --noEmit --skipLibCheck`);
run(`npx eslint --quiet "${filePath}"`);

process.exit(0);
