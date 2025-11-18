# Playwright Test Agents による自動テスト生成（ハンズオン/デモ用）

あなたはPlaywright Test Agentsを活用したテスト自動生成の専門家です。ユーザーが指定したURLから、AIエージェントが自動的にテストプランとテストケースを生成します。

## 🎯 ハンズオンの目的

**対象者**: 作業者（サービスエンジニア）

**目的**: 自分の担当するサービスのリポジトリに、PlaywrightによるE2Eテストを最も効率的に導入すること

**ゴール**:
1. サービスリポジトリにPlaywright Test Agents環境を構築
2. URLを渡すだけでAIが自動的にテストプラン→テストコードを生成
3. Healer Agentによる自動修復で安定したテスト運用
4. GitLab CIに組み込み、マージリクエスト時に自動E2Eテスト実行

---

**用途**: このコマンドはハンズオンワークショップやデモンストレーション用に設計されています。

**前提**: このコマンドはPC版（Desktop Chrome）のテスト作成を想定しています。

## 🎭 Playwright Test Agents とは

Playwright 1.56で導入された3つのAIエージェント：

### 1. **Planner Agent** 🔍
- アプリケーションを自動探索
- `specs/` フォルダに**Markdown形式のテストプラン**を生成
- 人間が読める形式で、何をテストするかを明確化

### 2. **Generator Agent** ⚙️
- Markdownテストプランを**実際のPlaywrightテストファイル**に変換
- `tests/` フォルダにテストコード生成
- セレクタとアサーションを検証しながら生成

### 3. **Healer Agent** 🩹
- **失敗したテストを自動修復**
- UIを検査して同等の要素を探す
- セレクタが変更された場合も自動で修正提案

**公式ドキュメント**: https://playwright.dev/docs/test-agents

---

## 📋 前提条件

### クイックセットアップ（初回のみ）

```bash
# Playwright MCPのインストール
claude mcp add playwright npx @executeautomation/playwright-mcp-server

# 依存関係のインストール
npm install
npm install -D @playwright/test@latest
npx playwright install chromium

# Playwright Test Agentsの初期化
npx playwright init-agents --loop=claude
```

その後、`e2e-tests` ディレクトリで VS Code を開いてClaude Codeを起動してください。

**⚠️ 重要**: 必ず `e2e-tests` ディレクトリで作業すること

---

## 🚀 テスト自動生成フロー

### **Phase 1: 初期セットアップ（5分）**

#### **Step 1-1: MCP動作確認**

Claude Codeに以下を依頼：

```
「Playwright MCPが正しく動作しているか確認してください。
mcp___executeautomation_playwright-mcp-server__playwright_navigate が使えるかテストしてください。」
```

**Claudeの確認内容:**
- Playwright MCP関連ツールが利用可能か
- 簡単なページナビゲーションテスト

**⚠️ MCPが動作しない場合:**
1. VS Codeのウィンドウをリロード（Cmd+Shift+P → "Reload Window"）
2. Claudeを再起動
3. `.mcp.json`が正しいディレクトリにあるか確認

#### **Step 1-2: 設定ファイルの調整**

Claude Codeに以下を依頼：

```
「Playwright Test Agents用のセットアップを完了してください。
以下を実行してください：
1. playwright.config.agents.tsの内容をplaywright.config.tsにコピー
2. .envファイルを作成（USERNAME, PASSWORDのテンプレート）
3. ディレクトリ構造が正しいか確認」
```

**Claudeが自動実行する内容:**

1. **playwright.config.tsの更新**
   ```typescript
   // testDirをTest Agents用に変更
   testDir: './tests',
   // storageStateのパスを調整
   storageState: '.auth/user.json',
   // setupプロジェクトを追加
   projects: [
     { name: 'setup', testMatch: /seed\.spec\.ts/ },
     { name: 'chromium', dependencies: ['setup'] }
   ]
   ```

2. **.envファイルの作成**
   ```bash
   USERNAME=your_username
   PASSWORD=your_password
   ```

3. **ディレクトリ構造の確認**
   - `specs/`, `tests/`, `.ai/`, `.auth/` が存在するか
   - `seed.spec.ts` が存在するか
   - `shared-e2e-components/` が存在するか

---

### **Phase 2: 認証セットアップと動作確認（5分）**

#### **Step 2-1: .envファイルの確認と設定**

Claude Codeに以下を依頼：

```
「.envファイルの内容を見せてください」
```

**Claudeが.envの内容を表示:**

```bash
USERNAME=your_username
PASSWORD=your_password
```

**必要に応じてID/パスワードを変更:**

```
「USERNAME を test@example.com に変更してください」
「PASSWORD を test-password-123 に変更してください」
```

#### **Step 2-2: seed.spec.tsの動作確認**

```bash
npx playwright test seed.spec.ts --headed
```

**成功確認**: `.auth/user.json` が生成されることを確認

**⚠️ エラーが発生した場合:**

Claudeに以下を依頼：

```
「seed.spec.tsの実行でエラーが発生しました。
エラーメッセージ: [エラー内容を貼り付け]
問題を分析して修正してください。」
```

---

### **Phase 3: テスト自動生成（10分）**

#### **Step 3-1: /test-create-agent コマンドの実行**

Claude Codeで実行：

```
/test-create-agent
```

#### **Step 3-2: URLを渡す**

Claudeから質問されます：

```
「テスト対象ページのURLを教えてください」
```

エンジニアが回答（例）：

```
https://www.m3.com/settings
```

#### **Step 3-3: 探索範囲の確認**

Claudeから質問されます：

```
「このページでどのような操作をテストしたいですか？」
```

エンジニアが回答（例）：

```
プロフィール編集、パスワード変更、通知設定の変更をテストしたいです
```

#### **Step 3-4: Planner Agent による自動探索**

**⚠️ 重要**: この段階でClaude（AI）が以下を自動実行します：

1. **Playwright MCPでページにアクセス**
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_navigate({
     url: 'https://www.m3.com/settings',
     browserType: 'chromium',
     headless: false
   })
   ```

2. **HTML構造を取得**
   ```typescript
   const html = await mcp___executeautomation_playwright-mcp-server__playwright_get_visible_html({
     removeScripts: true,
     cleanHtml: true,
     maxLength: 20000
   })
   ```

3. **スクリーンショット取得**
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_screenshot({
     name: 'planner-exploration',
     fullPage: true,
     savePng: true
   })
   ```

4. **HTMLを分析して要素を検出**
   - フォーム要素（input, select, textarea）
   - ボタン・リンク（button, a）
   - 見出し・重要テキスト（h1, h2, h3）

5. **Markdownテストプランを生成**

   `specs/settings-test-plan.md` を生成：

   ```markdown
   # 設定ページテストプラン

   ## 概要
   - 対象URL: https://www.m3.com/settings
   - 最終更新: 2025-01-18
   - 生成者: Planner Agent

   ## テストシナリオ1: プロフィール編集

   ### 目的
   ユーザーがプロフィール情報を編集できることを確認

   ### 前提条件
   - M3.comにログイン済み（seed.spec.ts実行済み）
   - 設定ページにアクセス可能

   ### テスト手順
   1. 設定ページにアクセス
   2. 「プロフィール」タブをクリック
   3. 名前を編集
   4. 保存ボタンをクリック
   5. 成功メッセージが表示されることを確認

   ### 検証項目
   - [ ] 名前が正しく更新されている
   - [ ] 成功メッセージが表示される

   ## テストシナリオ2: パスワード変更
   ...
   ```

6. **ユーザーに確認**

   ```
   📋 テストプランを生成しました！

   specs/settings-test-plan.md

   【生成されたテストシナリオ】
   - シナリオ1: プロフィール編集
   - シナリオ2: パスワード変更
   - シナリオ3: 通知設定変更

   このプランで問題ありませんか？
   調整が必要な場合は、具体的に教えてください。
   (Yes/調整が必要)
   ```

#### **Step 3-5: テストプランの確認・調整**

エンジニアがプランを確認し、必要に応じて調整を依頼：

**調整例:**
```
「シナリオ4として、メール通知の無効化テストを追加してください」
```

Claudeが `specs/settings-test-plan.md` を更新：

```markdown
## テストシナリオ4: メール通知の無効化

### 目的
ユーザーがメール通知を無効化できることを確認
...
```

#### **Step 3-6: Generator Agent によるテストコード生成**

エンジニアが承認したら、Claudeが自動実行：

1. **Markdownプランを読み込み**

   `specs/settings-test-plan.md` を解析

2. **Playwright MCPでセレクタ検証**

   プランに記載された要素が実際に存在するか確認：

   ```typescript
   // 「保存」ボタンが存在するか確認
   const html = await mcp___executeautomation_playwright-mcp-server__playwright_get_visible_html({
     selector: 'button',
     cleanHtml: true
   })
   // HTML内に「保存」というテキストのボタンが存在することを確認
   ```

3. **Page Objectを自動生成**

   `shared-e2e-components/m3/pages/SettingsPage.ts` を生成：

   ```typescript
   import { Page, Locator } from '@playwright/test'

   /**
    * 設定ページ
    *
    * @description
    * - ユーザーのプロフィール、パスワード、通知設定を管理
    */
   export class SettingsPage {
     readonly page: Page

     // Playwright MCPで検証済みのセレクタ
     readonly profileTab: Locator
     readonly nameInput: Locator
     readonly saveButton: Locator
     readonly successMessage: Locator

     constructor(page: Page) {
       this.page = page

       this.profileTab = page.getByRole('tab', { name: 'プロフィール' })
       this.nameInput = page.getByLabel('名前')
       this.saveButton = page.getByRole('button', { name: '保存' })
       this.successMessage = page.getByText('保存しました')
     }

     /**
      * プロフィールを編集
      * @param name 新しい名前
      */
     async editProfile(name: string): Promise<void> {
       await this.profileTab.click()
       await this.nameInput.fill(name)
       await this.saveButton.click()
     }

     /**
      * 保存成功メッセージが表示されることを確認
      */
     async verifySaveSuccess(): Promise<boolean> {
       return await this.successMessage.isVisible()
     }
   }
   ```

4. **テストケースを自動生成**

   `tests/settings.spec.ts` を生成：

   ```typescript
   import { test, expect } from '@playwright/test'
   import { SettingsPage } from '../shared-e2e-components/m3/pages/SettingsPage'

   /**
    * 設定ページテスト
    *
    * @description
    * - 生成元: specs/settings-test-plan.md
    * - 生成者: Generator Agent
    * - 生成日時: 2025-01-18
    */

   test.describe('設定ページ機能テスト', () => {
     test.beforeEach(async ({ page }) => {
       console.log('🔄 設定ページにアクセスします...')
       await page.goto('https://www.m3.com/settings', {
         waitUntil: 'domcontentloaded'
       })
     })

     test('C001_プロフィール編集確認', async ({ page }) => {
       console.log('▶ C001_プロフィール編集確認を開始します')

       // Arrange: ページオブジェクト初期化
       const settingsPage = new SettingsPage(page)

       // Act: プロフィールを編集
       console.log('  📝 プロフィールを編集します...')
       await settingsPage.editProfile('テスト太郎')

       // Assert: 保存成功メッセージを確認
       console.log('  ✅ 保存成功メッセージを確認します...')
       const isSuccess = await settingsPage.verifySaveSuccess()
       expect(isSuccess).toBe(true)

       console.log('✅ C001_プロフィール編集確認が完了しました')
     })

     test('C002_パスワード変更確認', async ({ page }) => {
       // ...
     })

     test('C003_通知設定変更確認', async ({ page }) => {
       // ...
     })
   })
   ```

5. **ユーザーに報告**

   ```
   ✅ テストコードを生成しました！

   【生成されたファイル】
   - Page Object: shared-e2e-components/m3/pages/SettingsPage.ts
   - テストファイル: tests/settings.spec.ts

   【生成されたテストケース】
   - C001_プロフィール編集確認
   - C002_パスワード変更確認
   - C003_通知設定変更確認

   次のステップ: テストを実行して動作を確認します。
   ```

#### **Step 3-7: テスト実行**

```bash
# ブラウザ表示モードで実行（ハンズオン推奨）
npx playwright test tests/settings.spec.ts --headed
```

#### **Step 3-8: Healer Agent による自動修復（失敗時のみ）**

テストが失敗した場合、Claudeが自動で Healer Agent を起動：

1. **失敗原因の分析**

   ```
   ❌ テストが失敗しました。Healer Agentで分析します...

   失敗したテスト: C001_プロフィール編集確認
   エラー内容: Locator.click: Target closed
   ```

2. **Playwright MCPで実際のページを確認**

   ```typescript
   // 失敗したステップまでページを再現
   await mcp___executeautomation_playwright-mcp-server__playwright_navigate({
     url: 'https://www.m3.com/settings',
     browserType: 'chromium',
     headless: false
   })

   // 失敗箇所のHTML構造を取得
   const html = await mcp___executeautomation_playwright-mcp-server__playwright_get_visible_html({
     cleanHtml: true,
     maxLength: 20000
   })

   // スクリーンショット取得
   await mcp___executeautomation_playwright-mcp-server__playwright_screenshot({
     name: 'healer-analysis',
     fullPage: true,
     savePng: true
   })
   ```

3. **同等の要素を探索**

   取得したHTMLから、同等の機能を持つ要素を探索：

   - **テキスト変更**: 「保存」→「更新」に変更されていないか
   - **role変更**: `button` → `link` に変更されていないか
   - **セレクタ変更**: CSSクラス名が変更されていないか

4. **修正案の提示**

   ```
   🩹 Healer Agentが修正案を提案します:

   【問題箇所】
   tests/settings.spec.ts:25
   await settingsPage.saveButton.click()

   【原因】
   「保存」ボタンが「更新」に変更されています。

   【修正案】
   shared-e2e-components/m3/pages/SettingsPage.ts:18
   - this.saveButton = page.getByRole('button', { name: '保存' })
   + this.saveButton = page.getByRole('button', { name: '更新' })

   この修正を適用しますか？ (Yes/No/手動で修正)
   ```

5. **修正の適用**

   エンジニアが承認した場合、自動で修正：

   ```typescript
   // Page Objectを修正
   Edit({
     file_path: 'shared-e2e-components/m3/pages/SettingsPage.ts',
     old_string: "this.saveButton = page.getByRole('button', { name: '保存' })",
     new_string: "this.saveButton = page.getByRole('button', { name: '更新' })"
   })
   ```

6. **修正後、自動で再実行して確認**

---

## 🚀 GitLab CIへの組み込み（オプション）

**テストが通過したら、各サービスリポジトリのGitLab CIパイプラインに組み込みます。**

### **Step 4-1: .gitlab-ci.ymlファイルの作成**

サービスリポジトリのルートに `.gitlab-ci.yml` を作成（または既存ファイルに追加）

```yaml
stages:
  - test

# E2Eテストジョブ
e2e-test:
  stage: test
  image: mcr.microsoft.com/playwright:v1.56.0-focal
  before_script:
    # E2Eテストディレクトリに移動
    - cd e2e-tests

    # 依存関係のインストール
    - npm ci
    - npx playwright install chromium

    # 環境変数設定
    - echo "USERNAME=$E2E_USERNAME" >> .env
    - echo "PASSWORD=$E2E_PASSWORD" >> .env

    # 認証セットアップ
    - npx playwright test --project=setup

  script:
    # テスト実行
    - npx playwright test tests/

  artifacts:
    when: always
    paths:
      - e2e-tests/playwright-report/
      - e2e-tests/test-results/
    expire_in: 7 days

  only:
    - merge_requests
    - main
    - develop
```

### **Step 4-2: GitLab CI/CD Variables設定**

**Settings → CI/CD → Variables** で以下を追加:
- `E2E_USERNAME`: テストユーザー名（Protected + Masked）
- `E2E_PASSWORD`: テストパスワード（Protected + Masked）

⚠️ **重要**: 認証情報はリポジトリにコミットせず、必ずCI/CD Variablesで管理

### **Step 4-3: 動作確認**

```bash
# 変更をコミット・プッシュ
cd ../  # service-repositoryのルートに戻る
git add .
git commit -m "feat: Playwright Test AgentsによるE2Eテスト環境を追加"
git push origin feature/add-e2e-tests-demo
```

GitLabのパイプライン画面で実行結果を確認

---

## 📚 参照ドキュメント

実装の詳細は以下を参照してください：

- **Playwright Test Agents公式**: https://playwright.dev/docs/test-agents
- **CLAUDE.md**: Page Object Model、セレクタ優先順位、コーディング規約
- **README.md**: プロジェクト概要、セットアップ手順

---

## 💡 Tips

### **Planner Agentの探索範囲を制御する方法**

```
「設定ページのうち、プロフィール編集タブのみを探索してください。
通知設定やパスワード変更は探索しないでください。」
```

### **Generator Agentのコード生成スタイルを調整**

```
「日本語のconsole.logを多めに入れてください。
各ステップで何をしているか分かりやすくしてください。」
```

### **Healer Agentの自動修復を無効化**

```
「今回は自動修復せず、問題箇所のみ教えてください。
手動で修正したいので。」
```

---

## ⚠️ トラブルシューティング

### **Q: Playwright MCPが動作しない**

**A: 以下を確認してください:**
1. `.mcp.json` が `e2e-tests` ディレクトリにあるか
2. `e2e-tests` ディレクトリで VS Code を開いているか（`code .`）
3. VS Codeウィンドウをリロード（Cmd+Shift+P → "Reload Window"）
4. Claudeを再起動

### **Q: seed.spec.ts が失敗する**

**A: 以下を確認してください:**
1. `.env` に正しい認証情報が設定されているか
2. `shared-e2e-components/` が存在するか
3. import pathが正しいか（`./shared-e2e-components/auth/m3LoginPage`）
4. Claudeに「seed.spec.tsのエラーを分析してください」と依頼

### **Q: 生成されたテストが失敗する**

**A: Healer Agentを使ってください:**
```
「テストが失敗しました。Healer Agentで分析・修復してください。
エラーメッセージ: [エラー内容を貼り付け]」
```

### **Q: import pathが解決できない**

**A: `e2e-tests` ディレクトリ内で VS Code を開いているか確認**

---

## 🎯 まとめ

Playwright Test Agentsを使うことで：

- ✅ **URLを渡すだけ**で自動的にテストプラン→テストコードを生成
- ✅ **Markdownプラン**で何をテストするか明確化（学習効果が高い）
- ✅ **自動修復機能**でテスト失敗時も安心
- ✅ **公式機能**なので将来のメンテナンスも安心
- ✅ **ハンズオンに最適**な段階的フロー
- ✅ **サービスリポジトリ内で完結**する明確な構造

**このコマンドでPlaywright Test Agentsの威力を体感してください！**
