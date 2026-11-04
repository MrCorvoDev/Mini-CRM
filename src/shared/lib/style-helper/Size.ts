import type {Prettify} from '../type-helper';

export type Size = 'sm' | 'md' | 'lg';
export type ExtendedSize = Prettify<Size | 'xl'>;
