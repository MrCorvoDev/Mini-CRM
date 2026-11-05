'use client';

import {useQueryClient} from '@tanstack/react-query';
import {useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {verifyServerSession} from '@/entities/session';
import {supabase} from '@/shared/api';
import {Button} from '@/shared/ui/Button';
import {Input} from '@/shared/ui/Input';
import styles from './LoginForm.module.scss';

export const LoginForm = () => {
   const router = useRouter();
   const queryClient = useQueryClient();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);

   // Reset form and prevent restoring stale inputs from bfcache
   useEffect(() => {
      const handlePageShow = (e: PageTransitionEvent) => {
         if (e.persisted) {
            setEmail('');
            setPassword('');
            setError('');
         }
      };
      window.addEventListener('pageshow', handlePageShow);
      return () => window.removeEventListener('pageshow', handlePageShow);
   }, []);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      const {error: authError} = await supabase.auth.signInWithPassword({
         email,
         password,
      });

      if (authError) {
         setError('Неверный email или пароль');
         setLoading(false);
         return;
      }

      // Clear any prior client query cache
      queryClient.clear();

      // Ensure server session is established and cookies are readable
      const serverCheck = await verifyServerSession();
      let authenticated = serverCheck.authenticated;

      if (!authenticated) {
         await new Promise<void>(resolve => setTimeout(resolve, 150));
         const retry = await verifyServerSession();
         authenticated = retry.authenticated;
      }

      if (!authenticated) {
         setError('Не удалось подтвердить сессию. Попробуйте войти ещё раз.');
         setLoading(false);
         return;
      }

      // Reset form fields
      setEmail('');
      setPassword('');

      router.push('/sites');
      router.refresh();
      setLoading(false);
   };

   return (
      <form
         className={styles.form}
         onSubmit={e => {
            void handleSubmit(e);
         }}
      >
         <h1 className={styles.title}>Мини-CRM</h1>
         <p className={styles.subtitle}>
            Система управления объектами и задачами
         </p>

         <div className={styles.fields}>
            <Input
               label="Email"
               type="email"
               name="email"
               value={email}
               onChange={e => setEmail(e.target.value)}
               placeholder="manager@example.com"
               required
               autoComplete="username"
            />
            <Input
               label="Пароль"
               type="password"
               name="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               placeholder="••••••••"
               required
               autoComplete="current-password"
            />
         </div>

         {error && <p className={styles.error}>{error}</p>}

         <Button type="submit" fullWidth loading={loading}>
            Войти
         </Button>
      </form>
   );
};
