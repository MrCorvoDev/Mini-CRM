import type {DataType} from './TypeMap';

export const getType = (value: unknown): DataType => {
   switch (typeof value) {
      case 'string':
         return 'string';
      case 'number':
         if (Number.isNaN(value)) return 'NaN';
         if (value === Infinity) return 'Infinity';
         if (value === -Infinity) return 'NegativeInfinity';
         return 'number';
      case 'bigint':
         return 'BigInt';
      case 'symbol':
         return 'Symbol';
      case 'function':
         return 'function';
      case 'object':
         if (value === null) return 'null';
         if (Array.isArray(value)) return 'array';
         if (value instanceof Date) return 'Date';
         if (value instanceof RegExp) return 'RegExp';
         return 'object';
      case 'boolean':
         return 'boolean';
      default:
         return 'undefined';
   }
};
