import {
  CanvasTexture,
  Color,
  ImageBitmapLoader,
  DirectionalLight,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  Object3D,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// The router of the hero, drawn live. The model and its baked shading come from
// scripts/blender/router.py; this file lights it, moves the camera and runs the
// status lights. It is loaded only when the hero is going to move (Hero.tsx),
// so three.js is never part of the page's first download.
//
// Nothing here casts a shadow or computes occlusion: the soft shading in the
// fins and under the body, and the shadow on the floor, were baked by Cycles
// and are multiplied in. That is what lets a phone draw it.

export type HeroSceneFiles = { model: string; occlusion: string; floor: string };

export type HeroScene = {
  /** The first touch: the status lights come on one after another and a wave leaves the router. */
  powerOn(): void;
  /** Every later touch: a flicker of traffic and another wave. */
  tap(): void;
  dispose(): void;
};

type Options = {
  files: HeroSceneFiles;
  /** The page's backdrop behind the picture, so the canvas has no visible edge. */
  backdrop: string;
  /** Nothing moves by itself and the lights are on: the frame the poster is taken from. */
  still: boolean;
  /** How far the hero's pinned scroll has gone, 0..1, asked every frame: the camera rises and swings round the router. */
  progress(): number;
  /** Where the antenna the finger touches is on the canvas, as shares of it; called when it changes. */
  onTouchPoint(x: number, y: number): void;
};

/** Camera: degrees round the router (0 = straight in front), degrees above the floor, metres away, and what it looks at. */
type View = { azimuth: number; elevation: number; radius: number; target: Vector3 };
const REST: View = { azimuth: -13, elevation: 15, radius: 1.22, target: new Vector3(-0.15, 0.086, 0) };
const SHOWN: View = { azimuth: 26, elevation: 37, radius: 0.98, target: new Vector3(0, 0.06, 0) };

/** The status lights, in the model's order. LOS is the fault light: it stays dark. These carry traffic and flicker. */
const DARK = new Set([2]);
const BUSY = new Set([3, 4, 8, 9]);
const LED_OFF = new Color(0x3a3d40);
const LED_ON = new Color(0x2dff7c);

const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * A baked map, the right way up for the model's UVs (glTF stores them top-down).
 * It is decoded as a bitmap, as GLTFLoader does with a model's own textures: a
 * bitmap's orientation is fixed when it is decoded, whereas a plain image is
 * flipped or not by the renderer's state at the moment it is uploaded, and with
 * two such maps that came out differently from one load to the next.
 */
async function bakedMap(url: string) {
  let texture: Texture;
  try {
    const bitmap = await new ImageBitmapLoader().setOptions({ imageOrientation: "none", premultiplyAlpha: "none", colorSpaceConversion: "none" }).loadAsync(url);
    texture = new Texture(bitmap);
  } catch {
    texture = await new TextureLoader().loadAsync(url);
  }
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

/** A soft round spot, for the glow a status light throws on the plastic round it. */
function glowTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d")!;
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

export async function createHeroScene(canvas: HTMLCanvasElement, options: Options): Promise<HeroScene> {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(new Color(options.backdrop));

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  scene.environmentIntensity = 0.56;
  room.dispose();
  pmrem.dispose();

  // One soft key from the upper left, where the arm comes from, and a rim from behind.
  const key = new DirectionalLight(0xffffff, 1.25);
  key.position.set(-0.7, 1.2, 0.9);
  const rim = new DirectionalLight(0xffffff, 0.35);
  rim.position.set(0.9, 0.6, -0.8);
  scene.add(key, rim);

  const camera = new PerspectiveCamera(24, 16 / 9, 0.05, 20);

  const [gltf, occlusion, floorShade] = await Promise.all([new GLTFLoader().loadAsync(options.files.model), bakedMap(options.files.occlusion), bakedMap(options.files.floor)]).catch(
    (error: unknown) => {
      // Nothing will be drawn: give the graphics memory back before saying so.
      scene.environment?.dispose();
      renderer.dispose();
      throw error;
    },
  );

  const shell = new MeshPhysicalMaterial({ color: 0xe9e9eb, roughness: 0.46, clearcoat: 0.3, clearcoatRoughness: 0.3, aoMap: occlusion, aoMapIntensity: 1.2 });
  const vent = new MeshStandardMaterial({ color: 0x9a9da3, roughness: 0.82, aoMap: occlusion, aoMapIntensity: 1.2 });
  const acrylic = new MeshPhysicalMaterial({ color: 0xe9eef2, roughness: 0.18, transparent: true, opacity: 0.2, envMapIntensity: 0.55, depthWrite: false });
  const print = new MeshStandardMaterial({ color: 0x8b8e94, roughness: 0.7 });
  // The floor is only its shadow: the darker the bake, the more of it there is.
  const shadow = new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { shade: { value: floorShade }, strength: { value: 0.9 } },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D shade; uniform float strength; varying vec2 vUv; void main() { float dark = 1.0 - texture2D(shade, vUv).g; gl_FragColor = vec4(0.16, 0.17, 0.2, dark * strength); }",
  });

  const glow = glowTexture();
  const leds: { lamp: MeshBasicMaterial; halo: MeshBasicMaterial; level: number; target: number; at: number; busy: boolean }[] = [];
  let touch: Object3D | null = null;

  gltf.scene.traverse((node) => {
    if (node.name === "Touch") touch = node;
    if (!(node instanceof Mesh)) return;
    const name = (node.material as { name?: string }).name ?? "";
    if (name === "Shell") node.material = shell;
    else if (name === "Vent") node.material = vent;
    else if (name === "Clear") {
      node.material = acrylic;
      node.renderOrder = 2;
    } else if (name === "Print") node.material = print;
    else if (name === "Floor") {
      node.material = shadow;
      node.renderOrder = 1;
    } else if (name === "Logo") {
      const logo = node.material as MeshStandardMaterial;
      logo.transparent = true;
      logo.depthWrite = false;
      logo.roughness = 0.5;
      // The top is seen at a shallow angle: without this the mark smears.
      if (logo.map) logo.map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    } else if (name.startsWith("Led")) {
      const index = Number(name.slice(3));
      const lamp = new MeshBasicMaterial({ color: LED_OFF.clone(), toneMapped: false });
      node.material = lamp;
      const halo = new MeshBasicMaterial({ map: glow, color: 0x35f07f, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
      const spot = new Mesh(new PlaneGeometry(0.011, 0.011), halo);
      node.geometry.computeBoundingBox();
      node.geometry.boundingBox!.getCenter(spot.position);
      spot.position.y += 0.0005;
      spot.rotation.x = -Math.PI / 2;
      spot.renderOrder = 3;
      node.parent!.add(spot);
      leds[index] = { lamp, halo, level: 0, target: 0, at: 0, busy: BUSY.has(index) };
    }
  });
  scene.add(gltf.scene);

  // Waves that leave the router across the floor when it is touched.
  const ring = new RingGeometry(0.992, 1, 128);
  const waves = Array.from({ length: 4 }, () => {
    const material = new MeshBasicMaterial({ color: 0x0b0b0c, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const mesh = new Mesh(ring, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.0015;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, material, start: -1, red: false };
  });
  let nextWave = 0;
  const wave = (delay: number, red: boolean) => {
    const item = waves[nextWave++ % waves.length];
    item.start = clock() + delay;
    item.red = red;
  };

  let disposed = false;
  let frame = 0;
  let visible = true;
  let last = performance.now();
  let time = 0;
  const clock = () => time;
  const pointer = { x: 0, y: 0, easedX: 0, easedY: 0 };
  const view = { azimuth: REST.azimuth, elevation: REST.elevation, radius: REST.radius, target: REST.target.clone() };
  const touchWorld = new Vector3();
  const touchSeen = { x: -1, y: -1 };

  const resize = () => {
    const box = canvas.parentElement ?? canvas;
    const width = box.clientWidth;
    const height = box.clientHeight;
    if (!width || !height) return;
    // A phone shows only half of the picture's width, and draws it on a slower chip.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  const draw = (now: number) => {
    frame = 0;
    if (disposed) return;
    const delta = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += delta;

    // The camera: from the view at rest to the view that shows the top, with the scroll.
    const shown = easeInOut(MathUtils.clamp(options.progress(), 0, 1));
    pointer.easedX += (pointer.x - pointer.easedX) * Math.min(1, delta * 3);
    pointer.easedY += (pointer.y - pointer.easedY) * Math.min(1, delta * 3);
    const drift = options.still ? 0 : 1;
    view.azimuth = MathUtils.lerp(REST.azimuth, SHOWN.azimuth, shown) + drift * (Math.sin(time * 0.42) * 0.7 + pointer.easedX * 1.8);
    view.elevation = MathUtils.lerp(REST.elevation, SHOWN.elevation, shown) + drift * (Math.cos(time * 0.31) * 0.35 - pointer.easedY * 1.1);
    view.radius = MathUtils.lerp(REST.radius, SHOWN.radius, shown);
    view.target.lerpVectors(REST.target, SHOWN.target, shown);
    const azimuth = MathUtils.degToRad(view.azimuth);
    const elevation = MathUtils.degToRad(view.elevation);
    camera.position.set(
      view.target.x + view.radius * Math.cos(elevation) * Math.sin(azimuth),
      view.target.y + view.radius * Math.sin(elevation),
      view.target.z + view.radius * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(view.target);

    // The status lights ease towards what they should be; the busy ones flicker.
    for (const led of leds) {
      if (!led) continue;
      if (led.busy && led.target > 0 && !options.still && time > led.at) {
        led.target = led.target > 0.6 ? 0.3 : 1;
        led.at = time + 0.06 + Math.random() * (led.target > 0.6 ? 0.5 : 0.12);
      }
      led.level += (led.target - led.level) * Math.min(1, delta * 22);
      led.lamp.color.lerpColors(LED_OFF, LED_ON, led.level);
      led.halo.opacity = led.level * 0.6;
    }

    for (const item of waves) {
      const age = item.start < 0 ? -1 : (time - item.start) / 2.6;
      item.mesh.visible = age >= 0 && age < 1;
      if (!item.mesh.visible) continue;
      const out = 1 - (1 - age) ** 3;
      item.mesh.scale.setScalar(0.16 + out * 0.62);
      item.material.color.set(item.red ? 0xe60012 : 0x0b0b0c);
      item.material.opacity = (item.red ? 0.5 : 0.2) * (1 - age) ** 1.5;
    }

    renderer.render(scene, camera);

    if (touch) {
      touch.getWorldPosition(touchWorld).project(camera);
      const x = (touchWorld.x + 1) / 2;
      const y = (1 - touchWorld.y) / 2;
      if (Math.abs(x - touchSeen.x) > 0.0002 || Math.abs(y - touchSeen.y) > 0.0002) {
        touchSeen.x = x;
        touchSeen.y = y;
        options.onTouchPoint(x, y);
      }
    }
    if (visible && !options.still) frame = requestAnimationFrame(draw);
  };
  const request = () => {
    if (!frame && !disposed) {
      last = performance.now();
      frame = requestAnimationFrame(draw);
    }
  };

  const light = (index: number, delay: number) => {
    const led = leds[index];
    if (!led || DARK.has(index)) return;
    window.setTimeout(() => {
      led.target = 1;
      led.at = time + 0.4 + Math.random();
    }, delay);
  };

  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };
  const sized = new ResizeObserver(() => {
    resize();
    request();
  });
  sized.observe(canvas.parentElement ?? canvas);
  // Nothing is drawn while the hero is off the screen.
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) request();
  });
  seen.observe(canvas);
  window.addEventListener("pointermove", onPointer, { passive: true });

  resize();
  if (options.still) leds.forEach((led, index) => led && !DARK.has(index) && ((led.target = 1), (led.level = 1)));
  // The first frame is drawn before this resolves, so the canvas can be shown at once.
  draw(performance.now());

  return {
    powerOn() {
      leds.forEach((_, index) => light(index, index * 85));
      wave(0.1, true);
      wave(0.55, false);
      wave(1.0, false);
      request();
    },
    tap() {
      leds.forEach((led, index) => {
        if (led && led.busy) led.at = 0;
        else light(index, 0);
      });
      wave(0, true);
      wave(0.45, false);
      request();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      sized.disconnect();
      seen.disconnect();
      window.removeEventListener("pointermove", onPointer);
      scene.traverse((node) => {
        if (node instanceof Mesh) node.geometry.dispose();
      });
      [shell, vent, acrylic, print, shadow, ...waves.map((item) => item.material), ...leds.flatMap((led) => (led ? [led.lamp, led.halo] : []))].forEach((material) => material.dispose());
      [occlusion, floorShade, glow, scene.environment].forEach((texture) => texture?.dispose());
      renderer.dispose();
    },
  };
}
