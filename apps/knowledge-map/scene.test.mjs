import test from 'node:test';
import assert from 'node:assert/strict';
import { layoutNodes, rotate, project } from './scene.js';

test('orbiting moves world depth into the screen plane and preserves distance', () => {
  const point = { x: 0, y: 0, z: 1 };
  const turned = rotate(point, Math.PI / 2, 0);
  assert.ok(Math.abs(turned.x - 1) < 1e-10);
  assert.ok(Math.abs(turned.z) < 1e-10);
  const tilted = rotate({ x: 0.4, y: 0.5, z: 0.6 }, 1.4, 0.7);
  assert.ok(Math.abs(Math.hypot(tilted.x, tilted.y, tilted.z) - Math.hypot(0.4,0.5,0.6)) < 1e-10);
});

test('perspective makes foreground notes larger than background notes', () => {
  const camera = { yaw: 0, pitch: 0, zoom: 1 };
  const front = project({ x: 0.5, y: 0, z: 1 }, camera, 900, 650);
  const back = project({ x: 0.5, y: 0, z: -1 }, camera, 900, 650);
  assert.ok(front.scale > back.scale);
  assert.ok(front.x > back.x);
});

test('layout is deterministic, truly three-dimensional, and accepts empty data', () => {
  const nodes = Array.from({ length: 1000 }, (_, i) => ({ id: `note-${i}`, sourceId: `source-${i % 5}` }));
  const points = layoutNodes(nodes);
  assert.deepEqual(points, layoutNodes([...nodes].reverse()));
  assert.equal(layoutNodes([]).size, 0);
  assert.equal(points.size, nodes.length);
  assert.ok([...points.values()].some(p => p.z > 0.5));
  assert.ok([...points.values()].some(p => p.z < -0.5));
  for (const p of points.values()) assert.ok(Math.abs(Math.hypot(p.x,p.y,p.z) - 0.88) < 1e-10);
});
