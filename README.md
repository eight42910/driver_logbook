# Driver Logbook v3

運転手の日報管理システム - Next.js + Supabase で構築された現代的な Web アプリケーション

## 📋 プロジェクト概要

Driver Logbook v3 は、委託ドライバー向けの包括的な業務管理システムです。日々の稼働記録、メンテナンス管理、経費追跡を一元化し、効率的な業務運営をサポートします。

### 🎯 主な機能

#### ✅ 実装済み機能

- **認証システム**

  - ユーザー登録・ログイン・ログアウト
  - Supabase Auth による安全な認証
  - パスワードリセット機能

- **日報管理**

  - 日報の作成・編集・削除
  - 稼働時間・走行距離の自動計算
  - 配送件数・高速料金の記録
  - 備考・メモ機能

- **一覧表示・検索**

  - テーブル形式とカレンダー形式の切り替え
  - 日付範囲・作業状況でのフィルタリング
  - メモ内容での検索機能
  - ページネーション（10 件/ページ）

- **ダッシュボード**
  - 月間統計表示（稼働日数、総距離、配送件数など）
  - 最近の日報履歴
  - クイックアクション

#### 🚧 開発予定機能

- 月次レポート・PDF 出力
- 車両メンテナンス記録
- 経費管理
- 収益分析・KPI 表示
- PWA 対応（オフライン機能）

## 🏗️ 技術スタック

### フロントエンド

- **Next.js 14.2** - React ベースのフルスタックフレームワーク（App Router 使用）
- **TypeScript 5.x** - 型安全な開発環境
- **Tailwind CSS** - ユーティリティファースト CSS
- **shadcn/ui** - 美しい UI コンポーネント
- **React Hook Form + Zod** - フォーム管理とバリデーション
- **Lucide React** - アイコンライブラリ

### バックエンド・データベース

- **Supabase** - PostgreSQL + リアルタイム機能
- **Row Level Security (RLS)** - データベースレベルのセキュリティ
- **Supabase Auth** - 認証・認可システム

### 開発ツール

- **ESLint** - コード品質管理
- **Prettier** - コード整形
- **Git** - バージョン管理

## 🚀 セットアップ

### 前提条件

- Node.js 18.17 以上
- npm または yarn
- Supabase アカウント

### 1. リポジトリのクローン

```bash
git clone https://github.com/eight42910/driver-logbook-v3.git
cd driver-logbook-v3
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Supabase データベースの設定

#### テーブル作成

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  company_name TEXT,
  vehicle_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 日報テーブル
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_worked BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  start_odometer DECIMAL(10,1),
  end_odometer DECIMAL(10,1),
  distance_km DECIMAL(10,1) GENERATED ALWAYS AS (
    CASE
      WHEN end_odometer >= start_odometer THEN end_odometer - start_odometer
      ELSE (999999 - start_odometer + end_odometer + 1)
    END
  ) STORED,
  deliveries INTEGER,
  highway_fee INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- 月次レポートテーブル
CREATE TABLE monthly_reports (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  working_days INTEGER DEFAULT 0,
  total_distance DECIMAL(10,1) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  total_highway_fee INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, year, month)
);
```

#### RLS ポリシー設定

```sql
-- ユーザーテーブルのRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- 日報テーブルのRLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reports" ON daily_reports
  FOR ALL USING (auth.uid() = user_id);

-- 月次レポートテーブルのRLS
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own monthly reports" ON monthly_reports
  FOR ALL USING (auth.uid() = user_id);
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションを確認できます。

## 📁 プロジェクト構造

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 認証関連ページ
│   │   ├── login/              # ログインページ
│   │   └── register/           # 登録ページ
│   ├── dashboard/              # ダッシュボード
│   ├── reports/                # 日報関連
│   │   ├── list/              # 日報一覧
│   │   └── edit/[id]/         # 日報編集
│   ├── layout.tsx             # ルートレイアウト
│   └── page.tsx               # ホームページ
├── components/                 # 再利用可能なコンポーネント
│   ├── ui/                    # shadcn/ui コンポーネント
│   ├── forms/                 # フォーム関連
│   ├── layout/                # レイアウト関連
│   └── calendar/              # カレンダー表示
├── contexts/                  # React Context
│   └── AuthContext.tsx        # 認証状態管理
├── lib/                       # ユーティリティ・設定
│   ├── supabase/             # Supabase関連
│   │   ├── client.ts         # クライアント設定
│   │   ├── auth.ts           # 認証ヘルパー
│   │   └── queries/          # データベースクエリ
│   ├── validations/          # フォームバリデーション
│   └── utils.ts              # 汎用ユーティリティ
├── types/                     # TypeScript型定義
│   └── database.ts           # データベース型定義
└── styles/                   # グローバルCSS
    └── globals.css
```

## 🧪 使用方法

### 1. ユーザー登録・ログイン

1. アプリケーションにアクセス
2. 「無料で始める」をクリックして新規登録
3. メールアドレスとパスワードを入力
4. 表示名・会社名を設定（任意）

### 2. 日報作成

1. ダッシュボードから「今日の日報を作成」をクリック
2. 稼働チェックボックスを選択
3. 開始・終了時間を入力（「現在」ボタンで現在時刻を自動入力）
4. 開始・終了メーターを入力（走行距離が自動計算）
5. 配送件数・高速料金・備考を入力
6. 「日報を保存」をクリック

### 3. 日報一覧・編集

1. サイドバーから「日報一覧」をクリック
2. テーブル表示またはカレンダー表示を選択
3. フィルター機能で日付範囲・作業状況・検索条件を設定
4. 「編集」ボタンで日報の編集が可能
5. 「削除」ボタンで確認ダイアログ後に削除実行

## 🔧 開発ガイド

### コーディング規約

- **ESLint**: Next.js 推奨設定に従う
- **TypeScript**: strict モードを使用
- **命名規則**:
  - ディレクトリ: kebab-case
  - コンポーネント: PascalCase
  - 関数・変数: camelCase

### コンポーネント設計

- 1 ファイル = 1 コンポーネント（50 行以下推奨）
- 関心事の分離を意識
- 再利用性を考慮した設計

### データベースクエリ

- すべてのクエリは `src/lib/supabase/queries/` に配置
- エラーハンドリングを必ず実装
- 型安全性を確保

## 📊 進捗状況

### Phase 1: 基盤構築 (完了 ✅)

- プロジェクト初期化
- 認証システム
- 基本レイアウト
- Supabase 統合

### Phase 2: コア機能 (完了 ✅)

- 日報作成機能
- 日報一覧表示
- 日報編集・削除

### Phase 3: 最適化・拡張 (予定 📋)

- 月次レポート
- PDF 出力
- パフォーマンス最適化

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスのもとで公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

質問や不具合報告は [Issues](https://github.com/eight42910/driver-logbook-v3/issues) で受け付けています。

## 🙏 謝辞

- [Next.js](https://nextjs.org/) - 素晴らしい React フレームワーク
- [Supabase](https://supabase.com/) - 完璧なバックエンドサービス
- [shadcn/ui](https://ui.shadcn.com/) - 美しい UI コンポーネント
- [Tailwind CSS](https://tailwindcss.com/) - 効率的な CSS

---

**最終更新**: 2025 年 7 月 9 日
**バージョン**: v0.2.0 (MVP)
