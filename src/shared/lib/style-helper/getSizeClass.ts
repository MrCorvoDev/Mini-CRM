import type {ExtendedSize, Size} from './Size';

export const getSizeClass = (
   styles: Record<string, string>,
   className: string,
   size: Size | ExtendedSize,
   defaultSize: Size | ExtendedSize = 'md',
) => ({
   [styles[`${className}_${size}`]]: size !== defaultSize,
});
