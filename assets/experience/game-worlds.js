import {
  makeProjection,
  lanePoint,
  nearestLanePoint,
} from "./world-projection.js";

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
  const backgrounds = [
    null,
    layer.querySelector(".world-forest"),
    layer.querySelector(".world-circuit"),
    layer.querySelector(".world-arena"),
  ];
  const car = new Image();
  car.src = "/assets/experience/scenes/race-car.webp";
  const targets = [...host.querySelectorAll(".reaction-target")];
  let w = 1,
    h = 1,
    last = 0,
    time = 0,
    phase = -1,
    projection = makeProjection(1, 1, 0),
    lane = 0.86,
    order = 0.59,
    command = false;
  let steering = 0,
    steerOverride = null,
    velocity = 0,
    travel = 0,
    lastShot = -10,
    combo = 0;
  const bursts = [],
    marks = [],
    keys = new Set();
  const battleLabel = host.querySelector(".battle-status"),
    raceLabel = host.querySelector(".race-status");
  new ResizeObserver(() => {
    w = host.clientWidth;
    h = host.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }).observe(host);
  host.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse" && !e.target.closest("button,a"))
      steerOverride = null;
  });
  host.querySelectorAll("[data-steer]").forEach((b) =>
    b.addEventListener("click", () => {
      steerOverride = Math.max(
        -1,
        Math.min(
          1,
          (steerOverride ?? steering) + Number(b.dataset.steer) * 0.55,
        ),
      );
    }),
  );
  document.addEventListener("keydown", (e) => {
    if (readState().chapter !== 2 || e.target.closest("input,textarea,select"))
      return;
    if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) {
      e.preventDefault();
      keys.add(e.key);
    }
  });
  document.addEventListener("keyup", (e) => keys.delete(e.key));
  window.addEventListener("blur", () => keys.clear());
  function fire(x, y, hit = false) {
    if (readState().paused) return;
    const uv = projection.inverse(x, y);
    bursts.push({ u: uv.u, v: uv.v, start: time, hit });
    if (bursts.length > 12) bursts.shift();
    if (!hit) {
      marks.push({ u: uv.u, v: uv.v, start: time });
      if (marks.length > 8) marks.shift();
      combo = 0;
    } else combo = time - lastShot < 4 ? combo + 1 : 1;
    lastShot = time;
    const response = host.querySelector(".hit-feedback");
    response.textContent = hit
      ? combo >= 3
        ? "TRIPLE HIT"
        : combo === 2
          ? "DOUBLE HIT"
          : "IMPACTO"
      : "VOLVÉ A APUNTAR";
    response.classList.remove("pop");
    void response.offsetWidth;
    response.classList.add("pop");
  }
  host.addEventListener("pointerdown", (e) => {
    const state = readState();
    if (
      state.paused ||
      e.target.closest("a,button") ||
      ![1, 3].includes(state.chapter)
    )
      return;
    const box = host.getBoundingClientRect(),
      x = e.clientX - box.left,
      y = e.clientY - box.top;
    if (state.chapter === 1) {
      const nearest = nearestLanePoint(projection, x, y);
      order = Math.max(0.4, Math.min(0.85, nearest.progress));
      command = true;
    } else fire(x, y);
  });
  host.addEventListener("rush-hit", (e) => {
    const box = host.getBoundingClientRect(),
      r = e.detail.rect;
    fire(r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top, true);
  });
  host.addEventListener("rush-miss", (e) => {
    const box = host.getBoundingClientRect(),
      r = e.detail.rect;
    fire(
      r.left + r.width / 2 - box.left,
      r.top + r.height / 2 - box.top,
      false,
    );
  });
  const dot = (x, y, r, color, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  };
  function line(a, b, color, width = 1, alpha = 1) {
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  function glow(p, r, color) {
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "transparent");
    ctx.globalAlpha = 1;
    ctx.fillStyle = g;
    ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  }
  function unit(progress, side, index, moving) {
    const uv = lanePoint(progress),
      p = projection.point(
        uv.u + (index % 2 ? -0.008 : 0.008),
        uv.v + (index % 2 ? 0.008 : -0.008),
      );
    const s = projection.scale * (0.65 + uv.v * 0.9),
      step = moving ? Math.sin(time * 9 + index) * 2.2 : 0;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(s, s);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#0009";
    ctx.beginPath();
    ctx.ellipse(0, 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Grounded silhouettes: boots, cape, armor, helmet and a forward lance.
    ctx.strokeStyle = "#b2b9b1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-3, -5);
    ctx.lineTo(-4 + step, 1);
    ctx.moveTo(3, -5);
    ctx.lineTo(4 - step, 1);
    ctx.stroke();
    ctx.fillStyle = side === "ally" ? "#0b8066" : "#932e35";
    ctx.beginPath();
    ctx.moveTo(-6, -17);
    ctx.lineTo(6, -17);
    ctx.lineTo(8, -3);
    ctx.lineTo(-7, -3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#9facaa";
    ctx.fillRect(-4, -18, 8, 9);
    ctx.strokeStyle = "#dae7df";
    ctx.lineWidth = 1;
    ctx.strokeRect(-4, -18, 8, 9);
    ctx.fillStyle = "#273f40";
    ctx.beginPath();
    ctx.arc(0, -22, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = side === "ally" ? "#75ffc0" : "#ff9b7e";
    ctx.fillRect(-3, -23, 6, 2);
    ctx.strokeStyle = "#b8c7bf";
    ctx.beginPath();
    ctx.moveTo(6, -8);
    ctx.lineTo(side === "ally" ? -9 : 14, -30);
    ctx.stroke();
    ctx.fillStyle = side === "ally" ? "#4af6ba" : "#ff7959";
    ctx.fillRect(-9, -34, 18, 2);
    ctx.restore();
    return p;
  }
  function forest(dt) {
    const desired = command ? order : 0.6;
    lane += Math.max(-dt * 0.027, Math.min(dt * 0.027, desired - lane));
    const moving = Math.abs(desired - lane) > 0.008;
    const enemyLane = 0.535 + Math.min(0.02, time * 0.001);
    const allies = [],
      enemies = [];
    for (let i = 3; i >= 0; i--)
      allies.push(unit(Math.min(0.99, lane + i * 0.029), "ally", i, moving));
    for (let i = 2; i >= 0; i--)
      enemies.push(unit(enemyLane - i * 0.029, "enemy", i, false));
    const goal = lanePoint(desired),
      target = projection.point(goal.u, goal.v),
      radius = 24 * projection.scale;
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = "#74ffbd";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(target.x, target.y, radius, radius * 0.42, 0.4, 0, Math.PI * 2);
    ctx.stroke();
    // Route is drawn on the actual stone lane, not through the forest.
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#80ffd0";
    ctx.setLineDash([4 * projection.scale, 7 * projection.scale]);
    ctx.lineDashOffset = -time * 10;
    ctx.beginPath();
    for (let i = 0; i <= 30; i++) {
      const uv = lanePoint(lane + ((desired - lane) * i) / 30),
        p = projection.point(uv.u, uv.v);
      i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    const engaged = Math.abs(lane - enemyLane) < 0.095;
    battleLabel.textContent = engaged
      ? "CONTACTO · DEFENDÉ LA LÍNEA"
      : moving
        ? "TU EQUIPO AVANZA POR LA LÍNEA"
        : "POSICIÓN TOMADA";
    if (engaged) {
      for (let i = 0; i < 2; i++) {
        const a = i ? enemies[enemies.length - 1] : allies[allies.length - 1],
          b = i ? allies[allies.length - 1] : enemies[enemies.length - 1],
          q = (time * 1.1 + i * 0.5) % 1;
        const p = {
          x: a.x + (b.x - a.x) * q,
          y:
            a.y -
            14 * projection.scale +
            (b.y - a.y) * q -
            Math.sin(q * Math.PI) * 13 * projection.scale,
        };
        const prev = { x: p.x - (b.x - a.x) * 0.1, y: p.y - (b.y - a.y) * 0.1 };
        line(prev, p, i ? "#ffa675" : "#a4ffe0", 2 * projection.scale, 0.9);
        glow(p, 8 * projection.scale, i ? "#ff703c90" : "#00ffae90");
        if (q > 0.86) {
          const age = (q - 0.86) / 0.14;
          glow(
            { x: b.x, y: b.y - 12 * projection.scale },
            (8 + age * 14) * projection.scale,
            `rgba(255,207,134,${(1 - age) * 0.6})`,
          );
        }
      }
    }
    // Clear objectives at the two opposing front lines.
    const lead = allies[allies.length - 1];
    ctx.globalAlpha = 0.85;
    ctx.font = `${Math.max(8, 9 * projection.scale)}px monospace`;
    ctx.textAlign = "center";
    ctx.fillStyle = "#a9ffdc";
    ctx.fillText("TU EQUIPO", lead.x, lead.y - 45 * projection.scale);
    ctx.textAlign = "left";
  }
  function race(dt, state) {
    let target = steerOverride ?? state.cursorX;
    if (keys.has("ArrowLeft") || keys.has("a")) target = -1;
    if (keys.has("ArrowRight") || keys.has("d")) target = 1;
    steering += (target - steering) * Math.min(1, dt * 5);
    velocity += ((state.rush ? 1.7 : 1) - velocity) * dt * 2;
    travel += dt * velocity;
    raceLabel.textContent = state.rush
      ? "TURBO ACTIVADO"
      : "EN PISTA · VOS MANEJÁS";
    const vanishing = { u: 0.645, v: 0.458 };
    // Reflective road strips expand from the same vanishing point as the photograph.
    for (let i = 0; i < 22; i++) {
      const depth = ((travel * 0.5 + i / 22) % 1) ** 2;
      const laneSide = i % 2 ? 1 : -1,
        endU = vanishing.u + laneSide * (0.28 + (i % 3) * 0.09),
        endV = 1.03;
      const a = projection.point(
        vanishing.u + (endU - vanishing.u) * depth,
        vanishing.v + (endV - vanishing.v) * depth,
      );
      const next = Math.min(1, depth + 0.04),
        b = projection.point(
          vanishing.u + (endU - vanishing.u) * next,
          vanishing.v + (endV - vanishing.v) * next,
        );
      line(
        a,
        b,
        i % 3 ? "#b4e4ff" : "#5dd9ff",
        Math.max(1, depth * 3 * projection.scale),
        depth * 0.5,
      );
    }
    const foot = projection.point(
        (w <= 760 ? 0.575 : 0.5) + steering * (w <= 760 ? 0.025 : 0.06),
        w <= 760 ? 0.72 : 0.8,
      ),
      size = (w <= 760 ? 200 : 340) * projection.scale;
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(
      foot.x,
      foot.y - 4 * projection.scale,
      size * 0.43,
      size * 0.09,
      -steering * 0.025,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
    glow(
      { x: foot.x, y: foot.y - 10 * projection.scale },
      size * 0.55,
      state.rush ? "#397dff38" : "#00d47a15",
    );
    if (car.complete && car.naturalWidth) {
      // Crop transparent margins using the inspected source alpha bounds.
      const bounds = CAR_BOUNDS,
        ratio = bounds.h / bounds.w,
        dh = size * ratio;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.translate(foot.x, foot.y);
      ctx.rotate(steering * 0.028 + Math.sin(time * 28) * 0.0015 * velocity);
      ctx.drawImage(
        car,
        bounds.x,
        bounds.y,
        bounds.w,
        bounds.h,
        -size / 2,
        -dh,
        size,
        dh,
      );
      ctx.restore();
      if (state.rush) {
        for (const sign of [-1, 1]) {
          const a = {
              x: foot.x + sign * size * 0.28,
              y: foot.y - 7 * projection.scale,
            },
            b = {
              x: a.x + sign * 10 * projection.scale,
              y: a.y + 45 * projection.scale,
            };
          line(a, b, "#69bcff", 5 * projection.scale, 0.65);
          glow(a, 15 * projection.scale, "#6dbeff99");
        }
      }
    }
  }
  function arena() {
    const anchors =
      w <= 760
        ? [
            [0.54, 0.5],
            [0.62, 0.555],
            [w < 360 ? 0.685 : 0.71, 0.49],
          ]
        : [
            [0.525, 0.505],
            [0.7, 0.485],
            [0.835, 0.56],
          ];
    targets.forEach((button, i) => {
      const [u, v] = anchors[i],
        p = projection.point(u, v),
        size = (93 + (v - 0.48) * 300) * projection.scale;
      const bob = Math.sin(time * 1.7 + i * 2) * 3 * projection.scale;
      button.style.left = `${p.x}px`;
      button.style.top = `${p.y + bob}px`;
      button.style.width = `${Math.max(w <= 760 ? 48 : 58, size)}px`;
      button.style.height = `${Math.max(w <= 760 ? 48 : 58, size) * 0.84}px`;
      const ground = projection.point(u, v + 0.057);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(
        ground.x,
        ground.y,
        size * 0.36,
        size * 0.075,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      line(
        { x: ground.x, y: ground.y },
        { x: p.x, y: p.y + size * 0.26 },
        "#53bcb1",
        1,
        0.1,
      );
    });
    for (const mark of marks) {
      const p = projection.point(mark.u, mark.v);
      dot(p.x, p.y, 3 * projection.scale, "#070908", 0.8);
    }
  }
  function impacts() {
    for (let i = bursts.length - 1; i >= 0; i--) {
      const b = bursts[i],
        age = time - b.start;
      if (age > 1.2) {
        bursts.splice(i, 1);
        continue;
      }
      const p = projection.point(b.u, b.v),
        muzzle = projection.point(0.61, 1.01),
        s = projection.scale;
      if (age < 0.12) {
        line(muzzle, p, "#fff0c1", 2 * s, 1 - age / 0.12);
        glow(muzzle, 45 * s, `rgba(255,174,80,${(1 - age / 0.12) * 0.65})`);
      }
      glow(
        p,
        (10 + age * 32) * s,
        `rgba(255,178,74,${Math.max(0, 0.75 - age * 1.4)})`,
      );
      for (let j = 0; j < (b.hit ? 20 : 7); j++) {
        const angle = j * 2.399,
          speed = (25 + (j % 5) * 13) * s;
        const x = p.x + Math.cos(angle) * age * speed,
          y = p.y + Math.sin(angle) * age * speed + age * age * 45 * s;
        line(
          { x: x - Math.cos(angle) * 6 * s, y: y - Math.sin(angle) * 6 * s },
          { x, y },
          j % 3 ? "#ffd590" : "#fff8e4",
          1.5 * s,
          Math.max(0, 1 - age),
        );
      }
      if (b.hit && age < 0.27) {
        ctx.globalAlpha = 1 - age / 0.27;
        ctx.strokeStyle = "#eef5ee";
        ctx.lineWidth = 2 * s;
        const r = (13 + age * 20) * s;
        for (const sign of [-1, 1]) {
          line(
            { x: p.x + sign * r, y: p.y + sign * r },
            { x: p.x + sign * (r + 7 * s), y: p.y + sign * (r + 7 * s) },
            "#fff",
            2 * s,
            1 - age / 0.27,
          );
          line(
            { x: p.x + sign * r, y: p.y - sign * r },
            { x: p.x + sign * (r + 7 * s), y: p.y - sign * (r + 7 * s) },
            "#fff",
            2 * s,
            1 - age / 0.27,
          );
        }
      }
    }
  }
  function render(now) {
    requestAnimationFrame(render);
    if (now - last < 32) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const state = readState(),
      rect = host.getBoundingClientRect();
    if (document.hidden || rect.bottom < 0 || rect.top > innerHeight) return;
    if (state.paused) {
      ctx.clearRect(0, 0, w, h);
      return;
    }
    time += dt;
    if (phase !== state.chapter) {
      phase = state.chapter;
      bursts.length = 0;
      marks.length = 0;
      keys.clear();
      if (phase === 1) {
        lane = w <= 760 ? 0.7 : 0.86;
        order = 0.59;
        command = false;
      }
      if (phase === 2) {
        steering = 0;
        velocity = 0.2;
        steerOverride = null;
      }
      combo = 0;
    }
    const shake =
      phase === 3
        ? Math.sin((time - lastShot) * 80) *
          Math.max(0, 1 - (time - lastShot) / 0.18) *
          3
        : 0;
    projection = makeProjection(
      w,
      h,
      phase,
      state.chapterProgress,
      state.cursorX,
      shake,
    );
    const bg = backgrounds[phase];
    if (bg) {
      bg.style.backgroundSize = `${projection.imageWidth}px ${projection.imageHeight}px`;
      bg.style.backgroundPosition = `${projection.x}px ${projection.y}px`;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    if (phase === 1) forest(dt);
    if (phase === 2) race(dt, state);
    if (phase === 3) {
      arena();
      impacts();
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(render);
}
const CAR_BOUNDS = { x: 60, y: 145, w: 1410, h: 745 };
