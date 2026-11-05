export type Json =
   | string
   | number
   | boolean
   | null
   | {[key: string]: Json | undefined}
   | Json[];

export type UserRole = 'manager' | 'executor';
export type TaskStatus =
   | 'new'
   | 'in_progress'
   | 'on_review'
   | 'rework'
   | 'accepted';

export interface Database {
   public: {
      Tables: {
         profiles: {
            Row: {
               id: string;
               full_name: string;
               role: UserRole;
               created_at: string;
            };
            Insert: {
               id: string;
               full_name: string;
               role?: UserRole;
               created_at?: string;
            };
            Update: {
               id?: string;
               full_name?: string;
               role?: UserRole;
               created_at?: string;
            };
            Relationships: [
               {
                  foreignKeyName: 'profiles_id_fkey';
                  columns: ['id'];
                  isOneToOne: true;
                  referencedRelation: 'users';
                  referencedColumns: ['id'];
               },
            ];
         };
         sites: {
            Row: {
               id: string;
               name: string;
               address: string;
               created_at: string;
               created_by: string;
            };
            Insert: {
               id?: string;
               name: string;
               address?: string;
               created_at?: string;
               created_by: string;
            };
            Update: {
               id?: string;
               name?: string;
               address?: string;
               created_at?: string;
               created_by?: string;
            };
            Relationships: [
               {
                  foreignKeyName: 'sites_created_by_fkey';
                  columns: ['created_by'];
                  isOneToOne: false;
                  referencedRelation: 'profiles';
                  referencedColumns: ['id'];
               },
            ];
         };
         tasks: {
            Row: {
               id: string;
               site_id: string;
               title: string;
               description: string;
               assignee_id: string;
               status: TaskStatus;
               created_by: string;
               created_at: string;
               updated_at: string;
            };
            Insert: {
               id?: string;
               site_id: string;
               title: string;
               description?: string;
               assignee_id: string;
               status?: TaskStatus;
               created_by?: string;
               created_at?: string;
               updated_at?: string;
            };
            Update: {
               id?: string;
               site_id?: string;
               title?: string;
               description?: string;
               assignee_id?: string;
               status?: TaskStatus;
               created_by?: string;
               created_at?: string;
               updated_at?: string;
            };
            Relationships: [
               {
                  foreignKeyName: 'tasks_site_id_fkey';
                  columns: ['site_id'];
                  isOneToOne: false;
                  referencedRelation: 'sites';
                  referencedColumns: ['id'];
               },
               {
                  foreignKeyName: 'tasks_assignee_id_fkey';
                  columns: ['assignee_id'];
                  isOneToOne: false;
                  referencedRelation: 'profiles';
                  referencedColumns: ['id'];
               },
               {
                  foreignKeyName: 'tasks_created_by_fkey';
                  columns: ['created_by'];
                  isOneToOne: false;
                  referencedRelation: 'profiles';
                  referencedColumns: ['id'];
               },
            ];
         };
         task_history: {
            Row: {
               id: string;
               task_id: string;
               changed_by: string;
               changed_at: string;
               from_status: TaskStatus | null;
               to_status: TaskStatus;
               comment: string;
            };
            Insert: {
               id?: string;
               task_id: string;
               changed_by: string;
               changed_at?: string;
               from_status?: TaskStatus | null;
               to_status: TaskStatus;
               comment?: string;
            };
            Update: {
               id?: string;
               task_id?: string;
               changed_by?: string;
               changed_at?: string;
               from_status?: TaskStatus | null;
               to_status?: TaskStatus;
               comment?: string;
            };
            Relationships: [
               {
                  foreignKeyName: 'task_history_task_id_fkey';
                  columns: ['task_id'];
                  isOneToOne: false;
                  referencedRelation: 'tasks';
                  referencedColumns: ['id'];
               },
               {
                  foreignKeyName: 'task_history_changed_by_fkey';
                  columns: ['changed_by'];
                  isOneToOne: false;
                  referencedRelation: 'profiles';
                  referencedColumns: ['id'];
               },
            ];
         };
      };
      Views: Record<string, never>;
      Functions: {
         change_task_status: {
            Args: {
               p_task_id: string;
               p_to_status: TaskStatus;
               p_comment?: string;
            };
            Returns: undefined;
         };
         get_user_role: {
            Args: Record<string, never>;
            Returns: UserRole;
         };
         is_task_participant: {
            Args: {
               p_user_id: string;
            };
            Returns: boolean;
         };
      };
      Enums: {
         user_role: UserRole;
         task_status: TaskStatus;
      };
      CompositeTypes: Record<string, never>;
   };
}
