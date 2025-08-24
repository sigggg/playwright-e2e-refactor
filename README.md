# プロジェクト概要

MablからPlaywrightへのE2Eテストリファクタリング共通基盤プロジェクトです。

## 目的

このプロジェクトは、M3サービス群のE2Eテストを効率的にリファクタリングするための共通基盤とガイドラインを提供します。

## プロジェクト構成

```
workspace/
├── .claude/                     # Claude専用設定フォルダ
│   ├── CLAUDE.md               # リファクタリングガイドライン（最重要）
│   └── service/                # サービス固有の設定
│       └── service-test-specs.md  # テスト仕様書
├── shared-e2e-components/       # 共通コンポーネントライブラリ
│   ├── auth/                   # M3認証処理
│   ├── common/                 # ヘッダー・サイドバー・BasePage
│   ├── config/                 # エラー無視設定
│   └── utils/                  # テストヘルパー
├── m3pay-e2e-tests/            # m3payサービス向けテスト
└── testcase/                   # Mablテスト原本
```

## 他プロジェクトへの展開手順

### Phase 0: Mablテストの出力

リファクタリング開始前に、Mablからテストシナリオを出力してください：

```bash
# Mablテストの出力（対象テストのIDを指定）
mabl tests export --format "playwright" <mabl-test-id>

# 出力されたファイルをtestcaseフォルダに配置
mkdir testcase
mv *.mabl.spec.ts testcase/
```

### Phase 1: 基盤配置

新しいサービスのE2Eテストリファクタリング時は、以下のファイルを展開先に配置してください：

```bash
# 新プロジェクトフォルダに基盤ファイルを配置
cp -r .claude/ {new-project}/
cp -r shared-e2e-components/ {new-project}/
cp playwright.config.ts {new-project}/playwright.config.template.ts
cp tsconfig.json {new-project}/
```

### Phase 2: 環境セットアップ

```bash
# 依存関係のインストール
npm install @playwright/test dotenv
npx playwright install
```

### Phase 3: プロジェクト固有のカスタマイズ

1. **`playwright.config.ts`** - テスト対象URL、プロジェクト設定を調整
2. **`tests/data/`** - サービス固有のテストデータ・型定義を作成
3. **`page/`** - サービス固有のPage Objectを実装

## 必須共有ファイル

### 1. コア資産
- **`.claude/CLAUDE.md`** - リファクタリングガイドライン（最重要）
- **`.claude/service/`** - サービス固有の設定ファイル
- **`shared-e2e-components/`** - 共通コンポーネントライブラリ
  - `auth/m3LoginPage.ts` - M3認証処理
  - `common/` - ヘッダー・サイドバー・BasePage
  - `config/ignored-errors.json` - エラー無視設定

### 2. 設定テンプレート
- **`playwright.config.ts`** - Playwright設定のテンプレート
- **`package-template.json`** - 依存関係とスクリプト定義

### 3. 参考実装
- **`m3pay-e2e-tests/`** - 既存の成功例
  - フォルダ構造の参考
  - Page Object実装パターン
  - テストデータ管理方法

## 必要な追加ファイル（今後整備予定）

### 1. `.env.example`
```bash
# M3.com認証情報
LOGIN_ID=your_login_id
PASSWORD=your_password

# テスト対象URL
BASE_URL=https://your-service.m3.com
```

### 2. `setup-guide.md`
新規プロジェクト向けの具体的なセットアップ手順書

### 3. `package-template.json`
標準的な依存関係とスクリプト定義

## 使用方法

1. **`.claude/CLAUDE.md`**を熟読し、リファクタリング方針を理解
2. **shared-e2e-components**を活用して共通処理を効率化
3. **参考実装**を参照してプロジェクト固有の部分を実装
4. **段階的リファクタリング**でリスクを最小化

## 主な改善効果

- **開発効率向上**: 認証・レイアウト処理の共通化
- **品質向上**: エラー監視・リトライ機能の標準化
- **保守性向上**: 統一されたコード規約とパターン
- **安定性向上**: 堅牢なセレクタと待機処理

## リファクタリング原則

- **既存テストの忠実な再現**: 新機能追加ではなく変換が目的
- **共通基盤の最大活用**: 認証・レイアウトコンポーネントを優先使用
- **段階的移行**: 一度に全てを変更せず、段階的にリファクタリング
- **日本語での実装**: コメント・ログ・エラーメッセージは日本語で記述

このリファクタリング基盤を活用することで、新しいサービスのE2Eテスト整備が大幅に効率化されます。