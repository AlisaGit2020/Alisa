import { isObject } from 'class-validator';
import { Between, ILike } from 'typeorm';

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
