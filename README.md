# Driver Logbook v3 🚛

**委託ドライバー業務効率化アプリ** - 完成版

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Supabase](https://img.shields.io/badge/Supabase-green)
![Vercel](https://img.shields.io/badge/Vercel-deployed-black)

## 🌟 完成版リンク

- **🚀 本番環境**: [https://driverlogbook-seven.vercel.app](https://driverlogbook-seven.vercel.app)
- **📚 GitHub**: [https://github.com/eight42910/driver_logbook](https://github.com/eight42910/driver_logbook)
- **🤖 AI協働開発**: [AI活用アプローチ詳細](#-ai協働開発アプローチ)

---

## 📋 プロジェクト概要

**委託ドライバーが日々の業務をストレスなく記録・可視化し、改善のヒントを得られる"使っていて楽しい"業務アプリ**

### 🎯 ターゲットユーザー

- **プライマリ**: 委託軽貨物ドライバー（個人事業主）
- **セカンダリ**: 事務担当・発注元

### ✨ 実装済み主要機能

#### 🏆 Phase 1-2 (コア機能)

- ✅ **ユーザー認証** - 登録・ログイン・プロフィール管理
- ✅ **日報管理** - 作成・編集・削除・一覧表示・検索
- ✅ **ダッシュボード** - 月間統計・最近の日報表示・KPI 可視化
- ✅ **レスポンシブデザイン** - モバイル・タブレット・デスクトップ完全対応

#### 🚀 Phase 3 (エクスポート・レポート機能)

- ✅ **月次レポート画面** - 年月選択・統計表示・データ集計
- ✅ **PDF エクスポート** - 美しい月次レポート PDF 生成（jsPDF、日本語フォント対応）
- ✅ **CSV エクスポート** - 3 つの形式（基本・詳細・会計用、UTF-8 BOM 対応）
- ✅ **認証システム強化** - エラーハンドリング・プロフィール自動作成・リトライ機能
- ✅ **アクセシビリティ対応** - スクリーンリーダー・キーボードナビゲーション

#### 🔄 最終復旧作業 (2025 年 1 月 16 日)

- ✅ **システム全面復旧** - 削除されたページ・コンポーネント完全復元
- ✅ **エクスポート機能強化** - 配送件数・高速料金フィールド対応
- ✅ **型安全性向上** - データベース型定義への完全準拠
- ✅ **UI/UX 改善** - ローディング状態・エラーハンドリング統一

---

## 🤖 AI協働開発アプローチ

### 🎯 AIとの戦略的協働

このプロジェクトは**AIとの協働開発**を通じて完成させました。単純なコード生成ではなく、**学習と理解を重視したAI活用**を実践しています。

#### 🧠 主体的な学習アプローチ

**1. 設計・アーキテクチャ決定**
- **自分で判断**: 技術スタック選定、DB設計、コンポーネント構造
- **AI活用**: ベストプラクティスの確認、設計レビュー、代替案の検討
- **成果**: Next.js App Router + Supabase の最新構成を深く理解

**2. コード実装プロセス**
```
自分の設計 → AI実装支援 → コードレビュー → 理解・改善 → 反復
```
- **AI依存しない**: 仕様書作成、要件定義は自分で実施
- **効率化**: 定型的なCRUD操作、型定義生成でAI活用
- **学習重視**: 生成されたコードを必ず分析・理解・改善

**3. 問題解決・デバッグ**
- **自分で分析**: エラー原因の特定、ログ解析
- **AI活用**: 解決策の提案、ベストプラクティスの確認
- **深掘り**: 「なぜその解決策が有効か」まで理解

#### 🛠️ 具体的AI活用場面

**コード品質向上**
- TypeScript型安全性の確保
- ESLint設定とコード規約の最適化
- パフォーマンス最適化のレビュー

**技術理解の深化**
- Next.js 14 App Routerの新機能学習
- Supabase RLS (Row Level Security) の実装パターン
- モダンなReactパターン（Server Components等）の理解

**プロダクト品質向上**
- UX/UIデザインパターンの学習
- アクセシビリティ対応の実装
- セキュリティベストプラクティスの適用

#### 📈 AI協働による成果

**技術力向上**
- ✅ **Next.js 14最新機能**: App Router、Server Components完全理解
- ✅ **TypeScript高度活用**: 厳格な型安全性、ジェネリクス活用
- ✅ **モダンDB設計**: Supabase + RLSによるセキュアな設計

**開発効率化**
- ✅ **高速プロトタイピング**: 短期間での機能実装
- ✅ **品質担保**: コードレビュー・リファクタリングの高速化
- ✅ **学習加速**: 新技術の理解とキャッチアップ

**プロダクト価値**
- ✅ **完成度**: 本番環境で実際に稼働する高品質アプリ
- ✅ **拡張性**: 将来の機能追加を考慮した設計
- ✅ **保守性**: チーム開発にも対応できるコード品質

#### 💡 面接官の方へ

**このプロジェクトで実証したスキル**:
1. **AIツールの戦略的活用** - 依存ではなく、生産性向上のツールとして活用
2. **継続学習能力** - 新技術（Next.js 14、Supabase）の迅速なキャッチアップ
3. **問題解決力** - AI支援を受けながらも、根本的な理解と改善を重視
4. **プロダクト思考** - 技術的実装だけでなく、ユーザー価値を重視した開発

**AI時代のエンジニアとしての価値**:
- AI生成コードを理解・評価・改善できる能力
- 技術の背景と理由を理解した上での実装力
- AIを活用した高速学習・プロトタイピング能力

---

## 🛠️ 技術スタック

### Frontend

- **Next.js 14.2.29** - App Router、Server Components
- **TypeScript 5.x** - 厳格な型安全性
- **shadcn/ui** - Radix UI + Tailwind CSS
- **React Hook Form** + **Zod** - フォーム管理・バリデーション
- **Lucide React** - モダンアイコン

### Backend & Database

- **Supabase** - PostgreSQL + Auth + Realtime
- **Row Level Security (RLS)** - データセキュリティ
- **RESTful API** - 自動生成、型安全

### Export & Reports

- **jsPDF** - PDF 生成ライブラリ
- **papaparse** - CSV 解析・生成
- **UTF-8 BOM 対応** - Excel 互換 CSV エクスポート

### Deployment & Infrastructure

- **Vercel** - サーバーレスデプロイ、自動 CI/CD
- **GitHub** - ソースコード管理、環境変数管理

---

## 🏗️ プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認証関連ページグループ
│   │   ├── login/         # ログインページ
│   │   └── register/      # 新規登録ページ
│   ├── dashboard/         # ダッシュボード
│   ├── reports/           # 日報関連機能
│   │   ├── list/         # 日報一覧・検索
│   │   ├── edit/[id]/    # 日報編集（動的ルート）
│   │   └── monthly/      # 月次レポート・エクスポート
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ランディングページ
├── components/            # 再利用可能コンポーネント
│   ├── ui/               # shadcn/ui基盤コンポーネント
│   ├── forms/            # フォーム関連コンポーネント
│   ├── layout/           # レイアウト関連コンポーネント
│   └── calendar/         # カレンダービュー
├── contexts/             # React Context
│   └── AuthContext.tsx   # 認証状態管理
├── lib/                  # ユーティリティ・設定
│   ├── supabase/        # Supabase関連
│   │   ├── client.ts    # クライアント設定
│   │   ├── auth.ts      # 認証機能
│   │   └── queries/     # データベースクエリ
│   ├── utils/           # エクスポート機能
│   │   ├── pdf-export.ts # PDF生成
│   │   └── csv-export.ts # CSV生成
│   ├── validations/     # バリデーションスキーマ
│   └── utils.ts         # 汎用ユーティリティ
├── types/               # TypeScript型定義
│   └── database.ts      # Supabase型定義
└── styles/              # グローバルCSS
    └── globals.css      # Tailwind CSS
```

---

## 🚀 クイックスタート

### 前提条件

- Node.js 18.0.0 以上
- npm または yarn
- Supabase アカウント

### 1. リポジトリクローン

```bash
git clone https://github.com/eight42910/driver_logbook.git
cd driver_logbook
```

### 2. 依存関係インストール

```bash
npm install
```

### 3. 環境変数設定

```bash
cp .env.local.example .env.local
```

`.env.local` を編集:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Cursor MCP 設定（オプション）

**Cursor Editor で Supabase との連携を行う場合**:

```bash
# テンプレートファイルをコピー
cp .cursor/mcp.json.template .cursor/mcp.json
```

`.cursor/mcp.json` を編集して、Supabase アクセストークンを設定:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=ymutrkwvhbfszkiadtac"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "your_supabase_access_token_here"
      }
    }
  }
}
```

> **⚠️ 注意**: `.cursor/mcp.json` は `.gitignore` に含まれており、機密情報を含むためコミットされません。

**Supabase アクセストークンの取得方法**:

1. [Supabase Dashboard](https://supabase.com/dashboard/account/tokens) にアクセス
2. 「Generate new token」をクリック
3. 適切な名前を入力（例: "Cursor MCP - Driver Logbook"）
4. 生成されたトークンを `.cursor/mcp.json` に設定

### 5. Supabase セットアップ

#### データベーステーブル作成:

```sql
-- usersテーブル
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL,
  display_name TEXT,
  company_name TEXT,
  vehicle_info TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- daily_reportsテーブル
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_worked BOOLEAN NOT NULL DEFAULT false,
  start_time TIME,
  end_time TIME,
  start_odometer INTEGER,
  end_odometer INTEGER,
  distance_km INTEGER,
  deliveries INTEGER,
  highway_fee INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

#### Row Level Security (RLS) 設定:

```sql
-- usersテーブルRLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can create own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- daily_reportsテーブルRLS
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own reports" ON daily_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports" ON daily_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reports" ON daily_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports" ON daily_reports
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports" ON daily_reports
  FOR DELETE USING (auth.uid() = user_id);
```

### 5. 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

---

## 📱 主要機能詳細

### 🔐 認証システム

- **新規登録**: メールアドレス + パスワード
- **ログイン**: セッション永続化
- **プロフィール管理**: 自動作成・手動更新
- **セキュリティ**: Supabase Auth + RLS

### 📝 日報管理

- **日報作成**:
  - 稼働状況（稼働/非稼働）
  - 時間記録（開始・終了時刻）
  - メーター読み（開始・終了）
  - 配送件数・高速料金
  - メモ・特記事項
- **日報編集**: 既存データの修正
- **日報削除**: 確認ダイアログ付き安全削除
- **日報一覧**:
  - ページネーション対応
  - 日付・稼働状況での絞り込み
  - 月別表示・検索機能

### 📊 ダッシュボード

- **今月の統計**:
  - 稼働日数
  - 総走行距離
  - 総配送件数
  - 高速料金合計
- **最近の日報**: 直近 3 件の日報表示
- **クイックアクション**: 新規作成・一覧表示ボタン

### 📄 月次レポート・エクスポート

- **月別データ表示**:
  - 年月選択 UI
  - 月間統計自動計算
  - 日報一覧テーブル
- **PDF エクスポート**:
  - プロフェッショナルなレポートデザイン
  - 統計情報・日報詳細を含む
  - A4 サイズ・印刷対応
- **CSV エクスポート（3 形式）**:
  - **基本形式**: 日付、稼働状況、距離、配送件数
  - **詳細形式**: 全フィールド（時間、メーター値、料金等）
  - **会計用**: 収支計算に特化したフォーマット
  - UTF-8 BOM 対応で Excel 完全互換

### 🎨 UI/UX

- **モダンデザイン**: shadcn/ui による洗練されたインターフェース
- **レスポンシブ**: モバイル・タブレット・デスクトップ最適化
- **アクセシビリティ**:
  - スクリーンリーダー対応
  - キーボードナビゲーション
  - 適切な ARIA 属性
- **ダークモード**: 基盤準備済み（Tailwind CSS）

---

## 🧪 開発・テスト

### 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# 型チェック
npm run type-check

# Lint実行
npm run lint

# Lint自動修正
npm run lint:fix
```

### コード品質

- **TypeScript**: strict mode、完全な型安全性
- **ESLint**: Next.js 推奨設定 + カスタムルール
- **Prettier**: コード整形（設定可能）

### テスト戦略

- **型安全性**: TypeScript コンパイラー
- **静的解析**: ESLint
- **ビルドテスト**: Next.js production build
- **手動テスト**: 全機能動作確認
- **将来拡張**: Vitest + Testing Library 準備済み

---

## 🚀 デプロイメント

### Vercel デプロイ (推奨)

#### 自動デプロイ:

1. Vercel アカウント作成
2. GitHub リポジトリ連携
3. 環境変数設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. 自動デプロイ実行

#### 手動デプロイ:

```bash
npm install -g vercel
vercel --prod
```

### その他デプロイ先

- **Netlify**: 静的サイト生成対応
- **AWS Amplify**: フルスタックホスティング
- **Docker**: コンテナ化デプロイ
- **VPS**: 独自サーバー

---

## 📚 ドキュメント

### 技術ドキュメント

- [`/docs/project-completion-report.md`](./docs/project-completion-report.md) - プロジェクト完了報告書
- [`/docs/project_overview.md`](./docs/project_overview.md) - 詳細技術仕様
- [`/docs/development-workflow.md`](./docs/development-workflow.md) - 開発ワークフロー
- [`/docs/sprint-planning.md`](./docs/sprint-planning.md) - スプリント計画

### API ドキュメント

Supabase 自動生成 API 仕様:

```
https://your-project.supabase.co/rest/v1/
```

---

## 🔧 カスタマイズ・拡張

### Phase 4 拡張候補

- **車両メンテナンス管理**: 点検・修理履歴
- **詳細収支管理**: 経費・売上分析
- **チーム機能**: 複数ドライバー管理
- **モバイルアプリ**: PWA・ネイティブアプリ
- **AI 機能**: 予測・最適化提案

### 技術的改善

- **パフォーマンス**: React Query・SWR 導入
- **テスト**: E2E・ユニットテスト強化
- **監視**: エラー追跡・パフォーマンス監視
- **国際化**: 多言語対応 (i18n)

---

## 🤝 コントリビューション

### 開発への参加

1. **Fork** このリポジトリ
2. **Feature branch** 作成 (`git checkout -b feature/AmazingFeature`)
3. **Commit** 変更 (`git commit -m 'Add some AmazingFeature'`)
4. **Push** ブランチ (`git push origin feature/AmazingFeature`)
5. **Pull Request** 作成

### コーディング規約

- TypeScript strict mode
- ESLint 設定準拠
- コンポーネントは 50 行以下推奨
- 1 ファイル 1 コンポーネント
- 明確な型定義・コメント

---

## 📜 ライセンス

MIT License - 詳細は [LICENSE](LICENSE) ファイルを参照

---

## 🙏 謝辞

### 使用ライブラリ・サービス

- [Next.js](https://nextjs.org/) - React フレームワーク
- [Supabase](https://supabase.io/) - オープンソース Firebase 代替
- [shadcn/ui](https://ui.shadcn.com/) - モダン UI コンポーネント
- [Tailwind CSS](https://tailwindcss.com/) - ユーティリティファースト CSS
- [Vercel](https://vercel.com/) - デプロイ・ホスティング

---

## 📞 サポート・連絡先

### 🐛 バグ報告・機能リクエスト

- **GitHub Issues**: [Issues ページ](https://github.com/eight42910/driver_logbook/issues)
- **セキュリティ**: セキュリティに関する問題は直接連絡

### 💬 コミュニティ

- **Discussions**: [GitHub Discussions](https://github.com/eight42910/driver_logbook/discussions)

### 👨‍💻 開発者情報

- **開発者**: eight42910
- **バージョン**: v3.0.0
- **最終更新**: 2025 年 1 月 16 日
- **プロジェクト状況**: ✅ 完成・本番稼働中

---

## 🎯 プロジェクト成果

### ✅ 達成指標

- **機能完成度**: 100% (計画した全機能実装完了)
- **コード品質**: 高品質 (TypeScript strict + ESLint clean)
- **パフォーマンス**: 最適化済み (Next.js SSR + 静的生成)
- **セキュリティ**: 堅牢 (Supabase RLS + 認証)
- **デプロイ**: 成功 (Vercel 本番環境稼働)

### 🏆 技術的価値

1. **モダンフルスタック**: Next.js 14 + Supabase
2. **型安全性**: TypeScript 完全対応  
3. **スケーラビリティ**: クリーンアーキテクチャ
4. **運用性**: 自動デプロイ・監視基盤
5. **拡張性**: 将来機能追加容易
6. **AI協働開発**: 戦略的AI活用による高速・高品質開発

### 🤝 AI時代のエンジニアリング実証

**このプロジェクトが証明する能力**:
- **AI活用リテラシー**: ツールとしてのAIを効果的に活用
- **技術理解力**: 生成されたコードの背景を理解し改善
- **学習能力**: 新技術を AI支援で迅速にキャッチアップ
- **品質意識**: AI生成物の評価・改善・最適化を実践

---

**Driver Logbook v3 - フルスタック委託ドライバー業務効率化アプリ**

[🚀 今すぐ試す](https://driverlogbook-seven.vercel.app) | [📚 詳細ドキュメント](./docs/project-completion-report.md) | [🛠️ 開発参加](https://github.com/eight42910/driver_logbook/issues)
