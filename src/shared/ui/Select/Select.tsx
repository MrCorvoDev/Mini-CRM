import clsx from 'clsx';
import styles from '../Input/Input.module.scss';
import selectStyles from './Select.module.scss';

interface SelectOption {
   value: string;
   label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
   label?: string;
   error?: string;
   options: SelectOption[];
   placeholder?: string;
}

export const Select = ({
   label,
   error,
   options,
   placeholder,
   className,
   id,
   ...props
}: SelectProps) => {
   const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
   return (
      <div className={styles.field}>
         {label && (
            <label htmlFor={inputId} className={styles.label}>
               {label}
            </label>
         )}
         <select
            id={inputId}
            className={clsx(selectStyles.select, className)}
            {...props}
         >
            {placeholder && (
               <option value="" disabled>
                  {placeholder}
               </option>
            )}
            {options.map(opt => (
               <option key={opt.value} value={opt.value}>
                  {opt.label}
               </option>
            ))}
         </select>
         {error && <span className={styles['error-message']}>{error}</span>}
      </div>
   );
};
