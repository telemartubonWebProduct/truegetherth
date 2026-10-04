
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "admin_memberships": {
                  Row: {
                    "created_at": string,"deactivated_at": string | null,"granted_by": string | null,"is_active": boolean,"note": string | null,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "created_at"?: string,"deactivated_at"?: string | null,"granted_by"?: string | null,"is_active"?: boolean,"note"?: string | null,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"deactivated_at"?: string | null,"granted_by"?: string | null,"is_active"?: boolean,"note"?: string | null,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action": string,"actor_user_id": string | null,"id": number,"metadata": NonNullable<Json>,"occurred_at": string,"target_id": string | null,"target_type": string | null
                  }
                  Insert: {
                    "action": string,"actor_user_id"?: string | null,"id"?: never,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_user_id"?: string | null,"id"?: never,"metadata"?: NonNullable<Json>,"occurred_at"?: string,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"content_drafts": {
                  Row: {
                    "body": NonNullable<Json>,"created_at": string,"document_id": string,"revision": number,"schema_version": number,"updated_at": string,"updated_by": string | null
                  }
                  Insert: {
                    "body": NonNullable<Json>,"created_at"?: string,"document_id": string,"revision"?: number,"schema_version": number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "body"?: NonNullable<Json>,"created_at"?: string,"document_id"?: string,"revision"?: number,"schema_version"?: number,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"content_publication": {
                  Row: {
                    "published_at": string,"published_by": string | null,"release_number": number,"singleton": boolean
                  }
                  Insert: {
                    "published_at"?: string,"published_by"?: string | null,"release_number": number,"singleton"?: boolean
                  }
                  Update: {
                    "published_at"?: string,"published_by"?: string | null,"release_number"?: number,"singleton"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "content_publication_release_number_fkey"
      columns: ["release_number"]
isOneToOne: false
      referencedRelation: "content_releases"
      referencedColumns: ["number"]
    }
                  ]
                },"content_releases": {
                  Row: {
                    "content": NonNullable<Json>,"created_at": string,"created_by": string | null,"created_by_email": string | null,"id": number,"kind": string,"note": string | null,"number": number,"restored_from": number | null,"schema_version": number
                  }
                  Insert: {
                    "content": NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"created_by_email"?: string | null,"id"?: never,"kind": string,"note"?: string | null,"number": number,"restored_from"?: number | null,"schema_version": number
                  }
                  Update: {
                    "content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"created_by_email"?: string | null,"id"?: never,"kind"?: string,"note"?: string | null,"number"?: number,"restored_from"?: number | null,"schema_version"?: number
                  }
                  Relationships: [
                    
                  ]
                },"lead_events": {
                  Row: {
                    "actor_email": string | null,"actor_user_id": string | null,"changes": NonNullable<Json>,"details": Json | null,"id": number,"idempotency_key": string | null,"kind": string,"lead_id": string,"note": string | null,"occurred_at": string
                  }
                  Insert: {
                    "actor_email"?: string | null,"actor_user_id"?: string | null,"changes"?: NonNullable<Json>,"details"?: Json | null,"id"?: never,"idempotency_key"?: string | null,"kind": string,"lead_id": string,"note"?: string | null,"occurred_at"?: string
                  }
                  Update: {
                    "actor_email"?: string | null,"actor_user_id"?: string | null,"changes"?: NonNullable<Json>,"details"?: Json | null,"id"?: never,"idempotency_key"?: string | null,"kind"?: string,"lead_id"?: string,"note"?: string | null,"occurred_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "lead_events_lead_id_fkey"
      columns: ["lead_id"]
isOneToOne: false
      referencedRelation: "leads"
      referencedColumns: ["id"]
    }
                  ]
                },"lead_intake_log": {
                  Row: {
                    "at": string,"client_hash": string,"id": number
                  }
                  Insert: {
                    "at"?: string,"client_hash": string,"id"?: never
                  }
                  Update: {
                    "at"?: string,"client_hash"?: string,"id"?: never
                  }
                  Relationships: [
                    
                  ]
                },"leads": {
                  Row: {
                    "anonymised_at": string | null,"area": string | null,"area_check": string,"closed_at": string | null,"consent_version": string,"created_at": string,"follow_up_on": string | null,"id": string,"idempotency_key": string,"locale": string,"name": string | null,"note": string | null,"outcome": string | null,"package_id": string | null,"phone": string | null,"preferred_time": string,"province": string,"resubmitted_at": string | null,"service": string,"source_path": string | null,"status": string,"updated_at": string,"utm": NonNullable<Json>
                  }
                  Insert: {
                    "anonymised_at"?: string | null,"area"?: string | null,"area_check"?: string,"closed_at"?: string | null,"consent_version": string,"created_at"?: string,"follow_up_on"?: string | null,"id"?: string,"idempotency_key": string,"locale": string,"name"?: string | null,"note"?: string | null,"outcome"?: string | null,"package_id"?: string | null,"phone"?: string | null,"preferred_time": string,"province": string,"resubmitted_at"?: string | null,"service": string,"source_path"?: string | null,"status"?: string,"updated_at"?: string,"utm"?: NonNullable<Json>
                  }
                  Update: {
                    "anonymised_at"?: string | null,"area"?: string | null,"area_check"?: string,"closed_at"?: string | null,"consent_version"?: string,"created_at"?: string,"follow_up_on"?: string | null,"id"?: string,"idempotency_key"?: string,"locale"?: string,"name"?: string | null,"note"?: string | null,"outcome"?: string | null,"package_id"?: string | null,"phone"?: string | null,"preferred_time"?: string,"province"?: string,"resubmitted_at"?: string | null,"service"?: string,"source_path"?: string | null,"status"?: string,"updated_at"?: string,"utm"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "anonymise_lead":
{ Args: { "p_lead": string,"p_reason": string }; Returns: undefined
                           },
"discard_content_draft":
{ Args: { "p_document_id": string,"p_expected_revision": number }; Returns: undefined
                           },
"publish_content":
{ Args: { "p_based_on": number,"p_content": Json,"p_documents": Json,"p_note"?: string,"p_schema_version": number }; Returns: number
                           },
"published_content":
{ Args: Record<PropertyKey, never>; Returns: {
              "content": Json,"number": number,"published_at": string,"schema_version": number
            }[]
                           },
"rollback_content":
{ Args: { "p_based_on": number,"p_note"?: string,"p_release": number }; Returns: number
                           },
"save_content_draft":
{ Args: { "p_body": Json,"p_document_id": string,"p_expected_revision": number,"p_schema_version": number }; Returns: {
              "revision": number,"updated_at": string
            }[]
                           },
"submit_lead":
{ Args: { "p_area"?: string,"p_client_hash": string,"p_consent_version": string,"p_idempotency_key": string,"p_locale": string,"p_name": string,"p_note"?: string,"p_package_id"?: string,"p_phone": string,"p_preferred_time": string,"p_province": string,"p_service": string,"p_source_path"?: string,"p_utm"?: Json }; Returns: {
              "lead_id": string,"outcome": string
            }[]
                           },
"update_lead":
{ Args: { "p_area_check": string,"p_follow_up_on"?: string,"p_lead": string,"p_note"?: string,"p_outcome"?: string,"p_seen_updated_at": string,"p_status": string }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const

