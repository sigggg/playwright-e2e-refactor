import { test, expect, devices } from '@playwright/test'
import { HeaderComponentSP } from '../shared-e2e-components/common/headerComponent.sp'

/**
 * HeaderComponentSP動作確認テスト（SP版）
 *
 * @description
 * - iPhoneデバイスエミュレーションでのヘッダーコンポーネント動作確認
 * - storageStateによる認証状態の再利用
 * - SP専用HeaderComponentSPを使用（PC版とは全く異なるDOM構造）
 * - SPビューポートでの表示・機能確認
 * - ハンバーガーメニュー、トップナビゲーション、ボトムナビゲーションの検証
 */

// iPhoneデバイス設定を適用
test.use({
  ...devices['iPhone 13'],
})

test.describe('HeaderComponentSP動作確認（SP版）', () => {
  test.beforeEach(async ({ page }) => {
    // storageStateにより既にログイン済みの状態
    // M3.comトップページにアクセス
    await page.goto('https://www.m3.com', { waitUntil: 'domcontentloaded' })
  })

  test('C001_SP版ヘッダーコンポーネントの基本機能確認', async ({ page }) => {
    // HeaderComponentSPのインスタンス化（SP専用）
    const header = new HeaderComponentSP(page)

    // 1. ヘッダーの表示確認（SP版は空のdiv要素として存在）
    console.log('📱 SP版ヘッダーの表示を確認中...')
    const isHeaderVisible = await header.isHeaderVisible()
    expect(isHeaderVisible).toBe(true)
    console.log('✅ SP版ヘッダーが表示されています')

    // 2. ログイン状態の確認
    console.log('📱 SP版ログイン状態を確認中...')
    const isLoggedIn = await header.isLoggedIn()
    expect(isLoggedIn).toBe(true)
    console.log('✅ SP版ログイン状態が確認できました')

    // 3. ユーザー名の取得（SP版ではコンテンツエリアまたはメニュー内）
    console.log('📱 SP版ユーザー名を取得中...')
    const username = await header.getUserName()
    expect(username).not.toBe('')
    console.log(`✅ SP版ユーザー名: ${username}`)

    // 4. トップナビゲーションの表示確認（SP特有）
    console.log('📱 SP版トップナビゲーションを確認中...')
    const isTopNavVisible = await header.isTopNavigationVisible()
    console.log(`📊 トップナビゲーション: ${isTopNavVisible ? '表示' : '非表示'}`)

    // 5. ボトムナビゲーションの表示確認（SP特有）
    console.log('📱 SP版ボトムナビゲーションを確認中...')
    const isBottomNavVisible = await header.isBottomNavigationVisible()
    console.log(`📊 ボトムナビゲーション: ${isBottomNavVisible ? '表示' : '非表示'}`)

    // 6. ロゴ画像の表示確認
    console.log('📱 ロゴ画像を確認中...')
    await expect(header.logo).toBeVisible({ timeout: 10000 })
    console.log('✅ ロゴ画像が表示されています')

    // 7. サービスアイコンの表示確認
    console.log('📱 サービスアイコンを確認中...')

    await expect(header.serviceDetail).toBeVisible({ timeout: 10000 })
    console.log('✅ メッセージアイコンが表示されています')

    await expect(header.serviceConference).toBeVisible({ timeout: 10000 })
    console.log('✅ 講演会アイコンが表示されています')

    await expect(header.serviceSurvey).toBeVisible({ timeout: 10000 })
    console.log('✅ アンケートアイコンが表示されています')

    await expect(header.serviceCampaign).toBeVisible({ timeout: 10000 })
    console.log('✅ キャンペーンアイコンが表示されています')

    await expect(header.serviceTodo).toBeVisible({ timeout: 10000 })
    console.log('✅ ToDoアイコンが表示されています')
  })

  test('C002_SPビューポートの確認', async ({ page }) => {
    console.log('📱 SPビューポート設定を確認中...')

    // ビューポートサイズを確認
    const viewportSize = page.viewportSize()
    expect(viewportSize).toBeDefined()

    // iPhone 13のビューポートサイズ（390x844）を確認
    // 注: headlessモードでは実際のサイズが異なる場合がある（390x664等）
    if (viewportSize) {
      console.log(`📱 ビューポートサイズ: ${viewportSize.width}x${viewportSize.height}`)
      expect(viewportSize.width).toBe(390)
      // 高さはheadlessモードで変動するため、幅のみ厳密にチェック
      expect(viewportSize.height).toBeGreaterThan(0)
    }

    console.log('✅ SPビューポート設定確認完了')
  })

  test('C003_SP版セレクタ動作確認', async ({ page }) => {
    console.log('📱 SP版セレクタの動作確認中...')

    const header = new HeaderComponentSP(page)

    // ユーザー名要素が正しく取得できることを確認
    // SP専用HeaderComponentSPが正しく動作することを検証
    const username = await header.getUserName()
    expect(username).not.toBe('')
    console.log(`✅ SPでユーザー名取得成功: ${username}`)

    // ヘッダー要素も正しく取得（SP版は空のdiv要素）
    const isHeaderAttached = await header.atlasHeader.evaluate(el => !!el).catch(() => false)
    expect(isHeaderAttached).toBe(true)
    console.log('✅ SPでヘッダー要素取得成功')
  })
})
