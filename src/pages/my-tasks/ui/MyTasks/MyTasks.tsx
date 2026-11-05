'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import {useMyTasks} from '@/entities/task';
import {Spinner} from '@/shared/ui/Spinner';
import {StatusBadge} from '@/shared/ui/StatusBadge';
import 'dayjs/locale/ru';
import styles from './MyTasks.module.scss';

dayjs.locale('ru');

export const MyTasks = () => {
   const {data: tasks, isLoading} = useMyTasks();

   if (isLoading) return <Spinner centered size="lg" />;

   return (
      <div className={styles.page}>
         <h1 className={styles.title}>Мои задачи</h1>

         {!tasks?.length ? (
            <p className={styles.empty}>Задач нет</p>
         ) : (
            <div className={styles.list}>
               {tasks.map(task => (
                  <Link
                     key={task.id}
                     href={`/tasks/${task.id}`}
                     className={styles['task-card']}
                  >
                     <div className={styles['task-info']}>
                        <p className={styles['task-title']}>{task.title}</p>
                        <p className={styles['task-meta']}>
                           {task.site?.name ?? '—'} ·{' '}
                           {dayjs(task.updated_at).format('D MMM YYYY')}
                        </p>
                     </div>
                     <StatusBadge status={task.status} />
                  </Link>
               ))}
            </div>
         )}
      </div>
   );
};
