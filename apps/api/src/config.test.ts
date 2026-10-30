import { describe, expect, it } from 'vitest';
import { ConfigError, DEFAULT_PORT, readPort } from './config.js';

describe('readPort', () => {
  it('defaults when PORT is not set', () => {
    expect(readPort(undefined)).toBe(DEFAULT_PORT);
  });

  it.each([
    ['3000', 3000],
    ['8080', 8080],
    ['0', 0],
    ['65535', 65535],
  ])('accepts %s', (value, port) => {
    expect(readPort(value)).toBe(port);
  });

  it.each(['abc', '', ' ', '-1', '3000.5', '1e3', '0x10', '65536', '99999999999', '3000abc'])(
    'rejects %j with a message that names PORT and the value',
    (value) => {
      expect(() => readPort(value)).toThrow(ConfigError);
      expect(() => readPort(value)).toThrow(/PORT/);
      expect(() => readPort(value)).toThrow(JSON.stringify(value));
    },
  );
});
