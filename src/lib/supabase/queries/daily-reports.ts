import { supabase } from '../client';
import { DailyReport } from '@/types/database';
import { calculateDistance } from '@/lib/validations/daily-report';

export async function createDailyReport(report: {
  user_id: string;
  date: string;
  is_worked: boolean;
  start_time?: string;
  end_time?: string;
  start_odometer?: number;
  end_odometer?: number;
  deliveries: number;
  highway_fee: number;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('daily_reports')
    .insert(report)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getDailyReports(userId: string): Promise<DailyReport[]> {
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDailyReportByDate(userId: string, date: string) {
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function updateDailyReport(
  id: number,
  updates: Partial<DailyReport>
) {
  const { data, error } = await supabase
    .from('daily_reports')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDailyReport(id: number) {
  const { error } = await supabase.from('daily_reports').delete().eq('id', id);

  if (error) throw error;
}

export async function getDailyReportById(
  id: number
): Promise<DailyReport | null> {
  const { data, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertDailyReport(report: {
  id?: number;
  user_id: string;
  date: string;
  is_worked: boolean;
  start_time?: string;
  end_time?: string;
  start_odometer?: number;
  end_odometer?: number;
  deliveries: number;
  highway_fee: number;
  notes?: string;
}): Promise<DailyReport> {
  // 既存のレコードがあるかチェック（日付ベースまたはIDベース）
  let existingReport = null;

  if (report.id) {
    // IDが指定されている場合は更新
    existingReport = await getDailyReportById(report.id);
  } else {
    // IDが指定されていない場合は日付で既存チェック
    existingReport = await getDailyReportByDate(report.user_id, report.date);
  }

  const reportData = {
    ...report,
    distance_km: calculateDistance(report.start_odometer, report.end_odometer),
  };

  if (existingReport) {
    // 更新
    const { data, error } = await supabase
      .from('daily_reports')
      .update(reportData)
      .eq('id', existingReport.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // 新規作成
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...insertData } = reportData;
    const { data, error } = await supabase
      .from('daily_reports')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function getMonthlyReport(
  userId: string,
  year: number,
  month: number
) {
  const { data, error } = await supabase
    .from('monthly_reports')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * 最新の稼働日の終了メーター値を取得
 * 新規日報作成時の開始メーター値自動設定に使用
 */
export async function getLatestOdometerReading(
  userId: string
): Promise<number | null> {
  const { data, error } = await supabase
    .from('daily_reports')
    .select('end_odometer')
    .eq('user_id', userId)
    .eq('is_worked', true)
    .not('end_odometer', 'is', null)
    .order('date', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('最新メーター値取得エラー:', error);
    return null;
  }

  return data?.end_odometer || null;
}
