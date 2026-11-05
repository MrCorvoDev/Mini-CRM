'use client';

import {useRouter} from 'next/navigation';
import {useEffect} from 'react';
import {useSession} from '@/entities/session';
import {Spinner} from '@/shared/ui/Spinner';
import {Navbar} from '@/widgets/Navbar';

export default function ProtectedLayout({children}: React.PropsWithChildren) {
   const router = useRouter();
   const {session, initialized} = useSession();

   useEffect(() => {
      if (initialized && !session) {
         router.replace('/login');
      }
   }, [initialized, session, router]);

   if (!initialized) return <Spinner centered size="lg" />;
   if (!session) return null;

   return (
      <>
         <Navbar />
         {children}
      </>
   );
}
