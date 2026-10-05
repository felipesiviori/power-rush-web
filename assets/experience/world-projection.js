// All artwork and gameplay use the same image-space coordinates (1672 × 941).
export const WORLD_SIZE = { width: 1672, height: 941 };
export function makeProjection(
  width,
  height,
  chapter,
  progress = 0,
  pointer = 0,
  shake = 0,
) {
  const mobile = width <= 760;
  const zoom = 1.035 + progress * (chapter === 2 ? 0.065 : 0.02);
  const scale =
    Math.max(width / WORLD_SIZE.width, height / WORLD_SIZE.height) * zoom;
  const focusX = mobile ? (chapter === 1 ? 0.61 : 0.65) : 0.5;
  const x =
    (width - WORLD_SIZE.width * scale) * focusX +
    (mobile ? 0 : pointer * -5) +
    shake;
  const y = (height - WORLD_SIZE.height * scale) * 0.5;
  return {
    scale,
    x,
    y,
    imageWidth: WORLD_SIZE.width * scale,
    imageHeight: WORLD_SIZE.height * scale,
    point(u, v) {
      return {
        x: x + u * WORLD_SIZE.width * scale,
        y: y + v * WORLD_SIZE.height * scale,
      };
    },
    inverse(px, py) {
      return {
        u: (px - x) / (WORLD_SIZE.width * scale),
        v: (py - y) / (WORLD_SIZE.height * scale),
      };
    },
  };
}
export const FOREST_LANE = [
  [0.16, 0.18],
  [0.26, 0.255],
  [0.36, 0.327],
  [0.46, 0.407],
  [0.55, 0.478],
  [0.64, 0.553],
  [0.74, 0.635],
  [0.84, 0.725],
  [0.95, 0.825],
];
export function lanePoint(progress) {
  const n = Math.max(0, Math.min(1, progress)) * (FOREST_LANE.length - 1);
  const i = Math.min(FOREST_LANE.length - 2, Math.floor(n)),
    t = n - i;
  return {
    u: FOREST_LANE[i][0] + (FOREST_LANE[i + 1][0] - FOREST_LANE[i][0]) * t,
    v: FOREST_LANE[i][1] + (FOREST_LANE[i + 1][1] - FOREST_LANE[i][1]) * t,
  };
}
export function nearestLanePoint(projection, x, y) {
  let best = { progress: 0.62, distance: Infinity };
  for (let i = 0; i <= 200; i++) {
    const progress = i / 200,
      uv = lanePoint(progress),
      p = projection.point(uv.u, uv.v),
      distance = Math.hypot(x - p.x, y - p.y);
    if (distance < best.distance) best = { progress, distance };
  }
  return best;
}
