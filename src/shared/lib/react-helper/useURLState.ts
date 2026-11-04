import {useRouter, useSearchParams} from 'next/navigation';
import {
   type DataType,
   getType,
   isType,
   stringTypeConvert,
} from '@/shared/lib/type-helper';

type setStateFunction<T> = (value: T) => T;

const stringifyValue = <T>(type: DataType, value: T) =>
   type === 'object' ? JSON.stringify(value) : String(value);

export const useURLState = <T>(
   key: string,
   defaultValue: T,
   replace = true,
): [T, (value: T | setStateFunction<T>) => void] => {
   const router = useRouter();
   const searchParams = useSearchParams();
   const type = getType(defaultValue);

   const param = searchParams?.get(key);
   const urlValue = param
      ? (stringTypeConvert(type, param) as T)
      : defaultValue;

   const setValue = (value: T | setStateFunction<T>) => {
      const newValue = isType(value, 'function') ? value(urlValue) : value;
      const params = new URLSearchParams(searchParams?.toString());
      if (newValue === defaultValue || newValue === '') params.delete(key);
      else params.set(key, stringifyValue(type, newValue));

      const url = `${window.location.pathname}?${params.toString()}`;
      if (replace) router.replace(url);
      else router.push(url);
   };

   return [urlValue, setValue] as const;
};
