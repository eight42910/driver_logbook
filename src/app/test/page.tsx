'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function TestPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // ユーザーデータの取得
      const { data: usersData } = await supabase.from('users').select('*');
      setUsers(usersData || []);

      // 日報データの取得
      const { data: reportsData } = await supabase
        .from('daily_reports')
        .select('*');
      setReports(reportsData || []);
    }

    fetchData();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Supabase接続テスト</h1>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">ユーザー一覧</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(users, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">日報一覧</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(reports, null, 2)}
        </pre>
      </div>
    </div>
  );
}
