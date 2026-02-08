import { isObject } from 'class-validator';
import {
  Between,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
} from 'typeorm';

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
        where[key] = betweenTransformation(value);
      } else if ('$ilike' in value) {
        where[key] = ilikeTransformation(value);
      } else if ('$in' in value) {
        where[key] = inTransformation(value);
      } else if ('$gte' in value) {
        where[key] = gteTransformation(value);
      } else if ('$lte' in value) {
        where[key] = lteTransformation(value);
      } else {
        where[key] = typeormWhereTransformer(where[key]); //Send back to meat machine :)
      }
    }
  }
  return where;
};

const betweenTransformation = (value: Record<string, unknown>) => {
  const between = value.$between as [string, string];
  return Between(new Date(between[0]), new Date(between[1]));
};

const ilikeTransformation = (value: Record<string, unknown>) => {
  return ILike(value.$ilike as string);
};

const inTransformation = (value: Record<string, unknown>) => {
  return In(value.$in as unknown[]);
};

const gteTransformation = (value: Record<string, unknown>) => {
  return MoreThanOrEqual(new Date(value.$gte as string));
};

const lteTransformation = (value: Record<string, unknown>) => {
  return LessThanOrEqual(new Date(value.$lte as string));
};
