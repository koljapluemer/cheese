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
          fights_played: number
          fights_won: number
          id: string
          nickname: string
          starter_picks_completed: number
          updated_at: string
        }
        Insert: {
          cows?: number
          created_at?: string
          fights_played?: number
          fights_won?: number
          id?: string
          nickname: string
          starter_picks_completed?: number
          updated_at?: string
        }
        Update: {
          cows?: number
          created_at?: string
          fights_played?: number
          fights_won?: number
          id?: string
          nickname?: string
          starter_picks_completed?: number
          updated_at?: string
        }
        Relationships: []
      }
      fight_offers: {
        Row: {
          accepted_by_player_id: string | null
          created_at: string
          host_nickname: string
          host_player_id: string
          host_team: string[]
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_by_player_id?: string | null
          created_at?: string
          host_nickname: string
          host_player_id: string
          host_team: string[]
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_by_player_id?: string | null
          created_at?: string
          host_nickname?: string
          host_player_id?: string
          host_team?: string[]
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'fight_offers_accepted_by_player_id_fkey'
            columns: ['accepted_by_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fight_offers_host_player_id_fkey'
            columns: ['host_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
      }
      fights: {
        Row: {
          created_at: string
          guest_nickname: string
          guest_player_id: string
          guest_points: number
          guest_team: string[] | null
          host_nickname: string
          host_player_id: string
          host_points: number
          host_team: string[]
          id: string
          loser_player_id: string | null
          offer_id: string
          phase_ends_at: string | null
          phase_payload: Json
          phase_started_at: string | null
          state: string
          stolen_cheese_name: string | null
          updated_at: string
          used_guest_fighter_indexes: number[]
          used_host_fighter_indexes: number[]
          winner_player_id: string | null
        }
        Insert: {
          created_at?: string
          guest_nickname: string
          guest_player_id: string
          guest_points?: number
          guest_team?: string[] | null
          host_nickname: string
          host_player_id: string
          host_points?: number
          host_team: string[]
          id?: string
          loser_player_id?: string | null
          offer_id: string
          phase_ends_at?: string | null
          phase_payload?: Json
          phase_started_at?: string | null
          state?: string
          stolen_cheese_name?: string | null
          updated_at?: string
          used_guest_fighter_indexes?: number[]
          used_host_fighter_indexes?: number[]
          winner_player_id?: string | null
        }
        Update: {
          created_at?: string
          guest_nickname?: string
          guest_player_id?: string
          guest_points?: number
          guest_team?: string[] | null
          host_nickname?: string
          host_player_id?: string
          host_points?: number
          host_team?: string[]
          id?: string
          loser_player_id?: string | null
          offer_id?: string
          phase_ends_at?: string | null
          phase_payload?: Json
          phase_started_at?: string | null
          state?: string
          stolen_cheese_name?: string | null
          updated_at?: string
          used_guest_fighter_indexes?: number[]
          used_host_fighter_indexes?: number[]
          winner_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fights_guest_player_id_fkey'
            columns: ['guest_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fights_host_player_id_fkey'
            columns: ['host_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fights_loser_player_id_fkey'
            columns: ['loser_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fights_offer_id_fkey'
            columns: ['offer_id']
            isOneToOne: false
            referencedRelation: 'fight_offers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fights_winner_player_id_fkey'
            columns: ['winner_player_id']
            isOneToOne: false
            referencedRelation: 'players'
            referencedColumns: ['id']
          },
        ]
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
      trader_price_history: {
        Row: {
          buy_price: number
          captured_at: string
          cheese_name: string
          id: string
          sell_price: number
        }
        Insert: {
          buy_price: number
          captured_at?: string
          cheese_name: string
          id?: string
          sell_price: number
        }
        Update: {
          buy_price?: number
          captured_at?: string
          cheese_name?: string
          id?: string
          sell_price?: number
        }
        Relationships: []
      }
      trader_trade_events: {
        Row: {
          cheese_name: string
          id: string
          price: number
          trade_kind: string
          traded_at: string
        }
        Insert: {
          cheese_name: string
          id?: string
          price: number
          trade_kind: string
          traded_at?: string
        }
        Update: {
          cheese_name?: string
          id?: string
          price?: number
          trade_kind?: string
          traded_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      leaderboard_rows: {
        Row: {
          cheese_count: number
          cows: number
          fights_played: number
          fights_won: number
          nickname: string
          player_id: string
          starter_picks_completed: number
          unique_types: number
          win_rate: number
        }
        Relationships: []
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
