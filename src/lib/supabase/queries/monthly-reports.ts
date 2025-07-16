import { supabase } from '../client';
import { DailyReport } from '@/types/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface MonthlyStats {
  workingDays: number;
  totalDistance: number;
  totalExpenses: number;
  averageDistancePerDay: number;
  reports: DailyReport[];
  year: number;
  month: number;
}

/**
 * 指定された年月の月次レポートを取得
 */
export async function getMonthlyReports(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyStats> {
  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(new Date(year, month - 1));

  const { data: reports, error } = await supabase
    .from('daily_reports')
    .select('*')
    .eq('user_id', userId)
    .gte('date', format(startDate, 'yyyy-MM-dd'))
    .lte('date', format(endDate, 'yyyy-MM-dd'))
    .order('date', { ascending: true });

  if (error) {
    throw new Error(`月次レポート取得エラー: ${error.message}`);
  }

  const workingReports = reports?.filter((report) => report.is_worked) || [];
  const workingDays = workingReports.length;

  // 走行距離と支出の計算（これらのフィールドがDailyReportに存在しない場合は0にする）
  const totalDistance = workingReports.reduce((sum, report) => {
    const extendedReport = report as unknown as { distance?: number };
    return sum + (extendedReport.distance || 0);
  }, 0);

  const totalExpenses = workingReports.reduce((sum, report) => {
    const extendedReport = report as unknown as { expenses?: number };
    return sum + (extendedReport.expenses || 0);
  }, 0);

  const averageDistancePerDay =
    workingDays > 0 ? totalDistance / workingDays : 0;

  return {
    workingDays,
    totalDistance,
    totalExpenses,
    averageDistancePerDay,
    reports: reports || [],
    year,
    month,
  };
}
