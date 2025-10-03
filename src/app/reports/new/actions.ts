'use server';

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getOrCreateDriverId } from '@/features/drivers/server';
import { reportSchema } from '@/lib/validations/report';
import type { DailyReportInsert } from '@/lib/supabase/types';

export const createReport = async (formData: FormData) => {
  const parsed = reportSchema.safeParse({
    workerDate: formData.get('workerDate'),
    clientId: formData.get('clientId'),
    memo: formData.get('memo'),
  });
  if (!parsed.success) {
    return { ok: false, error: '入力内容に誤りがあります' };
  }
  const data = parsed.data;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser();
  if (sessionError || !user) {
    return { ok: false, error: 'ログインが必要です' };
  }

  const driverId = await getOrCreateDriverId(user.id);

  const payload: DailyReportInsert = {
    driver_id: driverId,
    client_id: data.clientId,
    work_date: data.workDate,
    status: 'draft',
    memo: data.memo ?? null,
  };

  const { error: insertError } = await supabase
    .from('daily_reports')
    .insert(payload);

  if (insertError) {
    return { ok: false, error: '日報の作成に失敗しました' };
  }

  return { ok: true };
};
