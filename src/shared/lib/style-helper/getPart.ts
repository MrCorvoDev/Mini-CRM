import {isType} from '../type-helper';

export const getPart = (part: number, whole: number) => {
   const unsafeResult = part / whole;
   const result = isType(unsafeResult, 'number') ? unsafeResult : 0;

   return result;
};
