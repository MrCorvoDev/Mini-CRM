import * as v from 'valibot';

const envSchema = v.object({
   // NEXT_PUBLIC_API_URL: v.pipe(v.string(), v.url()),
   // DATABASE_URL: v.string(),
});

export const env = v.parse(envSchema, {
   // NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
   // DATABASE_URL: process.env.DATABASE_URL,
});
