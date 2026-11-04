import {isType, type Undefinable} from '../type-helper';

export const getByPath = <O>(obj: O, path: string) => {
   return path.split('.').reduce<unknown>((acc, key) => {
      if (isType(acc, 'object') && key in acc) return acc[key];
      return undefined;
   }, obj) as Undefinable<O[keyof O]>;
};
