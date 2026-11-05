'use server';

import {createServerSupabaseClient} from '@/shared/server-supabase';

export async function verifyServerSession() {
   const supabase = await createServerSupabaseClient();
   const {
      data: {user},
      error,
   } = await supabase.auth.getUser();

   if (error || !user) {
      return {authenticated: false};
   }

   return {authenticated: true, userId: user.id};
}
