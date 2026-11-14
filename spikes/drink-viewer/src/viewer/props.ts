import {
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  type Color,
} from 'three';
import type { GlassModel } from './glasses';
import { radiusAt } from './profile';

export interface Stream {
  object: Mesh;
  set(topY: number, bottomY: number, color: Color, thin: boolean): void;
  hide(): void;
}

export function barSpoon(glass: GlassModel): Group {
  const length = glass.rimY - glass.bottomY + 5;
  const reach = radiusAt(glass.cavity, glass.bottomY + 1) * 0.45;
  const material = new MeshStandardMaterial({ color: 0xd8dde2, metalness: 1, roughness: 0.25 });
  const shaft = new Mesh(new CylinderGeometry(0.07, 0.07, length, 6), material);
  shaft.position.y = length / 2;
  const bowl = new Mesh(new SphereGeometry(0.32, 10, 8), material);
  bowl.scale.set(1, 1.5, 0.4);
  const spoon = new Group();
  spoon.add(shaft, bowl);
  spoon.position.set(reach, glass.bottomY + 0.6, 0);
  spoon.rotation.z = Math.atan2(reach * 1.6, length);
  const pivot = new Group();
  pivot.add(spoon);
  return pivot;
}

export function buildStream(): Stream {
  const material = new MeshStandardMaterial({ roughness: 0.2, transparent: true, opacity: 0.85 });
  const object = new Mesh(new CylinderGeometry(1, 0.75, 1, 10, 1, true), material);
  object.renderOrder = 1;
  object.visible = false;

  return {
    object,
    set(topY, bottomY, color, thin) {
      const length = topY - bottomY;
      const width = thin ? 0.05 : 0.13;
      object.visible = length > 0.02;
      object.scale.set(width, Math.max(length, 0.02), width);
      object.position.y = (topY + bottomY) / 2;
      material.color.copy(color);
    },
    hide() {
      object.visible = false;
    },
  };
}
