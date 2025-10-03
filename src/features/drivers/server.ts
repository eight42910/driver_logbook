import { createSupabaseServerClient } from '@/lib/supabase/server';

export const getOrCreateDriverId = async (userId: string) => {
  const supabase = await createSupabaseServerClient();

  const { data: existingDriver, error: selectError } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }
  if (existingDriver) {
    return existingDriver.id;
  }

  const { data: inserteDriver, error: insertError } = await supabase
    .from('drivers')
    .insert({
      user_id: userId,
      name: null,
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return inserteDriver.id;
};
