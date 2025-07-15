// サーバーサイドの認証チェックを削除し、クライアントサイドに任せる
import DashboardClient from './DashboardClient';

export default function DashboardPage() {
  return <DashboardClient />;
}
