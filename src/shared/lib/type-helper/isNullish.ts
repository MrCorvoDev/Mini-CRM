import {isType} from './isType';

export const isNullish = (value: unknown) =>
   isType(value, 'null') || isType(value, 'undefined');
