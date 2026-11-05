'use client';

import clsx from 'clsx';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useCurrentProfile} from '@/entities/session';
import {supabase} from '@/shared/api';
import {Button} from '@/shared/ui/Button';
import styles from './Navbar.module.scss';

const ROLE_LABELS = {manager: 'Менеджер', executor: 'Исполнитель'};

export const Navbar = () => {
   const pathname = usePathname();
   const router = useRouter();
   const {profile, isManager} = useCurrentProfile();

   const handleLogout = async () => {
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
   };

   if (!profile) return null;

   return (
      <header className={styles.navbar}>
         <Link href="/sites" className={styles.brand}>
            МиниCRM
         </Link>

         <nav className={styles.nav}>
            <Link
               href="/sites"
               className={clsx(
                  styles.link,
                  pathname?.startsWith('/sites') && styles.link_active,
               )}
            >
               Объекты
            </Link>
            {!isManager && (
               <Link
                  href="/my-tasks"
                  className={clsx(
                     styles.link,
                     pathname === '/my-tasks' && styles.link_active,
                  )}
               >
                  Мои задачи
               </Link>
            )}
         </nav>

         <div className={styles.user}>
            <span className={styles['user-name']}>{profile.full_name}</span>
            <span className={styles['role-badge']}>
               {ROLE_LABELS[profile.role]}
            </span>
            <Button
               size="sm"
               variant="ghost"
               onClick={() => {
                  void handleLogout();
               }}
            >
               Выйти
            </Button>
         </div>
      </header>
   );
};
