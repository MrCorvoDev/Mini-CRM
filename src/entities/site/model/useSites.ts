import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {supabase} from '@/shared/api';

export interface Site {
   id: string;
   name: string;
   address: string;
   created_at: string;
   created_by: string;
}

export function useSites() {
   return useQuery({
      queryKey: ['sites'],
      queryFn: async () => {
         const {data, error} = await supabase
            .from('sites')
            .select('*')
            .order('created_at', {ascending: false});
         if (error) throw error;
         return data as Site[];
      },
   });
}

export function useSite(id: string) {
   return useQuery({
      queryKey: ['sites', id],
      queryFn: async () => {
         const {data, error} = await supabase
            .from('sites')
            .select('*')
            .eq('id', id)
            .single();
         if (error) throw error;
         return data as Site;
      },
      enabled: !!id,
   });
}

export function useCreateSite() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async (input: {
         name: string;
         address: string;
         created_by: string;
      }) => {
         const {data, error} = await supabase
            .from('sites')
            .insert(input)
            .select()
            .single();
         if (error) throw error;
         return data as Site;
      },
      onSuccess: () => {
         void qc.invalidateQueries({queryKey: ['sites']});
      },
   });
}

export function useUpdateSite() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async ({
         id,
         name,
         address,
      }: {
         id: string;
         name: string;
         address: string;
      }) => {
         const {data, error} = await supabase
            .from('sites')
            .update({name, address})
            .eq('id', id)
            .select()
            .single();
         if (error) throw error;
         return data as Site;
      },
      onSuccess: (_data, vars) => {
         void qc.invalidateQueries({queryKey: ['sites']});
         void qc.invalidateQueries({queryKey: ['sites', vars.id]});
      },
   });
}

export function useDeleteSite() {
   const qc = useQueryClient();
   return useMutation({
      mutationFn: async (id: string) => {
         const {error} = await supabase.from('sites').delete().eq('id', id);
         if (error) throw error;
      },
      onSuccess: () => {
         void qc.invalidateQueries({queryKey: ['sites']});
      },
   });
}
