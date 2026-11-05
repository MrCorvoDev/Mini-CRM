import clsx from 'clsx';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
   variant?: Variant;
   size?: Size;
   fullWidth?: boolean;
   loading?: boolean;
}

export const Button = ({
   variant = 'primary',
   size = 'md',
   fullWidth = false,
   loading = false,
   disabled,
   children,
   className,
   ...props
}: ButtonProps) => {
   return (
      <button
         className={clsx(
            styles.button,
            styles[`button_variant_${variant}`],
            size !== 'md' && styles[`button_size_${size}`],
            fullWidth && styles['button_full-width'],
            className,
         )}
         disabled={disabled || loading}
         {...props}
      >
         {loading ? '...' : children}
      </button>
   );
};
