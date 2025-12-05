# コードレビュー観点チェックリスト

このファイルは、CLAUDE.mdのコーディング規約に基づいた**レビュー観点の定義**です。
複数のレビューコマンド・ツールで共通して使用します。

---

## ✅ チェック項目（CLAUDE.md準拠）

### 1. **明示的なタイムアウトの非推奨**

**チェック内容**:
- [ ] `page.waitForTimeout()`を使用していない
- [ ] 固定時間待機ではなく、条件ベース待機（`expect().toBeVisible({ timeout })`等）を使用

**理由**:
- 固定時間待機は非効率（要素が早く表示されても無駄に待つ）
- テスト実行時間が増加
- Playwright公式でもアンチパターンとして記載

---

### 2. **日本語コメント・JSDoc**

**チェック内容**:
- [ ] クラス・メソッドにJSDocコメントがある
- [ ] JSDocは日本語で記述されている
- [ ] 機能説明・実装理由・注意事項が記載されている

**例**:
```typescript
// ❌ 悪い例
class LoginPage {
  async login() { }
}

// ✅ 良い例
/**
 * ログインページのPage Objectクラス
 *
 * @description
 * - M3.com共通認証フローを実装
 * - storageState保存による認証状態の再利用に対応
 */
class LoginPage {
  /**
   * ログイン処理を実行
   * @param username ユーザー名
   * @param password パスワード
   */
  async login(username: string, password: string) { }
}
```

**準拠率の計算**:
```
準拠率 = (JSDocがあるメソッド数 / 全メソッド数) × 100
```

---

### 3. **役割ベースセレクタの使用**（Playwright関連）

**チェック内容**:
- [ ] `page.locator()`よりも`getByRole()`、`getByLabel()`等を優先
- [ ] CSSセレクタは最後の手段
- [ ] data-testidはセマンティックセレクタが使えない場合のみ
- [ ] **div/span等の汎用タグではなく、セマンティックな役割を指定**

**理由**:
- 役割ベースセレクタはHTML構造変更に強い
- アクセシビリティ向上にも貢献
- CSSクラス名変更の影響を受けない

**優先順位**: `getByRole > getByLabel > getByPlaceholder > getByText > data-testid > CSSセレクタ`

---

### 4. **Page Object Modelパターン**

**チェック内容**:
- [ ] Page Objectクラスは`BasePage`を継承
- [ ] **Locatorはコンストラクタで`readonly`一括初期化（getterは非推奨）**
- [ ] Page Object内でexpectによるアサーションは行わない
- [ ] URL遷移前にURLの事前確認を実行

**理由（コンストラクタ初期化）**:
- パフォーマンス向上（getterは呼び出しごとに実行、readonly初期化は1回のみ）
- 型安全性（readonlyにより誤った再代入を防止）
- Playwright公式推奨のベストプラクティス
- デバッグ容易性（初期化時点でセレクタエラーを検出可能）

**例**:
```typescript
// ❌ 悪い例（getter使用）
class LoginPage {
  get loginButton() {
    return this.page.getByRole('button', { name: 'ログイン' })
  }
}

// ✅ 良い例（readonly初期化）
class LoginPage extends BasePage {
  readonly loginButton: Locator

  constructor(page: Page) {
    super(page)
    this.loginButton = page.getByRole('button', { name: 'ログイン' })
  }
}
```

**準拠率の計算**:
```
準拠率 = (準拠しているPage Objectクラス数 / 全Page Objectクラス数) × 100
```

---

### 5. **TypeScript型定義**

**チェック内容**:
- [ ] 引数・戻り値の型が明示されている
- [ ] `any`型は使用していない
- [ ] インターフェース・型定義が適切

**例**:
```typescript
// ❌ 悪い例
async function login(user, pass) { }
function getData(): any { }

// ✅ 良い例
async function login(username: string, password: string): Promise<void> { }
function getData(): UserData { }
```

**準拠率の計算**:
```
準拠率 = (型定義が適切な関数数 / 全関数数) × 100
```

---

### 6. **エラーハンドリング**

**チェック内容**:
- [ ] try-catchで適切にエラーを捕捉
- [ ] エラー時のログ出力がある
- [ ] スクリーンショット保存などのデバッグ情報を提供

**例**:
```typescript
// ❌ 悪い例
await expect(element).toBeVisible()

// ✅ 良い例
try {
  await expect(element).toBeVisible()
  console.log('✅ 要素が表示されています')
} catch (error) {
  console.error('❌ 要素の表示に失敗しました')
  await page.screenshot({ path: 'error.png' })
  throw error
}
```

**準拠率の計算**:
```
準拠率 = (適切なエラーハンドリングがある箇所 / エラーが発生しうる箇所) × 100
```

---

### 7. **セキュリティチェック**

**チェック内容**:
- [ ] XSS対策（入力値のエスケープ）
- [ ] SQL Injection対策（プレースホルダ使用）
- [ ] 認証情報のハードコード禁止（環境変数使用）
- [ ] 秘密情報のログ出力禁止

**例**:
```typescript
// ❌ 悪い例
const password = 'my-password-123'
console.log(`Password: ${password}`)

// ✅ 良い例
const password = process.env.PASSWORD || ''
console.log('✅ パスワードを環境変数から取得しました')
```

**準拠率の計算**:
```
準拠率 = (セキュリティリスクがない箇所 / 全セキュリティ関連箇所) × 100
```

---

### 8. **アクセシビリティ対応**（HTML関連）

**チェック内容**:
- [ ] すべての`<img>`にalt属性がある
- [ ] 機能的な画像に適切なalt属性
- [ ] 装飾画像には`alt=""`
- [ ] ボタンにアクセシブルな名前（aria-label等）
- [ ] フォーム入力にラベル関連付け

**例**:
```html
<!-- ❌ 悪い例 -->
<img src="banner.png">
<button><img src="search.svg"></button>
<input type="text" placeholder="検索">

<!-- ✅ 良い例 -->
<img src="banner.png" alt="新刊30%オフセール">
<button aria-label="検索">
  <img src="search.svg" alt="">
</button>
<label for="search">検索</label>
<input id="search" type="text" placeholder="検索">
```

**準拠率の計算**:
```
準拠率 = (アクセシビリティ対応済み要素数 / 全対象要素数) × 100
```

---

### 9. **リファクタリング原則**

**チェック内容**:
- [ ] 新機能追加はしていない（既存テストの変換のみ）
- [ ] 元のテストの動作を忠実に再現
- [ ] 過度なリファクタリングを避ける
- [ ] 既存のテストケースを削除していない

**例**:
```typescript
// ❌ 悪い例（新機能追加）
// 元のテスト: ログイン確認のみ
test('ログイン確認', async () => {
  await loginPage.login(user, pass)
  await expect(page).toHaveURL(/dashboard/)
  // ↓ 新機能追加（元のテストにない）
  await dashboardPage.checkNotifications()
})

// ✅ 良い例（忠実な再現）
test('ログイン確認', async () => {
  await loginPage.login(user, pass)
  await expect(page).toHaveURL(/dashboard/)
})
```

**準拠率の計算**:
```
準拠率 = 元のテストと同じ動作をするテスト数 / 全テスト数 × 100
```

---

### 10. **認証にstorageStateの使用**

**チェック内容**:
- [ ] 各テストで毎回ログインせず、globalSetupでstorageStateを保存
- [ ] playwright.config.tsで`storageState`を設定
- [ ] テストファイルでは認証済みの状態を前提とした実装

**理由**:
- テスト実行時間の大幅短縮（48%短縮の実績）
- ログイン回数の削減（75%削減の実績）
- 認証サーバーへの負荷軽減
- テスト安定性の向上（ログイン失敗によるテスト失敗を最小化）

---

### 11. **命名規則**

**チェック内容**:
- [ ] テストファイル: `*.spec.ts`
- [ ] Page Object: `{ページ名}Page.ts` (PascalCase)
- [ ] ファイル名: camelCase
- [ ] クラス名: PascalCase
- [ ] メソッド名: camelCase
- [ ] **CA関連の関数名にdisplaysite値を含める** (例: `verifyTopAdArea_PcMmedia01_IsVisible()`)
- [ ] **console.logにもdisplaysite値を含める** (例: `displaysite=pc_mmedia_01`)

**理由（CA関連）**:
- CA要素は複数存在するため、どの広告枠かを明確にする必要がある
- デバッグ時にログから特定の広告枠を識別可能
- テスト失敗時に問題箇所を即座に特定できる

---

### 12. **URL遷移時はDOM契機（domcontentloaded）推奨**

**チェック内容**:
- [ ] `page.goto()`や`page.click()`でURL遷移時は`waitUntil: 'domcontentloaded'`を指定
- [ ] `networkidle`や`load`は使用していない

**理由**:
- `networkidle`や`load`は別サービスのエラーや読み込みに引っ張られてタイムアウトする
- DOM契機（`domcontentloaded`）は複合ページ構造に強い
- 必要に応じて特定要素の出現待機を追加すればよい

---

### 13. **Page Object内でのアサーション禁止**

**チェック内容**:
- [ ] Page Object内で`expect()`によるアサーションを行わない
- [ ] Page Objectは操作メソッドのみ提供
- [ ] アサーションはテストファイル側で実行

**理由**:
- Page Objectの責務は操作のみ、検証はテストの責務
- 単一責任の原則に準拠
- 再利用性と保守性の向上

---

### 14. **テストコードの分岐最小化**

**チェック内容**:
- [ ] テストコード内で`if`や`switch`による分岐を使用していない
- [ ] PC/SP画面判定分岐は例外として許容
- [ ] 大きく異なる場合はPC/SP別Page Objectを作成

**理由**:
- テストの可読性向上（読んだ通りの流れで実行される）
- 分岐による複雑性の排除
- AAA構造（Arrange/Action/Assert）の維持

---

### 15. **expect専用メソッドの優先使用**

**チェック内容**:
- [ ] `await expect(page).toHaveURL()`など専用メソッドを使用
- [ ] `expect(page.url()).toContain()`など汎用的な比較は使用しない

**理由**:
- Playwright専用メソッドは自動待機機能を持つ
- より安定したアサーション
- 可読性の向上

---

### 16. **目的志向のメソッド命名**

**チェック内容**:
- [ ] メソッド名は操作ではなく目的を表現（例: `forwardToLoginPage()`）
- [ ] 操作ベースの命名は避ける（例: `clickLoginButton()`）

**理由**:
- ビジネスロジックが明確になる
- 実装変更（クリック→別の操作）に強い
- テストコードの可読性向上

---

### 17. **AAA構造の遵守**

**チェック内容**:
- [ ] Arrange（準備）/ Action（実行）/ Assert（検証）の構造
- [ ] ユーザー視点の振る舞いをテスト

**理由**:
- テストの意図が明確になる
- 可読性・保守性の向上
- 標準的なテスト構造パターン

---

### 18. **Helper使用の非推奨**

**チェック内容**:
- [ ] 新規Helperクラスの作成を避ける
- [ ] 必要な処理はPage Objectに実装

**理由**:
- Helperクラスは将来的に廃止予定
- Page Objectパターンへの統一
- 保守性の向上

---

## 📊 総合評価基準

### **評価レベル**

| 総合準拠率 | 評価 | ステータス |
|----------|------|-----------|
| 90-100% | ✅ 準拠 | 承認可能 |
| 70-89% | ⚠️ 部分準拠 | 改善推奨 |
| 0-69% | ❌ 要修正 | 修正必須 |

### **優先度の判定**

| 違反項目 | 優先度 |
|---------|--------|
| セキュリティ | 🔴 高（即座に修正） |
| 型定義・エラーハンドリング | 🟡 中（計画的に修正） |
| 命名規則・JSDoc | 🟢 低（余裕があれば修正） |

---

## 🔍 レビュー時の注意事項

### 1. **コンテキストを理解する**
- コミットメッセージを読む
- 関連するIssue・PRを確認
- 変更の意図を把握

### 2. **建設的なフィードバック**
- 問題点だけでなく、良い点も指摘
- 具体的な修正案を提示
- なぜ修正が必要か理由を説明

### 3. **一貫性を保つ**
- プロジェクト全体で同じ基準を適用
- 既存コードとの整合性を確認

---

## 📝 このファイルの使い方

### **レビューコマンドから参照**

```markdown
<!-- .claude/commands/review-commit.md -->

レビュー観点は以下のファイルを参照してください：
`.claude/guidelines/review-checklist.md`
```

### **CI/CDスクリプトから参照**

```bash
# GitLab CI等で自動レビュー
cat .claude/guidelines/review-checklist.md
```

### **手動レビュー時の参照**

Pull Request作成時にこのチェックリストを確認してください。

---

**更新日**: 2025年12月5日（18項目に拡張）
**準拠基準**: CLAUDE.md v1.0
