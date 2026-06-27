import { chromium, FullConfig } from '@playwright/test'
import { M3LoginPage } from '../shared-e2e-components/auth/m3LoginPage'
import { HeaderComponent } from '../shared-e2e-components/common/headerComponent'
import * as dotenv from 'dotenv'
import * as path from 'path'

/**
 * M3.com認証グローバルセットアップ
 *
 * @description
 * - M3.comでのログインを1回だけ実行してstorageStateを保存
 * - 後続のテストで認証状態を再利用可能にする
 * - テスト実行時間の短縮と認証サーバーへの負荷軽減
 *
 * ## 実行タイミング
 * - 全テスト実行前に1回だけ実行される（playwright.config.tsのglobalSetup設定）
 *
 * ## 保存される認証情報
 * - Cookie
 * - LocalStorage
 * - SessionStorage
 *
 * ## storageState保存先
 * testcase/.auth/user.json
 *
 * ## 環境変数
 * - PROXY_SERVER: プロキシサーバーURL（任意、デフォルト: http://mrqa1.office.so-netm3.com:8889）
 */

async function globalSetup(config: FullConfig) {
  // 環境変数を読み込み
  dotenv.config()

  const authFile = path.join(__dirname, '.auth/user.json')
  // プロキシ設定は環境変数から取得（デフォルト値はQA1環境）
  const proxyServer = process.env.PROXY_SERVER || 'http://mrqa1.office.so-netm3.com:8889'

  // ブラウザとページを起動
  // 注意: globalSetupではplaywright.config.tsのuse設定が自動適用されないため、明示的に指定
  const browser = await chromium.launch({
    headless: true, // 認証処理はヘッドレスで実行（効率化のため）
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }, // playwright.config.tsと同じ設定
    ignoreHTTPSErrors: true,
    proxy: {
      server: proxyServer,
    },
  })
  const page = await context.newPage()

  try {
    // M3.comにログイン
    const loginPage = new M3LoginPage(page)
    await loginPage.performLogin({
      username: process.env.USERNAME || '',
      password: process.env.PASSWORD || ''
    })

    // ログイン成功確認（ヘッダーにユーザー名が表示されることを確認）
    const header = new HeaderComponent(page)
    const isLoggedIn = await header.isLoggedIn()

    if (!isLoggedIn) {
      throw new Error('❌ ログイン確認に失敗しました')
    }

    const username = await header.getUserName()

    // 認証状態をファイルに保存
    await context.storageState({ path: authFile })

  } catch (error) {
    console.error('❌ 認証セットアップに失敗しました:', error)

    // エラー時のスクリーンショット保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const screenshotPath = `test-results/auth-setup-failure-${timestamp}.png`
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.error(`📸 エラースクリーンショットを保存しました: ${screenshotPath}`)

    throw error
  } finally {
    await browser.close()
  }
}

export default globalSetup

