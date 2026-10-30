import { join } from 'node:path';
import { buildApp } from './app.js';
import { CatalogueError, loadCatalogue } from './catalogue.js';
import { ConfigError, readPort } from './config.js';

const dataDir = process.env['DATA_DIR'] ?? join(import.meta.dirname, '..', '..', '..', 'data');
const host = process.env['HOST'] ?? '127.0.0.1';

try {
  const port = readPort(process.env['PORT']);
  const catalogue = loadCatalogue(dataDir);
  const app = buildApp({ catalogue, logger: true });
  await app.listen({ port, host });
} catch (error) {
  console.error(error instanceof CatalogueError || error instanceof ConfigError ? error.message : error);
  process.exit(1);
}
