import { Page, Locator, expect } from '@playwright/test'
import { BasePage } from '../common/basePage'

/**
 * M3 Internal認証情報のインターフェース
 */
export interface M3InternalLoginCredentials {
  username: string
  password: string
}

/**
 * M3 Internalログインページ
 *
 * @description
 * - M3 Internal管理画面（qa-a.m3internal.com）でのログイン処理を提供
 * - AWS Cognitoベースの認証フォーム
 * - AWS Cognito特有の重複要素対策で.last()を使用
 * - BasePage継承により共通機能を活用
 * - URL: 環境変数 M3_INTERNAL_URL から取得（デフォルト: https://community-admin.unit4.qa-a.m3internal.com/）
 */
export class M3InternalLoginPage extends BasePage {
  // ===== Locatorプロパティ =====
  readonly loginButton: Locator
  readonly cognitoSignInText: Locator
  readonly cognitoUsernameInput: Locator
  readonly cognitoPasswordInput: Locator
  readonly cognitoSubmitButton: Locator
  readonly logoutLink: Locator

  constructor(page: Page, url?: string) {
    super(page)
    // 環境変数からM3 Internal URLを取得（環境切り替え対応）
    this.url = url || process.env.M3_INTERNAL_URL || 'https://community-admin.unit4.qa-a.m3internal.com/'

    // ===== Locator初期化 =====
    this.loginButton = page.getByRole('link', { name: 'Login' })
    this.cognitoSignInText = page.getByText('Sign in with your username and password').last()
    this.cognitoUsernameInput = page.locator('#signInFormUsername').last()
    this.cognitoPasswordInput = page.locator('#signInFormPassword').last()
    this.cognitoSubmitButton = page.locator('input[name="signInSubmitButton"]').last()
    this.logoutLink = page.getByRole('link', { name: 'Logout' })
  }

  /**
   * 管理画面トップページへのナビゲート
   *
   * @description
   * - M3 Internal管理画面トップページへ遷移
   * - BasePageのnavigate()メソッドを活用
   */
  async navigate(): Promise<void> {
    console.log(`📡 M3 Internal管理画面にアクセス中: ${this.url}`)
    await super.navigate()
    console.log('✅ M3 Internal管理画面へのアクセスが完了しました')
  }

  /**
   * M3 Internal管理画面でのログイン処理
   *
   * @param credentials ログイン認証情報
   * @description
   * - AWS Cognito認証フローを実行
   * - 3段階のステップでログイン処理を実行
   *   1. Loginボタンクリック → Cognito認証画面へ遷移
   *   2. 認証情報入力 → ログイン実行
   *   3. ログイン成功確認
   */
  async performLogin(credentials: M3InternalLoginCredentials): Promise<void> {
    console.log('🔐 M3 Internal管理画面ログイン処理を開始中...')

    // 1. Loginボタンをクリックして認証画面へ遷移
    console.log('🔍 「Login」ボタンを待機中...')
    await this.loginButton.waitFor({ state: 'visible' })
    await this.loginButton.click()
    console.log('✅ 「Login」ボタンをクリックしました')
    await this.page.waitForLoadState('domcontentloaded')

    // 2. Cognito認証フォームで認証情報を入力・送信
    console.log('🔍 Cognito認証フォームの表示を待機中...')
    await this.cognitoSignInText.waitFor({ state: 'visible' })
    console.log('✅ AWS Cognitoログインフォームが表示されました')

    console.log('📝 認証情報を入力中...')
    await this.cognitoUsernameInput.waitFor({ state: 'visible' })
    await this.cognitoUsernameInput.fill(credentials.username)
    console.log(`✅ ユーザー名を入力しました: ${credentials.username}`)

    await this.cognitoPasswordInput.waitFor({ state: 'visible' })
    await this.cognitoPasswordInput.fill(credentials.password)
    console.log('✅ パスワードを入力しました')

    await this.cognitoSubmitButton.waitFor({ state: 'visible' })
    await this.cognitoSubmitButton.click()
    console.log('✅ Cognito認証を送信しました')
    await this.page.waitForLoadState('domcontentloaded')

    // 3. ログイン成功確認
    console.log('🔍 ログイン成功を確認中...')
    await this.logoutLink.waitFor({ state: 'visible' })
    console.log('✅ M3 Internal管理画面ログイン処理が完了しました')
  }

  /**
   * 後方互換性のためのラッパーメソッド
   * @deprecated performLogin()を使用してください
   */
  async login(username: string, password: string): Promise<void> {
    await this.performLogin({ username, password })
  }

  /**
   * ログイン状態の確認
   *
   * @returns ログイン済みの場合true
   */
  async isLoggedIn(): Promise<boolean> {
    return await this.isElementVisible(this.logoutLink)
  }

  /**
   * ログアウトリンクの表示確認
   *
   * @description
   * - ログイン成功後、ログアウトリンクが表示されていることを検証
   * - POMカプセル化: Locatorプロパティを直接テストコードに露出させない
   */
  async verifyLogoutLinkVisible(): Promise<void> {
    console.log('🔍 ログアウトリンクの表示を確認中...')
    await expect(this.logoutLink).toBeVisible()
    console.log('✅ ログアウトリンクが表示されています')
  }
}

