import type {AnyTypeMap, TypeMap} from './TypeMap';

// Can convert any type except: function, symbol, regex
export const stringTypeConvert = <
   TMap extends AnyTypeMap = TypeMap,
   T extends keyof TMap = keyof TMap,
>(
   type: T,
   value: string,
): TMap[T] => {
   switch (type) {
      case 'string':
         return value as TMap[T];
      case 'number':
         return Number(value) as TMap[T];
      case 'NaN':
         return NaN as TMap[T];
      case 'Infinity':
         return Infinity as TMap[T];
      case 'NegativeInfinity':
         return -Infinity as TMap[T];
      case 'object':
         return JSON.parse(value) as TMap[T];
      case 'array':
         return value.split(',') as TMap[T];
      case 'boolean':
         return (value === 'true') as TMap[T];
      case 'null':
         return null as TMap[T];
      case 'BigInt':
         return BigInt(value) as TMap[T];
      case 'Date':
         return new Date(value) as TMap[T];
      default:
         return undefined as TMap[T];
   }
};
