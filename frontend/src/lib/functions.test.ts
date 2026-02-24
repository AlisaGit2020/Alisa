import { getNumber, getPhotoUrl } from './functions';
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
