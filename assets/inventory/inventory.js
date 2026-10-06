const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const flavors = {
  cp: {
    name: "Cherry Pop",
    title: "CHERRY<br><em>POP.</em>",
    slug: "cherry-pop",
    description:
      "Cereza refrescante y suave. Rico y fácil de tomar todos los días.",
  },
  bf: {
    name: "Blue Fizz",
    title: "BLUE<br><em>FIZZ.</em>",
    slug: "blue-fizz",
    description:
      "Ácido intenso. El más fuerte de la línea, para los que buscan un sabor que se sienta.",
  },
};
const state = {
  flavor: "cp",
  step: 0,
  local: 0,
  selected: false,
  paused: reduced.matches,
  rotation: 0,
  target: 0,
  manual: 0,
  active: false,
};
const stage = $("#inspection");
let rendererAPI;
let lastStep = -1;
let lastCartCount = -1;
let toastTimer;
function announce(message) {
  $(".toast").textContent = message;
  $(".toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $(".toast").classList.remove("show"), 2800);
}
function choose(flavor, navigate = false) {
  state.flavor = flavor;
  state.selected = true;
  document.body.dataset.flavor = flavor;
  $(".buy-bar").hidden = false;
  $("#flavor-title").innerHTML = flavors[flavor].title;
  $("#flavor-description").textContent = flavors[flavor].description;
  $("#buy-name").textContent = flavors[flavor].name.toUpperCase();
  $("#mobile-flavor").textContent = flavors[flavor].name.toUpperCase() + " · ";
  $$(".flavor-switch button").forEach((b) =>
    b.setAttribute("aria-pressed", String(b.dataset.flavor === flavor)),
  );
  updatePoster();
  updateMix();
  updatePrice();
  rendererAPI?.loadSelected();
  if (navigate) {
    goStep(0);
    $("#flavor-title").focus({ preventScroll: true });
  }
}
function updatePoster() {
  const open = state.step === 4;
  const img = $("#inspect-poster");
  img.src = open
    ? `/assets/inventory/posters/${flavors[state.flavor].slug}-open.webp`
    : `/assets/experience/posters/${flavors[state.flavor].slug}.png`;
  img.alt = `${flavors[state.flavor].name}${open ? ", pote abierto con polvo, scoop y tapa" : ""}`;
}
$$("[data-select]").forEach((b) =>
  b.addEventListener("click", () => choose(b.dataset.select, true)),
);
$$(".flavor-switch button").forEach((b) =>
  b.addEventListener("click", () => choose(b.dataset.flavor)),
);
function updateMix() {
  const n = Number($("#quantity").value);
  $(".buy-mix").hidden = n === 1;
  const other = state.flavor === "cp" ? "bf" : "cp";
  $("#mix").innerHTML =
    `<option value="0">${n} ${flavors[state.flavor].name}</option>` +
    Array.from(
      { length: n - 1 },
      (_, i) =>
        `<option value="${i + 1}">${n - i - 1} ${flavors[state.flavor].name} + ${i + 1} ${flavors[other].name}</option>`,
    ).join("");
}
function order() {
  const n = Number($("#quantity").value);
  const otherN = n > 1 ? Number($("#mix").value) : 0;
  return [
    [state.flavor, n - otherN],
    [state.flavor === "cp" ? "bf" : "cp", otherN],
  ].filter(([, q]) => q > 0);
}
function updatePrice() {
  const cart = window.PowerCart;
  if (!cart) {
    $("#add").disabled = true;
    return;
  }
  const q = Number($("#quantity").value);
  const total = cart.count() + q;
  lastCartCount = cart.count();
  $("#price").textContent = cart.money(cart.unitPrice(total) * q);
  $("#reward").textContent =
    total >= 3
      ? "−15% + ENVÍO GRATIS"
      : total === 2
        ? "−10% + ENVÍO GRATIS"
        : "PRECIO DE LISTA";
  const unavailable = order().some(
    ([id, n]) =>
      cart.soldOut(id) ||
      (cart.stock(id)?.qty != null && cart.stock(id).qty < n),
  );
  $("#add").disabled = unavailable;
  $("#add").innerHTML = unavailable
    ? "ÍTEM NO DISPONIBLE"
    : "AGREGAR AL INVENTARIO <span>↗</span>";
  $$("[data-select]").forEach((b) => {
    const out = cart.soldOut(b.dataset.select);
    b.querySelector(".availability").textContent = out
      ? "NO DISPONIBLE"
      : "DISPONIBLE ↗";
    b.setAttribute(
      "aria-label",
      `Inspeccionar ${flavors[b.dataset.select].name}${out ? " · agotado" : ""}`,
    );
  });
}
$("#quantity").addEventListener("change", () => {
  updateMix();
  updatePrice();
});
$("#mix").addEventListener("change", updatePrice);
$$("[data-quantity]").forEach((b) =>
  b.addEventListener("click", () => {
    if (!state.selected) choose(state.flavor);
    $("#quantity").value = b.dataset.quantity;
    updateMix();
    updatePrice();
    announce(
      `${b.dataset.quantity} ${b.dataset.quantity === "1" ? "pote seleccionado" : "potes seleccionados"}`,
    );
  }),
);
$("#add").addEventListener("click", () => {
  const cart = window.PowerCart;
  if (!cart || $("#add").disabled) return;
  const before = cart.count();
  const requested = order().reduce((n, [, q]) => n + q, 0);
  order().forEach(([id, q]) => cart.add(id, q));
  const added = cart.count() - before;
  announce(
    added === requested
      ? added === 1
        ? "Ítem agregado"
        : "Ítems agregados"
      : added > 0
        ? "Agregado hasta el stock disponible"
        : "No hay más stock disponible",
  );
  updatePrice();
});
document.addEventListener("pr:catalog", updatePrice);
window.addEventListener("pageshow", updatePrice);
window.addEventListener("focus", updatePrice);
function goStep(i) {
  if (!state.selected) choose(state.flavor);
  const distance = stage.offsetHeight - innerHeight;
  const top = stage.getBoundingClientRect().top + scrollY;
  window.scrollTo({
    top: top + (distance * (i + 0.25)) / 5,
    behavior: state.paused ? "instant" : "smooth",
  });
}
$$("[data-step]").forEach((b) =>
  b.addEventListener("click", () => goStep(Number(b.dataset.step))),
);
function scrollUpdate() {
  const box = stage.getBoundingClientRect();
  const progress = clamp(-box.top / (stage.offsetHeight - innerHeight));
  const p = progress * 5;
  state.step = Math.min(4, Math.floor(p));
  state.local = p - state.step;
  state.active = box.top < innerHeight && box.bottom > 0;
  if (box.top <= 10 && !state.selected) choose(state.flavor);
  if (state.step !== lastStep) {
    state.manual = 0;
    lastStep = state.step;
    $$(".panel").forEach((el, i) => {
      el.classList.toggle("active", i === state.step);
      el.inert = i !== state.step;
      el.setAttribute("aria-hidden", String(i !== state.step));
    });
    $$("[data-step]").forEach((b, i) =>
      b.setAttribute("aria-current", i === state.step ? "step" : "false"),
    );
    $("#view-name").textContent = [
      "01 / FRENTE",
      "02 / BENEFICIOS",
      "03 / FÓRMULA",
      "04 / PREPARACIÓN",
      "05 / POTE ABIERTO",
    ][state.step];
    $(".chapter-progress span").style.transform =
      `scaleX(${(state.step + 1) / 5})`;
    updatePoster();
    rendererAPI?.loadSelected();
  }
  $$(".benefit-list>div").forEach((el, i) =>
    el.classList.toggle("revealed", state.paused || state.local > i * 0.17),
  );
  // The hold occupies most of each chapter; rotation happens between label stops.
  const angles = [0, -1.325, -3.829, -4.737, -Math.PI * 2];
  const t = clamp((state.local - 0.74) / 0.26);
  const eased = t * t * (3 - 2 * t);
  state.target =
    angles[state.step] +
    (angles[Math.min(state.step + 1, 4)] - angles[state.step]) * eased;
  if (state.step >= 3) rendererAPI?.preloadOpen();
}
window.addEventListener("scroll", scrollUpdate, { passive: true });
window.addEventListener("resize", scrollUpdate);
function setMotion() {
  $(".rotation-controls").hidden = state.paused;
  $("#drag-hint").textContent = state.paused
    ? "VISTA SIN MOVIMIENTO"
    : "ARRASTRÁ PARA GIRAR ↔";
  document.body.classList.toggle("is-paused", state.paused);
  $("#motion").setAttribute("aria-pressed", String(state.paused));
  $("#motion").textContent = state.paused ? "ACTIVAR GIRO ▷" : "PAUSAR GIRO Ⅱ";
  if (state.paused) $("#inspect-model").classList.remove("ready");
  scrollUpdate();
}
$("#motion").addEventListener("click", () => {
  state.paused = !state.paused;
  setMotion();
  if (!state.paused && !rendererAPI) start3D();
});
reduced.addEventListener("change", () => {
  state.paused = reduced.matches;
  setMotion();
  if (!state.paused && !rendererAPI) start3D();
});
const modelZone = $("#inspect-model");
let drag = null;
modelZone.addEventListener("pointerdown", (e) => {
  if (e.target.tagName === "CANVAS" && !state.paused) {
    drag = { x: e.clientX, start: state.manual };
    modelZone.setPointerCapture(e.pointerId);
  }
});
modelZone.addEventListener("pointermove", (e) => {
  if (drag) state.manual = drag.start + (e.clientX - drag.x) * 0.012;
});
["pointerup", "pointercancel", "lostpointercapture"].forEach((type) =>
  modelZone.addEventListener(type, () => (drag = null)),
);
modelZone.addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
    e.preventDefault();
    state.manual += e.key === "ArrowLeft" ? -0.25 : 0.25;
  }
});
$("#rotate-left").addEventListener("click", () => (state.manual -= 0.4));
$("#rotate-right").addEventListener("click", () => (state.manual += 0.4));
$("#reset-rotation").addEventListener("click", () => (state.manual = 0));
updateMix();
updatePrice();
setMotion();
// Keep the quote in sync with changes made inside the existing cart drawer.
setInterval(() => {
  if (!document.hidden && window.PowerCart?.count() !== lastCartCount)
    updatePrice();
}, 700);
let starting = false;
async function start3D() {
  if (starting || state.paused) return;
  starting = true;
  try {
    const { createProductViews } = await import("./products.js");
    rendererAPI = await createProductViews(state, flavors);
    rendererAPI.loadSelected();
  } catch (error) {
    console.warn("Product renders remain available.", error);
    $("#drag-hint").textContent = "VISTA DEL PRODUCTO";
    $(".rotation-controls").hidden = true;
  }
}
if (!state.paused) start3D();
