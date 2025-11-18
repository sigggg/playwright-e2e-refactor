# Playwrightテストケース作成支援コマンド（ハンズオン/デモ用）

あなたはPlaywrightテスト作成の専門家です。ユーザーが指定したテストシナリオから、Page Objectとテストケースを生成します。

## 🎯 ハンズオンの目的

**対象者**: 作業者（サービスエンジニア）

**目的**: 自分の担当するサービスのリポジトリに、PlaywrightによるE2Eテストを導入すること

**ゴール**:
1. サービスリポジトリにPlaywrightテスト環境を構築
2. URLを渡すだけで自動的にテストケースを生成できるようになる
3. GitLab CIに組み込み、マージリクエスト時に自動E2Eテスト実行

---

**用途**: このコマンドはハンズオンワークショップやデモンストレーション用に設計されています。

**前提**: このコマンドはPC版（Desktop Chrome）のテスト作成を想定しています。

## 🔍 テスト作成前の必須準備

### Step 0: リポジトリの初期セットアップ（初回のみ）

**⚠️ まっさらなサービスリポジトリで初めてテストを作る場合のみ実行**

#### **ユーザーへの作業依頼**

以下の手順で、このリポジトリをテンプレートとして使用します：

```bash
# 1. サービスリポジトリ内にこのリポジトリをclone
cd {your-service-repository}
git clone https://rendezvous.m3.com/yuichiro-sueyoshi/playwright-e2e-refactor.git

# 2. リポジトリ名を変更（サービス名に合わせる）
mv playwright-e2e-refactor {service-name}-e2e

# 3. ディレクトリに移動
cd {service-name}-e2e

# 4. このディレクトリでClaude Codeを開く（.mcp.json読み込みのため）
code .
```

**⚠️ 重要**: `.mcp.json`が読み込まれるように、必ずclone後のディレクトリでClaude Codeを開いてください

#### **Claude Codeによる自動クリーンアップ**

ユーザーが上記の手順を完了したら、以下の作業を**自動的に実行**してください：

1. **不要なファイル・フォルダの削除**
   ```bash
   # 既存のテストケース（サンプル）を削除
   rm -f testcase/test-*.spec.ts
   rm -f testcase/verify-*.spec.ts

   # 一時ファイル・キャッシュを削除
   rm -rf tmp/*
   rm -rf node_modules/
   rm -rf playwright-report/
   rm -rf test-results/
   rm -rf testcase/.auth/*
   ```

2. **サービス名の確認**
   - ユーザーに「このサービスの名前は何ですか？（例: ebook, m3pay, conference）」と質問
   - README.mdやpackage.jsonに反映が必要な場合は提案

3. **環境変数ファイルの作成**
   ```bash
   # .envファイルが存在しない場合のみ作成
   if [ ! -f .env ]; then
     cat > .env << 'EOF'
   USERNAME=your_username
   PASSWORD=your_password
   EOF
     echo "✅ .envファイルを作成しました。認証情報を設定してください。"
   fi
   ```

4. **依存関係のインストール**
   ```bash
   npm install
   npx playwright install chromium
   ```

5. **Playwright MCP導入（推奨）**

   ユーザーに以下を依頼してください：

   ```bash
   # MCPサーバーを事前インストール（初回のみ）
   npx -y @executeautomation/playwright-mcp-server --version

   # 確認：バージョンが表示されればOK
   ```

   次に、**Claude Codeのウィンドウを再読み込み**してPlaywright MCPを有効化：

   **動作確認方法**:
   - 再読み込み/再起動後、MCPサーバーが自動起動（.mcp.json設定により）
   - Playwright MCP関連のツールが利用可能になっているか確認
   - `mcp___executeautomation_playwright-mcp-server__playwright_navigate` 等が使えればOK


6. **認証セットアップの実行**
   ```bash
   # .envに正しい認証情報が設定されていることを確認後
   npx playwright test --project=setup
   ```

#### **ユーザーへの追加作業依頼（Git操作）**

Claude Codeによる自動セットアップ完了後、ユーザーに以下のGit操作を依頼してください：

```bash
# Git履歴を削除（新しいリポジトリとして初期化）
rm -rf .git

# 新しいGitリポジトリとして初期化
git init
git add .
git commit -m "feat: Playwrightテスト環境を初期構築"

# リモートリポジトリを設定（必要に応じて）
git remote add origin {your-service-repository-url}
git push -u origin main
```

**注意**: Git操作はエンジニアの判断で実行してもらいます。Claude Codeでは自動実行しません。

#### **✅ セットアップ完了確認**

以下をチェックし、すべて完了していることを確認してください：

- [ ] `shared-e2e-components/` フォルダが存在する
- [ ] `testcase/` フォルダが空（または.authのみ）
- [ ] `testcase/.auth/user.json` が生成されている
- [ ] `playwright.config.ts` が存在する
- [ ] `.env` ファイルに認証情報が設定されている
- [ ] `.mcp.json` が存在するディレクトリでClaude Codeを開いている
- [ ] Claude Codeウィンドウを再読み込み済み（Reload Window実行済み）
- [ ] Playwright MCPツールが利用可能（推奨）
- [ ] 不要なサンプルテストが削除されている

**セットアップ完了後、ユーザーに以下を伝える：**
```
✅ セットアップが完了しました！これで /test-create-demo コマンドを使ってテストを自動生成できます。

次のステップ（ハンズオンワークショップ）：
1. テスト対象ページのURLを準備（例: https://www.m3.com）
2. /test-create-demo コマンドを実行
3. URLを渡すだけで、自動的にテストが生成されます！
```

---

## 🤖 自動テスト生成フロー

### Step 1: URLの受け取り

ユーザーに以下を質問してください：

**「テスト対象ページのURLを教えてください」**

- 例: `https://www.m3.com`
- 例: `https://www.m3.com/settings`

**認証の確認（オプション）**:
- 基本的に全てのページで認証済み（storageState使用）を前提とします
- 認証不要ページの場合のみ、ユーザーが明示的に伝えます

### Step 2: HTML構造の自動取得

**Playwright MCPを使用してHTMLを自動取得**:

1. ページにアクセス
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_navigate({
     url: '{ユーザー指定のURL}',
     browserType: 'chromium',
     headless: false,
     width: 1280,
     height: 800
   })
   ```

2. HTML構造を取得
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_get_visible_html({
     removeScripts: true,
     cleanHtml: true,
     maxLength: 20000
   })
   ```

3. `tmp/[ページ名].html` として保存

**⚠️ Playwright MCP未使用の場合**:
ユーザーに手動でのHTML取得を依頼：
```
「{URL}にブラウザでアクセスし、右クリック → 'ページのソースを表示' → HTML全体をコピーして tmp/[ページ名].html として保存してください」
```

### Step 3: HTML構造の自動分析とテストケース生成

取得したHTMLを解析し、以下を**自動的に**特定・生成します：

#### **3-1. フォーム要素の検出（入力テスト生成）**

以下の要素を検出し、入力テストを自動生成：

- `<input type="text">`: テキスト入力テスト
- `<input type="email">`: メールアドレス入力テスト
- `<input type="password">`: パスワード入力テスト
- `<textarea>`: テキストエリア入力テスト
- `<select>`: プルダウン選択テスト

**セレクタ優先順位**:
1. `getByLabel()` - ラベルテキストで特定
2. `getByPlaceholder()` - placeholder属性で特定
3. `getByRole('textbox')` - 役割ベース
4. CSSセレクタ（最後の手段）

**自動生成されるテストコード例**:
```typescript
// メールアドレス入力フィールドが検出された場合
await page.getByLabel('メールアドレス').fill('test@example.com')
await expect(page.getByLabel('メールアドレス')).toHaveValue('test@example.com')
```

#### **3-2. ボタン・リンクの検出（クリック/遷移テスト生成）**

以下の要素を検出し、クリック・遷移テストを自動生成：

- `<button>`: ボタンクリックテスト
- `<a>`: リンククリック・遷移テスト
- `<input type="submit">`: 送信ボタンテスト

**セレクタ優先順位**:
1. `getByRole('button', { name: 'テキスト' })` - 役割ベース
2. `getByRole('link', { name: 'テキスト' })` - 役割ベース
3. `getByText('テキスト')` - テキストベース

**自動生成されるテストコード例**:
```typescript
// 「設定」リンクが検出された場合
await page.getByRole('link', { name: '設定' }).click()
await expect(page).toHaveURL(/settings/)
```

#### **3-3. 表示要素の検出（アサーション生成）**

以下の要素を検出し、表示確認テストを自動生成：

- `<h1>`, `<h2>`, `<h3>`: 見出し表示確認
- 重要なテキスト（ユーザー名、ステータス等）
- 画像（`<img>`）
- アイコン、バッジ

**自動生成されるテストコード例**:
```typescript
// ユーザー名表示が検出された場合
await expect(page.getByText(/先生|さん/)).toBeVisible()

// ロゴ画像が検出された場合
await expect(page.getByRole('img', { name: 'm3.com' })).toBeVisible()
```

#### **3-4. 自動生成されたテストケース一覧の提示**

HTML解析後、ユーザーに以下のような形式でテストケース一覧を提示：

```
📋 自動生成されるテストケース:

【入力テスト】
- C001_メールアドレス入力確認
- C002_パスワード入力確認

【ボタン・リンクテスト】
- C003_ログインボタンクリック確認
- C004_設定リンク遷移確認

【表示確認テスト】
- C005_ヘッダーロゴ表示確認
- C006_ユーザー名表示確認

これらのテストを生成しますか？ (Yes/No/調整が必要)
```

ユーザーの承認後、Phase 1に進みます。

---

## 📝 Page ObjectとTestの自動生成

### Phase 1: Page Objectの自動作成

**Step 3で検出された要素に基づいて、Page Objectを自動生成します。**

#### **既存Page Objectの確認**
1. `shared-e2e-components/common/` 配下をチェック
2. HeaderComponent, SidebarComponentなど共通コンポーネントが使えるか確認

#### **新規Page Objectの自動生成**

- **ファイル配置**: `shared-e2e-components/[domain]/pages/[PageName]Page.ts`
- **実装方法**: CLAUDE.mdの「Page Object Model」セクションに準拠
- **必須要素**:
  - 検出された全要素をreadonly Locatorとして定義
  - コンストラクタで全Locator初期化
  - 日本語JSDocコメント
  - 必要に応じてヘルパーメソッド追加

### Phase 2: テストケースの自動作成

**Step 3で生成されたテストケース一覧に基づいて、テストファイルを自動作成します。**

- **ファイル配置**: `testcase/[page-name]-auto-generated.spec.ts`
- **実装方法**: CLAUDE.mdの「テストコード」セクションに準拠
- **必須要素**:
  - storageState認証状態の再利用
  - AAA構造（Arrange/Act/Assert）
  - 日本語console.logによる進捗出力
  - test.beforeEach()でページ初期化
  - waitUntil: 'domcontentloaded'の使用

### Phase 3: 自動生成されたテストの実行確認

生成されたテストファイルを実行し、動作を確認します：

```bash
# 【推奨】ブラウザ表示モードで実行（ハンズオン用）
npx playwright test testcase/[page-name]-auto-generated.spec.ts --headed

# 全テスト実行
npx playwright test testcase/[page-name]-auto-generated.spec.ts

# 特定のテストのみ実行
npx playwright test testcase/[page-name]-auto-generated.spec.ts -g "C001"

# デバッグモード
npx playwright test testcase/[page-name]-auto-generated.spec.ts --debug
```

**テスト実行後の確認事項**:
- [ ] すべてのテストケースが成功したか
- [ ] エラーが発生した場合、セレクタが正しいか確認
- [ ] 必要に応じてPage Objectのセレクタを調整

**ハンズオンワークショップでの活用**:
1. エンジニアにURLを渡してもらう
2. `/test-create-demo` コマンド実行
3. 自動生成されたテストを確認
4. `--headed` モードで実行し、ブラウザの動きを確認
5. 必要に応じてテストケースをカスタマイズ

---

### Phase 4: GitLab CIへの組み込み

**テストが通過したら、各サービスリポジトリのGitLab CIパイプラインに組み込みます。**

#### **4-1. .gitlab-ci.ymlファイルの作成**

サービスリポジトリのルートに `.gitlab-ci.yml` を作成（または既存ファイルに追加）

**必須設定**:
- **stage**: `test`
- **image**: `mcr.microsoft.com/playwright:v1.40.0-focal`（Playwright公式イメージ推奨）
- **before_script**: npm ci、環境変数設定、認証セットアップ
- **script**: `npx playwright test`
- **artifacts**: テストレポート保存（playwright-report/, test-results/）
- **only**: merge_requests, main, develop

#### **4-2. GitLab CI/CD Variables設定**

**Settings → CI/CD → Variables** で以下を追加:
- `E2E_USERNAME`: テストユーザー名（Protected + Masked）
- `E2E_PASSWORD`: テストパスワード（Protected + Masked）

⚠️ **重要**: 認証情報はリポジトリにコミットせず、必ずCI/CD Variablesで管理

#### **4-3. オプション設定**

- **並列実行**: Sharding機能で実行時間短縮（`--shard=$SHARD/4`）
- **失敗通知**: Slack Webhookでテスト失敗を通知
- **ブランチ保護**: main/developへのマージ時にE2Eテスト通過を必須化

#### **✅ GitLab CI組み込み完了チェックリスト**

- [ ] `.gitlab-ci.yml` に `e2e-test` ジョブを追加
- [ ] GitLab CI/CD Variablesに認証情報を設定
- [ ] テストジョブが正常に実行されることを確認
- [ ] Artifactsにテストレポートが保存されることを確認
- [ ] ブランチ保護ルールを設定（main/developへのマージ時にテスト必須）
- [ ] チームメンバーにCI組み込みを共有

**これで、マージリクエスト作成時に自動的にE2Eテストが実行されます！**

---

## 📚 参照ドキュメント

実装の詳細は **CLAUDE.md** を参照してください：

- **コーディングルール**: Page Object Model、テストコード、セレクタ優先順位
- **禁止事項**: waitForTimeout、networkidle等のアンチパターン
- **命名規則**: ファイル名、クラス名、テストケース名
- **StorageState認証**: 認証状態の再利用方法
