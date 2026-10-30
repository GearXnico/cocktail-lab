import { join } from 'node:path';
import { buildApp } from './app.js';
import { CatalogueError, loadCatalogue } from './catalogue.js';

const dataDir = process.env['DATA_DIR'] ?? join(import.meta.dirname, '..', '..', '..', 'data');
const port = Number(process.env['PORT'] ?? 3000);
const host = process.env['HOST'] ?? '127.0.0.1';

try {
  const catalogue = loadCatalogue(dataDir);
  const app = buildApp({ catalogue, logger: true });
  await app.listen({ port, host });
} catch (error) {
  console.error(error instanceof CatalogueError ? error.message : error);
  process.exit(1);
}
