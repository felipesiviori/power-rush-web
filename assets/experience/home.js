import Lenis from "./vendor/lenis.mjs";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobile = window.matchMedia("(max-width: 700px)");
const $ = (selector) => document.querySelector(selector);
const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => t * t * (3 - 2 * t);
const state = {
  scroll: window.scrollY,
  focus: 0,
  flavor: "blue",
  pointerX: 0,
  pointerY: 0,
  visible: true,
};
let lenis;
if (!reducedMotion.matches) {
  lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    touchMultiplier: 1,
    anchors: true,
  });
  const scrollFrame = (time) => {
    lenis.raf(time);
    requestAnimationFrame(scrollFrame);
  };
  requestAnimationFrame(scrollFrame);
}

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
  const open = menu.hidden;
  menu.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  document.body.style.overflow = open ? "hidden" : "";
  if (open) lenis?.stop();
  else lenis?.start();
});
menu
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !menu.hidden) {
    closeMenu();
    menuButton.focus();
  }
});
const menuLinks = [...menu.querySelectorAll("a")];
menu.addEventListener("keydown", (event) => {
  if (
    event.key === "Tab" &&
    !event.shiftKey &&
    document.activeElement === menuLinks.at(-1)
  ) {
    event.preventDefault();
    menuButton.focus();
  }
});
menuButton.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && event.shiftKey && !menu.hidden) {
    event.preventDefault();
    menuLinks.at(-1).focus();
  }
});

const flavorContent = {
  blue: {
    words: ["BLUE", "FIZZ"],
    note: "ÁCIDO · ELÉCTRICO · INTENSO",
    title: "Se siente.<br>Y te queda.",
    description:
      "Blue Fizz va de frente. Un sabor ácido e intenso para los que no pasan desapercibidos.",
    index: "01 / 02",
    name: "Blue Fizz",
    image: "/assets/experience/posters/blue-fizz.png",
  },
  cherry: {
    words: ["CHERRY", "POP"],
    note: "CEREZA · SUAVE · REFRESCANTE",
    title: "Dulce entrada.<br>Gran partida.",
    description:
      "Cherry Pop juega distinto. Cereza refrescante y suave, con toda la personalidad de Power Rush.",
    index: "02 / 02",
    name: "Cherry Pop",
    image: "/assets/experience/posters/cherry-pop.png",
  },
};
function setFlavor(flavor) {
  if (flavor === state.flavor) return;
  state.flavor = flavor;
  const content = flavorContent[flavor];
  $("#flavors").dataset.flavor = flavor;
  document.querySelectorAll(".flavor-switch button").forEach((button) => {
    const active = button.dataset.flavor === flavor;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  document.querySelectorAll(".flavor-word span").forEach((word, index) => {
    word.textContent = content.words[index];
  });
  $(".flavor-note").textContent = content.note;
  $(".flavor-name").innerHTML = content.title;
  $(".flavor-description").textContent = content.description;
  $(".flavor-index").textContent = content.index;
  $("#flavor-canvas").setAttribute(
    "aria-label",
    `Pote Power Rush ${content.name} en 3D`,
  );
  const fallback = $(".flavor-fallback");
  fallback.src = content.image;
  fallback.alt = `Power Rush ${content.name}`;
  if (window.gsap && !reducedMotion.matches) {
    gsap.fromTo(
      ".flavor-copy > *",
      { y: 14, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.045,
        duration: 0.55,
        overwrite: true,
        ease: "power2.out",
      },
    );
    gsap.fromTo(
      ".flavor-word",
      { y: 22, opacity: 0.25 },
      { y: 0, opacity: 1, duration: 0.65, overwrite: true },
    );
  }
}
document
  .querySelectorAll(".flavor-switch button")
  .forEach((button) =>
    button.addEventListener("click", () => setFlavor(button.dataset.flavor)),
  );
$("#year").textContent = String(new Date().getFullYear());

let heroHeight = $(".hero").offsetHeight;
let focusHeight = $("#focus").offsetHeight;
let viewportHeight = window.innerHeight;
let documentHeight = document.documentElement.scrollHeight;
function measure() {
  heroHeight = $(".hero").offsetHeight;
  focusHeight = $("#focus").offsetHeight;
  viewportHeight = window.innerHeight;
  documentHeight = document.documentElement.scrollHeight;
}
const focusCopy = $(".focus-copy");
const noise = $(".noise-field");
const focusMeter = $(".focus-meter span");
const progress = $(".page-progress span");
let scrollPending = false;
function updateScroll() {
  state.scroll = window.scrollY;
  state.focus = clamp(
    (state.scroll - heroHeight + viewportHeight * 0.55) /
      (focusHeight - viewportHeight * 0.35),
  );
  const localProgress = clamp(
    (state.scroll - heroHeight) / Math.max(1, focusHeight - viewportHeight),
  );
  focusMeter.style.transform = `scaleX(${reducedMotion.matches ? 1 : localProgress})`;
  $(".focus-percent").textContent =
    `${String(Math.round((reducedMotion.matches ? 1 : localProgress) * 100)).padStart(2, "0")}%`;
  progress.style.transform = `scaleX(${clamp(state.scroll / (documentHeight - viewportHeight))})`;
  if (!reducedMotion.matches) {
    noise.style.opacity = lerp(0.2, 0.012, ease(clamp(localProgress * 1.7)));
    noise.style.transform = `scale(${1 + localProgress * 0.35})`;
    noise.style.filter = `blur(${2 + localProgress * 12}px)`;
    focusCopy.style.transform = `translateY(${lerp(28, -12, localProgress)}px)`;
  }
  scrollPending = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollPending) {
      requestAnimationFrame(updateScroll);
      scrollPending = true;
    }
  },
  { passive: true },
);
window.addEventListener("resize", () => {
  measure();
  updateScroll();
});
new ResizeObserver(measure).observe(document.body);
updateScroll();

if (window.gsap && window.ScrollTrigger && !reducedMotion.matches) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.from(".hero-kicker, .hero-caption, .hero-bottom", {
    opacity: 0,
    y: 16,
    duration: 0.85,
    stagger: 0.08,
    delay: 0.1,
    ease: "power2.out",
  });
  gsap.from(".hero-title > span", {
    yPercent: 16,
    opacity: 0,
    duration: 1.15,
    stagger: 0.09,
    ease: "power3.out",
    delay: 0.05,
  });
  document
    .querySelectorAll(
      ".formula-heading, .ingredient, .ritual-heading, .ritual-steps article, .faq-section > div",
    )
    .forEach((element) => {
      gsap.from(element, {
        scrollTrigger: { trigger: element, start: "top 92%", once: true },
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
      });
    });
  gsap.to(".ring-b", {
    rotate: 115,
    ease: "none",
    scrollTrigger: {
      trigger: ".formula-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
  });
  gsap.to(".ring-c", {
    rotate: -115,
    ease: "none",
    scrollTrigger: {
      trigger: ".formula-section",
      start: "top bottom",
      end: "bottom top",
      scrub: 1,
    },
  });
}

async function createProductExperience() {
  const THREE = await import("three");
  const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
    import("./vendor/loaders/GLTFLoader.js"),
    import("./vendor/environments/RoomEnvironment.js"),
  ]);
  const loader = new GLTFLoader();
  const modelPromises = {
    blue: loader.loadAsync("/assets/experience/models/blue-fizz.glb"),
    cherry: null,
  };
  const views = [];
  let failed = false;
  function createView(container, kind) {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, mobile.matches ? 1.5 : 1.75),
    );
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.9;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0, 9);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.035);
    scene.environment = environment.texture;
    room.dispose();
    pmrem.dispose();
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(-3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xe6f6ff, 0.65);
    fill.position.set(4, 1, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xc6f85c, 1.7);
    rim.position.set(2, 4, -3);
    scene.add(rim);
    const group = new THREE.Group();
    scene.add(group);
    const view = {
      renderer,
      scene,
      camera,
      group,
      container,
      kind,
      models: {},
      visible: true,
      flavorMix: 0,
      ready: false,
      dirty: true,
      rim,
      environment,
    };
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      view.dirty = true;
    };
    new ResizeObserver(resize).observe(container);
    resize();
    const observer = new IntersectionObserver(
      ([entry]) => {
        view.visible = entry.isIntersecting;
        view.dirty = true;
      },
      { rootMargin: "100px" },
    );
    observer.observe(kind === "hero" ? $("#opening") : container);
    renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      view.visible = false;
      container.classList.remove("is-ready");
      if (kind === "hero") {
        document.body.classList.remove("webgl-ready");
        document.body.classList.add("no-webgl");
      }
    });
    renderer.domElement.addEventListener("webglcontextrestored", () => {
      window.location.reload();
    });
    views.push(view);
    return view;
  }
  function attachModel(view, gltf, flavor) {
    const model = gltf.scene.clone(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    model.position.sub(center);
    const wrapper = new THREE.Group();
    wrapper.add(model);
    const scale = 3.2 / size.y;
    wrapper.scale.setScalar(scale);
    model.traverse((object) => {
      if (!object.isMesh) return;
      object.material = object.material.clone();
      object.material.envMapIntensity = 0.28;
      if (object.material.name.includes("etiqueta")) {
        object.material.roughness = 0.55;
        object.material.clearcoat = 0.12;
        object.material.clearcoatRoughness = 0.25;
      }
      if (object.material.map)
        object.material.map.anisotropy = Math.min(
          8,
          view.renderer.capabilities.getMaxAnisotropy(),
        );
    });
    view.group.add(wrapper);
    view.models[flavor] = wrapper;
    return wrapper;
  }
  const heroView = createView($("#product-canvas"), "hero");
  const portal = new THREE.Group();
  const portalMaterial = new THREE.LineBasicMaterial({
    color: 0xc6f85c,
    transparent: true,
    opacity: 0,
  });
  for (let ring = 0; ring < 3; ring++) {
    const points = [];
    const radius = 1.98 + ring * 0.19;
    for (let n = 0; n <= 120; n++) {
      const a = (n / 120) * Math.PI * (ring === 1 ? 1.6 : 2);
      points.push(
        new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0),
      );
    }
    const circle = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      portalMaterial,
    );
    circle.rotation.z = ring * 0.8;
    portal.add(circle);
  }
  const ticks = [];
  for (let n = 0; n < 64; n++) {
    const a = (n / 64) * Math.PI * 2;
    ticks.push(
      Math.cos(a) * 2.52,
      Math.sin(a) * 2.52,
      0,
      Math.cos(a) * (n % 4 === 0 ? 2.42 : 2.48),
      Math.sin(a) * (n % 4 === 0 ? 2.42 : 2.48),
      0,
    );
  }
  const tickGeometry = new THREE.BufferGeometry();
  tickGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(ticks, 3),
  );
  portal.add(new THREE.LineSegments(tickGeometry, portalMaterial));
  portal.position.set(1.4, 0, -1);
  heroView.scene.add(portal);
  const blueModel = await modelPromises.blue;
  attachModel(heroView, blueModel, "blue");
  heroView.ready = true;
  document.body.classList.add("webgl-ready");
  // The second renderer and flavor model are loaded only near the flavor section.
  const lazyObserver = new IntersectionObserver(
    async ([entry]) => {
      if (!entry.isIntersecting) return;
      lazyObserver.disconnect();
      try {
        const view = createView($("#flavor-canvas"), "flavor");
        attachModel(view, blueModel, "blue");
        view.ready = true;
        view.container.classList.add("is-ready");
        modelPromises.cherry = loader.loadAsync(
          "/assets/experience/models/cherry-pop.glb",
        );
        const cherryModel = await modelPromises.cherry;
        attachModel(view, cherryModel, "cherry");
        view.models.cherry.visible = false;
        view.dirty = true;
      } catch (error) {
        console.warn(
          "Flavor 3D is unavailable; product photography remains available.",
          error,
        );
        $("#flavor-canvas").classList.remove("is-ready");
      }
    },
    { rootMargin: "900px" },
  );
  lazyObserver.observe($("#flavors"));

  const pointer = (event) => {
    if (event.pointerType === "touch" || reducedMotion.matches) return;
    const rect = $("#flavor-canvas").getBoundingClientRect();
    state.pointerX =
      clamp((event.clientX - rect.left) / rect.width, 0, 1) * 2 - 1;
    state.pointerY =
      clamp((event.clientY - rect.top) / rect.height, 0, 1) * 2 - 1;
  };
  $("#flavor-canvas").addEventListener("pointermove", pointer);
  $("#flavor-canvas").addEventListener("pointerleave", () => {
    state.pointerX = 0;
    state.pointerY = 0;
  });
  document.addEventListener("visibilitychange", () => {
    state.visible = !document.hidden;
  });
  let previous = 0;
  let introStart = performance.now();
  let smoothPointerX = 0;
  let smoothPointerY = 0;
  let lastFlavor = state.flavor;
  let flavorTransitionStart = 0;
  function render(time) {
    requestAnimationFrame(render);
    if (!state.visible || failed) return;
    if (mobile.matches && time - previous < 30) return;
    previous = time;
    const seconds = time / 1000;
    const entrance = reducedMotion.matches
      ? 1
      : ease(clamp((time - introStart) / 1400));
    const float = reducedMotion.matches ? 0 : Math.sin(seconds * 0.75) * 0.055;
    smoothPointerX = lerp(smoothPointerX, state.pointerX, 0.06);
    smoothPointerY = lerp(smoothPointerY, state.pointerY, 0.06);
    if (lastFlavor !== state.flavor) {
      lastFlavor = state.flavor;
      flavorTransitionStart = time;
    }
    for (const view of views) {
      if (!view.visible || !view.ready) continue;
      if (
        reducedMotion.matches &&
        !view.dirty &&
        view.lastFlavor === state.flavor &&
        view.lastScroll === state.scroll
      )
        continue;
      const isMobile = mobile.matches;
      if (view.kind === "hero") {
        const t = reducedMotion.matches
          ? state.scroll > heroHeight * 0.8
            ? 1
            : 0
          : ease(state.focus);
        const intro = 1 - entrance;
        view.group.position.set(
          lerp(isMobile ? 0.05 : 1.05, isMobile ? 0.42 : 1.4, t),
          lerp(isMobile ? -0.55 : -0.15, isMobile ? -0.55 : 0.05, t) +
            float -
            intro * 0.8,
          0,
        );
        view.group.rotation.set(
          lerp(0.14, -0.05, t),
          -0.2 + t * Math.PI * 2 + intro * 0.9,
          lerp(-0.22, 0.13, t),
        );
        const scale =
          lerp(isMobile ? 0.53 : 0.87, isMobile ? 0.42 : 0.83, t) *
          lerp(0.86, 1, entrance);
        view.group.scale.setScalar(scale);
        view.rim.color.set(t > 0.3 ? 0xc6f85c : 0xffffff);
        portalMaterial.opacity = clamp((t - 0.12) * 1.7) * 0.35;
        portal.position.x = isMobile ? 0.42 : 1.4;
        portal.position.y = isMobile ? -0.55 : 0.05;
        portal.scale.setScalar(isMobile ? 0.47 : 0.9);
        portal.rotation.y = Math.sin(t * Math.PI) * 0.65;
        portal.rotation.z = reducedMotion.matches ? 0 : seconds * 0.025;
      } else {
        const transition = reducedMotion.matches
          ? 1
          : ease(clamp((time - flavorTransitionStart) / 800));
        const switching = transition < 1;
        const currentModel = view.models[state.flavor];
        if (!currentModel) {
          // Keep the chosen flavor truthful while its model is still loading.
          view.renderer.domElement.style.visibility = "hidden";
          view.container.classList.remove("is-ready");
          continue;
        }
        view.renderer.domElement.style.visibility = "";
        view.container.classList.add("is-ready");
        Object.entries(view.models).forEach(([flavor, model]) => {
          model.visible = flavor === state.flavor;
        });
        view.group.position.set(0, isMobile ? 0.0 : 0.05, 0);
        view.group.rotation.set(
          0.12 + smoothPointerY * 0.1,
          -0.12 +
            smoothPointerX * 0.6 +
            (switching ? (1 - transition) * 1.2 : 0),
          0.15 + Math.sin(seconds * 0.5) * (reducedMotion.matches ? 0 : 0.018),
        );
        view.group.position.y += float;
        view.group.scale.setScalar(
          (isMobile ? 0.82 : 1.12) *
            (switching ? lerp(0.87, 1, transition) : 1),
        );
        view.rim.color.set(state.flavor === "blue" ? 0x75d7ff : 0xff7192);
      }
      view.renderer.render(view.scene, view.camera);
      view.dirty = false;
      view.lastFlavor = state.flavor;
      view.lastScroll = state.scroll;
    }
  }
  requestAnimationFrame(render);
}
createProductExperience().catch((error) => {
  console.warn(
    "3D is unavailable; the page uses official product photography.",
    error,
  );
  document.body.classList.add("no-webgl");
});
