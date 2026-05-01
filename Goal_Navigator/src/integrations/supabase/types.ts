export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academy_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          course_id: string
          course_name: string
          created_at: string
          id: string
          module_id: string | null
          module_name: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          course_id: string
          course_name: string
          created_at?: string
          id?: string
          module_id?: string | null
          module_name?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          course_id?: string
          course_name?: string
          created_at?: string
          id?: string
          module_id?: string | null
          module_name?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: []
      }
      company_okrs: {
        Row: {
          activo: boolean
          area: string
          created_at: string
          description: string | null
          id: string
          legacy_area_okr_id: string | null
          name: string
          okr_owner_email: string | null
          okr_owner_full_name: string | null
          pillar_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          area: string
          created_at?: string
          description?: string | null
          id?: string
          legacy_area_okr_id?: string | null
          name: string
          okr_owner_email?: string | null
          okr_owner_full_name?: string | null
          pillar_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          area?: string
          created_at?: string
          description?: string | null
          id?: string
          legacy_area_okr_id?: string | null
          name?: string
          okr_owner_email?: string | null
          okr_owner_full_name?: string | null
          pillar_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_okrs_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "okr_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      key_results: {
        Row: {
          assigned_email: string | null
          assigned_full_name: string | null
          baseline: number | null
          closing_month: string | null
          comment: string | null
          company_okr_id: string | null
          created_at: string
          current_value: number | null
          frecuencia: string | null
          id: string
          kr_type: string | null
          monthly_targets: Json | null
          name: string
          okr_id: string | null
          rating: number | null
          status: string | null
          target: number | null
          updated_at: string
          user_id: string | null
          weight: number | null
        }
        Insert: {
          assigned_email?: string | null
          assigned_full_name?: string | null
          baseline?: number | null
          closing_month?: string | null
          comment?: string | null
          company_okr_id?: string | null
          created_at?: string
          current_value?: number | null
          frecuencia?: string | null
          id?: string
          kr_type?: string | null
          monthly_targets?: Json | null
          name: string
          okr_id?: string | null
          rating?: number | null
          status?: string | null
          target?: number | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          assigned_email?: string | null
          assigned_full_name?: string | null
          baseline?: number | null
          closing_month?: string | null
          comment?: string | null
          company_okr_id?: string | null
          created_at?: string
          current_value?: number | null
          frecuencia?: string | null
          id?: string
          kr_type?: string | null
          monthly_targets?: Json | null
          name?: string
          okr_id?: string | null
          rating?: number | null
          status?: string | null
          target?: number | null
          updated_at?: string
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "key_results_company_okr_id_fkey"
            columns: ["company_okr_id"]
            isOneToOne: false
            referencedRelation: "company_okrs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "key_results_okr_id_fkey"
            columns: ["okr_id"]
            isOneToOne: false
            referencedRelation: "okr_individual"
            referencedColumns: ["id"]
          },
        ]
      }
      kr_accountability: {
        Row: {
          created_at: string
          id: string
          kr_id: string
          leader_comment: string | null
          leader_id: string | null
          leader_score: number | null
          period: string
          progress_value: number | null
          self_comment: string
          status: string
          suggested_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kr_id: string
          leader_comment?: string | null
          leader_id?: string | null
          leader_score?: number | null
          period?: string
          progress_value?: number | null
          self_comment?: string
          status?: string
          suggested_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kr_id?: string
          leader_comment?: string | null
          leader_id?: string | null
          leader_score?: number | null
          period?: string
          progress_value?: number | null
          self_comment?: string
          status?: string
          suggested_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leader_directory: {
        Row: {
          area: string
          cargo: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          subarea: string | null
        }
        Insert: {
          area: string
          cargo: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          subarea?: string | null
        }
        Update: {
          area?: string
          cargo?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          subarea?: string | null
        }
        Relationships: []
      }
      monthly_checkins: {
        Row: {
          collaborator_comment: string
          created_at: string
          flow_status: string
          id: string
          kr_id: string
          leader_adjusted_percent: number | null
          leader_adjusted_rating: string | null
          leader_feedback: string | null
          leader_id: string | null
          month: string
          progress_percent: number
          status_rating: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collaborator_comment?: string
          created_at?: string
          flow_status?: string
          id?: string
          kr_id: string
          leader_adjusted_percent?: number | null
          leader_adjusted_rating?: string | null
          leader_feedback?: string | null
          leader_id?: string | null
          month?: string
          progress_percent?: number
          status_rating?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collaborator_comment?: string
          created_at?: string
          flow_status?: string
          id?: string
          kr_id?: string
          leader_adjusted_percent?: number | null
          leader_adjusted_rating?: string | null
          leader_feedback?: string | null
          leader_id?: string | null
          month?: string
          progress_percent?: number
          status_rating?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string | null
          payload: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          payload?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          payload?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      okr_areas: {
        Row: {
          area: string
          created_at: string
          id: string
          name: string
          pillar_id: string
          progress: number | null
        }
        Insert: {
          area: string
          created_at?: string
          id?: string
          name: string
          pillar_id: string
          progress?: number | null
        }
        Update: {
          area?: string
          created_at?: string
          id?: string
          name?: string
          pillar_id?: string
          progress?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "okr_areas_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "okr_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_company: {
        Row: {
          activo: boolean
          area: string
          codigo: string
          created_at: string
          id: string
          nombre: string
          okr_statement: string | null
          owner_email: string | null
          owner_full_name: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          activo?: boolean
          area: string
          codigo: string
          created_at?: string
          id?: string
          nombre: string
          okr_statement?: string | null
          owner_email?: string | null
          owner_full_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          activo?: boolean
          area?: string
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
          okr_statement?: string | null
          owner_email?: string | null
          owner_full_name?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      okr_individual: {
        Row: {
          area_okr_id: string | null
          created_at: string
          id: string
          name: string
          period: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area_okr_id?: string | null
          created_at?: string
          id?: string
          name: string
          period?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area_okr_id?: string | null
          created_at?: string
          id?: string
          name?: string
          period?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "okr_individual_area_okr_id_fkey"
            columns: ["area_okr_id"]
            isOneToOne: false
            referencedRelation: "okr_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_periods: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          fecha_fin: string
          fecha_inicio: string
          id: string
          meta_porcentaje: number
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_fin: string
          fecha_inicio: string
          id?: string
          meta_porcentaje?: number
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          meta_porcentaje?: number
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      okr_pillars: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      operational_tasks: {
        Row: {
          assigned_email: string | null
          baseline_descripcion: string | null
          created_at: string
          descripcion: string
          estado: string
          evidencia_url: string | null
          fecha_automatizada: string | null
          frecuencia: string
          herramienta_usada: string | null
          horas_ahorradas_semana: number | null
          id: string
          leader_comment: string | null
          leader_id: string | null
          okr_period_id: string
          origen: string
          proceso_automatizado: string | null
          rejected_at: string | null
          resultado_descripcion: string | null
          submitted_at: string | null
          tiempo_minutos: number
          updated_at: string
          user_id: string | null
          validated_at: string | null
          validation_status: string
        }
        Insert: {
          assigned_email?: string | null
          baseline_descripcion?: string | null
          created_at?: string
          descripcion: string
          estado?: string
          evidencia_url?: string | null
          fecha_automatizada?: string | null
          frecuencia: string
          herramienta_usada?: string | null
          horas_ahorradas_semana?: number | null
          id?: string
          leader_comment?: string | null
          leader_id?: string | null
          okr_period_id: string
          origen?: string
          proceso_automatizado?: string | null
          rejected_at?: string | null
          resultado_descripcion?: string | null
          submitted_at?: string | null
          tiempo_minutos?: number
          updated_at?: string
          user_id?: string | null
          validated_at?: string | null
          validation_status?: string
        }
        Update: {
          assigned_email?: string | null
          baseline_descripcion?: string | null
          created_at?: string
          descripcion?: string
          estado?: string
          evidencia_url?: string | null
          fecha_automatizada?: string | null
          frecuencia?: string
          herramienta_usada?: string | null
          horas_ahorradas_semana?: number | null
          id?: string
          leader_comment?: string | null
          leader_id?: string | null
          okr_period_id?: string
          origen?: string
          proceso_automatizado?: string | null
          rejected_at?: string | null
          resultado_descripcion?: string | null
          submitted_at?: string | null
          tiempo_minutos?: number
          updated_at?: string
          user_id?: string | null
          validated_at?: string | null
          validation_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_tasks_okr_period_id_fkey"
            columns: ["okr_period_id"]
            isOneToOne: false
            referencedRelation: "okr_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_user_roles: {
        Row: {
          applied_at: string | null
          created_at: string
          email: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          email: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      performance_history: {
        Row: {
          area: string | null
          baseline: number | null
          created_at: string
          goal: number | null
          id: string
          kr_name: string
          month: string
          pct_cumplimiento: number | null
          pillar: string | null
          resultado: number | null
          user_id: string
        }
        Insert: {
          area?: string | null
          baseline?: number | null
          created_at?: string
          goal?: number | null
          id?: string
          kr_name: string
          month: string
          pct_cumplimiento?: number | null
          pillar?: string | null
          resultado?: number | null
          user_id: string
        }
        Update: {
          area?: string | null
          baseline?: number | null
          created_at?: string
          goal?: number | null
          id?: string
          kr_name?: string
          month?: string
          pct_cumplimiento?: number | null
          pillar?: string | null
          resultado?: number | null
          user_id?: string
        }
        Relationships: []
      }
      probation_evaluations: {
        Row: {
          created_at: string
          evaluation_type: string
          evaluator_id: string
          id: string
          notes: string | null
          passed_probation: boolean | null
          responses: Json | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          evaluation_type: string
          evaluator_id: string
          id?: string
          notes?: string | null
          passed_probation?: boolean | null
          responses?: Json | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          evaluation_type?: string
          evaluator_id?: string
          id?: string
          notes?: string | null
          passed_probation?: boolean | null
          responses?: Json | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      probation_goals: {
        Row: {
          completed: boolean
          created_at: string
          due_date: string | null
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          due_date?: string | null
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: string | null
          avatar_url: string | null
          cargo: string | null
          contribucion: string | null
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          id: string
          manager_email: string | null
          onboarding_completed_at: string | null
          subarea: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          area?: string | null
          avatar_url?: string | null
          cargo?: string | null
          contribucion?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          id?: string
          manager_email?: string | null
          onboarding_completed_at?: string | null
          subarea?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          area?: string | null
          avatar_url?: string | null
          cargo?: string | null
          contribucion?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          id?: string
          manager_email?: string | null
          onboarding_completed_at?: string | null
          subarea?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_assessments: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string
          id: string
          period: string
          profile_type: string
          status: string
          updated_at: string
          user_email: string
          user_full_name: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          period: string
          profile_type: string
          status?: string
          updated_at?: string
          user_email: string
          user_full_name: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          period?: string
          profile_type?: string
          status?: string
          updated_at?: string
          user_email?: string
          user_full_name?: string
        }
        Relationships: []
      }
      review_cycles: {
        Row: {
          ai_mindset_score: number | null
          comment: string | null
          created_at: string
          cycle_name: string
          id: string
          overall_rating: number | null
          period: string
          project_delivery_score: number | null
          reviewer_id: string
          status: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_mindset_score?: number | null
          comment?: string | null
          created_at?: string
          cycle_name: string
          id?: string
          overall_rating?: number | null
          period: string
          project_delivery_score?: number | null
          reviewer_id: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_mindset_score?: number | null
          comment?: string | null
          created_at?: string
          cycle_name?: string
          id?: string
          overall_rating?: number | null
          period?: string
          project_delivery_score?: number | null
          reviewer_id?: string
          status?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_dimensions: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          sort_order: number
          weight_individual: number
          weight_leader: number
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          weight_individual?: number
          weight_leader?: number
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          weight_individual?: number
          weight_leader?: number
        }
        Relationships: []
      }
      review_evaluators: {
        Row: {
          assessment_id: string
          created_at: string
          evaluator_email: string
          evaluator_role: string
          id: string
          status: string
          submitted_at: string | null
        }
        Insert: {
          assessment_id: string
          created_at?: string
          evaluator_email: string
          evaluator_role: string
          id?: string
          status?: string
          submitted_at?: string | null
        }
        Update: {
          assessment_id?: string
          created_at?: string
          evaluator_email?: string
          evaluator_role?: string
          id?: string
          status?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "review_evaluators_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "review_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_items: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          dimension_id: string
          id: string
          is_scored: boolean
          question: string
          sort_order: number
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          dimension_id: string
          id?: string
          is_scored?: boolean
          question: string
          sort_order?: number
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          dimension_id?: string
          id?: string
          is_scored?: boolean
          question?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_items_dimension_id_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "review_dimensions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_responses: {
        Row: {
          created_at: string
          evaluator_assignment_id: string
          evidence: string | null
          id: string
          item_id: string
          score: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          evaluator_assignment_id: string
          evidence?: string | null
          id?: string
          item_id: string
          score?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          evaluator_assignment_id?: string
          evidence?: string | null
          id?: string
          item_id?: string
          score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_responses_evaluator_assignment_id_fkey"
            columns: ["evaluator_assignment_id"]
            isOneToOne: false
            referencedRelation: "review_evaluators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_responses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "review_items"
            referencedColumns: ["id"]
          },
        ]
      }
      review_results: {
        Row: {
          assessment_id: string
          classification: string
          computed_at: string
          dimension_scores: Json
          id: string
          total_score: number
        }
        Insert: {
          assessment_id: string
          classification: string
          computed_at?: string
          dimension_scores?: Json
          id?: string
          total_score: number
        }
        Update: {
          assessment_id?: string
          classification?: string
          computed_at?: string
          dimension_scores?: Json
          id?: string
          total_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "review_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      review_weights: {
        Row: {
          dimension_code: string
          evaluator_role: string
          id: string
          profile_type: string
          weight: number
        }
        Insert: {
          dimension_code: string
          evaluator_role: string
          id?: string
          profile_type: string
          weight: number
        }
        Update: {
          dimension_code?: string
          evaluator_role?: string
          id?: string
          profile_type?: string
          weight?: number
        }
        Relationships: []
      }
      stakeholder_nominations: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          proposed_by: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          stakeholder_email: string
          stakeholder_name: string | null
          status: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          proposed_by: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stakeholder_email: string
          stakeholder_name?: string | null
          status?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          proposed_by?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          stakeholder_email?: string
          stakeholder_name?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "stakeholder_nominations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "review_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_user_id: string
          comentario: string
          created_at: string
          id: string
          is_leader_comment: boolean
          task_id: string
        }
        Insert: {
          author_user_id: string
          comentario: string
          created_at?: string
          id?: string
          is_leader_comment?: boolean
          task_id: string
        }
        Update: {
          author_user_id?: string
          comentario?: string
          created_at?: string
          id?: string
          is_leader_comment?: boolean
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "operational_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_master: {
        Row: {
          area: string
          cargo: string
          contribucion: string
          created_at: string
          deleted_at: string | null
          email: string
          full_name: string
          hire_date: string | null
          id: string
          manager_email: string | null
          rol: string
          subarea: string | null
          updated_at: string
        }
        Insert: {
          area?: string
          cargo: string
          contribucion?: string
          created_at?: string
          deleted_at?: string | null
          email: string
          full_name: string
          hire_date?: string | null
          id?: string
          manager_email?: string | null
          rol?: string
          subarea?: string | null
          updated_at?: string
        }
        Update: {
          area?: string
          cargo?: string
          contribucion?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          full_name?: string
          hire_date?: string | null
          id?: string
          manager_email?: string | null
          rol?: string
          subarea?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_create_profile_from_master: {
        Args: { _user_id: string }
        Returns: boolean
      }
      ensure_ai_native_krs_for_profile: {
        Args: { _email: string; _full_name: string; _user_id: string }
        Returns: undefined
      }
      get_my_key_results: {
        Args: never
        Returns: {
          assigned_email: string
          assigned_full_name: string
          baseline: number
          closing_month: string
          company_okr_id: string
          current_value: number
          id: string
          monthly_targets: Json
          name: string
          status: string
          target: number
          user_id: string
          weight: number
        }[]
      }
      get_owned_area_key_results: {
        Args: {
          _target_email?: string
          _target_full_name?: string
          _target_user_id?: string
        }
        Returns: {
          assigned_email: string
          assigned_full_name: string
          baseline: number
          closing_month: string
          company_okr_id: string
          current_value: number
          id: string
          monthly_targets: Json
          name: string
          status: string
          target: number
          user_id: string
          weight: number
        }[]
      }
      get_person_key_results: {
        Args: {
          _target_email?: string
          _target_full_name?: string
          _target_user_id?: string
        }
        Returns: {
          assigned_email: string
          assigned_full_name: string
          baseline: number
          closing_month: string
          company_okr_id: string
          current_value: number
          id: string
          monthly_targets: Json
          name: string
          status: string
          target: number
          user_id: string
          weight: number
        }[]
      }
      get_team_key_results: {
        Args: never
        Returns: {
          assigned_email: string
          assigned_full_name: string
          baseline: number
          closing_month: string
          company_okr_id: string
          current_value: number
          id: string
          monthly_targets: Json
          name: string
          status: string
          target: number
          user_id: string
          weight: number
        }[]
      }
      get_user_area: { Args: { _user_id: string }; Returns: string }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_manager_of: {
        Args: { _manager_email: string; _target_email: string }
        Returns: boolean
      }
      name_match_tokens: { Args: { _full_name: string }; Returns: string[] }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "global_leader"
        | "team_leader"
        | "individual_contributor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "global_leader",
        "team_leader",
        "individual_contributor",
      ],
    },
  },
} as const
