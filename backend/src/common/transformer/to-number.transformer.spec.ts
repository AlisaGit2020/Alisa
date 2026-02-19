import { toNumber } from './to-number.transformer';

describe('toNumber transformer', () => {
  describe('with default value 0', () => {
    const transform = toNumber(0);

    it('returns default for empty string', () => {
      expect(transform({ value: '' })).toBe(0);
    });

    it('returns default for null', () => {
      expect(transform({ value: null })).toBe(0);
    });

    it('returns default for undefined', () => {
      expect(transform({ value: undefined })).toBe(0);
    });

    it('returns default for NaN', () => {
      expect(transform({ value: NaN })).toBe(0);
    });

    it('returns default for non-numeric string', () => {
      expect(transform({ value: 'abc' })).toBe(0);
    });

    it('converts numeric string to number', () => {
      expect(transform({ value: '100' })).toBe(100);
    });

    it('converts decimal string to number', () => {
      expect(transform({ value: '50.5' })).toBe(50.5);
    });

    it('preserves number values', () => {
      expect(transform({ value: 42 })).toBe(42);
    });

    it('preserves decimal number values', () => {
      expect(transform({ value: 99.99 })).toBe(99.99);
    });

    it('preserves negative numbers', () => {
      expect(transform({ value: -100 })).toBe(-100);
    });

    it('converts negative string to number', () => {
      expect(transform({ value: '-50.5' })).toBe(-50.5);
    });
  });

  describe('with default value 1', () => {
    const transform = toNumber(1);

    it('returns default 1 for empty string', () => {
      expect(transform({ value: '' })).toBe(1);
    });

    it('returns default 1 for null', () => {
      expect(transform({ value: null })).toBe(1);
    });

    it('returns default 1 for undefined', () => {
      expect(transform({ value: undefined })).toBe(1);
    });

    it('converts valid number string', () => {
      expect(transform({ value: '5' })).toBe(5);
    });
  });

  describe('with custom default value', () => {
    it('returns custom default for invalid input', () => {
      const transform = toNumber(999);
      expect(transform({ value: '' })).toBe(999);
      expect(transform({ value: null })).toBe(999);
      expect(transform({ value: 'invalid' })).toBe(999);
    });
  });
});
