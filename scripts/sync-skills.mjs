import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, ".claude", "skills");
const dst = path.join(root, ".agents", "skills");

if (!fs.existsSync(src)) throw new Error("Missing .claude/skills");
fs.mkdirSync(dst, { recursive: true });

for (const name of fs.readdirSync(src)) {
  const sourceDir = path.join(src, name);
  if (!fs.statSync(sourceDir).isDirectory()) continue;

  const targetDir = path.join(dst, name);
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log(`synced ${name}`);
}
