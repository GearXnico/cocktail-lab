export const DEFAULT_PORT = 3000;

/** Thrown when an environment variable has a value the server cannot use. */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/** Reads `PORT`: a whole number from 0 to 65535, or {@link DEFAULT_PORT} when it is not set. */
export function readPort(value: string | undefined): number {
  if (value === undefined) return DEFAULT_PORT;
  const port = /^\d{1,5}$/.test(value) ? Number(value) : NaN;
  if (!(port <= 65535)) {
    throw new ConfigError(`PORT must be a whole number from 0 to 65535, got ${JSON.stringify(value)}`);
  }
  return port;
}
