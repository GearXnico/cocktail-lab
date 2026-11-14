import {
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DirectionalLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NeutralToneMapping,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export interface Framing {
  height: number;
  radius: number;
  centerX: number;
  shadowRadius: number;
}

export interface Stage {
  scene: Scene;
  frame(framing: Framing): void;
  invalidate(): void;
  stats(): string;
}

const FOV = 32;
const BASE_RADIUS = 10;

function contactShadow(): Mesh | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const fade = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
  fade.addColorStop(0, 'rgba(40, 30, 20, 0.4)');
  fade.addColorStop(1, 'rgba(40, 30, 20, 0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, 128, 128);
  const shadow = new Mesh(
    new CircleGeometry(1, 48),
    new MeshBasicMaterial({ map: new CanvasTexture(canvas), transparent: true, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.01;
  return shadow;
}

export function createStage(
  container: HTMLElement,
  reduced: MediaQueryList,
  tick: (dt: number) => boolean,
): Stage {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = NeutralToneMapping;
  renderer.localClippingEnabled = true;
  renderer.domElement.setAttribute('aria-label', '3D model of the drink');
  renderer.domElement.setAttribute('role', 'img');
  container.append(renderer.domElement);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();
  pmrem.dispose();

  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(6, 14, 8);
  const base = new Mesh(
    new CylinderGeometry(BASE_RADIUS, BASE_RADIUS + 0.5, 0.8, 72),
    new MeshStandardMaterial({ color: 0xd8d0c4, roughness: 0.85 }),
  );
  base.position.y = -0.42;
  const shadow = contactShadow();
  scene.add(key, base);
  if (shadow) scene.add(shadow);

  const camera = new PerspectiveCamera(FOV, 1, 1, 400);
  camera.position.set(4.5, 5, 10);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.minPolarAngle = 0.15;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.autoRotateSpeed = 1.2;

  let touched = false;
  const applyMotion = (): void => {
    controls.autoRotate = !reduced.matches && !touched;
    controls.enableDamping = !reduced.matches;
  };
  applyMotion();
  reduced.addEventListener('change', applyMotion);
  controls.addEventListener('start', () => {
    touched = true;
    applyMotion();
  });

  let dirty = true;
  let last: number | null = null;
  const loop = (time: number): void => {
    const dt = last === null ? 0 : Math.min((time - last) / 1000, 0.05);
    last = time;
    const animating = tick(dt);
    const moved = controls.update(dt);
    if (!dirty && !animating && !moved) return;
    dirty = false;
    renderer.render(scene, camera);
  };
  const resume = (): void => {
    last = null;
    dirty = true;
    renderer.setAnimationLoop(document.hidden ? null : loop);
  };
  document.addEventListener('visibilitychange', resume);
  resume();

  const resize = (): void => {
    const { clientWidth, clientHeight } = container;
    if (clientWidth === 0 || clientHeight === 0) return;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
    dirty = true;
  };
  resize();
  new ResizeObserver(resize).observe(container);

  return {
    scene,
    frame({ height, radius, centerX, shadowRadius }) {
      const direction = camera.position.clone().sub(controls.target).normalize();
      const size = Math.max((height + 4) * 1.25, radius * 3.4);
      const distance = size / 2 / Math.tan((FOV * Math.PI) / 360) / Math.min(camera.aspect, 1);
      controls.target.set(centerX, (height + 2) / 2, 0);
      camera.position.copy(controls.target).addScaledVector(direction, distance);
      controls.minDistance = distance * 0.45;
      controls.maxDistance = distance * 1.8;
      const spread = Math.max(1, (radius + 3) / BASE_RADIUS);
      base.position.x = centerX;
      base.scale.set(spread, 1, spread);
      shadow?.scale.setScalar(shadowRadius * 1.6);
      controls.update();
      dirty = true;
    },
    invalidate() {
      dirty = true;
    },
    stats() {
      const { memory, render } = renderer.info;
      return `${String(memory.geometries)} geometries · ${String(memory.textures)} textures · ${String(render.calls)} draw calls · ${String(render.triangles)} triangles`;
    },
  };
}
