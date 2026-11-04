import {useDebounce} from '@uidotdev/usehooks';
import {useEffect, useState} from 'react';
import {useURLState} from './useURLState';

export const useDebouncedURLState = <T>(
   key: string,
   defaultValue: T,
   delay: number = 200,
) => {
   const [urlValue, setURLValue] = useURLState(key, defaultValue);
   const [value, setValue] = useState(urlValue);
   const debouncedValue = useDebounce(value, delay);

   useEffect(() => {
      if (debouncedValue === urlValue) return;

      setURLValue(debouncedValue);
   }, [urlValue, setURLValue, debouncedValue]);

   return [value, setValue, debouncedValue] as const;
};
