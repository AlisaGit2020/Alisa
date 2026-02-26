import { getNumber, getNumberOrUndefined, getPhotoUrl } from './functions';
import { VITE_BASE_URL } from '../constants';

describe('getNumber', () => {
  it('returns 0 for empty string', () => {
    expect(getNumber('', 2)).toBe(0);
  });

  it('returns 0 for "0"', () => {
    expect(getNumber('0', 2)).toBe(0);
  });

  it('parses float with specified decimals', () => {
    expect(getNumber('3.14159', 2)).toBe(3.14);
  });
});

describe('getNumberOrUndefined', () => {
  it('returns undefined for empty string', () => {
    expect(getNumberOrUndefined('', 2)).toBeUndefined();
  });

  it('returns undefined for whitespace string', () => {
    expect(getNumberOrUndefined('   ', 2)).toBeUndefined();
  });

  it('returns 0 for "0" (preserves zero as valid value)', () => {
    expect(getNumberOrUndefined('0', 2)).toBe(0);
  });

  it('parses positive number', () => {
    expect(getNumberOrUndefined('123.456', 2)).toBe(123.46);
  });

  it('parses negative number', () => {
    expect(getNumberOrUndefined('-50', 0)).toBe(-50);
  });
});

describe('getPhotoUrl', () => {
  it('returns placeholder for undefined photo', () => {
    expect(getPhotoUrl(undefined)).toBe('/assets/properties/placeholder.svg');
  });

  it('returns placeholder for null photo', () => {
    expect(getPhotoUrl(null as unknown as string)).toBe('/assets/properties/placeholder.svg');
  });

  it('returns placeholder for empty string', () => {
    expect(getPhotoUrl('')).toBe('/assets/properties/placeholder.svg');
  });

  it('returns external https URL as-is', () => {
    const externalUrl = 'https://d3ls91xgksobn.cloudfront.net/1200x,q90/etuovimedia/images/test.jpeg';
    expect(getPhotoUrl(externalUrl)).toBe(externalUrl);
  });

  it('returns external http URL as-is', () => {
    const externalUrl = 'http://example.com/image.jpg';
    expect(getPhotoUrl(externalUrl)).toBe(externalUrl);
  });

  it('prepends base URL for local path', () => {
    const localPath = 'uploads/properties/image.jpg';
    expect(getPhotoUrl(localPath)).toBe(`${VITE_BASE_URL}/${localPath}`);
  });

  it('handles local path without leading slash', () => {
    const localPath = 'uploads/properties/photo.png';
    expect(getPhotoUrl(localPath)).toBe(`${VITE_BASE_URL}/${localPath}`);
  });
});
