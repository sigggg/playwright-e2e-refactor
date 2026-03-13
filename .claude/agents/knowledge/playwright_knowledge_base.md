# Playwright E2Eテストコード ナレッジベース

このドキュメントは、Playwright E2Eテストコードレビューにおける具体的なコード例、ベストプラクティス、アンチパターンを集約したナレッジベースです。

**使用方法**: Core Rules（.clauderules）がこのファイルを参照し、レビュー時に適切な例を引用します。

---

## 目次

1. [仕様整合性とアサーション](#1-仕様整合性とアサーション)
2. [構造と設計](#2-構造と設計)
3. [環境管理とセキュリティ](#3-環境管理とセキュリティ)
4. [ロギングとデバッグ](#4-ロギングとデバッグ)
5. [Playwrightベストプラクティス](#5-playwrightベストプラクティス)
6. [POM設計パターン](#6-pom設計パターン)
7. [セレクタ戦略](#7-セレクタ戦略)
8. [認証管理パターン](#8-認証管理パターン)
9. [環境変数・URL管理パターン](#9-環境変数url管理パターン)
10. [待機戦略・動的処理パターン](#10-待機戦略動的処理パターン)
11. [testInfo.attach責務分離パターン](#11-testinfoattach責務分離パターン)
12. [PC/SP共通化パターン](#12-pcsp共通化パターン)
13. [ファイル形式とクリーンアップ](#13-ファイル形式とクリーンアップ)

---

## 1. 仕様整合性とアサーション

### README照合の重要性

READMEに記載された仕様がテスト実装の正解です。抽象的な仕様を具体的なアサーションに変換することがQAエンジニアの役割です。

### 推論例

| READMEの記述（抽象的） | 具体的なチェック項目（推論） |
|-------------------|----------------------|
| 「記事が閲覧できる」 | ・タイトルが表示される<br>・本文が空でない<br>・画像が表示される<br>・エラーが出ない<br>・URLが正しい |
| 「ログインができる」 | ・ログインフォームが表示される<br>・認証情報を入力できる<br>・ログイン後にダッシュボードに遷移する<br>・ユーザー名が表示される<br>・ログアウトボタンが表示される |
| 「検索ができる」 | ・検索フォームが表示される<br>・検索キーワードを入力できる<br>・検索結果が表示される<br>・検索結果件数が表示される<br>・検索結果が0件の場合の表示がある |

### ❌ Bad: アサーションなし

```typescript
test('記事閲覧', async ({ page }) => {
  await page.goto('/articles/1')
  await page.waitForLoadState('domcontentloaded')
  // ❌ 何も確認していない
})
```

### ✅ Good: README仕様に基づくアサーション

```typescript
test('C001_記事閲覧', async ({ page }) => {
  // README仕様: 「記事が閲覧できる」

  await test.step('記事ページに遷移', async () => {
    await page.goto('/articles/1')
    await page.waitForLoadState('domcontentloaded')
  })

  await test.step('記事タイトルが表示されることを確認', async () => {
    const title = page.locator('h1')
    await expect(title).toBeVisible()
    const titleText = await title.textContent()
    expect(titleText).toBeTruthy()  // ✅ 空でないことを確認
  })

  await test.step('記事本文が表示されることを確認', async () => {
    const content = page.locator('.article-content')
    await expect(content).toBeVisible()
    const contentText = await content.textContent()
    expect(contentText?.length).toBeGreaterThan(0)  // ✅ 本文が空でないことを確認
  })

  await test.step('エラーが表示されていないことを確認', async () => {
    const errorMessage = page.locator('.error-message')
    await expect(errorMessage).not.toBeVisible()  // ✅ エラーなしを確認
  })
})
```

### ❌ Bad: 不完全な検証（10件のみチェック）

```typescript
test('ニュース記事一覧表示', async ({ page }) => {
  await page.goto('/news')
  const articles = page.locator('.news-article').first()  // ❌ 最初の1件のみ
  await expect(articles).toBeVisible()
})
```

### ✅ Good: 全件検証

```typescript
test('C001_ニュース記事一覧表示', async ({ page }) => {
  // README仕様: 「ニュース記事一覧が20件表示されること」
  // README仕様: 「各記事にタイトル・日付・カテゴリが表示されること」

  await test.step('ニュース記事一覧ページに遷移', async () => {
    await page.goto('/news')
    await page.waitForLoadState('domcontentloaded')
  })

  await test.step('記事一覧が20件表示されることを確認', async () => {
    const articles = page.locator('.news-article')
    await expect(articles).toHaveCount(20)  // ✅ README仕様に基づく検証
  })

  await test.step('各記事の必須項目が表示されることを確認', async () => {
    const articles = page.locator('.news-article')
    const count = await articles.count()

    // ✅ 全件チェック（不完全な検証を避ける）
    for (let i = 0; i < count; i++) {
      const article = articles.nth(i)

      // README仕様: タイトル必須
      await expect(article.locator('.article-title')).toBeVisible()

      // README仕様: 日付必須
      await expect(article.locator('.article-date')).toBeVisible()

      // README仕様: カテゴリ必須
      await expect(article.locator('.article-category')).toBeVisible()
    }
  })
})
```

---

## 2. 構造と設計

### PC/SP統合の強制

XXXPage.ts と XXXSPPage.ts で内容が重複、または一部の変更のみで吸収可能な場合は、**個別のファイル作成を厳格に禁止**し、一つのクラスへの集約（または継承）を強制します。

### 統合判断基準

| 状況 | 対応方法 | 理由 |
|------|---------|------|
| HTML構造が同一 | viewport検出で完全統合 | 1ファイルで両対応、保守性最大化 |
| HTML構造が一部異なる | ベースクラス継承 | 共通処理を集約、差分のみ実装 |
| ログイン処理が異なる | 共通ベースクラス + 抽象メソッド | 認証フロー差分を明確化 |

### ❌ Bad: PC版とSP版で別ファイル作成（重複あり）

```typescript
// LoginPage.ts
export class LoginPage extends BasePage {
  readonly usernameField: Locator
  readonly passwordField: Locator

  async performLogin(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username)
    await this.passwordField.fill(password)
    await this.loginButton.click()
  }
}

// LoginSPPage.ts - ❌ 重複実装
export class LoginSPPage extends BasePage {
  readonly usernameField: Locator
  readonly passwordField: Locator

  async performLogin(username: string, password: string): Promise<void> {
    // ❌ PC版と全く同じ実装
    await this.usernameField.fill(username)
    await this.passwordField.fill(password)
    await this.loginButton.click()
  }
}
```

### ✅ Good: viewport検出で完全統合

```typescript
export class LoginPage extends BasePage {
  readonly usernameField: Locator
  readonly passwordField: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    super(page)
    this.usernameField = page.getByLabel('ユーザー名')
    this.passwordField = page.getByLabel('パスワード')
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }

  async performLogin(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username)
    await this.passwordField.fill(password)
    await this.loginButton.click()
    await this.page.waitForLoadState('domcontentloaded')

    // viewport検出でPC/SP分岐
    await this.verifyLoginSuccess()
  }

  private async verifyLoginSuccess(): Promise<void> {
    const viewportSize = this.page.viewportSize()
    const isSP = viewportSize ? viewportSize.width <= 768 : false

    if (isSP) {
      // SP版のユーザー名表示要素を確認
      const usernameElement = this.page.locator('.sp-userinfo__name')
      await usernameElement.waitFor({ state: 'visible', timeout: 10000 })
    } else {
      // PC版のユーザー名表示要素を確認
      const usernameElement = this.page.locator('.header__username')
      await usernameElement.waitFor({ state: 'visible', timeout: 10000 })
    }
  }
}
```

### TypeScript堅牢化: readonly の使用

### ❌ Bad: readonlyなし（意図しない上書きのリスク）

```typescript
export class LoginPage extends BasePage {
  loginButton: Locator  // ❌ 誤って上書きされる可能性

  constructor(page: Page) {
    super(page)
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }

  async performLogin(): Promise<void> {
    this.loginButton = page.getByRole('button', { name: '送信' })  // ❌ 意図しない上書き
    await this.loginButton.click()
  }
}
```

### ✅ Good: readonlyで保護

```typescript
export class LoginPage extends BasePage {
  readonly loginButton: Locator  // ✅ 上書き不可

  constructor(page: Page) {
    super(page)
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }

  async performLogin(): Promise<void> {
    // this.loginButton = ...  // ✅ コンパイルエラーで防止
    await this.loginButton.click()
  }
}
```

### TypeScript堅牢化: 画面遷移メソッドの型定義（Method Chaining）

### ❌ Bad: 戻り値の型がvoid（次のページ操作が煩雑）

```typescript
export class LoginPage extends BasePage {
  async performLogin(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username)
    await this.passwordField.fill(password)
    await this.loginButton.click()
    // 遷移後のページオブジェクトを返さない
  }
}

// テストコードで冗長
test('ログイン後の操作', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await loginPage.performLogin('user', 'pass')

  // 新しいページオブジェクトを手動でインスタンス化
  const dashboardPage = new DashboardPage(page)  // ❌ 煩雑
  await dashboardPage.verifyWelcomeMessage()
})
```

### ✅ Good: 遷移後のPage Objectを返す（Method Chaining可能）

```typescript
export class LoginPage extends BasePage {
  async performLogin(username: string, password: string): Promise<DashboardPage> {
    await this.usernameField.fill(username)
    await this.passwordField.fill(password)
    await this.loginButton.click()
    await this.page.waitForLoadState('domcontentloaded')

    // 遷移後のページオブジェクトを返す
    return new DashboardPage(this.page)
  }
}

// テストコードで簡潔
test('ログイン後の操作', async ({ page }) => {
  const loginPage = new LoginPage(page)
  const dashboardPage = await loginPage.performLogin('user', 'pass')  // ✅ Method Chaining
  await dashboardPage.verifyWelcomeMessage()
})
```

### パッケージマネージャの判別

パッケージ追加を提案する際は、プロジェクトで使用されているパッケージマネージャを判別してください。

```bash
# パッケージマネージャの判別
if [ -f "yarn.lock" ]; then
  echo "✅ Yarn管理プロジェクト"
  echo "パッケージ追加: yarn add -D <package-name>"
elif [ -f "package-lock.json" ]; then
  echo "✅ npm管理プロジェクト"
  echo "パッケージ追加: npm install -D <package-name>"
fi
```

### ❌ Bad: 開発ツールがdependenciesに配置

```json
{
  "dependencies": {
    "playwright": "^1.57.0",  // ❌ 本番環境に不要
    "typescript": "^5.0.0",   // ❌ 本番環境に不要
    "vite": "^4.0.0"          // ❌ 本番環境に不要
  },
  "devDependencies": {}
}
```

### ✅ Good: 開発ツールはdevDependencies

```json
{
  "dependencies": {},
  "devDependencies": {
    "playwright": "^1.57.0",       // ✅ 開発・テスト用
    "typescript": "^5.0.0",        // ✅ 開発用
    "vite": "^4.0.0",              // ✅ 開発用
    "@playwright/test": "^1.57.0"  // ✅ テスト用
  }
}
```

### ファイル末尾の改行

すべてのファイルの末尾には1行の空行を入れることが推奨されます。

### ❌ Bad: ファイル末尾に改行なし

```typescript
export class LoginPage extends BasePage {
  // ... 実装
}
// ❌ ファイルがここで終わる（改行なし）
```

### ✅ Good: ファイル末尾に1行空行

```typescript
export class LoginPage extends BasePage {
  // ... 実装
}
// ✅ ファイル末尾に1行空行がある

```

**理由**:
- POSIX標準に準拠
- Git diffが正しく動作
- 一部のエディタ・ツールで警告が出ない
- チーム開発での一貫性確保

**確認方法**:
```bash
# ファイル末尾に改行がないファイルを検出
find . -name "*.ts" -exec sh -c 'test "$(tail -c 1 "{}")" && echo "No newline: {}"' \;
```

---

## 3. 環境管理とセキュリティ

### GitLab Variables 最小化の重要性

URLやProxyなどの具体的な設定値をGitLab Variables画面（ポチポチ設定）で管理することを禁止します。

**原則**: 環境固有の値（URL、Proxy、タイムアウト等）は `playwright.config.ts` 内の定数オブジェクトで管理し、`.gitlab-ci.yml` では環境識別子（`TARGET_ENV: "qa1"`）のみを変数として定義します。

### ❌ Bad: GitLab Variablesで詳細設定を管理

```yaml
# .gitlab-ci.yml
variables:
  BASE_URL: "https://qa1.example.com"  # ❌ 具体的なURL
  PROXY_SERVER: "http://proxy.qa1:8080"  # ❌ 具体的なProxy
  TIMEOUT: "30000"  # ❌ 具体的なタイムアウト
```

### ✅ Good: 環境識別子方式（Single Source of Truth）

```yaml
# .gitlab-ci.yml
variables:
  TARGET_ENV: "qa1"  # ✅ 環境識別子のみ
```

```typescript
// playwright.config.ts
const envConfig = {
  qa1: {
    baseURL: 'https://qa1.example.com',
    proxy: { server: 'http://proxy.qa1:8080' },
    timeout: 30000,
  },
  qa2: {
    baseURL: 'https://qa2.example.com',
    proxy: { server: 'http://proxy.qa2:8080' },
    timeout: 30000,
  },
  production: {
    baseURL: 'https://example.com',
    proxy: undefined,
    timeout: 60000,
  },
}

const targetEnv = process.env.TARGET_ENV || 'qa1'
const config = envConfig[targetEnv]

export default defineConfig({
  use: {
    baseURL: config.baseURL,
    proxy: config.proxy,
  },
  timeout: config.timeout,
})
```

### URLの外部注入

### ❌ Bad: URL直書き

```typescript
async navigate(): Promise<void> {
  await this.page.goto('https://qa1.example.com/dashboard')  // ❌ URL直書き
}
```

### ✅ Good: baseURL活用

```typescript
async navigate(): Promise<void> {
  await this.page.goto('/dashboard')  // ✅ baseURLを使用
}
```

---

## 4. ロギングとデバッグ

### ログのノイズ排除

### ❌ Bad: throw前の重複console.warn

```typescript
try {
  await element.waitFor({ state: 'visible', timeout: 10000 })
} catch (error) {
  console.warn('要素が見つかりませんでした')  // ❌ 重複
  throw new Error('要素が見つかりませんでした')  // ❌ メッセージ重複
}
```

### ✅ Good: throwのみで十分

```typescript
try {
  await element.waitFor({ state: 'visible', timeout: 10000 })
} catch (error) {
  throw new Error(`要素が見つかりませんでした: ${error.message}`)  // ✅ 詳細なエラーメッセージ
}
```

### testInfo.attach の活用

### ❌ Bad: デバッグログが残っている、エラー詳細が失われる

```typescript
test('記事リンク検証', async ({ page }) => {
  console.log('テスト開始')  // ❌ 不要なデバッグログ
  const links = page.locator('a')
  const count = await links.count()
  console.log(`リンク数: ${count}`)  // ❌ CI環境でノイズ

  const errors: string[] = []
  for (let i = 0; i < count; i++) {
    const href = await links.nth(i).getAttribute('href')
    if (!href || href.startsWith('javascript:')) {
      errors.push(`Invalid link: ${href}`)
    }
  }

  expect(errors.length).toBe(0)  // ❌ エラー詳細が失われる
})
```

### ✅ Good: ログ最適化、エラー詳細添付

```typescript
test('記事リンク検証', async ({ page }, testInfo) => {
  const links = page.locator('a')
  const count = await links.count()

  const errors: string[] = []
  const linkDetails: Array<{ index: number; href: string; text: string; reason: string }> = []

  for (let i = 0; i < count; i++) {
    const link = links.nth(i)
    const href = await link.getAttribute('href')
    const text = (await link.textContent())?.trim() || '(no text)'

    if (!href || href.startsWith('javascript:')) {
      const reason = !href ? 'href属性なし' : 'javascript:スキーム使用'
      errors.push(`Link ${i}: "${text}" -> ${href} (${reason})`)

      // ✅ 構造化されたエラー詳細を収集
      linkDetails.push({ index: i, href: href || '', text, reason })
    }
  }

  if (errors.length > 0) {
    // ✅ エラー時のみ詳細出力
    console.error(`❌ ${errors.length} invalid links found:\n${errors.join('\n')}`)

    // ✅ レポートに詳細添付（JSON形式）
    await testInfo.attach('invalid-links.json', {
      body: JSON.stringify({
        totalLinks: count,
        invalidLinks: errors.length,
        details: linkDetails,
        timestamp: new Date().toISOString()
      }, null, 2),
      contentType: 'application/json'
    })

    // ✅ スクリーンショットも添付（視覚的な確認用）
    await testInfo.attach('page-screenshot.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    })
  }

  expect(errors).toHaveLength(0)  // ✅ エラー詳細はレポートに添付済み
})
```

### testInfo.attach のベストプラクティス

```typescript
// ✅ 複数の添付ファイルを組み合わせる
if (errors.length > 0) {
  // 1. エラー詳細（JSON）
  await testInfo.attach('error-details.json', {
    body: JSON.stringify({
      errorCount: errors.length,
      errors: errors,
      timestamp: new Date().toISOString(),
      testName: testInfo.title
    }, null, 2),
    contentType: 'application/json'
  })

  // 2. スクリーンショット
  await testInfo.attach('error-screenshot.png', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png'
  })

  // 3. HTML ソース
  await testInfo.attach('page-source.html', {
    body: await page.content(),
    contentType: 'text/html'
  })
}
```

---

## 5. Playwrightベストプラクティス

### 不要な async の削除

### ❌ Bad: 不要なasync

```typescript
export class NewsPage extends BasePage {
  // ❌ awaitを含まないのにasyncがついている
  async getPageTitle(): string {
    return 'News Page'  // ❌ Promise<string>を返す必要がない
  }
}
```

### ✅ Good: asyncなし

```typescript
export class NewsPage extends BasePage {
  // ✅ awaitを含まないのでasyncなし
  getPageTitle(): string {
    return 'News Page'  // ✅ 戻り値の型: string
  }
}
```

### 待機戦略

### ❌ Bad: waitForTimeout使用

```typescript
async clickArticle(): Promise<void> {
  await this.articleLink.click()
  await this.page.waitForTimeout(3000)  // ❌ 固定待ち

  try {
    await this.page.waitForLoadState('domcontentloaded')
  } catch (error) {
    throw new Error('Page is broken')  // ❌ エラー原因を無視
  }
}
```

### ✅ Good: Web-first Assertions

```typescript
async clickArticle(): Promise<void> {
  await this.articleLink.click()

  // ✅ Web-first Assertions（自動リトライ）
  await expect(this.page.locator('.article-detail')).toBeVisible({ timeout: 10000 })

  try {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 })
  } catch (error) {
    // ✅ 具体的なエラーメッセージ
    throw new Error(`Failed to load article detail page: ${error.message}`)
  }
}
```

###非推奨・レガシーAPIの回避

Playwrightの最新ベストプラクティスに従い、非推奨またはレガシーAPIの使用を避けます。

#### ❌ Bad: type()の使用

```typescript
async fillSearchQuery(query: string): Promise<void> {
  // ❌ type()は非推奨
  await this.searchInput.type(query)
}
```

#### ✅ Good: fill()の使用

```typescript
async fillSearchQuery(query: string): Promise<void> {
  // ✅ fill()は高速で安定
  await this.searchInput.fill(query)
}

// AngularJS等でデータバインディングが必要な場合
async fillSearchQueryWithBinding(query: string): Promise<void> {
  // ✅ pressSequentially()を使用（キーイベントをトリガー）
  await this.searchInput.pressSequentially(query)
}
```

#### ❌ Bad: page.$の使用

```typescript
async getArticleCount(): Promise<number> {
  // ❌ page.$は非推奨
  const articles = await this.page.$$('.article')
  return articles.length
}
```

#### ✅ Good: locator()の使用

```typescript
async getArticleCount(): Promise<number> {
  // ✅ locator()は自動待機する
  const articles = this.page.locator('.article')
  return await articles.count()
}
```

#### ❌ Bad: waitForNavigation()の使用

```typescript
async clickLink(): Promise<void> {
  await Promise.all([
    this.page.waitForNavigation(),  // ❌ タイミングによりタイムアウトしやすい
    this.link.click()
  ])
}
```

#### ✅ Good: waitForURL()の使用

```typescript
async clickLink(): Promise<void> {
  await this.link.click()
  // ✅ waitForURL()はより安定
  await this.page.waitForURL('/new-page')

  // またはアサーションで確認
  await expect(this.page).toHaveURL('/new-page')
}
```

### 高度なベストプラクティス

#### Web-first Assertionsの優先使用

`isVisible()`などの状態取得メソッドではなく、Web-first Assertionsを使用します。

##### ❌ Bad: isVisible()を使ったアサーション

```typescript
// ❌ 自動待機が効かない
const isVisible = await this.loginButton.isVisible()
expect(isVisible).toBe(true)
```

##### ✅ Good: Web-first Assertions

```typescript
// ✅ 自動リトライで安定
await expect(this.loginButton).toBeVisible()
```

#### コンストラクタ内でのページ操作禁止

Page Objectのコンストラクタは初期化のみを行い、ページ操作は専用メソッドに分離します。

##### ❌ Bad: コンストラクタ内でページ操作

```typescript
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
    this.page.goto('/login')  // ❌ コンストラクタ内でナビゲーション
    this.page.waitForLoadState('domcontentloaded')  // ❌ コンストラクタ内で待機
  }
}
```

##### ✅ Good: 専用メソッドに分離

```typescript
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
    // ✅ Locatorの初期化のみ
    this.emailInput = page.getByLabel('メールアドレス')
    this.passwordInput = page.getByLabel('パスワード')
  }

  // ✅ ナビゲーションは専用メソッド
  async navigate(): Promise<void> {
    await this.page.goto('/login')
    await this.page.waitForLoadState('domcontentloaded')
  }
}
```

#### マジック文字列のハードコード回避

長い文字列（URL、テストデータなど）は定数ファイルまたはConfigから取得します。

##### ❌ Bad: マジック文字列のハードコード

```typescript
test('記事表示', async ({ page }) => {
  // ❌ 15文字以上の文字列をハードコード
  await page.goto('https://qa1.example.com/articles/medical-news/detail?id=12345')
  await page.fill('#search-input', 'very-long-search-query-text')
})
```

##### ✅ Good: 定数ファイルまたはConfigから取得

```typescript
// test-data.ts
export const TEST_DATA = {
  articleUrl: '/articles/medical-news/detail?id=12345',
  searchQuery: 'very-long-search-query-text'
}

// test.spec.ts
import { TEST_DATA } from './data/test-data'

test('記事表示', async ({ page }) => {
  // ✅ 定数ファイルから取得（baseURL活用）
  await page.goto(TEST_DATA.articleUrl)
  await page.fill('#search-input', TEST_DATA.searchQuery)
})
```

#### 動的IDセレクタへの依存回避

ビルド毎に変更される可能性のある動的IDは避け、安定したセレクタを使用します。

##### ❌ Bad: 動的IDへの依存

```typescript
// ❌ IDの末尾が数字（動的生成の可能性）
readonly submitButton = this.page.locator('#submit-button-12345')
readonly articleCard = this.page.locator('#article-card-9876')
```

##### ✅ Good: 安定したセレクタ

```typescript
// ✅ 役割ベースセレクタ
readonly submitButton = this.page.getByRole('button', { name: '送信' })

// ✅ data-testid
readonly articleCard = this.page.getByTestId('article-card')

// ✅ 安定したclass（必要な場合のみ）
readonly articleCard = this.page.locator('.article-card').first()
```

---

## 6. POM設計パターン

### Locator初期化パターン（Playwright推奨）

### ❌ Bad: getter使用

```typescript
export class HeaderComponent {
  private page: Page

  get userName(): Locator {
    return this.page.getByRole('button', { name: /先生|さん/ })
  }
}
```

### ✅ Good: コンストラクタでreadonly初期化

```typescript
export class HeaderComponent {
  readonly page: Page
  readonly userName: Locator
  readonly atlasHeader: Locator

  constructor(page: Page) {
    this.page = page
    this.atlasHeader = page.getByRole('heading', { name: 'm3.com', level: 1 })
    this.userName = page.getByRole('button', { name: /先生|さん/ })
  }
}
```

### Page Object責務と独立性

- **操作に専念**: ページの操作に関するメソッドのみ提供
- **検証の限定利用**: Page Object内のexpectは、**共通基盤確認（verifyメソッド）のみ**に限定する。操作メソッド内でのexpect使用は避ける
- **独立性の保持**: 自身のページの操作にのみ責任を持つ
- **URL検証**: Page Object生成前にURLの事前確認を実行

### ❌ Bad: 操作メソッド内でのexpect使用

```typescript
export class BadPage extends BasePage {
  readonly submitButton: Locator

  constructor(page: Page) {
    super(page)
    this.submitButton = page.getByRole('button', { name: '送信' })
  }

  /**
   * 送信ボタンをクリック
   * ❌ 操作メソッド内でexpectを使用している（不適切）
   */
  async clickSubmitButton(): Promise<void> {
    await expect(this.submitButton).toBeVisible()  // ❌ 操作メソッド内のアサーション
    await this.submitButton.click()
  }
}
```

**問題点**:
- 操作メソッド（`clickSubmitButton`）内でexpectを使用している
- このexpectは単一テストケースでしか使われないため、spec側に書くべき
- POMの責務が肥大化している

### ✅ Good: 操作メソッドは操作のみ、共通基盤確認はverifyメソッドに分離

```typescript
export class GoodPage extends BasePage {
  readonly submitButton: Locator
  readonly successMessage: Locator

  constructor(page: Page) {
    super(page)
    this.submitButton = page.getByRole('button', { name: '送信' })
    this.successMessage = page.getByRole('heading', { name: '送信完了' })
  }

  /**
   * 送信ボタンをクリック（操作のみ、expectなし）
   */
  async clickSubmitButton(): Promise<void> {
    await this.submitButton.waitFor({ state: 'visible' })
    await this.submitButton.click()
  }

  /**
   * 送信完了を確認（共通基盤確認）
   * ✅ 複数テストで再利用される基盤的な状態チェック
   */
  async verifySubmitSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/success/)
    await expect(this.successMessage).toBeVisible()
  }
}
```

**改善点**:
- 操作メソッド（`clickSubmitButton`）はexpectなし、waitFor()のみ
- 共通基盤確認（`verifySubmitSuccess`）は、複数テストで再利用される場合のみverifyメソッドとして実装
- テストケース固有の検証はspec側で実装（Locatorを公開して利用）

### テストコードの構造化とカプセル化

Page Objectのカプセル化とtest.stepによる構造化は、テストの可読性と保守性を大幅に向上させます。

#### ❌ Bad: Locator直接操作 & ハードコードタイムアウト

```typescript
test('ログインテスト', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await page.goto('/login');
  await loginPage.username.fill('user'); // ❌ プロパティを直接操作
  await expect(loginPage.submitBtn).toBeVisible({ timeout: 30000 }); // ❌ 露出 & ハードコード
  await loginPage.submitBtn.click();
});
```

**問題点:**

- ❌ `test.step`がなく、レポート上でどの手順で失敗したか分からない
- ❌ Locatorプロパティ(`username`, `submitBtn`)を直接テストコードで操作
- ❌ アサーション(`expect`)がテストコードに露出
- ❌ タイムアウト値(`30000`)のハードコード
- ❌ Page Objectのメソッドではなくプロパティへの直接アクセス

#### ✅ Good: test.step構造化 & POM完全カプセル化

```typescript
test('ログインテスト', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await test.step('1. ログイン画面へ遷移', async () => {
    await loginPage.goto();
  });

  await test.step('2. 認証情報の入力と送信', async () => {
    await loginPage.performLogin('user', 'pass');
  });

  await test.step('3. ログイン後の表示確認', async () => {
    await loginPage.verifyDashboardVisible(); // ✅ アサーションはPOM内で完結
  });
});
```

**改善点:**

- ✅ `test.step`で各手順を明確に分離（レポートで視認性向上）
- ✅ Page Objectのメソッド(`performLogin`, `verifyDashboardVisible`)のみを使用
- ✅ アサーションはPOM内の`verify...`メソッドに隠蔽
- ✅ タイムアウトはPOM内で一元管理（テストコードに露出しない）
- ✅ AAA（Arrange-Act-Assert）パターンが明確

#### POM実装例（Good Pattern対応）

```typescript
// login-page.ts
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly username: Locator;
  readonly password: Locator;
  readonly submitBtn: Locator;
  readonly dashboardHeading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.username = page.getByLabel('ユーザー名');
    this.password = page.getByLabel('パスワード');
    this.submitBtn = page.getByRole('button', { name: 'ログイン' });
    this.dashboardHeading = page.getByRole('heading', { name: 'ダッシュボード' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  /**
   * ログイン操作を実行
   * @description Locator操作をメソッド内に完全カプセル化
   */
  async performLogin(user: string, pass: string): Promise<void> {
    await this.username.fill(user);
    await this.password.fill(pass);
    await this.submitBtn.click();
  }

  /**
   * ダッシュボード表示を検証
   * @description アサーションをPOM内に隠蔽（テストコードに露出させない）
   */
  async verifyDashboardVisible(): Promise<void> {
    // ✅ タイムアウトはPOM内で一元管理
    await expect(this.dashboardHeading).toBeVisible({ timeout: 10000 });
  }
}
```

**ベストプラクティス:**

- ✅ `readonly Locator`: コンストラクタで初期化、不変性を保証
- ✅ `perform...`: 操作メソッド（Locator操作をカプセル化）
- ✅ `verify...`: 検証メソッド（expectをカプセル化）
- ✅ タイムアウト値は各メソッド内で明示的に管理（マジック値を排除）

### アサーション配置のハイブリッドアプローチ（推奨パターン）

**方針**: テストシナリオの核心となる検証はspec側で `expect` を直接記述し、共通的なページ状態確認（ログイン成功、ヘッダー表示など）のみPOM内の `verify...` メソッドに限定する。

#### 判断基準

**✅ POM内verifyメソッドでexpect使用OK（共通状態確認）**:
- `verifyLoginSuccess()`: ログイン後のダッシュボード遷移確認
- `verifyHeaderVisible()`: ヘッダー・サイドバーの表示確認
- `verifyPageLoaded()`: ページの基本要素が読み込まれたことの確認

**✅ spec側でexpect使用必須（テストケース固有検証）**:
- `expect(dashboardPage.welcomeMessage).toHaveText('山田太郎さん、こんにちは')` - 特定ユーザー名の検証
- `expect(orderPage.totalPrice).toHaveText('¥12,800')` - ビジネスロジック検証
- `expect(errorMessage).toHaveText('メールアドレスの形式が正しくありません')` - バリデーション検証

**判断の鍵**: 「このexpectが、複数のテストケースで全く同じ内容で再利用されるか？」
- YES → POM内verifyメソッド
- NO → spec側でexpect

#### 実装例: Page Object（LoginPage.ts）

```typescript
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByRole('button', { name: 'ログイン' });
    this.emailInput = page.getByLabel('メールアドレス');
    this.passwordInput = page.getByLabel('パスワード');
  }

  /**
   * ログインページへ遷移
   * @description 操作メソッド（expectなし）
   */
  async navigate(): Promise<void> {
    await this.page.goto('/login', { waitUntil: 'domcontentloaded' });
  }

  /**
   * ログイン操作を実行
   * @description 操作メソッド（expectなし）
   */
  async performLogin(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /**
   * ログイン成功を確認（共通基盤確認）
   * @description 複数テストで再利用される基盤的な状態チェック
   */
  async verifyLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible();
  }
}
```

#### 実装例: テストコード（login.spec.ts）

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/login/pages/LoginPage';
import { DashboardPage } from '../src/dashboard/pages/DashboardPage';
import { TEST_ACCOUNTS } from './data/test-accounts';

test.describe('C001_ログイン_正常系', () => {
  test('管理者ユーザーでログインできること', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // 確認事項1: ログインフォームが表示されること
    await test.step('ログインフォームが表示されること', async () => {
      await loginPage.navigate();
      // テストケース固有の検証はspec側でexpect
      await expect(loginPage.loginButton).toBeVisible();
      await expect(loginPage.emailInput).toBeVisible();
      await expect(loginPage.passwordInput).toBeVisible();
    });

    // 確認事項2: ログインボタンが有効であること
    await test.step('ログインボタンが有効であること', async () => {
      // テストケース固有の検証はspec側でexpect
      await expect(loginPage.loginButton).toBeEnabled();
    });

    // 操作: ログイン実行
    await test.step('管理者としてログイン', async () => {
      await loginPage.performLogin(
        TEST_ACCOUNTS.admin.email,
        TEST_ACCOUNTS.admin.password
      );
      // 共通基盤確認（ログイン成功）はPOMメソッドを利用
      await loginPage.verifyLoginSuccess();
    });

    // 確認事項3: 管理者メニューが表示されること
    await test.step('管理者メニューが表示されること', async () => {
      // テストケース固有の検証（管理者のみ）はspec側でexpect
      await expect(dashboardPage.adminMenu).toBeVisible();
      await expect(dashboardPage.userManagementLink).toBeVisible();
    });

    // 確認事項4: ユーザー名が表示されること
    await test.step('ダッシュボードにユーザー名が表示されること', async () => {
      // ビジネスロジック固有の検証（特定ユーザー名）はspec側でexpect
      await expect(dashboardPage.usernameDisplay).toHaveText('管理者太郎');
    });
  });
});
```

#### メリット

**✅ デバッグ性の向上**:
- アサーション失敗時のスタックトレースがテストコードを直接指す
- どのテストケースのどの検証が失敗したか即座に判別可能

**✅ 保守性の向上**:
- 共通検証ロジック（ログイン成功確認など）の重複を排除
- セレクタ変更時の修正箇所が局所化される

**✅ 責務の明確化**:
- POM: 操作と共通状態確認
- spec: テストケース固有のビジネスロジック検証

**✅ Playwrightベストプラクティスとの整合**:
- 公式推奨の責務分離を維持しつつ、実用的な再利用性を確保

---

## 7. セレクタ戦略

### セレクタ優先順位

1. **getByRole** (最優先)
2. **getByLabel**
3. **getByPlaceholder**
4. **getByText**
5. **data-testid**
6. **CSSセレクタ** (最後の手段)

### ✅ Good: 役割ベースセレクタの使用例

```typescript
// ボタン
page.getByRole('button', { name: 'ログイン' })

// リンク
page.getByRole('link', { name: 'ホーム' })

// 入力フィールド
page.getByLabel('メールアドレス')
page.getByPlaceholder('例: user@example.com')

// テキスト
page.getByText('特定のテキスト')
```

### ❌ Bad: 構造依存のCSSセレクタ

```typescript
const element = page.locator('div.container > div:nth-child(2) > p.text')  // ❌ 構造依存
```

### ✅ Good: セマンティックセレクタ

```typescript
const element = page.getByRole('paragraph').filter({ hasText: '特定のテキスト' })  // ✅ 意味ベース
```

---

## 8. 認証管理パターン

### StorageState活用（グローバルセットアップ）

### ディレクトリ構造（Playwright標準）

```
testcase/                    # testDir
├── auth.setup.ts           # グローバルセットアップ（認証処理）
├── .auth/                  # 認証状態ファイル（.gitignore）
│   └── user.json           # Cookie、LocalStorage、SessionStorage
└── *.spec.ts               # テストファイル
```

### globalSetup実装例

```typescript
// testcase/auth.setup.ts
import { chromium, FullConfig } from '@playwright/test'
import { M3LoginPage } from '../shared-e2e-components/auth/m3LoginPage'
import { HeaderComponent } from '../shared-e2e-components/common/headerComponent'
import { TEST_ACCOUNTS } from './data/test-accounts'
import * as path from 'path'

/**
 * M3.com認証グローバルセットアップ
 *
 * @description
 * - M3.comでのログインを1回だけ実行してstorageStateを保存
 * - 後続のテストで認証状態を再利用可能にする
 * - テスト実行時間の短縮と認証サーバーへの負荷軽減
 * - QA用アカウント情報はGit管理ファイル（test-accounts.ts）から取得
 */
async function globalSetup(config: FullConfig) {
  const authFile = path.join(__dirname, '.auth/user.json')

  console.log('🔐 認証グローバルセットアップを開始します...')

  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // M3.comにログイン（Git管理ファイルからアカウント取得）
    const loginPage = new M3LoginPage(page)
    await loginPage.performLogin({
      username: TEST_ACCOUNTS.pc.username,
      password: TEST_ACCOUNTS.pc.password
    })

    console.log('✅ M3.comログインが完了しました')

    // ログイン成功確認
    const header = new HeaderComponent(page)
    const isLoggedIn = await header.isLoggedIn()

    if (!isLoggedIn) {
      throw new Error('❌ ログイン確認に失敗しました')
    }

    const username = await header.getUserName()
    console.log(`✅ ログイン状態確認完了: ${username}`)

    // 認証状態をファイルに保存
    await context.storageState({ path: authFile })
    console.log(`✅ 認証状態を保存しました: ${authFile}`)

  } catch (error) {
    console.error('❌ 認証セットアップに失敗しました:', error)

    // エラー時のスクリーンショット保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotPath = `test-results/auth-setup-failure-${timestamp}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.error(`📸 エラースクリーンショットを保存しました: ${screenshotPath}`)

    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
```

### 認証情報の管理方針

**重要**: QA用アカウント情報は環境変数（.env）ではなく、Git管理ファイル（test-accounts.ts）から取得することを推奨します。

**理由**:
- **バージョン管理**: アカウント情報の変更履歴を追跡可能
- **チーム共有**: 全メンバーが同じQA用アカウントを使用
- **CI/CD統合**: 環境変数設定の手間を削減
- **セキュリティ**: 本番アカウントとの明確な分離（QA専用のみGit管理）

**test-accounts.ts の例**:
```typescript
// testcase/data/test-accounts.ts
export const TEST_ACCOUNTS = {
  pc: {
    username: 'qa_user_pc@example.com',
    password: 'QaTestPassword123'
  },
  sp: {
    username: 'qa_user_sp@example.com',
    password: 'QaTestPassword456'
  }
} as const
```

**注意事項**:
- **本番アカウント情報は絶対にGit管理しないこと**
- QA専用アカウントのみをtest-accounts.tsに記載
- 本番環境での実行が必要な場合は環境変数を使用

### playwright.config.ts設定

```typescript
export default defineConfig({
  testDir: './testcase',

  // グローバルセットアップ: 全テスト実行前に1回だけ認証を実行
  globalSetup: require.resolve('./testcase/auth.setup.ts'),

  use: {
    // 認証状態を全テストで共有
    storageState: path.join(__dirname, 'testcase/.auth/user.json'),
  },
})
```

### テストファイルでの利用

```typescript
// testcase/example.spec.ts
import { test, expect } from '@playwright/test'

test.describe('機能テスト', () => {
  test.beforeEach(async ({ page }) => {
    // storageStateにより既にログイン済みの状態
    // ログイン処理は不要、直接ページにアクセス
    await page.goto('https://www.m3.com', { waitUntil: 'domcontentloaded' })
  })

  test('C001_ログイン状態でのテスト', async ({ page }) => {
    // 既にログイン済みの状態でテストが開始される
    const header = new HeaderComponent(page)
    const isLoggedIn = await header.isLoggedIn()
    expect(isLoggedIn).toBe(true)
  })
})
```

### パフォーマンス改善効果

- **テスト実行時間**: 48%短縮（例: 54.3秒 → 28.5秒）
- **ログイン回数**: 75%削減（例: 4回 → 1回）
- **認証サーバー負荷**: 大幅軽減
- **テスト安定性**: ログイン失敗によるテスト失敗を最小化

---

## 9. 環境変数・URL管理パターン

### Proxy設定の明示化

### ❌ Bad: Proxy設定なし（本番環境アクセスのリスク）

```typescript
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL,
    // ❌ Proxy設定なし
  },
})
```

### ✅ Good: 環境別Proxy設定

```typescript
const envConfig = {
  qa1: {
    baseURL: 'https://qa1.example.com',
    proxy: { server: 'http://proxy.qa1:8080' },  // ✅ QA環境はProxy経由
  },
  production: {
    baseURL: 'https://example.com',
    proxy: undefined,  // ✅ 本番環境はProxy不要
  },
}

const targetEnv = process.env.TARGET_ENV || 'qa1'
const config = envConfig[targetEnv]

export default defineConfig({
  use: {
    baseURL: config.baseURL,
    proxy: config.proxy,
  },
})
```

### ⚠️ TARGET_ENV デフォルト値への過度な依存を避ける

**警告**: `const targetEnv = process.env.TARGET_ENV || 'qa1'` のようなデフォルト値依存は、CI環境での意図しない環境への接続を引き起こす可能性があります。

### ❌ Bad: デフォルト値に過度に依存

```typescript
// playwright.config.ts
const targetEnv = process.env.TARGET_ENV || 'qa1'  // ❌ CI環境で未設定時にqa1に接続
const config = envConfig[targetEnv]
```

**問題点**:
- CI環境でTARGET_ENVが未設定の場合、意図せずqa1環境に接続
- 本番環境へのテスト実行を意図していたのに、デフォルト値でQA環境に接続
- エラーが発生せず、誤った環境でテストが実行される

### ✅ Good: 明示的な環境指定を強制

```typescript
// playwright.config.ts
const targetEnv = process.env.TARGET_ENV

if (!targetEnv) {
  throw new Error(
    '❌ TARGET_ENV環境変数が設定されていません。' +
    '以下のいずれかを指定してください: qa1, qa2, production'
  )
}

if (!envConfig[targetEnv]) {
  throw new Error(
    `❌ 不正な環境指定: ${targetEnv}\n` +
    `有効な環境: ${Object.keys(envConfig).join(', ')}`
  )
}

const config = envConfig[targetEnv]

export default defineConfig({
  use: {
    baseURL: config.baseURL,
    proxy: config.proxy,
  },
})
```

**CI環境での設定確認**:

```yaml
# .gitlab-ci.yml
test:qa1:
  variables:
    TARGET_ENV: "qa1"  # ✅ 明示的に指定
  script:
    - npm test

test:production:
  variables:
    TARGET_ENV: "production"  # ✅ 明示的に指定
  script:
    - npm test
  only:
    - main
```

**レビュー時の確認ポイント**:
- [ ] playwright.config.tsでTARGET_ENVが未設定時にエラーを投げているか
- [ ] CI設定（.gitlab-ci.yml）で各ジョブにTARGET_ENVが明示的に設定されているか
- [ ] 不正な環境識別子が指定された場合のエラーハンドリングがあるか

---

## 10. 待機戦略・動的処理パターン

### 全行スキャンパターン

### ❌ Bad: 最初の行だけチェック

```typescript
async verifyTodayActionHistory(expectedDate: string): Promise<void> {
  const table = this.page.getByRole('table').first()
  const firstDataRow = table.locator('tbody tr').first()
  const cells = firstDataRow.locator('td')

  const dateCell = cells.nth(0)
  await expect(dateCell).toHaveText(expectedDate)

  const pointsCell = cells.nth(2)
  await expect(pointsCell).toHaveText('+5')  // ❌ 他のポイント獲得があるとここで失敗
}
```

### ✅ Good: 全行スキャンで条件に合致する行を探す

```typescript
async verifyTodayActionHistory(expectedDate: string): Promise<void> {
  console.log(`🔍 今日のアクション履歴を確認中（期待日付: ${expectedDate}）...`)

  const table = this.page.getByRole('table').first()
  await table.waitFor({ state: 'visible', timeout: 10000 })

  const dataRows = table.locator('tbody tr')
  const rowCount = await dataRows.count()

  let found = false

  // 全行をスキャンして「今日のアクション」を探す
  for (let i = 0; i < rowCount; i++) {
    const row = dataRows.nth(i)
    const cells = row.locator('td')

    const dateCell = cells.nth(0)
    const dateText = await dateCell.textContent()

    const contentCell = cells.nth(1)
    const contentText = await contentCell.textContent()

    // 今日の日付で「今日のアクション」で始まる行を探す
    if (dateText?.trim() === expectedDate && contentText?.trim().startsWith('今日のアクション')) {
      console.log(`✅ 日付が一致しました: ${expectedDate}`)
      console.log('✅ 履歴内容が「今日のアクション」で始まります')

      const pointsCell = cells.nth(2)
      await expect(pointsCell).toHaveText('+5', { timeout: 10000 })
      console.log('✅ ポイント数が+5です')

      found = true
      break
    }
  }

  if (!found) {
    throw new Error(`今日の日付（${expectedDate}）で「今日のアクション」のポイント履歴が見つかりませんでした`)
  }
}
```

### 日付動的生成

### ✅ Good: static メソッドで日付生成

```typescript
static getTodayDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// テストコードで使用
const todayDate = PointHistoryPage.getTodayDate()
await pointHistoryPage.verifyTodayActionHistory(todayDate)
```

### jQuery UIプラグイン対策

### ✅ Good: pressSequentially()で1文字ずつ入力

```typescript
// tag-itフィールドに対する適切な入力
const systemCodeLi = this.page.locator('//html[1]/body[1]/div[2]/form[1]/fieldset[1]/div[2]/div[1]/div[1]/ul[1]/li[1]').first()
await systemCodeLi.click()

const systemCodeInput = this.page.locator('//html[1]/body[1]/div[2]/form[1]/fieldset[1]/div[2]/div[1]/div[1]/ul[1]/li[1]/input[1]').first()
await systemCodeInput.pressSequentially(userId)  // ✅ 1文字ずつ入力
```

---

## 11. testInfo.attach責務分離パターン

### 責務分離の原則

- **Page Object**: ページの操作とデータ取得に専念（UIレイヤー）
- **Test File**: アサーション、レポート添付、テストシナリオの記述（テストレイヤー）
- **Fixtures**: 共通のセットアップ、ティアダウン、エラーハンドリング（インフラレイヤー）

### ❌ Bad: Page ObjectがtestInfoに依存している

```typescript
export class ArticlePage extends BasePage {
  async validateAllImages(testInfo: TestInfo): Promise<void> {  // ❌
    const images = this.page.locator('img')
    const brokenImages: string[] = []

    // 検証ロジック...

    // ❌ Page Object内でレポート添付（責務違反）
    if (brokenImages.length > 0) {
      await testInfo.attach('broken-images.json', {
        body: JSON.stringify({ brokenImages }, null, 2),
        contentType: 'application/json'
      })
      throw new Error('Broken images found')
    }
  }
}
```

### ✅ Good: Page Objectはデータ取得のみ

```typescript
// Page Objectはデータ取得のみ
export class ArticlePage extends BasePage {
  /**
   * 壊れた画像のリストを取得
   *
   * @returns 無効な画像情報の配列
   */
  async getBrokenImages(): Promise<Array<{ index: number; src: string; alt: string }>> {
    const images = this.page.locator('img')
    const count = await images.count()
    const brokenImages: Array<{ index: number; src: string; alt: string }> = []

    for (let i = 0; i < count; i++) {
      const img = images.nth(i)
      const src = await img.getAttribute('src')
      const alt = await img.getAttribute('alt') || '(no alt)'

      // 検証ロジック...
      if (/* 壊れている条件 */) {
        brokenImages.push({ index: i, src: src || '', alt })
      }
    }

    return brokenImages  // ✅ データのみを返す
  }
}

// テストファイル側でレポート添付
test('画像検証', async ({ page }, testInfo) => {
  const articlePage = new ArticlePage(page)
  await articlePage.navigate()

  // Page Objectからデータを取得
  const brokenImages = await articlePage.getBrokenImages()

  // ✅ テスト側でレポート添付の責務を持つ
  if (brokenImages.length > 0) {
    console.error(`❌ ${brokenImages.length} broken images found`)

    await testInfo.attach('broken-images.json', {
      body: JSON.stringify({
        totalBrokenImages: brokenImages.length,
        details: brokenImages,
        timestamp: new Date().toISOString()
      }, null, 2),
      contentType: 'application/json'
    })
  }

  expect(brokenImages).toHaveLength(0)
})
```

### ✅ Good: Fixtures内でtestInfo.attachを使用（共通処理の場合）

```typescript
import { test as base, TestInfo } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // エラー時の自動スクリーンショット添付
    page.on('pageerror', async (error) => {
      console.error('Page error:', error.message)
      await testInfo.attach('page-error-screenshot.png', {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png'
      })
    })

    await use(page)
  }
})
```

---

## 12. PC/SP共通化パターン

### viewport検出パターン

### ✅ Good: viewport検出でPC/SP共通化

```typescript
export class PointHistoryPage extends BasePage {
  async verifyTodayActionHistory(expectedDate: string): Promise<void> {
    const table = this.page.getByRole('table').first()
    await table.waitFor({ state: 'visible', timeout: 10000 })

    // viewport検出でPC/SP分岐
    const viewportSize = this.page.viewportSize()
    const isSP = viewportSize ? viewportSize.width <= 768 : false

    if (isSP) {
      // SP版の構造: getByRole('row')を使用
      const rows = table.getByRole('row')
      // ...SP版の処理
    } else {
      // PC版の構造: tbody tr を使用
      const rows = table.locator('tbody tr')
      // ...PC版の処理
    }
  }
}
```

### ベースクラス継承パターン

HTML構造が一部異なる場合、ベースクラス継承で共通化：

```typescript
// BaseLoginPage.ts
export abstract class BaseLoginPage extends BasePage {
  abstract performLogin(username: string, password: string): Promise<void>

  // 共通メソッド
  protected async fillCredentials(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username)
    await this.passwordField.fill(password)
  }
}

// PCLoginPage.ts
export class PCLoginPage extends BaseLoginPage {
  async performLogin(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password)
    // PC固有の処理
  }
}

// SPLoginPage.ts
export class SPLoginPage extends BaseLoginPage {
  async performLogin(username: string, password: string): Promise<void> {
    await this.fillCredentials(username, password)
    // SP固有の処理
  }
}
```

---

---

## 13. ファイル形式とクリーンアップ

すべてのソースファイルは、以下のファイル形式ルールに従う必要があります。

### 基本ルール

1. **末尾に必ず1つの空行（改行）を入れる（POSIX準拠）**
2. **改行コードはLF（Line Feed: `\n`）**
3. **文字コードはUTF-8**

### ファイル末尾の改行

**重要**: すべてのファイルの末尾には1行の空行を入れることが推奨されます。

### ❌ Bad: ファイル末尾に改行なし

```typescript
export class LoginPage extends BasePage {
  readonly loginButton: Locator

  constructor(page: Page) {
    super(page)
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }
}
// ❌ ファイルがここで終わる（改行なし）
```

### ✅ Good: ファイル末尾に1行空行

```typescript
export class LoginPage extends BasePage {
  readonly loginButton: Locator

  constructor(page: Page) {
    super(page)
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }
}
// ✅ ファイル末尾に1行空行がある

```

**理由**:
- **POSIX標準に準拠**: Unix系OSの標準規格
- **Git diffが正しく動作**: 末尾改行がないと警告が出る
- **一部のエディタ・ツールで警告が出ない**: VSCode、ESLint等
- **チーム開発での一貫性確保**: コードレビュー時の無駄な差分を防ぐ

### 改行コード

**原則**: すべてのファイルで**LF（`\n`）**を使用してください。

### ❌ Bad: CRLFまたは混在

```
Windows形式のCRLF（`\r\n`）  // ❌ 避ける
LFとCRLFの混在            // ❌ 絶対に避ける
```

### ✅ Good: LFで統一

```
Unix/Linux/macOS形式のLF（`\n`）  // ✅ 推奨
```

**理由**:
- **Git設定との整合性**: `.gitattributes` で `* text=auto eol=lf` を設定
- **CI/CD環境との互換性**: Linux環境で実行されることが多い
- **クロスプラットフォーム対応**: 全OS で動作する

**.gitattributes 設定例**:
```
# すべてのテキストファイルをLFに統一
* text=auto eol=lf

# TypeScript/JavaScript
*.ts text eol=lf
*.js text eol=lf
*.json text eol=lf

# Markdown
*.md text eol=lf
```

### 文字コード

**原則**: すべてのファイルで**UTF-8（BOMなし）**を使用してください。

### ✅ Good: UTF-8（BOMなし）

- 日本語コメントを含むすべてのファイルでUTF-8を使用
- BOM（Byte Order Mark）は不要

**理由**:
- **多言語対応**: 日本語、絵文字などを含むコメントに対応
- **標準的**: Node.js、TypeScript、Playwrightのデフォルト
- **BOMなし**: 一部のツールでBOM付きUTF-8が問題を引き起こす

### 確認方法

#### ファイル末尾に改行がないファイルを検出

```bash
# 末尾に改行がないファイルを検出
find . -name "*.ts" -exec sh -c 'test "$(tail -c 1 "{}")" && echo "No newline: {}"' \;

# 末尾に改行がないファイルを一括修正（追加）
find . -name "*.ts" -exec sh -c 'test "$(tail -c 1 "{}")" && echo "" >> "{}"' \;
```

#### 改行コードを確認

```bash
# CRLFを含むファイルを検出
find . -name "*.ts" -exec file {} \; | grep CRLF

# CRLFをLFに一括変換（dos2unix使用）
find . -name "*.ts" -exec dos2unix {} \;
```

#### 文字コードを確認

```bash
# 文字コードを確認
file -b --mime-encoding *.ts

# UTF-8以外のファイルを検出
find . -name "*.ts" -exec sh -c 'test "$(file -b --mime-encoding "{}")" != "utf-8" && echo "{}"' \;
```

### エディタ設定

**VSCode（.vscode/settings.json）**:
```json
{
  "files.eol": "\n",
  "files.encoding": "utf8",
  "files.insertFinalNewline": true,
  "files.trimTrailingWhitespace": true
}
```

**EditorConfig（.editorconfig）**:
```
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{ts,js,json,md}]
indent_style = space
indent_size = 2
```

### レビュー時のチェックポイント

- [ ] すべてのファイル末尾に1行の空行があるか
- [ ] 改行コードがLFで統一されているか
- [ ] 文字コードがUTF-8（BOMなし）か
- [ ] `.gitattributes` で改行コードの自動変換が設定されているか
- [ ] `.editorconfig` または `.vscode/settings.json` でエディタ設定が統一されているか

---

## 参考リンク

- [Playwright公式ドキュメント](https://playwright.dev/docs/intro)
- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [POSIX標準](https://pubs.opengroup.org/onlinepubs/9699919799/)

---

---

## 14. mabl移行固有パターン

このセクションは、mablテストからPlaywrightへの移行に特化した内容です。

### mablテストファイルの読み取りと分析

mablからエクスポートされたテストファイルは主に以下の形式：

1. **JSONファイル** (`mabl-export-*.json`)
2. **TypeScriptファイル** (`.spec.ts`)

### ❌ Bad: mablテストをそのまま実行

```typescript
// mablエクスポートファイルをそのまま実行
// ❌ XPathが多用され、保守性が低い
await page.locator('//button[@id="login-button"]').click()
await page.locator('//input[@name="username"]').fill('user')
```

### ✅ Good: Page Object Modelに変換

```typescript
// ✅ Page Objectに分解
export class LoginPage extends BasePage {
  readonly usernameField: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    super(page)
    // ✅ 役割ベースセレクタに変換
    this.usernameField = page.getByLabel('ユーザー名')
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }

  async performLogin(username: string, password: string): Promise<void> {
    await this.usernameField.fill(username)
    await this.loginButton.click()
  }
}
```

### mablセレクタのPlaywrightへの変換パターン

mablは主にXPathを使用しますが、Playwrightでは役割ベースセレクタを推奨します。

#### パターン1: ボタン

```typescript
// ❌ mabl (XPath)
'//button[@id="submit-button"]'
'//button[contains(text(), "送信")]'

// ✅ Playwright (役割ベース)
page.getByRole('button', { name: '送信' })
page.getByRole('button', { name: /送信|Submit/i })
```

#### パターン2: 入力フィールド

```typescript
// ❌ mabl (XPath)
'//input[@name="email"]'
'//input[@placeholder="メールアドレスを入力"]'

// ✅ Playwright (役割ベース)
page.getByLabel('メールアドレス')
page.getByPlaceholder('メールアドレスを入力')
```

#### パターン3: リンク

```typescript
// ❌ mabl (XPath)
'//a[contains(text(), "ホーム")]'
'//a[@href="/home"]'

// ✅ Playwright (役割ベース)
page.getByRole('link', { name: 'ホーム' })
page.getByRole('link', { name: /ホーム|Home/i })
```

#### パターン4: テキスト検証

```typescript
// ❌ mabl (XPath)
'//div[contains(text(), "ログイン成功")]'

// ✅ Playwright (役割ベース)
page.getByText('ログイン成功')
page.getByText(/ログイン成功|Login Successful/i)
```

### XPath例外許容のケース

以下のケースではXPathの使用を許容します：

1. **複雑なDOM構造**: 役割ベースセレクタで特定困難
2. **動的要素**: ID・クラスが動的に生成される
3. **移行期間**: 段階的な移行で暫定的にXPath使用

```typescript
// ✅ Good: 複雑な構造でXPath使用（コメントで理由を明記）
export class ComplexPage extends BasePage {
  // 役割ベースセレクタでは特定困難なため、XPathを使用
  readonly complexElement: Locator

  constructor(page: Page) {
    super(page)
    // TODO: HTML構造改善後、役割ベースセレクタに変更
    this.complexElement = page.locator('//div[@class="container"]/div[2]/span[@data-value="target"]')
  }
}
```

### mablの操作コマンド → Playwrightへのマッピング

| mabl操作 | Playwright実装 | 備考 |
|---------|---------------|------|
| `click` | `await element.click()` | 基本的なクリック |
| `type` | `await element.fill(text)` | テキスト入力 |
| `select` | `await element.selectOption(value)` | ドロップダウン選択 |
| `wait` | `await element.waitFor({ state: 'visible' })` | 要素の待機 |
| `assertText` | `await expect(element).toHaveText(text)` | テキスト検証 |
| `assertVisible` | `await expect(element).toBeVisible()` | 表示検証 |
| `navigate` | `await page.goto(url)` | ページ遷移 |

### mablテストの段階的移行アプローチ

#### Step 1: mablテストをそのまま動かす（簡易修正）

```typescript
// mablエクスポートファイルを最小限修正して動作確認
test('mabl-test-minimal-fix', async ({ page }) => {
  await page.goto('https://example.com')

  // ❌ XPathのまま（暫定）
  await page.locator('//input[@name="username"]').fill('user')
  await page.locator('//button[@id="login"]').click()

  // 動作確認のみ実施
})
```

#### Step 2: Page Objectに分解（POM化）

```typescript
// Page Objectクラスを作成
export class LoginPage extends BasePage {
  readonly usernameField: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    super(page)
    // まだXPathのまま（段階的移行）
    this.usernameField = page.locator('//input[@name="username"]')
    this.loginButton = page.locator('//button[@id="login"]')
  }

  async performLogin(username: string): Promise<void> {
    await this.usernameField.fill(username)
    await this.loginButton.click()
  }
}
```

#### Step 3: 役割ベースセレクタに置換（推奨）

```typescript
// ✅ 最終形: 役割ベースセレクタ + POM
export class LoginPage extends BasePage {
  readonly usernameField: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    super(page)
    // ✅ 役割ベースセレクタに変換
    this.usernameField = page.getByLabel('ユーザー名')
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }

  async performLogin(username: string): Promise<void> {
    await this.usernameField.fill(username)
    await this.loginButton.click()
  }
}
```

### mabl移行時の注意事項

1. **段階的移行を推奨**
   - Step 1: 動作確認（XPathのまま）
   - Step 2: POM化（XPathのまま）
   - Step 3: 役割ベースセレクタ化

2. **HTML構造の事前取得**
   - Playwright MCPで対象ページのHTML取得
   - 役割ベースセレクタへの変換可能性を事前確認

3. **テスト実行での検証**
   - 各Stepで必ずテスト実行して動作確認
   - エラー発生時は自律的デバッグ

4. **ドキュメント化**
   - README.mdにテスト仕様を明記
   - 移行前後の対応表を作成

---

## 15. 環境管理と認証のベストプラクティス（正解例）

このセクションでは、環境管理と認証に関する**推奨実装パターン**を具体的なコード例で示します。

### A. 環境変数とURL管理（Config/Test共通）

#### ❌ Bad: デフォルト値依存

```typescript
// ❌ Bad: デフォルト値に依存（意図しない環境への接続リスク）
const targetEnv = process.env.TARGET_ENV || 'qa1'  // 危険
```

**問題点**:
- TARGET_ENVが未設定でもエラーにならない
- 意図しない環境（デフォルトのqa1）に接続される可能性
- CI/CD環境での設定ミスに気づきにくい

#### ✅ Good: 明示的検証

```typescript
// ✅ Good: TARGET_ENVの明示的検証
const targetEnv = process.env.TARGET_ENV

if (!targetEnv) {
  throw new Error(
    '❌ TARGET_ENV環境変数が設定されていません。\n' +
    '実行時に TARGET_ENV=qa1 等を指定してください。\n' +
    '有効な環境: qa1, qa2, production'
  )
}

// 環境別設定オブジェクトの検証
const envConfig = {
  qa1: { baseURL: 'https://qa1.example.com', proxy: { server: 'http://proxy.qa1:8080' } },
  qa2: { baseURL: 'https://qa2.example.com', proxy: { server: 'http://proxy.qa2:8080' } },
  production: { baseURL: 'https://example.com', proxy: undefined },
}

if (!envConfig[targetEnv]) {
  throw new Error(
    `❌ 不正な環境指定: ${targetEnv}\n` +
    `有効な環境: ${Object.keys(envConfig).join(', ')}`
  )
}

const config = envConfig[targetEnv]
```

**理由**:
- 設定ミスを即座に検出
- 明確なエラーメッセージで対処方法を提示
- 意図しない環境への接続を防止

---

#### ❌ Bad: 絶対URL使用

```typescript
// ❌ Bad: テストコード内で絶対URLを使用
await page.goto('https://qa1.example.com/dashboard')
```

**問題点**:
- 環境切り替え時にテストコードを修正する必要がある
- 環境別のURL管理が煩雑
- baseURL設定が無意味になる

#### ✅ Good: 相対パス + baseURL

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: config.baseURL,  // 環境別に自動切り替え
  },
})

// テストコード内では相対パスのみ
await page.goto('/dashboard')  // ✅ baseURLと組み合わせて完全なURLが構築される
```

**理由**:
- テストコードは環境に依存しない
- 環境切り替えは TARGET_ENV のみで完結
- DRY原則に準拠

---

### B. 認証情報の取得

#### ❌ Bad: 環境変数直接参照

```typescript
// ❌ Bad: 環境変数から直接取得
import * as dotenv from 'dotenv'
dotenv.config()

await loginPage.performLogin({
  username: process.env.USERNAME || '',
  password: process.env.PASSWORD || ''
})
```

**問題点**:
- CI/CD環境で環境変数設定が必要（手間増加）
- アカウント情報の変更履歴が追跡できない
- チーム内での情報共有が困難
- デフォルト値（空文字列）では認証失敗

#### ✅ Good: Git管理ファイルから取得

```typescript
// testcase/data/test-accounts.ts（Git管理）
/**
 * QA環境専用テストアカウント
 *
 * ⚠️ 重要: 本番アカウント情報は絶対にこのファイルに含めないこと
 */
export const TEST_ACCOUNTS = {
  pc: {
    username: 'qa_user_pc@example.com',
    password: 'QaTestPassword123'
  },
  sp: {
    username: 'qa_user_sp@example.com',
    password: 'QaTestPassword456'
  }
} as const
```

```typescript
// testcase/auth.setup.ts
import { TEST_ACCOUNTS } from './data/test-accounts'

// ✅ Good: Git管理ファイルから取得
await loginPage.performLogin({
  username: TEST_ACCOUNTS.pc.username,
  password: TEST_ACCOUNTS.pc.password
})
```

**理由**:
- バージョン管理: アカウント情報の変更履歴を追跡可能
- チーム共有: 全メンバーが同じQA用アカウントを使用
- CI/CD統合: 環境変数設定の手間を削減
- セキュリティ: 本番アカウントとの明確な分離（QA専用のみGit管理）

---

### C. プロキシ設定の動的参照

#### ❌ Bad: プロキシ直書き

```typescript
// ❌ Bad: playwright.config.ts内でプロキシを直書き
export default defineConfig({
  use: {
    proxy: {
      server: 'http://mrqa1.office.example.com:8889',  // ❌ 固定値
    },
  },
})
```

**問題点**:
- 環境切り替え時に設定ファイルを修正する必要がある
- 本番環境ではプロキシ不要なのに設定が残る

#### ✅ Good: 環境別設定から動的参照

```typescript
// ✅ Good: playwright.config.ts
const envConfig = {
  qa1: {
    baseURL: 'https://qa1.example.com',
    proxy: { server: 'http://mrqa1.office.example.com:8889' },  // QA1はProxy必要
  },
  qa2: {
    baseURL: 'https://qa2.example.com',
    proxy: { server: 'http://mrqa2.office.example.com:8889' },  // QA2はProxy必要
  },
  production: {
    baseURL: 'https://example.com',
    proxy: undefined,  // 本番環境はProxy不要
  },
}

const targetEnv = process.env.TARGET_ENV

if (!targetEnv) {
  throw new Error('TARGET_ENV環境変数が設定されていません')
}

const config = envConfig[targetEnv]

export default defineConfig({
  use: {
    baseURL: config.baseURL,
    proxy: config.proxy,  // ✅ 環境別に動的に切り替わる
  },
})
```

**理由**:
- 環境切り替えが自動化
- 不要な設定が残らない
- 環境別の設定が一元管理される

---

### D. 完全な実装例（playwright.config.ts）

```typescript
import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

// 環境別設定の定義
const envConfig: Record<string, {
  baseURL: string
  proxy?: { server: string }
  timeout: number
}> = {
  qa1: {
    baseURL: 'https://community-qa1.m3.com',
    proxy: { server: 'http://mrqa1.office.so-netm3.com:8889' },
    timeout: 360_000,
  },
  qa2: {
    baseURL: 'https://community-qa2.m3.com',
    proxy: { server: 'http://mrqa2.office.so-netm3.com:8889' },
    timeout: 360_000,
  },
  production: {
    baseURL: 'https://community.m3.com',
    proxy: undefined,
    timeout: 600_000,
  },
}

// TARGET_ENVの明示的検証
const targetEnv = process.env.TARGET_ENV

if (!targetEnv) {
  throw new Error(
    '❌ TARGET_ENV環境変数が設定されていません。\n' +
    '以下のいずれかを指定してください: qa1, qa2, production\n' +
    '実行例: TARGET_ENV=qa1 npx playwright test'
  )
}

if (!envConfig[targetEnv]) {
  throw new Error(
    `❌ 不正な環境指定: ${targetEnv}\n` +
    `有効な環境: ${Object.keys(envConfig).join(', ')}`
  )
}

const config = envConfig[targetEnv]

export default defineConfig({
  timeout: config.timeout,
  expect: {
    timeout: 15000,
  },
  retries: 0,
  testDir: './testcase',
  outputDir: 'test-results',
  testMatch: '**/*.spec.ts',
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: require.resolve('./testcase/auth.setup.ts'),

  use: {
    baseURL: config.baseURL,  // ✅ 環境別に自動切り替え
    headless: false,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    storageState: path.join(__dirname, 'testcase/.auth/user.json'),
    proxy: config.proxy,  // ✅ 環境別に自動切り替え（本番環境はundefined）
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
```

---

### E. 完全な実装例（auth.setup.ts）

```typescript
import { chromium, FullConfig } from '@playwright/test'
import { M3LoginPage } from '../shared-e2e-components/auth/m3LoginPage'
import { HeaderComponent } from '../shared-e2e-components/common/headerComponent'
import { TEST_ACCOUNTS } from './data/test-accounts'  // ✅ Git管理ファイルから取得
import * as path from 'path'

async function globalSetup(config: FullConfig) {
  const authFile = path.join(__dirname, '.auth/user.json')

  console.log('🔐 認証グローバルセットアップを開始します...')

  // ✅ Good: baseURLを使用して環境に依存しない
  const baseURL = config.use?.baseURL

  if (!baseURL) {
    throw new Error('❌ playwright.config.ts に baseURL が設定されていません')
  }

  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    baseURL,  // ✅ 環境別のbaseURLを使用
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    proxy: config.use?.proxy,  // ✅ 環境別のProxy設定を使用
  })
  const page = await context.newPage()

  try {
    const loginPage = new M3LoginPage(page)

    // ✅ Good: Git管理ファイルから認証情報を取得
    await loginPage.performLogin({
      username: TEST_ACCOUNTS.pc.username,
      password: TEST_ACCOUNTS.pc.password
    })

    console.log('✅ M3.comログインが完了しました')

    // ログイン成功確認
    const header = new HeaderComponent(page)
    const isLoggedIn = await header.isLoggedIn()

    if (!isLoggedIn) {
      throw new Error('❌ ログイン確認に失敗しました')
    }

    const username = await header.getUserName()
    console.log(`✅ ログイン状態確認完了: ${username}`)

    // 認証状態をファイルに保存
    await context.storageState({ path: authFile })
    console.log(`✅ 認証状態を保存しました: ${authFile}`)

  } catch (error) {
    console.error('❌ 認証セットアップに失敗しました:', error)

    // エラー時のスクリーンショット保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotPath = `test-results/auth-setup-failure-${timestamp}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.error(`📸 エラースクリーンショットを保存しました: ${screenshotPath}`)

    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup
```

---

### F. CI/CD統合（.gitlab-ci.yml）

```yaml
# .gitlab-ci.yml
test:qa1:
  stage: test
  variables:
    TARGET_ENV: "qa1"  # ✅ 明示的に環境を指定
  script:
    - npm ci
    - npx playwright install chromium
    - npx playwright test
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/

test:qa2:
  stage: test
  variables:
    TARGET_ENV: "qa2"  # ✅ 明示的に環境を指定
  script:
    - npm ci
    - npx playwright install chromium
    - npx playwright test
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/

test:production:
  stage: test
  variables:
    TARGET_ENV: "production"  # ✅ 明示的に環境を指定
  script:
    - npm ci
    - npx playwright install chromium
    - npx playwright test
  only:
    - main  # 本番環境テストはmainブランチのみ
  artifacts:
    when: always
    paths:
      - test-results/
      - playwright-report/
```

---

### G. まとめ: 4つの必須ルール

1. **URLの完全相対化**
   - ✅ `page.goto('/login')`
   - ❌ `page.goto('https://qa1.example.com/login')`

2. **デフォルト値依存の禁止**
   - ✅ `if (!targetEnv) throw new Error(...)`
   - ❌ `const env = process.env.TARGET_ENV || 'qa1'`

3. **認証情報の取得元固定**
   - ✅ `import { TEST_ACCOUNTS } from './data/test-accounts'`
   - ❌ `process.env.USERNAME`

4. **プロキシ設定の動的参照**
   - ✅ `proxy: envConfig[targetEnv].proxy`
   - ❌ `proxy: { server: 'http://proxy.qa1:8080' }`

---

## 参考リンク

- [Playwright公式ドキュメント](https://playwright.dev/docs/intro)
- [Playwright Locators](https://playwright.dev/docs/locators)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page Object Model](https://playwright.dev/docs/pom)
- [POSIX標準](https://pubs.opengroup.org/onlinepubs/9699919799/)
- [mabl公式ドキュメント](https://help.mabl.com/)

---

**更新履歴**:
- 2026-01-23: 初版作成
- 2026-01-23: Section 8（認証管理）をGit管理ファイル優先に変更
- 2026-01-23: Section 9にTARGET_ENV明示的検証を追加
- 2026-01-23: Section 13（ファイル形式とクリーンアップ）を新設
- 2026-01-23: Section 14（mabl移行固有パターン）を新設
- 2026-01-23: Section 15（環境管理と認証のベストプラクティス）を新設


