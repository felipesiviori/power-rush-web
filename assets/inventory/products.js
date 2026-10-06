import * as THREE from "three";
import { GLTFLoader } from "../experience/vendor/loaders/GLTFLoader.js";
import { RoomEnvironment } from "../experience/vendor/environments/RoomEnvironment.js";
export async function createProductViews(state, flavors) {
  const loader = new GLTFLoader();
  const cache = new Map();
  const views = [];
  const assets = (id, open = false) => {
    const key = id + (open ? "-open" : "");
    if (!cache.has(key))
      cache.set(
        key,
        loader.loadAsync(
          open
            ? `/assets/inventory/models/${flavors[id].slug}-open.glb`
            : `/assets/experience/models/${flavors[id].slug}.glb`,
        ),
      );
    return cache.get(key);
  };
  function view(el, id) {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 0.95;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.z = 8;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    pmrem.dispose();
    room.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(-3, 4, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc6e8ff, 1);
    fill.position.set(3, 1, 4);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(
      id === "bf" ? 0x00a7e3 : 0xe5484d,
      2,
    );
    rim.position.set(3, 3, -3);
    scene.add(rim);
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const pivot = new THREE.Group();
    scene.add(pivot);
    const v = {
      el,
      id,
      renderer,
      scene,
      camera,
      pivot,
      models: new Map(),
      pending: new Set(),
      visible: false,
      angle: 0,
      hover: false,
      failed: false,
    };
    const resize = () => {
      if (!el.clientWidth || !el.clientHeight) return;
      renderer.setSize(el.clientWidth, el.clientHeight, false);
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
    };
    new ResizeObserver(resize).observe(el);
    resize();
    new IntersectionObserver(([e]) => (v.visible = e.isIntersecting), {
      rootMargin: "80px",
    }).observe(el);
    el.closest(".item-card")?.addEventListener(
      "pointerenter",
      () => (v.hover = true),
    );
    el.closest(".item-card")?.addEventListener(
      "pointerleave",
      () => (v.hover = false),
    );
    renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      v.failed = true;
      el.classList.remove("ready");
    });
    views.push(v);
    return v;
  }
  function attach(v, asset, id, open) {
    const key = id + (open ? "-open" : "");
    if (v.models.has(key)) return;
    const model = asset.scene.clone(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    model.position.sub(box.getCenter(new THREE.Vector3()));
    model.traverse((m) => {
      if (!m.isMesh) return;
      m.material = m.material.clone();
      m.material.envMapIntensity = 0.4;
      if (m.material.name.includes("etiqueta")) {
        m.material.roughness = 0.58;
        m.material.clearcoat = 0.18;
        m.material.clearcoatNormalMap = null;
        m.material.specularIntensity = 0.2;
      }
      if (m.material.map)
        m.material.map.anisotropy = Math.min(
          4,
          v.renderer.capabilities.getMaxAnisotropy(),
        );
    });
    const wrapper = new THREE.Group();
    wrapper.add(model);
    wrapper.userData.size = size;
    wrapper.userData.open = open;
    wrapper.visible = false;
    v.pivot.add(wrapper);
    v.models.set(key, wrapper);
  }
  async function load(v, id, open = false) {
    const key = id + (open ? "-open" : "");
    if (v.models.has(key) || v.pending.has(key)) return;
    v.pending.add(key);
    try {
      attach(v, await assets(id, open), id, open);
    } catch (e) {
      console.warn("Static render used for " + key, e);
    } finally {
      v.pending.delete(key);
    }
  }
  const left = view(document.querySelector("#select-cp"), "cp");
  const right = view(document.querySelector("#select-bf"), "bf");
  const inspect = view(document.querySelector("#inspect-model"), null);
  await Promise.allSettled([load(left, "cp"), load(right, "bf")]);
  const loadSelected = () => load(inspect, state.flavor, state.step === 4);
  const preloadOpen = () => {
    assets(state.flavor, true).catch(() => {});
  };
  let last = 0;
  function frame(time) {
    requestAnimationFrame(frame);
    if (document.hidden || time - last < 32) return;
    last = time;
    for (const v of views) {
      if (!v.visible || v.failed) continue;
      if (state.paused) {
        v.el.classList.remove("ready");
        continue;
      }
      const id = v.id || state.flavor;
      const open = !v.id && state.step === 4;
      const model = v.models.get(id + (open ? "-open" : ""));
      v.el.classList.toggle("ready", !!model);
      if (!model) continue;
      const activeKey = id + (open ? "-open" : "");
      if (v.activeKey !== activeKey) {
        v.activeKey = activeKey;
        v.renderer.domElement.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 500,
          easing: "ease-out",
        });
      }
      for (const m of v.models.values()) m.visible = m === model;
      const size = model.userData.size;
      const scale = open
        ? 3.7 / Math.max(size.y, size.x / Math.max(0.8, v.camera.aspect))
        : 3.45 / size.y;
      model.scale.setScalar(scale);
      let target = v.id
        ? Math.sin(time * 0.00032 + (id === "bf" ? 1.2 : 0)) * 0.12
        : state.target + state.manual;
      if (open) target = -0.15 + state.manual;
      v.angle += (target - v.angle) * 0.11;
      v.pivot.rotation.set(
        open ? 0.48 : v.id ? 0.07 : 0,
        v.angle,
        v.id ? (id === "cp" ? -0.09 : 0.09) : 0,
      );
      v.pivot.position.y = v.id ? Math.sin(time * 0.0012) * 0.055 : 0;
      v.renderer.render(v.scene, v.camera);
    }
  }
  requestAnimationFrame(frame);
  return { loadSelected, preloadOpen };
}
