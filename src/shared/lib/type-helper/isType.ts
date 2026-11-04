import {getType} from './getType';
import type {AnyTypeMap, TypeMap} from './TypeMap';

export const isType = <
   TMap extends AnyTypeMap = TypeMap,
   T extends keyof TMap = keyof TMap,
>(
   value: unknown,
   type: T,
): value is TMap[T] => getType(value) === type;
