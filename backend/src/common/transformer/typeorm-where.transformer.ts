import { isObject } from 'class-validator';
import {
  Between,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';
import {
  normalizeFilterStartDate,
  normalizeFilterEndDate,
} from '@alisa-backend/common/utils/date-normalizer';

// Fields that should have date normalization applied
const DATE_FIELDS = [
  'accountingDate',
  'transactionDate',
  'date',
  'startDate',
  'endDate',
];

export const typeormWhereTransformer = (where: object | []) => {
  if (Array.isArray(where)) {
    for (const index in where) {
      where[index] = typeormWhereTransformer(where[index]);
    }
  }
  for (const key in where) {
    const value = where[key];
    if (isObject(value)) {
      if ('$between' in value) {
        where[key] = betweenTransformation(value, key);
      } else if ('$ilike' in value) {
        where[key] = ilikeTransformation(value);
      } else if ('$in' in value) {
        where[key] = inTransformation(value);
      } else if ('$gte' in value) {
        where[key] = gteTransformation(value, key);
      } else if ('$lte' in value) {
        where[key] = lteTransformation(value, key);
      } else {
        where[key] = typeormWhereTransformer(where[key]); //Send back to meat machine :)
      }
    }
  }
  return where;
};

const isDateField = (fieldName: string): boolean => {
  return DATE_FIELDS.includes(fieldName);
};

const betweenTransformation = (
  value: Record<string, unknown>,
  fieldName: string,
) => {
  const between = value.$between as [string, string];
  if (isDateField(fieldName)) {
    return Between(
      normalizeFilterStartDate(between[0]),
      normalizeFilterEndDate(between[1]),
    );
  }
  return Between(new Date(between[0]), new Date(between[1]));
};

const ilikeTransformation = (value: Record<string, unknown>) => {
  return ILike(value.$ilike as string);
};

const inTransformation = (value: Record<string, unknown>) => {
  return In(value.$in as unknown[]);
};

const gteTransformation = (
  value: Record<string, unknown>,
  fieldName: string,
) => {
  if (isDateField(fieldName)) {
    return MoreThanOrEqual(normalizeFilterStartDate(value.$gte as string));
  }
  return MoreThanOrEqual(new Date(value.$gte as string));
};

const lteTransformation = (
  value: Record<string, unknown>,
  fieldName: string,
) => {
  if (isDateField(fieldName)) {
    return LessThanOrEqual(normalizeFilterEndDate(value.$lte as string));
  }
  return LessThanOrEqual(new Date(value.$lte as string));
};
