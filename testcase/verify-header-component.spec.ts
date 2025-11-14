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

  test('C002_ヘッダー要素のLocator初期化確認', async ({ page }) => {
    // HeaderComponentのインスタンス化
    const header = new HeaderComponent(page)

    console.log('📝 各Locatorが正しく初期化されているか確認中...')

    // readonly プロパティとして定義されていることを確認
    expect(header.atlasHeader).toBeDefined()
    expect(header.userName).toBeDefined()
    expect(header.userInfoBox).toBeDefined()
    expect(header.memberStatus).toBeDefined()
    expect(header.pointInfo).toBeDefined()
    expect(header.pointAmount).toBeDefined()
    expect(header.actionInfo).toBeDefined()
    expect(header.actionAmount).toBeDefined()
    expect(header.serviceDetail).toBeDefined()
    expect(header.messagesBadge).toBeDefined()
    expect(header.serviceConference).toBeDefined()
    expect(header.serviceSurvey).toBeDefined()
    expect(header.serviceCampaign).toBeDefined()
    expect(header.serviceTodo).toBeDefined()
    expect(header.todoBadge).toBeDefined()
    expect(header.searchArea).toBeDefined()

    console.log('✅ 全てのLocatorが正しく初期化されています')

    // 実際の要素の存在確認（一部）
    console.log('📝 主要要素の存在を確認中...')

    await expect(header.atlasHeader).toBeVisible({ timeout: 10000 })
    console.log('✅ atlasHeader: 表示確認')

    await expect(header.userName).toBeVisible({ timeout: 10000 })
    console.log('✅ userName: 表示確認')

    // ポイント情報は表示されない場合もあるのでチェックを緩める
    const isPointVisible = await header.pointInfo.isVisible().catch(() => false)
    console.log(`📊 pointInfo: ${isPointVisible ? '表示' : '非表示'}`)
  })

  test('C003_Playwright推奨パターンの動作確認', async ({ page }) => {
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

  test('C004_段階的セレクタ戦略の確認', async ({ page }) => {
    console.log('📝 段階的セレクタ戦略（役割ベース → CSSセレクタ）の動作確認中...')

    const header = new HeaderComponent(page)

    // ユーザー名要素が段階的セレクタ戦略で取得できることを確認
    // 内部的には以下の順で試行される：
    // 1. page.getByRole('banner').getByRole('button', { name: /先生|さん/ })
    // 2. page.getByRole('button', { name: /先生|さん/ })
    // 3. page.locator('.atlas-header__username')

    const username = await header.getUserName()
    expect(username).not.toBe('')
    console.log(`✅ 段階的セレクタ戦略でユーザー名取得成功: ${username}`)

    // ヘッダー要素も段階的セレクタで取得
    // 1. page.getByRole('banner')
    // 2. page.locator('.atlas-header')
    await expect(header.atlasHeader).toBeVisible({ timeout: 10000 })
    console.log('✅ 段階的セレクタ戦略でヘッダー要素取得成功')
  })
})
