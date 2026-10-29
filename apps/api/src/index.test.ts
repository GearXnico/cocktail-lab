import { describe, expect, it } from 'vitest';
import { packageName } from './index.js';

describe('api', () => {
  it('exports its package name', () => {
    expect(packageName).toBe('@cocktail-lab/api');
  });
});
