import type {TaskStatus} from '@/shared/api';

export const STATUS_LABELS: Record<TaskStatus, string> = {
   new: 'Новая',
   in_progress: 'В работе',
   on_review: 'На проверке',
   rework: 'На доработке',
   accepted: 'Принята',
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
   new: 'var(--light)',
   in_progress: 'var(--primary)',
   on_review: 'var(--warning)',
   rework: 'var(--error)',
   accepted: 'var(--success)',
};
