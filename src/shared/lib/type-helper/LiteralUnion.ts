export type LiteralUnion<T extends string | number> =
   | T
   | (T extends string ? string & {} : number & {});
