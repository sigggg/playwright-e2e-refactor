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

**HTML自動取得機能を使いたい場合**は、以下のコマンドでインストールしてください：

```bash
# Playwright MCPサーバーを追加
claude mcp add playwright npx @executeautomation/playwright-mcp-server
```

このコマンドにより、`.mcp.json`ファイルが自動的に作成/更新されます。

**Claude Codeの再起動**

設定を反映させるため、Claude Codeを再起動してください：

```bash
# Claude Codeを終了（Ctrl+C または exit）
# 再度起動
claude
```

**動作確認**

Claude Codeで以下のように指示して、Playwright MCPが利用可能か確認：

```
Playwright MCPを使ってhttps://example.comにアクセスし、スクリーンショットを取得してください
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

#### Step 2: リファクタリングエージェントの起動

Claude Code起動後、以下のコマンドでリファクタリング専門エージェントを起動します：

```bash
# >のチャット待ち受け画面で以下を入力
> /refactor testcase/test-1.spec.ts
```

**`/refactor` コマンドの機能:**
- **refactor-agent**（カスタムエージェント）を自動起動
- 指定されたMablテストファイルを分析し、自律的にリファクタリングを実行
- `.claude/CLAUDE.md` に記載された体系的なリファクタリングフローを自動で開始
- STEP 1（現状確認・準備）から STEP 3（本格リファクタリング）まで段階的に実行
- 各段階で必要な情報収集、HTML取得依頼、動作確認を対話的に実施
- Playwright MCPがインストールされている場合、HTML取得を自動化

#### Step 3: リファクタリングの進行

`/refactor testcase/test-1.spec.ts` コマンド実行後、refactor-agentが以下の流れで自律的に作業を進めます：

##### **STEP 1: 現状確認・準備**
refactor-agentが以下の情報を収集します：
- 指定されたMablテストファイルの分析
- 対象サービス名の確認
- 環境セットアップ状況（Playwright、dotenv、.env）の確認
- システム情報・アカウント情報の収集
- 訪問ページの特定と実HTML構造の事前取得

**Playwright MCP使用時:**
- agentが自動でブラウザを操作してHTML取得
- `tmp/[サービス名]_[ページ名].html` に自動保存

**Playwright MCP未使用時:**
```bash
# agentから指示があった場合、以下の方法でHTML取得
- ブラウザで対象ページにアクセス
- 右クリック → 「ページのソースを表示」
- HTML全体をコピーして tmp/[サービス名]_[ページ名].html として保存
```

**成果物:**
- `.claude/services/service-[サービス名]-specs.md` が作成される

##### **STEP 2: Mablテスト簡易修正**
refactor-agentが段階的アプローチで元のテストを修正：
- Phase A: 現状把握（HTML構造確認、最小限の修正)
- Phase B: 小単位修正（ログイン〜ホーム画面など）
- Phase C: 段階的拡張（動作確認済み部分から範囲拡大）

**完了条件:** 元のMablテストが最後まで実行成功すること

##### **STEP 3: 本格リファクタリング**
refactor-agentがPage Object Modelパターンを適用：
- Phase 1: Mablシナリオ分析とHTML取得
- Phase 2: 基盤構築（ドメイン別フォルダ構造）
- Phase 3: データ層・ユーティリティ構築
- Phase 4: Helper層設計・実装（⚠️ 段階的廃止予定）
- Phase 5: Page Object作成
- Phase 6: テストケース変換

**成果物:**
- `src/` フォルダにPage Object構造が作成される
- `tests/` フォルダにリファクタリング済みテストが作成される
- `README.md` が作成される（リファクタリング対応表を含む）

**完了条件:** リファクタリング後のテストが実行成功し、README.mdが作成されること

#### 重要な原則

refactor-agentは以下の原則に基づいて作業を実行します：

- **既存テストの忠実な再現**: 新機能追加ではなく変換が目的
- **役割ベースセレクタの優先使用**: `getByRole()`、`getByLabel()`、`getByPlaceholder()`、`getByText()`を優先
- **段階的セレクタ戦略**: 役割ベース → data-testid → CSSセレクタのフォールバック対応
- **URL遷移時のwaitUntil設定**: `waitUntil: 'domcontentloaded'`を明示的に指定（networkidleやloadは避ける）
- **日本語での実装**: コメント、ログ、エラーメッセージは日本語で記述

#### Tips

**対話的な進行:**
- 各ステップでrefactor-agentが作業者に確認・質問を行います
- 問題発生時は立ち止まり、agentと解決策を協議してください
- 不明点があればいつでもagentに質問してください

**段階的確認:**
- 各Phaseの完了時に必ずテスト実行で動作確認を行います
- 「ここまでは動く」という基準点を明確にしながら進めます

**自律性:**
- refactor-agentはCLAUDE.mdの全フローを理解して自律的に動作します
- 必要に応じてagentから追加情報を求められた場合は回答してください
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

##### **Step 1: サービスリポジトリのclone**

```bash
# 対象サービスのリポジトリをclone
git clone https://rendezvous.m3.com/[service-name]/[repository-name].git
cd [repository-name]
```

##### **Step 2: リファクタリング済みテストフォルダの配置**

リファクタリングが完了した `playwright-e2e-refactor` フォルダをサービスリポジトリにコピーします。

```bash
# playwright-e2e-refactorフォルダ全体をサービスリポジトリにコピー
cp -r /path/to/playwright-e2e-refactor /path/to/[repository-name]/e2e-tests

# ⚠️ フォルダ名の変更を推奨
# 例: playwright-e2e-refactor → [service-name]-e2e-tests
mv e2e-tests/playwright-e2e-refactor e2e-tests/[service-name]-e2e-tests
```

**推奨フォルダ名の例:**
- `medical-service-e2e-tests`
- `patient-portal-e2e-tests`
- `admin-dashboard-e2e-tests`

##### **Step 3: 不要ファイル・設定の整理**

コピー後、改めてClaude Codeを立ち上げ、シナリオに関係ないファイル・設定群を整理します。

```bash
# サービスリポジトリ内のe2e-testsフォルダに移動
cd e2e-tests/[service-name]-e2e-tests

# Claude Codeを起動
claude
```

**Claudeに依頼する整理内容の例:**
```
> このサービスのE2Eテストに必要なファイルのみを残し、不要なファイルを削除してください。
> 特に以下を整理してください：
> - testcase/内の未使用のMabl元ファイル
> - tmp/内の一時ファイル
> - 不要な設定ファイル
> - 他のサービス用の.claude/services/内のファイル
```

**整理対象の例:**
- `testcase/` - リファクタリング完了済みの元のMablテスト
- `tmp/` - HTML取得作業用の一時ファイル
- `.claude/services/` - 他サービスの仕様ファイル（対象サービスのみ残す）
- `node_modules/`, `playwright-report/`, `test-results/` - gitignore対象

##### **Step 4: プロジェクト設定のカスタマイズ**

以下のファイルをサービス固有の設定に調整します：

1. **`playwright.config.ts`**
   - `baseURL`: サービスのURL
   - `projects`: 対象ブラウザ・デバイス設定
   - `workers`: 並列実行数

2. **`tests/data/`**
   - サービス固有のテストデータ・型定義を作成

3. **`.env`**
   - サービス固有の環境変数（認証情報、API URL等）

##### **Step 5: GitLab CI設定の導入とCI上の動作確認**

このリポジトリには、Playwright E2Eテスト用のGitLab CI設定テンプレート（`.gitlab-ci.yml`）が含まれています。

**CI設定の特徴:**
- **unit4テンプレート活用**: `unit4-playwright-test`テンプレートを継承
- **自動実行**: MR作成時やコミット時にPC/SP両対応テストを自動実行
- **QA環境別実行**: qa1～qa10環境に対してマニュアルでテスト実行可能
- **JUnitレポート生成**: GitLabのテスト結果画面で可視化

**サービスリポジトリへの統合:**

```bash
# 1. サービスリポジトリのルートに.gitlab-ci.ymlをコピー
cp .gitlab-ci.yml /path/to/[repository-name]/.gitlab-ci.yml

# 2. サービス固有の設定に調整
# - BASE_URL: サービスのベースURL
# - BACKROOM_BASE_URL: バックルーム管理画面のURL（該当する場合）
# - E2E_DIR: E2Eテストディレクトリ（デフォルト: "e2e"）
# - PLAYWRIGHT_WORKERS: 並列実行数（デフォルト: "1" - 順次実行）
# - PLAYWRIGHT_RETRIES: リトライ回数（デフォルト: "1"）
```

**既存の.gitlab-ci.ymlがある場合:**

サービスリポジトリに既存のCI設定がある場合は、以下のように統合します：

```yaml
# 既存の.gitlab-ci.ymlに以下を追加

include:
  - project: unit4/ci-templates
    ref: master
    file:
      - unit4-playwright-test/unit4-playwright-test.yml

# stagesにintegrationを追加
stages:
  - test
  - integration  # 追加

# Playwright E2Eテストジョブを追加
playwright:test:
  rules: *rules-default
  stage: test
  interruptible: true
  extends: .unit4-playwright-test
  variables:
    E2E_DIR: "e2e"
    BASE_URL: "https://your-service.m3.com"
    PLAYWRIGHT_WORKERS: "1"
    PLAYWRIGHT_RETRIES: "1"
  before_script:
    - cd "${E2E_DIR}"
    - npm ci
    - npx playwright install --with-deps chromium
  script:
    - npx playwright test --project=chromium-desktop --project=chromium-mobile
  artifacts:
    when: always
    paths:
      - ${E2E_DIR}/playwright-report/
      - ${E2E_DIR}/test-results/
    reports:
      junit: ${E2E_DIR}/test-results/junit.xml
    expire_in: '1 week'
```

**CI上での動作確認:**
```bash
# 変更をコミット・プッシュしてCI実行を確認
git add .
git commit -m "Add E2E tests with Playwright"
git push origin feature/add-e2e-tests

# GitLabのパイプライン画面で実行結果を確認
```

##### **Step 6: MRリクエストの作成とレビュー対応**

CI上でテストが成功したら、通常はMR（Merge Request）を作成する流れになりますが、まずエンジニアに見せる前にQAチーム内でレビューを行なってください。その指摘が修正され次第MRを作成し、各サービス担当エンジニアに見てもらってください。

**MRの説明に含めるべき内容:**
- リファクタリングの概要
- 追加したテストケース一覧
- Mablテストとの対応表（README.md参照）
- 実行方法・注意事項

**レビュー対応のポイント:**
- サービス担当エンジニアからのフィードバックを反映
- CI設定の調整（必要に応じて）
- テストデータ・環境変数の確認
- ドキュメント（README.md）の更新


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
USERNAME=your_username
PASSWORD=your_password
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