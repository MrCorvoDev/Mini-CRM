import {typography} from '@/shared/config';
import {getPart} from './getPart';

export const rem = (size: number) => {
   const result = getPart(size, typography.sizes.default);

   return `${result}rem`;
};
