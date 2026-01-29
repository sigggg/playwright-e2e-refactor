import { test, expect } from '@playwright/test'
import { HeaderComponent } from '../shared-e2e-components/common/headerComponent'

/**
 * HeaderComponent動作確認テスト
 *
 * @description
 * - storageStateによる認証状態の再利用
 * - playwright/auth.setup.tsで保存された認証情報を使用
 * - 各テストでログイン処理を実行せず、認証済み状態から開始
 * - test.stepによる構造化でレポートの可読性を向上
 */

test.describe('HeaderComponent動作確認', () => {
  test.beforeEach(async ({ page }) => {
    // storageStateにより既にログイン済みの状態
    // M3.comトップページにアクセス（baseURLが設定されている場合は相対パスを使用）
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('C001_ヘッダーコンポーネントの基本機能確認', async ({ page }) => {
    const header = new HeaderComponent(page)

    await test.step('ヘッダーの表示確認', async () => {
      const isHeaderVisible = await header.isHeaderVisible()
      expect(isHeaderVisible).toBe(true)
    })

    await test.step('ログイン状態の確認', async () => {
      const isLoggedIn = await header.isLoggedIn()
      expect(isLoggedIn).toBe(true)
    })

    await test.step('ユーザー名の取得確認', async () => {
      const username = await header.getUserName()
      expect(username).not.toBe('')
    })

    await test.step('会員ステータスの取得', async () => {
      // 会員ステータスは取得できない場合があるため、エラーにしない
      await header.getMemberStatus()
    })

    await test.step('ポイント数の取得確認', async () => {
      const points = await header.getPointValue()
      expect(points).toBeGreaterThanOrEqual(0)
    })

    await test.step('アクション数の取得確認', async () => {
      const actions = await header.getActionValue()
      expect(actions).toBeGreaterThanOrEqual(0)
    })
  })

  test('C002_Playwright推奨パターンの動作確認', async ({ page }) => {
    await test.step('複数インスタンスでの一貫性確認', async () => {
      // 1回目のインスタンス化
      const header1 = new HeaderComponent(page)
      const username1 = await header1.getUserName()

      // 2回目のインスタンス化
      const header2 = new HeaderComponent(page)
      const username2 = await header2.getUserName()

      // 同じページオブジェクトから取得した値は同じはず
      expect(username1).toBe(username2)
    })

    // readonly プロパティの型安全性は、TypeScriptのコンパイル時に検証される
    // 例: header1.userName = page.locator('test') ← コンパイルエラーになる
  })
})
