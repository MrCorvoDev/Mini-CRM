import type {UnknownObject} from './UnknownObject';

export type TypeMap<
   TObject extends UnknownObject = UnknownObject,
   TArray extends unknown[] = unknown[],
   TFunction extends (...args: unknown[]) => unknown = (
      ...args: unknown[]
   ) => unknown,
> = {
   string: string;
   number: number;
   NaN: number;
   Infinity: number;
   NegativeInfinity: number;
   object: TObject;
   array: TArray;
   boolean: boolean;
   null: null;
   undefined: undefined;
   function: TFunction;
   BigInt: bigint;
   Symbol: symbol;
   Date: Date;
   RegExp: RegExp;
};

export type DataType = keyof TypeMap;

export type AnyTypeMap = {[K in DataType]: unknown};
