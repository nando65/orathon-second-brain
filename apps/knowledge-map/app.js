const palette = [
  "#8fb3ff", "#9be0b0", "#ffd38e", "#ef9fb5", "#b9a5ff",
  "#8de3e3", "#f6a96c", "#c8e36d", "#d1a3ff", "#9cc7ff"
];

const state = {
  data: null,
  enabled: new Set(),
  query: "",
  selected: null,
};

const $ = (id) => document.getElementById(id);

function esc(s = "") {
  return String(s);
}

function colorFor(sourceId) {
  const idx = state.data.sources.findIndex(s => s.id === sourceId);
  return palette[(idx < 0 ? 0 : idx) % palette.length];
}

function layout(nodes, width, height) {
  const bySource = new Map();
  for (const n of nodes) {
    if (!bySource.has(n.sourceId)) bySource.set(n.sourceId, []);
    bySource.get(n.sourceId).push(n);
  }

  const result = new Map();
  const groups = [...bySource.entries()];
  const cx = width / 2;
  const cy = height / 2;
  const outer = Math.max(100, Math.min(width, height) * 0.34);

  groups.forEach(([sourceId, list], gi) => {
    const ga = (Math.PI * 2 * gi / Math.max(1, groups.length)) - Math.PI / 2;
    const gcx = cx + Math.cos(ga) * outer * 0.43;
    const gcy = cy + Math.sin(ga) * outer * 0.43;
    const radius = Math.max(55, Math.min(outer * 0.55, 32 + list.length * 3.5));

    list
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach((n, i) => {
        const a = (Math.PI * 2 * i / Math.max(1, list.length)) + gi * 0.37;
        const ring = radius * (0.35 + 0.65 * ((i % 7) + 1) / 7);
        result.set(n.id, {
          x: gcx + Math.cos(a) * ring,
          y: gcy + Math.sin(a) * ring
        });
      });
  });

  return result;
}

function matches(n) {
  if (!state.enabled.has(n.sourceId)) return false;
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return (
    n.title.toLowerCase().includes(q) ||
    n.path.toLowerCase().includes(q) ||
    n.excerpt.toLowerCase().includes(q)
  );
}

function renderFilters() {
  const box = $("filters");
  box.innerHTML = "";
  for (const [i, source] of state.data.sources.entries()) {
    const label = document.createElement("label");
    label.className = "filter";
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = state.enabled.has(source.id);
    cb.addEventListener("change", () => {
      if (cb.checked) state.enabled.add(source.id);
      else state.enabled.delete(source.id);
      renderGraph();
    });
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = palette[i % palette.length];
    const text = document.createElement("span");
    text.textContent = `${source.label} (${source.count})`;
    label.append(cb, sw, text);
    box.append(label);
  }
}

function showNode(n) {
  state.selected = n.id;
  $("note-title").textContent = n.title;
  $("note-meta").textContent = `${n.sourceLabel} • ${n.path}`;
  $("note-content").textContent = n.content || "(No readable content)";
  $("reader").classList.add("open");
}

function renderGraph() {
  const svg = $("graph");
  const width = svg.clientWidth || 900;
  const height = svg.clientHeight || 650;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.innerHTML = "";

  const pos = layout(state.data.nodes, width, height);
  const visible = new Set(state.data.nodes.filter(matches).map(n => n.id));

  for (const e of state.data.edges) {
    const a = pos.get(e.from);
    const b = pos.get(e.to);
    if (!a || !b) continue;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", a.x);
    line.setAttribute("y1", a.y);
    line.setAttribute("x2", b.x);
    line.setAttribute("y2", b.y);
    line.setAttribute("class", "link" + (visible.has(e.from) && visible.has(e.to) ? "" : " dim"));
    svg.append(line);
  }

  for (const n of state.data.nodes) {
    const p = pos.get(n.id);
    if (!p) continue;
    const ok = visible.has(n.id);

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", p.x);
    circle.setAttribute("cy", p.y);
    circle.setAttribute("r", state.selected === n.id ? 7 : 5);
    circle.setAttribute("fill", colorFor(n.sourceId));
    circle.setAttribute("class", "node" + (ok ? "" : " dim"));
    circle.addEventListener("click", () => showNode(n));
    svg.append(circle);

    if (ok && (state.query || n.rank < 3)) {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", p.x + 8);
      t.setAttribute("y", p.y + 3);
      t.setAttribute("class", "label");
      t.textContent = n.title.length > 38 ? n.title.slice(0, 35) + "…" : n.title;
      svg.append(t);
    }
  }
}

async function main() {
  const res = await fetch("./data/graph.json", { cache: "no-store" });
  if (!res.ok) throw new Error("Run `node scripts/build-map.mjs` first.");
  state.data = await res.json();

  document.title = state.data.title;
  $("map-title").textContent = state.data.title;
  $("inventory").textContent = `${state.data.nodes.length} notes • ${state.data.edges.length} explicit links`;
  for (const s of state.data.sources) state.enabled.add(s.id);

  renderFilters();
  renderGraph();

  $("search").addEventListener("input", (e) => {
    state.query = e.target.value;
    renderGraph();
  });
  $("close-reader").addEventListener("click", () => $("reader").classList.remove("open"));
  window.addEventListener("resize", renderGraph);
}

main().catch(err => {
  $("inventory").textContent = err.message;
});
