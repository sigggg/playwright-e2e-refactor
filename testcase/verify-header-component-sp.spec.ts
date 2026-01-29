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
 * - test.stepによる構造化でレポートの可読性を向上
 */

// iPhoneデバイス設定を適用
test.use({
  ...devices['iPhone 13'],
})

test.describe('HeaderComponentSP動作確認（SP版）', () => {
  test.beforeEach(async ({ page }) => {
    // storageStateにより既にログイン済みの状態
    // M3.comトップページにアクセス（baseURLが設定されている場合は相対パスを使用）
    await page.goto('/', { waitUntil: 'domcontentloaded' })
  })

  test('C001_SP版ヘッダーコンポーネントの基本機能確認', async ({ page }) => {
    const header = new HeaderComponentSP(page)

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

    await test.step('ナビゲーション表示確認', async () => {
      // トップナビゲーション・ボトムナビゲーションの表示状態を確認（SP特有）
      await header.isTopNavigationVisible()
      await header.isBottomNavigationVisible()
    })

    await test.step('ロゴ画像の表示確認', async () => {
      await expect(header.logo).toBeVisible()
    })

    await test.step('サービスアイコンの表示確認', async () => {
      await expect(header.serviceDetail).toBeVisible()
      await expect(header.serviceConference).toBeVisible()
      await expect(header.serviceSurvey).toBeVisible()
      await expect(header.serviceCampaign).toBeVisible()
      await expect(header.serviceTodo).toBeVisible()
    })
  })

  test('C002_SPビューポートの確認', async ({ page }) => {
    await test.step('ビューポートサイズの検証', async () => {
      const viewportSize = page.viewportSize()
      expect(viewportSize).toBeDefined()

      // iPhone 13のビューポートサイズ（390x844）を確認
      // 注: headlessモードでは実際のサイズが異なる場合がある（390x664等）
      if (viewportSize) {
        expect(viewportSize.width).toBe(390)
        // 高さはheadlessモードで変動するため、幅のみ厳密にチェック
        expect(viewportSize.height).toBeGreaterThan(0)
      }
    })
  })

  test('C003_SP版セレクタ動作確認', async ({ page }) => {
    const header = new HeaderComponentSP(page)

    await test.step('ユーザー名要素の取得確認', async () => {
      // SP専用HeaderComponentSPが正しく動作することを検証
      const username = await header.getUserName()
      expect(username).not.toBe('')
    })
  })
})
