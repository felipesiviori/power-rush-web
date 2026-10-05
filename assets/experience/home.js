import Lenis from "./vendor/lenis.mjs";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (n) => n * n * (3 - 2 * n);
const media = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 760px)");
const state = {
  paused: media.matches,
  flavor: "cherry",
  story: 0,
  progress: 0,
  turn: 0,
  pointer: 0,
  heroFlavor: "cherry",
  heroFlavorStart: 0,
  rush: false,
  cursorX: 0,
  cursorY: 0,
  visible: true,
};
let lenis;
let storyTop = 0;
let storyHeight = 0;
let pageHeight = 0;
let scrollPending = false;
let revealAnimations = [];

function measure() {
  storyTop = $("#inside").getBoundingClientRect().top + window.scrollY;
  storyHeight = $("#inside").offsetHeight;
  pageHeight = document.documentElement.scrollHeight;
}
function setStory(index) {
  if (state.story === index) return;
  state.story = index;
  $$(".story-panel").forEach((panel, i) => {
    panel.classList.toggle("active", i === index);
    panel.setAttribute("aria-hidden", String(i !== index));
    panel.querySelectorAll("a").forEach((a) => {
      a.tabIndex = i === index ? 0 : -1;
    });
  });
  $$("[data-step]").forEach((button, i) => {
    button.classList.toggle("active", i === index);
    button.setAttribute("aria-pressed", String(i === index));
  });
}
function updateScroll() {
  state.progress = clamp(
    (window.scrollY - storyTop) / Math.max(1, storyHeight - window.innerHeight),
  );
  setStory(
    state.paused || document.body.classList.contains("no-webgl")
      ? 0
      : state.progress > 0.48
        ? 1
        : 0,
  );
  $(".track-line > span").style.transform = `scaleX(${state.progress})`;
  $(".reading-progress > span").style.transform =
    `scaleX(${clamp(window.scrollY / (pageHeight - window.innerHeight))})`;
  const p =
    state.paused || document.body.classList.contains("no-webgl")
      ? 0
      : state.progress;
  const fade = (selector, opacity, y = 0) => {
    const el = $(selector);
    el.style.opacity = opacity;
    el.style.transform = `translateY(${y}px)`;
    el.style.visibility = opacity < 0.02 ? "hidden" : "visible";
    el.setAttribute("aria-hidden", String(opacity < 0.02));
    el.querySelectorAll("a").forEach(
      (a) => (a.tabIndex = opacity < 0.02 ? -1 : 0),
    );
  };
  const intro = 1 - smooth(clamp(p / 0.23));
  fade(".portal-intro", intro, -p * 150);
  fade(".portal-tag", intro);
  const focus =
    smooth(clamp((p - 0.2) / 0.15)) * (1 - smooth(clamp((p - 0.53) / 0.12)));
  fade(".portal-focus", focus, (1 - focus) * 45);
  const formula = smooth(clamp((p - 0.62) / 0.14));
  fade(".portal-formula", formula, (1 - formula) * 45);
  fade(".portal-dose", formula);
  $(".portal-word").style.opacity = 1 - smooth(clamp(p / 0.21));
  $(".portal-word").style.transform =
    `translateY(${-p * 300}px) scale(${1 + p * 0.5})`;
  $(".portal-status").textContent =
    p < 0.24
      ? "01 / LISTO PARA ENTRAR"
      : p < 0.63
        ? "02 / ENTRANDO EN FOCO"
        : "03 / TU FÓRMULA, ABIERTA";
  scrollPending = false;
}
function setupMotion() {
  if (state.paused) {
    lenis?.destroy();
    lenis = null;
    revealAnimations.forEach((animation) => {
      animation.progress(1);
      animation.scrollTrigger?.kill();
    });
    revealAnimations = [];
    document.body.classList.add("motion-paused");
    $(".hero-art").style.transform = "";
    $(".hero-art").style.opacity = "";
  } else {
    document.body.classList.remove("motion-paused");
    if (!lenis)
      lenis = new Lenis({
        duration: 0.95,
        smoothWheel: true,
        anchors: { offset: -110 },
      });
  }
  $(".motion-toggle").setAttribute("aria-pressed", String(state.paused));
  $(".motion-toggle").innerHTML = state.paused
    ? 'ACTIVAR ANIMACIONES <span aria-hidden="true">▷</span>'
    : 'PAUSAR ANIMACIONES <span aria-hidden="true">Ⅱ</span>';
  measure();
  updateScroll();
}
setupMotion();
$(".motion-toggle").addEventListener("click", () => {
  state.paused = !state.paused;
  setupMotion();
});
media.addEventListener("change", (event) => {
  state.paused = event.matches;
  setupMotion();
});
function scrollLoop(time) {
  lenis?.raf(time);
  requestAnimationFrame(scrollLoop);
}
requestAnimationFrame(scrollLoop);
window.addEventListener(
  "scroll",
  () => {
    if (!scrollPending) {
      scrollPending = true;
      requestAnimationFrame(updateScroll);
    }
  },
  { passive: true },
);
window.addEventListener("resize", () => {
  measure();
  updateScroll();
});
new ResizeObserver(measure).observe(document.body);
document.fonts.ready.then(() => {
  measure();
  updateScroll();
});
const menuButton = $(".menu-toggle");
const menu = $("#mobile-menu");
function closeMenu() {
  menu.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Abrir menú");
  document.body.style.overflow = "";
  lenis?.start();
}
menuButton.addEventListener("click", () => {
  if (!menu.hidden) {
    closeMenu();
    return;
  }
  menu.hidden = false;
  menuButton.setAttribute("aria-expanded", "true");
  menuButton.setAttribute("aria-label", "Cerrar menú");
  document.body.style.overflow = "hidden";
  lenis?.stop();
});
menu
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (menu.hidden) return;
  if (event.key === "Escape") {
    closeMenu();
    menuButton.focus();
  }
  if (event.key === "Tab") {
    const last = [...menu.querySelectorAll("a")].at(-1);
    if (event.shiftKey && document.activeElement === menuButton) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      menuButton.focus();
    }
  }
});
mobile.addEventListener("change", (event) => {
  if (!event.matches) closeMenu();
});
// Keep smooth scrolling in sync with the existing cart drawer.
new MutationObserver(() => {
  if (document.body.style.overflow === "hidden") lenis?.stop();
  else lenis?.start();
}).observe(document.body, { attributes: true, attributeFilter: ["style"] });
document.addEventListener(
  "click",
  (event) => {
    if (event.target.closest("[data-pr-open]") && !menu.hidden) closeMenu();
  },
  true,
);

const flavors = {
  cherry: {
    title: "CHERRY <span>POP.</span>",
    ghost: "CHERRY<br>POP",
    name: "Cherry Pop",
    note: "Cereza refrescante · Pote de 300 g",
    code: "PR — 001 / CHERRY POP",
    description:
      "Cereza refrescante y suave. Para los que entran tranquilos y dejan su marca en la partida.",
    chips: ["SUAVE", "REFRESCANTE"],
    poster: "/assets/experience/posters/cherry-pop.png",
  },
  blue: {
    title: "BLUE <span>FIZZ.</span>",
    ghost: "BLUE<br>FIZZ",
    name: "Blue Fizz",
    note: "Ácido intenso · Pote de 300 g",
    code: "PR — 002 / BLUE FIZZ",
    description:
      "Ácido, intenso y sin vueltas. Blue Fizz es para los que eligen sabores con carácter desde el primer sorbo.",
    chips: ["ÁCIDO", "INTENSO"],
    poster: "/assets/experience/posters/blue-fizz.png",
  },
};
$$("[data-hero-flavor]").forEach((button) =>
  button.addEventListener("click", () => {
    const flavor = button.dataset.heroFlavor;
    state.heroFlavor = flavor;
    state.heroFlavorStart = performance.now();
    $("#inside-stage .model-poster").src = flavors[flavor].poster;
    $("#hero").dataset.flavor = flavor;
    $(".hero-flavor-name").textContent = flavors[flavor].name.toUpperCase();
    $(".hero-flavor-note").textContent = flavors[flavor].note;
    $$("[data-hero-flavor]").forEach((b) => {
      b.classList.toggle("selected", b === button);
      b.setAttribute("aria-pressed", String(b === button));
    });
  }),
);
let flavorStart = 0;
function chooseFlavor(flavor) {
  if (state.flavor === flavor) return;
  state.flavor = flavor;
  state.turn = 0;
  flavorStart = performance.now();
  const data = flavors[flavor];
  $("#loadout").dataset.flavor = flavor;
  $(".flavor-title").innerHTML = data.title;
  $(".flavor-description").textContent = data.description;
  $(".fighter-ghost").innerHTML = data.ghost;
  $(".fighter-code").textContent = data.code;
  $$(".profile-chip").forEach((chip, i) => {
    chip.textContent = data.chips[i];
  });
  $(".fighter-stage .model-poster").src = data.poster;
  $(".fighter-stage .model-poster").alt = `Power Rush ${data.name}`;
  $("#fighter-stage").setAttribute(
    "aria-label",
    `Power Rush ${data.name}, modelo 3D interactivo`,
  );
  $$(".flavor-option").forEach((button) => {
    const active = button.dataset.flavor === flavor;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  if (!state.paused && window.gsap)
    gsap.fromTo(
      ".flavor-info",
      { y: 10, opacity: 0.4 },
      { y: 0, opacity: 1, duration: 0.45, overwrite: true },
    );
}
$$(".flavor-option").forEach((button) =>
  button.addEventListener("click", () => chooseFlavor(button.dataset.flavor)),
);
$$("[data-rotate]").forEach((button) =>
  button.addEventListener("click", () => {
    state.turn += (Number(button.dataset.rotate) * Math.PI) / 4;
  }),
);
let dragStart = null;
$("#fighter-stage").addEventListener("pointerdown", (event) => {
  dragStart = { x: event.clientX, turn: state.turn, id: event.pointerId };
  if (event.pointerType === "mouse")
    event.currentTarget.setPointerCapture(event.pointerId);
});
$("#fighter-stage").addEventListener("pointermove", (event) => {
  if (dragStart) {
    state.turn = dragStart.turn + (event.clientX - dragStart.x) * 0.009;
    return;
  }
  if (event.pointerType !== "mouse" || state.paused) return;
  const rect = event.currentTarget.getBoundingClientRect();
  state.pointer = ((event.clientX - rect.left) / rect.width - 0.5) * 0.2;
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
  $("#fighter-stage").addEventListener(event, () => {
    dragStart = null;
  });
$("#fighter-stage").addEventListener("pointerleave", () => {
  state.pointer = 0;
  dragStart = null;
});
document.addEventListener("visibilitychange", () => {
  state.visible = !document.hidden;
});

if (window.gsap && window.ScrollTrigger && !state.paused) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.from(".portal-word", {
    y: 100,
    opacity: 0,
    duration: 1.5,
    ease: "power3.out",
  });
  $$(
    ".section-heading, .formula-feature, .formula-ingredients, .ritual-grid article, .origin-content > div, .faq-section > div",
  ).forEach((element) => {
    revealAnimations.push(
      gsap.from(element, {
        y: 28,
        opacity: 0,
        duration: 0.85,
        ease: "power2.out",
        scrollTrigger: { trigger: element, start: "top 93%", once: true },
      }),
    );
  });
}

$("[data-explore]").addEventListener("click", (event) => {
  event.preventDefault();
  if (state.paused || document.body.classList.contains("no-webgl")) {
    $("#formula").scrollIntoView({ behavior: "auto" });
  } else {
    const target = storyTop + (storyHeight - innerHeight) * 0.4;
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else window.scrollTo({ top: target, behavior: "smooth" });
  }
});
$(".rush-trigger").addEventListener("click", () => {
  state.rush = !state.rush;
  $("#hero").classList.toggle("rush-on", state.rush);
  $(".rush-trigger").setAttribute("aria-pressed", String(state.rush));
  $(".rush-trigger b").textContent = state.rush
    ? "ESTÁS EN TU ZONA"
    : "ACTIVÁ EL RUSH";
  $(".rush-trigger small").textContent = state.rush
    ? "VOLVÉ A HACER CLICK PARA SALIR"
    : "HACÉ CLICK Y ENTRÁ EN MODO JUEGO";
  $(".portal-live").textContent = state.rush
    ? "Modo Rush activado"
    : "Modo Rush desactivado";
});
$("#hero").addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  const box = $("#hero").getBoundingClientRect();
  state.cursorX = (event.clientX / box.width - 0.5) * 2;
  state.cursorY = ((event.clientY - box.top) / box.height - 0.5) * 2;
});
$("#hero").addEventListener("pointerleave", () => {
  state.cursorX = 0;
  state.cursorY = 0;
});

async function setupProducts() {
  const THREE = await import("three");
  const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import("./vendor/loaders/GLTFLoader.js"),
    import("./vendor/environments/RoomEnvironment.js"),
  ]);
  const loader = new GLTFLoader();
  const models = {};
  const views = [];
  const getModel = (flavor) => {
    if (!models[flavor])
      models[flavor] = loader.loadAsync(
        `/assets/experience/models/${flavor === "blue" ? "blue-fizz" : "cherry-pop"}.glb`,
      );
    return models[flavor];
  };
  function makeView(container, kind) {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0, 0);
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.6 : 2),
    );
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.85;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.z = 9;
    const generator = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = generator.fromScene(room, 0.035);
    scene.environment = environment.texture;
    generator.dispose();
    room.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(-3, 5, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xbde3ff, 0.65);
    fill.position.set(4, 1, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(
      kind === "inside" ? 0x00d47a : 0xe63950,
      2.4,
    );
    rim.position.set(3, 3, -3);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const group = new THREE.Group();
    scene.add(group);
    const view = {
      container,
      kind,
      renderer,
      scene,
      camera,
      group,
      rim,
      models: {},
      ready: false,
      visible: true,
      dirty: true,
      lastTurn: null,
      lastFlavor: null,
      angle: 0,
    };
    new ResizeObserver(() => {
      const width = container.clientWidth,
        height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      view.dirty = true;
    }).observe(container);
    new IntersectionObserver(
      ([entry]) => {
        view.visible = entry.isIntersecting;
        view.dirty = true;
      },
      { rootMargin: "50px" },
    ).observe(container);
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      view.visible = false;
      view.ready = false;
      container.classList.remove("ready");
      if (kind === "inside") {
        document.body.classList.add("no-webgl");
        measure();
        updateScroll();
      }
    });
    if (kind === "inside") {
      const world = new THREE.Group();
      scene.add(world);
      view.world = world;
      const rings = [];
      for (let i = 0; i < 3; i++) {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(2.6 + i * 0.32, 0.012, 8, 160),
          new THREE.MeshBasicMaterial({
            color: 0x00d47a,
            transparent: true,
            opacity: 0.35 - i * 0.08,
          }),
        );
        ring.rotation.set(0.25 + i * 0.18, 0.3 + i * 0.13, i * 0.35);
        ring.position.z = -1.6 - i * 0.25;
        world.add(ring);
        rings.push(ring);
      }
      view.rings = rings;
      const ticks = new THREE.Group();
      for (let i = 0; i < 80; i++) {
        const angle = (i / 80) * Math.PI * 2;
        const tick = new THREE.Mesh(
          new THREE.BoxGeometry(
            i % 5 === 0 ? 0.025 : 0.012,
            i % 5 === 0 ? 0.14 : 0.045,
            0.012,
          ),
          new THREE.MeshBasicMaterial({
            color: 0x00d47a,
            transparent: true,
            opacity: i % 5 === 0 ? 0.7 : 0.3,
          }),
        );
        tick.position.set(Math.cos(angle) * 3.05, Math.sin(angle) * 3.05, -2);
        tick.rotation.z = angle - Math.PI / 2;
        ticks.add(tick);
      }
      world.add(ticks);
      view.ticks = ticks;
      const shards = new THREE.Group();
      const shardMaterial = new THREE.MeshStandardMaterial({
        color: 0x172c22,
        metalness: 0.85,
        roughness: 0.25,
        emissive: 0x00d47a,
        emissiveIntensity: 0.15,
      });
      for (let i = 0; i < 22; i++) {
        const a = i * 2.39996,
          radius = 2.4 + (i % 5) * 0.35;
        const shard = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.05 + (i % 4) * 0.035, 0),
          shardMaterial,
        );
        shard.position.set(
          Math.cos(a) * radius,
          Math.sin(a) * radius * 0.75,
          -0.8 + (i % 6) * 0.25,
        );
        shard.scale.set(1, 0.6, 2.8);
        shard.rotation.set(a, a * 0.4, a * 0.8);
        shards.add(shard);
      }
      world.add(shards);
      view.shards = shards;
      const geometry = new THREE.BufferGeometry();
      const points = [];
      for (let i = 0; i < 220; i++) {
        const a = i * 2.39996,
          r = 1.8 + (i % 19) * 0.23;
        points.push(Math.cos(a) * r, Math.sin(a) * r, -5 + (i % 29) * 0.27);
      }
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(points, 3),
      );
      const dust = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0x76ffb8,
          size: 0.018,
          transparent: true,
          opacity: 0.65,
        }),
      );
      world.add(dust);
      view.dust = dust;
      view.boost = 0;
      view.pointerX = 0;
      view.pointerY = 0;
    }
    views.push(view);
    return view;
  }
  function attach(view, asset, flavor) {
    const model = asset.scene.clone(true);
    const box = new THREE.Box3().setFromObject(model),
      center = box.getCenter(new THREE.Vector3()),
      size = box.getSize(new THREE.Vector3());
    model.position.sub(center);
    model.traverse((mesh) => {
      if (!mesh.isMesh) return;
      mesh.material = mesh.material.clone();
      mesh.material.envMapIntensity = 0.35;
      if (mesh.material.name.includes("etiqueta")) {
        mesh.material.roughness = 0.58;
        mesh.material.specularIntensity = 0.18;
        mesh.material.clearcoat = 0.4;
        mesh.material.clearcoatRoughness = 0.22;
        mesh.material.clearcoatNormalMap = null;
        const mask = new THREE.TextureLoader().load(
          `/assets/experience/models/varnish-${flavor}.png`,
          () => {
            view.dirty = true;
          },
        );
        mask.flipY = false;
        mesh.material.clearcoatMap = mask;
      }
      if (mesh.material.map)
        mesh.material.map.anisotropy = Math.min(
          8,
          view.renderer.capabilities.getMaxAnisotropy(),
        );
    });
    const wrapper = new THREE.Group();
    wrapper.add(model);
    wrapper.scale.setScalar(3.2 / size.y);
    wrapper.visible = false;
    view.group.add(wrapper);
    wrapper.userData.lids = [];
    model.traverse((mesh) => {
      if (mesh.isMesh && /tapa/i.test(mesh.name)) {
        wrapper.userData.lids.push({
          mesh,
          origin: mesh.position.clone(),
          height: size.y,
        });
      }
    });
    view.models[flavor] = wrapper;
    view.dirty = true;
  }
  const observeScene = (selector, kind) => {
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        let view;
        try {
          view = makeView($(selector), kind);
          attach(view, await getModel("cherry"), "cherry");
          view.models.cherry.visible = true;
          view.ready = true;
          view.container.classList.add("ready");
          attach(view, await getModel("blue"), "blue");
        } catch (error) {
          console.warn(
            "Product photography remains available because the 3D view could not load.",
            error,
          );
          view?.container.classList.remove("ready");
          if (kind === "inside") {
            document.body.classList.add("no-webgl");
            measure();
            updateScroll();
          }
        }
      },
      { rootMargin: "500px" },
    );
    observer.observe($(selector));
  };
  observeScene("#inside-stage", "inside");
  observeScene("#fighter-stage", "fighter");
  let lastFrame = 0;
  function render(time) {
    requestAnimationFrame(render);
    if (!state.visible || (mobile.matches && time - lastFrame < 30)) return;
    lastFrame = time;
    const t = time / 1000;
    for (const view of views) {
      if (!view.ready || !view.visible) continue;
      if (
        state.paused &&
        !view.dirty &&
        view.lastTurn === state.turn &&
        view.lastFlavor === state.flavor &&
        view.lastHeroFlavor === state.heroFlavor
      )
        continue;
      if (view.kind === "inside") {
        const p = state.paused ? 0 : state.progress;
        const narrow = mobile.matches;
        const flavorEntrance = state.paused
          ? 1
          : smooth(clamp((time - state.heroFlavorStart) / 900));
        view.boost = lerp(
          view.boost,
          state.rush && !state.paused ? 1 : 0,
          0.045,
        );
        view.pointerX = lerp(
          view.pointerX,
          state.paused ? 0 : state.cursorX,
          0.035,
        );
        view.pointerY = lerp(
          view.pointerY,
          state.paused ? 0 : state.cursorY,
          0.035,
        );
        const move = smooth(clamp((p - 0.12) / 0.28));
        const open = smooth(clamp((p - 0.57) / 0.2));
        const color = state.heroFlavor === "blue" ? 0x3b82f6 : 0x00d47a;
        Object.entries(view.models).forEach(([key, object]) => {
          object.visible = key === state.heroFlavor;
        });
        if (!view.models[state.heroFlavor]) {
          view.container.classList.remove("ready");
          continue;
        }
        view.container.classList.add("ready");
        view.group.position.set(
          narrow ? -0.15 * open : lerp(0.15, 1.65, move) - open * 1.25,
          narrow ? -0.1 - move * 1.25 : -0.05 + open * 0.1,
          0,
        );
        view.group.rotation.set(
          0.12 + view.pointerY * 0.055 - open * 0.12,
          -0.3 +
            move * Math.PI * 2 +
            view.pointerX * 0.16 +
            (1 - flavorEntrance) * 1.1,
          -0.22 + move * 0.27 + view.boost * 0.09,
        );
        view.group.scale.setScalar(
          (narrow ? 0.83 - move * 0.18 - open * 0.12 : 1.02 - open * 0.22) *
            lerp(0.84, 1, flavorEntrance),
        );
        if (!state.paused) view.group.position.y += Math.sin(t * 0.9) * 0.07;
        for (const model of Object.values(view.models))
          for (const lid of model.userData.lids) {
            lid.mesh.position.copy(lid.origin);
            lid.mesh.position.y += open * lid.height * 0.36;
          }
        view.camera.position.z = 9 - view.boost * 0.65 + open * 0.3;
        view.world.position.x = narrow ? 0 : move * 1.2 - open * 0.9;
        view.world.scale.setScalar(1 + view.boost * 0.16 - open * 0.1);
        view.rings.forEach((ring, i) => {
          ring.material.color.set(color);
          ring.rotation.z =
            (state.paused ? 0 : t * (0.06 + i * 0.025)) + p * 1.5;
          ring.rotation.y = 0.3 + Math.sin(t * 0.3 + i) * 0.15;
          ring.material.opacity = 0.18 + view.boost * 0.3;
        });
        view.ticks.rotation.z = state.paused
          ? 0
          : -t * 0.025 - view.boost * 0.35;
        view.shards.rotation.z = state.paused ? 0 : t * 0.035 + p * 0.8;
        view.shards.scale.setScalar(1 + view.boost * 0.45 + open * 0.1);
        view.dust.rotation.z = state.paused
          ? 0
          : t * (0.015 + view.boost * 0.08);
        view.dust.material.color.set(color);
        view.rim.color.set(color);
        view.rim.intensity = 2.4 + view.boost * 3;
      } else {
        const model = view.models[state.flavor];
        if (!model) {
          view.container.classList.remove("ready");
          view.renderer.domElement.style.visibility = "hidden";
          continue;
        }
        view.container.classList.add("ready");
        view.renderer.domElement.style.visibility = "";
        Object.entries(view.models).forEach(([key, object]) => {
          object.visible = key === state.flavor;
        });
        const entrance = state.paused
          ? 1
          : smooth(clamp((time - flavorStart) / 850));
        view.angle = state.paused
          ? state.turn
          : lerp(view.angle, state.turn + state.pointer, 0.085);
        view.group.rotation.set(
          0.1,
          -0.18 + view.angle + (1 - entrance) * 0.75,
          -0.08,
        );
        view.group.position.set(
          0,
          state.paused ? 0.05 : 0.05 + Math.sin(t * 0.65) * 0.04,
          0,
        );
        view.group.scale.setScalar(
          (mobile.matches ? 1.1 : 1.12) * lerp(0.9, 1, entrance),
        );
        view.rim.color.set(state.flavor === "blue" ? 0x3b82f6 : 0xe63950);
      }
      view.renderer.render(view.scene, view.camera);
      view.dirty = false;
      view.lastTurn = state.turn;
      view.lastFlavor = state.flavor;
      view.lastHeroFlavor = state.heroFlavor;
    }
  }
  requestAnimationFrame(render);
}
setupProducts().catch((error) => {
  console.warn(
    "Interactive 3D could not initialize; using product photography.",
    error,
  );
  document.body.classList.add("no-webgl");
  measure();
  updateScroll();
});
