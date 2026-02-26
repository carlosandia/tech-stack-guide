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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      anotacoes_oportunidades: {
        Row: {
          atualizado_em: string
          audio_duracao_segundos: number | null
          audio_url: string | null
          conteudo: string | null
          criado_em: string
          deletado_em: string | null
          id: string
          oportunidade_id: string
          organizacao_id: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          audio_duracao_segundos?: number | null
          audio_url?: string | null
          conteudo?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          oportunidade_id: string
          organizacao_id: string
          tipo?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          audio_duracao_segundos?: number | null
          audio_url?: string | null
          conteudo?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          oportunidade_id?: string
          organizacao_id?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anotacoes_oportunidades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anotacoes_oportunidades_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anotacoes_oportunidades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      assinaturas: {
        Row: {
          atualizado_em: string
          cancelado_em: string | null
          cortesia: boolean | null
          cortesia_duracao_meses: number | null
          cortesia_fim: string | null
          cortesia_inicio: string | null
          cortesia_motivo: string | null
          criado_em: string
          expira_em: string | null
          id: string
          inicio_em: string
          motivo_cancelamento: string | null
          organizacao_id: string
          periodo: string
          plano_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_fim: string | null
          trial_inicio: string | null
        }
        Insert: {
          atualizado_em?: string
          cancelado_em?: string | null
          cortesia?: boolean | null
          cortesia_duracao_meses?: number | null
          cortesia_fim?: string | null
          cortesia_inicio?: string | null
          cortesia_motivo?: string | null
          criado_em?: string
          expira_em?: string | null
          id?: string
          inicio_em?: string
          motivo_cancelamento?: string | null
          organizacao_id: string
          periodo?: string
          plano_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_fim?: string | null
          trial_inicio?: string | null
        }
        Update: {
          atualizado_em?: string
          cancelado_em?: string | null
          cortesia?: boolean | null
          cortesia_duracao_meses?: number | null
          cortesia_fim?: string | null
          cortesia_inicio?: string | null
          cortesia_motivo?: string | null
          criado_em?: string
          expira_em?: string | null
          id?: string
          inicio_em?: string
          motivo_cancelamento?: string | null
          organizacao_id?: string
          periodo?: string
          plano_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_fim?: string | null
          trial_inicio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assinaturas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assinaturas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          correlation_id: string | null
          criado_em: string
          dados_anteriores: Json | null
          dados_novos: Json | null
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          erro_mensagem: string | null
          id: string
          ip: unknown
          organizacao_id: string | null
          request_id: string | null
          request_method: string | null
          request_path: string | null
          sucesso: boolean | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          correlation_id?: string | null
          criado_em?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          erro_mensagem?: string | null
          id?: string
          ip?: unknown
          organizacao_id?: string | null
          request_id?: string | null
          request_method?: string | null
          request_path?: string | null
          sucesso?: boolean | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          correlation_id?: string | null
          criado_em?: string
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          erro_mensagem?: string | null
          id?: string
          ip?: unknown
          organizacao_id?: string | null
          request_id?: string | null
          request_method?: string | null
          request_path?: string | null
          sucesso?: boolean | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: []
      }
      automacoes: {
        Row: {
          acoes: Json
          ativo: boolean
          atualizado_em: string
          condicoes: Json
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          execucoes_ultima_hora: number
          id: string
          max_execucoes_hora: number
          nome: string
          organizacao_id: string
          total_erros: number
          total_execucoes: number
          trigger_config: Json
          trigger_tipo: string
          ultima_execucao_em: string | null
        }
        Insert: {
          acoes?: Json
          ativo?: boolean
          atualizado_em?: string
          condicoes?: Json
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          execucoes_ultima_hora?: number
          id?: string
          max_execucoes_hora?: number
          nome: string
          organizacao_id: string
          total_erros?: number
          total_execucoes?: number
          trigger_config?: Json
          trigger_tipo: string
          ultima_execucao_em?: string | null
        }
        Update: {
          acoes?: Json
          ativo?: boolean
          atualizado_em?: string
          condicoes?: Json
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          execucoes_ultima_hora?: number
          id?: string
          max_execucoes_hora?: number
          nome?: string
          organizacao_id?: string
          total_erros?: number
          total_execucoes?: number
          trigger_config?: Json
          trigger_tipo?: string
          ultima_execucao_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automacoes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automacoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      campos_customizados: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          entidade: string
          id: string
          nome: string
          obrigatorio: boolean | null
          opcoes: Json | null
          ordem: number | null
          organizacao_id: string
          placeholder: string | null
          sistema: boolean | null
          slug: string
          tipo: string
          validacoes: Json | null
          valor_padrao: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          entidade: string
          id?: string
          nome: string
          obrigatorio?: boolean | null
          opcoes?: Json | null
          ordem?: number | null
          organizacao_id: string
          placeholder?: string | null
          sistema?: boolean | null
          slug: string
          tipo: string
          validacoes?: Json | null
          valor_padrao?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          entidade?: string
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          opcoes?: Json | null
          ordem?: number | null
          organizacao_id?: string
          placeholder?: string | null
          sistema?: boolean | null
          slug?: string
          tipo?: string
          validacoes?: Json | null
          valor_padrao?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campos_customizados_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campos_customizados_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      campos_formularios: {
        Row: {
          alternativa_para_campo_id: string | null
          atualizado_em: string
          coluna_indice: number | null
          condicional_ativo: boolean
          condicional_campo_id: string | null
          condicional_operador: string | null
          condicional_valor: string | null
          criado_em: string
          etapa_numero: number | null
          formulario_id: string
          id: string
          label: string
          largura: string
          mapeamento_campo: string | null
          mostrar_para_leads_conhecidos: boolean | null
          nome: string
          obrigatorio: boolean
          opcoes: Json | null
          ordem: number
          pai_campo_id: string | null
          placeholder: string | null
          prefill_ativo: boolean | null
          prefill_chave: string | null
          prefill_fonte: string | null
          prioridade_profiling: number | null
          regras_pontuacao: Json | null
          texto_ajuda: string | null
          tipo: string
          validacoes: Json | null
          valor_padrao: string | null
          valor_pontuacao: number | null
        }
        Insert: {
          alternativa_para_campo_id?: string | null
          atualizado_em?: string
          coluna_indice?: number | null
          condicional_ativo?: boolean
          condicional_campo_id?: string | null
          condicional_operador?: string | null
          condicional_valor?: string | null
          criado_em?: string
          etapa_numero?: number | null
          formulario_id: string
          id?: string
          label: string
          largura?: string
          mapeamento_campo?: string | null
          mostrar_para_leads_conhecidos?: boolean | null
          nome: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          pai_campo_id?: string | null
          placeholder?: string | null
          prefill_ativo?: boolean | null
          prefill_chave?: string | null
          prefill_fonte?: string | null
          prioridade_profiling?: number | null
          regras_pontuacao?: Json | null
          texto_ajuda?: string | null
          tipo?: string
          validacoes?: Json | null
          valor_padrao?: string | null
          valor_pontuacao?: number | null
        }
        Update: {
          alternativa_para_campo_id?: string | null
          atualizado_em?: string
          coluna_indice?: number | null
          condicional_ativo?: boolean
          condicional_campo_id?: string | null
          condicional_operador?: string | null
          condicional_valor?: string | null
          criado_em?: string
          etapa_numero?: number | null
          formulario_id?: string
          id?: string
          label?: string
          largura?: string
          mapeamento_campo?: string | null
          mostrar_para_leads_conhecidos?: boolean | null
          nome?: string
          obrigatorio?: boolean
          opcoes?: Json | null
          ordem?: number
          pai_campo_id?: string | null
          placeholder?: string | null
          prefill_ativo?: boolean | null
          prefill_chave?: string | null
          prefill_fonte?: string | null
          prioridade_profiling?: number | null
          regras_pontuacao?: Json | null
          texto_ajuda?: string | null
          tipo?: string
          validacoes?: Json | null
          valor_padrao?: string | null
          valor_pontuacao?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campos_formularios_alternativa_para_campo_id_fkey"
            columns: ["alternativa_para_campo_id"]
            isOneToOne: false
            referencedRelation: "campos_formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campos_formularios_condicional_campo_id_fkey"
            columns: ["condicional_campo_id"]
            isOneToOne: false
            referencedRelation: "campos_formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campos_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campos_formularios_pai_campo_id_fkey"
            columns: ["pai_campo_id"]
            isOneToOne: false
            referencedRelation: "campos_formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_produtos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          cor: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          organizacao_id: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          organizacao_id: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_produtos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categorias_produtos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_sessions_pendentes: {
        Row: {
          concluido_em: string | null
          criado_em: string | null
          customer_email: string
          id: string
          is_trial: boolean | null
          metadata: Json | null
          plano_id: string | null
          status: string | null
          stripe_session_id: string
        }
        Insert: {
          concluido_em?: string | null
          criado_em?: string | null
          customer_email: string
          id?: string
          is_trial?: boolean | null
          metadata?: Json | null
          plano_id?: string | null
          status?: string | null
          stripe_session_id: string
        }
        Update: {
          concluido_em?: string | null
          criado_em?: string | null
          customer_email?: string
          id?: string
          is_trial?: boolean | null
          metadata?: Json | null
          plano_id?: string | null
          status?: string | null
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_sessions_pendentes_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      comissoes_parceiro: {
        Row: {
          criado_em: string
          id: string
          indicacao_id: string
          observacoes: string | null
          pago_em: string | null
          parceiro_id: string
          percentual_aplicado: number
          periodo_ano: number
          periodo_mes: number
          status: string
          valor_assinatura: number
          valor_comissao: number
        }
        Insert: {
          criado_em?: string
          id?: string
          indicacao_id: string
          observacoes?: string | null
          pago_em?: string | null
          parceiro_id: string
          percentual_aplicado: number
          periodo_ano: number
          periodo_mes: number
          status?: string
          valor_assinatura: number
          valor_comissao: number
        }
        Update: {
          criado_em?: string
          id?: string
          indicacao_id?: string
          observacoes?: string | null
          pago_em?: string | null
          parceiro_id?: string
          percentual_aplicado?: number
          periodo_ano?: number
          periodo_mes?: number
          status?: string
          valor_assinatura?: number
          valor_comissao?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_parceiro_indicacao_id_fkey"
            columns: ["indicacao_id"]
            isOneToOne: false
            referencedRelation: "indicacoes_parceiro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_parceiro_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      conexoes_api4com: {
        Row: {
          access_token_encrypted: string
          api_url: string
          atualizado_em: string
          conectado_em: string | null
          criado_em: string
          deletado_em: string | null
          id: string
          organizacao_id: string
          status: string
          ultimo_erro: string | null
        }
        Insert: {
          access_token_encrypted: string
          api_url?: string
          atualizado_em?: string
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          organizacao_id: string
          status?: string
          ultimo_erro?: string | null
        }
        Update: {
          access_token_encrypted?: string
          api_url?: string
          atualizado_em?: string
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          organizacao_id?: string
          status?: string
          ultimo_erro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conexoes_api4com_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      conexoes_email: {
        Row: {
          access_token_encrypted: string | null
          atualizado_em: string
          conectado_em: string | null
          criado_em: string
          deletado_em: string | null
          email: string
          google_user_id: string | null
          id: string
          nome_remetente: string | null
          organizacao_id: string
          refresh_token_encrypted: string | null
          smtp_auto_detected: boolean | null
          smtp_host: string | null
          smtp_pass_encrypted: string | null
          smtp_port: number | null
          smtp_tls: boolean | null
          smtp_user: string | null
          status: string
          tipo: string
          token_expires_at: string | null
          total_emails_enviados: number | null
          ultimo_envio: string | null
          ultimo_erro: string | null
          usuario_id: string
        }
        Insert: {
          access_token_encrypted?: string | null
          atualizado_em?: string
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          email: string
          google_user_id?: string | null
          id?: string
          nome_remetente?: string | null
          organizacao_id: string
          refresh_token_encrypted?: string | null
          smtp_auto_detected?: boolean | null
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_tls?: boolean | null
          smtp_user?: string | null
          status?: string
          tipo: string
          token_expires_at?: string | null
          total_emails_enviados?: number | null
          ultimo_envio?: string | null
          ultimo_erro?: string | null
          usuario_id: string
        }
        Update: {
          access_token_encrypted?: string | null
          atualizado_em?: string
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          email?: string
          google_user_id?: string | null
          id?: string
          nome_remetente?: string | null
          organizacao_id?: string
          refresh_token_encrypted?: string | null
          smtp_auto_detected?: boolean | null
          smtp_host?: string | null
          smtp_pass_encrypted?: string | null
          smtp_port?: number | null
          smtp_tls?: boolean | null
          smtp_user?: string | null
          status?: string
          tipo?: string
          token_expires_at?: string | null
          total_emails_enviados?: number | null
          ultimo_envio?: string | null
          ultimo_erro?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conexoes_email_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conexoes_email_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conexoes_google: {
        Row: {
          access_token_encrypted: string
          atualizado_em: string
          calendar_id: string | null
          calendar_name: string | null
          conectado_em: string | null
          criado_em: string
          criar_google_meet: boolean | null
          deletado_em: string | null
          google_user_email: string | null
          google_user_id: string | null
          google_user_name: string | null
          id: string
          organizacao_id: string
          refresh_token_encrypted: string | null
          sincronizar_eventos: boolean | null
          status: string
          token_expires_at: string | null
          ultimo_erro: string | null
          ultimo_sync: string | null
          usuario_id: string
        }
        Insert: {
          access_token_encrypted: string
          atualizado_em?: string
          calendar_id?: string | null
          calendar_name?: string | null
          conectado_em?: string | null
          criado_em?: string
          criar_google_meet?: boolean | null
          deletado_em?: string | null
          google_user_email?: string | null
          google_user_id?: string | null
          google_user_name?: string | null
          id?: string
          organizacao_id: string
          refresh_token_encrypted?: string | null
          sincronizar_eventos?: boolean | null
          status?: string
          token_expires_at?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
          usuario_id: string
        }
        Update: {
          access_token_encrypted?: string
          atualizado_em?: string
          calendar_id?: string | null
          calendar_name?: string | null
          conectado_em?: string | null
          criado_em?: string
          criar_google_meet?: boolean | null
          deletado_em?: string | null
          google_user_email?: string | null
          google_user_id?: string | null
          google_user_name?: string | null
          id?: string
          organizacao_id?: string
          refresh_token_encrypted?: string | null
          sincronizar_eventos?: boolean | null
          status?: string
          token_expires_at?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conexoes_google_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conexoes_google_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conexoes_instagram: {
        Row: {
          access_token_encrypted: string
          account_type: string | null
          atualizado_em: string
          conectado_em: string | null
          criado_em: string
          deletado_em: string | null
          id: string
          instagram_name: string | null
          instagram_user_id: string
          instagram_username: string | null
          organizacao_id: string
          permissions: string[] | null
          profile_picture_url: string | null
          status: string
          token_expires_at: string | null
          token_type: string | null
          total_mensagens_enviadas: number | null
          total_mensagens_recebidas: number | null
          ultima_mensagem_em: string | null
          ultimo_erro: string | null
          ultimo_sync: string | null
          usuario_id: string
          webhook_subscribed: boolean | null
        }
        Insert: {
          access_token_encrypted: string
          account_type?: string | null
          atualizado_em?: string
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          instagram_name?: string | null
          instagram_user_id: string
          instagram_username?: string | null
          organizacao_id: string
          permissions?: string[] | null
          profile_picture_url?: string | null
          status?: string
          token_expires_at?: string | null
          token_type?: string | null
          total_mensagens_enviadas?: number | null
          total_mensagens_recebidas?: number | null
          ultima_mensagem_em?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
          usuario_id: string
          webhook_subscribed?: boolean | null
        }
        Update: {
          access_token_encrypted?: string
          account_type?: string | null
          atualizado_em?: string
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          instagram_name?: string | null
          instagram_user_id?: string
          instagram_username?: string | null
          organizacao_id?: string
          permissions?: string[] | null
          profile_picture_url?: string | null
          status?: string
          token_expires_at?: string | null
          token_type?: string | null
          total_mensagens_enviadas?: number | null
          total_mensagens_recebidas?: number | null
          ultima_mensagem_em?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
          usuario_id?: string
          webhook_subscribed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "conexoes_instagram_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conexoes_instagram_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conexoes_meta: {
        Row: {
          access_token_encrypted: string
          atualizado_em: string
          criado_em: string
          deletado_em: string | null
          id: string
          meta_business_name: string | null
          meta_user_email: string | null
          meta_user_id: string | null
          meta_user_name: string | null
          organizacao_id: string
          refresh_token_encrypted: string | null
          status: string
          token_expires_at: string | null
          ultimo_erro: string | null
          ultimo_sync: string | null
        }
        Insert: {
          access_token_encrypted: string
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          id?: string
          meta_business_name?: string | null
          meta_user_email?: string | null
          meta_user_id?: string | null
          meta_user_name?: string | null
          organizacao_id: string
          refresh_token_encrypted?: string | null
          status?: string
          token_expires_at?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
        }
        Update: {
          access_token_encrypted?: string
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          id?: string
          meta_business_name?: string | null
          meta_user_email?: string | null
          meta_user_id?: string | null
          meta_user_name?: string | null
          organizacao_id?: string
          refresh_token_encrypted?: string | null
          status?: string
          token_expires_at?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conexoes_meta_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_conversions_api: {
        Row: {
          access_token_encrypted: string
          ativo: boolean | null
          atualizado_em: string
          config_eventos: Json | null
          criado_em: string
          eventos_habilitados: Json
          id: string
          organizacao_id: string
          pixel_id: string
          total_eventos_enviados: number | null
          total_eventos_sucesso: number | null
          ultimo_evento_enviado: string | null
          ultimo_teste: string | null
          ultimo_teste_sucesso: boolean | null
        }
        Insert: {
          access_token_encrypted: string
          ativo?: boolean | null
          atualizado_em?: string
          config_eventos?: Json | null
          criado_em?: string
          eventos_habilitados?: Json
          id?: string
          organizacao_id: string
          pixel_id: string
          total_eventos_enviados?: number | null
          total_eventos_sucesso?: number | null
          ultimo_evento_enviado?: string | null
          ultimo_teste?: string | null
          ultimo_teste_sucesso?: boolean | null
        }
        Update: {
          access_token_encrypted?: string
          ativo?: boolean | null
          atualizado_em?: string
          config_eventos?: Json | null
          criado_em?: string
          eventos_habilitados?: Json
          id?: string
          organizacao_id?: string
          pixel_id?: string
          total_eventos_enviados?: number | null
          total_eventos_sucesso?: number | null
          ultimo_evento_enviado?: string | null
          ultimo_teste?: string | null
          ultimo_teste_sucesso?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "config_conversions_api_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      config_newsletter_formularios: {
        Row: {
          assunto_boas_vindas: string | null
          assunto_email_confirmacao: string | null
          atualizado_em: string | null
          criado_em: string | null
          descricao_frequencia_envio: string | null
          double_optin_ativo: boolean | null
          email_boas_vindas_ativo: boolean | null
          formulario_id: string
          frequencia_envio: string | null
          id: string
          id_lista_externa: string | null
          mostrar_checkbox_consentimento: boolean | null
          newsletter_imagem_link: string | null
          newsletter_imagem_url: string | null
          newsletter_layout: string
          nome_lista: string | null
          provedor_externo: string | null
          ref_api_key_externa: string | null
          tags: Json | null
          template_boas_vindas: string | null
          template_email_confirmacao: string | null
          texto_consentimento: string | null
          url_politica_privacidade: string | null
        }
        Insert: {
          assunto_boas_vindas?: string | null
          assunto_email_confirmacao?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao_frequencia_envio?: string | null
          double_optin_ativo?: boolean | null
          email_boas_vindas_ativo?: boolean | null
          formulario_id: string
          frequencia_envio?: string | null
          id?: string
          id_lista_externa?: string | null
          mostrar_checkbox_consentimento?: boolean | null
          newsletter_imagem_link?: string | null
          newsletter_imagem_url?: string | null
          newsletter_layout?: string
          nome_lista?: string | null
          provedor_externo?: string | null
          ref_api_key_externa?: string | null
          tags?: Json | null
          template_boas_vindas?: string | null
          template_email_confirmacao?: string | null
          texto_consentimento?: string | null
          url_politica_privacidade?: string | null
        }
        Update: {
          assunto_boas_vindas?: string | null
          assunto_email_confirmacao?: string | null
          atualizado_em?: string | null
          criado_em?: string | null
          descricao_frequencia_envio?: string | null
          double_optin_ativo?: boolean | null
          email_boas_vindas_ativo?: boolean | null
          formulario_id?: string
          frequencia_envio?: string | null
          id?: string
          id_lista_externa?: string | null
          mostrar_checkbox_consentimento?: boolean | null
          newsletter_imagem_link?: string | null
          newsletter_imagem_url?: string | null
          newsletter_layout?: string
          nome_lista?: string | null
          provedor_externo?: string | null
          ref_api_key_externa?: string | null
          tags?: Json | null
          template_boas_vindas?: string | null
          template_email_confirmacao?: string | null
          texto_consentimento?: string | null
          url_politica_privacidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_newsletter_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: true
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      config_popup_formularios: {
        Row: {
          ativo_a_partir_de: string | null
          ativo_ate: string | null
          atraso_segundos: number | null
          atualizado_em: string | null
          clique_overlay_fecha: boolean | null
          cor_fundo_overlay: string | null
          criado_em: string | null
          delay_botao_fechar: number | null
          dias_expiracao_cookie: number | null
          duracao_animacao_ms: number | null
          formulario_id: string
          frequencia_exibicao: string | null
          id: string
          max_exibicoes: number | null
          mostrar_botao_fechar: boolean | null
          mostrar_mobile: boolean | null
          mostrar_uma_vez_sessao: boolean | null
          paginas_alvo: string[] | null
          paginas_excluidas: string[] | null
          popup_imagem_link: string | null
          popup_imagem_posicao: string | null
          popup_imagem_url: string | null
          porcentagem_scroll: number | null
          posicao: string | null
          seletor_elemento_clique: string | null
          tipo_animacao: string | null
          tipo_gatilho: string
          utm_filtro: Json | null
        }
        Insert: {
          ativo_a_partir_de?: string | null
          ativo_ate?: string | null
          atraso_segundos?: number | null
          atualizado_em?: string | null
          clique_overlay_fecha?: boolean | null
          cor_fundo_overlay?: string | null
          criado_em?: string | null
          delay_botao_fechar?: number | null
          dias_expiracao_cookie?: number | null
          duracao_animacao_ms?: number | null
          formulario_id: string
          frequencia_exibicao?: string | null
          id?: string
          max_exibicoes?: number | null
          mostrar_botao_fechar?: boolean | null
          mostrar_mobile?: boolean | null
          mostrar_uma_vez_sessao?: boolean | null
          paginas_alvo?: string[] | null
          paginas_excluidas?: string[] | null
          popup_imagem_link?: string | null
          popup_imagem_posicao?: string | null
          popup_imagem_url?: string | null
          porcentagem_scroll?: number | null
          posicao?: string | null
          seletor_elemento_clique?: string | null
          tipo_animacao?: string | null
          tipo_gatilho?: string
          utm_filtro?: Json | null
        }
        Update: {
          ativo_a_partir_de?: string | null
          ativo_ate?: string | null
          atraso_segundos?: number | null
          atualizado_em?: string | null
          clique_overlay_fecha?: boolean | null
          cor_fundo_overlay?: string | null
          criado_em?: string | null
          delay_botao_fechar?: number | null
          dias_expiracao_cookie?: number | null
          duracao_animacao_ms?: number | null
          formulario_id?: string
          frequencia_exibicao?: string | null
          id?: string
          max_exibicoes?: number | null
          mostrar_botao_fechar?: boolean | null
          mostrar_mobile?: boolean | null
          mostrar_uma_vez_sessao?: boolean | null
          paginas_alvo?: string[] | null
          paginas_excluidas?: string[] | null
          popup_imagem_link?: string | null
          popup_imagem_posicao?: string | null
          popup_imagem_url?: string | null
          porcentagem_scroll?: number | null
          posicao?: string | null
          seletor_elemento_clique?: string | null
          tipo_animacao?: string | null
          tipo_gatilho?: string
          utm_filtro?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "config_popup_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: true
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      config_programa_parceiros: {
        Row: {
          atualizado_em: string
          atualizado_por: string | null
          base_url_indicacao: string | null
          id: string
          observacoes: string | null
          percentual_padrao: number
          regras_gratuidade: Json
        }
        Insert: {
          atualizado_em?: string
          atualizado_por?: string | null
          base_url_indicacao?: string | null
          id?: string
          observacoes?: string | null
          percentual_padrao?: number
          regras_gratuidade?: Json
        }
        Update: {
          atualizado_em?: string
          atualizado_por?: string | null
          base_url_indicacao?: string | null
          id?: string
          observacoes?: string | null
          percentual_padrao?: number
          regras_gratuidade?: Json
        }
        Relationships: [
          {
            foreignKeyName: "config_programa_parceiros_atualizado_por_fkey"
            columns: ["atualizado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      config_progressive_profiling_formularios: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          criado_em: string | null
          dias_expiracao_cookie: number | null
          formulario_id: string
          id: string
          metodo_identificacao: string | null
          min_campos_exibir: number | null
          mostrar_campos_alternativos: boolean | null
          nome_cookie: string | null
          ocultar_campos_conhecidos: boolean | null
          ordem_prioridade_campos: Json | null
          saudacao_lead_conhecido: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          dias_expiracao_cookie?: number | null
          formulario_id: string
          id?: string
          metodo_identificacao?: string | null
          min_campos_exibir?: number | null
          mostrar_campos_alternativos?: boolean | null
          nome_cookie?: string | null
          ocultar_campos_conhecidos?: boolean | null
          ordem_prioridade_campos?: Json | null
          saudacao_lead_conhecido?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          criado_em?: string | null
          dias_expiracao_cookie?: number | null
          formulario_id?: string
          id?: string
          metodo_identificacao?: string | null
          min_campos_exibir?: number | null
          mostrar_campos_alternativos?: boolean | null
          nome_cookie?: string | null
          ocultar_campos_conhecidos?: boolean | null
          ordem_prioridade_campos?: Json | null
          saudacao_lead_conhecido?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "config_progressive_profiling_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: true
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_card: {
        Row: {
          acoes_rapidas: Json | null
          atualizado_em: string
          campos_customizados_visiveis: Json | null
          campos_visiveis: Json | null
          criado_em: string
          funil_id: string | null
          id: string
          organizacao_id: string
        }
        Insert: {
          acoes_rapidas?: Json | null
          atualizado_em?: string
          campos_customizados_visiveis?: Json | null
          campos_visiveis?: Json | null
          criado_em?: string
          funil_id?: string | null
          id?: string
          organizacao_id: string
        }
        Update: {
          acoes_rapidas?: Json | null
          atualizado_em?: string
          campos_customizados_visiveis?: Json | null
          campos_visiveis?: Json | null
          criado_em?: string
          funil_id?: string | null
          id?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_card_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracoes_card_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_distribuicao: {
        Row: {
          atualizado_em: string
          criado_em: string
          dias_semana: number[] | null
          fallback_manual: boolean | null
          funil_id: string
          horario_especifico: boolean | null
          horario_fim: string | null
          horario_inicio: string | null
          id: string
          modo: string
          organizacao_id: string
          posicao_rodizio: number | null
          pular_inativos: boolean | null
          sla_acao_limite: string | null
          sla_ativo: boolean | null
          sla_max_redistribuicoes: number | null
          sla_tempo_minutos: number | null
          ultimo_usuario_id: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          dias_semana?: number[] | null
          fallback_manual?: boolean | null
          funil_id: string
          horario_especifico?: boolean | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          modo?: string
          organizacao_id: string
          posicao_rodizio?: number | null
          pular_inativos?: boolean | null
          sla_acao_limite?: string | null
          sla_ativo?: boolean | null
          sla_max_redistribuicoes?: number | null
          sla_tempo_minutos?: number | null
          ultimo_usuario_id?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          dias_semana?: number[] | null
          fallback_manual?: boolean | null
          funil_id?: string
          horario_especifico?: boolean | null
          horario_fim?: string | null
          horario_inicio?: string | null
          id?: string
          modo?: string
          organizacao_id?: string
          posicao_rodizio?: number | null
          pular_inativos?: boolean | null
          sla_acao_limite?: string | null
          sla_ativo?: boolean | null
          sla_max_redistribuicoes?: number | null
          sla_tempo_minutos?: number | null
          ultimo_usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_distribuicao_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: true
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracoes_distribuicao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "configuracoes_distribuicao_ultimo_usuario_id_fkey"
            columns: ["ultimo_usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_globais: {
        Row: {
          atualizado_em: string
          configuracoes: Json
          configurado: boolean | null
          criado_em: string
          id: string
          plataforma: string
          ultimo_erro: string | null
          ultimo_teste: string | null
        }
        Insert: {
          atualizado_em?: string
          configuracoes?: Json
          configurado?: boolean | null
          criado_em?: string
          id?: string
          plataforma: string
          ultimo_erro?: string | null
          ultimo_teste?: string | null
        }
        Update: {
          atualizado_em?: string
          configuracoes?: Json
          configurado?: boolean | null
          criado_em?: string
          id?: string
          plataforma?: string
          ultimo_erro?: string | null
          ultimo_teste?: string | null
        }
        Relationships: []
      }
      configuracoes_tenant: {
        Row: {
          assinatura_mensagem: string | null
          atualizado_em: string
          criado_em: string
          criar_tarefa_automatica: boolean | null
          dias_alerta_inatividade: number | null
          dias_uteis: number[] | null
          formato_data: string | null
          horario_comercial_fim: string | null
          horario_comercial_inicio: string | null
          horario_fim_envio: string | null
          horario_inicio_envio: string | null
          id: string
          moeda_padrao: string | null
          notificar_mudanca_etapa: boolean | null
          notificar_nova_oportunidade: boolean | null
          notificar_tarefa_vencida: boolean | null
          organizacao_id: string
          timezone: string | null
          widget_whatsapp_ativo: boolean | null
          widget_whatsapp_config: Json | null
        }
        Insert: {
          assinatura_mensagem?: string | null
          atualizado_em?: string
          criado_em?: string
          criar_tarefa_automatica?: boolean | null
          dias_alerta_inatividade?: number | null
          dias_uteis?: number[] | null
          formato_data?: string | null
          horario_comercial_fim?: string | null
          horario_comercial_inicio?: string | null
          horario_fim_envio?: string | null
          horario_inicio_envio?: string | null
          id?: string
          moeda_padrao?: string | null
          notificar_mudanca_etapa?: boolean | null
          notificar_nova_oportunidade?: boolean | null
          notificar_tarefa_vencida?: boolean | null
          organizacao_id: string
          timezone?: string | null
          widget_whatsapp_ativo?: boolean | null
          widget_whatsapp_config?: Json | null
        }
        Update: {
          assinatura_mensagem?: string | null
          atualizado_em?: string
          criado_em?: string
          criar_tarefa_automatica?: boolean | null
          dias_alerta_inatividade?: number | null
          dias_uteis?: number[] | null
          formato_data?: string | null
          horario_comercial_fim?: string | null
          horario_comercial_inicio?: string | null
          horario_fim_envio?: string | null
          horario_inicio_envio?: string | null
          id?: string
          moeda_padrao?: string | null
          notificar_mudanca_etapa?: boolean | null
          notificar_nova_oportunidade?: boolean | null
          notificar_tarefa_vencida?: boolean | null
          organizacao_id?: string
          timezone?: string | null
          widget_whatsapp_ativo?: boolean | null
          widget_whatsapp_config?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_tenant_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos: {
        Row: {
          atualizado_em: string
          cargo: string | null
          cnpj: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          email: string | null
          empresa_id: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          id: string
          linkedin_url: string | null
          nome: string | null
          nome_fantasia: string | null
          observacoes: string | null
          organizacao_id: string
          origem: string
          owner_id: string | null
          porte: string | null
          razao_social: string | null
          segmento: string | null
          sobrenome: string | null
          status: string
          telefone: string | null
          tipo: string
          website: string | null
        }
        Insert: {
          atualizado_em?: string
          cargo?: string | null
          cnpj?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          id?: string
          linkedin_url?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          organizacao_id: string
          origem?: string
          owner_id?: string | null
          porte?: string | null
          razao_social?: string | null
          segmento?: string | null
          sobrenome?: string | null
          status?: string
          telefone?: string | null
          tipo: string
          website?: string | null
        }
        Update: {
          atualizado_em?: string
          cargo?: string | null
          cnpj?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          email?: string | null
          empresa_id?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          id?: string
          linkedin_url?: string | null
          nome?: string | null
          nome_fantasia?: string | null
          observacoes?: string | null
          organizacao_id?: string
          origem?: string
          owner_id?: string | null
          porte?: string | null
          razao_social?: string | null
          segmento?: string | null
          sobrenome?: string | null
          status?: string
          telefone?: string | null
          tipo?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contatos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_bloqueados_pre_op: {
        Row: {
          bloqueado_por: string | null
          criado_em: string
          id: string
          motivo: string | null
          organizacao_id: string
          phone_name: string | null
          phone_number: string
        }
        Insert: {
          bloqueado_por?: string | null
          criado_em?: string
          id?: string
          motivo?: string | null
          organizacao_id: string
          phone_name?: string | null
          phone_number: string
        }
        Update: {
          bloqueado_por?: string | null
          criado_em?: string
          id?: string
          motivo?: string | null
          organizacao_id?: string
          phone_name?: string | null
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "contatos_bloqueados_pre_op_bloqueado_por_fkey"
            columns: ["bloqueado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_bloqueados_pre_op_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      contatos_segmentos: {
        Row: {
          contato_id: string
          criado_em: string
          id: string
          organizacao_id: string
          segmento_id: string
        }
        Insert: {
          contato_id: string
          criado_em?: string
          id?: string
          organizacao_id: string
          segmento_id: string
        }
        Update: {
          contato_id?: string
          criado_em?: string
          id?: string
          organizacao_id?: string
          segmento_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contatos_segmentos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_segmentos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contatos_segmentos_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "segmentos"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas: {
        Row: {
          arquivada: boolean
          atualizado_em: string
          canal: string
          chat_id: string
          conexao_instagram_id: string | null
          contato_id: string
          criado_em: string
          deletado_em: string | null
          fixada: boolean
          foto_url: string | null
          id: string
          mensagens_nao_lidas: number | null
          nome: string | null
          organizacao_id: string
          primeira_mensagem_em: string | null
          sessao_whatsapp_id: string | null
          silenciada: boolean
          status: string
          status_alterado_em: string | null
          tipo: string
          total_mensagens: number | null
          ultima_mensagem_em: string | null
          usuario_id: string
        }
        Insert: {
          arquivada?: boolean
          atualizado_em?: string
          canal: string
          chat_id: string
          conexao_instagram_id?: string | null
          contato_id: string
          criado_em?: string
          deletado_em?: string | null
          fixada?: boolean
          foto_url?: string | null
          id?: string
          mensagens_nao_lidas?: number | null
          nome?: string | null
          organizacao_id: string
          primeira_mensagem_em?: string | null
          sessao_whatsapp_id?: string | null
          silenciada?: boolean
          status?: string
          status_alterado_em?: string | null
          tipo?: string
          total_mensagens?: number | null
          ultima_mensagem_em?: string | null
          usuario_id: string
        }
        Update: {
          arquivada?: boolean
          atualizado_em?: string
          canal?: string
          chat_id?: string
          conexao_instagram_id?: string | null
          contato_id?: string
          criado_em?: string
          deletado_em?: string | null
          fixada?: boolean
          foto_url?: string | null
          id?: string
          mensagens_nao_lidas?: number | null
          nome?: string | null
          organizacao_id?: string
          primeira_mensagem_em?: string | null
          sessao_whatsapp_id?: string | null
          silenciada?: boolean
          status?: string
          status_alterado_em?: string | null
          tipo?: string
          total_mensagens?: number | null
          ultima_mensagem_em?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_conexao_instagram_id_fkey"
            columns: ["conexao_instagram_id"]
            isOneToOne: false
            referencedRelation: "conexoes_instagram"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_sessao_whatsapp_id_fkey"
            columns: ["sessao_whatsapp_id"]
            isOneToOne: false
            referencedRelation: "sessoes_whatsapp"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      conversas_labels: {
        Row: {
          conversa_id: string
          criado_em: string
          id: string
          label_id: string
          organizacao_id: string
        }
        Insert: {
          conversa_id: string
          criado_em?: string
          id?: string
          label_id: string
          organizacao_id: string
        }
        Update: {
          conversa_id?: string
          criado_em?: string
          id?: string
          label_id?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversas_labels_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_labels_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversas_labels_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_audience_membros: {
        Row: {
          audience_id: string
          contato_id: string
          criado_em: string
          email_hash: string | null
          erro_sincronizacao: string | null
          id: string
          organizacao_id: string
          phone_hash: string | null
          sincronizado: boolean | null
          sincronizado_em: string | null
        }
        Insert: {
          audience_id: string
          contato_id: string
          criado_em?: string
          email_hash?: string | null
          erro_sincronizacao?: string | null
          id?: string
          organizacao_id: string
          phone_hash?: string | null
          sincronizado?: boolean | null
          sincronizado_em?: string | null
        }
        Update: {
          audience_id?: string
          contato_id?: string
          criado_em?: string
          email_hash?: string | null
          erro_sincronizacao?: string | null
          id?: string
          organizacao_id?: string
          phone_hash?: string | null
          sincronizado?: boolean | null
          sincronizado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_audience_membros_audience_id_fkey"
            columns: ["audience_id"]
            isOneToOne: false
            referencedRelation: "custom_audiences_meta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_audience_membros_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_audience_membros_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_audiences_meta: {
        Row: {
          ad_account_id: string
          ativo: boolean | null
          atualizado_em: string
          audience_id: string
          audience_name: string
          conexao_meta_id: string | null
          criado_em: string
          deletado_em: string | null
          evento_gatilho: string | null
          id: string
          organizacao_id: string
          tipo_sincronizacao: string
          total_usuarios: number | null
          ultimo_sync: string | null
          ultimo_sync_sucesso: boolean | null
        }
        Insert: {
          ad_account_id: string
          ativo?: boolean | null
          atualizado_em?: string
          audience_id: string
          audience_name: string
          conexao_meta_id?: string | null
          criado_em?: string
          deletado_em?: string | null
          evento_gatilho?: string | null
          id?: string
          organizacao_id: string
          tipo_sincronizacao?: string
          total_usuarios?: number | null
          ultimo_sync?: string | null
          ultimo_sync_sucesso?: boolean | null
        }
        Update: {
          ad_account_id?: string
          ativo?: boolean | null
          atualizado_em?: string
          audience_id?: string
          audience_name?: string
          conexao_meta_id?: string | null
          criado_em?: string
          deletado_em?: string | null
          evento_gatilho?: string | null
          id?: string
          organizacao_id?: string
          tipo_sincronizacao?: string
          total_usuarios?: number | null
          ultimo_sync?: string | null
          ultimo_sync_sucesso?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_audiences_meta_conexao_meta_id_fkey"
            columns: ["conexao_meta_id"]
            isOneToOne: false
            referencedRelation: "conexoes_meta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_audiences_meta_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_oportunidades: {
        Row: {
          criado_em: string
          deletado_em: string | null
          hash_arquivo: string | null
          id: string
          nome_arquivo: string
          oportunidade_id: string
          organizacao_id: string
          storage_path: string
          tamanho_bytes: number | null
          tipo_arquivo: string | null
          url_download: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          deletado_em?: string | null
          hash_arquivo?: string | null
          id?: string
          nome_arquivo: string
          oportunidade_id: string
          organizacao_id: string
          storage_path: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          url_download?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          deletado_em?: string | null
          hash_arquivo?: string | null
          id?: string
          nome_arquivo?: string
          oportunidade_id?: string
          organizacao_id?: string
          storage_path?: string
          tamanho_bytes?: number | null
          tipo_arquivo?: string | null
          url_download?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_oportunidades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_oportunidades_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_oportunidades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicatas_contatos: {
        Row: {
          campos_coincidentes: Json
          contato_duplicado_id: string
          contato_original_id: string
          criado_em: string
          id: string
          organizacao_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          score_similaridade: number
          status: string
        }
        Insert: {
          campos_coincidentes?: Json
          contato_duplicado_id: string
          contato_original_id: string
          criado_em?: string
          id?: string
          organizacao_id: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          score_similaridade: number
          status?: string
        }
        Update: {
          campos_coincidentes?: Json
          contato_duplicado_id?: string
          contato_original_id?: string
          criado_em?: string
          id?: string
          organizacao_id?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          score_similaridade?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "duplicatas_contatos_contato_duplicado_id_fkey"
            columns: ["contato_duplicado_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_contatos_contato_original_id_fkey"
            columns: ["contato_original_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_contatos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicatas_contatos_resolvido_por_fkey"
            columns: ["resolvido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      email_aberturas: {
        Row: {
          criado_em: string
          email_id: string
          id: string
          ip: string | null
          organizacao_id: string
          tracking_id: string
          user_agent: string | null
        }
        Insert: {
          criado_em?: string
          email_id: string
          id?: string
          ip?: string | null
          organizacao_id: string
          tracking_id: string
          user_agent?: string | null
        }
        Update: {
          criado_em?: string
          email_id?: string
          id?: string
          ip?: string | null
          organizacao_id?: string
          tracking_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_aberturas_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails_recebidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_aberturas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_assinaturas: {
        Row: {
          assinatura_html: string | null
          atualizado_em: string
          criado_em: string
          id: string
          incluir_em_novos: boolean
          incluir_em_respostas: boolean
          organizacao_id: string
          usuario_id: string
        }
        Insert: {
          assinatura_html?: string | null
          atualizado_em?: string
          criado_em?: string
          id?: string
          incluir_em_novos?: boolean
          incluir_em_respostas?: boolean
          organizacao_id: string
          usuario_id: string
        }
        Update: {
          assinatura_html?: string | null
          atualizado_em?: string
          criado_em?: string
          id?: string
          incluir_em_novos?: boolean
          incluir_em_respostas?: boolean
          organizacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_assinaturas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_assinaturas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_oportunidades: {
        Row: {
          anexos: Json | null
          assunto: string | null
          corpo: string | null
          criado_em: string
          destinatario: string
          enviado_em: string | null
          erro_mensagem: string | null
          id: string
          oportunidade_id: string
          organizacao_id: string
          status: string
          usuario_id: string
        }
        Insert: {
          anexos?: Json | null
          assunto?: string | null
          corpo?: string | null
          criado_em?: string
          destinatario: string
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          oportunidade_id: string
          organizacao_id: string
          status?: string
          usuario_id: string
        }
        Update: {
          anexos?: Json | null
          assunto?: string | null
          corpo?: string | null
          criado_em?: string
          destinatario?: string
          enviado_em?: string | null
          erro_mensagem?: string | null
          id?: string
          oportunidade_id?: string
          organizacao_id?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_oportunidades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_oportunidades_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_oportunidades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_rascunhos: {
        Row: {
          anexos_temp: Json | null
          assunto: string | null
          atualizado_em: string
          bcc_email: string | null
          cc_email: string | null
          corpo_html: string | null
          criado_em: string
          deletado_em: string | null
          email_original_id: string | null
          id: string
          organizacao_id: string
          para_email: string | null
          tipo: string
          usuario_id: string
        }
        Insert: {
          anexos_temp?: Json | null
          assunto?: string | null
          atualizado_em?: string
          bcc_email?: string | null
          cc_email?: string | null
          corpo_html?: string | null
          criado_em?: string
          deletado_em?: string | null
          email_original_id?: string | null
          id?: string
          organizacao_id: string
          para_email?: string | null
          tipo?: string
          usuario_id: string
        }
        Update: {
          anexos_temp?: Json | null
          assunto?: string | null
          atualizado_em?: string
          bcc_email?: string | null
          cc_email?: string | null
          corpo_html?: string | null
          criado_em?: string
          deletado_em?: string | null
          email_original_id?: string | null
          id?: string
          organizacao_id?: string
          para_email?: string | null
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_rascunhos_email_original_id_fkey"
            columns: ["email_original_id"]
            isOneToOne: false
            referencedRelation: "emails_recebidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_rascunhos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_rascunhos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_recebidos: {
        Row: {
          aberto_em: string | null
          anexos_info: Json | null
          assunto: string | null
          atualizado_em: string
          bcc_email: string | null
          cc_email: string | null
          conexao_email_id: string | null
          contato_id: string | null
          corpo_html: string | null
          corpo_texto: string | null
          criado_em: string
          data_email: string
          de_email: string
          de_nome: string | null
          deletado_em: string | null
          favorito: boolean
          id: string
          lido: boolean
          message_id: string
          oportunidade_id: string | null
          organizacao_id: string
          para_email: string
          pasta: string
          preview: string | null
          provider_id: string | null
          sincronizado_em: string | null
          tem_anexos: boolean
          thread_id: string | null
          total_aberturas: number | null
          tracking_id: string | null
          usuario_id: string
        }
        Insert: {
          aberto_em?: string | null
          anexos_info?: Json | null
          assunto?: string | null
          atualizado_em?: string
          bcc_email?: string | null
          cc_email?: string | null
          conexao_email_id?: string | null
          contato_id?: string | null
          corpo_html?: string | null
          corpo_texto?: string | null
          criado_em?: string
          data_email?: string
          de_email: string
          de_nome?: string | null
          deletado_em?: string | null
          favorito?: boolean
          id?: string
          lido?: boolean
          message_id: string
          oportunidade_id?: string | null
          organizacao_id: string
          para_email: string
          pasta?: string
          preview?: string | null
          provider_id?: string | null
          sincronizado_em?: string | null
          tem_anexos?: boolean
          thread_id?: string | null
          total_aberturas?: number | null
          tracking_id?: string | null
          usuario_id: string
        }
        Update: {
          aberto_em?: string | null
          anexos_info?: Json | null
          assunto?: string | null
          atualizado_em?: string
          bcc_email?: string | null
          cc_email?: string | null
          conexao_email_id?: string | null
          contato_id?: string | null
          corpo_html?: string | null
          corpo_texto?: string | null
          criado_em?: string
          data_email?: string
          de_email?: string
          de_nome?: string | null
          deletado_em?: string | null
          favorito?: boolean
          id?: string
          lido?: boolean
          message_id?: string
          oportunidade_id?: string | null
          organizacao_id?: string
          para_email?: string
          pasta?: string
          preview?: string | null
          provider_id?: string | null
          sincronizado_em?: string | null
          tem_anexos?: boolean
          thread_id?: string | null
          total_aberturas?: number | null
          tracking_id?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_recebidos_conexao_email_id_fkey"
            columns: ["conexao_email_id"]
            isOneToOne: false
            referencedRelation: "conexoes_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_recebidos_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_recebidos_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_recebidos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_recebidos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_sync_estado: {
        Row: {
          atualizado_em: string
          conexao_email_id: string | null
          criado_em: string
          erro_mensagem: string | null
          id: string
          organizacao_id: string
          status: string
          tentativas_erro: number
          ultimo_history_id: string | null
          ultimo_sync: string | null
          ultimo_uid: number | null
          ultimo_uid_validity: number | null
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          conexao_email_id?: string | null
          criado_em?: string
          erro_mensagem?: string | null
          id?: string
          organizacao_id: string
          status?: string
          tentativas_erro?: number
          ultimo_history_id?: string | null
          ultimo_sync?: string | null
          ultimo_uid?: number | null
          ultimo_uid_validity?: number | null
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          conexao_email_id?: string | null
          criado_em?: string
          erro_mensagem?: string | null
          id?: string
          organizacao_id?: string
          status?: string
          tentativas_erro?: number
          ultimo_history_id?: string | null
          ultimo_sync?: string | null
          ultimo_uid?: number | null
          ultimo_uid_validity?: number | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_sync_estado_conexao_email_id_fkey"
            columns: ["conexao_email_id"]
            isOneToOne: false
            referencedRelation: "conexoes_email"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_sync_estado_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_sync_estado_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      emails_tracking: {
        Row: {
          contador: number
          email_id: string | null
          id: string
          ip: unknown
          message_id: string | null
          organizacao_id: string
          primeira_vez: string
          tipo: string
          ultima_vez: string
          user_agent: string | null
        }
        Insert: {
          contador?: number
          email_id?: string | null
          id?: string
          ip?: unknown
          message_id?: string | null
          organizacao_id: string
          primeira_vez?: string
          tipo: string
          ultima_vez?: string
          user_agent?: string | null
        }
        Update: {
          contador?: number
          email_id?: string | null
          id?: string
          ip?: unknown
          message_id?: string | null
          organizacao_id?: string
          primeira_vez?: string
          tipo?: string
          ultima_vez?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_tracking_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails_recebidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_tracking_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          cor: string | null
          criado_em: string
          criado_por: string
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          organizacao_id: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por: string
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          organizacao_id: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      equipes_membros: {
        Row: {
          ativo: boolean | null
          criado_em: string
          equipe_id: string
          id: string
          organizacao_id: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string
          equipe_id: string
          id?: string
          organizacao_id: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string
          equipe_id?: string
          id?: string
          organizacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipes_membros_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_membros_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipes_membros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      estilos_formularios: {
        Row: {
          atualizado_em: string
          botao: Json
          cabecalho: Json
          campos: Json
          container: Json
          criado_em: string
          css_customizado: string | null
          formulario_id: string
          id: string
          pagina: Json
        }
        Insert: {
          atualizado_em?: string
          botao?: Json
          cabecalho?: Json
          campos?: Json
          container?: Json
          criado_em?: string
          css_customizado?: string | null
          formulario_id: string
          id?: string
          pagina?: Json
        }
        Update: {
          atualizado_em?: string
          botao?: Json
          cabecalho?: Json
          campos?: Json
          container?: Json
          criado_em?: string
          css_customizado?: string | null
          formulario_id?: string
          id?: string
          pagina?: Json
        }
        Relationships: [
          {
            foreignKeyName: "estilos_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: true
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_formularios: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          descricao_etapa: string | null
          formulario_id: string
          icone_etapa: string | null
          id: string
          indice_etapa: number
          texto_botao_anterior: string | null
          texto_botao_enviar: string | null
          texto_botao_proximo: string | null
          titulo_etapa: string
          validar_ao_avancar: boolean | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao_etapa?: string | null
          formulario_id: string
          icone_etapa?: string | null
          id?: string
          indice_etapa: number
          texto_botao_anterior?: string | null
          texto_botao_enviar?: string | null
          texto_botao_proximo?: string | null
          titulo_etapa: string
          validar_ao_avancar?: boolean | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          descricao_etapa?: string | null
          formulario_id?: string
          icone_etapa?: string | null
          id?: string
          indice_etapa?: number
          texto_botao_anterior?: string | null
          texto_botao_enviar?: string | null
          texto_botao_proximo?: string | null
          titulo_etapa?: string
          validar_ao_avancar?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "etapas_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_funil: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          cor: string | null
          criado_em: string
          deletado_em: string | null
          descricao: string | null
          etiqueta_whatsapp: string | null
          funil_id: string
          id: string
          nome: string
          ordem: number | null
          organizacao_id: string
          probabilidade: number | null
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          deletado_em?: string | null
          descricao?: string | null
          etiqueta_whatsapp?: string | null
          funil_id: string
          id?: string
          nome: string
          ordem?: number | null
          organizacao_id: string
          probabilidade?: number | null
          tipo?: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          deletado_em?: string | null
          descricao?: string | null
          etiqueta_whatsapp?: string | null
          funil_id?: string
          id?: string
          nome?: string
          ordem?: number | null
          organizacao_id?: string
          probabilidade?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_funil_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_funil_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_tarefas: {
        Row: {
          criado_em: string
          criar_automaticamente: boolean | null
          etapa_template_id: string
          id: string
          ordem: number | null
          organizacao_id: string
          tarefa_template_id: string
        }
        Insert: {
          criado_em?: string
          criar_automaticamente?: boolean | null
          etapa_template_id: string
          id?: string
          ordem?: number | null
          organizacao_id: string
          tarefa_template_id: string
        }
        Update: {
          criado_em?: string
          criar_automaticamente?: boolean | null
          etapa_template_id?: string
          id?: string
          ordem?: number | null
          organizacao_id?: string
          tarefa_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_tarefas_etapa_template_id_fkey"
            columns: ["etapa_template_id"]
            isOneToOne: false
            referencedRelation: "etapas_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_tarefas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_tarefas_tarefa_template_id_fkey"
            columns: ["tarefa_template_id"]
            isOneToOne: false
            referencedRelation: "tarefas_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_templates: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          cor: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          organizacao_id: string
          probabilidade: number | null
          sistema: boolean | null
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          organizacao_id: string
          probabilidade?: number | null
          sistema?: boolean | null
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          organizacao_id?: string
          probabilidade?: number | null
          sistema?: boolean | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "etapas_templates_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_templates_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_analytics_formularios: {
        Row: {
          criado_em: string | null
          dados_evento: Json | null
          formulario_id: string
          id: string
          navegador: string | null
          referrer: string | null
          session_id: string | null
          tempo_no_campo_segundos: number | null
          tempo_no_formulario_segundos: number | null
          tipo_dispositivo: string | null
          tipo_evento: string
          url_pagina: string | null
          variante_ab_id: string | null
          visitor_id: string | null
        }
        Insert: {
          criado_em?: string | null
          dados_evento?: Json | null
          formulario_id: string
          id?: string
          navegador?: string | null
          referrer?: string | null
          session_id?: string | null
          tempo_no_campo_segundos?: number | null
          tempo_no_formulario_segundos?: number | null
          tipo_dispositivo?: string | null
          tipo_evento: string
          url_pagina?: string | null
          variante_ab_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          criado_em?: string | null
          dados_evento?: Json | null
          formulario_id?: string
          id?: string
          navegador?: string | null
          referrer?: string | null
          session_id?: string | null
          tempo_no_campo_segundos?: number | null
          tempo_no_formulario_segundos?: number | null
          tipo_dispositivo?: string | null
          tipo_evento?: string
          url_pagina?: string | null
          variante_ab_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_analytics_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_analytics_formularios_variante_ab_id_fkey"
            columns: ["variante_ab_id"]
            isOneToOne: false
            referencedRelation: "variantes_ab_formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_automacao: {
        Row: {
          criado_em: string
          dados: Json
          entidade_id: string
          entidade_tipo: string
          id: string
          organizacao_id: string
          processado: boolean
          processado_em: string | null
          tipo: string
        }
        Insert: {
          criado_em?: string
          dados?: Json
          entidade_id: string
          entidade_tipo: string
          id?: string
          organizacao_id: string
          processado?: boolean
          processado_em?: string | null
          tipo: string
        }
        Update: {
          criado_em?: string
          dados?: Json
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          organizacao_id?: string
          processado?: boolean
          processado_em?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_automacao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_pendentes: {
        Row: {
          atualizado_em: string
          criado_em: string
          destino: string
          id: string
          max_tentativas: number | null
          organizacao_id: string
          payload: Json
          proxima_tentativa: string | null
          status: string | null
          tentativas: number | null
          tipo: string
          ultimo_erro: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          destino: string
          id?: string
          max_tentativas?: number | null
          organizacao_id: string
          payload: Json
          proxima_tentativa?: string | null
          status?: string | null
          tentativas?: number | null
          tipo: string
          ultimo_erro?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          destino?: string
          id?: string
          max_tentativas?: number | null
          organizacao_id?: string
          payload?: Json
          proxima_tentativa?: string | null
          status?: string | null
          tentativas?: number | null
          tipo?: string
          ultimo_erro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_pendentes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes_pendentes_automacao: {
        Row: {
          acao_index: number
          automacao_id: string
          criado_em: string
          dados_contexto: Json
          executado_em: string | null
          executar_em: string
          id: string
          log_id: string | null
          max_tentativas: number
          organizacao_id: string
          status: string
          tentativas: number
          ultimo_erro: string | null
        }
        Insert: {
          acao_index: number
          automacao_id: string
          criado_em?: string
          dados_contexto?: Json
          executado_em?: string | null
          executar_em: string
          id?: string
          log_id?: string | null
          max_tentativas?: number
          organizacao_id: string
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
        }
        Update: {
          acao_index?: number
          automacao_id?: string
          criado_em?: string
          dados_contexto?: Json
          executado_em?: string | null
          executar_em?: string
          id?: string
          log_id?: string | null
          max_tentativas?: number
          organizacao_id?: string
          status?: string
          tentativas?: number
          ultimo_erro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execucoes_pendentes_automacao_automacao_id_fkey"
            columns: ["automacao_id"]
            isOneToOne: false
            referencedRelation: "automacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_pendentes_automacao_log_id_fkey"
            columns: ["log_id"]
            isOneToOne: false
            referencedRelation: "log_automacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucoes_pendentes_automacao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          atualizado_em: string
          criado_em: string
          deletado_em: string | null
          descricao: string
          id: string
          organizacao_id: string
          resolvido_em: string | null
          resolvido_por: string | null
          status: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          descricao: string
          id?: string
          organizacao_id: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          tipo: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          descricao?: string
          id?: string
          organizacao_id?: string
          resolvido_em?: string | null
          resolvido_por?: string | null
          status?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_resolvido_por_fkey"
            columns: ["resolvido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedbacks_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      formularios: {
        Row: {
          ab_testing_ativo: boolean | null
          atualizado_em: string
          captcha_ativo: boolean
          captcha_site_key: string | null
          captcha_tipo: string | null
          config_botoes: Json | null
          config_pos_envio: Json | null
          criado_em: string
          criado_por: string | null
          data_fim: string | null
          data_inicio: string | null
          deletado_em: string | null
          descricao: string | null
          despublicado_em: string | null
          emails_notificacao: string[] | null
          etapa_id: string | null
          facebook_event_name: string | null
          facebook_pixel_id: string | null
          funil_id: string | null
          google_ads_conversion_id: string | null
          google_ads_conversion_label: string | null
          honeypot_ativo: boolean
          id: string
          lead_scoring_ativo: boolean | null
          lgpd_ativo: boolean | null
          lgpd_checkbox_obrigatorio: boolean | null
          lgpd_texto_consentimento: string | null
          lgpd_url_politica: string | null
          max_submissoes: number | null
          mensagem_fechado: string | null
          mensagem_sucesso: string | null
          meta_descricao: string | null
          meta_titulo: string | null
          multi_step_config: Json | null
          nome: string
          notificar_email: boolean
          og_image_url: string | null
          organizacao_id: string
          pontuacao_base_lead: number | null
          progressive_profiling_ativo: boolean | null
          publicado_em: string | null
          rate_limit_ativo: boolean
          rate_limit_janela_minutos: number
          rate_limit_max: number
          redirecionar_apos_envio: boolean
          slug: string
          status: string
          taxa_conversao: number
          teste_ab_atual_id: string | null
          tipo: string
          tipo_botao_envio: string | null
          titulo_pagina: string | null
          total_submissoes: number
          total_visualizacoes: number
          tracking_conversao_ativo: boolean | null
          url_redirecionamento: string | null
          versao: number | null
          whatsapp_mensagem_template: string | null
          whatsapp_numero: string | null
        }
        Insert: {
          ab_testing_ativo?: boolean | null
          atualizado_em?: string
          captcha_ativo?: boolean
          captcha_site_key?: string | null
          captcha_tipo?: string | null
          config_botoes?: Json | null
          config_pos_envio?: Json | null
          criado_em?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deletado_em?: string | null
          descricao?: string | null
          despublicado_em?: string | null
          emails_notificacao?: string[] | null
          etapa_id?: string | null
          facebook_event_name?: string | null
          facebook_pixel_id?: string | null
          funil_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_conversion_label?: string | null
          honeypot_ativo?: boolean
          id?: string
          lead_scoring_ativo?: boolean | null
          lgpd_ativo?: boolean | null
          lgpd_checkbox_obrigatorio?: boolean | null
          lgpd_texto_consentimento?: string | null
          lgpd_url_politica?: string | null
          max_submissoes?: number | null
          mensagem_fechado?: string | null
          mensagem_sucesso?: string | null
          meta_descricao?: string | null
          meta_titulo?: string | null
          multi_step_config?: Json | null
          nome: string
          notificar_email?: boolean
          og_image_url?: string | null
          organizacao_id: string
          pontuacao_base_lead?: number | null
          progressive_profiling_ativo?: boolean | null
          publicado_em?: string | null
          rate_limit_ativo?: boolean
          rate_limit_janela_minutos?: number
          rate_limit_max?: number
          redirecionar_apos_envio?: boolean
          slug: string
          status?: string
          taxa_conversao?: number
          teste_ab_atual_id?: string | null
          tipo?: string
          tipo_botao_envio?: string | null
          titulo_pagina?: string | null
          total_submissoes?: number
          total_visualizacoes?: number
          tracking_conversao_ativo?: boolean | null
          url_redirecionamento?: string | null
          versao?: number | null
          whatsapp_mensagem_template?: string | null
          whatsapp_numero?: string | null
        }
        Update: {
          ab_testing_ativo?: boolean | null
          atualizado_em?: string
          captcha_ativo?: boolean
          captcha_site_key?: string | null
          captcha_tipo?: string | null
          config_botoes?: Json | null
          config_pos_envio?: Json | null
          criado_em?: string
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          deletado_em?: string | null
          descricao?: string | null
          despublicado_em?: string | null
          emails_notificacao?: string[] | null
          etapa_id?: string | null
          facebook_event_name?: string | null
          facebook_pixel_id?: string | null
          funil_id?: string | null
          google_ads_conversion_id?: string | null
          google_ads_conversion_label?: string | null
          honeypot_ativo?: boolean
          id?: string
          lead_scoring_ativo?: boolean | null
          lgpd_ativo?: boolean | null
          lgpd_checkbox_obrigatorio?: boolean | null
          lgpd_texto_consentimento?: string | null
          lgpd_url_politica?: string | null
          max_submissoes?: number | null
          mensagem_fechado?: string | null
          mensagem_sucesso?: string | null
          meta_descricao?: string | null
          meta_titulo?: string | null
          multi_step_config?: Json | null
          nome?: string
          notificar_email?: boolean
          og_image_url?: string | null
          organizacao_id?: string
          pontuacao_base_lead?: number | null
          progressive_profiling_ativo?: boolean | null
          publicado_em?: string | null
          rate_limit_ativo?: boolean
          rate_limit_janela_minutos?: number
          rate_limit_max?: number
          redirecionar_apos_envio?: boolean
          slug?: string
          status?: string
          taxa_conversao?: number
          teste_ab_atual_id?: string | null
          tipo?: string
          tipo_botao_envio?: string | null
          titulo_pagina?: string | null
          total_submissoes?: number
          total_visualizacoes?: number
          tracking_conversao_ativo?: boolean | null
          url_redirecionamento?: string | null
          versao?: number | null
          whatsapp_mensagem_template?: string | null
          whatsapp_numero?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formularios_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_funil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_teste_ab_atual_id_fkey"
            columns: ["teste_ab_atual_id"]
            isOneToOne: false
            referencedRelation: "testes_ab_formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      formularios_lead_ads: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          criado_em: string
          criar_oportunidade: boolean | null
          deletado_em: string | null
          etapa_destino_id: string | null
          form_id: string
          form_name: string | null
          funil_id: string | null
          id: string
          mapeamento_campos: Json
          notificar_owner: boolean | null
          organizacao_id: string
          owner_id: string | null
          pagina_id: string
          tags_automaticas: string[] | null
          total_leads_recebidos: number | null
          ultimo_lead_recebido: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criar_oportunidade?: boolean | null
          deletado_em?: string | null
          etapa_destino_id?: string | null
          form_id: string
          form_name?: string | null
          funil_id?: string | null
          id?: string
          mapeamento_campos?: Json
          notificar_owner?: boolean | null
          organizacao_id: string
          owner_id?: string | null
          pagina_id: string
          tags_automaticas?: string[] | null
          total_leads_recebidos?: number | null
          ultimo_lead_recebido?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criar_oportunidade?: boolean | null
          deletado_em?: string | null
          etapa_destino_id?: string | null
          form_id?: string
          form_name?: string | null
          funil_id?: string | null
          id?: string
          mapeamento_campos?: Json
          notificar_owner?: boolean | null
          organizacao_id?: string
          owner_id?: string | null
          pagina_id?: string
          tags_automaticas?: string[] | null
          total_leads_recebidos?: number | null
          ultimo_lead_recebido?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "formularios_lead_ads_etapa_destino_id_fkey"
            columns: ["etapa_destino_id"]
            isOneToOne: false
            referencedRelation: "etapas_funil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_lead_ads_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_lead_ads_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_lead_ads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "formularios_lead_ads_pagina_id_fkey"
            columns: ["pagina_id"]
            isOneToOne: false
            referencedRelation: "paginas_meta"
            referencedColumns: ["id"]
          },
        ]
      }
      funis: {
        Row: {
          arquivado: boolean | null
          arquivado_em: string | null
          ativo: boolean | null
          atualizado_em: string
          cor: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          exigir_motivo_resultado: boolean | null
          id: string
          nome: string
          organizacao_id: string
        }
        Insert: {
          arquivado?: boolean | null
          arquivado_em?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          exigir_motivo_resultado?: boolean | null
          id?: string
          nome: string
          organizacao_id: string
        }
        Update: {
          arquivado?: boolean | null
          arquivado_em?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          exigir_motivo_resultado?: boolean | null
          id?: string
          nome?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funis_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      funis_campos: {
        Row: {
          campo_id: string
          criado_em: string
          exibir_card: boolean | null
          funil_id: string
          id: string
          obrigatorio: boolean | null
          ordem: number | null
          organizacao_id: string
          visivel: boolean | null
        }
        Insert: {
          campo_id: string
          criado_em?: string
          exibir_card?: boolean | null
          funil_id: string
          id?: string
          obrigatorio?: boolean | null
          ordem?: number | null
          organizacao_id: string
          visivel?: boolean | null
        }
        Update: {
          campo_id?: string
          criado_em?: string
          exibir_card?: boolean | null
          funil_id?: string
          id?: string
          obrigatorio?: boolean | null
          ordem?: number | null
          organizacao_id?: string
          visivel?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "funis_campos_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos_customizados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_campos_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_campos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      funis_etapas_tarefas: {
        Row: {
          ativo: boolean | null
          criado_em: string
          etapa_funil_id: string
          id: string
          ordem: number | null
          organizacao_id: string
          tarefa_template_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string
          etapa_funil_id: string
          id?: string
          ordem?: number | null
          organizacao_id: string
          tarefa_template_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string
          etapa_funil_id?: string
          id?: string
          ordem?: number | null
          organizacao_id?: string
          tarefa_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funis_etapas_tarefas_etapa_funil_id_fkey"
            columns: ["etapa_funil_id"]
            isOneToOne: false
            referencedRelation: "etapas_funil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_etapas_tarefas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_etapas_tarefas_tarefa_template_id_fkey"
            columns: ["tarefa_template_id"]
            isOneToOne: false
            referencedRelation: "tarefas_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      funis_membros: {
        Row: {
          ativo: boolean | null
          criado_em: string
          funil_id: string
          id: string
          organizacao_id: string
          usuario_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string
          funil_id: string
          id?: string
          organizacao_id: string
          usuario_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string
          funil_id?: string
          id?: string
          organizacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funis_membros_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_membros_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_membros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      funis_motivos: {
        Row: {
          ativo: boolean | null
          criado_em: string
          funil_id: string
          id: string
          motivo_id: string
          organizacao_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string
          funil_id: string
          id?: string
          motivo_id: string
          organizacao_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string
          funil_id?: string
          id?: string
          motivo_id?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funis_motivos_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_motivos_motivo_id_fkey"
            columns: ["motivo_id"]
            isOneToOne: false
            referencedRelation: "motivos_resultado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_motivos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      funis_regras_qualificacao: {
        Row: {
          ativo: boolean | null
          criado_em: string
          funil_id: string
          id: string
          organizacao_id: string
          regra_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string
          funil_id: string
          id?: string
          organizacao_id: string
          regra_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string
          funil_id?: string
          id?: string
          organizacao_id?: string
          regra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funis_regras_qualificacao_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_regras_qualificacao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funis_regras_qualificacao_regra_id_fkey"
            columns: ["regra_id"]
            isOneToOne: false
            referencedRelation: "regras_qualificacao"
            referencedColumns: ["id"]
          },
        ]
      }
      historico_distribuicao: {
        Row: {
          criado_em: string
          id: string
          motivo: string
          oportunidade_id: string
          organizacao_id: string
          usuario_anterior_id: string | null
          usuario_novo_id: string | null
        }
        Insert: {
          criado_em?: string
          id?: string
          motivo: string
          oportunidade_id: string
          organizacao_id: string
          usuario_anterior_id?: string | null
          usuario_novo_id?: string | null
        }
        Update: {
          criado_em?: string
          id?: string
          motivo?: string
          oportunidade_id?: string
          organizacao_id?: string
          usuario_anterior_id?: string | null
          usuario_novo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "historico_distribuicao_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_distribuicao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_distribuicao_usuario_anterior_id_fkey"
            columns: ["usuario_anterior_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historico_distribuicao_usuario_novo_id_fkey"
            columns: ["usuario_novo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      importacoes_contatos: {
        Row: {
          concluido_em: string | null
          criado_em: string
          erro_mensagem: string | null
          erros_detalhados: Json | null
          id: string
          mapeamento_campos: Json
          nome_arquivo: string
          organizacao_id: string
          registros_duplicados: number
          registros_erro: number
          registros_importados: number
          segmento_id: string | null
          status: string
          tamanho_bytes: number
          tipo_arquivo: string
          tipo_contato: string
          total_registros: number
          usuario_id: string
        }
        Insert: {
          concluido_em?: string | null
          criado_em?: string
          erro_mensagem?: string | null
          erros_detalhados?: Json | null
          id?: string
          mapeamento_campos: Json
          nome_arquivo: string
          organizacao_id: string
          registros_duplicados?: number
          registros_erro?: number
          registros_importados?: number
          segmento_id?: string | null
          status?: string
          tamanho_bytes: number
          tipo_arquivo: string
          tipo_contato: string
          total_registros: number
          usuario_id: string
        }
        Update: {
          concluido_em?: string | null
          criado_em?: string
          erro_mensagem?: string | null
          erros_detalhados?: Json | null
          id?: string
          mapeamento_campos?: Json
          nome_arquivo?: string
          organizacao_id?: string
          registros_duplicados?: number
          registros_erro?: number
          registros_importados?: number
          segmento_id?: string | null
          status?: string
          tamanho_bytes?: number
          tipo_arquivo?: string
          tipo_contato?: string
          total_registros?: number
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "importacoes_contatos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "importacoes_contatos_segmento_id_fkey"
            columns: ["segmento_id"]
            isOneToOne: false
            referencedRelation: "segmentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "importacoes_contatos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      indicacoes_parceiro: {
        Row: {
          atualizado_em: string
          criado_em: string
          id: string
          organizacao_id: string
          origem: string
          parceiro_id: string
          percentual_comissao_snapshot: number
          status: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          organizacao_id: string
          origem?: string
          parceiro_id: string
          percentual_comissao_snapshot: number
          status?: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          id?: string
          organizacao_id?: string
          origem?: string
          parceiro_id?: string
          percentual_comissao_snapshot?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicacoes_parceiro_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicacoes_parceiro_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      integracoes: {
        Row: {
          access_token: string | null
          atualizado_em: string
          conta_externa_email: string | null
          conta_externa_id: string | null
          conta_externa_nome: string | null
          criado_em: string
          id: string
          metadata: Json | null
          organizacao_id: string
          plataforma: string
          refresh_token: string | null
          status: string | null
          token_expira_em: string | null
          ultimo_erro: string | null
          ultimo_sync: string | null
          waha_phone: string | null
          waha_session_id: string | null
        }
        Insert: {
          access_token?: string | null
          atualizado_em?: string
          conta_externa_email?: string | null
          conta_externa_id?: string | null
          conta_externa_nome?: string | null
          criado_em?: string
          id?: string
          metadata?: Json | null
          organizacao_id: string
          plataforma: string
          refresh_token?: string | null
          status?: string | null
          token_expira_em?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
          waha_phone?: string | null
          waha_session_id?: string | null
        }
        Update: {
          access_token?: string | null
          atualizado_em?: string
          conta_externa_email?: string | null
          conta_externa_id?: string | null
          conta_externa_nome?: string | null
          criado_em?: string
          id?: string
          metadata?: Json | null
          organizacao_id?: string
          plataforma?: string
          refresh_token?: string | null
          status?: string | null
          token_expira_em?: string | null
          ultimo_erro?: string | null
          ultimo_sync?: string | null
          waha_phone?: string | null
          waha_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integracoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      investimentos_marketing: {
        Row: {
          atualizado_em: string
          canal: string
          criado_em: string
          criado_por_id: string | null
          id: string
          organizacao_id: string
          periodo_fim: string
          periodo_inicio: string
          valor: number
        }
        Insert: {
          atualizado_em?: string
          canal: string
          criado_em?: string
          criado_por_id?: string | null
          id?: string
          organizacao_id: string
          periodo_fim: string
          periodo_inicio: string
          valor?: number
        }
        Update: {
          atualizado_em?: string
          canal?: string
          criado_em?: string
          criado_por_id?: string | null
          id?: string
          organizacao_id?: string
          periodo_fim?: string
          periodo_inicio?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "investimentos_marketing_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investimentos_marketing_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      ligacoes: {
        Row: {
          contato_id: string | null
          criado_em: string
          direcao: string
          duracao_segundos: number | null
          fim_em: string | null
          gravacao_url: string | null
          id: string
          inicio_em: string
          metadata: Json | null
          notas: string | null
          numero_destino: string
          numero_origem: string | null
          oportunidade_id: string | null
          organizacao_id: string
          status: string
          usuario_id: string
        }
        Insert: {
          contato_id?: string | null
          criado_em?: string
          direcao?: string
          duracao_segundos?: number | null
          fim_em?: string | null
          gravacao_url?: string | null
          id?: string
          inicio_em?: string
          metadata?: Json | null
          notas?: string | null
          numero_destino: string
          numero_origem?: string | null
          oportunidade_id?: string | null
          organizacao_id: string
          status?: string
          usuario_id: string
        }
        Update: {
          contato_id?: string | null
          criado_em?: string
          direcao?: string
          duracao_segundos?: number | null
          fim_em?: string | null
          gravacao_url?: string | null
          id?: string
          inicio_em?: string
          metadata?: Json | null
          notas?: string | null
          numero_destino?: string
          numero_origem?: string | null
          oportunidade_id?: string | null
          organizacao_id?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ligacoes_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ligacoes_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ligacoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ligacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      links_compartilhamento_formularios: {
        Row: {
          ativo: boolean
          atualizado_em: string
          codigo_embed: string | null
          criado_em: string
          criado_por: string | null
          formulario_id: string
          id: string
          organizacao_id: string
          qrcode_data: string | null
          tipo: string
          total_cliques: number
          url_completa: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          ativo?: boolean
          atualizado_em?: string
          codigo_embed?: string | null
          criado_em?: string
          criado_por?: string | null
          formulario_id: string
          id?: string
          organizacao_id: string
          qrcode_data?: string | null
          tipo?: string
          total_cliques?: number
          url_completa: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          ativo?: boolean
          atualizado_em?: string
          codigo_embed?: string | null
          criado_em?: string
          criado_por?: string | null
          formulario_id?: string
          id?: string
          organizacao_id?: string
          qrcode_data?: string | null
          tipo?: string
          total_cliques?: number
          url_completa?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "links_compartilhamento_formularios_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_compartilhamento_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "links_compartilhamento_formularios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      log_automacoes: {
        Row: {
          acoes_executadas: Json | null
          automacao_id: string
          criado_em: string
          dados_trigger: Json | null
          duracao_ms: number | null
          entidade_id: string | null
          entidade_tipo: string | null
          erro_mensagem: string | null
          id: string
          organizacao_id: string
          status: string
          trigger_tipo: string
        }
        Insert: {
          acoes_executadas?: Json | null
          automacao_id: string
          criado_em?: string
          dados_trigger?: Json | null
          duracao_ms?: number | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          erro_mensagem?: string | null
          id?: string
          organizacao_id: string
          status?: string
          trigger_tipo: string
        }
        Update: {
          acoes_executadas?: Json | null
          automacao_id?: string
          criado_em?: string
          dados_trigger?: Json | null
          duracao_ms?: number | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          erro_mensagem?: string | null
          id?: string
          organizacao_id?: string
          status?: string
          trigger_tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_automacoes_automacao_id_fkey"
            columns: ["automacao_id"]
            isOneToOne: false
            referencedRelation: "automacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_automacoes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      log_conversions_api: {
        Row: {
          config_id: string | null
          criado_em: string
          entidade_id: string | null
          entidade_tipo: string | null
          event_name: string
          event_time: string
          fbrq_event_id: string | null
          id: string
          organizacao_id: string
          payload_resumo: Json | null
          response_body: string | null
          response_code: number | null
          status: string
        }
        Insert: {
          config_id?: string | null
          criado_em?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          event_name: string
          event_time: string
          fbrq_event_id?: string | null
          id?: string
          organizacao_id: string
          payload_resumo?: Json | null
          response_body?: string | null
          response_code?: number | null
          status: string
        }
        Update: {
          config_id?: string | null
          criado_em?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          event_name?: string
          event_time?: string
          fbrq_event_id?: string | null
          id?: string
          organizacao_id?: string
          payload_resumo?: Json | null
          response_body?: string | null
          response_code?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_conversions_api_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "config_conversions_api"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "log_conversions_api_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      log_webhooks_conversas: {
        Row: {
          canal: string | null
          criado_em: string
          erro: string | null
          evento: string
          id: string
          organizacao_id: string | null
          payload: Json
          processado: boolean | null
          processado_em: string | null
          sessao: string | null
        }
        Insert: {
          canal?: string | null
          criado_em?: string
          erro?: string | null
          evento: string
          id?: string
          organizacao_id?: string | null
          payload: Json
          processado?: boolean | null
          processado_em?: string | null
          sessao?: string | null
        }
        Update: {
          canal?: string | null
          criado_em?: string
          erro?: string | null
          evento?: string
          id?: string
          organizacao_id?: string | null
          payload?: Json
          processado?: boolean | null
          processado_em?: string | null
          sessao?: string | null
        }
        Relationships: []
      }
      logs_webhooks_formularios: {
        Row: {
          concluido_em: string | null
          contagem_retry: number | null
          disparado_em: string | null
          id: string
          mensagem_erro: string | null
          request_body: string | null
          request_headers: Json | null
          request_metodo: string | null
          request_url: string
          response_body: string | null
          response_headers: Json | null
          response_status_code: number | null
          response_tempo_ms: number | null
          status: string | null
          submissao_id: string | null
          webhook_id: string
        }
        Insert: {
          concluido_em?: string | null
          contagem_retry?: number | null
          disparado_em?: string | null
          id?: string
          mensagem_erro?: string | null
          request_body?: string | null
          request_headers?: Json | null
          request_metodo?: string | null
          request_url: string
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          response_tempo_ms?: number | null
          status?: string | null
          submissao_id?: string | null
          webhook_id: string
        }
        Update: {
          concluido_em?: string | null
          contagem_retry?: number | null
          disparado_em?: string | null
          id?: string
          mensagem_erro?: string | null
          request_body?: string | null
          request_headers?: Json | null
          request_metodo?: string | null
          request_url?: string
          response_body?: string | null
          response_headers?: Json | null
          response_status_code?: number | null
          response_tempo_ms?: number | null
          status?: string | null
          submissao_id?: string | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logs_webhooks_formularios_submissao_id_fkey"
            columns: ["submissao_id"]
            isOneToOne: false
            referencedRelation: "submissoes_formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logs_webhooks_formularios_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks_formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens: {
        Row: {
          ack: number | null
          ack_name: string | null
          atualizado_em: string
          body: string | null
          caption: string | null
          conversa_id: string
          criado_em: string
          deletado_em: string | null
          fixada: boolean
          from_me: boolean
          from_number: string | null
          has_media: boolean | null
          id: string
          location_address: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          media_duration: number | null
          media_filename: string | null
          media_mimetype: string | null
          media_size: number | null
          media_url: string | null
          message_id: string
          organizacao_id: string
          participant: string | null
          poll_allow_multiple: boolean | null
          poll_options: Json | null
          poll_question: string | null
          raw_data: Json | null
          reaction_emoji: string | null
          reaction_message_id: string | null
          reply_to_message_id: string | null
          timestamp_externo: number | null
          tipo: string
          to_number: string | null
          vcard: string | null
        }
        Insert: {
          ack?: number | null
          ack_name?: string | null
          atualizado_em?: string
          body?: string | null
          caption?: string | null
          conversa_id: string
          criado_em?: string
          deletado_em?: string | null
          fixada?: boolean
          from_me?: boolean
          from_number?: string | null
          has_media?: boolean | null
          id?: string
          location_address?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          media_duration?: number | null
          media_filename?: string | null
          media_mimetype?: string | null
          media_size?: number | null
          media_url?: string | null
          message_id: string
          organizacao_id: string
          participant?: string | null
          poll_allow_multiple?: boolean | null
          poll_options?: Json | null
          poll_question?: string | null
          raw_data?: Json | null
          reaction_emoji?: string | null
          reaction_message_id?: string | null
          reply_to_message_id?: string | null
          timestamp_externo?: number | null
          tipo: string
          to_number?: string | null
          vcard?: string | null
        }
        Update: {
          ack?: number | null
          ack_name?: string | null
          atualizado_em?: string
          body?: string | null
          caption?: string | null
          conversa_id?: string
          criado_em?: string
          deletado_em?: string | null
          fixada?: boolean
          from_me?: boolean
          from_number?: string | null
          has_media?: boolean | null
          id?: string
          location_address?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          media_duration?: number | null
          media_filename?: string | null
          media_mimetype?: string | null
          media_size?: number | null
          media_url?: string | null
          message_id?: string
          organizacao_id?: string
          participant?: string | null
          poll_allow_multiple?: boolean | null
          poll_options?: Json | null
          poll_question?: string | null
          raw_data?: Json | null
          reaction_emoji?: string | null
          reaction_message_id?: string | null
          reply_to_message_id?: string | null
          timestamp_externo?: number | null
          tipo?: string
          to_number?: string | null
          vcard?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_agendadas: {
        Row: {
          agendado_para: string
          atualizado_em: string
          conteudo: string
          conversa_id: string
          criado_em: string
          enviada_em: string | null
          erro: string | null
          id: string
          media_url: string | null
          organizacao_id: string
          status: string
          timezone: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          agendado_para: string
          atualizado_em?: string
          conteudo: string
          conversa_id: string
          criado_em?: string
          enviada_em?: string | null
          erro?: string | null
          id?: string
          media_url?: string | null
          organizacao_id: string
          status?: string
          timezone?: string
          tipo?: string
          usuario_id: string
        }
        Update: {
          agendado_para?: string
          atualizado_em?: string
          conteudo?: string
          conversa_id?: string
          criado_em?: string
          enviada_em?: string | null
          erro?: string | null
          id?: string
          media_url?: string | null
          organizacao_id?: string
          status?: string
          timezone?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_agendadas_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_agendadas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_agendadas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      mensagens_prontas: {
        Row: {
          atalho: string
          ativo: boolean | null
          atualizado_em: string
          conteudo: string
          criado_em: string
          deletado_em: string | null
          id: string
          organizacao_id: string
          tipo: string
          titulo: string
          usuario_id: string | null
          vezes_usado: number | null
        }
        Insert: {
          atalho: string
          ativo?: boolean | null
          atualizado_em?: string
          conteudo: string
          criado_em?: string
          deletado_em?: string | null
          id?: string
          organizacao_id: string
          tipo: string
          titulo: string
          usuario_id?: string | null
          vezes_usado?: number | null
        }
        Update: {
          atalho?: string
          ativo?: boolean | null
          atualizado_em?: string
          conteudo?: string
          criado_em?: string
          deletado_em?: string | null
          id?: string
          organizacao_id?: string
          tipo?: string
          titulo?: string
          usuario_id?: string | null
          vezes_usado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "mensagens_prontas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensagens_prontas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      metas: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          criado_em: string
          criado_por: string
          data_fim: string
          data_inicio: string
          deletado_em: string | null
          descricao: string | null
          equipe_id: string | null
          funil_id: string | null
          id: string
          meta_pai_id: string | null
          metrica: string
          nome: string
          organizacao_id: string
          periodo: string
          tipo: string
          usuario_id: string | null
          valor_meta: number
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criado_por: string
          data_fim: string
          data_inicio: string
          deletado_em?: string | null
          descricao?: string | null
          equipe_id?: string | null
          funil_id?: string | null
          id?: string
          meta_pai_id?: string | null
          metrica: string
          nome: string
          organizacao_id: string
          periodo: string
          tipo: string
          usuario_id?: string | null
          valor_meta: number
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criado_por?: string
          data_fim?: string
          data_inicio?: string
          deletado_em?: string | null
          descricao?: string | null
          equipe_id?: string | null
          funil_id?: string | null
          id?: string
          meta_pai_id?: string | null
          metrica?: string
          nome?: string
          organizacao_id?: string
          periodo?: string
          tipo?: string
          usuario_id?: string | null
          valor_meta?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_equipe_id_fkey"
            columns: ["equipe_id"]
            isOneToOne: false
            referencedRelation: "equipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_meta_pai_id_fkey"
            columns: ["meta_pai_id"]
            isOneToOne: false
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      metas_progresso: {
        Row: {
          calculado_em: string
          id: string
          meta_id: string
          organizacao_id: string
          percentual_atingido: number
          valor_atual: number
        }
        Insert: {
          calculado_em?: string
          id?: string
          meta_id: string
          organizacao_id: string
          percentual_atingido?: number
          valor_atual?: number
        }
        Update: {
          calculado_em?: string
          id?: string
          meta_id?: string
          organizacao_id?: string
          percentual_atingido?: number
          valor_atual?: number
        }
        Relationships: [
          {
            foreignKeyName: "metas_progresso_meta_id_fkey"
            columns: ["meta_id"]
            isOneToOne: true
            referencedRelation: "metas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "metas_progresso_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos: {
        Row: {
          criado_em: string
          descricao: string | null
          icone: string | null
          id: string
          nome: string
          obrigatorio: boolean | null
          ordem: number | null
          requer: string[] | null
          slug: string
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome: string
          obrigatorio?: boolean | null
          ordem?: number | null
          requer?: string[] | null
          slug: string
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          icone?: string | null
          id?: string
          nome?: string
          obrigatorio?: boolean | null
          ordem?: number | null
          requer?: string[] | null
          slug?: string
        }
        Relationships: []
      }
      motivos_noshow: {
        Row: {
          ativo: boolean | null
          criado_em: string
          deletado_em: string | null
          id: string
          nome: string
          ordem: number | null
          organizacao_id: string
        }
        Insert: {
          ativo?: boolean | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          nome: string
          ordem?: number | null
          organizacao_id: string
        }
        Update: {
          ativo?: boolean | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "motivos_noshow_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      motivos_resultado: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          cor: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          ordem: number | null
          organizacao_id: string
          padrao: boolean | null
          tipo: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          ordem?: number | null
          organizacao_id: string
          padrao?: boolean | null
          tipo: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          cor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          ordem?: number | null
          organizacao_id?: string
          padrao?: boolean | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "motivos_resultado_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "motivos_resultado_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      notas_contato: {
        Row: {
          atualizado_em: string
          contato_id: string
          conteudo: string
          conversa_id: string | null
          criado_em: string
          deletado_em: string | null
          id: string
          organizacao_id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          contato_id: string
          conteudo: string
          conversa_id?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          organizacao_id: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          contato_id?: string
          conteudo?: string
          conversa_id?: string | null
          criado_em?: string
          deletado_em?: string | null
          id?: string
          organizacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notas_contato_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_contato_conversa_id_fkey"
            columns: ["conversa_id"]
            isOneToOne: false
            referencedRelation: "conversas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_contato_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notas_contato_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          criado_em: string
          id: string
          lida: boolean
          lida_em: string | null
          link: string | null
          mensagem: string | null
          referencia_id: string | null
          referencia_tipo: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo: string
          titulo: string
          usuario_id: string
        }
        Update: {
          criado_em?: string
          id?: string
          lida?: boolean
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          referencia_id?: string | null
          referencia_tipo?: string | null
          tipo?: string
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades: {
        Row: {
          atualizado_em: string
          contato_id: string
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          etapa_id: string
          fechado_em: string | null
          funil_id: string
          id: string
          modo_valor: string | null
          moeda: string | null
          motivo_resultado_id: string | null
          observacoes: string | null
          organizacao_id: string
          origem: string | null
          periodo_recorrencia: string | null
          posicao: number
          previsao_fechamento: string | null
          qualificado_mql: boolean | null
          qualificado_mql_em: string | null
          qualificado_sql: boolean | null
          qualificado_sql_em: string | null
          recorrente: boolean | null
          tipo_valor: string | null
          titulo: string
          usuario_responsavel_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor: number | null
        }
        Insert: {
          atualizado_em?: string
          contato_id: string
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          etapa_id: string
          fechado_em?: string | null
          funil_id: string
          id?: string
          modo_valor?: string | null
          moeda?: string | null
          motivo_resultado_id?: string | null
          observacoes?: string | null
          organizacao_id: string
          origem?: string | null
          periodo_recorrencia?: string | null
          posicao?: number
          previsao_fechamento?: string | null
          qualificado_mql?: boolean | null
          qualificado_mql_em?: string | null
          qualificado_sql?: boolean | null
          qualificado_sql_em?: string | null
          recorrente?: boolean | null
          tipo_valor?: string | null
          titulo: string
          usuario_responsavel_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
        }
        Update: {
          atualizado_em?: string
          contato_id?: string
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          etapa_id?: string
          fechado_em?: string | null
          funil_id?: string
          id?: string
          modo_valor?: string | null
          moeda?: string | null
          motivo_resultado_id?: string | null
          observacoes?: string | null
          organizacao_id?: string
          origem?: string | null
          periodo_recorrencia?: string | null
          posicao?: number
          previsao_fechamento?: string | null
          qualificado_mql?: boolean | null
          qualificado_mql_em?: string | null
          qualificado_sql?: boolean | null
          qualificado_sql_em?: string | null
          recorrente?: boolean | null
          tipo_valor?: string | null
          titulo?: string
          usuario_responsavel_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "etapas_funil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_motivo_resultado_id_fkey"
            columns: ["motivo_resultado_id"]
            isOneToOne: false
            referencedRelation: "motivos_resultado"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_usuario_responsavel_id_fkey"
            columns: ["usuario_responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      oportunidades_produtos: {
        Row: {
          criado_em: string
          desconto_percentual: number | null
          id: string
          oportunidade_id: string
          organizacao_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          subtotal: number
        }
        Insert: {
          criado_em?: string
          desconto_percentual?: number | null
          id?: string
          oportunidade_id: string
          organizacao_id: string
          preco_unitario: number
          produto_id: string
          quantidade?: number
          subtotal: number
        }
        Update: {
          criado_em?: string
          desconto_percentual?: number | null
          id?: string
          oportunidade_id?: string
          organizacao_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "oportunidades_produtos_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_produtos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oportunidades_produtos_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes_expectativas: {
        Row: {
          atualizado_em: string
          como_conheceu: string | null
          criado_em: string
          id: string
          numero_usuarios: string | null
          observacoes: string | null
          organizacao_id: string
          principal_objetivo: string | null
          volume_leads_mes: string | null
        }
        Insert: {
          atualizado_em?: string
          como_conheceu?: string | null
          criado_em?: string
          id?: string
          numero_usuarios?: string | null
          observacoes?: string | null
          organizacao_id: string
          principal_objetivo?: string | null
          volume_leads_mes?: string | null
        }
        Update: {
          atualizado_em?: string
          como_conheceu?: string | null
          criado_em?: string
          id?: string
          numero_usuarios?: string | null
          observacoes?: string | null
          organizacao_id?: string
          principal_objetivo?: string | null
          volume_leads_mes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizacoes_expectativas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes_modulos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          configuracoes: Json | null
          criado_em: string
          id: string
          modulo_id: string
          ordem: number | null
          organizacao_id: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          configuracoes?: Json | null
          criado_em?: string
          id?: string
          modulo_id: string
          ordem?: number | null
          organizacao_id: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          configuracoes?: Json | null
          criado_em?: string
          id?: string
          modulo_id?: string
          ordem?: number | null
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizacoes_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizacoes_modulos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacoes_saas: {
        Row: {
          atualizado_em: string
          codigo_parceiro_origem: string | null
          criado_em: string
          deletado_em: string | null
          email: string
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_estado: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          id: string
          limite_oportunidades: number | null
          limite_storage_mb: number | null
          limite_usuarios: number | null
          nome: string
          plano: string
          segmento: string | null
          slug: string
          status: string
          telefone: string | null
          trial_expira_em: string | null
          website: string | null
        }
        Insert: {
          atualizado_em?: string
          codigo_parceiro_origem?: string | null
          criado_em?: string
          deletado_em?: string | null
          email: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          id?: string
          limite_oportunidades?: number | null
          limite_storage_mb?: number | null
          limite_usuarios?: number | null
          nome: string
          plano?: string
          segmento?: string | null
          slug: string
          status?: string
          telefone?: string | null
          trial_expira_em?: string | null
          website?: string | null
        }
        Update: {
          atualizado_em?: string
          codigo_parceiro_origem?: string | null
          criado_em?: string
          deletado_em?: string | null
          email?: string
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_estado?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          id?: string
          limite_oportunidades?: number | null
          limite_storage_mb?: number | null
          limite_usuarios?: number | null
          nome?: string
          plano?: string
          segmento?: string | null
          slug?: string
          status?: string
          telefone?: string | null
          trial_expira_em?: string | null
          website?: string | null
        }
        Relationships: []
      }
      origens: {
        Row: {
          ativo: boolean
          cor: string | null
          criado_em: string
          id: string
          nome: string
          organizacao_id: string
          padrao_sistema: boolean
          slug: string
        }
        Insert: {
          ativo?: boolean
          cor?: string | null
          criado_em?: string
          id?: string
          nome: string
          organizacao_id: string
          padrao_sistema?: boolean
          slug: string
        }
        Update: {
          ativo?: boolean
          cor?: string | null
          criado_em?: string
          id?: string
          nome?: string
          organizacao_id?: string
          padrao_sistema?: boolean
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "origens_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      paginas_meta: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          conexao_id: string
          criado_em: string
          id: string
          leads_retrieval: boolean | null
          organizacao_id: string
          page_access_token_encrypted: string | null
          page_id: string
          page_name: string | null
          pages_manage_ads: boolean | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          conexao_id: string
          criado_em?: string
          id?: string
          leads_retrieval?: boolean | null
          organizacao_id: string
          page_access_token_encrypted?: string | null
          page_id: string
          page_name?: string | null
          pages_manage_ads?: boolean | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          conexao_id?: string
          criado_em?: string
          id?: string
          leads_retrieval?: boolean | null
          organizacao_id?: string
          page_access_token_encrypted?: string | null
          page_id?: string
          page_name?: string | null
          pages_manage_ads?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "paginas_meta_conexao_id_fkey"
            columns: ["conexao_id"]
            isOneToOne: false
            referencedRelation: "conexoes_meta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paginas_meta_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      papeis: {
        Row: {
          criado_em: string
          descricao: string | null
          id: string
          nivel: number
          nome: string
        }
        Insert: {
          criado_em?: string
          descricao?: string | null
          id?: string
          nivel: number
          nome: string
        }
        Update: {
          criado_em?: string
          descricao?: string | null
          id?: string
          nivel?: number
          nome?: string
        }
        Relationships: []
      }
      parceiros: {
        Row: {
          aderiu_em: string
          atualizado_em: string
          codigo_indicacao: string
          criado_em: string
          gratuidade_aplicada_em: string | null
          gratuidade_valida_ate: string | null
          id: string
          motivo_suspensao: string | null
          nivel_override: string | null
          organizacao_id: string
          percentual_comissao: number | null
          status: string
          suspenso_em: string | null
          usuario_id: string
        }
        Insert: {
          aderiu_em?: string
          atualizado_em?: string
          codigo_indicacao: string
          criado_em?: string
          gratuidade_aplicada_em?: string | null
          gratuidade_valida_ate?: string | null
          id?: string
          motivo_suspensao?: string | null
          nivel_override?: string | null
          organizacao_id: string
          percentual_comissao?: number | null
          status?: string
          suspenso_em?: string | null
          usuario_id: string
        }
        Update: {
          aderiu_em?: string
          atualizado_em?: string
          codigo_indicacao?: string
          criado_em?: string
          gratuidade_aplicada_em?: string | null
          gratuidade_valida_ate?: string | null
          id?: string
          motivo_suspensao?: string | null
          nivel_override?: string | null
          organizacao_id?: string
          percentual_comissao?: number | null
          status?: string
          suspenso_em?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parceiros_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: true
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parceiros_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfis_permissao: {
        Row: {
          atualizado_em: string
          criado_em: string
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          organizacao_id: string
          padrao: boolean | null
          permissoes: Json
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          organizacao_id: string
          padrao?: boolean | null
          permissoes?: Json
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          organizacao_id?: string
          padrao?: boolean | null
          permissoes?: Json
        }
        Relationships: [
          {
            foreignKeyName: "perfis_permissao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      planos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          criado_em: string
          descricao: string | null
          id: string
          limite_contatos: number | null
          limite_oportunidades: number | null
          limite_storage_mb: number
          limite_usuarios: number
          moeda: string | null
          nome: string
          ordem: number | null
          popular: boolean | null
          preco_anual: number | null
          preco_mensal: number | null
          stripe_price_id_anual: string | null
          stripe_price_id_mensal: string | null
          ttl_midia_dias: number
          visivel: boolean | null
          visivel_parceiros: boolean
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          limite_contatos?: number | null
          limite_oportunidades?: number | null
          limite_storage_mb: number
          limite_usuarios: number
          moeda?: string | null
          nome: string
          ordem?: number | null
          popular?: boolean | null
          preco_anual?: number | null
          preco_mensal?: number | null
          stripe_price_id_anual?: string | null
          stripe_price_id_mensal?: string | null
          ttl_midia_dias?: number
          visivel?: boolean | null
          visivel_parceiros?: boolean
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          descricao?: string | null
          id?: string
          limite_contatos?: number | null
          limite_oportunidades?: number | null
          limite_storage_mb?: number
          limite_usuarios?: number
          moeda?: string | null
          nome?: string
          ordem?: number | null
          popular?: boolean | null
          preco_anual?: number | null
          preco_mensal?: number | null
          stripe_price_id_anual?: string | null
          stripe_price_id_mensal?: string | null
          ttl_midia_dias?: number
          visivel?: boolean | null
          visivel_parceiros?: boolean
        }
        Relationships: []
      }
      planos_modulos: {
        Row: {
          configuracoes: Json | null
          criado_em: string
          id: string
          modulo_id: string
          plano_id: string
        }
        Insert: {
          configuracoes?: Json | null
          criado_em?: string
          id?: string
          modulo_id: string
          plano_id: string
        }
        Update: {
          configuracoes?: Json | null
          criado_em?: string
          id?: string
          modulo_id?: string
          plano_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planos_modulos_modulo_id_fkey"
            columns: ["modulo_id"]
            isOneToOne: false
            referencedRelation: "modulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planos_modulos_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_cadastros_saas: {
        Row: {
          aceite_termos: boolean
          aceite_termos_em: string | null
          atualizado_em: string
          codigo_parceiro: string | null
          criado_em: string
          email: string
          id: string
          is_trial: boolean | null
          nome_contato: string
          nome_empresa: string
          organizacao_id: string | null
          periodo: string | null
          plano_id: string | null
          segmento: string
          status: string | null
          stripe_session_id: string | null
          telefone: string | null
          utms: Json | null
        }
        Insert: {
          aceite_termos?: boolean
          aceite_termos_em?: string | null
          atualizado_em?: string
          codigo_parceiro?: string | null
          criado_em?: string
          email: string
          id?: string
          is_trial?: boolean | null
          nome_contato: string
          nome_empresa: string
          organizacao_id?: string | null
          periodo?: string | null
          plano_id?: string | null
          segmento: string
          status?: string | null
          stripe_session_id?: string | null
          telefone?: string | null
          utms?: Json | null
        }
        Update: {
          aceite_termos?: boolean
          aceite_termos_em?: string | null
          atualizado_em?: string
          codigo_parceiro?: string | null
          criado_em?: string
          email?: string
          id?: string
          is_trial?: boolean | null
          nome_contato?: string
          nome_empresa?: string
          organizacao_id?: string | null
          periodo?: string | null
          plano_id?: string | null
          segmento?: string
          status?: string | null
          stripe_session_id?: string | null
          telefone?: string | null
          utms?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_cadastros_saas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_cadastros_saas_plano_id_fkey"
            columns: ["plano_id"]
            isOneToOne: false
            referencedRelation: "planos"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_oportunidades: {
        Row: {
          atualizado_em: string
          criado_em: string
          deletado_em: string | null
          funil_destino_id: string
          id: string
          integracao_id: string | null
          motivo_rejeicao: string | null
          oportunidade_id: string | null
          organizacao_id: string
          phone_name: string | null
          phone_number: string
          primeira_mensagem: string | null
          primeira_mensagem_em: string | null
          processado_em: string | null
          processado_por: string | null
          profile_picture_url: string | null
          status: string
          total_mensagens: number | null
          ultima_mensagem: string | null
          ultima_mensagem_em: string | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          funil_destino_id: string
          id?: string
          integracao_id?: string | null
          motivo_rejeicao?: string | null
          oportunidade_id?: string | null
          organizacao_id: string
          phone_name?: string | null
          phone_number: string
          primeira_mensagem?: string | null
          primeira_mensagem_em?: string | null
          processado_em?: string | null
          processado_por?: string | null
          profile_picture_url?: string | null
          status?: string
          total_mensagens?: number | null
          ultima_mensagem?: string | null
          ultima_mensagem_em?: string | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          deletado_em?: string | null
          funil_destino_id?: string
          id?: string
          integracao_id?: string | null
          motivo_rejeicao?: string | null
          oportunidade_id?: string | null
          organizacao_id?: string
          phone_name?: string | null
          phone_number?: string
          primeira_mensagem?: string | null
          primeira_mensagem_em?: string | null
          processado_em?: string | null
          processado_por?: string | null
          profile_picture_url?: string | null
          status?: string
          total_mensagens?: number | null
          ultima_mensagem?: string | null
          ultima_mensagem_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_oportunidades_funil_destino_id_fkey"
            columns: ["funil_destino_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_oportunidades_integracao_id_fkey"
            columns: ["integracao_id"]
            isOneToOne: false
            referencedRelation: "integracoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_oportunidades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_oportunidades_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_oportunidades_processado_por_fkey"
            columns: ["processado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_colunas_contatos: {
        Row: {
          atualizado_em: string | null
          colunas: Json
          criado_em: string | null
          id: string
          tipo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string | null
          colunas: Json
          criado_em?: string | null
          id?: string
          tipo: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string | null
          colunas?: Json
          criado_em?: string | null
          id?: string
          tipo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_colunas_contatos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_dashboard: {
        Row: {
          atualizado_em: string
          config_exibicao: Json
          criado_em: string
          id: string
          ordem_blocos: Json | null
          organizacao_id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          config_exibicao?: Json
          criado_em?: string
          id?: string
          ordem_blocos?: Json | null
          organizacao_id: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          config_exibicao?: Json
          criado_em?: string
          id?: string
          ordem_blocos?: Json | null
          organizacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_dashboard_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferencias_dashboard_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_filtros_kanban: {
        Row: {
          atualizado_em: string
          criado_em: string
          filtros: Json
          id: string
          nome: string
          organizacao_id: string
          padrao: boolean
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          filtros?: Json
          id?: string
          nome: string
          organizacao_id: string
          padrao?: boolean
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          filtros?: Json
          id?: string
          nome?: string
          organizacao_id?: string
          padrao?: boolean
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_filtros_kanban_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferencias_filtros_kanban_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      preferencias_metricas: {
        Row: {
          atualizado_em: string
          campos_contato_visiveis: string[] | null
          criado_em: string
          funil_id: string
          id: string
          metricas_visiveis: string[] | null
          organizacao_id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          campos_contato_visiveis?: string[] | null
          criado_em?: string
          funil_id: string
          id?: string
          metricas_visiveis?: string[] | null
          organizacao_id: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          campos_contato_visiveis?: string[] | null
          criado_em?: string
          funil_id?: string
          id?: string
          metricas_visiveis?: string[] | null
          organizacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preferencias_metricas_funil_id_fkey"
            columns: ["funil_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferencias_metricas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "preferencias_metricas_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          categoria_id: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          id: string
          moeda: string | null
          nome: string
          organizacao_id: string
          periodo_recorrencia: string | null
          preco: number
          recorrente: boolean | null
          sku: string | null
          unidade: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          moeda?: string | null
          nome: string
          organizacao_id: string
          periodo_recorrencia?: string | null
          preco?: number
          recorrente?: boolean | null
          sku?: string | null
          unidade?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          categoria_id?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          moeda?: string | null
          nome?: string
          organizacao_id?: string
          periodo_recorrencia?: string | null
          preco?: number
          recorrente?: boolean | null
          sku?: string | null
          unidade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produtos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_produtos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "produtos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      ramais_voip: {
        Row: {
          atualizado_em: string
          criado_em: string
          extension: string
          id: string
          nome_exibicao: string | null
          organizacao_id: string
          password_encrypted: string
          sip_server: string
          status: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          extension: string
          id?: string
          nome_exibicao?: string | null
          organizacao_id: string
          password_encrypted: string
          sip_server?: string
          status?: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          extension?: string
          id?: string
          nome_exibicao?: string | null
          organizacao_id?: string
          password_encrypted?: string
          sip_server?: string
          status?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ramais_voip_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ramais_voip_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits_formularios: {
        Row: {
          formulario_id: string
          id: string
          ip_address: unknown
          primeira_tentativa: string
          tentativas: number
          ultima_tentativa: string
        }
        Insert: {
          formulario_id: string
          id?: string
          ip_address: unknown
          primeira_tentativa?: string
          tentativas?: number
          ultima_tentativa?: string
        }
        Update: {
          formulario_id?: string
          id?: string
          ip_address?: unknown
          primeira_tentativa?: string
          tentativas?: number
          ultima_tentativa?: string
        }
        Relationships: [
          {
            foreignKeyName: "rate_limits_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      refresh_tokens: {
        Row: {
          criado_em: string
          dispositivo: string | null
          expira_em: string
          id: string
          ip: unknown
          revogado_em: string | null
          token_hash: string
          user_agent: string | null
          usuario_id: string
        }
        Insert: {
          criado_em?: string
          dispositivo?: string | null
          expira_em: string
          id?: string
          ip?: unknown
          revogado_em?: string | null
          token_hash: string
          user_agent?: string | null
          usuario_id: string
        }
        Update: {
          criado_em?: string
          dispositivo?: string | null
          expira_em?: string
          id?: string
          ip?: unknown
          revogado_em?: string | null
          token_hash?: string
          user_agent?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_tokens_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_condicionais_formularios: {
        Row: {
          ativa: boolean | null
          atualizado_em: string | null
          campo_alvo_id: string | null
          condicoes: Json
          criado_em: string | null
          formulario_id: string
          id: string
          indice_etapa_alvo: number | null
          logica_condicoes: string | null
          nome_regra: string
          ordem_regra: number
          tipo_acao: string
          url_redirecionamento_alvo: string | null
          valor_alvo: string | null
        }
        Insert: {
          ativa?: boolean | null
          atualizado_em?: string | null
          campo_alvo_id?: string | null
          condicoes?: Json
          criado_em?: string | null
          formulario_id: string
          id?: string
          indice_etapa_alvo?: number | null
          logica_condicoes?: string | null
          nome_regra: string
          ordem_regra?: number
          tipo_acao: string
          url_redirecionamento_alvo?: string | null
          valor_alvo?: string | null
        }
        Update: {
          ativa?: boolean | null
          atualizado_em?: string | null
          campo_alvo_id?: string | null
          condicoes?: Json
          criado_em?: string | null
          formulario_id?: string
          id?: string
          indice_etapa_alvo?: number | null
          logica_condicoes?: string | null
          nome_regra?: string
          ordem_regra?: number
          tipo_acao?: string
          url_redirecionamento_alvo?: string | null
          valor_alvo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regras_condicionais_formularios_campo_alvo_id_fkey"
            columns: ["campo_alvo_id"]
            isOneToOne: false
            referencedRelation: "campos_formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_condicionais_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      regras_qualificacao: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          campo_id: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          operador: string
          ordem: number | null
          organizacao_id: string
          valor: string | null
          valores: Json | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          campo_id?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          operador: string
          ordem?: number | null
          organizacao_id: string
          valor?: string | null
          valores?: Json | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          campo_id?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          operador?: string
          ordem?: number | null
          organizacao_id?: string
          valor?: string | null
          valores?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "regras_qualificacao_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos_customizados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_qualificacao_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_qualificacao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      reunioes_oportunidades: {
        Row: {
          atualizado_em: string
          cancelada_em: string | null
          criado_em: string
          data_fim: string
          data_inicio: string
          deletado_em: string | null
          descricao: string | null
          google_event_id: string | null
          google_meet_link: string | null
          id: string
          local: string | null
          motivo_cancelamento: string | null
          motivo_noshow: string | null
          motivo_noshow_id: string | null
          notificacao_minutos: number | null
          observacoes_noshow: string | null
          observacoes_realizacao: string | null
          oportunidade_id: string
          organizacao_id: string
          participantes: Json | null
          realizada_em: string | null
          reuniao_reagendada_id: string | null
          sincronizado_google: boolean | null
          status: string
          tipo: string | null
          titulo: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          cancelada_em?: string | null
          criado_em?: string
          data_fim: string
          data_inicio: string
          deletado_em?: string | null
          descricao?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          local?: string | null
          motivo_cancelamento?: string | null
          motivo_noshow?: string | null
          motivo_noshow_id?: string | null
          notificacao_minutos?: number | null
          observacoes_noshow?: string | null
          observacoes_realizacao?: string | null
          oportunidade_id: string
          organizacao_id: string
          participantes?: Json | null
          realizada_em?: string | null
          reuniao_reagendada_id?: string | null
          sincronizado_google?: boolean | null
          status?: string
          tipo?: string | null
          titulo: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          cancelada_em?: string | null
          criado_em?: string
          data_fim?: string
          data_inicio?: string
          deletado_em?: string | null
          descricao?: string | null
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          local?: string | null
          motivo_cancelamento?: string | null
          motivo_noshow?: string | null
          motivo_noshow_id?: string | null
          notificacao_minutos?: number | null
          observacoes_noshow?: string | null
          observacoes_realizacao?: string | null
          oportunidade_id?: string
          organizacao_id?: string
          participantes?: Json | null
          realizada_em?: string | null
          reuniao_reagendada_id?: string | null
          sincronizado_google?: boolean | null
          status?: string
          tipo?: string | null
          titulo?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reunioes_oportunidades_motivo_noshow_id_fkey"
            columns: ["motivo_noshow_id"]
            isOneToOne: false
            referencedRelation: "motivos_noshow"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_oportunidades_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_oportunidades_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_oportunidades_reuniao_reagendada_id_fkey"
            columns: ["reuniao_reagendada_id"]
            isOneToOne: false
            referencedRelation: "reunioes_oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reunioes_oportunidades_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      segmentos: {
        Row: {
          atualizado_em: string
          cor: string
          criado_em: string
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          organizacao_id: string
        }
        Insert: {
          atualizado_em?: string
          cor: string
          criado_em?: string
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          organizacao_id: string
        }
        Update: {
          atualizado_em?: string
          cor?: string
          criado_em?: string
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          organizacao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "segmentos_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_impersonacao: {
        Row: {
          admin_alvo_id: string
          ativo: boolean
          criado_em: string
          encerrado_em: string | null
          expira_em: string
          id: string
          ip_origem: string | null
          motivo: string
          organizacao_id: string
          super_admin_id: string
          token_hash: string
          user_agent: string | null
        }
        Insert: {
          admin_alvo_id: string
          ativo?: boolean
          criado_em?: string
          encerrado_em?: string | null
          expira_em: string
          id?: string
          ip_origem?: string | null
          motivo: string
          organizacao_id: string
          super_admin_id: string
          token_hash: string
          user_agent?: string | null
        }
        Update: {
          admin_alvo_id?: string
          ativo?: boolean
          criado_em?: string
          encerrado_em?: string | null
          expira_em?: string
          id?: string
          ip_origem?: string | null
          motivo?: string
          organizacao_id?: string
          super_admin_id?: string
          token_hash?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_impersonacao_admin_alvo_id_fkey"
            columns: ["admin_alvo_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_impersonacao_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_impersonacao_super_admin_id_fkey"
            columns: ["super_admin_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sessoes_whatsapp: {
        Row: {
          atualizado_em: string
          auto_criar_pre_oportunidade: boolean | null
          conectado_em: string | null
          criado_em: string
          deletado_em: string | null
          desconectado_em: string | null
          etiqueta_comportamento_fechada: string | null
          etiqueta_move_oportunidade: boolean | null
          funil_destino_id: string | null
          id: string
          organizacao_id: string
          phone_name: string | null
          phone_number: string | null
          session_name: string
          status: string
          total_mensagens_enviadas: number | null
          total_mensagens_recebidas: number | null
          ultima_mensagem_em: string | null
          ultimo_qr_gerado: string | null
          usuario_id: string
          webhook_events: string[] | null
          webhook_url: string | null
        }
        Insert: {
          atualizado_em?: string
          auto_criar_pre_oportunidade?: boolean | null
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          desconectado_em?: string | null
          etiqueta_comportamento_fechada?: string | null
          etiqueta_move_oportunidade?: boolean | null
          funil_destino_id?: string | null
          id?: string
          organizacao_id: string
          phone_name?: string | null
          phone_number?: string | null
          session_name: string
          status?: string
          total_mensagens_enviadas?: number | null
          total_mensagens_recebidas?: number | null
          ultima_mensagem_em?: string | null
          ultimo_qr_gerado?: string | null
          usuario_id: string
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          atualizado_em?: string
          auto_criar_pre_oportunidade?: boolean | null
          conectado_em?: string | null
          criado_em?: string
          deletado_em?: string | null
          desconectado_em?: string | null
          etiqueta_comportamento_fechada?: string | null
          etiqueta_move_oportunidade?: boolean | null
          funil_destino_id?: string | null
          id?: string
          organizacao_id?: string
          phone_name?: string | null
          phone_number?: string | null
          session_name?: string
          status?: string
          total_mensagens_enviadas?: number | null
          total_mensagens_recebidas?: number | null
          ultima_mensagem_em?: string | null
          ultimo_qr_gerado?: string | null
          usuario_id?: string
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessoes_whatsapp_funil_destino_id_fkey"
            columns: ["funil_destino_id"]
            isOneToOne: false
            referencedRelation: "funis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_whatsapp_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessoes_whatsapp_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      submissoes_formularios: {
        Row: {
          captcha_validado: boolean | null
          contato_id: string | null
          criado_em: string
          dados: Json
          erro_mensagem: string | null
          formulario_id: string
          geo_cidade: string | null
          geo_estado: string | null
          geo_pais: string | null
          honeypot_preenchido: boolean
          id: string
          ip_address: unknown
          lead_score: number | null
          oportunidade_id: string | null
          organizacao_id: string
          pagina_origem: string | null
          referrer: string | null
          status: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          captcha_validado?: boolean | null
          contato_id?: string | null
          criado_em?: string
          dados?: Json
          erro_mensagem?: string | null
          formulario_id: string
          geo_cidade?: string | null
          geo_estado?: string | null
          geo_pais?: string | null
          honeypot_preenchido?: boolean
          id?: string
          ip_address?: unknown
          lead_score?: number | null
          oportunidade_id?: string | null
          organizacao_id: string
          pagina_origem?: string | null
          referrer?: string | null
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          captcha_validado?: boolean | null
          contato_id?: string | null
          criado_em?: string
          dados?: Json
          erro_mensagem?: string | null
          formulario_id?: string
          geo_cidade?: string | null
          geo_estado?: string | null
          geo_pais?: string | null
          honeypot_preenchido?: boolean
          id?: string
          ip_address?: unknown
          lead_score?: number | null
          oportunidade_id?: string | null
          organizacao_id?: string
          pagina_origem?: string | null
          referrer?: string | null
          status?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissoes_formularios_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissoes_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissoes_formularios_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissoes_formularios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas: {
        Row: {
          assunto_email: string | null
          atualizado_em: string
          audio_url: string | null
          canal: string | null
          contato_id: string | null
          corpo_mensagem: string | null
          criado_em: string
          criado_por_id: string | null
          data_conclusao: string | null
          data_vencimento: string | null
          deletado_em: string | null
          descricao: string | null
          etapa_origem_id: string | null
          id: string
          lembrete_em: string | null
          lembrete_enviado: boolean | null
          modo: string | null
          oportunidade_id: string | null
          organizacao_id: string
          owner_id: string | null
          prioridade: string | null
          status: string
          tarefa_template_id: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          assunto_email?: string | null
          atualizado_em?: string
          audio_url?: string | null
          canal?: string | null
          contato_id?: string | null
          corpo_mensagem?: string | null
          criado_em?: string
          criado_por_id?: string | null
          data_conclusao?: string | null
          data_vencimento?: string | null
          deletado_em?: string | null
          descricao?: string | null
          etapa_origem_id?: string | null
          id?: string
          lembrete_em?: string | null
          lembrete_enviado?: boolean | null
          modo?: string | null
          oportunidade_id?: string | null
          organizacao_id: string
          owner_id?: string | null
          prioridade?: string | null
          status?: string
          tarefa_template_id?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          assunto_email?: string | null
          atualizado_em?: string
          audio_url?: string | null
          canal?: string | null
          contato_id?: string | null
          corpo_mensagem?: string | null
          criado_em?: string
          criado_por_id?: string | null
          data_conclusao?: string | null
          data_vencimento?: string | null
          deletado_em?: string | null
          descricao?: string | null
          etapa_origem_id?: string | null
          id?: string
          lembrete_em?: string | null
          lembrete_enviado?: boolean | null
          modo?: string | null
          oportunidade_id?: string | null
          organizacao_id?: string
          owner_id?: string | null
          prioridade?: string | null
          status?: string
          tarefa_template_id?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_contato_id_fkey"
            columns: ["contato_id"]
            isOneToOne: false
            referencedRelation: "contatos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_criado_por_id_fkey"
            columns: ["criado_por_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_etapa_origem_id_fkey"
            columns: ["etapa_origem_id"]
            isOneToOne: false
            referencedRelation: "etapas_funil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_oportunidade_id_fkey"
            columns: ["oportunidade_id"]
            isOneToOne: false
            referencedRelation: "oportunidades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_tarefa_template_id_fkey"
            columns: ["tarefa_template_id"]
            isOneToOne: false
            referencedRelation: "tarefas_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tarefas_templates: {
        Row: {
          assunto_email: string | null
          ativo: boolean | null
          atualizado_em: string
          audio_url: string | null
          canal: string | null
          corpo_mensagem: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          dias_prazo: number | null
          id: string
          modo: string | null
          organizacao_id: string
          prioridade: string | null
          tipo: string
          titulo: string
        }
        Insert: {
          assunto_email?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          audio_url?: string | null
          canal?: string | null
          corpo_mensagem?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          dias_prazo?: number | null
          id?: string
          modo?: string | null
          organizacao_id: string
          prioridade?: string | null
          tipo: string
          titulo: string
        }
        Update: {
          assunto_email?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          audio_url?: string | null
          canal?: string | null
          corpo_mensagem?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          dias_prazo?: number | null
          id?: string
          modo?: string | null
          organizacao_id?: string
          prioridade?: string | null
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_templates_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_templates_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      testes_ab_formularios: {
        Row: {
          atualizado_em: string | null
          concluido_em: string | null
          confianca_minima: number | null
          criado_em: string | null
          criado_por: string | null
          descricao_teste: string | null
          duracao_minima_dias: number | null
          formulario_id: string
          id: string
          iniciado_em: string | null
          metrica_objetivo: string | null
          minimo_submissoes: number | null
          nome_teste: string
          organizacao_id: string
          pausado_em: string | null
          status: string
          variante_vencedora_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          concluido_em?: string | null
          confianca_minima?: number | null
          criado_em?: string | null
          criado_por?: string | null
          descricao_teste?: string | null
          duracao_minima_dias?: number | null
          formulario_id: string
          id?: string
          iniciado_em?: string | null
          metrica_objetivo?: string | null
          minimo_submissoes?: number | null
          nome_teste: string
          organizacao_id: string
          pausado_em?: string | null
          status?: string
          variante_vencedora_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          concluido_em?: string | null
          confianca_minima?: number | null
          criado_em?: string | null
          criado_por?: string | null
          descricao_teste?: string | null
          duracao_minima_dias?: number | null
          formulario_id?: string
          id?: string
          iniciado_em?: string | null
          metrica_objetivo?: string | null
          minimo_submissoes?: number | null
          nome_teste?: string
          organizacao_id?: string
          pausado_em?: string | null
          status?: string
          variante_vencedora_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testes_ab_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testes_ab_formularios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "testes_ab_variante_vencedora_fkey"
            columns: ["variante_vencedora_id"]
            isOneToOne: false
            referencedRelation: "variantes_ab_formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          atualizado_em: string
          auth_id: string | null
          avatar_url: string | null
          criado_em: string
          deletado_em: string | null
          email: string
          email_verificado: boolean | null
          foto_storage_path: string | null
          id: string
          nome: string
          organizacao_id: string | null
          perfil_permissao_id: string | null
          permissoes_conexoes: Json | null
          role: string
          senha_alterada_em: string | null
          sobrenome: string | null
          status: string
          telefone: string | null
          ultimo_login: string | null
        }
        Insert: {
          atualizado_em?: string
          auth_id?: string | null
          avatar_url?: string | null
          criado_em?: string
          deletado_em?: string | null
          email: string
          email_verificado?: boolean | null
          foto_storage_path?: string | null
          id?: string
          nome: string
          organizacao_id?: string | null
          perfil_permissao_id?: string | null
          permissoes_conexoes?: Json | null
          role?: string
          senha_alterada_em?: string | null
          sobrenome?: string | null
          status?: string
          telefone?: string | null
          ultimo_login?: string | null
        }
        Update: {
          atualizado_em?: string
          auth_id?: string | null
          avatar_url?: string | null
          criado_em?: string
          deletado_em?: string | null
          email?: string
          email_verificado?: boolean | null
          foto_storage_path?: string | null
          id?: string
          nome?: string
          organizacao_id?: string | null
          perfil_permissao_id?: string | null
          permissoes_conexoes?: Json | null
          role?: string
          senha_alterada_em?: string | null
          sobrenome?: string | null
          status?: string
          telefone?: string | null
          ultimo_login?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_perfil_permissao_id_fkey"
            columns: ["perfil_permissao_id"]
            isOneToOne: false
            referencedRelation: "perfis_permissao"
            referencedColumns: ["id"]
          },
        ]
      }
      valores_campos_customizados: {
        Row: {
          atualizado_em: string
          campo_id: string
          criado_em: string
          entidade_id: string
          entidade_tipo: string
          id: string
          organizacao_id: string
          valor_booleano: boolean | null
          valor_data: string | null
          valor_json: Json | null
          valor_numero: number | null
          valor_texto: string | null
        }
        Insert: {
          atualizado_em?: string
          campo_id: string
          criado_em?: string
          entidade_id: string
          entidade_tipo: string
          id?: string
          organizacao_id: string
          valor_booleano?: boolean | null
          valor_data?: string | null
          valor_json?: Json | null
          valor_numero?: number | null
          valor_texto?: string | null
        }
        Update: {
          atualizado_em?: string
          campo_id?: string
          criado_em?: string
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          organizacao_id?: string
          valor_booleano?: boolean | null
          valor_data?: string | null
          valor_json?: Json | null
          valor_numero?: number | null
          valor_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valores_campos_customizados_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos_customizados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valores_campos_customizados_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      variantes_ab_formularios: {
        Row: {
          alteracoes: Json
          contagem_submissoes: number | null
          contagem_visualizacoes: number | null
          criado_em: string | null
          e_controle: boolean | null
          id: string
          letra_variante: string
          nome_variante: string
          porcentagem_trafego: number | null
          taxa_conversao: number | null
          teste_ab_id: string
        }
        Insert: {
          alteracoes?: Json
          contagem_submissoes?: number | null
          contagem_visualizacoes?: number | null
          criado_em?: string | null
          e_controle?: boolean | null
          id?: string
          letra_variante: string
          nome_variante: string
          porcentagem_trafego?: number | null
          taxa_conversao?: number | null
          teste_ab_id: string
        }
        Update: {
          alteracoes?: Json
          contagem_submissoes?: number | null
          contagem_visualizacoes?: number | null
          criado_em?: string | null
          e_controle?: boolean | null
          id?: string
          letra_variante?: string
          nome_variante?: string
          porcentagem_trafego?: number | null
          taxa_conversao?: number | null
          teste_ab_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variantes_ab_formularios_teste_ab_id_fkey"
            columns: ["teste_ab_id"]
            isOneToOne: false
            referencedRelation: "testes_ab_formularios"
            referencedColumns: ["id"]
          },
        ]
      }
      visualizacoes_dashboard: {
        Row: {
          atualizado_em: string
          config_exibicao: Json
          criado_em: string
          filtros: Json
          id: string
          nome: string
          organizacao_id: string
          usuario_id: string
        }
        Insert: {
          atualizado_em?: string
          config_exibicao?: Json
          criado_em?: string
          filtros?: Json
          id?: string
          nome: string
          organizacao_id: string
          usuario_id: string
        }
        Update: {
          atualizado_em?: string
          config_exibicao?: Json
          criado_em?: string
          filtros?: Json
          id?: string
          nome?: string
          organizacao_id?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visualizacoes_dashboard_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visualizacoes_dashboard_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_entrada: {
        Row: {
          api_key: string | null
          ativo: boolean | null
          atualizado_em: string
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          id: string
          nome: string
          organizacao_id: string
          secret_key: string | null
          total_requests: number | null
          ultimo_request: string | null
          url_token: string
        }
        Insert: {
          api_key?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome: string
          organizacao_id: string
          secret_key?: string | null
          total_requests?: number | null
          ultimo_request?: string | null
          url_token: string
        }
        Update: {
          api_key?: string | null
          ativo?: boolean | null
          atualizado_em?: string
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          id?: string
          nome?: string
          organizacao_id?: string
          secret_key?: string | null
          total_requests?: number | null
          ultimo_request?: string | null
          url_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_entrada_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_entrada_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_entrada_logs: {
        Row: {
          criado_em: string
          headers: Json | null
          id: string
          ip_origem: string | null
          organizacao_id: string
          payload: Json
          processado: boolean
          status_code: number
          webhook_id: string
        }
        Insert: {
          criado_em?: string
          headers?: Json | null
          id?: string
          ip_origem?: string | null
          organizacao_id: string
          payload?: Json
          processado?: boolean
          status_code?: number
          webhook_id: string
        }
        Update: {
          criado_em?: string
          headers?: Json | null
          id?: string
          ip_origem?: string | null
          organizacao_id?: string
          payload?: Json
          processado?: boolean
          status_code?: number
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_entrada_logs_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_entrada_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks_entrada"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_formularios: {
        Row: {
          ativo: boolean | null
          atraso_retry_segundos: number | null
          atualizado_em: string | null
          condicoes_disparo: Json | null
          contagem_falha: number | null
          contagem_sucesso: number | null
          criado_em: string | null
          disparar_em: string | null
          formato_payload: string | null
          formulario_id: string
          headers_customizados: Json | null
          id: string
          incluir_metadados: boolean | null
          mapeamento_campos: Json | null
          max_tentativas: number | null
          metodo_http: string | null
          nome_webhook: string
          organizacao_id: string
          retry_ativo: boolean | null
          ultimo_disparo_em: string | null
          ultimo_erro: string | null
          ultimo_status_code: number | null
          url_webhook: string
        }
        Insert: {
          ativo?: boolean | null
          atraso_retry_segundos?: number | null
          atualizado_em?: string | null
          condicoes_disparo?: Json | null
          contagem_falha?: number | null
          contagem_sucesso?: number | null
          criado_em?: string | null
          disparar_em?: string | null
          formato_payload?: string | null
          formulario_id: string
          headers_customizados?: Json | null
          id?: string
          incluir_metadados?: boolean | null
          mapeamento_campos?: Json | null
          max_tentativas?: number | null
          metodo_http?: string | null
          nome_webhook: string
          organizacao_id: string
          retry_ativo?: boolean | null
          ultimo_disparo_em?: string | null
          ultimo_erro?: string | null
          ultimo_status_code?: number | null
          url_webhook: string
        }
        Update: {
          ativo?: boolean | null
          atraso_retry_segundos?: number | null
          atualizado_em?: string | null
          condicoes_disparo?: Json | null
          contagem_falha?: number | null
          contagem_sucesso?: number | null
          criado_em?: string | null
          disparar_em?: string | null
          formato_payload?: string | null
          formulario_id?: string
          headers_customizados?: Json | null
          id?: string
          incluir_metadados?: boolean | null
          mapeamento_campos?: Json | null
          max_tentativas?: number | null
          metodo_http?: string | null
          nome_webhook?: string
          organizacao_id?: string
          retry_ativo?: boolean | null
          ultimo_disparo_em?: string | null
          ultimo_erro?: string | null
          ultimo_status_code?: number | null
          url_webhook?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_formularios_formulario_id_fkey"
            columns: ["formulario_id"]
            isOneToOne: false
            referencedRelation: "formularios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_formularios_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_saida: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          auth_header: string | null
          auth_tipo: string | null
          auth_valor: string | null
          criado_em: string
          criado_por: string | null
          deletado_em: string | null
          descricao: string | null
          eventos: Json
          headers_customizados: Json | null
          id: string
          max_tentativas: number | null
          nome: string
          organizacao_id: string
          retry_ativo: boolean | null
          url: string
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          auth_header?: string | null
          auth_tipo?: string | null
          auth_valor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          eventos?: Json
          headers_customizados?: Json | null
          id?: string
          max_tentativas?: number | null
          nome: string
          organizacao_id: string
          retry_ativo?: boolean | null
          url: string
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          auth_header?: string | null
          auth_tipo?: string | null
          auth_valor?: string | null
          criado_em?: string
          criado_por?: string | null
          deletado_em?: string | null
          descricao?: string | null
          eventos?: Json
          headers_customizados?: Json | null
          id?: string
          max_tentativas?: number | null
          nome?: string
          organizacao_id?: string
          retry_ativo?: boolean | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_saida_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_saida_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks_saida_logs: {
        Row: {
          criado_em: string
          duracao_ms: number | null
          erro_mensagem: string | null
          evento: string
          id: string
          organizacao_id: string
          payload: Json
          response_body: string | null
          status_code: number | null
          sucesso: boolean | null
          tentativa: number | null
          webhook_id: string
        }
        Insert: {
          criado_em?: string
          duracao_ms?: number | null
          erro_mensagem?: string | null
          evento: string
          id?: string
          organizacao_id: string
          payload: Json
          response_body?: string | null
          status_code?: number | null
          sucesso?: boolean | null
          tentativa?: number | null
          webhook_id: string
        }
        Update: {
          criado_em?: string
          duracao_ms?: number | null
          erro_mensagem?: string | null
          evento?: string
          id?: string
          organizacao_id?: string
          payload?: Json
          response_body?: string | null
          status_code?: number | null
          sucesso?: boolean | null
          tentativa?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_saida_logs_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhooks_saida_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks_saida"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_labels: {
        Row: {
          atualizado_em: string
          cor_codigo: number | null
          cor_hex: string | null
          criado_em: string
          id: string
          nome: string
          organizacao_id: string
          waha_label_id: string
        }
        Insert: {
          atualizado_em?: string
          cor_codigo?: number | null
          cor_hex?: string | null
          criado_em?: string
          id?: string
          nome: string
          organizacao_id: string
          waha_label_id: string
        }
        Update: {
          atualizado_em?: string
          cor_codigo?: number | null
          cor_hex?: string | null
          criado_em?: string
          id?: string
          nome?: string
          organizacao_id?: string
          waha_label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_labels_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      integracao_health: {
        Row: {
          falhas_permanentes: number | null
          media_tentativas: number | null
          organizacao_id: string | null
          pendentes: number | null
          sucesso: number | null
          tipo: string | null
          ultima_falha: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_pendentes_organizacao_id_fkey"
            columns: ["organizacao_id"]
            isOneToOne: false
            referencedRelation: "organizacoes_saas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      belongs_to_tenant: { Args: { target_org_id: string }; Returns: boolean }
      calcular_storage_organizacao: {
        Args: { p_organizacao_id: string }
        Returns: number
      }
      criar_campos_sistema: {
        Args: { p_criado_por: string; p_organizacao_id: string }
        Returns: undefined
      }
      criar_motivos_etapas_padrao: {
        Args: { p_criado_por: string; p_organizacao_id: string }
        Returns: undefined
      }
      criar_origens_padrao: {
        Args: { p_organizacao_id: string }
        Returns: undefined
      }
      distribuir_meta: {
        Args: { p_meta_id: string; p_modo?: string }
        Returns: Json
      }
      fn_breakdown_canal_funil: {
        Args: {
          p_funil_id?: string
          p_organizacao_id: string
          p_periodo_fim: string
          p_periodo_inicio: string
        }
        Returns: Json
      }
      fn_dashboard_metricas_gerais: {
        Args: {
          p_funil_id?: string
          p_organizacao_id: string
          p_periodo_fim: string
          p_periodo_inicio: string
        }
        Returns: Json
      }
      fn_heatmap_atendimento:
        | {
            Args: {
              p_canal?: string
              p_organizacao_id: string
              p_periodo_fim: string
              p_periodo_inicio: string
            }
            Returns: {
              dia_semana: number
              hora: number
              total: number
            }[]
          }
        | {
            Args: {
              p_canal?: string
              p_organizacao_id: string
              p_periodo_fim: string
              p_periodo_inicio: string
              p_tipo?: string
            }
            Returns: {
              dia_semana: number
              hora: number
              total: number
            }[]
          }
      fn_metricas_atendimento: {
        Args: {
          p_canal?: string
          p_organizacao_id: string
          p_periodo_fim: string
          p_periodo_inicio: string
        }
        Returns: Json
      }
      fn_metricas_funil: {
        Args: {
          p_canal?: string
          p_funil_id?: string
          p_organizacao_id: string
          p_periodo_fim: string
          p_periodo_inicio: string
        }
        Returns: Json
      }
      fn_relatorio_metas_dashboard: {
        Args: {
          p_organizacao_id: string
          p_periodo_fim: string
          p_periodo_inicio: string
        }
        Returns: Json
      }
      formulario_pertence_ao_tenant: {
        Args: { _formulario_id: string }
        Returns: boolean
      }
      get_current_usuario_id: { Args: never; Returns: string }
      get_partner_name_by_code: { Args: { p_codigo: string }; Returns: string }
      get_user_organizacao_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_tenant_id: { Args: never; Returns: string }
      has_app_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: { Args: { _role: string; _user_id: string }; Returns: boolean }
      incrementar_submissoes_formulario: {
        Args: { p_formulario_id: string }
        Returns: undefined
      }
      incrementar_visualizacao_formulario: {
        Args: { p_formulario_id: string }
        Returns: undefined
      }
      incrementar_visualizacoes_formulario: {
        Args: { p_formulario_id: string }
        Returns: undefined
      }
      is_admin_of_tenant: { Args: { target_org_id: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
      is_super_admin_from_table: { Args: never; Returns: boolean }
      is_super_admin_v2: { Args: never; Returns: boolean }
      is_tenant_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: never; Returns: boolean }
      limpar_rate_limits_formularios: { Args: never; Returns: undefined }
      log_audit: {
        Args: {
          p_acao: string
          p_dados_anteriores?: Json
          p_dados_novos?: Json
          p_detalhes?: Json
          p_entidade: string
          p_entidade_id?: string
          p_ip?: unknown
          p_organizacao_id: string
          p_user_agent?: string
          p_usuario_id: string
        }
        Returns: string
      }
      recalcular_progresso_meta: {
        Args: { p_meta_id: string }
        Returns: undefined
      }
      registrar_abertura_email: {
        Args: { p_tracking_id: string }
        Returns: undefined
      }
      reordenar_posicoes_etapa: { Args: { items: Json }; Returns: undefined }
      resolve_lid_conversa: {
        Args: { p_lid_number: string; p_org_id: string }
        Returns: {
          conversa_id: string
        }[]
      }
      set_current_tenant: { Args: { tenant_id: string }; Returns: undefined }
      validate_partner_code: {
        Args: { p_codigo: string }
        Returns: {
          codigo_indicacao: string
          id: string
          organizacao_nome: string
        }[]
      }
      verificar_cortesias_expiradas: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "member"
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
      app_role: ["super_admin", "admin", "member"],
    },
  },
} as const
