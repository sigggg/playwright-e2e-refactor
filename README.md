# プロジェクト概要

MablからPlaywrightへのE2Eテストリファクタリング共通基盤プロジェクトです。

## 目的

このプロジェクトは、M3サービス群のE2Eテストを効率的にリファクタリングするための共通基盤とガイドラインを提供します。

### リポジトリの使い方について

**重要**: このリポジトリはリファクタリング作業のベースとなるテンプレートです。

- リファクタリング作業時に、ファイルを好きなように書き換えて構いません
- 不要な箇所があれば積極的に削除してください
- サービス固有の要件に合わせて、自由にカスタマイズしてください

このリポジトリは出発点として提供されているものであり、各サービスの最適な構成に合わせて柔軟に変更することを推奨します。

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
└── testcase/                   # Mablテスト原本
```

## 他プロジェクトへの展開手順

### Phase 0: 開発環境のセットアップ(vscodeとclaude codeの設定)

以下の手順はmacOS想定です。

#### Step 1: VSCodeのインストール（推奨）

**macOS**: Self Serviceから「Visual Studio Code」をインストール

#### Step 2: GitLabアクセストークンの設定

GitLabからプライベートリポジトリをcloneするために、アクセストークンを設定してください。

- GitLabにログイン: https://rendezvous.m3.com/
- 右上のユーザーアイコン → **Preferences** → **Access Tokens**
- **Add new token** をクリック
- Token name: 任意の名前（例: `playwright-dev-token`）
- Expiration date: 有効期限を設定（推奨: 90日以内）
- Select scopes: `read_repository` と `write_repository` の両方にチェック
- **Create personal access token** をクリック
- 表示されたトークンをコピー（Step5 で使います。⚠️ このページを閉じると二度と表示されません）

#### Step 3: 環境変数の設定

**以下macのターミナル上で操作してください。** まず現在のシェルを確認してください。

```bash
#/bin/zsh or /bin/bash のどちらかが出力されるはず
echo $SHELL
```

以下1行ずつコピーして実行してください。

**zshの場合（/bin/zsh）**:
```bash
echo 'export CLAUDE_CODE_USE_VERTEX="true"' >> ~/.zshrc
echo 'export CLOUD_ML_REGION="us-east5"' >> ~/.zshrc
echo 'export ANTHROPIC_VERTEX_PROJECT_ID="m3staff-aiagent"' >> ~/.zshrc
echo 'export PATH=$PATH:"/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.zshrc
source ~/.zshrc
```

**bashの場合（/bin/bash）**:
```bash
echo 'export CLAUDE_CODE_USE_VERTEX="true"' >> ~/.bashrc
echo 'export CLOUD_ML_REGION="us-east5"' >> ~/.bashrc
echo 'export ANTHROPIC_VERTEX_PROJECT_ID="m3staff-aiagent"' >> ~/.bashrc
echo 'export PATH=$PATH:"/Applications/Visual Studio Code.app/Contents/Resources/app/bin"' >> ~/.bashrc
source ~/.bashrc
```

**⚠️ 重要**: ターミナルを再起動した際は、以下のコマンドで環境変数を再読み込みしてください。
```bash
# zshの場合
source ~/.zshrc

# bashの場合
source ~/.bashrc
```

#### Step 4: claude code CLIのインストール

https://docs.google.com/document/d/16HvLcHWPsDWlP3ySS-SD2pLTOZnsby11syXj_K-pDaw/edit?tab=t.0#heading=h.qnuh0trpkw6f

```bash
# claude code CLIのインストール
brew install node
npm install -g @anthropic-ai/claude-code

# google認証
brew install google-cloud-sdk
gcloud auth login
gcloud auth application-default login
```

#### Step 4: Playwright拡張機能のインストール

VSCode内で  `Cmd+Shift+X` を押し、「Playwright」を検索して **Playwright Test for VSCode** をインストールしてください。
または、左下の歯車設定マークから拡張機能を選択し、インストールしてください。

#### Step 5: Playwright MCP サーバーのインストール（オプション）

**HTML自動取得機能を使いたい場合**は、以下をインストールしてください：

```bash
npm install -g @executeautomation/playwright-mcp-server
```

Claude Code設定ファイルに追加：

```bash
# 設定ファイルのパスを確認
# macOSの場合: ~/.config/claude-code/config.json

# 以下の内容を追加（既存の設定がある場合はマージ）
{
  "mcpServers": {
    "@executeautomation/playwright-mcp-server": {
      "command": "npx",
      "args": ["-y", "@executeautomation/playwright-mcp-server"]
    }
  }
}
```

**機能:**
- Claudeが自動でブラウザを操作してHTML取得
- STEP 1のHTML事前取得作業が自動化される
- スクリーンショット取得やテストレコーディングも可能

**注意:** このステップはオプションです。インストールしない場合は、従来通り手動でHTMLを取得してください。

#### Step 6: このリポジトリをclone

```bash
# macOSの場合、Keychainに認証情報を保存
git config --global credential.helper osxkeychain

# リポジトリをclone
git clone https://rendezvous.m3.com/yuichiro-sueyoshi/playwright-e2e-refactor.git

# 初回clone時にユーザー名とトークンの入力を求められます
# Username: GitLabのユーザー名
# Password: Step 2で作成したアクセストークン
```

### Phase 1: 環境セットアップ

```bash
# cloneしたフォルダ内部に移動
cd playwright-e2e-refactor

# 依存関係のインストール
npm install @playwright/test dotenv
npx playwright install

# 作業フォルダ内(今回はplaywright-e2e-refactorフォルダ)でvscodeを起動する。環境変数の設定が成功していればvscodeが立ち上がるはず
code .
```

### Phase 2: テストシナリオの作成

リファクタリング開始前に、Playwright Test for VSCodeのテストレコード機能を使ってMablテストを追従し、新しいテストシナリオを作成してください：

#### VSCodeでのテストレコード手順

1. **VSCodeの左タブからフラスコマーク**をクリック（Playwright拡張機能）

   ![Playwright拡張機能のタブ](playwright_tab.png)

2. **「Record new」**をクリック
3. **ブラウザが自動起動**し、レコードモードになります
4. **Mablテストの操作を手動で追従**してください：
   - ログイン操作
   - ページ遷移
   - フォーム入力
   - ボタンクリック
   - 検証したい要素の確認
5. **操作完了後、レコードを停止**してテストコードが自動生成されます

#### 保存先とファイル名

```bash
# 生成されたテストファイルをtestcaseフォルダに保存
testcase/{service-name}-recorded.spec.ts
```

この方法により、実際のページ構造に基づいた正確なセレクタでテストが作成されます。

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

### Phase 4: Claude起動とリファクタリング開始

#### Step 1: Claude Codeの起動

```bash
# playwright-e2e-refactorフォルダに移動
cd playwright-e2e-refactor

# claudeを起動（起動が成功すれば初期設定でdark themeを選択する画面が現れる）
claude
```

#### Step 2: リファクタリングコマンドの実行

Claude Code起動後、以下のカスタムスラッシュコマンドを使用してリファクタリングを開始します：

```bash
# >のチャット待ち受け画面で以下を入力
> /refactor
```

**`/refactor` コマンドの機能:**
- `.claude/CLAUDE.md` に記載された体系的なリファクタリングフローを自動で開始
- STEP 1（現状確認・準備）から STEP 3（本格リファクタリング）まで段階的にガイド
- 各段階で必要な情報収集、HTML取得依頼、動作確認を対話的に実施

#### Step 3: リファクタリングの進行

`/refactor` コマンド実行後、以下の流れで作業が進みます：

##### **STEP 1: 現状確認・準備**
Claudeから以下の情報を求められます：
- 対象サービス名
- Mablテストファイルのパス
- 環境セットアップ状況（Playwright、dotenv、.env）
- システム情報・アカウント情報の収集
- 実HTML構造の事前取得依頼

**作業者の対応:**
```bash
# Claudeの指示に従い、必要な情報を提供
# 例: HTMLソース取得
- ブラウザで対象ページにアクセス
- 右クリック → 「ページのソースを表示」
- HTML全体をコピーして tmp/[サービス名]_[ページ名].html として保存
```

##### **STEP 2: Mablテスト簡易修正**
Claudeが段階的アプローチで元のテストを修正：
- Phase A: 現状把握（HTML構造確認、最小限の修正)
- Phase B: 小単位修正（ログイン〜ホーム画面など）
- Phase C: 段階的拡張（動作確認済み部分から範囲拡大）

**完了条件:** 元のMablテストが最後まで実行成功すること

##### **STEP 3: 本格リファクタリング**
Page Object Modelパターンを適用した本格的なリファクタリング：
- Phase 1: Mablシナリオ分析とHTML取得
- Phase 2: 基盤構築（ドメイン別フォルダ構造）
- Phase 3: データ層・ユーティリティ構築
- Phase 4: Helper層設計・実装（⚠️ 段階的廃止予定）
- Phase 5: Page Object作成
- Phase 6: テストケース変換

**完了条件:** リファクタリング後のテストが実行成功し、README.mdが作成されること

#### 重要な原則

`/refactor` コマンドは以下の原則に基づいて作業をガイドします：

- **既存テストの忠実な再現**: 新機能追加ではなく変換が目的
- **役割ベースセレクタの優先使用**: `getByRole()`、`getByLabel()`、`getByPlaceholder()`、`getByText()`を優先
- **段階的セレクタ戦略**: 役割ベース → data-testid → CSSセレクタのフォールバック対応
- **URL遷移時のwaitUntil設定**: `waitUntil: 'domcontentloaded'`を明示的に指定（networkidleやloadは避ける）
- **日本語での実装**: コメント、ログ、エラーメッセージは日本語で記述

#### Tips

**対話的な進行:**
- 各ステップでClaudeが作業者に確認・質問を行います
- 問題発生時は立ち止まり、Claudeと解決策を協議してください
- 不明点があればいつでもClaudeに質問してください

**段階的確認:**
- 各Phaseの完了時に必ずテスト実行で動作確認を行います
- 「ここまでは動く」という基準点を明確にしながら進めます
### Phase 5: 各サービスへの展開

リファクタリングしたテストを各サービスのリポジトリに組み込む際は、以下の手順で進めてください：

#### 1. サービス担当エンジニアとの事前確認

各サービスの担当エンジニアと以下の点を確認してください：

- **開発フロー**: ブランチ戦略、レビュープロセス、マージ方針
- **GitLab CI/CD設定**: 既存のパイプライン構成、テスト実行タイミング
- **テスト実行環境**: CI環境のブラウザ設定、並列実行の可否
- **通知設定**: テスト失敗時の通知先、エスカレーション方法
- **リリースサイクル**: デプロイ頻度、テスト実行のタイミング

#### 2. プロジェクト固有のカスタマイズ

1. **`playwright.config.ts`** - テスト対象URL、プロジェクト設定を調整してください
2. **`tests/data/`** - サービス固有のテストデータ・型定義を作成してください
3. **`page/`** - サービス固有のPage Objectを実装してください

#### 3. GitLab CI/CDへの統合

サービス担当エンジニアと相談の上、適切なタイミングでテストを実行するように設定してください。
各サービスのCI/CD環境に応じて `.gitlab-ci.yml` にPlaywrightテストの実行ステージを追加してください。

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

1. **`.claude/CLAUDE.md`**を熟読し、リファクタリング方針を理解してください
2. **shared-e2e-components**を活用して共通処理を効率化してください
3. **段階的リファクタリング**でリスクを最小化してください

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

## Tips

### hooks機能を用いて完了通知を受け取る方法

Claude Codeのhooks機能を使用することで、テスト実行やビルド完了時に自動的に通知を受け取ることができます。

詳細な設定方法については以下の記事を参照してください：
https://zenn.dev/the_exile/articles/claude-code-hooks

### Playwright拡張機能でテストが認識されない場合の対処法

**問題**: Playwright拡張機能でテストが認識されない

**原因**: VSCodeは起動方法によっては環境変数を読み込んでくれない。

**解決方法**: 改めて`code`コマンドからVSCodeを起動してください

```bash
# プロジェクトフォルダに移動
cd /path/to/playwright-e2e-refactor

# codeコマンドでVSCodeを起動
code .
```

この方法でVSCodeを起動することで、シェルに設定された環境変数が正しく読み込まれ、Playwright拡張機能がテストを認識できるようになります。