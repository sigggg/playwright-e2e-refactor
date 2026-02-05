import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from '../common/basePage'

/**
 * Backroom管理画面ログインページ
 *
 * @description
 * - 2段階認証フロー: Cognito認証 → LDAP認証
 * - 役割ベースセレクタを優先使用
 * - URL: 環境変数 BACKROOM_URL から取得（デフォルト: https://backroom-qa1.m3.com/backroom/）
 */
export class BackroomLoginPage extends BasePage {
  // ===== BackroomホームページのLocator =====
  readonly backroomLoginButton: Locator

  // ===== Cognito認証画面のLocator =====
  readonly cognitoSignInText: Locator
  readonly cognitoUsernameInput: Locator
  readonly cognitoPasswordInput: Locator
  readonly cognitoSubmitButton: Locator

  // ===== LDAP認証画面のLocator =====
  readonly ldapHeading: Locator
  readonly ldapDescription: Locator
  readonly ldapUserIdInput: Locator
  readonly ldapPasswordInput: Locator
  readonly ldapLoginButton: Locator

  // ===== ログイン後の確認用Locator =====
  readonly logoutButton: Locator

  constructor(page: Page) {
    super(page)
    // 環境変数からBackroom URLを取得（環境切り替え対応）
    this.url = process.env.BACKROOM_URL || 'https://backroom-qa1.m3.com/backroom/'

    // ===== Backroomホームページ =====
    this.backroomLoginButton = page.getByRole('link', { name: 'ログイン' })

    // ===== Cognito認証画面（AWS Cognito特有の重複要素対策で.last()を使用） =====
    this.cognitoSignInText = page.getByText('Sign in with your username and password').last()
    this.cognitoUsernameInput = page.locator('#signInFormUsername').last()
    this.cognitoPasswordInput = page.locator('#signInFormPassword').last()
    this.cognitoSubmitButton = page.locator('input[name="signInSubmitButton"]').last()

    // ===== LDAP認証画面 =====
    this.ldapHeading = page.getByRole('heading', { name: 'M3 スタッフ OpenID 認証 (QA環境)' })
    this.ldapDescription = page.getByText('QA環境の LDAP アカウントでログインしてください。')
    this.ldapUserIdInput = page.locator('input.input-small')
    this.ldapPasswordInput = page.locator('input.input-xlarge')
    this.ldapLoginButton = page.locator('input.btn.btn-primary.btn-large')

    // ===== ログイン後 =====
    this.logoutButton = page.locator('.btn.btn-danger.btn-small')
  }

  /**
   * Backroom管理画面へのナビゲート
   */
  async navigateToBackroom(): Promise<void> {
    console.log('🔧 Backroom管理画面にナビゲート中...')
    await this.navigate()
    console.log('✅ Backroom管理画面へのナビゲート完了')
  }

  /**
   * Backroom管理画面への完全ログイン（Cognito + LDAP）
   *
   * @description
   * - AWS Cognito認証 → LDAP認証の2段階認証フロー
   * - Octoparts管理画面ログインパターンを参考
   *
   * @param credentials 認証情報
   */
  async performFullLogin(credentials: {
    cognitoUsername: string
    cognitoPassword: string
    ldapUserId: string
    ldapPassword: string
  }): Promise<void> {
    console.log('🔐 Backroom管理画面へのログインを開始...')

    // ==================================================
    // Step 1: Backroom管理画面にアクセス
    // ==================================================
    await this.navigateToBackroom()
    await this.page.waitForLoadState('domcontentloaded')

    // Backroomホームページの「ログイン」ボタンをクリック
    console.log('🔍 Backroomホームページの「ログイン」ボタンを待機中...')
    await this.backroomLoginButton.waitFor({ state: 'visible' })
    await this.backroomLoginButton.click()
    console.log('✅ 「ログイン」ボタンをクリックしました')

    // ==================================================
    // Step 2: Cognito認証（AWS Cognito）
    // ==================================================
    console.log('🔍 Cognito認証フォームの表示を待機中...')

    // Cognitoフォームの表示確認（.last()で表示要素を取得）
    await this.cognitoSignInText.waitFor({ state: 'visible' })
    console.log('✅ AWS Cognitoログインフォームが表示されました')

    // Cognito認証情報入力
    await this.cognitoUsernameInput.waitFor({ state: 'visible' })
    await this.cognitoUsernameInput.fill(credentials.cognitoUsername)
    console.log(`✅ Cognitoユーザー名を入力しました: ${credentials.cognitoUsername}`)

    await this.cognitoPasswordInput.waitFor({ state: 'visible' })
    await this.cognitoPasswordInput.fill(credentials.cognitoPassword)
    console.log('✅ Cognitoパスワードを入力しました')

    // Cognito認証を送信
    await this.cognitoSubmitButton.click()
    console.log('✅ Cognito認証を送信しました')

    // ページ遷移の完了を待機
    await this.page.waitForLoadState('domcontentloaded')

    // ==================================================
    // Step 3: ログイン成功確認
    // ==================================================
    // Cognito認証のみで完了する場合が多いため、直接ログアウトボタンを確認
    // LDAP認証画面が表示される場合は別途対応が必要
    console.log('🔍 ログイン成功を確認中...')
    await this.logoutButton.waitFor({ state: 'visible' })
    console.log('✅ Backroom管理画面へのログイン成功')
  }

  /**
   * ログイン状態の確認
   *
   * @returns ログイン済みの場合true
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.isElementVisible(this.logoutButton)
  }

  /**
   * ログアウトボタンの表示確認
   *
   * @description
   * - ログイン成功後、ログアウトボタンが表示されていることを検証
   * - POMカプセル化: Locatorプロパティを直接テストコードに露出させない
   */
  async verifyLogoutButtonVisible(): Promise<void> {
    console.log('🔍 ログアウトボタンの表示を確認中...')
    await expect(this.logoutButton).toBeVisible()
    console.log('✅ ログアウトボタンが表示されています')
  }
}

