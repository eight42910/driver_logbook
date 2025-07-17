# Driver Logbook v3 - 技術仕様書

## 📋 プロジェクト概要

**プロジェクト名**: Driver Logbook v3  
**バージョン**: 3.0.0  
**最終更新**: 2025 年 1 月 9 日  
**ステータス**: ✅ プロダクション環境稼働中

運転手向けの業務効率化アプリケーション。日報管理、収支管理、レポート出力機能を提供する Web アプリケーション。

## 🏗️ システムアーキテクチャ

### アーキテクチャ図

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ブラウザ       │    │   Vercel        │    │   Supabase      │
│                │    │                │    │                │
│ - Next.js UI   │◄──►│ - Next.js App   │◄──►│ - PostgreSQL    │
│ - React Hook   │    │ - Server Actions│    │ - Auth Service  │
│ - shadcn/ui    │    │ - API Routes    │    │ - RLS Policies  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 技術スタック詳細

#### フロントエンド

| 技術            | バージョン | 用途                               |
| --------------- | ---------- | ---------------------------------- |
| Next.js         | 14.2.29    | React フレームワーク（App Router） |
| React           | 18.3.1     | UI ライブラリ                      |
| TypeScript      | 5.6.3      | 型安全性                           |
| Tailwind CSS    | 3.4.15     | スタイリング                       |
| shadcn/ui       | latest     | UI コンポーネント                  |
| React Hook Form | 7.53.2     | フォーム管理                       |
| Zod             | 3.23.8     | バリデーション                     |
| Lucide React    | 0.460.0    | アイコン                           |

#### バックエンド・データベース

| 技術               | バージョン | 用途                  |
| ------------------ | ---------- | --------------------- |
| Supabase           | latest     | BaaS プラットフォーム |
| PostgreSQL         | 15.x       | データベース          |
| Row Level Security | -          | セキュリティポリシー  |

#### PDF・CSV エクスポート

| 技術      | バージョン | 用途             |
| --------- | ---------- | ---------------- |
| jsPDF     | 2.5.2      | PDF 生成         |
| papaparse | 5.4.1      | CSV パース・生成 |

#### 開発・デプロイ

| 技術   | バージョン | 用途                   |
| ------ | ---------- | ---------------------- |
| Vercel | latest     | ホスティング・デプロイ |
| GitHub | -          | ソースコード管理       |
| ESLint | 8.57.1     | コード品質             |

## 🗄️ データベース設計

### テーブル構成

#### users テーブル

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**カラム説明**:

- `id`: Supabase Auth の UUID
- `email`: メールアドレス（認証情報から取得）
- `display_name`: 表示名（自動生成またはユーザー設定）
- `created_at/updated_at`: タイムスタンプ

#### daily_reports テーブル

```sql
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_worked BOOLEAN NOT NULL DEFAULT FALSE,
  start_time TIME,
  end_time TIME,
  route TEXT,
  distance_km DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

**カラム説明**:

- `id`: プライマリキー
- `user_id`: ユーザー参照（外部キー）
- `date`: 作業日（YYYY-MM-DD 形式、ユニーク制約）
- `is_worked`: 稼働フラグ
- `start_time/end_time`: 作業時間
- `route`: 運行ルート
- `distance_km`: 走行距離（km）
- `notes`: 備考

### Row Level Security (RLS) ポリシー

#### users テーブル

```sql
-- 自分のレコードのみアクセス可能
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### daily_reports テーブル

```sql
-- 自分の日報のみアクセス可能
CREATE POLICY "Users can view own daily reports" ON daily_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own daily reports" ON daily_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily reports" ON daily_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own daily reports" ON daily_reports
  FOR DELETE USING (auth.uid() = user_id);
```

## 🔐 認証システム

### 認証フロー

```
1. ユーザー登録/ログイン（Supabase Auth）
2. セッション確立
3. ユーザープロフィール確認・自動作成
4. ダッシュボードリダイレクト
```

### 実装詳細

#### AuthContext (React Context)

```typescript
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

#### プロフィール自動作成機能

- 認証成功後、users テーブルにプロフィールレコードを自動作成
- `display_name` はメールアドレスのローカル部から自動生成
- リトライ機能とタイムアウト処理を実装
- エラーハンドリングによる堅牢性確保

## 📱 ユーザーインターフェース

### レスポンシブデザイン

- **デスクトップ**: サイドバーナビゲーション
- **タブレット/モバイル**: ハンバーガーメニュー
- **ブレイクポイント**: Tailwind CSS の標準ブレイクポイント使用

### コンポーネント設計

#### レイアウトコンポーネント

```
src/components/layout/
├── Header.tsx          # ヘッダー（ユーザーメニュー含む）
├── Sidebar.tsx         # サイドバーナビゲーション
├── MainLayout.tsx      # メインレイアウト
└── Footer.tsx          # フッター
```

#### フォームコンポーネント

```
src/components/forms/
├── DailyReportForm.tsx       # 日報作成フォーム
├── DailyReportEditForm.tsx   # 日報編集フォーム
└── DeleteConfirmDialog.tsx   # 削除確認ダイアログ
```

#### UI コンポーネント

- shadcn/ui ベースのコンポーネント
- カスタマイズされたバリアント
- アクセシビリティ対応（ARIA 属性、キーボードナビゲーション）

## 🔄 API 設計

### Supabase クライアント設定

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

### データアクセス層

#### 日報管理（daily-reports.ts）

```typescript
// 主要な関数
export async function getDailyReports(userId: string): Promise<DailyReport[]>;
export async function createDailyReport(
  data: CreateDailyReportData
): Promise<DailyReport>;
export async function updateDailyReport(
  id: number,
  data: UpdateDailyReportData
): Promise<DailyReport>;
export async function deleteDailyReport(id: number): Promise<void>;
export async function getDailyReportById(
  id: number
): Promise<DailyReport | null>;
```

#### 月次レポート（monthly-reports.ts）

```typescript
// 統計データ取得
export async function getMonthlyStats(
  userId: string,
  year: number,
  month: number
): Promise<MonthlyStats>;
export async function getMonthlyReports(
  userId: string,
  year: number,
  month: number
): Promise<DailyReport[]>;
```

## 📊 データエクスポート機能

### PDF エクスポート

#### 実装技術

- **jsPDF**: PDF 生成エンジン
- **フォント**: ヒラギノ・游ゴシック（日本語対応）
- **レイアウト**: A4 縦向き、マージン設定

#### エクスポート形式

1. **月次レポート PDF**
   - ヘッダー（タイトル、期間、ユーザー名）
   - 統計サマリー（稼働日数、総距離、総時間、配送件数、高速料金）
   - 日別詳細リスト（配送件数・高速料金フィールド対応）
   - フッター（生成日時）

```typescript
// PDF生成の主要関数
export async function generateMonthlyReportPDF(
  reports: DailyReport[],
  stats: MonthlyStats,
  period: string,
  userName: string
): Promise<void>;
```

### CSV エクスポート

#### 3 つのエクスポート形式

1. **基本形式**

   ```csv
   日付,稼働,開始時刻,終了時刻,距離(km),配送件数,高速代,備考
   2025-01-01,○,09:00,17:00,45.5,12,1200,順調
   ```

2. **詳細形式**

   ```csv
   日付,稼働状況,開始時刻,終了時刻,作業時間,走行距離(km),配送件数,高速代,備考,作成日,更新日
   2025-01-01,稼働,09:00,17:00,8時間0分,45.5,12,1200,順調,2025-01-01 20:30,2025-01-01 20:30
   ```

3. **経理用形式**
   ```csv
   作業日,稼働フラグ,開始,終了,時間,距離,配送件数,高速代,メモ
   2025/01/01,1,09:00,17:00,8.0,45.5,12,1200,順調
   ```

#### 技術的特徴

- **UTF-8 BOM**: Excel での日本語文字化け防止
- **papaparse**: 高性能 CSV パーサー
- **ブラウザダウンロード**: File API 使用

```typescript
// CSV生成の主要関数
export function generateCSV(
  reports: DailyReport[],
  format: 'basic' | 'detailed' | 'accounting' = 'basic'
): string;
```

## 🔧 フォーム・バリデーション

### バリデーションスキーマ（Zod）

```typescript
// src/lib/validations/daily-report.ts
export const dailyReportSchema = z
  .object({
    date: z.string().min(1, '日付は必須です'),
    is_worked: z.boolean(),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    route: z.string().optional(),
    distance_km: z.union([z.string(), z.number()]).optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // カスタムバリデーション
      if (data.is_worked && !data.start_time) {
        return false;
      }
      return true;
    },
    {
      message: '稼働日は開始時刻が必須です',
      path: ['start_time'],
    }
  );
```

### フォーム実装パターン

```typescript
// React Hook Form + Zod の標準実装
const form = useForm<DailyReportFormData>({
  resolver: zodResolver(dailyReportSchema),
  defaultValues: {
    date: format(new Date(), 'yyyy-MM-dd'),
    is_worked: false,
  },
});

const onSubmit = async (data: DailyReportFormData) => {
  try {
    await createDailyReport(data);
    toast.success('日報を作成しました');
    router.push('/reports/list');
  } catch (error) {
    toast.error('エラーが発生しました');
  }
};
```

## 🎨 スタイル・デザインシステム

### カラーパレット

```css
/* Primary Colors */
--primary: 222.2 84% 4.9%;
--primary-foreground: 210 40% 98%;

/* Accent Colors */
--accent: 210 40% 96%;
--accent-foreground: 222.2 84% 4.9%;

/* Status Colors */
--success: 142.1 76.2% 36.3%;
--warning: 47.9 95.8% 53.1%;
--destructive: 0 84.2% 60.2%;
```

### Typography

```css
/* Font Families */
font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Yu Gothic Medium',
  'Meiryo', sans-serif;

/* Font Sizes (Tailwind) */
text-xs: 0.75rem; /* 12px */
text-sm: 0.875rem; /* 14px */
text-base: 1rem; /* 16px */
text-lg: 1.125rem; /* 18px */
text-xl: 1.25rem; /* 20px */
```

### コンポーネントバリアント

```typescript
// Button コンポーネント例
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
  }
);
```

## 📱 モバイル対応

### レスポンシブブレイクポイント

```css
/* Tailwind CSS ブレイクポイント */
sm: 640px   /* スマートフォン横向き */
md: 768px   /* タブレット縦向き */
lg: 1024px  /* タブレット横向き・小型ラップトップ */
xl: 1280px  /* デスクトップ */
2xl: 1536px /* 大型デスクトップ */
```

### モバイル最適化

- **タッチフレンドリー**: 44px 以上のタップターゲット
- **ジェスチャー**: スワイプ、ピンチズーム対応
- **パフォーマンス**: 遅延読み込み、画像最適化
- **オフライン**: Service Worker（今後実装予定）

## 🔍 SEO・メタデータ

### Next.js メタデータ API

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Driver Logbook v3',
    template: '%s | Driver Logbook v3',
  },
  description:
    '運転手向けの業務効率化アプリケーション。日報管理、収支管理、レポート出力機能を提供。',
  keywords: ['運転手', '日報', '業務管理', 'ドライバー', 'ログブック'],
  authors: [{ name: 'Driver Logbook Team' }],
  creator: 'Driver Logbook Team',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://driverlogbook-seven.vercel.app',
    siteName: 'Driver Logbook v3',
    title: 'Driver Logbook v3 - 運転手向け業務効率化アプリ',
    description:
      '日報管理、収支管理、レポート出力機能を提供する運転手向けアプリケーション',
  },
};
```

## 🚀 パフォーマンス最適化

### フロントエンド最適化

1. **Next.js 最適化**

   - App Router による自動最適化
   - Server Components でサーバーサイドレンダリング
   - Static Generation for 静的ページ
   - Image Optimization（Next.js Image コンポーネント）

2. **React 最適化**

   - `useMemo`, `useCallback` によるメモ化
   - `React.lazy` による遅延読み込み
   - Virtual DOM 最適化

3. **バンドル最適化**
   - Tree Shaking による未使用コード除去
   - Code Splitting による動的インポート
   - Webpack Bundle Analyzer による分析

### データベース最適化

1. **インデックス**

   ```sql
   -- パフォーマンス向上のためのインデックス
   CREATE INDEX idx_daily_reports_user_date ON daily_reports(user_id, date);
   CREATE INDEX idx_daily_reports_user_created ON daily_reports(user_id, created_at);
   ```

2. **クエリ最適化**
   - 必要なカラムのみ SELECT
   - 適切な WHERE 句
   - LIMIT による結果制限

## 🔒 セキュリティ

### フロントエンド セキュリティ

1. **XSS 対策**

   - React の自動エスケープ機能
   - `dangerouslySetInnerHTML` の使用禁止
   - Content Security Policy（CSP）ヘッダー

2. **CSRF 対策**

   - Supabase トークンベース認証
   - SameSite Cookie 設定

3. **機密情報保護**
   - 環境変数による API キー管理
   - ブラウザ開発者ツールでの機密情報非表示

### バックエンド セキュリティ

1. **Row Level Security (RLS)**

   - 全テーブルで RLS 有効化
   - ユーザー固有データへのアクセス制限

2. **認証・認可**

   - Supabase Auth による堅牢な認証
   - JWT トークンベースのセッション管理
   - 自動トークンリフレッシュ

3. **データベース セキュリティ**
   - SQL インジェクション対策（Supabase ORM）
   - 暗号化通信（HTTPS/TLS）

## 🧪 テスト戦略

### テスト構成（今後実装予定）

```
tests/
├── unit/               # 単体テスト
│   ├── utils/         # ユーティリティ関数
│   └── validations/   # バリデーション
├── integration/       # 統合テスト
│   ├── api/          # API エンドポイント
│   └── database/     # データベースクエリ
├── e2e/              # E2E テスト
│   ├── auth/         # 認証フロー
│   ├── reports/      # 日報機能
│   └── export/       # エクスポート機能
└── components/       # コンポーネントテスト
    ├── forms/        # フォームコンポーネント
    └── ui/           # UI コンポーネント
```

### テスト技術スタック

- **Vitest**: 単体テスト・統合テスト
- **Testing Library**: React コンポーネントテスト
- **Playwright**: E2E テスト
- **MSW**: API モック

## 🚀 デプロイ・インフラ

### Vercel デプロイ設定

```javascript
// next.config.mjs
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};
```

### 環境変数

```bash
# Supabase 設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# デプロイ設定
NEXT_PUBLIC_APP_URL=https://driverlogbook-seven.vercel.app
```

### CI/CD パイプライン

```yaml
# .github/workflows/deploy.yml (今後設定予定)
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

## 📊 監視・分析

### パフォーマンス監視（今後実装予定）

1. **Core Web Vitals**

   - Largest Contentful Paint (LCP)
   - First Input Delay (FID)
   - Cumulative Layout Shift (CLS)

2. **アプリケーション監視**
   - エラー率監視
   - レスポンス時間測定
   - ユーザー行動分析

### ログ・分析

1. **Supabase Analytics**

   - データベースパフォーマンス
   - API 使用状況
   - 認証イベント

2. **Vercel Analytics**
   - ページビュー
   - パフォーマンスメトリクス
   - デプロイ状況

## 🔧 開発環境

### ローカル開発セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/username/driver-logbook-v3
cd driver-logbook-v3

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.local.example .env.local
# .env.local に Supabase 設定を記述

# 4. 開発サーバー起動
npm run dev
```

### 開発ツール

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### VS Code 推奨設定

```json
// .vscode/settings.json
{
  "typescript.preferences.strictFunctionTypes": true,
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
```

## 📈 今後の拡張計画

### Phase 4: 高度な機能（計画中）

1. **AI・機械学習**

   - 収支予測 AI
   - 最適ルート提案
   - 異常検知システム

2. **チーム機能**

   - 複数ドライバー管理
   - 管理者ダッシュボード
   - リアルタイム位置共有

3. **外部連携**
   - GPS デバイス連携
   - 会計ソフト連携
   - クラウドストレージ同期

### PWA 対応（計画中）

```json
// manifest.json
{
  "name": "Driver Logbook v3",
  "short_name": "DriverLog",
  "description": "運転手向け業務効率化アプリ",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ]
}
```

## 📚 ドキュメント・リソース

### 技術ドキュメント

- [API リファレンス](./api-reference.md)（今後作成）
- [コンポーネントガイド](./component-guide.md)（今後作成）
- [デプロイメントガイド](./deployment-guide.md)（今後作成）

### 外部リソース

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🐛 トラブルシューティング

### よくある問題と解決策

1. **認証エラー**

   ```bash
   # Supabase 接続確認
   npm run test:connection

   # 環境変数確認
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

2. **ビルドエラー**

   ```bash
   # 型チェック
   npm run type-check

   #依存関係更新
   npm update
   ```

3. **データベースエラー**

   ```sql
   -- RLS ポリシー確認
   SELECT * FROM pg_policies WHERE tablename = 'daily_reports';

   -- インデックス確認
   SELECT * FROM pg_indexes WHERE tablename = 'daily_reports';
   ```

### デバッグ方法

1. **フロントエンド**

   - Browser DevTools
   - React Developer Tools
   - Next.js Debug Mode

2. **バックエンド**
   - Supabase Dashboard
   - PostgreSQL ログ
   - API エラーレスポンス

## 📝 更新履歴

### v3.0.0 (2025-01-09)

- ✅ プロダクション環境デプロイ完了
- ✅ PDF/CSV エクスポート機能実装
- ✅ 月次レポート機能実装
- ✅ 認証システム強化（自動プロフィール作成）
- ✅ TypeScript 型安全性向上
- ✅ アクセシビリティ対応
- ✅ レスポンシブデザイン完成

### v2.0.0 (2025-01-08)

- ✅ 日報 CRUD 機能実装
- ✅ ダッシュボード機能
- ✅ 認証システム実装
- ✅ データベース設計・構築

### v1.0.0 (2025-01-07)

- ✅ プロジェクト基盤構築
- ✅ 技術スタック確定
- ✅ 開発環境セットアップ

---

## 👥 開発チーム・連絡先

**プロジェクトリード**: Driver Logbook Team  
**技術スタック**: Next.js + Supabase + TypeScript  
**デプロイ環境**: Vercel Production  
**リポジトリ**: GitHub

**サポート**: 技術的な質問や問題については、GitHub Issues をご利用ください。

---

_この技術仕様書は、プロジェクトの発展に合わせて継続的に更新されます。_
