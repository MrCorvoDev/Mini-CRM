import {redirect} from 'next/navigation';
import {connection} from 'next/server';
import {createServerSupabaseClient} from '@/shared/server-supabase';
import {Navbar} from '@/widgets/Navbar';

export const instant = false;

export default async function ProtectedLayout({
   children,
}: React.PropsWithChildren) {
   // The Supabase auth client reads the clock while loading the session, so
   // force request-time rendering instead of prerendering this layout.
   await connection();
   const supabase = await createServerSupabaseClient();
   const {
      data: {user},
   } = await supabase.auth.getUser();

   if (!user) {
      redirect('/login');
   }

   return (
      <>
         <Navbar />
         {children}
      </>
   );
}
