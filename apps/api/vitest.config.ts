import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Tests run on core's source, so they do not need `npm run build` first.
export default defineConfig({
  resolve: {
    alias: {
      '@cocktail-lab/core': fileURLToPath(new URL('../../packages/core/src/index.ts', import.meta.url)),
    },
  },
});
