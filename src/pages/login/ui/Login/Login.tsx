'use client';

import {LoginForm} from '../LoginForm/LoginForm';
import styles from './Login.module.scss';

export const Login = () => {
   return (
      <div className={styles.page}>
         <LoginForm />
      </div>
   );
};
