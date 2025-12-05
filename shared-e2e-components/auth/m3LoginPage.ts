import { Page, Locator } from '@playwright/test'

/**
 * M3.comログイン認証情報のインターフェース
 */
export interface LoginCredentials {
  username: string
  password: string
}

/**
 * M3.comログイン処理の共通コンポーネント
 *
 * @description
 * - M3サービス群で共通利用されるログイン処理を提供
 * - 純粋なM3.com認証処理に特化
 * - APIレスポンス監視による確実なログイン成功判定
 * - 堅牢なエラーハンドリングとログ出力
 * - 各サービス固有の遷移処理は含まない
 */
export class M3LoginPage {
  readonly page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * 段階的セレクタ戦略を実行するヘルパー関数
   * @private
   * @param strategies セレクタ戦略の配列（優先順位順）
   * @returns 最初に成功したLocator
   */
  private trySelectors(strategies: (() => Locator)[]): Locator {
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    // 全て失敗した場合は最後の戦略を返す
    return strategies[strategies.length - 1]()
  }

  /**
   * M3.comでのログイン処理
   *
   * @param credentials ログイン認証情報
   * @description
   * - M3.comサイトでの認証処理のみを実行
   * - サービス固有の遷移処理は含まない
   * - 各サービスのテストで認証基盤として利用
   * - ログイン後CA広告のスキップ処理を含む
   */
  async performLogin(credentials: LoginCredentials): Promise<void> {
    console.log('🔐 M3ログイン処理を開始中...')

    // 1. m3.comにアクセス
    await this.navigateToM3()

    // 2. ログイン情報入力と実行
    await this.executeLogin(credentials)

    // 3. ログイン成功確認
    await this.verifyM3LoginSuccess()

    // 4. ログイン後CA広告スキップ
    await this.skipPostLoginCA()

    console.log('✅ M3ログイン処理が正常に完了しました')
  }

  /**
   * m3.comへのナビゲーション
   * @private
   */
  private async navigateToM3(): Promise<void> {
    const m3comURL = 'https://www.m3.com'
    console.log(`📡 ${m3comURL} にアクセス中...`)
    
    try {
      await this.page.goto(m3comURL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })
    } catch (error) {
      console.warn(`⚠️ 初期アクセスが失敗、loadイベントで再試行: ${error.message}`)
      await this.page.goto(m3comURL, {
        waitUntil: 'load',
        timeout: 60000
      })
    }
  }

  /**
   * ログイン情報の入力と実行
   * @private
   */
  private async executeLogin(credentials: LoginCredentials): Promise<void> {
    // ログインフォームの表示確認
    await this.ensureLoginFormVisible()

    // 認証情報の入力
    await this.fillLoginCredentials(credentials)

    // ログイン実行
    await this.submitLoginForm()
  }

  /**
   * ログインフォームの表示確認
   * @private
   */
  private async ensureLoginFormVisible(): Promise<void> {
    console.log('🔍 ログインフォームの表示状態を確認中...')

    try {
      // 役割ベースセレクタでログインフォームの存在確認
      const loginIdField = this.trySelectors([
        () => this.page.getByLabel(/ログインID|メールアドレス|ユーザーID/i),
        () => this.page.getByPlaceholder(/ログインID|メールアドレス|ユーザーID/i),
        () => this.page.getByRole('textbox', { name: /ログインID|メールアドレス|ユーザーID/i }),
        () => this.page.locator('#loginId') // フォールバック
      ])
      await loginIdField.waitFor({ state: 'visible', timeout: 10000 })
      console.log('✅ ログインフォームが既に表示されています')
      return
    } catch (error) {
      console.log('🔍 ログインフォームが非表示、ログインボタンを探索中...')
    }

    // 役割ベースセレクタでログインボタンを探す（段階的戦略）
    const loginStrategies = [
      // 1. 役割ベースセレクタ（最優先）
      () => this.page.getByRole('button', { name: /ログイン|login/i }),
      () => this.page.getByRole('link', { name: /ログイン|login/i }),

      // 2. テキストベース
      () => this.page.getByText(/^ログイン$|^login$/i),

      // 3. data-testid（次善策）
      () => this.page.getByTestId('login'),
      () => this.page.getByTestId('login-button'),
      () => this.page.getByTestId('login-btn'),

      // 4. CSSセレクタ（最後の手段）
      () => this.page.locator('a[href*="login"]'),
      () => this.page.locator('button:has-text("ログイン")'),
      () => this.page.locator('a:has-text("ログイン")'),
      () => this.page.locator('.login-btn'),
      () => this.page.locator('#login-btn')
    ]

    let loginButtonFound = false
    for (let i = 0; i < loginStrategies.length; i++) {
      try {
        const element = loginStrategies[i]()
        await element.waitFor({ state: 'visible', timeout: 3000 })
        console.log(`✅ ログインボタンを発見（戦略 ${i + 1}/${loginStrategies.length}）`)
        await element.click()
        loginButtonFound = true
        break
      } catch (error) {
        continue
      }
    }

    if (!loginButtonFound) {
      throw new Error('❌ ログインボタンが見つからず、ログインフォームも表示されていません')
    }

    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * ログイン認証情報の入力
   * @private
   */
  private async fillLoginCredentials(credentials: LoginCredentials): Promise<void> {
    console.log('📝 ログイン情報を入力中...')

    try {
      // ログインID入力フィールド（段階的セレクタ戦略）
      const loginIdField = this.trySelectors([
        // 1. 役割ベースセレクタ（最優先）
        () => this.page.getByLabel(/ログインID|メールアドレス|ユーザーID|ID/i),
        () => this.page.getByPlaceholder(/ログインID|メールアドレス|ユーザーID|ID/i),
        () => this.page.getByRole('textbox', { name: /ログインID|メールアドレス|ユーザーID|ID/i }),

        // 2. data-testid（次善策）
        () => this.page.getByTestId('loginId'),
        () => this.page.getByTestId('login-id'),
        () => this.page.getByTestId('username'),
        () => this.page.getByTestId('email'),

        // 3. CSSセレクタ（最後の手段）
        () => this.page.locator('#loginId'),
        () => this.page.locator('input[name="loginId"]'),
        () => this.page.locator('input[type="email"]'),
        () => this.page.locator('input[type="text"]').first()
      ])

      await loginIdField.waitFor({ state: 'visible', timeout: 10000 })
      await loginIdField.fill(credentials.username)
      console.log('✅ ログインIDを入力しました')

      // パスワード入力フィールド（段階的セレクタ戦略）
      const passwordField = this.trySelectors([
        // 1. 役割ベースセレクタ（最優先）
        () => this.page.getByLabel(/パスワード|password/i),
        () => this.page.getByPlaceholder(/パスワード|password/i),
        () => this.page.getByRole('textbox', { name: /パスワード|password/i }),

        // 2. data-testid（次善策）
        () => this.page.getByTestId('password'),
        () => this.page.getByTestId('passwd'),
        () => this.page.getByTestId('pwd'),

        // 3. CSSセレクタ（最後の手段）
        () => this.page.locator('#password'),
        () => this.page.locator('input[name="password"]'),
        () => this.page.locator('input[type="password"]')
      ])

      await passwordField.waitFor({ state: 'visible', timeout: 5000 })
      await passwordField.fill(credentials.password)
      console.log('✅ パスワードを入力しました')

    } catch (error) {
      throw new Error(`❌ ログインフォームの入力に失敗しました: ${error.message}`)
    }
  }

  /**
   * ログインフォームの送信とAPIレスポンス監視
   * @private
   */
  private async submitLoginForm(): Promise<void> {
    console.log('🚀 ログインを実行中...')

    // ログインAPIレスポンスの監視設定
    const loginResponsePromise = this.page.waitForResponse(response =>
      response.url().includes('/open/login') && response.request().method() === 'POST'
    )

    try {
      // ログインボタンを段階的セレクタ戦略で特定
      const loginButton = this.trySelectors([
        // 1. 役割ベースセレクタ（最優先）
        () => this.page.getByRole('button', { name: /ログイン|login|送信|submit/i }),
        () => this.page.getByRole('button').filter({ hasText: /ログイン|login|送信|submit/i }),

        // 2. data-testid（次善策）
        () => this.page.getByTestId('login-submit'),
        () => this.page.getByTestId('submit-button'),
        () => this.page.getByTestId('login-button'),

        // 3. type属性ベース
        () => this.page.locator('button[type="submit"]'),
        () => this.page.locator('input[type="submit"]'),

        // 4. CSSセレクタ（最後の手段）
        () => this.page.locator('button.pls-button.--primary.opentop__button[type="submit"]'),
        () => this.page.locator('.login-submit'),
        () => this.page.locator('.submit-btn')
      ])

      await loginButton.waitFor({ state: 'visible', timeout: 10000 })
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
      await this.page.waitForLoadState('domcontentloaded')

    } catch (error) {
      throw new Error(`❌ ログイン送信処理でエラーが発生しました: ${error.message}`)
    }
  }

  /**
   * M3.comでのログイン成功確認
   * @private
   */
  private async verifyM3LoginSuccess(): Promise<void> {
    console.log('🔍 M3.comでのログイン成功状態を確認中...')

    try {
      // M3.comヘッダーのユーザー名表示を段階的セレクタ戦略で確認
      const usernameElement = this.trySelectors([
        // 1. 役割ベースセレクタ（最優先）
        () => this.page.getByRole('banner').getByText(/ユーザー|user/i),
        () => this.page.getByRole('navigation').getByText(/ユーザー|user/i),
        () => this.page.getByRole('button', { name: /先生|さん/ }),

        // 2. data-testid（次善策）
        () => this.page.getByTestId('username'),
        () => this.page.getByTestId('user-name'),
        () => this.page.getByTestId('logged-in-user'),

        // 3. 意味的なセレクタ
        () => this.page.locator('[aria-label*="ユーザー"]'),
        () => this.page.locator('[aria-label*="user"]'),

        // 4. CSSセレクタ（最後の手段）
        () => this.page.locator('.atlas-header__username'),
        () => this.page.locator('.username'),
        () => this.page.locator('.user-name'),
        () => this.page.locator('.logged-in-user')
      ])

      await usernameElement.waitFor({ state: 'visible', timeout: 10000 })

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
   * ログイン後のCA広告をスキップ
   * @private
   * @description
   * - ログイン後に表示される可能性のあるCA広告をスキップ
   * - 「スキップする」リンクが存在する場合のみクリック
   * - 存在しない場合はエラーにせず続行
   */
  private async skipPostLoginCA(): Promise<void> {
    try {
      await this.page
        .getByRole('link', { name: 'スキップする' })
        .click({ timeout: 300 })
      console.log('✅ ログイン後CAをスキップしました')
    } catch {
      // スキップする文言リンクが表示されない場合は何もしない
      console.log('ℹ️ ログイン後CAは表示されませんでした')
    }
  }

  /**
   * ログアウト処理
   * 
   * @description
   * - ユーザー情報ドロップダウンからログアウトを実行
   * - 実際のM3.comのDOM構造に対応した確実なログアウト処理
   */
  async logout(): Promise<void> {
    console.log('🚪 ログアウト処理を実行中...')

    try {
      // 1. ユーザー名をクリックしてドロップダウンを開く
      const userNameButton = this.page.locator('.atlas-header__name')
      await userNameButton.waitFor({ state: 'visible', timeout: 10000 })
      await userNameButton.click()
      console.log('✅ ユーザー情報ドロップダウンを開きました')

      // 2. ドロップダウンが表示されるまで待機
      const userInfoBox = this.page.locator('.atlas-header__infobox')
      await userInfoBox.waitFor({ state: 'visible', timeout: 5000 })
      console.log('✅ ユーザー情報ボックスが表示されました')

      // 3. ログアウトリンクをクリック
      // header_sample.htmlの構造に基づく正確なセレクタ
      const logoutLink = this.page.locator('.atlas-header__infobox a[onclick*="atlas-logout"]')
      await logoutLink.waitFor({ state: 'visible', timeout: 5000 })
      await logoutLink.click()
      console.log('✅ ログアウトボタンをクリックしました')

      // 4. ページ遷移の完了を待機
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 })
      console.log('✅ ログアウト処理が正常に完了しました')

    } catch (error) {
      console.warn(`⚠️ ユーザー情報ドロップダウン経由のログアウトに失敗しました: ${error.message}`)
      
      // フォールバック: 直接的なログアウト要素の検索
      console.log('🔄 フォールバックログアウト処理を試行中...')
      
      const fallbackSelectors = [
        'a[onclick*="atlas-logout"]',
        'form#atlas-logout a',
        'a[eop-contents="logout"]',
        'text=ログアウト'
      ]

      for (const selector of fallbackSelectors) {
        try {
          const element = this.page.locator(selector).first()
          if (await element.isVisible({ timeout: 3000 })) {
            await element.click()
            await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 })
            console.log(`✅ フォールバックログアウトが成功しました: ${selector}`)
            return
          }
        } catch (fallbackError) {
          continue
        }
      }

      console.warn('⚠️ 全てのログアウト方法が失敗しましたが、処理を続行します...')
    }
  }
}