import { test, expect, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import { M3SPLoginPage } from '../shared-e2e-components/auth/M3SPLoginPage'

dotenv.config()

// SPサイト用のデバイスエミュレーション設定
test.use({
  ...devices['iPhone 13'],
  storageState: { cookies: [], origins: [] } // 空の認証状態で開始
})

/**
 * Unit4_SP_医療ニュース_下部コンテンツ存在チェック
 *
 * @description
 * - SPサイト（スマートフォン版）での医療ニュース記事下部のおすすめコンテンツ表示確認
 * - 3つのカテゴリ（医療ニュース、医療維新、地域ニュース）の記事で下部コンテンツ確認
 * - 役割ベースセレクタを優先使用
 */
test('Unit4_SP_医療ニュース_下部コンテンツ存在チェック', async ({ page }) => {
  // ==========================================
  // Arrange: デバイスエミュレーション設定済み（test.use）
  // ==========================================

  // ==========================================
  // Act & Assert: M3.com SPサイトログイン
  // ==========================================
  console.log('####m3comログイン前トップ遷移')
  console.log('####m3comログイン')
  console.log('### m3.comログイン')

  // M3 SPログインページクラスを使用
  const spLoginPage = new M3SPLoginPage(page)

  // M3.com SPサイトに遷移してログイン
  await spLoginPage.navigate()
  await spLoginPage.login(
    process.env.SP_USERNAME || 'quiz004',
    process.env.SP_PASSWORD || 'testtest'
  )

  console.log('m3.comにログイン')

  // ==========================================
  // Act & Assert: 医療ニュース記事下部コンテンツ確認
  // ==========================================
  console.log('####各ニュース画面遷移開始')
  console.log('### 医療ニュース記事（general/485396）下部コンテンツ確認')

  await page.goto('https://www.m3.com/news/general/485396', { waitUntil: 'domcontentloaded' })

  // 「関連記事」見出し存在確認
  const generalRelatedHeading = page.getByRole('heading', { name: '関連記事' })
  await expect(generalRelatedHeading).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療ニュース記事「関連記事」見出し表示確認')

  // 関連記事の1件目のリンク存在確認
  const generalRelatedFirstLink = page.locator('section:has(h1:has-text("関連記事")) ul > li:nth-child(1) > a')
  await expect(generalRelatedFirstLink).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療ニュース記事「関連記事」1件目のリンク表示確認')

  // 「臨床おすすめ記事」見出し存在確認
  const generalClinicalHeading = page.getByRole('heading', { name: '臨床おすすめ記事' })
  await expect(generalClinicalHeading).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療ニュース記事「臨床おすすめ記事」見出し表示確認')

  // 臨床おすすめ記事の1件目のリンク存在確認
  const generalClinicalFirstLink = page.locator('section:has(h1:has-text("臨床おすすめ記事")) ul > li:nth-child(1) > a')
  await expect(generalClinicalFirstLink).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療ニュース記事「臨床おすすめ記事」1件目のリンク表示確認')

  // ==========================================
  // Act & Assert: 医療維新記事下部コンテンツ確認
  // ==========================================
  console.log('### 医療維新記事（iryoishin/714599）下部コンテンツ確認')

  await page.goto('https://sp.m3.com/news/iryoishin/714599', { waitUntil: 'domcontentloaded' })

  // 「関連記事」見出し存在確認
  const iryoishinRelatedHeading = page.getByRole('heading', { name: '関連記事' })
  await expect(iryoishinRelatedHeading).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療維新記事「関連記事」見出し表示確認')

  // 関連記事の1件目のリンク存在確認
  const iryoishinRelatedFirstLink = page.locator('section:has(h1:has-text("関連記事")) ul > li:nth-child(1) > a')
  await expect(iryoishinRelatedFirstLink).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療維新記事「関連記事」1件目のリンク表示確認')

  // 「臨床おすすめ記事」見出し存在確認
  const iryoishinClinicalHeading = page.getByRole('heading', { name: '臨床おすすめ記事' })
  await expect(iryoishinClinicalHeading).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療維新記事「臨床おすすめ記事」見出し表示確認')

  // 臨床おすすめ記事の1件目のリンク存在確認
  const iryoishinClinicalFirstLink = page.locator('section:has(h1:has-text("臨床おすすめ記事")) ul > li:nth-child(1) > a')
  await expect(iryoishinClinicalFirstLink).toBeVisible({ timeout: 30000 })
  console.log('✅ 医療維新記事「臨床おすすめ記事」1件目のリンク表示確認')

  // ==========================================
  // Act & Assert: 地域ニュース記事下部コンテンツ確認
  // ==========================================
  console.log('### 地域ニュース記事（kisokoza/303638）下部コンテンツ確認')

  await page.goto('https://www.m3.com/news/kisokoza/303638', { waitUntil: 'domcontentloaded' })

  // 「関連記事」見出し存在確認
  const kisokozaRelatedHeading = page.getByRole('heading', { name: '関連記事' })
  await expect(kisokozaRelatedHeading).toBeVisible({ timeout: 30000 })
  console.log('✅ 地域ニュース記事「関連記事」見出し表示確認')

  // 関連記事の1件目のリンク存在確認
  const kisokozaRelatedFirstLink = page.locator('section:has(h1:has-text("関連記事")) ul > li:nth-child(1) > a')
  await expect(kisokozaRelatedFirstLink).toBeVisible({ timeout: 30000 })
  console.log('✅ 地域ニュース記事「関連記事」1件目のリンク表示確認')

  // 「臨床おすすめ記事」見出し存在確認
  const kisokozaClinicalHeading = page.getByRole('heading', { name: '臨床おすすめ記事' })
  await expect(kisokozaClinicalHeading).toBeVisible({ timeout: 30000 })
  console.log('✅ 地域ニュース記事「臨床おすすめ記事」見出し表示確認')

  // 臨床おすすめ記事の1件目のリンク存在確認
  const kisokozaClinicalFirstLink = page.locator('section:has(h1:has-text("臨床おすすめ記事")) ul > li:nth-child(1) > a')
  await expect(kisokozaClinicalFirstLink).toBeVisible({ timeout: 30000 })
  console.log('✅ 地域ニュース記事「臨床おすすめ記事」1件目のリンク表示確認')

  console.log('####各画面表示チェック終了')
})
