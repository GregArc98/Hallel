// Gerado pelo Supabase (generate_typescript_types). Não edite à mão:
// após mudar o esquema, gere de novo (ver README).
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      culto: {
        Row: {
          atualizado_em: string
          criado_em: string
          data: string
          escala_publicada: boolean
          escala_publicada_em: string | null
          horario: string | null
          id: string
          igreja_id: string
          observacoes: string | null
          periodo: Database["public"]["Enums"]["periodo"]
          repertorio_publicado: boolean
          repertorio_publicado_em: string | null
          tipo: Database["public"]["Enums"]["tipo_culto"]
          titulo: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          data: string
          escala_publicada?: boolean
          escala_publicada_em?: string | null
          horario?: string | null
          id?: string
          igreja_id: string
          observacoes?: string | null
          periodo: Database["public"]["Enums"]["periodo"]
          repertorio_publicado?: boolean
          repertorio_publicado_em?: string | null
          tipo?: Database["public"]["Enums"]["tipo_culto"]
          titulo?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          data?: string
          escala_publicada?: boolean
          escala_publicada_em?: string | null
          horario?: string | null
          id?: string
          igreja_id?: string
          observacoes?: string | null
          periodo?: Database["public"]["Enums"]["periodo"]
          repertorio_publicado?: boolean
          repertorio_publicado_em?: string | null
          tipo?: Database["public"]["Enums"]["tipo_culto"]
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "culto_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igreja"
            referencedColumns: ["id"]
          },
        ]
      }
      escala_item: {
        Row: {
          criado_em: string
          culto_id: string
          funcao_id: string
          id: string
          igreja_id: string
          integrante_id: string
          posicao: number
        }
        Insert: {
          criado_em?: string
          culto_id: string
          funcao_id: string
          id?: string
          igreja_id: string
          integrante_id: string
          posicao?: number
        }
        Update: {
          criado_em?: string
          culto_id?: string
          funcao_id?: string
          id?: string
          igreja_id?: string
          integrante_id?: string
          posicao?: number
        }
        Relationships: [
          {
            foreignKeyName: "escala_item_culto_id_igreja_id_fkey"
            columns: ["culto_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "culto"
            referencedColumns: ["id", "igreja_id"]
          },
          {
            foreignKeyName: "escala_item_funcao_id_igreja_id_fkey"
            columns: ["funcao_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "funcao"
            referencedColumns: ["id", "igreja_id"]
          },
          {
            foreignKeyName: "escala_item_integrante_id_igreja_id_fkey"
            columns: ["integrante_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "integrante"
            referencedColumns: ["id", "igreja_id"]
          },
        ]
      }
      funcao: {
        Row: {
          criado_em: string
          id: string
          igreja_id: string
          max_por_culto: number
          modo_padrao: Database["public"]["Enums"]["modo_exibicao"]
          nome: string
          ordem: number
        }
        Insert: {
          criado_em?: string
          id?: string
          igreja_id: string
          max_por_culto?: number
          modo_padrao?: Database["public"]["Enums"]["modo_exibicao"]
          nome: string
          ordem?: number
        }
        Update: {
          criado_em?: string
          id?: string
          igreja_id?: string
          max_por_culto?: number
          modo_padrao?: Database["public"]["Enums"]["modo_exibicao"]
          nome?: string
          ordem?: number
        }
        Relationships: [
          {
            foreignKeyName: "funcao_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igreja"
            referencedColumns: ["id"]
          },
        ]
      }
      igreja: {
        Row: {
          atualizado_em: string
          criado_em: string
          fuso_horario: string
          id: string
          nome: string
          slug: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          fuso_horario?: string
          id?: string
          nome: string
          slug: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          fuso_horario?: string
          id?: string
          nome?: string
          slug?: string
        }
        Relationships: []
      }
      indisponibilidade: {
        Row: {
          criado_em: string
          data: string
          id: string
          igreja_id: string
          integrante_id: string
          motivo: string | null
          periodo: Database["public"]["Enums"]["periodo"] | null
        }
        Insert: {
          criado_em?: string
          data: string
          id?: string
          igreja_id: string
          integrante_id: string
          motivo?: string | null
          periodo?: Database["public"]["Enums"]["periodo"] | null
        }
        Update: {
          criado_em?: string
          data?: string
          id?: string
          igreja_id?: string
          integrante_id?: string
          motivo?: string | null
          periodo?: Database["public"]["Enums"]["periodo"] | null
        }
        Relationships: [
          {
            foreignKeyName: "indisponibilidade_integrante_id_igreja_id_fkey"
            columns: ["integrante_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "integrante"
            referencedColumns: ["id", "igreja_id"]
          },
        ]
      }
      integrante: {
        Row: {
          ativo: boolean
          atualizado_em: string
          criado_em: string
          email: string | null
          id: string
          igreja_id: string
          nome: string
          papel: Database["public"]["Enums"]["papel"]
          telefone: string | null
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id?: string
          igreja_id: string
          nome: string
          papel?: Database["public"]["Enums"]["papel"]
          telefone?: string | null
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          criado_em?: string
          email?: string | null
          id?: string
          igreja_id?: string
          nome?: string
          papel?: Database["public"]["Enums"]["papel"]
          telefone?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integrante_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igreja"
            referencedColumns: ["id"]
          },
        ]
      }
      integrante_funcao: {
        Row: {
          funcao_id: string
          igreja_id: string
          integrante_id: string
          periodo: Database["public"]["Enums"]["periodo"]
        }
        Insert: {
          funcao_id: string
          igreja_id: string
          integrante_id: string
          periodo: Database["public"]["Enums"]["periodo"]
        }
        Update: {
          funcao_id?: string
          igreja_id?: string
          integrante_id?: string
          periodo?: Database["public"]["Enums"]["periodo"]
        }
        Relationships: [
          {
            foreignKeyName: "integrante_funcao_funcao_id_igreja_id_fkey"
            columns: ["funcao_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "funcao"
            referencedColumns: ["id", "igreja_id"]
          },
          {
            foreignKeyName: "integrante_funcao_integrante_id_igreja_id_fkey"
            columns: ["integrante_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "integrante"
            referencedColumns: ["id", "igreja_id"]
          },
        ]
      }
      musica: {
        Row: {
          artista: string | null
          atualizado_em: string
          audio_url: string | null
          audio_url_externo: string | null
          bpm: number | null
          busca: string | null
          cifra: string | null
          criado_em: string
          criado_por: string | null
          hinario_numero: number | null
          hinario_sigla: string | null
          id: string
          igreja_id: string
          letra: string | null
          observacoes: string | null
          tags: string[]
          tem_cifra: boolean | null
          titulo: string
          tom_original: string | null
          youtube_url: string | null
        }
        Insert: {
          artista?: string | null
          atualizado_em?: string
          audio_url?: string | null
          audio_url_externo?: string | null
          bpm?: number | null
          busca?: string | null
          cifra?: string | null
          criado_em?: string
          criado_por?: string | null
          hinario_numero?: number | null
          hinario_sigla?: string | null
          id?: string
          igreja_id: string
          letra?: string | null
          observacoes?: string | null
          tags?: string[]
          tem_cifra?: boolean | null
          titulo: string
          tom_original?: string | null
          youtube_url?: string | null
        }
        Update: {
          artista?: string | null
          atualizado_em?: string
          audio_url?: string | null
          audio_url_externo?: string | null
          bpm?: number | null
          busca?: string | null
          cifra?: string | null
          criado_em?: string
          criado_por?: string | null
          hinario_numero?: number | null
          hinario_sigla?: string | null
          id?: string
          igreja_id?: string
          letra?: string | null
          observacoes?: string | null
          tags?: string[]
          tem_cifra?: boolean | null
          titulo?: string
          tom_original?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "musica_igreja_id_fkey"
            columns: ["igreja_id"]
            isOneToOne: false
            referencedRelation: "igreja"
            referencedColumns: ["id"]
          },
        ]
      }
      setlist_item: {
        Row: {
          criado_em: string
          culto_id: string
          id: string
          igreja_id: string
          musica_id: string
          observacao: string | null
          ordem: number
          tom: string | null
        }
        Insert: {
          criado_em?: string
          culto_id: string
          id?: string
          igreja_id: string
          musica_id: string
          observacao?: string | null
          ordem: number
          tom?: string | null
        }
        Update: {
          criado_em?: string
          culto_id?: string
          id?: string
          igreja_id?: string
          musica_id?: string
          observacao?: string | null
          ordem?: number
          tom?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "setlist_item_culto_id_igreja_id_fkey"
            columns: ["culto_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "culto"
            referencedColumns: ["id", "igreja_id"]
          },
          {
            foreignKeyName: "setlist_item_musica_id_igreja_id_fkey"
            columns: ["musica_id", "igreja_id"]
            isOneToOne: false
            referencedRelation: "musica"
            referencedColumns: ["id", "igreja_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      sem_acento: { Args: { texto: string }; Returns: string }
    }
    Enums: {
      modo_exibicao: "cifra" | "letra"
      papel: "admin" | "membro"
      periodo: "manha" | "noite"
      tipo_culto: "regular" | "avulso"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

/** Linha de uma tabela: Tables<"musica">. */
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T]

export const Constants = {
  public: {
    Enums: {
      modo_exibicao: ["cifra", "letra"],
      papel: ["admin", "membro"],
      periodo: ["manha", "noite"],
      tipo_culto: ["regular", "avulso"],
    },
  },
} as const
