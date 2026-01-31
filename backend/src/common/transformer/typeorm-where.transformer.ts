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

const betweenTransformation = (value: any) => {
  return Between(new Date(value.$between[0]), new Date(value.$between[1]));
};

const ilikeTransformation = (value: any) => {
  return ILike(value.$ilike);
};

const inTransformation = (value: any) => {
  return In(value.$in);
};

const gteTransformation = (value: any) => {
  return MoreThanOrEqual(new Date(value.$gte));
};

const lteTransformation = (value: any) => {
  return LessThanOrEqual(new Date(value.$lte));
};
