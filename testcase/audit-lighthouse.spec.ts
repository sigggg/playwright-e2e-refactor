import { test } from '@playwright/test'
import { playAudit } from 'playwright-lighthouse'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * Lighthouse PageSpeed Insights測定
 *
 * 対象URL: https://ebook-qa1.m3.com/
 *
 * 測定項目：
 * 1. パフォーマンス
 * 2. アクセシビリティ
 * 3. ベストプラクティス
 * 4. SEO
 */

test.describe('ebook-qa1.m3.com PageSpeed Insights測定', () => {
  test('C001_Lighthouse測定実行', async ({ page }) => {
    // storageStateにより既にM3.comログイン済みの状態
    // 監査対象ページにアクセス
    await page.goto('https://ebook-qa1.m3.com/', { waitUntil: 'networkidle' })

    // ページの読み込み完了を待機
    await page.waitForLoadState('load')

    console.log('🚀 Lighthouse測定を開始します...')

    // Lighthouse測定を実行
    await playAudit({
      page: page,
      port: 9222,
      thresholds: {
        performance: 0,
        accessibility: 0,
        'best-practices': 0,
        seo: 0
      },
      reports: {
        formats: {
          json: true,
          html: true
        },
        name: `lighthouse-report-${Date.now()}`,
        directory: './test-results'
      }
    })

    console.log('✅ Lighthouse測定が完了しました')
    console.log('📊 レポート保存先: ./test-results/')
  })
})
