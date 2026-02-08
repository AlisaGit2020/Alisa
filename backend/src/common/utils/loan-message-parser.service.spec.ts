import {
  parseLoanPaymentMessage,
  isLoanPaymentMessage,
} from './loan-message-parser';

describe('loan-message-parser', () => {
  describe('parseLoanPaymentMessage', () => {
    it('should parse a complete loan payment message with all components', () => {
      const message =
        'Lyhennys 244,25 euroa Korko 166,37 euroa Kulut 2,50 euroa OP-bonuksista Jäljellä 65 851,63 euroa';

      const result = parseLoanPaymentMessage(message);

      expect(result).not.toBeNull();
      expect(result.principal).toBe(244.25);
      expect(result.interest).toBe(166.37);
      expect(result.handlingFee).toBe(2.5);
      expect(result.remaining).toBe(65851.63);
    });

    it('should parse a loan payment message without handling fee', () => {
      const message =
        'Lyhennys 500,00 euroa Korko 100,00 euroa Jäljellä 50 000,00 euroa';

      const result = parseLoanPaymentMessage(message);

      expect(result).not.toBeNull();
      expect(result.principal).toBe(500.0);
      expect(result.interest).toBe(100.0);
      expect(result.handlingFee).toBe(0);
      expect(result.remaining).toBe(50000.0);
    });

    it('should parse amounts with large numbers and thousands separators', () => {
      const message =
        'Lyhennys 1 234,56 euroa Korko 789,01 euroa Jäljellä 123 456,78 euroa';

      const result = parseLoanPaymentMessage(message);

      expect(result).not.toBeNull();
      expect(result.principal).toBe(1234.56);
      expect(result.interest).toBe(789.01);
      expect(result.remaining).toBe(123456.78);
    });

    it('should return null for non-loan payment messages', () => {
      const messages = [
        'Regular bank transfer',
        'Grocery shopping 50,00 euroa',
        'Lyhennys 100,00 euroa', // Missing other required fields
        'Korko 50,00 euroa Jäljellä 1000,00 euroa', // Missing principal
        '',
        null as unknown as string,
        undefined as unknown as string,
      ];

      messages.forEach((message) => {
        expect(parseLoanPaymentMessage(message)).toBeNull();
      });
    });

    it('should be case-insensitive', () => {
      const message =
        'LYHENNYS 244,25 EUROA KORKO 166,37 EUROA JÄLJELLÄ 65 851,63 EUROA';

      const result = parseLoanPaymentMessage(message);

      expect(result).not.toBeNull();
      expect(result.principal).toBe(244.25);
      expect(result.interest).toBe(166.37);
    });

    it('should handle message with extra text between components', () => {
      const message =
        'Lyhennys 244,25 euroa ja Korko 166,37 euroa maksettiin. Kulut 2,50 euroa veloitettu OP-bonuksista. Jäljellä 65 851,63 euroa.';

      const result = parseLoanPaymentMessage(message);

      expect(result).not.toBeNull();
      expect(result.principal).toBe(244.25);
      expect(result.interest).toBe(166.37);
      expect(result.handlingFee).toBe(2.5);
      expect(result.remaining).toBe(65851.63);
    });
  });

  describe('isLoanPaymentMessage', () => {
    it('should return true for valid loan payment messages', () => {
      const validMessage =
        'Lyhennys 244,25 euroa Korko 166,37 euroa Jäljellä 65 851,63 euroa';

      expect(isLoanPaymentMessage(validMessage)).toBe(true);
    });

    it('should return false for non-loan payment messages', () => {
      expect(isLoanPaymentMessage('Regular transaction')).toBe(false);
      expect(isLoanPaymentMessage('')).toBe(false);
    });
  });
});
