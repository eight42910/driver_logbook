# ドライバーログブック MVP プレイブック

## このドキュメントの目的
- 学習中の初学者が、日報アプリを作りながら理解を深められるように導く
- 1〜2時間の小さな作業サイクルで前進し、常に次にやることを明確にする
- ここで定義した MVP スコープに沿って実装上の意思決定を行う

## 完成イメージ
- サインインしたユーザーが自分の日報を作成・一覧・詳細表示・編集・削除できる
- データは Supabase に保存し、認証は Supabase Auth を利用する
- Next.js（App Router）+ TypeScript + Tailwind CSS で UI を構築し、Vercel にデプロイする
- Row Level Security（RLS）により、ユーザーは自分のデータだけを閲覧・操作できる
- Lighthouse の Performance / Best Practices / SEO のいずれかで 80 点以上を目指す

## 技術スタック（初心者向けの理由付き）
- Next.js（App Router）：ページ遷移とサーバー処理が統合されており、学習資料が豊富
- TypeScript：型でデータの形を把握でき、早期にバグへ気づきやすい
- Tailwind CSS：ユーティリティクラスでスタイルを完結でき、導入も簡単
- Supabase（Auth + Postgres + RLS）：認証・DB・ポリシーが一つのサービスで完結
- Vercel：Next.js と相性が良く、無料枠で始めやすい

## MVP の機能スコープとルート
### ユーザーストーリー
1. ユーザーとして、メール + パスワードでサインアップ／ログインしたい
2. ログイン後、自分の日報（タイトル・本文・稼働時間・日付・任意のタグ）を登録したい
3. 自分が作成した日報を一覧で確認し、簡単な検索をしたい
4. 日報を更新・削除したい
5. 他ユーザーの日報は見えないようにしたい

### 最小ルート構成
- `/`：トップページ（ログイン済みなら一覧へ導線、未ログインならサインイン案内）
- `/signin`、`/signup`：認証画面
- `/reports`：日報一覧（クライアント側での簡易フィルタ）
- `/reports/new`：日報作成フォーム
- `/reports/[id]`：日報詳細
- `/reports/[id]/edit`：日報編集

## データモデル（Supabase `reports` テーブル）
| 列名        | 型             | 必須 | 説明                                    |
|-------------|----------------|------|-----------------------------------------|
| id          | uuid (PK)      | 〇   | `gen_random_uuid()` で自動採番          |
| user_id     | uuid           | 〇   | `auth.users(id)` への外部キー           |
| date        | date           | 〇   | 日報の日付                              |
| title       | text           | 〇   | タイトル                                |
| body        | text           | 〇   | 本文（Markdown 想定）                   |
| hours       | numeric(4,1)   |     | 稼働時間（例：`7.5`）                   |
| tags        | text[]         |     | 任意のタグ                              |
| created_at  | timestamptz    | 〇   | 生成日時（デフォルト `now()`）         |
| updated_at  | timestamptz    | 〇   | 更新日時（トリガーで自動更新）         |

### セットアップ SQL（Supabase の SQL Editor で実行）
```sql
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  title text not null,
  body text not null,
  hours numeric(4,1),
  tags text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_reports_updated
before update on public.reports
for each row execute function public.touch_updated_at();

alter table public.reports enable row level security;

create policy "reports_read_own" on public.reports
for select using (auth.uid() = user_id);

create policy "reports_insert_own" on public.reports
for insert with check (auth.uid() = user_id);

create policy "reports_update_own" on public.reports
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reports_delete_own" on public.reports
for delete using (auth.uid() = user_id);
```

## 期待するディレクトリ構成（App Router）
```
src/
  app/
    layout.tsx
    page.tsx
    (auth)/
      signin/page.tsx
      signup/page.tsx
    reports/
      page.tsx
      new/page.tsx
      [id]/page.tsx
      [id]/edit/page.tsx
  components/
    ui/
      Button.tsx
      Input.tsx
      Textarea.tsx
      Badge.tsx
    ReportForm.tsx
    ReportCard.tsx
    Header.tsx
    AuthGate.tsx
  lib/
    supabase/
      client.ts
      server.ts
    validations/
      report.ts
```

## 実装ロードマップ（7日 × 1〜2時間）
- **Day 1 – 環境構築**：Node + npm/PNPM を確認、Next.js プロジェクトと Tailwind をセットアップ、初回コミット
- **Day 2 – Supabase 準備**：Supabase プロジェクト作成、`.env.local` 設定、メール/パスワード認証有効化、`reports` テーブルと RLS を作成
- **Day 3 – 認証 UI**：`/signin` `/signup` ページを実装、Supabase Auth と連携、未ログイン時は `AuthGate` で `/signin` にリダイレクト
- **Day 4 – Create**：`ReportForm` と Zod バリデーションを用意し、`/reports/new` から `user_id` を付与して insert
- **Day 5 – Read**：`/reports` で自分のレポートを取得してカード表示、タイトル／日付の簡易フィルタを追加
- **Day 6 – Update/Delete**：`/reports/[id]` と `/reports/[id]/edit` で表示・更新・削除を実装し、動線を確認
- **Day 7 – デプロイ**：Vercel にデプロイし、Supabase の環境変数を設定、動作確認と README 更新

## ワーキングルール
- 作業前にタスクの目的を自分の言葉で整理し、日報に残す
- コミット／プルリクは小さくまとめ、学習テーマ単位で進める
- 30 分以上詰まったら質問・調査内容をメモし、日報で共有する

## Done の定義
- 全ての CRUD フローが手動テストで通り、未認証状態ではアクセスできないこと
- 別ユーザーでログインしても他人のデータが閲覧・更新できない（RLS の確認）
- フォームで入力バリデーションと API 失敗時のエラーハンドリングを実装
- README にセットアップ手順・環境変数・デプロイ先 URL を記載
- Vercel 上の本番環境で動作が確認できる

## 毎日のチェックリスト
- その日のタスク（Day プランの中の 1 項目）を作業開始前に宣言する
- 実装後に最低 2 パターンの手動テストを行う
- 学び・詰まり・翌日のタスクを自作日報アプリに記録する

## MVP 達成後に取り組むと良いこと
1. フィルタ機能の強化（日付範囲、タグ、フリーテキスト）
2. 画像などの添付ファイル対応
3. Markdown プレビューの追加
4. 週次 PDF レポートの生成
5. Jest + React Testing Library などテスト導入
6. Plausible などによるアクセス解析

## 環境変数
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

毎日の作業を始める前にこのプレイブックを確認し、焦点と次の一歩を明確にしてから進めましょう。
