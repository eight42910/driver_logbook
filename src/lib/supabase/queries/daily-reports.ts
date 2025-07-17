import { supabase } from '../client';
import { DailyReport } from '@/types/database';

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
