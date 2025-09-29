# Repository Guidelines

## プロジェクト構造とモジュール構成
- `src/app` は Next.js App Router のルート群。`(auth)` が Supabase 認証画面、`reports` が日報の CRUD 画面です。
- `src/components` には共有 UI を配置します。スタイル付き共通部品は `components/ui`、フォームやガードなど機能固有のコンポーネントは隣接する機能ディレクトリへ。
- `src/features` はドメインロジック、`src/lib` は Supabase クライアントやバリデーションなどの基盤コード、`src/utils` は横断的ユーティリティです。
- ドキュメントと学習ログは `docs/` 以下（`project-playbook.md`、`learning-log.md`）。新たな心得や日次メモもここに追加してください。

## ビルド・テスト・開発コマンド
- `npm run dev` — 開発サーバーを `http://localhost:3000` で起動。
- `npm run build` — 本番ビルドを生成。デプロイ前に必ず実行。
- `npm run start` — 生成済みビルドをローカルで確認。
- `npm run lint` — ESLint（`next/core-web-vitals` 設定）で静的解析。

## コーディングスタイルと命名規則
- TypeScript + React 18 + Tailwind CSS を前提に 2 スペースインデントを使用。
- コンポーネントはパスカルケース（例：`DriverReportCard`）、フックやユーティリティはキャメルケース（例：`useSessionGuard`）。
- スタイルは基本 Tailwind クラスで記述し、共通トークンは `src/styles` に集約。
- ESLint を唯一のフォーマッタとし、コミット前に `npm run lint` を必ず通します。

## テスト方針
- 自動テストは未整備。追加時は `src/__tests__/ComponentName.test.tsx` もしくはソース同階層に配置。
- UI は React Testing Library、結合テストは Playwright を推奨。Supabase 連携はモック化し、副作用を最小化。
- 形式化前は手動検証の結果を `docs/learning-log.md` に残し、再実装時の参照とします。

## コミットとプルリクエストの指針
- サマリー行は `type(scope): intent` 形式（例：`feat(reports): add create flow validation`）。英語・現在形で簡潔に。
- 本文には背景、変更点、検証結果（実行コマンドやスクショ）を添付。関連するドキュメントや課題をリンク。
- PR では課題→解決方針→検証結果を順序立てて記述し、必要に応じて `docs/learning-log.md` の該当項目を参照してください。

## 環境設定と運用ヒント
- `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定してから `npm run dev` を実行。
- Supabase の初期化 SQL と日次タスクは `docs/project-playbook.md` に記載。スキーマ変更や学習計画時に必ず参照してください。
