declare const __brand__: unique symbol;
export type Brand<T, B extends string> = T & {[__brand__]: B};
