'use client';

import type {Session} from '@supabase/supabase-js';
import {useQuery} from '@tanstack/react-query';
import {useEffect, useState} from 'react';
import type {UserRole} from '@/shared/api';
import {supabase} from '@/shared/api';

export interface Profile {
   id: string;
   full_name: string;
   role: UserRole;
   created_at: string;
}

export interface SessionWithProfile {
   session: Session | null;
   profile: Profile | null;
   isLoading: boolean;
   isManager: boolean;
   isExecutor: boolean;
}

// Hook: get current auth session
export function useSession() {
   const [session, setSession] = useState<Session | null>(null);
   const [initialized, setInitialized] = useState(false);

   useEffect(() => {
      supabase.auth.getSession().then(({data}) => {
         setSession(data.session);
         setInitialized(true);
      });

      const {data: listener} = supabase.auth.onAuthStateChange((_event, s) => {
         setSession(s);
      });

      return () => listener.subscription.unsubscribe();
   }, []);

   return {session, initialized};
}

// Hook: get profile for current user
export function useCurrentProfile() {
   const {session, initialized} = useSession();

   const {data: profile, isLoading} = useQuery({
      queryKey: ['profile', session?.user.id],
      queryFn: async () => {
         if (!session?.user.id) return null;
         const {data, error} = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
         if (error) throw error;
         return data as Profile;
      },
      enabled: !!session?.user.id,
   });

   return {
      session,
      profile: profile ?? null,
      isLoading: !initialized || isLoading,
      isManager: profile?.role === 'manager',
      isExecutor: profile?.role === 'executor',
      initialized,
   } satisfies SessionWithProfile & {initialized: boolean};
}

// Hook: get executor profiles (for task assignment)
export function useExecutors() {
   return useQuery({
      queryKey: ['profiles', 'executors'],
      queryFn: async () => {
         const {data, error} = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'executor')
            .order('full_name');
         if (error) throw error;
         return data as Profile[];
      },
   });
}
