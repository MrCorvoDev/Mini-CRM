import clsx from 'clsx';
import styles from './Input.module.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
   label?: string;
   error?: string;
}

export const Input = ({label, error, className, id, ...props}: InputProps) => {
   const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
   return (
      <div className={styles.field}>
         {label && (
            <label htmlFor={inputId} className={styles.label}>
               {label}
            </label>
         )}
         <input
            id={inputId}
            className={clsx(
               styles.input,
               error && styles.input_error,
               className,
            )}
            {...props}
         />
         {error && <span className={styles['error-message']}>{error}</span>}
      </div>
   );
};

interface TextareaProps
   extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
   label?: string;
   error?: string;
}

export const Textarea = ({
   label,
   error,
   className,
   id,
   ...props
}: TextareaProps) => {
   const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
   return (
      <div className={styles.field}>
         {label && (
            <label htmlFor={inputId} className={styles.label}>
               {label}
            </label>
         )}
         <textarea
            id={inputId}
            className={clsx(
               styles.input,
               error && styles.input_error,
               className,
            )}
            style={{minHeight: '5em', resize: 'vertical'}}
            {...props}
         />
         {error && <span className={styles['error-message']}>{error}</span>}
      </div>
   );
};
