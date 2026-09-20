import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const appDir = path.join(repoRoot, "apps", "knowledge-map");
const configPath = fs.existsSync(path.join(appDir, "map.config.local.json"))
  ? path.join(appDir, "map.config.local.json")
  : path.join(appDir, "map.config.json");

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const port = Number(config.port || 4747);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  const rel = clean === "/" ? "index.html" : clean.replace(/^\/+/, "");
  const full = path.resolve(appDir, rel);
  if (!full.startsWith(path.resolve(appDir) + path.sep) && full !== path.resolve(appDir, "index.html")) {
    return null;
  }
  return full;
}

const server = http.createServer((req, res) => {
  const full = safePath(req.url || "/");
  if (!full || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  const ext = path.extname(full).toLowerCase();
  res.writeHead(200, {
    "content-type": types[ext] || "application/octet-stream",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  fs.createReadStream(full).pipe(res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Knowledge Map: http://127.0.0.1:${port}`);
});
