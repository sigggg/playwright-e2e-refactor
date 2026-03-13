MablからPlaywrightへのE2Eテストリファクタリングエージェントを起動します。

## 使い方

```bash
/refactor <Mablテストファイルパス>
```

例：
```bash
/refactor testcase/test-1.spec.ts
```

## 機能

refactor-agentが以下のステップを自律的に実行します：

### STEP 1: 現状確認・準備
- Mablテストファイルの分析
- サービス情報の収集
- 訪問ページの特定とHTML取得（Playwright MCP使用）
- サービス仕様ファイルの作成（`.claude/services/`配下）

### STEP 2: Mablテスト簡易修正
- 段階的アプローチによる修正
- 動作確認と問題点の特定
- 元のMablテストの実行成功を確認

⚠️ **元のテストが動作しない場合は、リファクタリングを開始せず、まず元のテストを修正すること**

### STEP 3: 本格リファクタリング
- **Page Object Modelパターンの適用**
  - コンストラクタでのreadonly Locator初期化
- **役割ベースセレクタへの変換**
  - getByTestId > getByRole > getByLabel > locator('#id') > getByText
- **test.step構造化**
  - テストを論理的なステップに分割
  - 失敗箇所の特定を容易にする
- **StorageState認証パターンの実装**
  - globalSetup: testcase/auth.setup.tsでの1回のみのログイン処理
  - storageState: 認証状態の再利用
- **テストケースの変換**
  - 命名規則: `C[ID]_[説明]`
  - テストコード内でconsole.log禁止
  - マジックタイムアウト禁止
  - URL直書き禁止（baseURL活用）
- **README.md作成**

## 注意事項

- 各ステップでagentが作業者に確認・質問を行います
- HTML取得が必要な場合、Playwright MCPがあれば自動取得を試みます
- 問題発生時は作業者と協議しながら進めます

## 標準パターン

### Page Object Locator初期化
```typescript
// ✅ 推奨：コンストラクタでreadonly初期化
export class ExamplePage {
  readonly page: Page
  readonly submitButton: Locator

  constructor(page: Page) {
    this.page = page
    this.submitButton = page.getByRole('button', { name: '送信' })
  }
}
```

### test.step構造化
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

### StorageState認証
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './testcase',
  globalSetup: require.resolve('./testcase/auth.setup.ts'),
  use: {
    baseURL: process.env.BASE_URL || 'https://www.m3.com',
    storageState: path.join(__dirname, 'testcase/.auth/user.json'),
  },
})
```

## 品質チェックリスト

- [ ] 全テストケースがパスする
- [ ] Page Objectが適切に分離されている
- [ ] セレクタが役割ベースになっている
- [ ] test.stepで構造化されている
- [ ] テストコード内にconsole.logがない
- [ ] マジックタイムアウトがない
- [ ] URL直書きがない
- [ ] storageStateで認証が再利用されている
- [ ] ファイル末尾に空行がある
- [ ] README.mdが作成されている
