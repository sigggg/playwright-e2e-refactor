import { test, expect, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import { M3SPLoginPage } from '../shared-e2e-components/auth/M3SPLoginPage'

dotenv.config()

/**
 * SPニューステスト用の認証情報
 * 注: auth.setup.tsと同じ環境変数を使用
 */
const SP_TEST_USER = {
  username: process.env.USERNAME || '',
  password: process.env.PASSWORD || ''
}

/**
 * SPサイトのベースURL
 */
const SP_BASE_URL = 'https://sp.m3.com'

/**
 * テスト対象のニュース記事URL
 * 注: SPサイトは別ドメインのため絶対URLで指定
 */
const NEWS_ARTICLES = {
  general: `${SP_BASE_URL}/news/general/485396`,
  iryoishin: `${SP_BASE_URL}/news/iryoishin/714599`,
  kisokoza: `${SP_BASE_URL}/news/kisokoza/303638`,
} as const

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
 * - test.stepによる構造化でレポートの可読性を向上
 */
test('C001_SP_医療ニュース_下部コンテンツ存在チェック', async ({ page }) => {
  /**
   * 記事下部コンテンツの検証を行うヘルパー関数
   */
  const verifyBottomContent = async () => {
    // 「関連記事」セクションの検証
    const relatedHeading = page.getByRole('heading', { name: '関連記事' })
    await expect(relatedHeading).toBeVisible()

    // 関連記事の1件目のリンク存在確認（役割ベースセレクタで改善）
    const relatedSection = page.locator('section').filter({ has: page.getByRole('heading', { name: '関連記事' }) })
    const relatedFirstLink = relatedSection.getByRole('link').first()
    await expect(relatedFirstLink).toBeVisible()

    // 「臨床おすすめ記事」セクションの検証
    const clinicalHeading = page.getByRole('heading', { name: '臨床おすすめ記事' })
    await expect(clinicalHeading).toBeVisible()

    // 臨床おすすめ記事の1件目のリンク存在確認
    const clinicalSection = page.locator('section').filter({ has: page.getByRole('heading', { name: '臨床おすすめ記事' }) })
    const clinicalFirstLink = clinicalSection.getByRole('link').first()
    await expect(clinicalFirstLink).toBeVisible()
  }

  await test.step('M3.com SPサイトにログイン', async () => {
    const spLoginPage = new M3SPLoginPage(page)
    await spLoginPage.navigate()
    await spLoginPage.performLogin(SP_TEST_USER)
  })

  await test.step('医療ニュース記事の下部コンテンツ確認', async () => {
    await page.goto(NEWS_ARTICLES.general, { waitUntil: 'domcontentloaded' })
    await verifyBottomContent()
  })

  await test.step('医療維新記事の下部コンテンツ確認', async () => {
    await page.goto(NEWS_ARTICLES.iryoishin, { waitUntil: 'domcontentloaded' })
    await verifyBottomContent()
  })

  await test.step('地域ニュース記事の下部コンテンツ確認', async () => {
    await page.goto(NEWS_ARTICLES.kisokoza, { waitUntil: 'domcontentloaded' })
    await verifyBottomContent()
  })
})
