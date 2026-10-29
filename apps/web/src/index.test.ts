import { describe, expect, it } from 'vitest';
import { packageName } from './index.js';

describe('web', () => {
  it('exports its package name', () => {
    expect(packageName).toBe('@cocktail-lab/web');
  });
});
