import { test } from '@playwright/test'
import { BackroomLoginPage } from '../shared-e2e-components/auth/BackroomLoginPage'
import { TEST_ACCOUNTS } from './data/test-accounts'

/**
 * Backroom管理画面ログインのサンプルテスト
 *
 * @description
 * - BackroomLoginPageの使用方法を示すサンプル
 * - Cognito認証でログインし、ログイン成功を確認
 */
test.describe('Backroom管理画面ログイン', () => {
  test('Backroom管理画面ログイン', async ({ page }) => {
    const backroomLogin = new BackroomLoginPage(page)

    await test.step('管理画面にアクセス', async () => {
      await backroomLogin.navigateToBackroom()
    })

    await test.step('ログイン', async () => {
      await backroomLogin.performFullLogin({
        cognitoUsername: TEST_ACCOUNTS.backroom.loginId,
        cognitoPassword: TEST_ACCOUNTS.backroom.loginPw,
        ldapUserId: TEST_ACCOUNTS.backroom.loginId,
        ldapPassword: TEST_ACCOUNTS.backroom.loginPw
      })
    })

    await test.step('ログイン成功を確認', async () => {
      await backroomLogin.verifyLogoutButtonVisible()
    })
  })
})

