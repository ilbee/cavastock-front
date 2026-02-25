import { describe, it, expect } from 'vitest';
import { formatPrice } from './format';

describe('formatPrice', () => {
  it('formats cents to EUR', () => {
    expect(formatPrice(8500)).toBe('85,00\u00a0€');
  });

  it('formats zero', () => {
    expect(formatPrice(0)).toBe('0,00\u00a0€');
  });

  it('formats small amounts', () => {
    expect(formatPrice(50)).toBe('0,50\u00a0€');
  });
});
