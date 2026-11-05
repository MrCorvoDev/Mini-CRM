import * as v from 'valibot';

const envSchema = v.object({
   NEXT_PUBLIC_SUPABASE_URL: v.pipe(v.string(), v.url()),
   NEXT_PUBLIC_SUPABASE_ANON_KEY: v.string(),
});

export const env = v.parse(envSchema, {
   NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
   NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
