import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AuthLayout } from '@/components/layout/MainLayout';
import {
  Truck,
  FileText,
  Wrench,
  Receipt,
  BarChart3,
  Shield,
} from 'lucide-react';

/**
 * ホームページ（ランディングページ）
 * アプリの概要と機能紹介
 */
export default function HomePage() {
  const features = [
    {
      icon: FileText,
      title: '日報管理',
      description: '日々の業務記録を簡単入力・自動集計',
    },
    {
      icon: Wrench,
      title: 'メンテナンス管理',
      description: '車両点検・修理履歴とリマインダー',
    },
    {
      icon: Receipt,
      title: '経費管理',
      description: 'レシート管理とカテゴリ別集計',
    },
    {
      icon: BarChart3,
      title: 'ダッシュボード',
      description: 'KPI可視化とパフォーマンス分析',
    },
    {
      icon: Shield,
      title: 'セキュリティ',
      description: '個人データの安全な管理',
    },
    {
      icon: Truck,
      title: 'ドライバー特化',
      description: '委託ドライバーの業務に最適化',
    },
  ];

  return (
    <AuthLayout>
      <div className="mx-auto max-w-4xl text-center space-y-8 px-4 sm:px-6 lg:px-8">
        {/* ヒーローセクション */}
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border px-4 py-2 text-sm">
            <Truck className="h-4 w-4 text-blue-600" />
            <span>委託ドライバー向け業務管理アプリ</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Driver Logbook
          </h1>

          <p className="mx-auto max-w-2xl text-base sm:text-lg text-muted-foreground px-4">
            日報・メンテナンス・経費を一元管理。
            <br className="hidden sm:inline" />
            委託ドライバーの業務効率化を支援します。
          </p>
        </div>

        {/* CTAボタン */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 py-2">
          <Button
            asChild
            size="lg"
            className="text-base sm:text-lg w-full sm:w-auto"
          >
            <Link href="/login">ログイン</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base sm:text-lg w-full sm:w-auto"
          >
            <Link href="/register">無料で始める</Link>
          </Button>
        </div>

        {/* 機能紹介 */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">主な機能</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-left">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* 今すぐ始める */}
        <div className="mt-16 p-6 sm:p-8 bg-blue-50 dark:bg-blue-950/20 rounded-lg mx-4 sm:mx-0">
          <h3 className="text-lg sm:text-xl font-semibold mb-4">
            業務効率化を今すぐ始めませんか？
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            無料アカウント作成で、すべての機能をお試しいただけます。
          </p>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/register">無料で始める</Link>
          </Button>
        </div>
      </div>
    </AuthLayout>
  );
}
