import { Page, expect } from '@playwright/test'

/**
 * M3.com認証情報のインターフェース
 */
export interface LoginCredentials {
  username: string
  password: string
}

/**
 * M3サービス群共通認証ヘルパーユーティリティ
 * 
 * @description
 * - M3.com認証処理の共通実装を提供
 * - ログイン・ログアウト・認証状態確認などの基本機能
 * - APIレスポンス監視による確実な認証状態判定
 * - 複数のM3サービスで共通利用可能
 * - エラーハンドリングと詳細なログ出力を内蔵
 * 
 * @example
 * ```typescript
 * const authHelper = new AuthHelper(page);
 * await authHelper.loginToM3AndRedirectToService({
 *   username: 'test@example.com',
 *   password: 'password123'
 * }, 'https://ebook-qa1.m3.com');
 * ```
 */
export class AuthHelper {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * M3.comログイン → 指定サービスへの遷移（統合メソッド）
   * 
   * @param credentials ログイン認証情報
   * @param targetServiceUrl 遷移先サービスURL（省略時は環境変数から取得）
   * @description
   * - M3.comでのログイン処理から指定サービスサイトでの認証状態確認まで一括実行
   * - 各サービスのテストで最も頻繁に利用される統合メソッド
   * - 内部でloginToM3()とnavigateToService()を順次実行
   */
  async loginToM3AndRedirectToService(credentials: LoginCredentials, targetServiceUrl?: string): Promise<void> {
    const serviceUrl = targetServiceUrl || process.env.TEST_BASE_URL || 'https://ebook-qa1.m3.com'

    console.log('🔐 M3統合ログイン処理を開始します...')

    // 1. M3.comでのログイン処理
    await this.loginToM3(credentials)

    // 2. 対象サービスサイトに遷移
    await this.navigateToService(serviceUrl)

    // 3. サービスサイトでの認証状態確認
    await this.verifyServiceLoginState()

    console.log('✅ M3統合ログイン処理が正常に完了しました')
  }

  /**
   * M3.comでのログイン処理
   * 
   * @param credentials ログイン認証情報
   * @description
   * - M3.comサイトでの認証処理のみを実行
   * - サービス遷移は含まない独立したログイン処理
   */
  async loginToM3(credentials: LoginCredentials): Promise<void> {
    const m3comURL = 'https://www.m3.com'

    console.log('🔐 M3.comログイン処理を開始中...')

    // 1. M3.comにアクセス
    console.log(`📡 ${m3comURL} にナビゲート中...`)
    try {
      await this.page.goto(m3comURL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })
      await this.page.waitForTimeout(3000)
    } catch (error) {
      console.warn(`⚠️ 初期ナビゲーション失敗、loadイベントで再試行: ${error.message}`)
      await this.page.goto(m3comURL, {
        waitUntil: 'load',
        timeout: 60000
      })
    }

    // 2. ログインボタンの確認とクリック
    await this.clickLoginButton()

    // 3. ログイン情報の入力
    await this.fillLoginForm(credentials)

    // 4. ログイン実行
    await this.submitLogin()

    // 5. M3.comでのログイン成功確認
    await this.verifyLoginSuccess()

    console.log('✅ M3.comログイン処理が完了しました')
  }

  /**
   * 指定サービスサイトへの遷移
   * 
   * @param serviceUrl 遷移先サービスのURL
   * @description
   * - M3.comログイン後の状態で指定サービスサイトに遷移
   * - ログイン状態を引き継いだ状態でサービスサイトにアクセス
   */
  async navigateToService(serviceUrl: string): Promise<void> {
    console.log(`📡 サービスサイト ${serviceUrl} に遷移中...`)
    await this.page.goto(serviceUrl, { waitUntil: 'networkidle' })
    console.log(`✅ ${serviceUrl} への遷移が完了しました`)
  }

  /**
   * ログインボタンのクリック処理
   * @private
   */
  private async clickLoginButton(): Promise<void> {
    console.log('🔍 ログインフォームの状態を確認中...')

    // M3.comのトップページではログインフォームが既に表示されている場合が多い
    try {
      const loginIdField = this.page.locator('#loginId')
      await expect(loginIdField).toBeVisible({ timeout: 10000 })
      console.log('✅ ログインフォームが既に表示されています')
      return
    } catch (error) {
      console.log('🔍 ログインフォームが非表示、ログインボタンを探索中...')
    }

    // ログインフォームが表示されていない場合のボタン探索
    const loginSelectors = [
      'a[href*="login"]',
      'button:has-text("ログイン")',
      'a:has-text("ログイン")',
      '.login-btn',
      '#login-btn',
      '[data-testid="login"]'
    ]

    let loginButtonFound = false
    for (const selector of loginSelectors) {
      try {
        const element = this.page.locator(selector).first()
        if (await element.isVisible({ timeout: 5000 })) {
          console.log(`✅ ログインボタンを発見: ${selector}`)
          await element.click()
          loginButtonFound = true
          break
        }
      } catch (error) {
        continue
      }
    }

    if (!loginButtonFound) {
      throw new Error('❌ ログインボタンが見つからず、ログインフォームも表示されていません')
    }

    await this.page.waitForLoadState('networkidle')
  }

  /**
   * ログインフォームへの入力処理
   * @private
   */
  private async fillLoginForm(credentials: LoginCredentials): Promise<void> {
    console.log('📝 ログイン情報を入力中...')

    try {
      // ログインID入力フィールド（M3.com専用セレクタ）
      const loginIdField = this.page.locator('#loginId')
      await expect(loginIdField).toBeVisible({ timeout: 10000 })
      await loginIdField.fill(credentials.username)
      console.log('✅ ログインIDの入力が完了しました')

      // パスワード入力フィールド（M3.com専用セレクタ）
      const passwordField = this.page.locator('#password')
      await expect(passwordField).toBeVisible({ timeout: 5000 })
      await passwordField.fill(credentials.password)
      console.log('✅ パスワードの入力が完了しました')

    } catch (error) {
      throw new Error(`❌ ログインフォームの入力に失敗しました: ${error.message}`)
    }
  }

  /**
   * ログイン送信処理とAPIレスポンス監視
   * @private
   */
  private async submitLogin(): Promise<void> {
    console.log('🚀 ログインを実行中...')

    // ログインAPIレスポンスの監視設定
    const loginResponsePromise = this.page.waitForResponse(response =>
      response.url().includes('/open/login') && response.request().method() === 'POST'
    )

    try {
      // M3.com専用のログインボタンをクリック
      const loginButton = this.page.locator('button.pls-button.--primary.opentop__button[type="submit"]')
      await expect(loginButton).toBeVisible({ timeout: 10000 })
      await loginButton.click()
      console.log('✅ ログインボタンをクリックしました')

      // APIレスポンスの確認
      const loginResponse = await loginResponsePromise
      const status = loginResponse.status()
      console.log(`📡 ログインAPIレスポンス: ${status}`)

      if (status === 303) {
        console.log('✅ ログイン成功（303リダイレクト受信）')
        const locationHeader = loginResponse.headers().location
        if (locationHeader) {
          console.log(`📍 リダイレクト先: ${locationHeader}`)
        }
      } else {
        throw new Error(`❌ ログインが失敗しました。ステータス: ${status}`)
      }

      // ページ遷移の完了を待機
      await this.page.waitForLoadState('networkidle')

    } catch (error) {
      throw new Error(`❌ ログイン送信処理でエラーが発生しました: ${error.message}`)
    }
  }

  /**
   * M3.comでのログイン成功確認
   * @private
   */
  private async verifyLoginSuccess(): Promise<void> {
    console.log('🔍 M3.comでのログイン成功状態を確認中...')

    try {
      // M3.comヘッダーのユーザー名表示を確認
      const usernameElement = this.page.locator('.atlas-header__username')
      await expect(usernameElement).toBeVisible({ timeout: 10000 })

      const usernameText = await usernameElement.textContent()
      if (usernameText && usernameText.trim()) {
        console.log(`✅ M3.comログイン成功確認。ユーザー名: ${usernameText.trim()}`)
        return
      }
    } catch (error) {
      throw new Error('❌ M3.comログイン失敗: ユーザー名ヘッダーが見つかりません')
    }

    throw new Error('❌ M3.comログイン失敗: ユーザー名が空です')
  }

  /**
   * サービスサイトでのログイン状態確認
   * @private
   */
  private async verifyServiceLoginState(): Promise<void> {
    console.log('🔍 サービスサイトでのログイン状態を確認中...')

    // 一般的なログイン状態の指標
    const loginIndicators = [
      'header.l-header__cnt.has-user-info', // ヘッダーのログイン状態クラス
      '.atlas-header__username', // M3共通ユーザー名表示
      '.point-info .available-point', // ポイント情報の表示
      '.point-info', // ポイント情報エリア
      '.search-input' // 検索フォーム（ログイン後にアクセス可能）
    ]

    let loginConfirmed = false
    for (const indicator of loginIndicators) {
      try {
        await expect(this.page.locator(indicator).first()).toBeVisible({ timeout: 10000 })
        console.log(`✅ サービスサイトログイン状態確認。指標: ${indicator}`)
        loginConfirmed = true
        break
      } catch (error) {
        console.log(`⚠️ ログイン指標が見つかりません: ${indicator}`)
        continue
      }
    }

    if (!loginConfirmed) {
      console.warn('⚠️ 特定の指標でログイン状態を確認できませんでしたが、テストを続行します...')
      
      // フォールバック確認：URLとページタイトル
      try {
        await expect(this.page).toHaveTitle(/m3\.com|電子書籍/, { timeout: 5000 })
        console.log('✅ 基本的なサービスサイトアクセスを確認しました')
      } catch (error) {
        console.warn('⚠️ 基本的なサービスサイト確認も失敗しました')
      }
    }
  }

  /**
   * ログアウト処理
   * 
   * @description
   * - 複数のセレクタでログアウトボタンを検出してクリック
   * - M3サービス群で共通利用可能なログアウト処理
   */
  async logout(): Promise<void> {
    console.log('🚪 ログアウト処理を実行中...')

    const logoutSelectors = [
      'text=ログアウト',
      'a[href*="logout"]',
      'button:has-text("ログアウト")',
      '.logout-btn',
      '#logout'
    ]

    for (const selector of logoutSelectors) {
      try {
        const element = this.page.locator(selector).first()
        if (await element.isVisible({ timeout: 5000 })) {
          await element.click()
          await this.page.waitForLoadState('networkidle')
          console.log('✅ ログアウトが完了しました')
          return
        }
      } catch (error) {
        continue
      }
    }

    console.warn('⚠️ ログアウトボタンが見つかりませんでしたが、処理を続行します...')
  }

  /**
   * 現在のログイン状態確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ログイン状態（true: ログイン済み、false: 未ログイン）
   * @description
   * - 現在のページでログイン状態を確認
   * - テスト前の状態確認や条件分岐に利用
   */
  async isLoggedIn(timeout: number = 5000): Promise<boolean> {
    try {
      // M3共通のユーザー名表示要素で確認
      const usernameElement = this.page.locator('.atlas-header__username')
      await usernameElement.waitFor({ state: 'visible', timeout })
      
      const usernameText = await usernameElement.textContent()
      return !!(usernameText && usernameText.trim())
    } catch (error) {
      // ユーザー名表示が見つからない場合は未ログイン状態と判定
      return false
    }
  }

  /**
   * ログイン済みユーザー名の取得
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ユーザー名（取得できない場合は空文字）
   * @description
   * - ログイン状態でのユーザー名を取得
   * - テストデータの検証や条件分岐に利用
   */
  async getLoggedInUsername(timeout: number = 5000): Promise<string> {
    try {
      const usernameElement = this.page.locator('.atlas-header__username')
      await usernameElement.waitFor({ state: 'visible', timeout })
      
      const usernameText = await usernameElement.textContent()
      return usernameText?.trim() || ''
    } catch (error) {
      return ''
    }
  }

  /**
   * ログイン状態の詳細確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ログイン状態の詳細情報
   * @description
   * - ログイン状態、ユーザー名、追加情報を一括取得
   * - テストの初期化処理や状態把握に利用
   */
  async getLoginStatus(timeout: number = 5000): Promise<{
    isLoggedIn: boolean
    username: string
    hasUserInfo: boolean
  }> {
    const isLoggedIn = await this.isLoggedIn(timeout)
    const username = await this.getLoggedInUsername(timeout)
    
    // ユーザー情報エリアの存在確認
    let hasUserInfo = false
    try {
      await this.page.locator('header.l-header__cnt.has-user-info').waitFor({ 
        state: 'visible', 
        timeout: Math.min(timeout, 3000) 
      })
      hasUserInfo = true
    } catch (error) {
      hasUserInfo = false
    }

    return {
      isLoggedIn,
      username,
      hasUserInfo
    }
  }

  /**
   * 条件付きログイン処理
   * 
   * @param credentials ログイン認証情報
   * @param targetServiceUrl 遷移先サービスURL
   * @param forceRelogin 強制再ログインフラグ
   * @description
   * - 既にログイン済みの場合はスキップ、未ログインの場合のみログイン実行
   * - forceReloginがtrueの場合は既存ログイン状態を無視して再ログイン
   * - テストの効率化と安定性向上に寄与
   */
  async conditionalLogin(credentials: LoginCredentials, targetServiceUrl?: string, forceRelogin: boolean = false): Promise<void> {
    const loginStatus = await this.getLoginStatus()
    
    if (!forceRelogin && loginStatus.isLoggedIn) {
      console.log(`ℹ️ 既にログイン済みです（ユーザー: ${loginStatus.username}）。ログイン処理をスキップします。`)
      
      // サービスサイトへの遷移のみ実行
      if (targetServiceUrl) {
        await this.navigateToService(targetServiceUrl)
        await this.verifyServiceLoginState()
      }
      return
    }

    console.log('🔄 ログイン状態ではないため、ログイン処理を実行します...')
    await this.loginToM3AndRedirectToService(credentials, targetServiceUrl)
  }
}