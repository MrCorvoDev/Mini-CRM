import clsx from 'clsx';
import styles from './Spinner.module.scss';

type SpinnerSize = 'sm' | 'md' | 'lg';

interface SpinnerProps {
   size?: SpinnerSize;
   centered?: boolean;
}

export const Spinner = ({size = 'md', centered = false}: SpinnerProps) => {
   const spinner = (
      <span className={clsx(styles.spinner, styles[`spinner_${size}`])} />
   );
   if (centered) return <div className={styles.center}>{spinner}</div>;
   return spinner;
};
