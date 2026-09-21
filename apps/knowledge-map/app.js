import { clamp, layoutNodes, project, createOrbits, TAU } from './scene.js';
import { renderMarkdown } from './markdown.js';

const palette = ['#65d8ff', '#7de2b0', '#f3c471', '#ef99bd', '#b2a4f4', '#81e0d2', '#f4a26e', '#b9df79', '#c991ee', '#9cc7ff'];
const $ = id => document.getElementById(id);
const canvas = $('graph');
const ctx = canvas.getContext('2d');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const initialCamera = { yaw: -0.32, pitch: 0.14, zoom: 1 };
const state = { data: null, enabled: new Set(), query: '', selected: null, hovered: null, camera: { ...initialCamera }, auto: false, labels: false, visible: [], points: [], width: 1, height: 1, velocity: { x: 0, y: 0 }, dirty: true };
const orbits = createOrbits();
const pointers = new Map();
let positions, nodeById, degree, frame, lastTime = 0, gesture = null, lastFocus = null;
let readerMode = 'formatted';
try { if (localStorage.getItem('knowledge-map-reader-mode') === 'markdown') readerMode = 'markdown'; } catch { /* Storage may be unavailable. */ }
const stars = Array.from({ length: 170 }, (_, i) => ({ x: random(i * 3 + 1), y: random(i * 3 + 2), r: 0.3 + random(i * 3 + 3) * 0.7 }));
function random(seed) { const n = Math.sin(seed * 127.1) * 43758.5453; return n - Math.floor(n); }
function colorFor(id) { return palette[Math.max(0, state.data.sources.findIndex(s => s.id === id)) % palette.length]; }
function invalidate() { state.dirty = true; if (!frame && !document.hidden) frame = requestAnimationFrame(animate); }
function stopMotion() { state.velocity = { x: 0, y: 0 }; setAuto(false); }
function setAuto(value) { state.auto = value; $('auto-rotate').setAttribute('aria-pressed', String(value)); $('auto-rotate').querySelector('span').textContent = value ? 'Pause rotation' : 'Auto-rotate'; invalidate(); }
function zoom(factor) { state.camera.zoom = clamp(state.camera.zoom * factor, 0.5, 2.4); $('zoom-in').disabled = state.camera.zoom >= 2.4; $('zoom-out').disabled = state.camera.zoom <= 0.5; invalidate(); }
function resetView() { stopMotion(); state.camera = { ...initialCamera }; zoom(1); }
function matches(node) { const q = state.query.trim().toLowerCase(); return state.enabled.has(node.sourceId) && (!q || [node.title, node.path, node.excerpt].some(value => String(value || '').toLowerCase().includes(q))); }
function refreshVisible() {
  state.visible = state.data.nodes.filter(matches);
  state.visibleIds = new Set(state.visible.map(n => n.id));
  state.hovered = null;
  $('view-status').textContent = `${state.visible.length.toLocaleString()} ${state.visible.length === 1 ? 'note' : 'notes'} in view`;
  $('empty-state').hidden = state.visible.length > 0;
  if (state.selected && !state.visibleIds.has(state.selected)) closeReader(false);
  renderNoteList(); invalidate();
}
function renderFilters() {
  $('filters').replaceChildren();
  for (const source of state.data.sources) {
    const label = document.createElement('label'); label.className = 'filter'; label.style.setProperty('--source-color', colorFor(source.id));
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = state.enabled.has(source.id); input.setAttribute('aria-label', source.label);
    input.addEventListener('change', () => { input.checked ? state.enabled.add(source.id) : state.enabled.delete(source.id); refreshVisible(); });
    const swatch = document.createElement('span'); swatch.className = 'swatch';
    const name = document.createElement('span'); name.className = 'filter-name'; name.textContent = source.label;
    const count = document.createElement('span'); count.className = 'filter-count'; count.textContent = source.count.toLocaleString();
    label.append(input, swatch, name, count); $('filters').append(label);
  }
}
function noteButton(node) {
  const button = document.createElement('button'); button.className = 'note-item'; button.textContent = node.title; button.dataset.nodeId = node.id;
  button.setAttribute('aria-current', String(node.id === state.selected));
  const source = document.createElement('small'); source.textContent = node.sourceLabel; button.append(source);
  button.addEventListener('click', () => showNode(node)); return button;
}
function renderNoteList() {
  const list = $('note-list'); list.replaceChildren();
  for (const node of state.visible) list.append(noteButton(node));
  if (!state.visible.length) list.textContent = 'No matching notes.';
}
function showNode(node) {
  if ($('reader').hidden) lastFocus = document.activeElement;
  state.selected = node.id; stopMotion();
  $('note-title').textContent = node.title; $('note-source').textContent = node.sourceLabel;
  $('note-source').style.color = colorFor(node.sourceId);
  $('note-meta').textContent = node.path; $('note-content').textContent = node.content || '(No readable content)';
  $('note-formatted').replaceChildren(/\.txt$/i.test(node.path)
    ? Object.assign(document.createElement('pre'), { textContent: node.content || '(No readable content)' })
    : renderMarkdown(node.content || '(No readable content)', { onNoteLink: href => openNoteLink(node, href) }));
  setReaderMode(readerMode);
  $('connected-notes').replaceChildren();
  const connections = state.data.edges.filter(e => e.from === node.id || e.to === node.id).map(e => nodeById.get(e.from === node.id ? e.to : e.from)).filter(Boolean);
  for (const other of connections) $('connected-notes').append(noteButton(other));
  if (!connections.length) { const p = document.createElement('p'); p.textContent = 'No explicit links to other indexed notes yet.'; $('connected-notes').append(p); }
  $('reader').hidden = false; $('reader').scrollTop = 0; $('note-title').focus();
  document.body.classList.remove('sources-open'); $('toggle-sources').setAttribute('aria-expanded', 'false');
  renderNoteList(); invalidate();
}
function setReaderMode(mode) {
  readerMode = mode;
  $('note-formatted').hidden = mode !== 'formatted';
  $('note-content').hidden = mode !== 'markdown';
  $('view-formatted').setAttribute('aria-pressed', String(mode === 'formatted'));
  $('view-markdown').setAttribute('aria-pressed', String(mode === 'markdown'));
  try { localStorage.setItem('knowledge-map-reader-mode', mode); } catch { /* The toggle still works without storage. */ }
}
function openNoteLink(node, href) {
  let targetPath;
  try { targetPath = decodeURIComponent(new URL(href, `https://notes.local/${node.path}`).pathname).slice(1); } catch { return; }
  const target = state.data.nodes.find(candidate => candidate.path === targetPath);
  if (target) showNode(target);
}
function closeReader(restoreFocus = true) {
  $('reader').hidden = true; state.selected = null;
  if (restoreFocus) (lastFocus?.isConnected ? lastFocus : canvas).focus();
  renderNoteList(); invalidate();
}
function resize() {
  const rect = canvas.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2);
  state.width = rect.width; state.height = rect.height;
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); invalidate();
}
function screen(point) { return project(point, state.camera, state.width, state.height); }
function drawOrbits() {
  for (const orbit of orbits) {
    const projected = orbit.points.map(screen);
    ctx.lineWidth = orbit.accent ? 0.8 : 0.55;
    // Split the front and back segments so the globe has real depth cues.
    for (const front of [false, true]) {
      ctx.strokeStyle = orbit.accent ? (front ? '#769bc090' : '#415a7945') : (front ? '#567da060' : '#31425935');
      ctx.setLineDash(orbit.accent ? [] : [2, 5]); ctx.beginPath();
      for (let i = 1; i < projected.length; i++) { const a = projected[i - 1], b = projected[i]; if ((b.z >= 0) === front) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); } }
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);
}
function draw() {
  const { width: w, height: h } = state; ctx.clearRect(0, 0, w, h);
  for (const star of stars) { ctx.fillStyle = `rgba(139,177,216,${0.18 + star.r * 0.23})`; ctx.beginPath(); ctx.arc(star.x * w, star.y * h, star.r, 0, TAU); ctx.fill(); }
  drawOrbits();
  const projected = new Map(state.visible.map(node => [node.id, screen(positions.get(node.id))]));
  const active = state.hovered || state.selected;
  for (const edge of state.data.edges) {
    const a = projected.get(edge.from), b = projected.get(edge.to); if (!a || !b) continue;
    const highlight = active === edge.from || active === edge.to;
    ctx.strokeStyle = highlight ? '#b3e6ff' : '#759bb78c'; ctx.lineWidth = highlight ? 1.5 : 0.9;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  state.points = state.visible.map(node => ({ ...projected.get(node.id), node })).sort((a, b) => a.z - b.z);
  const sparse = state.data.nodes.length < 35;
  for (const p of state.points) {
    const selected = p.node.id === active, color = colorFor(p.node.sourceId);
    const r = (sparse ? 13 : 3 + Math.min(5, Math.sqrt(degree.get(p.node.id) || 0))) * p.scale * (selected ? 1.22 : 1);
    p.radius = r;
    const alpha = 0.76 + (p.z + 1) * 0.12; ctx.globalAlpha = alpha;
    const halo = ctx.createRadialGradient(p.x, p.y, r * 0.2, p.x, p.y, r * 4.5); halo.addColorStop(0, `${color}50`); halo.addColorStop(1, `${color}00`);
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(p.x, p.y, r * 4.5, 0, TAU); ctx.fill();
    const sphere = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.4, 0, p.x, p.y, r); sphere.addColorStop(0, '#e4f9ff'); sphere.addColorStop(0.28, color); sphere.addColorStop(1, `${color}50`);
    ctx.fillStyle = sphere; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = `${color}c0`; ctx.lineWidth = 0.8; ctx.stroke();
    if (selected) { ctx.strokeStyle = '#e1f6ff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(p.x, p.y, r + 5, 0, TAU); ctx.stroke(); }
  }
  ctx.globalAlpha = 1;
  const occupied = [];
  // Label priority ensures the selected/hovered note always wins collision checks.
  const labels = [...state.points].sort((a,b) => Number(b.node.id === active) - Number(a.node.id === active) || b.z - a.z);
  for (const p of labels) {
    const important = p.node.id === active;
    if (!sparse && !state.labels && !state.query && !important && (degree.get(p.node.id) || 0) < 2) continue;
    const fontSize = w < 500 ? 10 : 13; ctx.font = `400 ${fontSize}px system-ui, sans-serif`;
    const maxWidth = Math.min(190, w * 0.38); const lines = wrapLabel(p.node.title, maxWidth);
    const width = Math.max(...lines.map(line => ctx.measureText(line).width));
    let x = p.x + p.radius + 11; if (x + width > w - 14) x = p.x - p.radius - 11 - width;
    x = clamp(x, 10, Math.max(10, w - width - 10));
    const y = clamp(p.y - (lines.length - 1) * 8, 55, h - 120);
    const box = { x: x - 5, y: y - 12, w: width + 10, h: lines.length * 16 + 4 };
    if (!important && !state.labels && occupied.some(b => box.x < b.x+b.w && box.x+box.w > b.x && box.y < b.y+b.h && box.y+box.h > b.y)) continue;
    occupied.push(box); ctx.fillStyle = '#040914b5'; ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.fillStyle = important ? '#ffffff' : p.z < -0.25 ? '#98abc4' : '#d9e4f3';
    lines.forEach((line, i) => ctx.fillText(line, x, y + i * 16));
  }
}
function wrapLabel(text, maxWidth) {
  const words = text.split(/\s+/), lines = []; let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > 2) lines.splice(1, lines.length - 1, lines.slice(1).join(' '));
  return lines.map(line => { if (ctx.measureText(line).width <= maxWidth) return line; while (line.length && ctx.measureText(`${line}…`).width > maxWidth) line = line.slice(0, -1); return `${line}…`; });
}
function animate(time) {
  frame = null; const dt = Math.min((time - lastTime) / 1000 || 0.016, 0.05); lastTime = time;
  const inertia = Math.abs(state.velocity.x) + Math.abs(state.velocity.y) > 0.001;
  if (state.auto && !pointers.size) state.camera.yaw += dt * 0.12;
  if (inertia && !pointers.size) { state.camera.yaw += state.velocity.x * dt; state.camera.pitch = clamp(state.camera.pitch + state.velocity.y * dt, -1.5, 1.5); const damping = Math.exp(-5 * dt); state.velocity.x *= damping; state.velocity.y *= damping; }
  if (state.dirty || state.auto || inertia) { draw(); state.dirty = false; }
  if ((state.auto || inertia) && !document.hidden) frame = requestAnimationFrame(animate);
}
function hitAt(x, y) { return [...state.points].reverse().find(p => Math.hypot(p.x-x, p.y-y) <= Math.max(12, p.radius + 5))?.node; }
function localPoint(event) { const rect = canvas.getBoundingClientRect(); return { x: event.clientX-rect.left, y: event.clientY-rect.top }; }
function pinchDistance() { const [a,b] = [...pointers.values()]; return Math.hypot(a.x-b.x, a.y-b.y); }
function bindControls() {
  $('search').addEventListener('input', e => { state.query = e.target.value; refreshVisible(); });
  $('show-labels').addEventListener('change', e => { state.labels = e.target.checked; invalidate(); });
  $('close-reader').addEventListener('click', () => closeReader());
  $('view-formatted').addEventListener('click', () => setReaderMode('formatted'));
  $('view-markdown').addEventListener('click', () => setReaderMode('markdown'));
  $('reset-view').addEventListener('click', resetView);
  $('auto-rotate').addEventListener('click', () => { state.velocity = { x: 0, y: 0 }; setAuto(!state.auto); });
  $('zoom-in').addEventListener('click', () => zoom(1.15)); $('zoom-out').addEventListener('click', () => zoom(1/1.15));
  $('cinema').addEventListener('click', () => { const enabled = document.body.classList.toggle('cinema'); $('cinema').setAttribute('aria-pressed', String(enabled)); $('cinema').querySelector('span').textContent = enabled ? 'Exit cinema' : 'Cinema'; });
  $('browse-notes').addEventListener('click', () => { const show = $('note-list').hidden; $('note-list').hidden = !show; $('browse-notes').setAttribute('aria-expanded', String(show)); });
  $('toggle-sources').addEventListener('click', () => { const enabled = document.body.classList.toggle('sources-open'); $('toggle-sources').setAttribute('aria-expanded', String(enabled)); });
  $('clear-filters').addEventListener('click', () => { state.query = ''; $('search').value = ''; state.enabled = new Set(state.data.sources.map(s => s.id)); renderFilters(); refreshVisible(); });
  canvas.addEventListener('pointerdown', e => {
    if (e.button !== 0) return; stopMotion(); canvas.focus(); canvas.setPointerCapture(e.pointerId);
    const point = localPoint(e); pointers.set(e.pointerId, point);
    if (pointers.size === 1) gesture = { start: point, moved: false, last: point, time: e.timeStamp };
    if (pointers.size > 1) { gesture.moved = true; gesture.distance = pinchDistance(); }
    canvas.classList.add('dragging');
  });
  canvas.addEventListener('pointermove', e => {
    const p = localPoint(e);
    if (!pointers.has(e.pointerId)) { const hovered = hitAt(p.x, p.y)?.id || null; if (hovered !== state.hovered) { state.hovered = hovered; canvas.style.cursor = hovered ? 'pointer' : ''; invalidate(); } return; }
    const previous = pointers.get(e.pointerId); pointers.set(e.pointerId, p);
    if (pointers.size > 1) { const distance = pinchDistance(); if (gesture.distance > 0) zoom(distance / gesture.distance); gesture.distance = distance; return; }
    const dx = p.x - previous.x, dy = p.y - previous.y;
    if (Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y) > 4) gesture.moved = true;
    state.camera.yaw += dx * 0.006; state.camera.pitch = clamp(state.camera.pitch + dy * 0.006, -1.5, 1.5);
    const dt = Math.max(8, e.timeStamp - gesture.time) / 1000; gesture.time = e.timeStamp;
    state.velocity = reducedMotion.matches ? { x: 0, y: 0 } : { x: clamp(dx*0.006/dt,-2,2), y: clamp(dy*0.006/dt,-2,2) }; invalidate();
  });
  const finish = e => {
    if (!pointers.has(e.pointerId)) return;
    const p = localPoint(e); const click = pointers.size === 1 && !gesture.moved && e.type === 'pointerup';
    pointers.delete(e.pointerId);
    if (!pointers.size) { canvas.classList.remove('dragging'); if (e.timeStamp - gesture.time > 100 || e.type !== 'pointerup') state.velocity = { x:0, y:0 }; if (click) { const node = hitAt(p.x,p.y); if (node) showNode(node); } gesture = null; }
    else { gesture.moved = true; gesture.distance = 0; }
    invalidate();
  };
  canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish); canvas.addEventListener('lostpointercapture', finish);
  canvas.addEventListener('pointerleave', () => { state.hovered = null; invalidate(); });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(Math.exp(-clamp(e.deltaY,-100,100) * 0.002)); }, { passive:false });
  canvas.addEventListener('keydown', e => {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { e.preventDefault(); stopMotion(); state.camera.yaw += e.key === 'ArrowLeft' ? -0.12 : e.key === 'ArrowRight' ? 0.12 : 0; state.camera.pitch = clamp(state.camera.pitch + (e.key === 'ArrowUp' ? -0.12 : e.key === 'ArrowDown' ? 0.12 : 0),-1.5,1.5); invalidate(); }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoom(1.15); } if (e.key === '-') { e.preventDefault(); zoom(1/1.15); } if (e.key.toLowerCase() === 'r') resetView();
  });
  document.addEventListener('keydown', e => {
    const editing = ['INPUT','TEXTAREA'].includes(document.activeElement.tagName);
    if (e.key === '/' && !editing && !document.body.classList.contains('cinema')) { e.preventDefault(); $('search').focus(); }
    if (e.key === 'Escape') { if (!$('reader').hidden) closeReader(); else if (document.body.classList.contains('cinema')) $('cinema').click(); else { document.body.classList.remove('sources-open'); $('toggle-sources').setAttribute('aria-expanded','false'); } }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = null; } else { lastTime = 0; invalidate(); } });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stopMotion(); });
  new ResizeObserver(resize).observe($('canvas-wrap'));
}
async function main() {
  if (!ctx) throw new Error('Your browser cannot display this map. Please use a browser with Canvas support.');
  const response = await fetch('./data/graph.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Build your map first: node scripts/build-map.mjs');
  state.data = await response.json(); positions = layoutNodes(state.data.nodes); nodeById = new Map(state.data.nodes.map(n => [n.id,n])); degree = new Map();
  for (const edge of state.data.edges) for (const id of [edge.from,edge.to]) degree.set(id,(degree.get(id)||0)+1);
  document.title = state.data.title; $('map-title').textContent = state.data.title;
  $('inventory').replaceChildren();
  for (const [value,label] of [[state.data.nodes.length,'Notes'],[state.data.sources.length,'Sources'],[state.data.edges.length,state.data.edges.length === 1 ? 'Link' : 'Links']]) { const div = document.createElement('div'); div.className = 'stat'; const strong = document.createElement('strong'); strong.textContent = value.toLocaleString(); div.append(strong,document.createTextNode(label)); $('inventory').append(div); }
  for (const source of state.data.sources) state.enabled.add(source.id);
  bindControls(); renderFilters(); refreshVisible(); resize();
}
main().catch(error => { $('inventory').textContent = error.message; $('view-status').textContent = 'Map unavailable'; console.error(error); });
