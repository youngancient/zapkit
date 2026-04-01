import { expect, test } from 'vitest';
import { greeting } from '../src/index.js';

test('greeting returns correct message', () => {
  expect(greeting('World')).toBe('Hello, World!');
});
