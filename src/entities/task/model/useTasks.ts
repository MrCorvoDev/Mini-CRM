import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import type {TaskStatus} from '@/shared/api';
import {supabase} from '@/shared/api';

export interface Task {
   id: string;
   site_id: string;
   title: string;
   description: string;
   assignee_id: string;
   status: TaskStatus;
   created_by: string;
   created_at: string;
   updated_at: string;
   // joined
   assignee?: {full_name: string; role: string};
   creator?: {full_name: string};
   site?: {name: string; address: string};
}

export interface TaskHistory {
   id: string;
   task_id: string;
   changed_by: string;
   changed_at: string;
   from_status: TaskStatus | null;
   to_status: TaskStatus;
   comment: string;
   changer?: {full_name: string};
}

export function useTasks(siteId?: string) {
   return useQuery({
      queryKey: ['tasks', {siteId}],
      queryFn: async () => {
         let q = supabase
            .from('tasks')
            .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name, role),
          creator:profiles!tasks_created_by_fkey(full_name),
          site:sites(name, address)
        `)
            .order('created_at', {ascending: false});

         if (siteId) q = q.eq('site_id', siteId);

         const {data, error} = await q;
         if (error) throw error;
         return data as Task[];
      },
   });
}

export function useTask(id: string) {
   return useQuery({
      queryKey: ['tasks', id],
      queryFn: async () => {
         const {data, error} = await supabase
            .from('tasks')
            .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name, role),
          creator:profiles!tasks_created_by_fkey(full_name),
          site:sites(name, address)
        `)
            .eq('id', id)
            .single();
         if (error) throw error;
         return data as Task;
      },
      enabled: !!id,
   });
}

export function useMyTasks() {
   return useQuery({
      queryKey: ['tasks', 'my'],
      queryFn: async () => {
         const {
            data: {user},
         } = await supabase.auth.getUser();
         if (!user) return [];
         const {data, error} = await supabase
            .from('tasks')
            .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey(full_name, role),
          site:sites(name, address)
        `)
            .eq('assignee_id', user.id)
            .order('updated_at', {ascending: false});
         if (error) throw error;
         return data as Task[];
      },
   });
}

export function useTaskHistory(taskId: string) {
   return useQuery({
      queryKey: ['task_history', taskId],
      queryFn: async () => {
         const {data, error} = await supabase
            .from('task_history')
            .select(`
          *,
          changer:profiles!task_history_changed_by_fkey(full_name)
        `)
            .eq('task_id', taskId)
            .order('changed_at', {ascending: true});
         if (error) throw error;
         return data as TaskHistory[];
      },
      enabled: !!taskId,
   });
}

export function useCreateTask() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async (input: {
         site_id: string;
         title: string;
         description: string;
         assignee_id: string;
      }) => {
         const {data, error} = await supabase
            .from('tasks')
            .insert({...input, status: 'new'})
            .select()
            .single();
         if (error) throw error;
         return data as Task;
      },
      onSuccess: (_data, vars) => {
         void qc.invalidateQueries({
            queryKey: ['tasks', {siteId: vars.site_id}],
         });
         void qc.invalidateQueries({queryKey: ['tasks', 'my']});
      },
   });
}

export function useChangeTaskStatus() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({
         taskId,
         toStatus,
         comment = '',
      }: {
         taskId: string;
         toStatus: TaskStatus;
         comment?: string;
      }) => {
         const {error} = await supabase.rpc('change_task_status', {
            p_task_id: taskId,
            p_to_status: toStatus,
            p_comment: comment,
         });
         if (error) throw error;
      },
      onSuccess: (_data, vars) => {
         void qc.invalidateQueries({queryKey: ['tasks', vars.taskId]});
         void qc.invalidateQueries({queryKey: ['tasks']});
         void qc.invalidateQueries({queryKey: ['task_history', vars.taskId]});
      },
   });
}

export function useDeleteTask() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async (taskId: string) => {
         const {error} = await supabase.from('tasks').delete().eq('id', taskId);
         if (error) throw error;
      },
      onSuccess: () => {
         void qc.invalidateQueries({queryKey: ['tasks']});
      },
   });
}
