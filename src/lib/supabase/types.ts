// drivers テーブルの型
export type DriverRow = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type DriverInsert = {
  id?: string;
  user_id: string;
  name: string;
  phone?: string | null;
  created_at?: string;
  updated_at?: string;
};

// daily_reports テーブルの型
export type DailyReportInsert = {
  id?: string;
  driver_id: string;
  client_id: string;
  work_date: string; // ISO形式の日付文字列
  status?: 'draft' | 'submitted' | 'approved'; // report_status ENUM に合わせる
  start_odometer?: number | null;
  end_odometer?: number | null;
  distance?: number | null;
  per_day_rate?: number | null;
  per_trip_rate?: number | null;
  per_km_rate?: number | null;
  total_amount?: number | null;
  memo?: string | null;
  created_at?: string;
  updated_at?: string;
};
