import { sanitizeCsvField } from './csv-sanitizer';

describe('sanitizeCsvField', () => {
  describe('formula injection prevention', () => {
    it('should prefix = with single quote', () => {
      expect(sanitizeCsvField('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    });

    it('should prefix + with single quote', () => {
      expect(sanitizeCsvField('+1234567890')).toBe("'+1234567890");
    });

    it('should prefix - with single quote', () => {
      expect(sanitizeCsvField('-100')).toBe("'-100");
    });

    it('should prefix @ with single quote', () => {
      expect(sanitizeCsvField('@SUM(A1)')).toBe("'@SUM(A1)");
    });

    it('should prefix tab character with single quote', () => {
      expect(sanitizeCsvField('\tmalicious')).toBe("'\tmalicious");
    });

    it('should prefix carriage return with single quote', () => {
      expect(sanitizeCsvField('\rmalicious')).toBe("'\rmalicious");
    });

    it('should handle HYPERLINK formula', () => {
      expect(sanitizeCsvField('=HYPERLINK("http://evil.com")')).toBe(
        "'=HYPERLINK(\"http://evil.com\")",
      );
    });

    it('should handle CMD formula', () => {
      expect(sanitizeCsvField('=CMD|calc')).toBe("'=CMD|calc");
    });
  });

  describe('safe values', () => {
    it('should not modify normal text', () => {
      expect(sanitizeCsvField('Normal text value')).toBe('Normal text value');
    });

    it('should not modify text with formula characters in middle', () => {
      expect(sanitizeCsvField('Test = Value')).toBe('Test = Value');
    });

    it('should not modify numbers as strings', () => {
      expect(sanitizeCsvField('12345')).toBe('12345');
    });

    it('should not modify email addresses', () => {
      expect(sanitizeCsvField('user@example.com')).toBe('user@example.com');
    });

    it('should not double-prefix already sanitized values', () => {
      // If value starts with single quote, it's already safe
      expect(sanitizeCsvField("'=already sanitized")).toBe(
        "'=already sanitized",
      );
    });
  });

  describe('null and undefined handling', () => {
    it('should return empty string for null', () => {
      expect(sanitizeCsvField(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(sanitizeCsvField(undefined)).toBe('');
    });

    it('should handle empty string', () => {
      expect(sanitizeCsvField('')).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle string with only formula character', () => {
      expect(sanitizeCsvField('=')).toBe("'=");
    });

    it('should handle Finnish bank transaction descriptions', () => {
      expect(sanitizeCsvField('Viesti: Vuokra 01/2024')).toBe(
        'Viesti: Vuokra 01/2024',
      );
    });

    it('should handle negative amounts in descriptions', () => {
      // Negative numbers starting with - should be sanitized
      expect(sanitizeCsvField('-500.00')).toBe("'-500.00");
    });

    it('should handle whitespace-only values', () => {
      expect(sanitizeCsvField('   ')).toBe('   ');
    });
  });
});
