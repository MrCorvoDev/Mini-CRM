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
import {Textarea} from '@/shared/ui/Input';
import {Spinner} from '@/shared/ui/Spinner';
import {StatusBadge} from '@/shared/ui/StatusBadge';
import 'dayjs/locale/ru';
import styles from './TaskDetail.module.scss';

dayjs.locale('ru');

const ROLE_LABELS: Record<string, string> = {
   manager: 'Менеджер',
   executor: 'Исполнитель',
};

interface Props {
   taskId: string;
}

export const TaskDetail = ({taskId}: Props) => {
   const router = useRouter();
   const {
      profile,
      session,
      isLoading: profileLoading,
      isManager,
      initialized,
   } = useCurrentProfile();
   const {data: task, isLoading: taskLoading, error} = useTask(taskId);
   const {data: history} = useTaskHistory(taskId);
   const changeStatus = useChangeTaskStatus();
   const deleteTask = useDeleteTask();

   const [reworkComment, setReworkComment] = useState('');
   const [reworkCommentError, setReworkCommentError] = useState('');
   const [mutationError, setMutationError] = useState('');

   if (taskLoading || profileLoading || !initialized) {
      return <Spinner centered size="lg" />;
   }

   if (error || !task) {
      return (
         <div className={styles.page}>
            <p className={styles.error}>
               Задача не найдена или у вас нет прав на её просмотр
            </p>
         </div>
      );
   }

   const currentUserId = profile?.id ?? session?.user?.id;
   const isAssignee = !!currentUserId && currentUserId === task.assignee_id;

   const handleStatusChange = async (toStatus: TaskStatus, comment = '') => {
      setMutationError('');
      try {
         await changeStatus.mutateAsync({taskId, toStatus, comment});
         if (toStatus === 'rework') {
            setReworkComment('');
            setReworkCommentError('');
         }
      } catch (err) {
         const msg =
            err instanceof Error ? err.message : 'Ошибка изменения статуса';
         setMutationError(msg);
      }
   };

   const handleReworkSubmit = () => {
      if (!reworkComment.trim()) {
         setReworkCommentError(
            'Комментарий обязателен при возврате на доработку',
         );
         return;
      }
      void handleStatusChange('rework', reworkComment.trim());
   };

   const handleDelete = async () => {
      if (!confirm('Удалить задачу? Это действие необратимо.')) return;
      try {
         await deleteTask.mutateAsync(taskId);
         router.push(`/sites/${task.site_id}`);
      } catch (err) {
         const msg =
            err instanceof Error ? err.message : 'Ошибка удаления задачи';
         setMutationError(msg);
      }
   };

   // Determine action buttons based on status and role
   const showExecutorTakeInProgress =
      isAssignee && (task.status === 'new' || task.status === 'rework');
   const showExecutorSendToReview = isAssignee && task.status === 'in_progress';

   const showManagerReviewActions = isManager && task.status === 'on_review';

   const hasActions =
      showExecutorTakeInProgress ||
      showExecutorSendToReview ||
      showManagerReviewActions ||
      isManager;

   return (
      <div className={styles.page}>
         <Link href={`/sites/${task.site_id}`} className={styles.back}>
            ← {task.site?.name ?? 'Назад к объекту'}
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
                        className={styles['meta-link']}
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
                     {task.creator?.role
                        ? ` (${ROLE_LABELS[task.creator.role] ?? task.creator.role})`
                        : ''}
                  </span>
               </div>

               <div className={styles['meta-item']}>
                  <span className={styles['meta-label']}>Создана</span>
                  <span className={styles['meta-value']}>
                     {dayjs(task.created_at).format('D MMMM YYYY, HH:mm')}
                  </span>
               </div>

               <div className={styles['meta-item']}>
                  <span className={styles['meta-label']}>Обновлена</span>
                  <span className={styles['meta-value']}>
                     {dayjs(task.updated_at).format('D MMMM YYYY, HH:mm')}
                  </span>
               </div>
            </div>

            {task.description && (
               <div className={styles['description-box']}>
                  <p className={styles['description-title']}>Описание задачи</p>
                  <p className={styles.description}>{task.description}</p>
               </div>
            )}

            {mutationError && <p className={styles.error}>{mutationError}</p>}

            {hasActions && (
               <div className={styles['actions-container']}>
                  {showManagerReviewActions && (
                     <div className={styles['rework-box']}>
                        <Textarea
                           label="Комментарий к возврату на доработку *"
                           value={reworkComment}
                           onChange={e => {
                              setReworkComment(e.target.value);
                              if (reworkCommentError) setReworkCommentError('');
                           }}
                           error={reworkCommentError}
                           placeholder="Опишите, что именно требуется исправить (обязательно для возврата)..."
                        />
                     </div>
                  )}

                  <div className={styles.actions}>
                     {showExecutorTakeInProgress && (
                        <Button
                           variant="primary"
                           loading={changeStatus.isPending}
                           onClick={() =>
                              void handleStatusChange('in_progress')
                           }
                        >
                           Взять в работу
                        </Button>
                     )}

                     {showExecutorSendToReview && (
                        <Button
                           variant="primary"
                           loading={changeStatus.isPending}
                           onClick={() => void handleStatusChange('on_review')}
                        >
                           Отправить на проверку
                        </Button>
                     )}

                     {showManagerReviewActions && (
                        <>
                           <Button
                              variant="primary"
                              loading={changeStatus.isPending}
                              onClick={() =>
                                 void handleStatusChange('accepted')
                              }
                           >
                              Принять
                           </Button>
                           <Button
                              variant="danger"
                              loading={changeStatus.isPending}
                              onClick={handleReworkSubmit}
                           >
                              Вернуть на доработку
                           </Button>
                        </>
                     )}

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
               </div>
            )}
         </div>

         {/* History section */}
         <div className={styles['history-section']}>
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
                        <span>{entry.changer?.full_name ?? '—'}</span>
                        {entry.changer?.role && (
                           <span className={styles['history-role']}>
                              (
                              {ROLE_LABELS[entry.changer.role] ??
                                 entry.changer.role}
                              )
                           </span>
                        )}
                        <span>·</span>
                        <span>
                           {dayjs(entry.changed_at).format(
                              'D MMMM YYYY, HH:mm',
                           )}
                        </span>
                     </p>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};
