import {
  ViewerApp,
  AssetManagerPlugin,
  timeout,
  SSRPlugin,
  mobileAndTabletCheck,
  GBufferPlugin,
  ProgressivePlugin,
  TonemapPlugin,
  SSAOPlugin,
  GroundPlugin,
  FrameFadePlugin,
  DiamondPlugin,
  BufferGeometry,
  MeshStandardMaterial2,
  BloomPlugin,
  TemporalAAPlugin,
  RandomizedDirectionalLightPlugin,
  AssetImporter,
  Color,
  Mesh,
} from "webgi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "@studio-freight/lenis";

import "./styles.scss";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIAMOND_NAMES_RING_1 = [
  "diamonds",
  "diamonds001",
  "diamonds002",
  "diamonds003",
  "diamonds004",
  "diamonds005",
] as const;

const DIAMOND_NAMES_RING_2 = ["Object"] as const;

const NIGHT_MODE_SELECTORS = [
  ".header",
  ".cam-view-1",
  ".cam-view-2",
  ".cam-view-3",
  ".exit--container",
  ".footer--menu",
] as const;

const VIGNETTE_GLSL = [
  `vec4 vignette(vec4 color, vec2 uv, float offset, float darkness){
    uv = ( uv - vec2( 0.5 ) ) * vec2( offset );
    return vec4( mix( color.rgb, vec3( 0.17, 0.00, 0.09 ), dot( uv, uv ) ), color.a );
  }`,
  `gl_FragColor = vignette(gl_FragColor, vUv, 1.1, 0.8);`,
] as const;

const DIAMOND_COLOR_OPTIONS = [
  { selector: ".ruby", hex: "#f70db1" },
  { selector: ".faint", hex: "#CFECEC" },
  { selector: ".fancy", hex: "#a9cbe2" },
  { selector: ".aqua", hex: "#62cffe" },
  { selector: ".swiss", hex: "#76dce4" },
  { selector: ".yellow", hex: "#efe75b" },
  { selector: ".orange", hex: "#eb8e17" },
  { selector: ".green", hex: "#17ebb5" },
  { selector: ".emerald", hex: "#5eca00" },
  { selector: ".rose", hex: "#fa37d7" },
  { selector: ".violet", hex: "#c200f2" },
] as const;

const MATERIAL_COLOR_OPTIONS = [
  { selector: ".default", silver: 0xfea04d, gold: 0xffffff },
  { selector: ".silver-gold", silver: 0xffffff, gold: 0xfea04d },
  { selector: ".silver-silver", silver: 0xffffff, gold: 0xffffff },
  { selector: ".gold-gold", silver: 0xfea04d, gold: 0xfea04d },
  { selector: ".rose-silver", silver: 0xfa8787, gold: 0xffffff },
  { selector: ".gold-rose", silver: 0xfea04d, gold: 0xfa8787 },
  { selector: ".rose-rose", silver: 0xfa8787, gold: 0xfa8787 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type RingMesh = Mesh<BufferGeometry, MeshStandardMaterial2>;
type RingModel = 1 | 2;

interface ModelConfig {
  readonly path: string;
  readonly names: {
    readonly ring: string;
    readonly silver: string;
    readonly gold: string;
  };
  readonly diamonds: readonly string[];
  readonly rotation: readonly [number, number, number] | null;
  readonly background: string | null;
}

interface SceneObjects {
  ring: RingMesh;
  silver: RingMesh;
  gold: RingMesh;
  diamonds: RingMesh[];
}

const MODEL_CONFIGS: Record<RingModel, ModelConfig> = {
  1: {
    path: "./assets/ring_webgi.glb",
    names: { ring: "Scene", silver: "silver", gold: "gold" },
    diamonds: DIAMOND_NAMES_RING_1,
    rotation: [-Math.PI / 2, 0, 0],
    background: null,
  },
  2: {
    path: "./assets/ring2_webgi.glb",
    names: { ring: "Scene_1", silver: "alliance", gold: "entourage" },
    diamonds: DIAMOND_NAMES_RING_2,
    rotation: null,
    background: "#EEB7B5",
  },
};

// ─── Smooth Scroll ────────────────────────────────────────────────────────────

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 2.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -5 * t)),
  direction: "vertical",
  gestureDirection: "vertical",
  mouseMultiplier: 1,
});

function rafLoop(time: number): void {
  lenis.raf(time);
  requestAnimationFrame(rafLoop);
}

requestAnimationFrame(rafLoop);

// ─── Audio Controller ─────────────────────────────────────────────────────────

function createAudioController(src: string) {
  const audio = new Audio();
  audio.src = src;
  let playing = false;

  function startPlayback(): Promise<void> {
    audio.volume = 0.1;
    audio.loop = true;
    return audio.play().then(() => { playing = true; });
  }

  function toggle(): void {
    if (!playing) {
      startPlayback();
      return;
    }
    audio.pause();
    playing = false;
  }

  return { startPlayback, toggle, isPlaying: () => playing };
}

const audioController = createAudioController("./assets/sounds/music_loop.mp3");

// ─── DOM Utilities ────────────────────────────────────────────────────────────

function on(selector: string, event: string, handler: () => void): void {
  document.querySelector(selector)?.addEventListener(event, handler);
}

function onAll(selectors: string[], event: string, handler: () => void): void {
  selectors.forEach((sel) => on(sel, event, handler));
}

function scrollToSection(selector: string): void {
  const el = document.querySelector(selector);
  if (!el) return;
  window.scrollTo({
    top: el.getBoundingClientRect().top,
    left: 0,
    behavior: "smooth",
  });
}

function setActiveItem(listSelector: string, itemSelector: string): void {
  document
    .querySelector(`${listSelector} li.active`)
    ?.classList.remove("active");
  document.querySelector(itemSelector)?.classList.add("active");
}

function clearFooterActive(): void {
  document.querySelector(".footer--menu li.active")?.classList.remove("active");
}

function toLinear(hex: string | number): Color {
  return new Color(hex as string).convertSRGBToLinear();
}

// ─── Scene Utilities ──────────────────────────────────────────────────────────

function findMesh(viewer: ViewerApp, name: string): RingMesh {
  return viewer.scene.findObjectsByName(name)[0] as unknown as RingMesh;
}

function buildSceneObjects(viewer: ViewerApp, model: RingModel): SceneObjects {
  const { names, diamonds } = MODEL_CONFIGS[model];
  return {
    ring: findMesh(viewer, names.ring),
    silver: findMesh(viewer, names.silver),
    gold: findMesh(viewer, names.gold),
    diamonds: diamonds.map((name) => findMesh(viewer, name)),
  };
}

// ─── Camera Utilities ─────────────────────────────────────────────────────────

function applyCameraControls(
  controls: any,
  options: Partial<{
    enabled: boolean;
    autoRotate: boolean;
    minDistance: number;
    maxDistance: number;
    enablePan: boolean;
    screenSpacePanning: boolean;
  }>,
): void {
  if (!controls) return;
  Object.assign(controls, options);
}

// ─── ScrollTrigger Helper ─────────────────────────────────────────────────────

function makeST(
  trigger: string,
  scrub: boolean | number = true,
  extra: Record<string, unknown> = {},
) {
  return {
    trigger,
    start: "top bottom",
    end: "top top",
    scrub,
    immediateRender: false,
    ...extra,
  };
}

// ─── Night Mode Controller ────────────────────────────────────────────────────

function createNightModeController(viewer: ViewerApp) {
  let active = false;
  const elements = NIGHT_MODE_SELECTORS.map((sel) =>
    document.querySelector(sel),
  ).filter(Boolean) as Element[];

  function enable(): void {
    elements.forEach((el) => el.classList.add("night--mode--filter"));
    viewer.setBackground(toLinear(0x22052f));
    active = true;
  }

  function disable(): void {
    elements.forEach((el) => el.classList.remove("night--mode--filter"));
    viewer.setBackground(toLinear("#EEB7B5"));
    active = false;
  }

  function toggle(): void {
    if (!active) {
      enable();
      return;
    }
    disable();
  }

  return { toggle };
}

// ─── Color Manager ────────────────────────────────────────────────────────────

function createColorManager(
  getScene: () => SceneObjects,
  onCustomColor: () => void,
) {
  function setDiamondColor(color: Color): void {
    getScene().diamonds.forEach((obj) => {
      obj.material.color = color;
    });
    onCustomColor();
  }

  function setMaterialColors(silverColor: Color, goldColor: Color): void {
    const { silver, gold } = getScene();
    silver.material.color = silverColor;
    gold.material.color = goldColor;
    onCustomColor();
  }

  function bindDiamondListeners(): void {
    DIAMOND_COLOR_OPTIONS.forEach(({ selector, hex }) => {
      on(selector, "click", () => {
        setDiamondColor(new Color(hex));
        setActiveItem(".colors--list", selector);
      });
    });
  }

  function bindMaterialListeners(): void {
    MATERIAL_COLOR_OPTIONS.forEach(({ selector, silver, gold }) => {
      on(selector, "click", () => {
        setMaterialColors(
          new Color(silver as unknown as string),
          new Color(gold as unknown as string),
        );
        setActiveItem(".materials--list", selector);
      });
    });
  }

  return { bindDiamondListeners, bindMaterialListeners };
}

// ─── Viewer Setup ─────────────────────────────────────────────────────────────

async function setupViewer(): Promise<void> {
  document.body.style.overflowY = "hidden";

  const canvas = document.getElementById("webgi-canvas") as HTMLCanvasElement;
  const isMobile = mobileAndTabletCheck();

  const viewer = new ViewerApp({
    canvas,
    useGBufferDepth: true,
    isAntialiased: false,
  });
  viewer.renderer.displayCanvasScaling = Math.min(window.devicePixelRatio, 1);

  const manager = await viewer.addPlugin(AssetManagerPlugin);
  const camera = viewer.scene.activeCamera;
  const { position, target } = camera;

  // ─ Plugins ────────────────────────────────────────────────────────────────

  await viewer.addPlugin(GBufferPlugin);
  await viewer.addPlugin(new ProgressivePlugin(32));
  await viewer.addPlugin(new TonemapPlugin(true, false, [...VIGNETTE_GLSL]));
  const ssr = await viewer.addPlugin(SSRPlugin);
  const ssao = await viewer.addPlugin(SSAOPlugin);
  await viewer.addPlugin(FrameFadePlugin);
  await viewer.addPlugin(GroundPlugin);
  const bloom = await viewer.addPlugin(BloomPlugin);
  await viewer.addPlugin(TemporalAAPlugin);
  await viewer.addPlugin(DiamondPlugin);
  await viewer.addPlugin(RandomizedDirectionalLightPlugin, false);

  viewer.setBackground(toLinear("#FFF"));
  ssr!.passes.ssr.passObject.lowQualityFrames = 0;
  bloom.pass!.passObject.bloomIterations = 2;
  ssao.passes.ssao.passObject.material.defines.NUM_SAMPLES = 4;

  if (isMobile) {
    ssr.passes.ssr.passObject.stepCount /= 2;
    bloom.enabled = false;
    camera.setCameraOptions({ fov: 65 });
  }

  // ─ Update Manager ─────────────────────────────────────────────────────────

  let needsUpdate = false;

  function onUpdate(): void {
    needsUpdate = true;
  }

  viewer.addEventListener("preFrame", () => {
    if (!needsUpdate) return;
    camera.positionUpdated(false);
    camera.targetUpdated(true);
    needsUpdate = false;
  });

  // ─ State ──────────────────────────────────────────────────────────────────

  let currentModel: RingModel = 1;
  let usingCustomColors = false;
  let isFirstLoad = true;
  let scene: SceneObjects;

  // ─ Color Lerp Values (used in scroll animation) ───────────────────────────

  const lerpForever = { x: 0 };
  const lerpEmotions = { x: 0 };

  function updateForeverColors(): void {
    if (usingCustomColors) return;
    const { silver, gold, diamonds } = scene;
    silver.material.color.lerpColors(
      toLinear(0xfefefe),
      toLinear(0xd28b8b),
      lerpForever.x,
    );
    gold.material.color.lerpColors(
      toLinear(0xe2bf7f),
      toLinear(0xd28b8b),
      lerpForever.x,
    );
    diamonds.forEach((o) =>
      o.material.color.lerpColors(
        toLinear(0xffffff),
        toLinear(0x39cffe),
        lerpForever.x,
      ),
    );
  }

  function updateEmotionsColors(): void {
    if (usingCustomColors) return;
    const { silver, gold, diamonds } = scene;
    silver.material.color.lerpColors(
      toLinear(0xd28b8b),
      toLinear(0xf7c478),
      lerpEmotions.x,
    );
    gold.material.color.lerpColors(
      toLinear(0xd28b8b),
      toLinear(0xf7c478),
      lerpEmotions.x,
    );
    diamonds.forEach((o) =>
      o.material.color.lerpColors(
        toLinear(0x39cffe),
        toLinear(0xf70db1),
        lerpEmotions.x,
      ),
    );
  }

  // ─ Loader Events ──────────────────────────────────────────────────────────

  const importer = manager.importer as AssetImporter;

  importer.addEventListener("onProgress", (ev: any) => {
    const ratio = ev.loaded / ev.total;
    document
      .querySelector(".progress")
      ?.setAttribute("style", `transform: scaleX(${ratio})`);
  });

  importer.addEventListener("onLoad", () => {
    if (!isFirstLoad) {
      hideLoader();
      return;
    }
    runIntroAnimation();
  });

  // ─ Initial Model Load ─────────────────────────────────────────────────────

  viewer.renderer.refreshPipeline();
  await manager.addFromPath(MODEL_CONFIGS[1].path);
  scene = buildSceneObjects(viewer, 1);
  applyCameraControls(camera.controls, { enabled: false });
  window.scrollTo(0, 0);
  await timeout(50);

  // ─ Controllers ────────────────────────────────────────────────────────────

  const nightMode = createNightModeController(viewer);
  const colorManager = createColorManager(
    () => scene,
    () => {
      usingCustomColors = true;
    },
  );

  // ─ Animation Helpers ──────────────────────────────────────────────────────

  function hideLoader(): void {
    gsap.to(".loader", {
      x: "100%",
      duration: 0.8,
      ease: "power4.inOut",
      delay: 1,
    });
  }

  function ringRotationForModel(ring1: number, ring2: number): number {
    return currentModel === 1 ? ring1 : ring2;
  }

  // ─ Intro Animation ────────────────────────────────────────────────────────

  function runIntroAnimation(): void {
    isFirstLoad = false;
    gsap
      .timeline()
      .to(".loader", {
        x: "100%",
        duration: 0.8,
        ease: "power4.inOut",
        delay: 1,
      })
      .fromTo(
        position,
        { x: 3, y: -0.8, z: 1.2 },
        { x: 1.28, y: -1.7, z: 5.86, duration: 4, onUpdate },
        "-=0.8",
      )
      .fromTo(
        target,
        { x: 2.5, y: -0.07, z: -0.1 },
        {
          x: isMobile ? -0.21 : 0.91,
          y: 0.03,
          z: -0.25,
          duration: 4,
          onUpdate,
        },
        "-=4",
      )
      .fromTo(
        ".header--container",
        { opacity: 0, y: "-100%" },
        { opacity: 1, y: "0%", ease: "power1.inOut", duration: 0.8 },
        "-=1",
      )
      .fromTo(
        ".hero--scroller",
        { opacity: 0, y: "150%" },
        { opacity: 1, y: "0%", ease: "power4.inOut", duration: 1 },
        "-=1",
      )
      .fromTo(
        ".hero--container",
        { opacity: 0, x: "100%" },
        {
          opacity: 1,
          x: "0%",
          ease: "power4.inOut",
          duration: 1.8,
          onComplete: setupScrollAnimation,
        },
        "-=1",
      )
      .fromTo(
        ".side-bar",
        { opacity: 0, x: "50%" },
        { opacity: 1, x: "0%", ease: "power4.inOut", duration: 2 },
        "-=1",
      )
      .to(
        ".side-bar .unique",
        { opacity: 1, scale: 1.5, ease: "power4.inOut", duration: 2 },
        "-=1",
      );
  }

  // ─ Scroll Animation ───────────────────────────────────────────────────────

  function setupScrollAnimation(): void {
    document.body.style.overflowY = "scroll";

    const stForever = makeST(".cam-view-2");
    const stForeverScrub = makeST(".cam-view-2", 1);
    const stEmotions = makeST(".cam-view-3");
    const stEmotionsScrub = makeST(".cam-view-3", 1);

    gsap
      .timeline({ defaults: { ease: "none" } })
      // ─ Forever section ──────────────────────────────────────────────
      .to(position, {
        x: -1.83,
        y: -0.14,
        z: 6.15,
        scrollTrigger: stForever,
        onUpdate,
      })
      .to(target, {
        x: isMobile ? 0 : -0.78,
        y: isMobile ? 1.5 : -0.03,
        z: -0.12,
        scrollTrigger: stForever,
      })
      .to(scene.ring.rotation, {
        x: ringRotationForModel(0, -Math.PI / 3),
        y: ringRotationForModel(0, -0.92),
        z: ringRotationForModel(Math.PI / 2, 0),
        scrollTrigger: stForever,
      })
      .fromTo(
        lerpForever,
        { x: 0 },
        { x: 1, scrollTrigger: stForever, onUpdate: updateForeverColors },
      )
      .to(".hero--scroller", {
        opacity: 0,
        y: "150%",
        scrollTrigger: makeST(".cam-view-2", 1, {
          end: "top center",
          pin: ".hero--scroller--container",
        }),
      })
      .to(".hero--container", {
        opacity: 0,
        xPercent: 100,
        ease: "power4.out",
        scrollTrigger: stForeverScrub,
      })
      .to(".forever--text-bg", {
        opacity: 0.1,
        ease: "power4.inOut",
        scrollTrigger: stForeverScrub,
      })
      .fromTo(
        ".forever--container",
        { opacity: 0, x: "-110%" },
        {
          opacity: 1,
          x: "0%",
          ease: "power4.inOut",
          scrollTrigger: stForeverScrub,
        },
      )
      .addLabel("Forever")
      .to(".side-bar .unique", {
        opacity: 0.5,
        scale: 1,
        ease: "power4.inOut",
        duration: 2,
        scrollTrigger: stForeverScrub,
      })
      .to(".side-bar .forever", {
        opacity: 1,
        scale: 1.5,
        ease: "power4.inOut",
        duration: 2,
        scrollTrigger: stForeverScrub,
      })
      // ─ Emotions section ─────────────────────────────────────────────
      .to(position, {
        x: -0.06,
        y: -1.15,
        z: 4.42,
        scrollTrigger: stEmotions,
        onUpdate,
      })
      .to(target, {
        x: -0.01,
        y: 0.9,
        z: 0.07,
        scrollTrigger: stEmotions,
        onUpdate,
      })
      .to(scene.ring.rotation, {
        x: ringRotationForModel(0, 0.92),
        y: ringRotationForModel(0, 0.92),
        z: ringRotationForModel(-Math.PI / 2, Math.PI / 3),
        scrollTrigger: stEmotions,
      })
      .fromTo(
        lerpEmotions,
        { x: 0 },
        { x: 1, scrollTrigger: stEmotions, onUpdate: updateEmotionsColors },
      )
      .to(".forever--container", {
        opacity: 0,
        x: "-110%",
        ease: "power4.inOut",
        scrollTrigger: stEmotionsScrub,
      })
      .to(".emotions--text-bg", {
        opacity: 0.1,
        ease: "power4.inOut",
        scrollTrigger: stEmotionsScrub,
      })
      .fromTo(
        ".emotions--content",
        { opacity: 0, y: "130%" },
        {
          opacity: 1,
          y: "0%",
          duration: 0.5,
          ease: "power4.inOut",
          scrollTrigger: stEmotionsScrub,
        },
      )
      .addLabel("Emotions")
      .to(".side-bar .forever", {
        opacity: 0.5,
        scale: 1,
        ease: "power4.inOut",
        duration: 2,
        scrollTrigger: stEmotionsScrub,
      })
      .to(".side-bar .emotions", {
        opacity: 1,
        scale: 1.5,
        ease: "power4.inOut",
        duration: 2,
        scrollTrigger: stEmotionsScrub,
      });
  }

  // ─ Config Animation ───────────────────────────────────────────────────────

  function onConfigAnimationComplete(): void {
    (document.querySelector(".exit--container") as HTMLElement).style.display =
      "flex";
    applyCameraControls(camera.controls, {
      enabled: true,
      autoRotate: true,
      minDistance: 5,
      maxDistance: 13,
      enablePan: false,
      screenSpacePanning: false,
    });
  }

  function runConfigAnimation(): void {
    lenis.stop();
    gsap
      .timeline()
      .to(position, { x: -0.17, y: -0.25, z: 8.5, duration: 2.5, onUpdate })
      .to(target, { x: 0, y: 0, z: 0, duration: 2.5, onUpdate }, "-=2.5")
      .to(
        scene.ring.rotation,
        {
          x: ringRotationForModel(-Math.PI / 2, 0),
          y: 0,
          z: ringRotationForModel(-Math.PI / 2, 0),
          duration: 2.5,
        },
        "-=2.5",
      )
      .to(
        ".emotions--content",
        {
          opacity: 0,
          x: "130%",
          duration: 1.5,
          ease: "power4.out",
          onComplete: onConfigAnimationComplete,
        },
        "-=2.5",
      )
      .fromTo(
        ".footer--menu",
        { opacity: 0, y: "150%" },
        { opacity: 1, y: "0%", duration: 1.5 },
      );
  }

  // ─ Exit Animation ─────────────────────────────────────────────────────────

  function runExitAnimation(): void {
    applyCameraControls(camera.controls, {
      enabled: true,
      autoRotate: false,
      minDistance: 0,
      maxDistance: Infinity,
    });
    lenis.start();
    document.querySelector(".gem--menu")?.classList.remove("show");
    document.querySelector(".materials--menu")?.classList.remove("show");
    clearFooterActive();

    gsap
      .timeline()
      .to(position, {
        x: -0.06,
        y: -1.15,
        z: 4.42,
        duration: 1.2,
        ease: "power4.out",
        onUpdate,
      })
      .to(
        target,
        { x: -0.01, y: 0.9, z: 0.07, duration: 1.2, ease: "power4.out" },
        "-=1.2",
      )
      .to(
        scene.ring.rotation,
        {
          x: ringRotationForModel(0, 0.92),
          y: ringRotationForModel(0, 0.92),
          z: ringRotationForModel(-Math.PI / 2, Math.PI / 3),
        },
        "-=1.2",
      )
      .to(".footer--menu", { opacity: 0, y: "150%" }, "-=1.2")
      .to(
        ".emotions--content",
        { opacity: 1, x: "0%", duration: 0.5, ease: "power4.out" },
        "-=1.2",
      );
  }

  // ─ Model Switch ───────────────────────────────────────────────────────────

  async function switchModel(): Promise<void> {
    const nextModel: RingModel = currentModel === 1 ? 2 : 1;
    const config = MODEL_CONFIGS[nextModel];

    viewer.scene.removeSceneModels();
    await manager.addFromPath(config.path);

    scene = buildSceneObjects(viewer, nextModel);

    if (config.rotation) {
      const [x, y, z] = config.rotation;
      scene.ring.rotation.set(x, y, z);
    }

    if (config.background) {
      viewer.setBackground(toLinear(config.background));
    }

    currentModel = nextModel;
    applyCameraControls(camera.controls, {
      autoRotate: true,
      minDistance: 5,
      maxDistance: 13,
      enablePan: false,
      screenSpacePanning: false,
    });
  }

  // ─ Event Listeners ────────────────────────────────────────────────────────

  onAll([".button-scroll", ".forever", ".hero--scroller"], "click", () =>
    scrollToSection(".cam-view-2"),
  );

  on(".btn-customize", "click", () => {
    (document.querySelector(".cam-view-3") as HTMLElement).style.pointerEvents =
      "none";
    (
      document.getElementById("webgi-canvas") as HTMLElement
    ).style.pointerEvents = "all";
    (
      document.getElementById("webgi-canvas-container") as HTMLElement
    ).style.zIndex = "1";
    document.body.style.overflowY = "hidden";
    document.body.style.cursor = "grab";
    (document.querySelector(".side-bar") as HTMLElement).style.display = "none";
    (
      document.querySelector(".footer--container") as HTMLElement
    ).style.display = "flex";
    runConfigAnimation();
  });

  on(".button--exit", "click", () => {
    (document.querySelector(".cam-view-3") as HTMLElement).style.pointerEvents =
      "all";
    (
      document.getElementById("webgi-canvas") as HTMLElement
    ).style.pointerEvents = "none";
    (
      document.getElementById("webgi-canvas-container") as HTMLElement
    ).style.zIndex = "unset";
    document.body.style.overflowY = "auto";
    (document.querySelector(".exit--container") as HTMLElement).style.display =
      "none";
    document.body.style.cursor = "auto";
    (document.querySelector(".side-bar") as HTMLElement).style.display =
      "block";
    (
      document.querySelector(".footer--container") as HTMLElement
    ).style.display = "none";
    runExitAnimation();
  });

  onAll([".night--mode", ".night--mode--2"], "click", () => nightMode.toggle());
  onAll([".music--control", ".music--control--2"], "click", () =>
    audioController.toggle(),
  );

  on(".config--gem", "click", () => {
    document.querySelector(".gem--menu")?.classList.add("show");
    document.querySelector(".materials--menu")?.classList.remove("show");
    clearFooterActive();
    document
      .querySelector(".config--gem")
      ?.parentElement?.classList.add("active");
    gsap
      .timeline()
      .to(position, { x: 1.6, y: 3.66, z: 2.55, duration: 1.5, onUpdate })
      .to(
        target,
        {
          x: isMobile ? 0 : -0.01,
          y: isMobile ? 0.5 : 0.89,
          z: -0.09,
          duration: 1.5,
        },
        "-=1.5",
      );
  });

  on(".config--material", "click", () => {
    document.querySelector(".materials--menu")?.classList.add("show");
    document.querySelector(".gem--menu")?.classList.remove("show");
    clearFooterActive();
    document
      .querySelector(".config--material")
      ?.parentElement?.classList.add("active");
    gsap
      .timeline()
      .to(position, { x: -0.17, y: -0.25, z: 8.5, duration: 2.5, onUpdate })
      .to(target, { x: 0, y: 0, z: 0, duration: 2.5, onUpdate }, "-=2.5");
  });

  on(".close-gems", "click", () => {
    document.querySelector(".gem--menu")?.classList.remove("show");
    clearFooterActive();
    gsap
      .timeline()
      .to(position, { x: -0.17, y: -0.25, z: 8.5, duration: 2.5, onUpdate })
      .to(target, { x: 0, y: 0, z: 0, duration: 2.5, onUpdate }, "-=2.5");
  });

  on(".close-materials", "click", () => {
    document.querySelector(".materials--menu")?.classList.remove("show");
    clearFooterActive();
  });

  on(".config--ring", "click", () => {
    clearFooterActive();
    gsap.to(".loader", {
      x: "0%",
      duration: 0.8,
      ease: "power4.inOut",
      onComplete: () => { switchModel(); },
    });
  });

  colorManager.bindDiamondListeners();
  colorManager.bindMaterialListeners();
}

setupViewer();

// Autoplay: tenta imediatamente; se o browser bloquear, inicia na primeira interação
audioController.startPlayback().catch(() => {
  document.addEventListener("click", () => audioController.startPlayback(), { once: true });
});
