# Driver Logbook v3 - デプロイメントガイド

## 🚀 本格運用デプロイ手順

### 📋 事前準備チェックリスト

#### ✅ 開発完了確認

- [x] 全機能の動作確認完了
- [x] ESLint エラー解消
- [x] TypeScript 型チェック通過
- [x] 本番ビルド成功確認
- [x] セキュリティレビュー完了

#### ✅ 環境設定確認

- [ ] 本番用 Supabase プロジェクト作成
- [ ] 本番用環境変数設定
- [ ] カスタムドメイン設定（必要に応じて）
- [ ] SSL 証明書設定確認

---

## 🔧 Vercel デプロイ設定

### 1. **環境変数設定**

Vercel ダッシュボードで以下の環境変数を設定：

```bash
# 本番環境
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ステージング環境（Preview）
NEXT_PUBLIC_SUPABASE_URL=https://your-staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-staging-anon-key
```

### 2. **ビルド設定**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "nodejs": "18.x",
  "installCommand": "npm ci"
}
```

### 3. **プロジェクト設定**

```javascript
// vercel.json（必要に応じて作成）
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

---

## 🗄️ Supabase 本番環境設定

### 1. **データベース設定**

```sql
-- 本番環境でのRLSポリシー確認
-- users テーブル
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own data" ON users
  FOR ALL USING (auth.uid() = id);

-- daily_reports テーブル
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own reports" ON daily_reports
  FOR ALL USING (auth.uid() = user_id);

-- インデックス最適化
CREATE INDEX IF NOT EXISTS daily_reports_user_date_idx
  ON daily_reports(user_id, date DESC);
CREATE INDEX IF NOT EXISTS daily_reports_user_created_idx
  ON daily_reports(user_id, created_at DESC);
```

### 2. **認証設定**

```json
// Supabase Auth 設定
{
  "site_url": "https://your-domain.com",
  "redirect_urls": [
    "https://your-domain.com/auth/callback",
    "https://staging.your-domain.com/auth/callback"
  ],
  "jwt_expiry": 3600,
  "refresh_token_rotation_enabled": true,
  "security_update_password_require_reauthentication": true
}
```

### 3. **Rate Limiting 設定**

```sql
-- API Rate Limiting（Supabaseダッシュボードで設定）
-- 認証: 60 requests/minute
-- CRUD: 1000 requests/minute
-- ファイルアップロード: 10 requests/minute
```

---

## 📊 監視・ログ設定

### 1. **エラー監視設定**

```typescript
// src/lib/utils/monitoring.ts
interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  timestamp: string;
}

export function reportError(error: Error, context?: any) {
  const report: ErrorReport = {
    message: error.message,
    stack: error.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    userId: context?.userId,
    timestamp: new Date().toISOString(),
  };

  // 本番環境でのエラーレポート
  if (process.env.NODE_ENV === 'production') {
    // Sentry、LogRocket等の外部サービスに送信
    console.error('[PRODUCTION ERROR]', report);

    // Supabaseログテーブルに記録（オプション）
    // await supabase.from('error_logs').insert(report);
  } else {
    console.error('[DEV ERROR]', error, context);
  }
}
```

### 2. **パフォーマンス監視**

```typescript
// src/lib/utils/performance.ts
export function trackPageLoad(pageName: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigationStart = performance.timing.navigationStart;
    const loadComplete = performance.timing.loadEventEnd;
    const loadTime = loadComplete - navigationStart;

    console.log(`[PERF] ${pageName}: ${loadTime}ms`);

    // 本番環境では分析サービスに送信
    if (process.env.NODE_ENV === 'production') {
      // Google Analytics、Vercel Analytics等
    }
  }
}

export function trackUserAction(action: string, details?: any) {
  console.log(`[ACTION] ${action}`, details);

  // 本番環境でのユーザー行動追跡
  if (process.env.NODE_ENV === 'production') {
    // 分析サービスに送信
  }
}
```

---

## 🔒 セキュリティ最終チェック

### 1. **本番環境固有設定**

```javascript
// next.config.mjs 本番最適化
const nextConfig = {
  reactStrictMode: true, // 本番では有効化推奨
  swcMinify: true,
  compress: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

### 2. **セキュリティ監査**

```bash
# 定期実行推奨コマンド
npm audit --audit-level high
npm outdated
```

---

## 📈 デプロイ後監視項目

### 🔍 技術監視

#### 毎日チェック

- [ ] アプリケーションエラー率 (< 1%)
- [ ] レスポンス時間 (< 2 秒)
- [ ] 稼働率 (> 99.5%)

#### 週次チェック

- [ ] データベースパフォーマンス
- [ ] セキュリティログ確認
- [ ] ユーザー利用状況

#### 月次チェック

- [ ] 依存関係更新
- [ ] セキュリティパッチ適用
- [ ] パフォーマンステスト

### 📊 ビジネス監視

#### KPI 追跡

- [ ] 日次アクティブユーザー数
- [ ] 日報作成完了率
- [ ] エクスポート機能利用率
- [ ] ユーザー離脱率

---

## 🚨 障害対応手順

### 1. **緊急時対応**

```markdown
## 障害発生時の対応フロー

### Level 1: サービス完全停止

1. Vercel ダッシュボードでサービス状態確認
2. Supabase ダッシュボードで DB 状態確認
3. 緊急メンテナンスページ表示
4. ユーザー通知（Twitter、メール等）

### Level 2: 部分機能障害

1. 影響範囲の特定
2. 代替手段の案内
3. 修正版デプロイ準備
4. 段階的復旧

### Level 3: パフォーマンス劣化

1. 原因調査（DB、API、フロントエンド）
2. 一時的最適化実装
3. 根本原因修正
4. 監視強化
```

### 2. **ロールバック手順**

```bash
# Vercel でのロールバック
# 1. Vercel ダッシュボードで前回のデプロイメントを選択
# 2. "Promote to Production" をクリック

# 緊急時のローカルからのデプロイ
vercel --prod --force
```

---

## 📚 本番運用チェックリスト

### 🚀 デプロイ直前

- [ ] ステージング環境での最終テスト完了
- [ ] データベースマイグレーション確認
- [ ] 環境変数設定確認
- [ ] 監視設定有効化
- [ ] バックアップ確認

### 🔍 デプロイ直後

- [ ] 本番環境動作確認（全主要機能）
- [ ] エラーログ確認
- [ ] パフォーマンス確認
- [ ] ユーザー通知実施

### 📊 デプロイ後 24 時間

- [ ] エラー率監視
- [ ] ユーザーフィードバック確認
- [ ] システムリソース使用量確認
- [ ] セキュリティログ確認

---

## 📞 緊急連絡先

```markdown
## 障害時連絡先

### 技術担当

- 開発者: [メール・電話]
- DevOps: [メール・電話]

### サービス提供者

- Vercel: support@vercel.com
- Supabase: support@supabase.com

### ユーザー通知手段

- Twitter: @driver_logbook
- アプリ内通知
- メール配信（重要な場合）
```

---

## 🎯 継続的改善

### 📈 定期レビュー項目

#### 月次技術レビュー

- パフォーマンス指標確認
- セキュリティ監査
- 依存関係更新
- ユーザーフィードバック分析

#### 四半期計画レビュー

- 新機能計画
- アーキテクチャ改善
- スケーラビリティ対応
- コスト最適化

---

**🚀 本番リリース準備完了**

このガイドに従って、Driver Logbook v3 を安全かつ確実に本番環境にデプロイできます。

**📅 作成日**: 2025 年 1 月 17 日  
**✍️ 作成者**: eight42910  
**📋 次回更新**: 本番リリース後 1 週間以内

---

_本格運用開始に向けて、全ての準備が整いました。素晴らしいサービスの提供を開始しましょう！_
