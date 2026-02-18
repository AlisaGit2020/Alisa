import { isObject } from 'class-validator';
import { typeormWhereTransformer } from './typeorm-where.transformer';

describe('Typeorm where transformer', () => {
  it('transforms $between date filter with start at midnight and end at end of day', () => {
    const sourceWhere = {
      transactionDate: { $between: ['2024-01-01', '2024-01-31'] },
    };

    const where = typeormWhereTransformer(sourceWhere);
    if ('transactionDate' in where) {
      const expectedDate = {
        _value: [
          new Date('2024-01-01T00:00:00.000Z'),
          new Date('2024-01-31T23:59:59.999Z'),
        ],
      };
      expect(where.transactionDate).toMatchObject(expectedDate);
    } else {
      fail('transactionDate field not found');
    }
  });

  it('transforms array where correctly with date normalization', () => {
    const sourceWhere = [
      {
        transactionDate: { $between: ['2024-01-01', '2024-01-31'] },
      },
      {
        accountingDate: { $between: ['2024-02-01', '2024-02-28'] },
      },
    ];

    const where = typeormWhereTransformer(sourceWhere);
    if (Array.isArray(where) && where.length === 2) {
      const expectedDate = {
        _value: [
          new Date('2024-01-01T00:00:00.000Z'),
          new Date('2024-01-31T23:59:59.999Z'),
        ],
      };
      const expectedDate2 = {
        _value: [
          new Date('2024-02-01T00:00:00.000Z'),
          new Date('2024-02-28T23:59:59.999Z'),
        ],
      };
      expect(where[0].transactionDate).toMatchObject(expectedDate);
      expect(where[1].accountingDate).toMatchObject(expectedDate2);
    } else {
      fail('where is not array with length 2');
    }
  });

  it('transforms nested where correctly with date normalization', () => {
    const sourceWhere = {
      property1: {
        transactionDate: { $between: ['2024-01-01', '2024-01-31'] },
      },
    };

    const where = typeormWhereTransformer(sourceWhere);
    if ('property1' in where) {
      if (isObject(where.property1) && 'transactionDate' in where.property1) {
        const expectedDate = {
          _value: [
            new Date('2024-01-01T00:00:00.000Z'),
            new Date('2024-01-31T23:59:59.999Z'),
          ],
        };
        expect(where.property1.transactionDate).toMatchObject(expectedDate);
      } else {
        fail('transactionDate field not found');
      }
    } else {
      fail('property1 field not found');
    }
  });

  it('transforms $ilike correctly', () => {
    const sourceWhere = {
      sender: { $ilike: '%test%' },
    };

    const where = typeormWhereTransformer(sourceWhere);
    if ('sender' in where) {
      expect(where.sender).toMatchObject({ _value: '%test%' });
    } else {
      fail('sender field not found');
    }
  });

  it('transforms $ilike in array correctly', () => {
    const sourceWhere = [
      { sender: { $ilike: '%john%' } },
      { receiver: { $ilike: '%doe%' } },
    ];

    const where = typeormWhereTransformer(sourceWhere);
    if (Array.isArray(where) && where.length === 2) {
      expect(where[0].sender).toMatchObject({ _value: '%john%' });
      expect(where[1].receiver).toMatchObject({ _value: '%doe%' });
    } else {
      fail('where is not array with length 2');
    }
  });

  describe('Date normalization for timezone handling', () => {
    it('normalizes timezone-shifted dates in $between (UTC+2 winter)', () => {
      // User in UTC+2 selects Jan 1, 2025 -> becomes 2024-12-31T22:00:00Z
      const sourceWhere = {
        accountingDate: {
          $between: ['2024-12-31T22:00:00.000Z', '2024-12-31T22:00:00.000Z'],
        },
      };

      const where = typeormWhereTransformer(sourceWhere);
      if ('accountingDate' in where) {
        // Should normalize to Jan 1, 2025 00:00:00 - 23:59:59.999
        const expectedDate = {
          _value: [
            new Date('2025-01-01T00:00:00.000Z'),
            new Date('2025-01-01T23:59:59.999Z'),
          ],
        };
        expect(where.accountingDate).toMatchObject(expectedDate);
      } else {
        fail('accountingDate field not found');
      }
    });

    it('normalizes timezone-shifted dates in $between (UTC+3 summer)', () => {
      // User in UTC+3 selects June 15, 2025 -> becomes 2025-06-14T21:00:00Z
      const sourceWhere = {
        transactionDate: {
          $between: ['2025-06-14T21:00:00.000Z', '2025-06-14T21:00:00.000Z'],
        },
      };

      const where = typeormWhereTransformer(sourceWhere);
      if ('transactionDate' in where) {
        // Should normalize to June 15, 2025 00:00:00 - 23:59:59.999
        const expectedDate = {
          _value: [
            new Date('2025-06-15T00:00:00.000Z'),
            new Date('2025-06-15T23:59:59.999Z'),
          ],
        };
        expect(where.transactionDate).toMatchObject(expectedDate);
      } else {
        fail('transactionDate field not found');
      }
    });

    it('transforms $gte with date normalization', () => {
      const sourceWhere = {
        accountingDate: { $gte: '2024-12-31T22:00:00.000Z' },
      };

      const where = typeormWhereTransformer(sourceWhere);
      if ('accountingDate' in where) {
        // Should normalize to Jan 1, 2025 00:00:00
        expect(where.accountingDate).toMatchObject({
          _value: new Date('2025-01-01T00:00:00.000Z'),
        });
      } else {
        fail('accountingDate field not found');
      }
    });

    it('transforms $lte with date normalization to end of day', () => {
      const sourceWhere = {
        transactionDate: { $lte: '2024-12-31T22:00:00.000Z' },
      };

      const where = typeormWhereTransformer(sourceWhere);
      if ('transactionDate' in where) {
        // Should normalize to Jan 1, 2025 23:59:59.999
        expect(where.transactionDate).toMatchObject({
          _value: new Date('2025-01-01T23:59:59.999Z'),
        });
      } else {
        fail('transactionDate field not found');
      }
    });

    it('does not normalize non-date fields', () => {
      const sourceWhere = {
        amount: { $between: [100, 500] },
      };

      const where = typeormWhereTransformer(sourceWhere);
      if ('amount' in where) {
        // Should keep original values without normalization
        const expectedValue = {
          _value: [new Date(100), new Date(500)],
        };
        expect(where.amount).toMatchObject(expectedValue);
      } else {
        fail('amount field not found');
      }
    });

    it('does not roll over dates before 21:00 UTC', () => {
      const sourceWhere = {
        accountingDate: { $between: ['2024-12-31T20:59:00.000Z', '2024-12-31T20:59:00.000Z'] },
      };

      const where = typeormWhereTransformer(sourceWhere);
      if ('accountingDate' in where) {
        // Should stay on Dec 31, 2024 (no rollover)
        const expectedDate = {
          _value: [
            new Date('2024-12-31T00:00:00.000Z'),
            new Date('2024-12-31T23:59:59.999Z'),
          ],
        };
        expect(where.accountingDate).toMatchObject(expectedDate);
      } else {
        fail('accountingDate field not found');
      }
    });
  });
});
