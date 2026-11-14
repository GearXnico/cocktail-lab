import type { Recipe } from '../recipes';
import type { VisualHint } from '../visual-hints';
import { disposeTree } from './dispose';
import { buildDrink, type Drink, type DrinkOptions } from './drink';
import { createStage } from './stage';

export interface Viewer {
  show(recipe: Recipe, hint: VisualHint, options: DrinkOptions): void;
  setStep(step: number, animate: boolean): void;
  stats(): string;
}

export function createViewer(container: HTMLElement, reduced: MediaQueryList): Viewer {
  let drink: Drink | null = null;
  const stage = createStage(container, reduced, (dt) => drink?.update(dt) ?? false);

  return {
    show(recipe, hint, options) {
      if (drink) {
        stage.scene.remove(drink.object);
        disposeTree(drink.object);
      }
      drink = buildDrink(recipe, hint, options);
      stage.scene.add(drink.object);
      stage.frame(drink.height, drink.radius);
    },
    setStep(step, animate) {
      drink?.setStep(step, animate && !reduced.matches);
      stage.invalidate();
    },
    stats: () => stage.stats(),
  };
}
