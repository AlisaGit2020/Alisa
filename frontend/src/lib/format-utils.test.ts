import { formatCurrency, formatDate, formatNumber } from './format-utils';

describe('formatCurrency', () => {
  it('returns "-" for undefined', () => {
    expect(formatCurrency(undefined)).toBe('-');
  });

  it('returns "-" for null', () => {
    expect(formatCurrency(null)).toBe('-');
  });

  it('formats positive number as EUR currency', () => {
    const result = formatCurrency(1500);
    // Finnish locale uses non-breaking space before €
    expect(result).toMatch(/1[\s\u00A0]?500[\s\u00A0]?€/);
  });

  it('formats zero as currency', () => {
    const result = formatCurrency(0);
    expect(result).toMatch(/0[\s\u00A0]?€/);
  });

  it('formats negative number as currency', () => {
    const result = formatCurrency(-500);
    expect(result).toMatch(/-?500[\s\u00A0]?€/);
  });

  it('rounds to whole number (no decimals)', () => {
    const result = formatCurrency(1234.56);
    expect(result).toMatch(/1[\s\u00A0]?235[\s\u00A0]?€/);
  });
});

describe('formatDate', () => {
  it('returns "-" for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('returns "-" for null', () => {
    expect(formatDate(null)).toBe('-');
  });

  it('returns "-" for empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('formats Date object using Finnish locale', () => {
    const date = new Date('2024-06-15');
    const result = formatDate(date);
    // Finnish format: d.m.yyyy
    expect(result).toBe('15.6.2024');
  });

  it('formats ISO string using Finnish locale', () => {
    const result = formatDate('2024-12-25');
    expect(result).toBe('25.12.2024');
  });

  it('formats datetime string correctly', () => {
    const result = formatDate('2024-01-01T12:00:00Z');
    expect(result).toBe('1.1.2024');
  });
});

describe('formatNumber', () => {
  it('returns "-" for undefined', () => {
    expect(formatNumber(undefined)).toBe('-');
  });

  it('returns "-" for null', () => {
    expect(formatNumber(null)).toBe('-');
  });

  it('formats number with default 0 decimals', () => {
    const result = formatNumber(1234.56);
    // Finnish locale uses space as thousand separator
    expect(result).toMatch(/1[\s\u00A0]?235/);
  });

  it('formats number with specified decimals', () => {
    const result = formatNumber(1234.567, 2);
    expect(result).toMatch(/1[\s\u00A0]?234,57/);
  });

  it('formats zero correctly', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats negative number correctly', () => {
    const result = formatNumber(-500, 0);
    // Finnish locale uses Unicode minus sign (−) not hyphen-minus (-)
    expect(result).toMatch(/[-−]500/);
  });

  it('pads with zeros when decimals specified', () => {
    const result = formatNumber(100, 2);
    expect(result).toBe('100,00');
  });
});
