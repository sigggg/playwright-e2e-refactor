import { test as base } from '@playwright/test'

/**
 * テスト失敗時にHTML構造を自動保存する拡張テストフィクスチャ
 * video/screenshotと同様に、失敗時のみHTML構造をダンプする
 *
 * 使い方:
 * 既存のテストファイルで `import { test } from '@playwright/test'` を
 * `import { test, expect } from '../../shared-e2e-components/utils/test-hooks'` に変更するだけ
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    // テスト実行
    await use(page)

    // テスト終了後、失敗時のみHTML構造を保存
    if (testInfo.status !== testInfo.expectedStatus) {
      try {
        const html = await page.content()
        await testInfo.attach('page-html-dump', {
          body: html,
          contentType: 'text/html',
        })
      } catch (error) {
        console.error('📄 HTML構造の保存に失敗:', error)
      }
    }
  },
})

export { expect } from '@playwright/test'

