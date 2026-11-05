'use client';

import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {supabase} from '@/shared/api';
import {Button} from '@/shared/ui/Button';
import {Input} from '@/shared/ui/Input';
import styles from './LoginForm.module.scss';

export const LoginForm = () => {
   const router = useRouter();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);

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
      } else {
         router.push('/sites');
         router.refresh();
      }

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
               value={email}
               onChange={e => setEmail(e.target.value)}
               placeholder="manager@example.com"
               required
               autoComplete="email"
            />
            <Input
               label="Пароль"
               type="password"
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
