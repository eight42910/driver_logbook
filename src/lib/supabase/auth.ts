// src/lib/supabase/auth.ts
// 認証関連のユーティリティ関数

import { redirect } from 'next/navigation';
import { supabase } from './client';

/**
 * サーバーサイドでユーザー情報を取得する
 * 認証されていない場合は /login にリダイレクト
 */
export async function getAuthenticatedUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return user;
}

/**
 * サーバーサイドでユーザープロフィールを取得する
 * 認証されていない場合は /login にリダイレクト
 */
export async function getAuthenticatedUserProfile() {
  const user = await getAuthenticatedUser();

  const { data: userProfile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // プロフィールが存在しない場合は基本情報で作成
    const { data: newProfile, error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        display_name: user.user_metadata?.display_name || undefined,
      })
      .select()
      .single();

    if (insertError) {
      redirect('/login');
    }

    return newProfile;
  }

  return userProfile;
}

/**
 * 認証状態をチェックし、未認証なら /login にリダイレクト
 */
export async function requireAuth() {
  return getAuthenticatedUser();
}

/**
 * 認証済みユーザーを /dashboard にリダイレクト
 * ログイン・登録ページで使用
 */
export async function redirectIfAuthenticated() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/dashboard');
  }
}
