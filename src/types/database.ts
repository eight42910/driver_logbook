// src/types/database.ts
// データベースの型定義

// Userインターフェースの定義
export interface User {
  id: string; // ユーザーの一意な識別子
  email: string; // ユーザーのメールアドレス
  display_name?: string; // ユーザーの表示名（オプション）
  company_name?: string; // 会社名（オプション）
  vehicle_info?: {
    // 車両情報（オプション）
    model?: string; // 車両のモデル（オプション）
    plate?: string; // 車両のナンバープレート（オプション）
    year?: number; // 車両の製造年（オプション）
  };
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
}

// DailyReportインターフェースの定義
export interface DailyReport {
  id: number; // 日報の一意な識別子
  user_id: string; // ユーザーのID
  date: string; // 日付
  is_worked: boolean; // 労働したかどうか
  start_time?: string; // 労働開始時間（オプション）
  end_time?: string; // 労働終了時間（オプション）
  start_odometer?: number; // 開始時のオドメーター（オプション）
  end_odometer?: number; // 終了時のオドメーター（オプション）
  distance_km: number; // 自動計算される距離（km）
  deliveries: number; // 配送件数
  highway_fee: number; // 高速代
  notes?: string; // メモ（オプション）
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
}

// MonthlyReportインターフェースの定義
export interface MonthlyReport {
  user_id: string; // ユーザーのID
  year: number; // 年
  month: number; // 月
  working_days: number; // 労働日数
  total_distance: number; // 合計距離
  total_deliveries: number; // 合計配送件数
  total_highway_fee: number; // 合計高速代
  total_hours: number; // 合計労働時間
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      daily_reports: {
        Row: DailyReport;
        Insert: Omit<
          DailyReport,
          'id' | 'distance_km' | 'created_at' | 'updated_at'
        >;
        Update: Partial<
          Omit<DailyReport, 'id' | 'distance_km' | 'created_at' | 'updated_at'>
        >;
      };
    };
    Views: {
      monthly_reports: {
        Row: MonthlyReport;
      };
    };
  };
}
