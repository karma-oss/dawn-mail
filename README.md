# DAWN MAIL

> **KARMA Spec v1** — data-karma-action, data-karma-auth, data-karma-test-id, data-karma-entity, data-karma-state

メール配信管理システム — DAWN SERIES

## 概要

DAWN MAIL は、メール配信リストの管理とキャンペーンの作成・送信を行うシステムです。

## 機能

- **ダッシュボード**: キャンペーン統計の表示（総数・送信済み・下書き）
- **配信リスト管理**: リストの作成・編集・削除
- **キャンペーン管理**: メールキャンペーンの作成・編集・プレビュー・送信
- **認証**: Supabase Auth によるメール/パスワード認証
- **RLS**: Row Level Security によるデータアクセス制御

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **UI**: shadcn/ui v4 (base-ui), Tailwind CSS v4
- **認証・DB**: Supabase (Auth, PostgreSQL, RLS)
- **メール送信**: Resend
- **テスト**: Playwright
- **CI**: GitHub Actions

## セットアップ

```bash
npm install
cp .env.local.example .env.local  # 環境変数を設定
npm run dev
```

## 開発サーバー

```bash
npm run dev  # http://localhost:3003
```

## テスト

```bash
npx playwright test
```

## スキーマ

`supabase/schema.sql` を参照してください。
