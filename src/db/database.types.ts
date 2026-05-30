export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      player_inventory: {
        Row: {
          cheese_name: string
          created_at: string
          player_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cheese_name: string
          created_at?: string
          player_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          cheese_name?: string
          created_at?: string
          player_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'player_inventory_player_id_fkey'
            columns: ['player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      players: {
        Row: {
          cows: number
          created_at: string
          id: string
          nickname: string
          starter_picks_completed: number
          updated_at: string
        }
        Insert: {
          cows?: number
          created_at?: string
          id?: string
          nickname: string
          starter_picks_completed?: number
          updated_at?: string
        }
        Update: {
          cows?: number
          created_at?: string
          id?: string
          nickname?: string
          starter_picks_completed?: number
          updated_at?: string
        }
        Relationships: []
      }
      trader_prices: {
        Row: {
          buy_price: number
          cheese_name: string
          offer_starts_at: string
          sell_price: number
          updated_at: string
        }
        Insert: {
          buy_price: number
          cheese_name: string
          offer_starts_at?: string
          sell_price: number
          updated_at?: string
        }
        Update: {
          buy_price?: number
          cheese_name?: string
          offer_starts_at?: string
          sell_price?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_rows: {
        Row: {
          cheese_count: number
          cows: number
          nickname: string
          player_id: string
          score: number
          starter_picks_completed: number
          unique_types: number
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
