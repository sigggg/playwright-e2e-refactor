import { test } from '@playwright/test'
import { M3InternalLoginPage } from '../shared-e2e-components/auth/M3InternalLoginPage'
import { TEST_ACCOUNTS } from './data/test-accounts'

/**
 * M3 Internal管理画面ログインのサンプルテスト
 *
 * @description
 * - M3InternalLoginPageの使用方法を示すサンプル
 * - Cognito認証でログインし、ログイン成功を確認
 */
test.describe('M3 Internal管理画面ログイン', () => {
  test('M3 Internal管理画面ログイン', async ({ page }) => {
    const m3InternalLogin = new M3InternalLoginPage(page)

    await test.step('管理画面にアクセス', async () => {
      await m3InternalLogin.navigate()
    })

    await test.step('ログイン', async () => {
      await m3InternalLogin.performLogin({
        username: TEST_ACCOUNTS.m3Internal.username,
        password: TEST_ACCOUNTS.m3Internal.password
      })
    })

    await test.step('ログイン成功を確認', async () => {
      await m3InternalLogin.verifyLogoutLinkVisible()
    })
  })
})
