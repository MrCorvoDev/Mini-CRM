'use client';

import {useEffect} from 'react';
import styles from './Dialog.module.scss';

interface DialogProps {
   open: boolean;
   onClose: () => void;
   title: string;
   children: React.ReactNode;
   footer?: React.ReactNode;
}

export const Dialog = ({
   open,
   onClose,
   title,
   children,
   footer,
}: DialogProps) => {
   useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
   }, [open, onClose]);

   if (!open) return null;

   return (
      <div className={styles.overlay}>
         <button
            type="button"
            className={styles.backdrop}
            tabIndex={-1}
            aria-label="Закрыть модальное окно"
            onClick={onClose}
         />
         <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
         >
            <div className={styles.header}>
               <h2 id="dialog-title" className={styles.title}>
                  {title}
               </h2>
               <button
                  type="button"
                  className={styles.close}
                  onClick={onClose}
                  aria-label="Закрыть"
               >
                  ✕
               </button>
            </div>
            <div className={styles.body}>{children}</div>
            {footer && <div className={styles.footer}>{footer}</div>}
         </div>
      </div>
   );
};
