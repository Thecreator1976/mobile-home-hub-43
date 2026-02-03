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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          buyer_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          org_id: string
          organization_id: string | null
          seller_lead_id: string | null
          start_time: string
          status: string | null
          title: string
          type: Database["public"]["Enums"]["appointment_type"] | null
          updated_at: string
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          org_id: string
          organization_id?: string | null
          seller_lead_id?: string | null
          start_time: string
          status?: string | null
          title: string
          type?: Database["public"]["Enums"]["appointment_type"] | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          org_id?: string
          organization_id?: string | null
          seller_lead_id?: string | null
          start_time?: string
          status?: string | null
          title?: string
          type?: Database["public"]["Enums"]["appointment_type"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "secure_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "test_secure_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      buyers: {
        Row: {
          created_at: string
          created_by: string | null
          credit_score: number | null
          email: string | null
          home_types: Database["public"]["Enums"]["home_type"][] | null
          id: string
          locations: string[] | null
          max_price: number | null
          min_price: number | null
          name: string
          notes: string | null
          org_id: string
          organization_id: string | null
          phone: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          email?: string | null
          home_types?: Database["public"]["Enums"]["home_type"][] | null
          id?: string
          locations?: string[] | null
          max_price?: number | null
          min_price?: number | null
          name: string
          notes?: string | null
          org_id: string
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          credit_score?: number | null
          email?: string | null
          home_types?: Database["public"]["Enums"]["home_type"][] | null
          id?: string
          locations?: string[] | null
          max_price?: number | null
          min_price?: number | null
          name?: string
          notes?: string | null
          org_id?: string
          organization_id?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyers_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_access_audit: {
        Row: {
          access_type: string | null
          accessed_at: string | null
          id: string
          ip_address: unknown
          organization_id: string | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          access_type?: string | null
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string | null
          accessed_at?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_access_audit_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_status_history: {
        Row: {
          changed_by: string | null
          contract_id: string
          created_at: string
          id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          changed_by?: string | null
          contract_id: string
          created_at?: string
          id?: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          changed_by?: string | null
          contract_id?: string
          created_at?: string
          id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_status_history_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          content: string
          contract_type: string | null
          created_at: string
          created_by: string | null
          docusign_envelope_id: string | null
          id: string
          offer_data: Json | null
          org_id: string
          organization_id: string | null
          seller_lead_id: string | null
          sent_at: string | null
          signed_at: string | null
          status: string
          template_id: string | null
          template_name: string
          updated_at: string
        }
        Insert: {
          content: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          docusign_envelope_id?: string | null
          id?: string
          offer_data?: Json | null
          org_id: string
          organization_id?: string | null
          seller_lead_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          template_id?: string | null
          template_name: string
          updated_at?: string
        }
        Update: {
          content?: string
          contract_type?: string | null
          created_at?: string
          created_by?: string | null
          docusign_envelope_id?: string | null
          id?: string
          offer_data?: Json | null
          org_id?: string
          organization_id?: string | null
          seller_lead_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          template_id?: string | null
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_access_log: {
        Row: {
          accessed_at: string | null
          dashboard_name: string | null
          id: string
          ip_address: unknown
          organization_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          dashboard_name?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          dashboard_name?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"] | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string | null
          id: string
          org_id: string
          organization_id: string | null
          receipt_url: string | null
          seller_lead_id: string | null
        }
        Insert: {
          amount: number
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string | null
          id?: string
          org_id: string
          organization_id?: string | null
          receipt_url?: string | null
          seller_lead_id?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"] | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string | null
          id?: string
          org_id?: string
          organization_id?: string | null
          receipt_url?: string | null
          seller_lead_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          config: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          organization_id: string | null
          service_name: string
          updated_at: string | null
          user_id: string | null
          webhook_url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          organization_id?: string | null
          service_name: string
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          organization_id?: string | null
          service_name?: string
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_timeline: {
        Row: {
          action: string
          created_at: string
          id: string
          seller_lead_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          seller_lead_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          seller_lead_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_timeline_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_conversations: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          created_by: string | null
          facebook_user_id: string
          facebook_user_name: string | null
          id: string
          last_message_at: string | null
          org_id: string
          organization_id: string
          profile_pic_url: string | null
          seller_lead_id: string | null
          status: string | null
        }
        Insert: {
          buyer_id?: string | null
          created_at?: string | null
          created_by?: string | null
          facebook_user_id: string
          facebook_user_name?: string | null
          id?: string
          last_message_at?: string | null
          org_id: string
          organization_id: string
          profile_pic_url?: string | null
          seller_lead_id?: string | null
          status?: string | null
        }
        Update: {
          buyer_id?: string | null
          created_at?: string | null
          created_by?: string | null
          facebook_user_id?: string
          facebook_user_name?: string | null
          id?: string
          last_message_at?: string | null
          org_id?: string
          organization_id?: string
          profile_pic_url?: string | null
          seller_lead_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messenger_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "secure_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "test_secure_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      messenger_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          direction: string
          facebook_message_id: string | null
          id: string
          message_type: string | null
          organization_id: string
          read_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          direction: string
          facebook_message_id?: string | null
          id?: string
          message_type?: string | null
          organization_id: string
          read_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          direction?: string
          facebook_message_id?: string | null
          id?: string
          message_type?: string | null
          organization_id?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messenger_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "messenger_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "secure_messenger_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_paid: boolean | null
          name: string
          owner_id: string | null
          settings: Json | null
          slug: string
          subscription_expires_at: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name: string
          owner_id?: string | null
          settings?: Json | null
          slug: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_paid?: boolean | null
          name?: string
          owner_id?: string | null
          settings?: Json | null
          slug?: string
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      personal_advances: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          interest_rate: number | null
          issued_date: string
          notes: string | null
          org_id: string
          organization_id: string | null
          purpose: string
          repaid_date: string | null
          repayment_terms: string | null
          seller_lead_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          issued_date?: string
          notes?: string | null
          org_id: string
          organization_id?: string | null
          purpose: string
          repaid_date?: string | null
          repayment_terms?: string | null
          seller_lead_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          interest_rate?: number | null
          issued_date?: string
          notes?: string | null
          org_id?: string
          organization_id?: string | null
          purpose?: string
          repaid_date?: string | null
          repayment_terms?: string | null
          seller_lead_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_advances_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_advances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_advances_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_audit: {
        Row: {
          accessed_at: string | null
          accessed_via: string | null
          id: string
          ip_address: unknown
          organization_id: string | null
          user_agent: string | null
          viewed_profile_id: string | null
          viewer_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          accessed_via?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          user_agent?: string | null
          viewed_profile_id?: string | null
          viewer_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          accessed_via?: string | null
          id?: string
          ip_address?: unknown
          organization_id?: string | null
          user_agent?: string | null
          viewed_profile_id?: string | null
          viewer_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_paid: boolean | null
          is_super_admin: boolean | null
          organization_id: string | null
          status: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_paid?: boolean | null
          is_super_admin?: boolean | null
          organization_id?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_paid?: boolean | null
          is_super_admin?: boolean | null
          organization_id?: string | null
          status?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          items: Json
          notes: string | null
          org_id: string
          organization_id: string | null
          po_number: string
          seller_lead_id: string | null
          status: string
          total_amount: number
          updated_at: string
          vendor: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          org_id: string
          organization_id?: string | null
          po_number: string
          seller_lead_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          items?: Json
          notes?: string | null
          org_id?: string
          organization_id?: string | null
          po_number?: string
          seller_lead_id?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_changes: {
        Row: {
          change_reason: string | null
          change_type: string | null
          changed_at: string | null
          changed_by: string | null
          id: string
          new_value: string | null
          object_name: string | null
          object_type: string | null
          old_value: string | null
        }
        Insert: {
          change_reason?: string | null
          change_type?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_value?: string | null
          object_name?: string | null
          object_type?: string | null
          old_value?: string | null
        }
        Update: {
          change_reason?: string | null
          change_type?: string | null
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_value?: string | null
          object_name?: string | null
          object_type?: string | null
          old_value?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          organization_id: string | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          organization_id?: string | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_templates: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          org_id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          org_id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          org_id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sms_templates_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      social_posts_queue: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          error_message: string | null
          external_post_id: string | null
          id: string
          media_urls: string[] | null
          org_id: string
          organization_id: string | null
          platform: string
          scheduled_time: string | null
          seller_lead_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          media_urls?: string[] | null
          org_id: string
          organization_id?: string | null
          platform: string
          scheduled_time?: string | null
          seller_lead_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          external_post_id?: string | null
          id?: string
          media_urls?: string[] | null
          org_id?: string
          organization_id?: string | null
          platform?: string
          scheduled_time?: string | null
          seller_lead_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_queue_org_fk"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_queue_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "social_posts_queue_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
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
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      access_control_demo: {
        Row: {
          access_level: string | null
          access_summary: string | null
          accessible_buyers: number | null
          accessible_leads: number | null
          can_see_contacts: boolean | null
          can_see_financials: boolean | null
          email: string | null
          is_super_admin: boolean | null
          org_role: string | null
          test_user: string | null
        }
        Relationships: []
      }
      access_control_demo_simple: {
        Row: {
          access_level: string | null
          buyers_in_org: number | null
          email: string | null
          full_name: string | null
          leads_in_org: number | null
          org_role: string | null
          permissions_summary: string | null
          users_in_org: number | null
        }
        Relationships: []
      }
      access_control_summary: {
        Row: {
          access_level: string | null
          email: string | null
          expected_buyers_visible: number | null
          expected_leads_visible: number | null
          permissions_description: string | null
          total_buyers_in_org: number | null
          total_leads_in_org: number | null
          total_users_in_org: number | null
        }
        Relationships: []
      }
      admin_dashboard: {
        Row: {
          category: string | null
          metric: string | null
          value: string | null
        }
        Relationships: []
      }
      current_user_access: {
        Row: {
          access_level: string | null
          email: string | null
          full_name: string | null
          is_super_admin: boolean | null
          organization_id: string | null
          organization_role: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      logged_dashboard: {
        Row: {
          dashboard_section: string | null
          metric_name: string | null
          metric_value: string | null
        }
        Relationships: []
      }
      organization_directory: {
        Row: {
          first_name: string | null
          full_name: string | null
          id: string | null
          last_initial: string | null
          masked_email: string | null
          organization_id: string | null
        }
        Insert: {
          first_name?: never
          full_name?: string | null
          id?: string | null
          last_initial?: never
          masked_email?: never
          organization_id?: string | null
        }
        Update: {
          first_name?: never
          full_name?: string | null
          id?: string | null
          last_initial?: never
          masked_email?: never
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_metrics_dashboard: {
        Row: {
          dashboard_section: string | null
          metric_name: string | null
          metric_value: string | null
        }
        Relationships: []
      }
      role_based_dashboard: {
        Row: {
          dashboard_section: string | null
          metric_name: string | null
          metric_value: string | null
        }
        Relationships: []
      }
      secure_buyers: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_score: number | null
          email: string | null
          home_types: Database["public"]["Enums"]["home_type"][] | null
          id: string | null
          locations: string[] | null
          max_price: number | null
          min_price: number | null
          name: string | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_access_level: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_messenger_conversations: {
        Row: {
          buyer_id: string | null
          created_at: string | null
          created_by: string | null
          facebook_user_id: string | null
          facebook_user_name: string | null
          id: string | null
          last_message_at: string | null
          organization_id: string | null
          profile_pic_url: string | null
          seller_lead_id: string | null
          status: string | null
          user_access_level: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messenger_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "secure_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "test_secure_buyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messenger_conversations_seller_lead_id_fkey"
            columns: ["seller_lead_id"]
            isOneToOne: false
            referencedRelation: "secure_seller_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_paid: boolean | null
          is_super_admin: boolean | null
          organization_id: string | null
          status: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          updated_at: string | null
          user_access_level: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      secure_seller_leads: {
        Row: {
          address: string | null
          asking_price: number | null
          city: string | null
          condition: number | null
          created_at: string | null
          created_by: string | null
          email: string | null
          estimated_value: number | null
          home_type: Database["public"]["Enums"]["home_type"] | null
          id: string | null
          length_ft: number | null
          lot_rent: number | null
          name: string | null
          notes: string | null
          organization_id: string | null
          owed_amount: number | null
          park_owned: boolean | null
          phone: string | null
          state: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          target_offer: number | null
          updated_at: string | null
          user_access_level: string | null
          width_ft: number | null
          year_built: number | null
          zip: string | null
        }
        Relationships: []
      }
      secure_tables_summary: {
        Row: {
          creators: number | null
          organizations: number | null
          table_name: string | null
          total_records: number | null
        }
        Relationships: []
      }
      security_dashboard: {
        Row: {
          metric: string | null
          section: string | null
          value: string | null
        }
        Relationships: []
      }
      security_monitoring: {
        Row: {
          action_type: string | null
          day: string | null
          orgs_affected: number | null
          total_events: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      super_admin_dashboard: {
        Row: {
          dashboard_section: string | null
          metric_name: string | null
          metric_value: string | null
        }
        Relationships: []
      }
      test_secure_buyers: {
        Row: {
          access_level: string | null
          created_by: string | null
          id: string | null
          name: string | null
          organization_id: string | null
        }
        Insert: {
          access_level?: never
          created_by?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
        }
        Update: {
          access_level?: never
          created_by?: string | null
          id?: string | null
          name?: string | null
          organization_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_access_matrix: {
        Row: {
          access_level: string | null
          can_see_all_orgs: boolean | null
          can_see_contacts: boolean | null
          can_see_financials: boolean | null
          email: string | null
          full_name: string | null
          is_super_admin: boolean | null
          organization_id: string | null
          organization_role: string | null
          total_buyers_in_org: number | null
          total_leads_in_org: number | null
          total_users_in_org: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_personal_dashboard: {
        Row: {
          dashboard_section: string | null
          metric_name: string | null
          metric_value: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_universal_privacy: {
        Args: {
          p_id_column?: string
          p_org_column?: string
          p_table_name: string
          p_table_schema: string
        }
        Returns: string
      }
      assign_orgs_safely: { Args: never; Returns: undefined }
      can_access_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_invite_to_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_user_email: {
        Args: { viewed_user_id: string; viewer_id: string }
        Returns: boolean
      }
      compare_user_views: {
        Args: { user1_email: string; user2_email: string }
        Returns: {
          difference: number
          table_name: string
          user1_access: string
          user1_count: number
          user2_access: string
          user2_count: number
        }[]
      }
      generate_access_report: {
        Args: never
        Returns: {
          access_level: string
          buyers_count: number
          can_see_contact_data: boolean
          can_see_financial_data: boolean
          conversations_count: number
          full_name: string
          is_super_admin: boolean
          organization_role: string
          profiles_count: number
          seller_leads_count: number
          user_email: string
          user_organization_id: string
        }[]
      }
      get_dashboard_with_logging: {
        Args: never
        Returns: {
          dashboard_section: string
          metric_name: string
          metric_value: string
        }[]
      }
      get_role_based_dashboard: {
        Args: never
        Returns: {
          dashboard_section: string
          metric_name: string
          metric_value: string
        }[]
      }
      get_user_access_level: { Args: never; Returns: string }
      get_user_org:
        | { Args: never; Returns: string }
        | { Args: { _user_id: string }; Returns: string }
      has_role:
        | {
            Args: { _role: Database["public"]["Enums"]["app_role"] }
            Returns: boolean
          }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      is_admin_or_agent:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      is_super_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
      is_team_member: {
        Args: { resource_id: string; resource_type: string }
        Returns: boolean
      }
      is_tenant_admin_for_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      safe_function: { Args: never; Returns: undefined }
      safe_organization_count: { Args: never; Returns: number }
      safe_query_param: { Args: { param: string }; Returns: string }
      safe_user_count: { Args: never; Returns: number }
      sanitize_text: { Args: { input: string }; Returns: string }
      set_test_user: { Args: { user_uuid?: string }; Returns: string }
      test_user_access: {
        Args: { user_email: string }
        Returns: {
          access_level: string
          has_contact_data: boolean
          has_financial_data: boolean
          record_count: number
          table_name: string
        }[]
      }
      test_user_access_simple: {
        Args: { user_email: string }
        Returns: {
          details: string
          test_result: string
        }[]
      }
      validate_email: { Args: { email: string }; Returns: boolean }
      validate_phone: { Args: { phone: string }; Returns: boolean }
      view_as_user: {
        Args: { table_to_view?: string; user_email: string }
        Returns: Json[]
      }
      view_as_user_simple: {
        Args: { user_email: string }
        Returns: {
          has_contact_data: boolean
          has_financial_data: boolean
          record_count: number
          sample_record: Json
          table_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "viewer" | "super_admin" | "tenant_admin"
      appointment_type: "call" | "meeting" | "property_viewing" | "closing"
      expense_category:
        | "marketing"
        | "travel"
        | "repairs"
        | "legal"
        | "closing"
        | "other"
      home_type: "single" | "double" | "triple"
      lead_status:
        | "new"
        | "contacted"
        | "offer_made"
        | "under_contract"
        | "closed"
        | "lost"
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
      app_role: ["admin", "agent", "viewer", "super_admin", "tenant_admin"],
      appointment_type: ["call", "meeting", "property_viewing", "closing"],
      expense_category: [
        "marketing",
        "travel",
        "repairs",
        "legal",
        "closing",
        "other",
      ],
      home_type: ["single", "double", "triple"],
      lead_status: [
        "new",
        "contacted",
        "offer_made",
        "under_contract",
        "closed",
        "lost",
      ],
    },
  },
} as const
