import {type CSSMultiValue, em} from '@/shared/lib/style-helper';
import {isType, type Undefinable} from '@/shared/lib/type-helper';

export const getCSSValue = <T extends keyof React.CSSProperties>(
   value: Undefinable<CSSMultiValue<T>>,
) => {
   if (isType(value, 'undefined')) return undefined;

   const parseValue = (num: number | string) =>
      isType(num, 'number') ? em(num) : num;
   const parseSpaced = (val: (number | string)[]) =>
      val.map(parseValue).join(' ');

   return isType(value, 'array') ? parseSpaced(value) : parseValue(value);
};
