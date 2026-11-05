'use client';

import Link from 'next/link';
import {useState} from 'react';
import {useCurrentProfile} from '@/entities/session';
import {
   useCreateSite,
   useDeleteSite,
   useSites,
   useUpdateSite,
} from '@/entities/site';
import {Button} from '@/shared/ui/Button';
import {Dialog} from '@/shared/ui/Dialog';
import {Input} from '@/shared/ui/Input';
import {Spinner} from '@/shared/ui/Spinner';
import styles from './SitesList.module.scss';

interface SiteFormData {
   name: string;
   address: string;
}

export const SitesList = () => {
   const {profile, isManager} = useCurrentProfile();
   const {data: sites, isLoading, error} = useSites();
   const createSite = useCreateSite();
   const updateSite = useUpdateSite();
   const deleteSite = useDeleteSite();

   const [createOpen, setCreateOpen] = useState(false);
   const [editId, setEditId] = useState<string | null>(null);
   const [form, setForm] = useState<SiteFormData>({name: '', address: ''});
   const [formError, setFormError] = useState('');

   const openCreate = () => {
      setForm({name: '', address: ''});
      setFormError('');
      setCreateOpen(true);
   };

   const openEdit = (id: string, name: string, address: string) => {
      setForm({name, address});
      setFormError('');
      setEditId(id);
   };

   const handleCreate = async () => {
      if (!form.name.trim()) {
         setFormError('Название обязательно');
         return;
      }
      if (!profile) return;

      await createSite.mutateAsync({
         name: form.name.trim(),
         address: form.address.trim(),
         created_by: profile.id,
      });
      setCreateOpen(false);
   };

   const handleUpdate = async () => {
      if (!form.name.trim() || !editId) {
         setFormError('Название обязательно');
         return;
      }

      await updateSite.mutateAsync({
         id: editId,
         name: form.name.trim(),
         address: form.address.trim(),
      });
      setEditId(null);
   };

   const handleDelete = async (id: string, name: string) => {
      if (
         !confirm(`Удалить объект «${name}»? Все задачи объекта будут удалены.`)
      )
         return;
      await deleteSite.mutateAsync(id);
   };

   if (isLoading) return <Spinner centered size="lg" />;
   if (error)
      return <p className={styles.error}>Ошибка загрузки: {String(error)}</p>;

   return (
      <div className={styles.page}>
         <div className={styles.header}>
            <h1 className={styles.title}>Объекты</h1>
            {isManager && (
               <Button size="sm" onClick={openCreate}>
                  + Добавить объект
               </Button>
            )}
         </div>

         {!sites?.length ? (
            <div className={styles.empty}>
               <p className={styles['empty-title']}>Объектов пока нет</p>
               <p className={styles['empty-subtitle']}>
                  {isManager
                     ? 'Создайте первый строительный объект с помощью кнопки «+ Добавить объект» выше.'
                     : 'Объекты появятся здесь, когда вам будут назначены связанные задачи.'}
               </p>
            </div>
         ) : (
            <div className={styles.grid}>
               {sites.map(site => (
                  <div key={site.id} className={styles.card}>
                     <Link
                        href={`/sites/${site.id}`}
                        className={styles['card-link']}
                     >
                        <h2 className={styles['card-name']}>{site.name}</h2>
                        {site.address && (
                           <p className={styles['card-address']}>
                              {site.address}
                           </p>
                        )}
                     </Link>
                     {isManager && (
                        <div className={styles['card-actions']}>
                           <Button
                              size="sm"
                              variant="secondary"
                              onClick={() =>
                                 openEdit(site.id, site.name, site.address)
                              }
                           >
                              Изменить
                           </Button>
                           <Button
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                 void handleDelete(site.id, site.name);
                              }}
                           >
                              Удалить
                           </Button>
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

         {/* Create Dialog */}
         <Dialog
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            title="Новый объект"
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
                     loading={createSite.isPending}
                  >
                     Создать
                  </Button>
               </>
            }
         >
            <Input
               label="Название *"
               value={form.name}
               onChange={e => setForm(p => ({...p, name: e.target.value}))}
               placeholder="ЖК «Северный»"
               error={formError}
               autoFocus
            />
            <Input
               label="Адрес"
               value={form.address}
               onChange={e => setForm(p => ({...p, address: e.target.value}))}
               placeholder="ул. Северная, 15"
            />
         </Dialog>

         {/* Edit Dialog */}
         <Dialog
            open={!!editId}
            onClose={() => setEditId(null)}
            title="Редактировать объект"
            footer={
               <>
                  <Button variant="secondary" onClick={() => setEditId(null)}>
                     Отмена
                  </Button>
                  <Button
                     onClick={() => {
                        void handleUpdate();
                     }}
                     loading={updateSite.isPending}
                  >
                     Сохранить
                  </Button>
               </>
            }
         >
            <Input
               label="Название *"
               value={form.name}
               onChange={e => setForm(p => ({...p, name: e.target.value}))}
               placeholder="ЖК «Северный»"
               error={formError}
               autoFocus
            />
            <Input
               label="Адрес"
               value={form.address}
               onChange={e => setForm(p => ({...p, address: e.target.value}))}
               placeholder="ул. Северная, 15"
            />
         </Dialog>
      </div>
   );
};
