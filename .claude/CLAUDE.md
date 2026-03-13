# CLAUDE.md

MablからPlaywrightへのE2Eテストリファクタリング作業のガイダンスです。

## プロジェクトの目的

**Mabl生成PlaywrightテストをPage Object Modelパターンを適用した保守性の高いE2Eテストに変換する**

### 達成されること
- **保守性の向上**: セレクタ変更時の修正箇所が局所化される
- **可読性の向上**: テストの意図が明確になり、レビュー・デバッグが容易になる
- **安定性の向上**: 堅牢なセレクタにより、UIの軽微な変更でテストが壊れにくくなる
- **再利用性の向上**: Page Objectを通じて操作が共通化され、新規テスト作成が効率化される

### 対象サービスの特徴
- **共通認証**: 全サービスで認証システムは共通
- **複合ページ構造**: 一つのページに複数サービスのコンテンツエリアが存在
- **共通レイアウト**: ヘッダ・フッタ・サイドバーは全サービス共通
- **権限管理**: 医療従事者の職種により閲覧可能サービスが変わる

---

## 基本原則

**すべての作業は日本語で行う**
→ コメント・データ・ログ・エラーメッセージを日本語で記述することで、**チーム内での理解共有が促進される**

**既存テストの忠実な再現**
→ 新機能追加ではなく変換が目的。元の動作を保持することで、**リグレッションリスクを最小化する**

**Playwright MCPを使用する**
→ ブラウザ操作・HTML取得・スクリーンショット取得が効率化され、**正確なセレクタ設計が可能になる**

---

## リファクタリングの3ステップ

### STEP 1: 理解する

**目的**: 元のMablテストの動作と対象ページの構造を把握する

#### やること
1. **Mablテストの動作確認**: `npx playwright test testcase/` で元テストが動作することを確認
2. **ページ遷移の特定**: テストが訪問する全ページを洗い出す
3. **HTML構造の取得**: Playwright MCPで各ページのHTML構造を取得し、セレクタ設計に活用
4. **サービス固有仕様の整理**: 収集した情報を`.claude/services/service-[サービス名]-specs.md`に記載

#### 達成されること
- 推測に基づく修正を排除し、**正確なセレクタ設計が可能になる**
- 元テストの動作基準が明確になり、**変換の正しさを検証できる**

⚠️ **元のテストが動作しない場合は、リファクタリングを開始せず、まず元のテストを修正すること**

---

### STEP 2: 変換する

**目的**: Page Object Modelパターンを適用し、保守性の高い構造に変換する

#### フォルダ構造
```
e2e-{service名}/
├── src/
│   └── {domain}/
│       ├── pages/          # Page Object
│       └── utils/          # ユーティリティ
├── tests/
│   ├── data/              # テストデータと型定義
│   └── {service}/         # テストファイル（*.spec.ts）
├── shared-e2e-components/ # 共通基盤
├── playwright.config.ts
└── tsconfig.json
```

#### 命名規則
| 対象 | 規則 | 例 |
|------|------|-----|
| テストファイル | `*.spec.ts` | `login.spec.ts` |
| テストケース | `C[ID]_[説明]` | `C001_ログイン成功` |
| Page Object | `{ページ名}Page.ts` | `LoginPage.ts` |

#### 変換時のルール

**役割ベースセレクタを優先使用する**
→ `getByRole`・`getByLabel`・`getByText`を使うことで、**UIの変更に強い堅牢なテスト**が達成される

```typescript
// セレクタ優先順位（上から優先）
// 1. getByTestId() - 最も安定
// 2. getByRole() / getByLabel() - 役割ベース
// 3. locator('#id') - ID属性
// 4. getByText() - テキスト（変更されやすい）
// 5. CSS/XPath - 最終手段（理由コメント必須）

// ✅ 推奨：役割ベース
page.getByRole('button', { name: 'ログイン' })
page.getByLabel('メールアドレス')

// ❌ 避ける：実装依存
page.locator('#login-btn')
page.locator('.email-input')
```

**Page Objectはコンストラクタでlocatorを初期化する**
→ readonly初期化により、**パフォーマンス向上と型安全性**が達成される

```typescript
export class LoginPage {
  readonly page: Page
  readonly emailInput: Locator
  readonly loginButton: Locator

  constructor(page: Page) {
    this.page = page
    this.emailInput = page.getByLabel('メールアドレス')
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }
}
```

**URL遷移時は`waitUntil: 'domcontentloaded'`を指定する**
→ `networkidle`や`load`を避けることで、**外部サービスエラーによるタイムアウトを防止する**

**shared-e2e-componentsを優先的に活用する**
→ 認証処理・ヘッダー・サイドバーを共通化することで、**実装の統一とメンテナンスコスト削減**が達成される

**既存Helperは使用可、新規作成はPage Objectに実装する**
→ Helperを段階的に廃止することで、**責務の明確化と保守性向上**が達成される

**テストデータは`tests/data/`に外部化する**
→ データ変更時の修正箇所が明確になり、**テストコードとデータの責務が分離される**

```typescript
// ❌ テスト内にハードコード
await loginPage.login('test@example.com', 'password123')

// ✅ 外部ファイルから読み込み
import { testUsers } from '@/tests/data/users'
await loginPage.login(testUsers.standard.email, testUsers.standard.password)
```

**固定時間待機（waitForTimeout）は使用しない**
→ 状態ベースの待機を使うことで、**テストの安定性向上と実行時間短縮**が達成される

```typescript
// ❌ 固定時間待機（遅いし不安定）
await page.waitForTimeout(3000)

// ✅ 状態ベース待機
await expect(page.getByRole('heading', { name: 'ダッシュボード' })).toBeVisible()
```

**マジックタイムアウトは使用しない**
→ playwright.config.tsのデフォルト値に任せることで、**一貫性のある待機時間管理**が達成される

```typescript
// ❌ ハードコードされたタイムアウト
await expect(element).toBeVisible({ timeout: 30000 })

// ✅ Configのデフォルト値に任せる
await expect(element).toBeVisible()
```

**test.stepでテストを構造化する**
→ Playwrightレポートで論理的なグループ分けができ、**失敗箇所の特定が容易になる**

```typescript
test('C001_ログイン成功', async ({ page }) => {
  await test.step('ログインページにアクセス', async () => {
    await page.goto('/login')
  })

  await test.step('認証情報を入力してログイン', async () => {
    await loginPage.performLogin(credentials)
  })

  await test.step('ログイン成功を確認', async () => {
    await expect(page).toHaveURL('/dashboard')
  })
})
```

**テストコード内でconsole.logを使用しない**
→ Page Object内で既にログ出力しているため、**重複を避けてレポートを簡潔に保つ**

```typescript
// ❌ テストコード内でログ出力（Page Objectと重複）
console.log('📝 ログイン状態を確認中...')
const isLoggedIn = await header.isLoggedIn()
console.log('✅ 確認完了')

// ✅ test.stepで構造化（ログはPage Object内で出力）
await test.step('ログイン状態の確認', async () => {
  const isLoggedIn = await header.isLoggedIn()
  expect(isLoggedIn).toBe(true)
})
```

**URL直書きを避け、baseURLを活用する**
→ 環境切り替えが容易になり、**設定の一元管理**が達成される

```typescript
// ❌ URL直書き
await page.goto('https://www.m3.com/news')

// ✅ 相対パス（baseURL活用）
await page.goto('/news')
```

**ファイル末尾に1行の空行を入れる**
→ POSIX準拠により、**Git差分の明確化とツール互換性**が達成される

---

### STEP 3: 品質を担保する

**目的**: 変換後のテストが正しく動作し、保守可能な状態であることを確認する

#### やること

1. **テスト実行**: `npx playwright test` で全テストがパスすることを確認
2. **storageStateで認証を再利用**: globalSetupで1回だけ認証し、各テストで再利用
   → **テスト実行時間の短縮**と**認証サーバー負荷の軽減**が達成される
3. **README.md作成**: 元Mablテストと変換後テストの対応表を明記
   → **将来の保守・拡張作業が効率化される**

#### 品質チェックリスト

- [ ] 全テストケースがパスする
- [ ] 元のMablテストと同じ検証内容を網羅している
- [ ] Page Objectが適切に分離されている
- [ ] セレクタが役割ベースになっている
- [ ] test.stepで構造化されている
- [ ] テストコード内にconsole.logがない
- [ ] マジックタイムアウトがない
- [ ] URL直書きがない
- [ ] storageStateで認証が再利用されている
- [ ] ファイル末尾に空行がある
- [ ] README.mdが作成されている

---

## コーディングルール早見表

| ルール | 達成されること |
|--------|---------------|
| getByRole・getByLabel優先 | UIの変更に強い堅牢なテスト |
| コンストラクタでlocator初期化 | パフォーマンス向上と型安全性 |
| test.stepで構造化 | 失敗箇所の特定が容易 |
| テストコード内でconsole.log禁止 | レポートの簡潔化 |
| waitUntil: 'domcontentloaded' | 外部サービスエラーによるタイムアウト防止 |
| waitForTimeout禁止 | テストの安定性向上と実行時間短縮 |
| マジックタイムアウト禁止 | 一貫性のある待機時間管理 |
| URL直書き禁止（baseURL活用） | 環境切り替えの容易化 |
| テストデータを外部化 | データ変更時の修正箇所が明確 |
| shared-e2e-components活用 | 実装の統一とメンテナンスコスト削減 |
| storageState活用 | テスト実行時間短縮・認証サーバー負荷軽減 |
| ファイル末尾に空行 | POSIX準拠・Git差分明確化 |
| 日本語でコメント・JSDoc記述 | チーム内での理解共有促進 |

---

## 作業開始前の確認事項

- [ ] Playwright・dotenv・.envの設定完了
- [ ] 元のMablテストが動作することを確認済み
- [ ] サービス固有仕様を`.claude/services/`に記載済み
- [ ] 作業前にバックアップを取得済み
