// World-space geometry: all three coordinates rotate before perspective projection.
export const TAU = Math.PI * 2;
export const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function layoutNodes(nodes) {
  const ordered = [...nodes].sort((a, b) => a.sourceId.localeCompare(b.sourceId) || a.id.localeCompare(b.id));
  return new Map(ordered.map((node, i) => {
    const y = 1 - 2 * (i + 0.5) / ordered.length;
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    const radius = Math.sqrt(1 - y * y);
    return [node.id, { x: Math.cos(angle) * radius * 0.88, y: y * 0.88, z: Math.sin(angle) * radius * 0.88 }];
  }));
}

export function rotate(point, yaw, pitch) {
  const x = point.x * Math.cos(yaw) + point.z * Math.sin(yaw);
  const z = -point.x * Math.sin(yaw) + point.z * Math.cos(yaw);
  return { x, y: point.y * Math.cos(pitch) - z * Math.sin(pitch), z: point.y * Math.sin(pitch) + z * Math.cos(pitch) };
}

export function project(point, camera, width, height) {
  const p = rotate(point, camera.yaw, camera.pitch);
  const perspective = 4 / (4 - p.z);
  const unit = Math.min(width * 0.37, height * 0.39) * camera.zoom;
  return { x: width / 2 + p.x * unit * perspective, y: height * 0.46 - p.y * unit * perspective, z: p.z, scale: perspective };
}

export function createOrbits() {
  const paths = [];
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 8;
    paths.push({ accent: false, points: Array.from({ length: 129 }, (_, j) => {
      const t = j / 128 * TAU;
      return { x: Math.cos(t) * Math.cos(angle), y: Math.sin(t), z: Math.cos(t) * Math.sin(angle) };
    }) });
  }
  for (const y of [-0.75, -0.4, 0, 0.4, 0.75]) {
    const radius = Math.sqrt(1 - y * y);
    paths.push({ accent: false, points: Array.from({ length: 129 }, (_, j) => ({ x: Math.cos(j / 128 * TAU) * radius, y, z: Math.sin(j / 128 * TAU) * radius })) });
  }
  for (const tilt of [-0.42, 0.55, 1.25]) {
    paths.push({ accent: true, points: Array.from({ length: 161 }, (_, j) => rotate({ x: Math.cos(j / 160 * TAU) * 1.13, y: 0, z: Math.sin(j / 160 * TAU) * 1.13 }, tilt, tilt)) });
  }
  return paths;
}
