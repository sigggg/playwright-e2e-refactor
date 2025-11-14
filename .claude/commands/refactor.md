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
- 訪問ページの特定とHTML取得
- サービス仕様ファイルの作成

### STEP 2: Mablテスト簡易修正
- 段階的アプローチによる修正
- 動作確認と問題点の特定
- 元のMablテストの実行成功を確認

### STEP 3: 本格リファクタリング
- Page Object Modelパターンの適用
  - **Playwright推奨パターン**: コンストラクタでのreadonly Locator初期化
  - **段階的セレクタ戦略**: trySelectors()による役割ベース→data-testid→CSSのフォールバック
- 役割ベースセレクタへの変換
- StorageState認証パターンの実装
  - **globalSetup**: testcase/auth.setup.tsでの1回のみのログイン処理
  - **storageState**: 認証状態の再利用によるパフォーマンス向上
  - **ディレクトリ配置**: testcase/.auth/user.json（Playwright標準）
- テストケースの変換
- README.md作成

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

// ❌ 非推奨：getter使用
export class ExamplePage {
  get submitButton(): Locator {
    return this.page.getByRole('button', { name: '送信' })
  }
}
```

### StorageState認証
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './testcase',
  globalSetup: require.resolve('./testcase/auth.setup.ts'),
  use: {
    storageState: path.join(__dirname, 'testcase/.auth/user.json'),
  },
})
```

**パフォーマンス改善例**: テスト実行時間48%短縮、ログイン回数75%削減
