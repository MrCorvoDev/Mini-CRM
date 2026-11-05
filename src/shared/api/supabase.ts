import {createClient} from '@supabase/supabase-js';
import {env} from '@/shared/config/env';
import type {Database} from './database.types';

export const supabase = createClient<Database>(
   env.NEXT_PUBLIC_SUPABASE_URL,
   env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
   {
      auth: {
         persistSession: true,
         autoRefreshToken: true,
      },
   },
);
