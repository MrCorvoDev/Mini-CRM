'use client';

import Link from 'next/link';
import {useState} from 'react';
import {useCurrentProfile, useExecutors} from '@/entities/session';
import {useSite} from '@/entities/site';
import {useCreateTask, useTasks} from '@/entities/task';
import {Button} from '@/shared/ui/Button';
import {Dialog} from '@/shared/ui/Dialog';
import {Input, Textarea} from '@/shared/ui/Input';
import {Select} from '@/shared/ui/Select';
import {Spinner} from '@/shared/ui/Spinner';
import {StatusBadge} from '@/shared/ui/StatusBadge';
import styles from './SiteDetail.module.scss';

interface Props {
   siteId: string;
}

export const SiteDetail = ({siteId}: Props) => {
   const {profile, isManager} = useCurrentProfile();
   const {data: site, isLoading: siteLoading} = useSite(siteId);
   const {data: tasks, isLoading: tasksLoading} = useTasks(siteId);
   const {data: executors} = useExecutors();
   const createTask = useCreateTask();

   const [createOpen, setCreateOpen] = useState(false);
   const [form, setForm] = useState({
      title: '',
      description: '',
      assignee_id: '',
   });
   const [formError, setFormError] = useState('');

   const openCreate = () => {
      setForm({
         title: '',
         description: '',
         assignee_id: executors?.[0]?.id ?? '',
      });
      setFormError('');
      setCreateOpen(true);
   };

   const handleCreate = async () => {
      if (!form.title.trim()) {
         setFormError('Название задачи обязательно');
         return;
      }
      if (!form.assignee_id) {
         setFormError('Выберите исполнителя');
         return;
      }
      if (!profile) return;

      await createTask.mutateAsync({
         site_id: siteId,
         title: form.title.trim(),
         description: form.description.trim(),
         assignee_id: form.assignee_id,
      });
      setCreateOpen(false);
   };

   if (siteLoading) return <Spinner centered size="lg" />;
   if (!site) return <p className={styles.error}>Объект не найден</p>;

   const executorOptions = (executors ?? []).map(e => ({
      value: e.id,
      label: e.full_name,
   }));

   return (
      <div className={styles.page}>
         <Link href="/sites" className={styles.back}>
            ← Все объекты
         </Link>

         <div className={styles.header}>
            <h1 className={styles.title}>{site.name}</h1>
         </div>
         {site.address && <p className={styles.address}>{site.address}</p>}

         <div className={styles['section-header']}>
            <h2 className={styles['section-title']}>Задачи</h2>
            {isManager && (
               <Button size="sm" onClick={openCreate}>
                  + Добавить задачу
               </Button>
            )}
         </div>

         {tasksLoading ? (
            <Spinner centered />
         ) : !tasks?.length ? (
            <p className={styles.empty}>Задач пока нет</p>
         ) : (
            <div className={styles['tasks-list']}>
               {tasks.map(task => (
                  <Link
                     key={task.id}
                     href={`/tasks/${task.id}`}
                     className={styles['task-card']}
                  >
                     <div className={styles['task-info']}>
                        <p className={styles['task-title']}>{task.title}</p>
                        <p className={styles['task-meta']}>
                           Исполнитель: {task.assignee?.full_name ?? '—'}
                        </p>
                     </div>
                     <StatusBadge status={task.status} />
                  </Link>
               ))}
            </div>
         )}

         <Dialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            title="Новая задача"
            footer={
               <>
                  <Button
                     variant="secondary"
                     onClick={() => setCreateOpen(false)}
                  >
                     Отмена
                  </Button>
                  <Button
                     onClick={() => {
                        void handleCreate();
                     }}
                     loading={createTask.isPending}
                  >
                     Создать
                  </Button>
               </>
            }
         >
            <Input
               label="Название *"
               value={form.title}
               onChange={e => setForm(p => ({...p, title: e.target.value}))}
               error={formError}
               placeholder="Залить фундамент"
               autoFocus
            />
            <Textarea
               label="Описание"
               value={form.description}
               onChange={e =>
                  setForm(p => ({...p, description: e.target.value}))
               }
               placeholder="Подробное описание задачи..."
            />
            <Select
               label="Исполнитель *"
               value={form.assignee_id}
               onChange={e =>
                  setForm(p => ({...p, assignee_id: e.target.value}))
               }
               options={executorOptions}
               placeholder="Выберите исполнителя"
            />
         </Dialog>
      </div>
   );
};
