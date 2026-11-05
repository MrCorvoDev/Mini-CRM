import clsx from 'clsx';
import type {TaskStatus} from '@/shared/api';
import {STATUS_LABELS} from '@/shared/config';
import styles from './StatusBadge.module.scss';

interface StatusBadgeProps {
   status: TaskStatus;
   className?: string;
}

export const StatusBadge = ({status, className}: StatusBadgeProps) => {
   return (
      <span
         className={clsx(styles.badge, styles[`badge_${status}`], className)}
      >
         {STATUS_LABELS[status] ?? status}
      </span>
   );
};
