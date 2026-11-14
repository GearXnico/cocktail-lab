import './style.css';
import { GLASSES, ICES, ingredientNames, recipes, type Recipe } from './recipes';
import { planSteps, type Step } from './steps';
import type { Viewer } from './viewer';
import { fallbackHint, visualHints } from './visual-hints';

function el<T extends HTMLElement>(id: string, type: new () => T): T {
  const node = document.getElementById(id);
  if (!(node instanceof type)) throw new Error(`Missing #${id}`);
  return node;
}

const text = (id: string): HTMLElement => el(id, HTMLElement);

const params = new URLSearchParams(location.search);
const lang = navigator.language.startsWith('es') ? 'es' : 'en';
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const list = text('recipe-list');
const stage = text('stage');
const stepsToggle = el('steps-toggle', HTMLInputElement);
const prev = el('prev', HTMLButtonElement);
const next = el('next', HTMLButtonElement);
const glassSelect = el('glass', HTMLSelectElement);
const iceSelect = el('ice', HTMLSelectElement);

const first = recipes.find((recipe) => recipe.id === params.get('recipe')) ?? recipes[0];
if (!first) throw new Error('No recipes found in data/recipes');

let current: Recipe = first;
let plan: Step[] = [];
let step = 0;
let viewer: Viewer | null = null;

const hintFor = (recipe: Recipe) => visualHints[recipe.id] ?? fallbackHint;
const glass = () => GLASSES.find((value) => value === glassSelect.value) ?? current.glass;
const ice = () => ICES.find((value) => value === iceSelect.value) ?? current.ice;
const lastStep = () => plan.length - 1;

function describe(item: Step): string {
  switch (item.kind) {
    case 'glass':
      return `Glass: ${glass()}`;
    case 'ice':
      return `Ice: ${ice()}`;
    case 'technique':
      return `Technique: ${current.technique}`;
    case 'garnish':
      return `Garnish: ${current.garnish?.[lang] ?? (hintFor(current).garnish ?? []).join(', ')}`;
    default: {
      const line = current.ingredients[item.line];
      if (!line) return '';
      const name = ingredientNames.get(line.ingredientId)?.[lang] ?? line.ingredientId;
      return `${line.topUp ? 'Top up' : 'Add'}: ${name}, ${String(line.amount)} ${line.unit}`;
    }
  }
}

function stepText(): string {
  const item = plan[step];
  return item ? `${String(step + 1)}/${String(plan.length)} · ${describe(item)}` : '';
}

function renderStep(animate: boolean): void {
  viewer?.setStep(step, animate);
  text('step-label').textContent = stepsToggle.checked ? stepText() : '';
  prev.disabled = !stepsToggle.checked || step === 0;
  next.disabled = !stepsToggle.checked || step === lastStep();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (viewer) text('stats').textContent = viewer.stats();
    });
  });
}

function rebuild(): void {
  plan = planSteps(current, hintFor(current), ice());
  step = stepsToggle.checked ? Math.min(Math.max(step, 0), lastStep()) : lastStep();
  viewer?.show(current, hintFor(current), { glass: glass(), ice: ice(), steps: plan });
  renderStep(false);
}

function select(recipe: Recipe): void {
  current = recipe;
  step = 0;
  glassSelect.value = recipe.glass;
  iceSelect.value = recipe.ice;
  for (const button of list.querySelectorAll('button')) {
    button.setAttribute('aria-current', String(button.dataset.id === recipe.id));
  }
  text('title').textContent = recipe.name[lang];
  text('facts').textContent = [
    recipe.glass,
    `ice: ${recipe.ice}`,
    recipe.technique,
    recipe.garnish?.[lang] ?? 'no garnish',
  ].join(' · ');
  rebuild();
}

function renderList(): void {
  let family = '';
  for (const recipe of recipes) {
    if (recipe.family !== family) {
      family = recipe.family;
      const heading = document.createElement('h3');
      heading.textContent = family.replaceAll('-', ' ');
      list.append(heading);
    }
    const swatch = document.createElement('span');
    swatch.className = 'swatch';
    swatch.style.background = hintFor(recipe).color;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'recipe';
    button.dataset.id = recipe.id;
    button.append(swatch, recipe.name[lang]);
    button.addEventListener('click', () => {
      select(recipe);
    });
    list.append(button);
  }
}

function fillSelect(target: HTMLSelectElement, values: readonly string[]): void {
  target.append(...values.map((value) => new Option(value, value)));
  target.addEventListener('change', rebuild);
}

function webglAvailable(): boolean {
  try {
    return document.createElement('canvas').getContext('webgl2') !== null;
  } catch {
    return false;
  }
}

async function loadViewer(): Promise<void> {
  try {
    if (params.has('nowebgl') || !webglAvailable()) throw new Error('WebGL 2 is not available');
    const { createViewer } = await import('./viewer');
    viewer = createViewer(stage, reduced);
    rebuild();
  } catch (error) {
    console.warn(error);
    text('fallback').hidden = false;
    for (const control of [stepsToggle, prev, next, glassSelect, iceSelect]) control.disabled = true;
  }
}

stepsToggle.addEventListener('change', () => {
  step = stepsToggle.checked ? 0 : lastStep();
  renderStep(false);
});
prev.addEventListener('click', () => {
  step = Math.max(step - 1, 0);
  renderStep(false);
});
next.addEventListener('click', () => {
  step = Math.min(step + 1, lastStep());
  renderStep(true);
});

renderList();
fillSelect(glassSelect, GLASSES);
fillSelect(iceSelect, ICES);
stepsToggle.checked = params.has('step');
select(current);

for (const [key, target] of [['glass', glassSelect], ['ice', iceSelect]] as const) {
  const value = params.get(key);
  if (value && [...target.options].some((option) => option.value === value)) target.value = value;
}
const startStep = Number(params.get('step') ?? NaN);
if (Number.isInteger(startStep)) step = startStep;
rebuild();
void loadViewer();
