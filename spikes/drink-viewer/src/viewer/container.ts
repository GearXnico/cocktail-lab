import { Group, Vector3 } from 'three';
import type { GlassModel } from './glasses';
import type { IceModel } from './ice';
import type { Liquid } from './liquid';
import { barSpoon } from './props';
import type { Solid } from './solids';

export interface Container {
  model: GlassModel;
  object: Group;
  home: Vector3;
  liquid: Liquid;
  ice: IceModel;
  spoon: Group;
  solids: Map<number, Solid>;
  setLevel(level: number): void;
  reset(): void;
}

export function buildContainer(
  model: GlassModel,
  homeX: number,
  liquid: Liquid,
  ice: IceModel,
): Container {
  const spoon = barSpoon(model);
  const object = new Group();
  object.add(model.object, liquid.object, ice.object, spoon);
  const home = new Vector3(homeX, 0, 0);
  const solids = new Map<number, Solid>();

  return {
    model,
    object,
    home,
    liquid,
    ice,
    spoon,
    solids,
    setLevel(level) {
      liquid.setLevel(level, object.position.y);
      const surface = liquid.levelY(level);
      for (const solid of solids.values()) solid.settle(surface, 0);
    },
    reset() {
      object.position.copy(home);
      object.rotation.set(0, 0, 0);
      liquid.object.visible = true;
      spoon.visible = false;
      ice.setDrop(1);
      ice.object.rotation.y = 0;
    },
  };
}
