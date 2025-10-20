/**
 * Supabase Database Types
 *
 * Regenerate with:
 * npx supabase gen types typescript --project-id <project-ref> > types/supabase.ts
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
          role: 'applicant' | 'consultant' | 'admin'
          cv_parsed: Json | null
          eligibility_status: 'eligible' | 'ineligible' | 'skipped' | null
          created_at: string
          updated_at: string
          ime: string | null
          prezime: string | null
          oib: string | null
          kontakt_email: string | null
          kontakt_tel: string | null
        }
        Insert: {
          id: string
          role?: 'applicant' | 'consultant' | 'admin'
          cv_parsed?: Json | null
          eligibility_status?: 'eligible' | 'ineligible' | 'skipped' | null
          created_at?: string
          updated_at?: string
          ime?: string | null
          prezime?: string | null
          oib?: string | null
          kontakt_email?: string | null
          kontakt_tel?: string | null
        }
        Update: {
          id?: string
          role?: 'applicant' | 'consultant' | 'admin'
          cv_parsed?: Json | null
          eligibility_status?: 'eligible' | 'ineligible' | 'skipped' | null
          created_at?: string
          updated_at?: string
          ime?: string | null
          prezime?: string | null
          oib?: string | null
          kontakt_email?: string | null
          kontakt_tel?: string | null
        }
        Relationships: []
      }
      applications: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          title: string
          status: 'draft' | 'valid' | 'submitted' | 'archived'
          subject_type: 'samozaposleni' | 'pausalni_obrt' | 'obrt_sa_zaposlenima' | 'jdoo' | null
          total_amount: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id?: string | null
          title?: string
          status?: 'draft' | 'valid' | 'submitted' | 'archived'
          subject_type?: 'samozaposleni' | 'pausalni_obrt' | 'obrt_sa_zaposlenima' | 'jdoo' | null
          total_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string | null
          title?: string
          status?: 'draft' | 'valid' | 'submitted' | 'archived'
          subject_type?: 'samozaposleni' | 'pausalni_obrt' | 'obrt_sa_zaposlenima' | 'jdoo' | null
          total_amount?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          id: string
          app_id: string
          code: string
          data_json: Json
          status: 'draft' | 'missing' | 'valid'
          updated_at: string
        }
        Insert: {
          id?: string
          app_id: string
          code: string
          data_json?: Json
          status?: 'draft' | 'missing' | 'valid'
          updated_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          code?: string
          data_json?: Json
          status?: 'draft' | 'missing' | 'valid'
          updated_at?: string
        }
        Relationships: []
      }
      costs: {
        Row: {
          id: string
          app_id: string
          category: string
          description: string
          amount: number
          type: 'fiksni' | 'varijabilni' | null
          is_allowed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          app_id: string
          category: string
          description: string
          amount: number
          type?: 'fiksni' | 'varijabilni' | null
          is_allowed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          category?: string
          description?: string
          amount?: number
          type?: 'fiksni' | 'varijabilni' | null
          is_allowed?: boolean
          created_at?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          id: string
          app_id: string
          type: 'pdf' | 'zip' | 'docx'
          storage_url: string
          validation_status: 'complete' | 'incomplete' | null
          file_size_kb: number | null
          created_at: string
        }
        Insert: {
          id?: string
          app_id: string
          type?: 'pdf' | 'zip' | 'docx'
          storage_url: string
          validation_status?: 'complete' | 'incomplete' | null
          file_size_kb?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          app_id?: string
          type?: 'pdf' | 'zip' | 'docx'
          storage_url?: string
          validation_status?: 'complete' | 'incomplete' | null
          file_size_kb?: number | null
          created_at?: string
        }
        Relationships: []
      }
      hzz_rules: {
        Row: {
          id: string
          source_url: string | null
          rules_json: Json
          version: string
          fetched_at: string
        }
        Insert: {
          id?: string
          source_url?: string | null
          rules_json: Json
          version: string
          fetched_at?: string
        }
        Update: {
          id?: string
          source_url?: string | null
          rules_json?: Json
          version?: string
          fetched_at?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          id: string
          label: string
          date: string
          category: 'submission' | 'decision' | 'payment' | null
          source_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          date: string
          category?: 'submission' | 'decision' | 'payment' | null
          source_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          date?: string
          category?: 'submission' | 'decision' | 'payment' | null
          source_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      audits: {
        Row: {
          id: string
          actor_id: string | null
          entity: 'application' | 'section' | 'document' | 'user' | 'cost'
          entity_id: string
          action: 'create' | 'update' | 'delete' | 'generate' | 'export' | 'view'
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          entity: 'application' | 'section' | 'document' | 'user' | 'cost'
          entity_id: string
          action: 'create' | 'update' | 'delete' | 'generate' | 'export' | 'view'
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          actor_id?: string | null
          entity?: 'application' | 'section' | 'document' | 'user' | 'cost'
          entity_id?: string
          action?: 'create' | 'update' | 'delete' | 'generate' | 'export' | 'view'
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_total_costs: {
        Args: {
          app_id_param: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
