import { test as setup } from '@playwright/test'
import { M3LoginPage } from './shared-e2e-components/auth/m3LoginPage'
import { HeaderComponent } from './shared-e2e-components/common/headerComponent'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config()

/**
 * Playwright Test Agents: 環境セットアップ
 *
 * @description
 * - Test Agentsの前提となるログイン済み状態を作成
 * - M3.comにログインし、認証状態をstorageStateに保存
 * - 以降のテスト（tests/内のファイル）はこの認証状態を再利用
 *
 * @usage
 * npx playwright test seed.spec.ts --headed
 * npx playwright test --project=setup
 */

const authFile = path.join(__dirname, '.auth/user.json')

setup('環境セットアップ: M3.comログイン', async ({ page }) => {
  console.log('🔐 M3.comにログインします...')

  const loginPage = new M3LoginPage(page)
  await loginPage.performFullLogin({
    username: process.env.USERNAME || '',
    password: process.env.PASSWORD || ''
  })

  console.log('✅ ログイン成功を確認します...')

  const header = new HeaderComponent(page)
  const isLoggedIn = await header.isLoggedInState()

  if (!isLoggedIn) {
    throw new Error('❌ ログイン確認に失敗しました')
  }

  const username = await header.getUserName()
  console.log(`✅ ログイン状態確認完了: ${username}`)

  // 認証状態を保存
  await page.context().storageState({ path: authFile })
  console.log(`✅ 認証状態を保存しました: ${authFile}`)
})
