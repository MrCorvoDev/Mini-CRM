import {typography} from '@/shared/config';
import {getPart} from './getPart';

export const em = (size: number, defaultSize = typography.sizes.pc) => {
   const result = getPart(size, defaultSize);

   return `${result}em`;
};
