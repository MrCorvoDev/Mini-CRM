'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {useCurrentProfile} from '@/entities/session';
import {
   useChangeTaskStatus,
   useDeleteTask,
   useTask,
   useTaskHistory,
} from '@/entities/task';
import type {TaskStatus} from '@/shared/api';
import {STATUS_LABELS} from '@/shared/config';
import {Button} from '@/shared/ui/Button';
import {Dialog} from '@/shared/ui/Dialog';
import {Textarea} from '@/shared/ui/Input';
import {Spinner} from '@/shared/ui/Spinner';
import {StatusBadge} from '@/shared/ui/StatusBadge';
import 'dayjs/locale/ru';
import styles from './TaskDetail.module.scss';

dayjs.locale('ru');

interface Props {
   taskId: string;
}

// What transitions are allowed, based on role + current status
function getAllowedActions(
   status: TaskStatus,
   isManager: boolean,
   isAssignee: boolean,
): Array<{
   label: string;
   toStatus: TaskStatus;
   requiresComment: boolean;
   variant: 'primary' | 'secondary' | 'danger';
}> {
   const actions: Array<{
      label: string;
      toStatus: TaskStatus;
      requiresComment: boolean;
      variant: 'primary' | 'secondary' | 'danger';
   }> = [];

   if (isAssignee) {
      if (status === 'new')
         actions.push({
            label: 'Взять в работу',
            toStatus: 'in_progress',
            requiresComment: false,
            variant: 'primary',
         });
      if (status === 'in_progress')
         actions.push({
            label: 'На проверку',
            toStatus: 'on_review',
            requiresComment: false,
            variant: 'primary',
         });
      if (status === 'rework')
         actions.push({
            label: 'Взять в работу',
            toStatus: 'in_progress',
            requiresComment: false,
            variant: 'primary',
         });
   }

   if (isManager) {
      if (status === 'on_review') {
         actions.push({
            label: 'Принять',
            toStatus: 'accepted',
            requiresComment: false,
            variant: 'primary',
         });
         actions.push({
            label: 'На доработку',
            toStatus: 'rework',
            requiresComment: true,
            variant: 'danger',
         });
      }
   }

   return actions;
}

export const TaskDetail = ({taskId}: Props) => {
   const router = useRouter();
   const {profile, isManager} = useCurrentProfile();
   const {data: task, isLoading, error} = useTask(taskId);
   const {data: history} = useTaskHistory(taskId);
   const changeStatus = useChangeTaskStatus();
   const deleteTask = useDeleteTask();

   const [commentOpen, setCommentOpen] = useState(false);
   const [pendingStatus, setPendingStatus] = useState<TaskStatus | null>(null);
   const [comment, setComment] = useState('');
   const [commentError, setCommentError] = useState('');
   const [mutationError, setMutationError] = useState('');

   if (isLoading) return <Spinner centered size="lg" />;
   if (error || !task)
      return (
         <p className={styles.error}>Задача не найдена или доступ запрещён</p>
      );

   const isAssignee = profile?.id === task.assignee_id;
   const actions = getAllowedActions(task.status, isManager, isAssignee);

   const handleAction = (toStatus: TaskStatus, requiresComment: boolean) => {
      setMutationError('');
      if (requiresComment) {
         setComment('');
         setCommentError('');
         setPendingStatus(toStatus);
         setCommentOpen(true);
      } else {
         void performChange(toStatus, '');
      }
   };

   const performChange = async (toStatus: TaskStatus, cmt: string) => {
      try {
         await changeStatus.mutateAsync({taskId, toStatus, comment: cmt});
         setCommentOpen(false);
      } catch (err) {
         const msg =
            err instanceof Error ? err.message : 'Ошибка изменения статуса';
         setMutationError(msg);
      }
   };

   const handleCommentSubmit = () => {
      if (!comment.trim()) {
         setCommentError('Комментарий обязателен');
         return;
      }
      if (!pendingStatus) return;
      void performChange(pendingStatus, comment.trim());
   };

   const handleDelete = async () => {
      if (!confirm('Удалить задачу? Это действие необратимо.')) return;
      await deleteTask.mutateAsync(taskId);
      router.push(`/sites/${task.site_id}`);
   };

   return (
      <div className={styles.page}>
         <Link href={`/sites/${task.site_id}`} className={styles.back}>
            ← {task.site?.name ?? 'Объект'}
         </Link>

         <div className={styles.card}>
            <div className={styles['card-header']}>
               <h1 className={styles.title}>{task.title}</h1>
               <StatusBadge status={task.status} />
            </div>

            <div className={styles['meta-grid']}>
               <div className={styles['meta-item']}>
                  <span className={styles['meta-label']}>Объект</span>
                  <span className={styles['meta-value']}>
                     <Link
                        href={`/sites/${task.site_id}`}
                        style={{color: 'var(--accent)'}}
                     >
                        {task.site?.name ?? '—'}
                     </Link>
                  </span>
               </div>
               <div className={styles['meta-item']}>
                  <span className={styles['meta-label']}>Исполнитель</span>
                  <span className={styles['meta-value']}>
                     {task.assignee?.full_name ?? '—'}
                  </span>
               </div>
               <div className={styles['meta-item']}>
                  <span className={styles['meta-label']}>Автор</span>
                  <span className={styles['meta-value']}>
                     {task.creator?.full_name ?? '—'}
                  </span>
               </div>
               <div className={styles['meta-item']}>
                  <span className={styles['meta-label']}>Создана</span>
                  <span className={styles['meta-value']}>
                     {dayjs(task.created_at).format('D MMM YYYY, HH:mm')}
                  </span>
               </div>
               <div className={styles['meta-item']}>
                  <span className={styles['meta-label']}>Обновлена</span>
                  <span className={styles['meta-value']}>
                     {dayjs(task.updated_at).format('D MMM YYYY, HH:mm')}
                  </span>
               </div>
            </div>

            {task.description && (
               <p className={styles.description}>{task.description}</p>
            )}

            {mutationError && <p className={styles.error}>{mutationError}</p>}

            {(actions.length > 0 || isManager) && (
               <div className={styles.actions}>
                  {actions.map(action => (
                     <Button
                        key={action.toStatus}
                        variant={action.variant}
                        size="sm"
                        loading={changeStatus.isPending}
                        onClick={() =>
                           handleAction(action.toStatus, action.requiresComment)
                        }
                     >
                        {action.label}
                     </Button>
                  ))}
                  {isManager && (
                     <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                           void handleDelete();
                        }}
                     >
                        Удалить задачу
                     </Button>
                  )}
               </div>
            )}
         </div>

         {/* History */}
         <h2 className={styles['history-title']}>История статусов</h2>
         <div className={styles['history-list']}>
            {history?.map(entry => (
               <div key={entry.id} className={styles['history-item']}>
                  <div className={styles['history-row']}>
                     <span className={styles['history-arrow']}>
                        {entry.from_status
                           ? STATUS_LABELS[entry.from_status]
                           : '(создание)'}
                        {' → '}
                     </span>
                     <StatusBadge status={entry.to_status} />
                  </div>
                  {entry.comment && (
                     <p className={styles['history-comment']}>
                        💬 {entry.comment}
                     </p>
                  )}
                  <p className={styles['history-meta']}>
                     {entry.changer?.full_name ?? '—'} ·{' '}
                     {dayjs(entry.changed_at).format('D MMM YYYY, HH:mm')}
                  </p>
               </div>
            ))}
         </div>

         {/* Comment dialog for rework */}
         <Dialog
            open={commentOpen}
            onClose={() => setCommentOpen(false)}
            title="Комментарий к доработке"
            footer={
               <>
                  <Button
                     variant="secondary"
                     onClick={() => setCommentOpen(false)}
                  >
                     Отмена
                  </Button>
                  <Button
                     variant="danger"
                     onClick={handleCommentSubmit}
                     loading={changeStatus.isPending}
                  >
                     Отправить на доработку
                  </Button>
               </>
            }
         >
            <p style={{color: 'var(--light)', fontSize: '0.875em', margin: 0}}>
               Опишите, что нужно исправить. Комментарий будет виден
               исполнителю.
            </p>
            <Textarea
               label="Комментарий *"
               value={comment}
               onChange={e => setComment(e.target.value)}
               error={commentError}
               placeholder="Указать, какие секции переделать..."
               autoFocus
            />
         </Dialog>
      </div>
   );
};
