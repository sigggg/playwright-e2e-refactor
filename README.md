# プロジェクト概要

MablからPlaywrightへのE2Eテストリファクタリング共通基盤プロジェクトです。

## 目的

このプロジェクトは、M3サービス群のE2Eテストを効率的にリファクタリングするための共通基盤とガイドラインを提供します。

## プロジェクト構成

```
playwright-e2e-refactor/
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

### Phase 0: このリポジトリをclone

```bash
git clone https://rendezvous.m3.com/yuichiro-sueyoshi/playwright-e2e-refactor.git
```

### Phase 1: 環境セットアップ

```bash
# cloneしたフォルダ内部に移動
cd playwright-e2e-refactor

# 依存関係のインストール
npm install @playwright/test dotenv
npx playwright install
```

### Phase 2: Mablテストの出力

リファクタリング開始前に、Mablからテストシナリオを出力してください：

```bash
# testcaseフォルダに移動
cd testcase

# Mablテストの出力（対象テストのIDを指定）
mabl tests export --format "playwright" <mabl-test-id>
```

### Phase 3: 作業者が準備すべき情報一覧

リファクタリング作業を効率的に進めるため、以下の情報を事前に準備してください：

#### 📋 必須情報チェックリスト

##### **A. 技術的情報**
- [ ] **実HTML構造**: 主要ページの実際のHTML（ブラウザの開発者ツールでソース取得）
  ```bash
  # 保存先例
  tmp/login-page.html
  tmp/main-page.html
  tmp/mypage.html
  ```
- [ ] **現在のテスト実行結果**: backup版テストの実行ログとエラーメッセージ
- [ ] **環境・データ状態**: テスト環境のデータ状態（通知の有無、テストユーザーの権限等）

##### **B. システム・サービス情報**
- [ ] **URL構造**: ベースURL、各機能ページのパス
- [ ] **認証方式**: ログイン方法、認証フロー、権限レベル
- [ ] **ブラウザ対応**: 対象ブラウザ、実行環境
- [ ] **テストアカウント情報**: ユーザーID、パスワード、権限レベル

### Phase 4: claude起動

```bash
# playwright-e2e-refactorに戻り
cd ../

# claudeを起動(起動が成功すれば初期設定でdark themeを選択する画面が現れるはず)
claude

# >のチャット待ち受け画面に以下を入力し、.claudeフォルダ配下のclaude.mdをルールとして読み込ませる
> 以降のやりとりでは.claudeフォルダ配下のclaude.mdを読み込んで

⏺ Read(.claude/claude.md)
  ⎿  Read 250 lines (ctrl+r to expand)
  ⎿  .claude/CLAUDE.md

⏺ claude.mdを読み込みました。今後のやりとりでは、このガイダンスに従ってMablからPlaywrightへのE2Eテストリファクタリング作業をサポートします。

  何か具体的な作業をお手伝いしましょうか？例えば：

  - 元のMablテストの動作確認
  - 特定のサービスの仕様ファイル作成
  - リファクタリング作業の開始
  - 共通基盤の設定

  どの作業から始めたいか教えてください。

  > Step0から始めて

```

### Phase 5: プロジェクト固有のカスタマイズ

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
- **安定性向上**: 役割ベースセレクタによる堅牢で変更に強い要素選択
- **アクセシビリティ向上**: WAI-ARIAに準拠したセマンティックな要素特定

## リファクタリング原則

- **既存テストの忠実な再現**: 新機能追加ではなく変換が目的
- **共通基盤の最大活用**: 認証・レイアウトコンポーネントを優先使用
- **役割ベースセレクタの優先使用**: 
  - `page.locator()`よりも`getByRole()`、`getByLabel()`、`getByPlaceholder()`、`getByText()`を優先
  - 段階的セレクタ戦略（役割ベース → data-testid → CSSセレクタ）でフォールバック対応
  - アクセシビリティを重視した堅牢で保守性の高い要素選択
- **段階的移行**: 一度に全てを変更せず、段階的にリファクタリング
- **日本語での実装**: コメント・ログ・エラーメッセージは日本語で記述

このリファクタリング基盤を活用することで、新しいサービスのE2Eテスト整備が大幅に効率化されます。