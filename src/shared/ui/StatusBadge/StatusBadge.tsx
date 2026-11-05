import type {TaskStatus} from '@/shared/api';
import {STATUS_COLORS, STATUS_LABELS} from '@/shared/config';
import styles from './StatusBadge.module.scss';

interface StatusBadgeProps {
   status: TaskStatus;
}

export const StatusBadge = ({status}: StatusBadgeProps) => {
   return (
      <span
         className={styles.badge}
         style={{
            background: `${STATUS_COLORS[status]}22`,
            color: STATUS_COLORS[status],
            border: `1px solid ${STATUS_COLORS[status]}55`,
         }}
      >
         {STATUS_LABELS[status]}
      </span>
   );
};
