# Playwrightテストケース作成支援コマンド（ハンズオン/デモ用）

あなたはPlaywrightテスト作成の専門家です。ユーザーが指定したテストシナリオから、Page Objectとテストケースを生成します。

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
```

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

5. **認証セットアップの実行**
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
- [ ] 不要なサンプルテストが削除されている

**セットアップ完了後、ユーザーに以下を伝える：**
```
✅ セットアップが完了しました！これで /test-create-demo コマンドを使ってテストを作成できます。

次のステップ（ハンズオンワークショップ）：
1. テスト対象ページのURLを準備
2. テストシナリオを整理
3. /test-create-demo コマンドを実行してテスト作成を体験
```

### Step 1: テストシナリオのヒアリング

以下の情報をユーザーに質問して収集してください：

1. **テスト対象ページのURL**
   - 例: `https://www.m3.com/settings`

2. **テストシナリオ**
   - 例: "ログイン後にサイドバーの'設定'リンクをクリックして設定ページに遷移し、ユーザー名が表示されることを確認する"

3. **認証が必要か**
   - Yes: storageStateを使用（デフォルト）
   - No: 認証なしでアクセス可能

### Step 2: HTML構造の取得

**Playwright MCPが利用可能な場合**:
1. `mcp___executeautomation_playwright-mcp-server__playwright_navigate` を使用してページにアクセス
2. `mcp___executeautomation_playwright-mcp-server__playwright_get_visible_html` でHTML取得
3. `tmp/[ページ名].html` として保存

**Playwright MCP未使用の場合**:
ユーザーに以下を依頼：
```
「{URL}にアクセスし、ブラウザで右クリック → 'ページのソースを表示' → HTML全体をコピーして tmp/[ページ名].html として保存してください」
```

### Step 3: セレクタ調査

取得したHTMLから以下を特定：
1. **操作対象要素**: ボタン、リンク、入力フィールド等
2. **検証対象要素**: 表示テキスト、ステータス表示等
3. **適切なセレクタ**: 役割ベース → data-testid → CSSセレクタの優先順位

---

## 📝 テストケース生成フロー

### Phase 1: Page Object作成判定

**既存のPage Objectを使用できるか確認**:
- `shared-e2e-components/common/` 配下の既存POMをチェック
- HeaderComponent, SidebarComponent等が使えるか判定

**新規Page Object作成が必要な場合**:
```typescript
// shared-e2e-components/[domain]/pages/[PageName]Page.ts
import { Page, Locator } from '@playwright/test'

/**
 * [ページ名]ページのPage Object
 *
 * @description
 * - [ページの説明]
 * - 役割ベースセレクタを優先使用
 * - Playwright推奨パターン準拠
 */
export class [PageName]Page {
  readonly page: Page

  // 主要要素のLocator定義
  readonly [elementName]: Locator

  constructor(page: Page) {
    this.page = page

    // 役割ベースセレクタで初期化
    this.[elementName] = page.getByRole('button', { name: /テキスト/ })
  }

  /**
   * [操作の説明]
   */
  async [actionMethod](): Promise<void> {
    await this.[elementName].click()
  }
}
```

### Phase 2: テストケース作成

```typescript
// testcase/[test-name].spec.ts
import { test, expect, devices } from '@playwright/test'
import { [PageName]Page } from '../shared-e2e-components/[domain]/pages/[PageName]Page'

/**
 * [テスト名]
 *
 * @description
 * - [テストの説明]
 * - storageStateによる認証状態の再利用
 */

// デバイス設定（SP版の場合）
test.use({
  ...devices['iPhone 13'],
})

test.describe('[テストグループ名]', () => {
  test.beforeEach(async ({ page }) => {
    // storageStateにより既にログイン済み
    await page.goto('[URL]', { waitUntil: 'domcontentloaded' })
  })

  test('C001_[テスト内容]', async ({ page }) => {
    // Arrange: Page Objectのインスタンス化
    const targetPage = new [PageName]Page(page)

    // Act: 操作実行
    console.log('📝 [操作内容]を実行中...')
    await targetPage.[actionMethod]()

    // Assert: 検証
    console.log('📝 [検証内容]を確認中...')
    await expect([検証対象]).toBeVisible()
    console.log('✅ [検証内容]が確認できました')
  })
})
```

### Phase 3: テスト実行確認

```bash
# テスト実行
npx playwright test testcase/[test-name].spec.ts

# ブラウザ表示モードで実行
npx playwright test testcase/[test-name].spec.ts --headed

# デバッグモード
npx playwright test testcase/[test-name].spec.ts --debug
```

---

## ✅ コーディングルール

### セレクタ優先順位
1. **役割ベースセレクタ（最優先）**:
   ```typescript
   page.getByRole('button', { name: 'ログイン' })
   page.getByRole('link', { name: 'ホーム' })
   page.getByLabel('メールアドレス')
   page.getByPlaceholder('例: user@example.com')
   page.getByText('特定のテキスト')
   ```

2. **data-testid属性**:
   ```typescript
   page.getByTestId('submit-button')
   ```

3. **CSSセレクタ（最後の手段）**:
   ```typescript
   page.locator('#unique-id')
   page.locator('.specific-class')
   ```

### 命名規則
- **Page Objectクラス**: `[PageName]Page` (PascalCase + Page)
- **テストファイル**: `[test-name].spec.ts` (kebab-case + .spec.ts)
- **テストケース**: `C[番号]_[テスト内容説明]`

### 必須事項
- ✅ `readonly` でLocatorを定義
- ✅ コンストラクタで全Locator初期化
- ✅ `waitUntil: 'domcontentloaded'` を使用
- ✅ 日本語でコメント・ログ記述
- ✅ console.log()で処理進捗を出力

---

## 🚫 禁止事項

- ❌ `page.waitForTimeout()` の使用（固定待機）
- ❌ `waitUntil: 'networkidle'` の使用（不安定）
- ❌ `page.locator()` の過度な使用（役割ベースを優先）
- ❌ 英語でのコメント記述
- ❌ テスト内での過度な条件分岐（if/switch）

---

## 📋 作業チェックリスト

テスト作成完了前に以下を確認してください：

- [ ] テストシナリオのヒアリング完了
- [ ] HTML構造の取得完了
- [ ] 既存Page Objectの確認完了
- [ ] Page Object作成（必要な場合）
- [ ] テストケース作成完了
- [ ] セレクタが役割ベース優先になっているか
- [ ] 日本語コメント・ログが記述されているか
- [ ] テスト実行が成功したか
- [ ] ユーザーに実行コマンドを提示したか

---

## 💡 実行例

```bash
> /test-create

Claude: テストケース作成を支援します。以下の情報を教えてください。

1. テスト対象ページのURLは何ですか？
2. どのようなテストシナリオですか？
3. 認証は必要ですか？（Yes/No）
4. PC版とSP版のどちらですか？

ユーザー:
1. https://www.m3.com/settings
2. サイドバーの'設定'リンクをクリックして設定ページに遷移し、ユーザー名が表示されることを確認
3. Yes
4. PC版

Claude: 了解しました。まずHTML構造を取得します...
[Playwright MCPでHTML取得]

既存のSidebarComponentが使用できるか確認します...
[既存POM確認]

新しいSettingsPageを作成します...
[Page Object作成]

テストケースを作成します...
[テストケース作成]

テストを実行して動作確認します...
[テスト実行]

✅ テスト作成が完了しました！

以下のコマンドで実行できます：
npx playwright test testcase/settings-page.spec.ts
```

---

## 🎯 成果物

テスト作成完了時には以下が生成されます：

1. **Page Objectファイル**（新規作成の場合）
   - `shared-e2e-components/[domain]/pages/[PageName]Page.ts`

2. **テストケースファイル**
   - `testcase/[test-name].spec.ts`

3. **実行コマンド**
   - ユーザーがすぐに実行できるコマンドを提示

---

このコマンドを使用することで、Playwrightベストプラクティスに準拠したテストを効率的に作成できます。
