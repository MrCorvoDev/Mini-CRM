export type CSSValue<K extends keyof React.CSSProperties> =
   React.CSSProperties[K];

export type CSSMultiValue<K extends keyof React.CSSProperties> =
   | CSSValue<K>
   | Array<NonNullable<CSSValue<K>>>;
