// Full-screen game atmospheres. The action is decorative; targets remain native buttons.
export function createGameWorld(host, readState) {
  const layer = document.createElement("div");
  layer.className = "game-worlds";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML =
    '<div class="world-backdrop world-forest"></div><div class="world-backdrop world-circuit"></div><div class="world-backdrop world-arena"></div><div class="world-shade"></div><canvas class="world-effects"></canvas><div class="world-grain"></div>';
  host.prepend(layer);
  const canvas = layer.querySelector("canvas"),
    ctx = canvas.getContext("2d");
  if (!ctx) return;
  let w = 1,
    h = 1,
    last = 0,
    clock = 0,
    previousChapter = -1;
  const bursts = [];
  let rally = null;
  new ResizeObserver(() => {
    w = host.clientWidth;
    h = host.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }).observe(host);
  function burst(x, y, color = "#7affbe") {
    bursts.push({ x, y, color, start: clock });
    if (bursts.length > 16) bursts.shift();
  }
  host.addEventListener("pointerdown", (event) => {
    const state = readState();
    if (
      state.paused ||
      ![1, 3].includes(state.chapter) ||
      event.target.closest("a,button")
    )
      return;
    const box = host.getBoundingClientRect(),
      x = (event.clientX - box.left) / w,
      y = (event.clientY - box.top) / h;
    if (state.chapter === 1) rally = { x, y };
    burst(x, y, state.chapter === 1 ? "#7affbe" : "#ffc785");
  });
  host.addEventListener("rush-hit", (event) => {
    const box = host.getBoundingClientRect(),
      r = event.detail.rect;
    burst(
      (r.left + r.width / 2 - box.left) / w,
      (r.top + r.height / 2 - box.top) / h,
      "#7affbe",
    );
  });
  const point = (x, y, r, color, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  function tracer(x1, y1, x2, y2, color, alpha = 1, width = 1.5) {
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, "transparent");
    g.addColorStop(1, color);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = g;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function forest(t, p) {
    // A small squad travels the central lane while towers exchange magical bolts.
    for (let i = 0; i < 7; i++) {
      const u = (t * 0.032 + i * 0.027 + p * 0.28) % 1;
      const x = w * (0.42 + u * 0.39),
        y = h * (0.76 - u * 0.36 + Math.sin(u * 7) * 0.035);
      ctx.shadowBlur = 12;
      ctx.shadowColor = "#45ffc0";
      point(x, y, 3.5, "#b5ffe4");
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = "#45ffc0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y + 7, 10, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const u = (t * 0.38 + i * 0.167) % 1;
      const x = w * (0.49 + u * 0.3),
        y = h * (0.38 + u * 0.19 - Math.sin(u * Math.PI) * 0.12);
      tracer(
        x - w * 0.025,
        y + h * 0.012,
        x,
        y,
        i % 2 ? "#ffd695" : "#69ffc7",
        0.85,
        2,
      );
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#00d47a";
      point(x, y, 3, "#e4fff1");
      ctx.shadowBlur = 0;
      if (u > 0.84) {
        ctx.globalAlpha = (1 - u) * 5;
        ctx.strokeStyle = "#6affc7";
        ctx.beginPath();
        ctx.ellipse(
          w * 0.79,
          h * 0.57,
          (u - 0.84) * w * 0.24,
          (u - 0.84) * h * 0.12,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }
    }
    for (let i = 0; i < 55; i++) {
      const x = w * (0.15 + ((i * 0.618 + t * 0.006) % 1) * 0.85),
        y = h * (0.24 + ((i * 0.381 + t * 0.009) % 1) * 0.7);
      point(
        x,
        y,
        1 + (i % 3) * 0.5,
        "#9effb9",
        0.1 + Math.max(0, Math.sin(t * 1.4 + i)) * 0.5,
      );
    }
    // Scroll places a rally marker further along the lane.
    const x = w * (rally?.x ?? 0.5 + p * 0.26),
      y = h * (rally?.y ?? 0.72 - p * 0.29),
      r = 20 + Math.sin(t * 3) * 3;
    ctx.globalAlpha = 0.65;
    ctx.strokeStyle = "#79ffc3";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  function race(t, p) {
    const vx = w * (0.64 + readState().cursorX * 0.025),
      vy = h * 0.46;
    for (let i = 0; i < 34; i++) {
      const u = (t * (0.42 + p * 0.4) + i / 34) % 1,
        k = u * u;
      const side = i % 2 ? 1 : -1;
      const ex = vx + side * w * (0.16 + (i % 7) * 0.1),
        ey = h * (0.74 + (i % 6) * 0.09);
      tracer(
        vx + (ex - vx) * k,
        vy + (ey - vy) * k,
        vx + (ex - vx) * Math.min(1.4, k + 0.08),
        vy + (ey - vy) * Math.min(1.4, k + 0.08),
        i % 3 ? "#60bfff" : "#b6ffe0",
        u * 0.65,
        1 + (i % 2),
      );
    }
    // First-person racing: the user steers the vanishing point with the cursor.
  }

  function arena(t, p) {
    const spots = [
      [0.55, 0.39],
      [0.76, 0.49],
      [0.61, 0.65],
    ];
    const index = Math.floor(t * 0.65) % 3,
      u = (t * 0.65) % 1;
    const [x, y] = spots[index];
    if (u < 0.17) {
      tracer(w * 0.55, h * 0.97, w * x, h * y, "#ffe1a5", 1 - u * 4, 2);
      point(w * x, h * y, 8 * (1 - u * 4), "#fff4cd", 1 - u * 4);
    }
    for (let i = 0; i < 30; i++) {
      const u = (t * 0.13 + i * 0.137) % 1;
      point(
        w * (0.38 + ((i * 0.237) % 1) * 0.6),
        h * (0.8 - u * 0.5),
        1.2,
        "#ffc890",
        (1 - u) * 0.4,
      );
    }
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#9bdac7";
    ctx.lineWidth = 1;
    const cx = w * (0.61 + Math.sin(p * 5) * 0.05),
      cy = h * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 17, cy);
    ctx.lineTo(cx - 5, cy);
    ctx.moveTo(cx + 5, cy);
    ctx.lineTo(cx + 17, cy);
    ctx.moveTo(cx, cy - 17);
    ctx.lineTo(cx, cy - 5);
    ctx.moveTo(cx, cy + 5);
    ctx.lineTo(cx, cy + 17);
    ctx.stroke();
  }
  function render(now) {
    requestAnimationFrame(render);
    if (now - last < 32) return;
    const delta = Math.min((now - last) / 1000, 0.05);
    last = now;
    const state = readState(),
      bounds = host.getBoundingClientRect();
    if (document.hidden || bounds.bottom < 0 || bounds.top > innerHeight)
      return;
    if (state.paused) {
      if (previousChapter !== -2) {
        ctx.clearRect(0, 0, w, h);
        previousChapter = -2;
      }
      return;
    }
    clock += delta * (state.rush ? 1.65 : 1);
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    const chapter = state.chapter;
    if (chapter !== previousChapter) {
      bursts.length = 0;
      previousChapter = chapter;
    }
    host.style.setProperty("--world-drift", `${state.chapterProgress * 26}px`);
    host.style.setProperty("--world-pan", `${state.cursorX * -12}px`);
    host.style.setProperty(
      "--world-scale",
      String(1.055 + state.chapterProgress * (chapter === 2 ? 0.14 : 0.035)),
    );
    if (chapter === 1) forest(clock, state.chapterProgress);
    if (chapter === 2) race(clock, state.chapterProgress);
    if (chapter === 3) arena(clock, state.chapterProgress);
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i],
        age = clock - b.start;
      if (age > 1) {
        bursts.splice(i, 1);
        continue;
      }
      tracer(
        w * 0.56,
        h * 0.98,
        w * b.x,
        h * b.y,
        b.color,
        Math.max(0, 1 - age * 5),
        2,
      );
      ctx.globalAlpha = 1 - age;
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w * b.x, h * b.y, 8 + age * 70, 0, Math.PI * 2);
      ctx.stroke();
      for (let j = 0; j < 12; j++) {
        const a = (j / 12) * Math.PI * 2;
        tracer(
          w * b.x + Math.cos(a) * age * 50,
          h * b.y + Math.sin(a) * age * 50,
          w * b.x + Math.cos(a) * age * 90,
          h * b.y + Math.sin(a) * age * 90,
          b.color,
          1 - age,
          1.5,
        );
      }
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(render);
}
