import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, "apps", "knowledge-map");
const sharedConfig = path.join(appDir, "map.config.json");
const localConfig = path.join(appDir, "map.config.local.json");
const configPath = fs.existsSync(localConfig) ? localConfig : sharedConfig;

if (!fs.existsSync(configPath)) {
  throw new Error(`Missing map config: ${configPath}`);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
if (!Array.isArray(config.sources) || config.sources.length === 0) {
  throw new Error("map config requires at least one source");
}

const allowedExt = new Set([".md", ".txt"]);
const skipNames = new Set([".git", "node_modules", ".DS_Store", "data"]);

function walk(p) {
  const out = [];
  if (!fs.existsSync(p)) return out;
  const st = fs.statSync(p);
  if (st.isFile()) return allowedExt.has(path.extname(p).toLowerCase()) ? [p] : [];
  for (const ent of fs.readdirSync(p, { withFileTypes: true })) {
    if (skipNames.has(ent.name) || ent.name.startsWith(".")) continue;
    const child = path.join(p, ent.name);
    if (ent.isDirectory()) out.push(...walk(child));
    else if (ent.isFile() && allowedExt.has(path.extname(ent.name).toLowerCase())) out.push(child);
  }
  return out;
}

function titleFrom(content, file) {
  const m = content.match(/^\s*#\s+(.+?)\s*$/m);
  if (m) return m[1].trim();
  return path.basename(file, path.extname(file));
}

function excerptFrom(content) {
  return content
    .replace(/^---[\s\S]*?---\s*/m, "")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

function slugId(sourceId, rel) {
  return `${sourceId}:${crypto.createHash("sha1").update(rel).digest("hex").slice(0, 14)}`;
}

function extractLinks(content) {
  const links = [];
  for (const m of content.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    links.push(m[1].trim());
  }
  for (const m of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const raw = m[1].trim();
    if (!/^(https?:|mailto:|#)/i.test(raw)) links.push(raw.split("#")[0]);
  }
  return links;
}

const nodes = [];
const sources = [];
const lookupByAbs = new Map();
const lookupByStem = new Map();

for (const source of config.sources) {
  if (!source.id || !source.label || !Array.isArray(source.paths)) {
    throw new Error("Each source needs id, label, and paths[]");
  }
  const files = [];
  for (const raw of source.paths) {
    const abs = path.isAbsolute(raw) ? raw : path.join(repoRoot, raw);
    files.push(...walk(abs));
  }

  const uniqueFiles = [...new Set(files.map(f => path.resolve(f)))];
  let rank = 0;
  for (const file of uniqueFiles) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(repoRoot, file).split(path.sep).join("/");
    const node = {
      id: slugId(source.id, rel),
      sourceId: source.id,
      sourceLabel: source.label,
      path: rel,
      title: titleFrom(content, file),
      excerpt: excerptFrom(content),
      content,
      links: extractLinks(content),
      rank: rank++
    };
    nodes.push(node);
    lookupByAbs.set(path.resolve(file), node.id);
    const stem = path.basename(file, path.extname(file)).toLowerCase();
    if (!lookupByStem.has(stem)) lookupByStem.set(stem, []);
    lookupByStem.get(stem).push(node.id);
  }

  sources.push({ id: source.id, label: source.label, count: uniqueFiles.length });
}

const edges = [];
const seen = new Set();

for (const node of nodes) {
  const fromAbs = path.join(repoRoot, node.path);
  const fromDir = path.dirname(fromAbs);

  for (const raw of node.links) {
    let targetId = null;

    const candidate = path.resolve(fromDir, raw);
    const candidates = [
      candidate,
      candidate + ".md",
      candidate + ".txt",
      path.join(candidate, "README.md")
    ];
    for (const c of candidates) {
      if (lookupByAbs.has(c)) {
        targetId = lookupByAbs.get(c);
        break;
      }
    }

    if (!targetId) {
      const stem = path.basename(raw, path.extname(raw)).toLowerCase();
      const matches = lookupByStem.get(stem) || [];
      if (matches.length === 1) targetId = matches[0];
    }

    if (targetId && targetId !== node.id) {
      const key = [node.id, targetId].sort().join("|");
      if (!seen.has(key)) {
        seen.add(key);
        edges.push({ from: node.id, to: targetId });
      }
    }
  }
}

const out = {
  title: config.title || "Knowledge Map",
  generatedAt: new Date().toISOString(),
  sources,
  nodes,
  edges
};

const dataDir = path.join(appDir, "data");
fs.mkdirSync(dataDir, { recursive: true });
fs.writeFileSync(path.join(dataDir, "graph.json"), JSON.stringify(out, null, 2));

console.log(`Built ${nodes.length} notes and ${edges.length} explicit links from ${sources.length} categories.`);
