/**
 * Supabase Database Types
 *
 * Generate these types by running:
 * npx supabase gen types typescript --project-id <your-project-id> > types/supabase.ts
 *
 * For now, this is a placeholder. Update after Supabase project is linked.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          phone: string | null
          cv_parsed: Json | null
          eligibility_status: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          name?: string | null
          phone?: string | null
          cv_parsed?: Json | null
          eligibility_status?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          phone?: string | null
          cv_parsed?: Json | null
          eligibility_status?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          user_id: string
          created_at: string
          updated_at: string
          status: string
          subject_type: string | null
          title: string | null
          business_idea: string | null
          total_costs: number | null
          generated_data: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          updated_at?: string
          status?: string
          subject_type?: string | null
          title?: string | null
          business_idea?: string | null
          total_costs?: number | null
          generated_data?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          updated_at?: string
          status?: string
          subject_type?: string | null
          title?: string | null
          business_idea?: string | null
          total_costs?: number | null
          generated_data?: Json | null
        }
      }
      sections: {
        Row: {
          id: string
          app_id: string
          section_key: string
          data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          app_id: string
          section_key: string
          data: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          section_key?: string
          data?: Json
          created_at?: string
          updated_at?: string
        }
      }
      costs: {
        Row: {
          id: string
          app_id: string
          category: string
          description: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          app_id: string
          category: string
          description: string
          amount: number
          created_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          category?: string
          description?: string
          amount?: number
          created_at?: string
        }
      }
      generated_documents: {
        Row: {
          id: string
          app_id: string
          file_path: string
          file_size_kb: number
          created_at: string
        }
        Insert: {
          id?: string
          app_id: string
          file_path: string
          file_size_kb: number
          created_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          file_path?: string
          file_size_kb?: number
          created_at?: string
        }
      }
      hzz_rules: {
        Row: {
          id: string
          version: string
          allowed_costs: string[]
          disallowed_costs: string[]
          max_amounts: Json
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          version: string
          allowed_costs: string[]
          disallowed_costs: string[]
          max_amounts: Json
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          version?: string
          allowed_costs?: string[]
          disallowed_costs?: string[]
          max_amounts?: Json
          active?: boolean
          created_at?: string
        }
      }
      deadlines: {
        Row: {
          id: string
          submission_start: string
          submission_end: string
          year: number
          created_at: string
        }
        Insert: {
          id?: string
          submission_start: string
          submission_end: string
          year: number
          created_at?: string
        }
        Update: {
          id?: string
          submission_start?: string
          submission_end?: string
          year?: number
          created_at?: string
        }
      }
      audits: {
        Row: {
          id: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource_type: string
          resource_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource_type?: string
          resource_id?: string
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
