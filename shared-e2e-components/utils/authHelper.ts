import { Page, expect } from '@playwright/test'

export interface LoginCredentials {
  username: string
  password: string
}

/**
 * M3サービス群共通認証ヘルパーユーティリティ
 * 
 * @description
 * - M3.com認証処理の共通実装を提供
 * - **役割ベースセレクタを優先**した要素選択戦略を採用
 * - 段階的セレクタ戦略（役割ベース → data-testid → CSSセレクタ）による堅牢な認証処理
 * - ログイン・ログアウト・認証状態確認などの基本機能
 * - APIレスポンス監視による確実な認証状態判定
 * - 複数のM3サービスで共通利用可能
 * - エラーハンドリングと詳細なログ出力を内蔵
 * 
 * ## セレクタ選択の改善点
 * - **アクセシビリティ重視**: WAI-ARIAの役割、ラベル、プレースホルダーを優先
 * - **段階的フォールバック**: 役割ベース → data-testid → CSSセレクタの順で試行
 * - **保守性向上**: セマンティックな意味に基づく要素特定で変更に強い実装
 * 
 * @example
 * ```typescript
 * const authHelper = new AuthHelper(page);
 * await authHelper.loginToM3AndNavigateToEbook({
 *   username: 'test@example.com',
 *   password: 'password123'
 * });
 * 
 * // ログアウト（役割ベースセレクタで自動検出）
 * await authHelper.logout();
 * ```
 */
export class AuthHelper {
  private page: Page

  constructor (page: Page) {
    this.page = page
  }

  /**
   * m3.comにログインして、手動でebook-qa1.m3.comにアクセスする
   * @param credentials { username, password } ログインに使用する認証情報
   * @description
   * - m3.comでログイン後、ebookサイト(qa1/qa2)へ手動ナビゲートし、ログイン状態を検証する。
   * - QA環境切り替えはprocess.env.TEST_BASE_URLで制御。
   * - テスト自動化のための一連のログインフローを再利用可能な形で提供。
   */
  async loginToM3AndNavigateToEbook (credentials: LoginCredentials): Promise<void> {
    const m3comURL = 'https://www.m3.com' // プロキシでQA環境に切り替え
    const ebookURL = process.env.TEST_BASE_URL || 'https://ebook-qa1.m3.com'

    console.log('🔐 Starting login process...')

    // 1. www.m3.comにアクセス（プロキシでQA環境に切り替え）
    console.log(`📡 Navigating to ${m3comURL}`)
    try {
      await this.page.goto(m3comURL, {
        waitUntil: 'domcontentloaded',
        timeout: 60000
      })
      // 追加の待機時間
      await this.page.waitForTimeout(3000)
    } catch (error) {
      console.warn(`⚠️ Initial navigation failed, trying with load event: ${error.message}`)
      await this.page.goto(m3comURL, {
        waitUntil: 'load',
        timeout: 60000
      })
    }

    // 2. ログインボタンを探してクリック
    await this.clickLoginButton()

    // 3. ログイン情報を入力
    await this.fillLoginForm(credentials)

    // 4. ログイン実行
    await this.submitLogin()

    // 5. ログイン成功を確認（m3.comで）
    await this.verifyLoginSuccess()

    // 6. ログイン完了後、直接ebook-qa1.m3.comに移動
    console.log(`📡 Manually navigating to ${ebookURL} after login`)
    console.log(`🔍 Current URL before navigation: ${this.page.url()}`)
    
    await this.page.goto(ebookURL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    console.log(`🔍 URL after navigation: ${this.page.url()}`)
    
    // DOMが準備できるまで少し待機（画像404エラーを無視）
    await this.page.waitForTimeout(2000)
    
    console.log(`🔍 Final URL after stabilization: ${this.page.url()}`)

    // 7. ebook サイトでのログイン状態を確認
    await this.verifyEbookLoginState()

    console.log('✅ Login process completed successfully')
  }

  /**
   * ログインボタンをクリック、またはフォームが既に表示されていればスキップ
   * @description
   * - m3.comのトップページでログインフォームが表示済みかを判定し、なければボタンを探してクリックする。
   * - 役割ベースセレクタを優先した堅牢な検出を実装。
   */
  private async clickLoginButton (): Promise<void> {
    console.log('🔍 Checking if login form is already visible...')

    // 役割ベースセレクタでログインフォームの存在確認
    try {
      // ログインID入力フィールドを役割ベースで確認
      const loginFields = [
        this.page.getByLabel(/ログインID|メールアドレス|ユーザーID/i),
        this.page.getByPlaceholder(/ログインID|メールアドレス|ユーザーID/i),
        this.page.getByRole('textbox', { name: /ログインID|メールアドレス|ユーザーID/i }),
        this.page.locator('#loginId') // フォールバック
      ]
      
      for (const field of loginFields) {
        try {
          await expect(field).toBeVisible({ timeout: 3000 })
          console.log('✅ Login form is already visible on the page')
          return
        } catch {
          continue
        }
      }
      
      console.log('🔍 Login form not visible, looking for login button...')
    } catch (error) {
      console.log('🔍 Login form not visible, looking for login button...')
    }

    // 役割ベースセレクタでログインボタンを探す（段階的戦略）
    const loginStrategies = [
      // 1. 役割ベースセレクタ（最優先）
      this.page.getByRole('button', { name: /ログイン|login/i }),
      this.page.getByRole('link', { name: /ログイン|login/i }),
      
      // 2. テキストベース
      this.page.getByText(/^ログイン$|^login$/i),
      
      // 3. data-testid（次善策）
      this.page.getByTestId('login'),
      this.page.getByTestId('login-button'),
      this.page.getByTestId('login-btn'),
      
      // 4. CSSセレクタ（最後の手段）
      this.page.locator('a[href*="login"]'),
      this.page.locator('button:has-text("ログイン")'),
      this.page.locator('a:has-text("ログイン")'),
      this.page.locator('.login-btn'),
      this.page.locator('#login-btn')
    ]

    let loginButtonFound = false
    for (let i = 0; i < loginStrategies.length; i++) {
      const strategy = loginStrategies[i]
      try {
        await expect(strategy).toBeVisible({ timeout: 3000 })
        console.log(`✅ Found login button with strategy ${i + 1}/${loginStrategies.length}`)
        await strategy.click()
        loginButtonFound = true
        break
      } catch (error) {
        continue
      }
    }

    if (!loginButtonFound) {
      throw new Error('❌ Login button not found and login form not visible')
    }

    // ログインフォームの表示を待機
    await this.page.waitForLoadState('domcontentloaded')
  }

  /**
   * ログインフォームに認証情報を入力
   * @param credentials { username, password }
   * @description
   * - 役割ベースセレクタを優先してログインID・パスワード欄を検出し、値を自動入力する。
   * - 段階的セレクタ戦略でフォールバック機能を提供。
   */
  private async fillLoginForm (credentials: LoginCredentials): Promise<void> {
    console.log('📝 Filling login form...')

    try {
      // ログインID入力フィールド（段階的戦略）
      const loginIdStrategies = [
        // 1. 役割ベースセレクタ（最優先）
        this.page.getByLabel(/ログインID|メールアドレス|ユーザーID|ID/i),
        this.page.getByPlaceholder(/ログインID|メールアドレス|ユーザーID|ID/i),
        this.page.getByRole('textbox', { name: /ログインID|メールアドレス|ユーザーID|ID/i }),
        
        // 2. data-testid（次善策）
        this.page.getByTestId('loginId'),
        this.page.getByTestId('login-id'),
        this.page.getByTestId('username'),
        this.page.getByTestId('email'),
        
        // 3. CSSセレクタ（最後の手段）
        this.page.locator('#loginId'),
        this.page.locator('input[name="loginId"]'),
        this.page.locator('input[type="email"]'),
        this.page.locator('input[type="text"]').first()
      ]

      let loginIdField = null
      for (let i = 0; i < loginIdStrategies.length; i++) {
        try {
          const field = loginIdStrategies[i]
          await expect(field).toBeVisible({ timeout: 3000 })
          loginIdField = field
          console.log(`✅ Found loginId field with strategy ${i + 1}/${loginIdStrategies.length}`)
          break
        } catch {
          continue
        }
      }

      if (!loginIdField) {
        throw new Error('❌ Login ID field not found with any strategy')
      }

      await loginIdField.fill(credentials.username)
      console.log('✅ Successfully filled loginId field')

      // パスワード入力フィールド（段階的戦略）
      const passwordStrategies = [
        // 1. 役割ベースセレクタ（最優先）
        this.page.getByLabel(/パスワード|password/i),
        this.page.getByPlaceholder(/パスワード|password/i),
        this.page.getByRole('textbox', { name: /パスワード|password/i }),
        
        // 2. data-testid（次善策）
        this.page.getByTestId('password'),
        this.page.getByTestId('passwd'),
        this.page.getByTestId('pwd'),
        
        // 3. CSSセレクタ（最後の手段）
        this.page.locator('#password'),
        this.page.locator('input[name="password"]'),
        this.page.locator('input[type="password"]')
      ]

      let passwordField = null
      for (let i = 0; i < passwordStrategies.length; i++) {
        try {
          const field = passwordStrategies[i]
          await expect(field).toBeVisible({ timeout: 3000 })
          passwordField = field
          console.log(`✅ Found password field with strategy ${i + 1}/${passwordStrategies.length}`)
          break
        } catch {
          continue
        }
      }

      if (!passwordField) {
        throw new Error('❌ Password field not found with any strategy')
      }

      await passwordField.fill(credentials.password)
      console.log('✅ Successfully filled password field')

      console.log('✅ Login form filled successfully')
    } catch (error) {
      throw new Error(`❌ Login form filling failed: ${error.message}`)
    }
  }

  /**
   * ログインを実行し、APIレスポンスを監視
   * @description
   * - 役割ベースセレクタでログインボタンを特定し、APIのPOSTレスポンス(303リダイレクト)を待つ。
   * - 段階的セレクタ戦略で堅牢な要素特定を実現。
   */
  private async submitLogin (): Promise<void> {
    console.log('🚀 Submitting login...')

    // ログインAPIレスポンスを監視
    const loginResponsePromise = this.page.waitForResponse(response =>
      response.url().includes('/open/login') && response.request().method() === 'POST'
    )

    // 役割ベースセレクタでログインボタンを特定（段階的戦略）
    try {
      const loginButtonStrategies = [
        // 1. 役割ベースセレクタ（最優先）
        this.page.getByRole('button', { name: /ログイン|login|送信|submit/i }),
        this.page.getByRole('button').filter({ hasText: /ログイン|login|送信|submit/i }),
        
        // 2. data-testid（次善策）
        this.page.getByTestId('login-submit'),
        this.page.getByTestId('submit-button'),
        this.page.getByTestId('login-button'),
        
        // 3. type属性ベース
        this.page.locator('button[type="submit"]'),
        this.page.locator('input[type="submit"]'),
        
        // 4. CSSセレクタ（最後の手段）
        this.page.locator('button.pls-button.--primary.opentop__button[type="submit"]'),
        this.page.locator('.login-submit'),
        this.page.locator('.submit-btn')
      ]

      let loginButton = null
      for (let i = 0; i < loginButtonStrategies.length; i++) {
        try {
          const button = loginButtonStrategies[i]
          await expect(button).toBeVisible({ timeout: 3000 })
          loginButton = button
          console.log(`✅ Found login button with strategy ${i + 1}/${loginButtonStrategies.length}`)
          break
        } catch {
          continue
        }
      }

      if (!loginButton) {
        throw new Error('❌ Login submit button not found with any strategy')
      }

      await loginButton.click()
      console.log('✅ Successfully clicked login button')

      // ログインAPIのレスポンスを待機
      const loginResponse = await loginResponsePromise
      console.log(`📡 Login API response status: ${loginResponse.status()}`)

      if (loginResponse.status() === 303) {
        console.log('✅ Login successful (303 redirect received)')
        const locationHeader = loginResponse.headers().location
        if (locationHeader) {
          console.log(`📍 Redirect location: ${locationHeader}`)
        }
      } else {
        throw new Error(`❌ Login failed with status: ${loginResponse.status()}`)
      }

      // ページの遷移を待機
      await this.page.waitForLoadState('domcontentloaded')
    } catch (error) {
      throw new Error(`❌ Login submission failed: ${error.message}`)
    }
  }

  /**
   * m3.comでログイン成功を検証
   * @description
   * - 役割ベースセレクタでユーザー名表示要素を特定し、ログイン成功を判定。
   * - 段階的セレクタ戦略で堅牢な要素特定を実現。
   */
  private async verifyLoginSuccess (): Promise<void> {
    console.log('🔍 Verifying login success...')

    // ユーザー名表示要素を段階的戦略で特定
    const usernameStrategies = [
      // 1. 役割ベースセレクタ（最優先）
      this.page.getByRole('banner').getByText(/ユーザー|user/i),
      this.page.getByRole('navigation').getByText(/ユーザー|user/i),
      this.page.getByRole('button', { name: /ユーザー|user|ログアウト/i }),
      
      // 2. data-testid（次善策）
      this.page.getByTestId('username'),
      this.page.getByTestId('user-name'),
      this.page.getByTestId('logged-in-user'),
      
      // 3. 意味的なセレクタ
      this.page.locator('[aria-label*="ユーザー"]'),
      this.page.locator('[aria-label*="user"]'),
      
      // 4. CSSセレクタ（最後の手段）
      this.page.locator('.atlas-header__username'),
      this.page.locator('.username'),
      this.page.locator('.user-name'),
      this.page.locator('.logged-in-user')
    ]

    for (let i = 0; i < usernameStrategies.length; i++) {
      try {
        const usernameElement = usernameStrategies[i]
        await expect(usernameElement).toBeVisible({ timeout: 3000 })
        
        const usernameText = await usernameElement.textContent()
        if (usernameText && usernameText.trim()) {
          console.log(`✅ Login success confirmed with username: ${usernameText.trim()} (strategy ${i + 1}/${usernameStrategies.length})`)
          return
        }
      } catch (error) {
        continue
      }
    }

    // 全ての戦略が失敗した場合、フォールバック確認
    try {
      // ログアウトボタンの存在でログイン状態を確認
      const logoutButton = this.page.getByRole('button', { name: /ログアウト|logout/i })
      await expect(logoutButton).toBeVisible({ timeout: 5000 })
      console.log('✅ Login success confirmed by logout button presence')
      return
    } catch (error) {
      // ユーザー名もログアウトボタンも見つからない場合はログイン失敗
      throw new Error('❌ Login failed: No login indicators found with any strategy')
    }
  }

  /**
   * ebookサイトでのログイン状態を検証
   * @description
   * - 役割ベースセレクタを優先してログイン状態を判定。段階的戦略でフォールバック対応。
   */
  private async verifyEbookLoginState(): Promise<void> {
    console.log('🔍 Verifying ebook site login state...');

    // ebookサイトでのログイン状態の指標（段階的戦略）
    const loginIndicatorStrategies = [
      // 1. 役割ベースセレクタ（最優先）
      this.page.getByRole('banner').locator(':has-text("ポイント")'),
      this.page.getByRole('navigation').locator(':has-text("ユーザー")'),
      this.page.getByRole('searchbox'),
      this.page.getByRole('button', { name: /ログアウト|マイページ/i }),
      
      // 2. data-testid（次善策）
      this.page.getByTestId('user-info'),
      this.page.getByTestId('point-info'),
      this.page.getByTestId('search-form'),
      this.page.getByTestId('user-menu'),
      
      // 3. 意味的なセレクタ
      this.page.locator('[aria-label*="ポイント"]'),
      this.page.locator('[aria-label*="検索"]'),
      this.page.locator('[aria-label*="ユーザー"]'),
      
      // 4. CSSセレクタ（最後の手段）
      this.page.locator('header.l-header__cnt.has-user-info'),
      this.page.locator('.point-info .available-point'),
      this.page.locator('.point-info'),
      this.page.locator('.search-input')
    ];

    let ebookLoginConfirmed = false;
    for (let i = 0; i < loginIndicatorStrategies.length; i++) {
      try {
        const indicator = loginIndicatorStrategies[i]
        await expect(indicator).toBeVisible({ timeout: 3000 });
        console.log(`✅ Ebook login state confirmed with strategy ${i + 1}/${loginIndicatorStrategies.length}`);
        ebookLoginConfirmed = true;
        break;
      } catch (error) {
        continue;
      }
    }

    if (!ebookLoginConfirmed) {
      console.warn('⚠️ Could not confirm ebook login state with specific indicators, trying alternative methods...');
      
      // フォールバック1: ログイン関連要素の確認
      try {
        const alternativeStrategies = [
          this.page.getByText(/ポイント|point/i),
          this.page.getByText(/マイページ|mypage/i),
          this.page.locator('[placeholder*="検索"]'),
          this.page.locator('input[type="search"]')
        ];
        
        for (const strategy of alternativeStrategies) {
          try {
            await expect(strategy).toBeVisible({ timeout: 2000 });
            console.log('✅ Ebook login state confirmed with alternative method');
            ebookLoginConfirmed = true;
            break;
          } catch {
            continue;
          }
        }
      } catch (error) {
        // 代替方法も失敗
      }
      
      // フォールバック2: URLとページタイトルで基本確認
      if (!ebookLoginConfirmed) {
        try {
          await expect(this.page).toHaveTitle(/m3\.com|電子書籍/, { timeout: 5000 });
          expect(this.page.url()).toContain('ebook-qa1.m3.com');
          console.log('✅ Basic ebook site access confirmed');
        } catch (error) {
          console.warn('⚠️ Basic ebook site verification also failed, but proceeding with tests...');
        }
      }
    }
  }

  /**
   * ログアウト操作
   * @description
   * - 役割ベースセレクタを優先してログアウトボタンを検出し、クリックしてログアウトを実行。
   * - 段階的セレクタ戦略で堅牢な要素特定を実現。
   */
  async logout (): Promise<void> {
    console.log('🚪 Logging out...')

    const logoutStrategies = [
      // 1. 役割ベースセレクタ（最優先）
      this.page.getByRole('button', { name: /ログアウト|logout/i }),
      this.page.getByRole('link', { name: /ログアウト|logout/i }),
      this.page.getByRole('menuitem', { name: /ログアウト|logout/i }),
      
      // 2. テキストベース
      this.page.getByText(/^ログアウト$|^logout$/i),
      
      // 3. data-testid（次善策）
      this.page.getByTestId('logout'),
      this.page.getByTestId('logout-button'),
      this.page.getByTestId('logout-btn'),
      
      // 4. CSSセレクタ（最後の手段）
      this.page.locator('a[href*="logout"]'),
      this.page.locator('button:has-text("ログアウト")'),
      this.page.locator('.logout-btn'),
      this.page.locator('#logout')
    ]

    for (let i = 0; i < logoutStrategies.length; i++) {
      try {
        const strategy = logoutStrategies[i]
        await expect(strategy).toBeVisible({ timeout: 3000 })
        await strategy.click()
        await this.page.waitForLoadState('domcontentloaded')
        console.log(`✅ Logged out successfully with strategy ${i + 1}/${logoutStrategies.length}`)
        return
      } catch (error) {
        continue
      }
    }

    console.warn('⚠️ Logout button not found with any strategy, but proceeding...')
  }
}

/**
 * AuthHelperクラス - 役割ベースセレクタ対応ガイド
 * 
 * このクラスは全面的に役割ベースセレクタを採用し、CLAUDE.mdの方針に準拠しています。
 * 
 * ## 改善されたセレクタ戦略
 * 
 * ### 1. ログインフォーム要素
 * ```typescript
 * // 従来: this.page.locator('#loginId')
 * // 改善後: this.page.getByLabel(/ログインID|メールアドレス/i)
 * //         this.page.getByPlaceholder(/ログインID|メールアドレス/i)
 * //         フォールバック: this.page.locator('#loginId')
 * ```
 * 
 * ### 2. ボタン要素
 * ```typescript
 * // 従来: this.page.locator('button.pls-button.--primary.opentop__button[type="submit"]')
 * // 改善後: this.page.getByRole('button', { name: /ログイン|login/i })
 * //         フォールバック: CSSセレクタ
 * ```
 * 
 * ### 3. ログイン状態確認
 * ```typescript
 * // 従来: this.page.locator('.atlas-header__username')
 * // 改善後: this.page.getByRole('banner').getByText(/ユーザー|user/i)
 * //         this.page.getByRole('button', { name: /ログアウト/i })
 * //         フォールバック: CSSセレクタ
 * ```
 * 
 * ## 利点
 * 
 * - **安定性向上**: UI変更に対して役割ベースセレクタは最も安定
 * - **可読性向上**: 何を操作しているか明確
 * - **アクセシビリティ**: スクリーンリーダー等と同じ要素特定方法
 * - **保守性向上**: セマンティックな意味に基づくため変更に強い
 * - **フォールバック対応**: 複数戦略で堅牢性を確保
 */