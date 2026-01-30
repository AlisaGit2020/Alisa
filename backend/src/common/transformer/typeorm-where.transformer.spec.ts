import { isObject } from 'class-validator';
import { typeormWhereTransformer } from './typeorm-where.transformer';

describe('Typeorm where transformer', () => {
  it('transforms where correctly', () => {
    const sourceWhere = {
      transactionDate: { $between: ['2024-01-01', '2024-01-31'] },
    };

    const where = typeormWhereTransformer(sourceWhere);
    if ('transactionDate' in where) {
      const expectedDate = {
        _value: [
          new Date('2024-01-01T00:00:00.000Z'),
          new Date('2024-01-31T00:00:00.000Z'),
        ],
      };
      expect(where.transactionDate).toMatchObject(expectedDate);
    } else {
      fail('transactionDate field not found');
    }
  });

  it('transforms array where correctly', () => {
    const sourceWhere = [
      {
        transactionDate: { $between: ['2024-01-01', '2024-01-31'] },
      },
      {
        someOtherDate: { $between: ['2024-02-01', '2024-02-28'] },
      },
    ];

    const where = typeormWhereTransformer(sourceWhere);
    if (Array.isArray(where) && where.length === 2) {
      const expectedDate = {
        _value: [
          new Date('2024-01-01T00:00:00.000Z'),
          new Date('2024-01-31T00:00:00.000Z'),
        ],
      };
      const expectedDate2 = {
        _value: [
          new Date('2024-02-01T00:00:00.000Z'),
          new Date('2024-02-28T00:00:00.000Z'),
        ],
      };
      expect(where[0].transactionDate).toMatchObject(expectedDate);
      expect(where[1].someOtherDate).toMatchObject(expectedDate2);
    } else {
      fail('where is not array with length 2');
    }
  });

  it('transforms nested where correctly', () => {
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
            new Date('2024-01-31T00:00:00.000Z'),
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
});
