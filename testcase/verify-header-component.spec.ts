import { test, expect } from '@playwright/test'
import { HeaderComponent } from '../shared-e2e-components/common/headerComponent'

/**
 * HeaderComponent動作確認テスト
 *
 * @description
 * - storageStateによる認証状態の再利用
 * - playwright/auth.setup.tsで保存された認証情報を使用
 * - 各テストでログイン処理を実行せず、認証済み状態から開始
 */

test.describe('HeaderComponent動作確認', () => {
  test.beforeEach(async ({ page }) => {
    // storageStateにより既にログイン済みの状態
    // M3.comトップページにアクセス
    await page.goto('https://www.m3.com', { waitUntil: 'domcontentloaded' })
  })

  test('C001_ヘッダーコンポーネントの基本機能確認', async ({ page }) => {
    // HeaderComponentのインスタンス化
    const header = new HeaderComponent(page)

    // 1. ヘッダーの表示確認
    console.log('📝 ヘッダーの表示を確認中...')
    const isHeaderVisible = await header.isHeaderVisible()
    expect(isHeaderVisible).toBe(true)
    console.log('✅ ヘッダーが表示されています')

    // 2. ログイン状態の確認
    console.log('📝 ログイン状態を確認中...')
    const isLoggedIn = await header.isLoggedIn()
    expect(isLoggedIn).toBe(true)
    console.log('✅ ログイン状態が確認できました')

    // 3. ユーザー名の取得
    console.log('📝 ユーザー名を取得中...')
    const username = await header.getUserName()
    expect(username).not.toBe('')
    console.log(`✅ ユーザー名: ${username}`)

    // 4. 会員ステータスの取得
    console.log('📝 会員ステータスを取得中...')
    const memberStatus = await header.getMemberStatus()
    console.log(`📊 会員ステータス: ${memberStatus || '(取得できませんでした)'}`)

    // 5. ポイント数の取得
    console.log('📝 ポイント数を取得中...')
    const points = await header.getPointValue()
    expect(points).toBeGreaterThanOrEqual(0)
    console.log(`✅ ポイント数: ${points}p`)

    // 6. アクション数の取得
    console.log('📝 アクション数を取得中...')
    const actions = await header.getActionValue()
    expect(actions).toBeGreaterThanOrEqual(0)
    console.log(`✅ アクション数: ${actions}`)
  })

  test('C002_Playwright推奨パターンの動作確認', async ({ page }) => {
    console.log('📝 Playwright推奨パターン（コンストラクタ一括初期化）の効果を確認中...')

    // 1回目のインスタンス化
    const header1 = new HeaderComponent(page)
    const username1 = await header1.getUserName()

    // 2回目のインスタンス化
    const header2 = new HeaderComponent(page)
    const username2 = await header2.getUserName()

    // 同じページオブジェクトから取得した値は同じはず
    expect(username1).toBe(username2)
    console.log('✅ 複数インスタンスでの一貫性確認完了')

    // readonly プロパティの型安全性は、TypeScriptのコンパイル時に検証される
    // 例: header1.userName = page.locator('test') ← コンパイルエラーになる
    console.log('✅ TypeScript型安全性確認完了（readonly プロパティ）')
  })
})
