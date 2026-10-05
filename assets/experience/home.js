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
  if (!state.paused) {
    const heroProgress = clamp(window.scrollY / $("#hero").offsetHeight);
    $(".hero-art").style.transform =
      `translateY(${heroProgress * (mobile.matches ? 25 : 70)}px)`;
    $(".hero-art").style.opacity = String(1 - heroProgress * 0.4);
  }
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
$$("[data-step]").forEach((button) =>
  button.addEventListener("click", () => {
    if (state.paused || document.body.classList.contains("no-webgl")) {
      document
        .querySelector(button.dataset.step === "1" ? "#formula" : "#inside")
        .scrollIntoView({ behavior: "auto" });
      return;
    }
    const y =
      storyTop +
      (storyHeight - window.innerHeight) *
        (button.dataset.step === "1" ? 0.82 : 0.05);
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
  }),
);
$('.story-panel[data-story="1"] a').tabIndex = -1;

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
  gsap.from(".hero-content > *", {
    y: 18,
    opacity: 0,
    duration: 0.85,
    stagger: 0.075,
    ease: "power3.out",
    delay: 0.15,
  });
  gsap.from(".hero-art", { scale: 1.06, duration: 1.6, ease: "power2.out" });
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
          if (kind === "fighter") {
            attach(view, await getModel("blue"), "blue");
          }
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
        view.lastFlavor === state.flavor
      )
        continue;
      if (view.kind === "inside") {
        const p = state.paused ? 0 : smooth(state.progress);
        const narrow = mobile.matches;
        view.group.position.set(narrow ? 0 : -0.03, narrow ? 0 : 0.05, 0);
        view.group.rotation.set(
          0.07 - p * 0.1,
          -0.26 + p * Math.PI * 2,
          lerp(0.12, -0.1, p),
        );
        view.group.scale.setScalar(narrow ? 0.98 : 1.02);
        if (!state.paused) view.group.position.y += Math.sin(t * 0.6) * 0.035;
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
