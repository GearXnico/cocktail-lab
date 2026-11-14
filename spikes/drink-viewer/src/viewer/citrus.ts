import {
  BufferGeometry,
  CanvasTexture,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  SRGBColorSpace,
  type Object3D,
} from 'three';
import type { Citrus, CitrusCut } from '../visual-hints';

interface Tone {
  rind: string;
  flesh: string;
  radius: number;
}

const PITH = '#fbf5dc';

const TONES: Record<Citrus, Tone> = {
  lime: { rind: '#5f9e2f', flesh: '#cfe39a', radius: 1.9 },
  lemon: { rind: '#f1d232', flesh: '#f7eb9c', radius: 2.2 },
  orange: { rind: '#ee8a1e', flesh: '#f8ad45', radius: 2.9 },
};

function faceMaterial(tone: Tone): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ color: tone.flesh, roughness: 0.5 });
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return material;

  const disc = (radius: number, fill: string): void => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(64, 64, radius, 0, Math.PI * 2);
    ctx.fill();
  };
  ctx.fillStyle = tone.rind;
  ctx.fillRect(0, 0, 128, 128);
  disc(58, PITH);
  disc(52, tone.flesh);
  ctx.strokeStyle = PITH;
  ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.lineTo(64 + Math.cos(angle) * 52, 64 + Math.sin(angle) * 52);
    ctx.stroke();
  }
  disc(5, PITH);

  material.map = new CanvasTexture(canvas);
  material.map.colorSpace = SRGBColorSpace;
  material.color.set(0xffffff);
  return material;
}

const rindMaterial = (tone: Tone): MeshStandardMaterial =>
  new MeshStandardMaterial({ color: tone.rind, roughness: 0.55, side: DoubleSide });

// Every piece is built in the rim frame: origin on the rim, +Y up, +Z pointing
// away from the glass.
function wheel(tone: Tone): Object3D {
  const face = faceMaterial(tone);
  const mesh = new Mesh(new CylinderGeometry(tone.radius, tone.radius, 0.32, 40), [
    rindMaterial(tone),
    face,
    face,
  ]);
  mesh.rotation.z = Math.PI / 2;
  mesh.position.y = tone.radius * 0.3;
  return mesh;
}

function wedge(tone: Tone): Object3D {
  const arc = 1.15;
  const start = Math.PI / 2 - arc / 2;
  const flesh = new MeshStandardMaterial({ color: tone.flesh, roughness: 0.5, side: DoubleSide });
  const group = new Group();
  group.add(new Mesh(new SphereGeometry(tone.radius, 12, 16, start, arc), rindMaterial(tone)));
  for (const angle of [start, start + arc]) {
    const cut = new Mesh(new CircleGeometry(tone.radius, 20, Math.PI / 2, Math.PI), flesh);
    cut.rotation.y = angle;
    group.add(cut);
  }
  group.rotation.x = -Math.PI / 2;
  group.position.y = -tone.radius * 0.3;
  return group;
}

function twist(tone: Tone): Object3D {
  const steps = 48;
  const turns = 2.25;
  const length = 4.2;
  const radius = 0.42;
  const width = 0.62;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = (t - 0.5) * length;
    positions.push(x, y - width / 2, z, x, y + width / 2, z);
    if (i < steps) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new Mesh(geometry, rindMaterial(tone));
  mesh.rotation.x = 1.15;
  mesh.position.set(0, 0.5, 0.2);
  return mesh;
}

const CUTS: Record<CitrusCut, (tone: Tone) => Object3D> = { wheel, wedge, twist };

export function buildCitrus(fruit: Citrus, cut: CitrusCut): Object3D {
  return CUTS[cut](TONES[fruit]);
}
