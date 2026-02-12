import { Page } from '@playwright/test'

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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`⚠️ 初期アクセスが失敗、loadイベントで再試行: ${errorMessage}`)
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
      const loginIdField = this.page.getByPlaceholder('ログインID')
      await loginIdField.waitFor({ state: 'visible', timeout: 10000 })
      console.log('✅ ログインフォームが既に表示されています')
      return
    } catch (error: unknown) {
      console.log('🔍 ログインフォームが非表示、ログインボタンを探索中...')
    }

    // ログインボタンをクリックしてフォームを表示
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
      } catch (error: unknown) {
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
      // ログインID入力フィールド（placeholder-basedセレクタ）
      const loginIdField = this.page.getByPlaceholder('ログインID')
      await loginIdField.waitFor({ state: 'visible', timeout: 10000 })
      await loginIdField.fill(credentials.username)
      console.log('✅ ログインIDを入力しました')

      // パスワード入力フィールド（placeholder-basedセレクタ）
      const passwordField = this.page.getByPlaceholder('パスワード')
      await passwordField.waitFor({ state: 'visible', timeout: 5000 })
      await passwordField.fill(credentials.password)
      console.log('✅ パスワードを入力しました')

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`❌ ログインフォームの入力に失敗しました: ${errorMessage}`)
    }
  }

  /**
   * ログインフォームの送信とAPIレスポンス監視
   * @private
   */
  private async submitLoginForm(): Promise<void> {
    console.log('🚀 ログインを実行中...')

    // ログインAPIレスポンスの監視設定（PC版・SP版両対応）
    const loginResponsePromise = this.page.waitForResponse(
      response =>
        response.url().includes('/login') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 303),
      { timeout: 30000 }
    )

    try {
      // ログインボタンを特定（役割ベースセレクタを優先）
      const loginButton = this.page.getByRole('button', { name: /ログイン/ })

      await loginButton.waitFor({ state: 'visible', timeout: 10000 })
      await loginButton.click()
      console.log('✅ ログインボタンをクリックしました')

      // APIレスポンスの確認
      const loginResponse = await loginResponsePromise
      const status = loginResponse.status()
      console.log(`📡 ログインAPIレスポンス: ${status}`)

      // ステータスコード200または303を成功と見なす
      if (status === 303) {
        console.log('✅ ログイン成功（303リダイレクト受信）')
        const locationHeader = loginResponse.headers().location
        if (locationHeader) {
          console.log(`📍 リダイレクト先: ${locationHeader}`)
        }
      } else if (status === 200) {
        console.log('✅ ログイン成功（200 OK受信）')
      } else {
        throw new Error(`❌ ログインが失敗しました。ステータス: ${status}`)
      }

      // ページ遷移の完了を待機
      await this.page.waitForLoadState('domcontentloaded')

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`❌ ログイン送信処理でエラーが発生しました: ${errorMessage}`)
    }
  }

  /**
   * M3.comでのログイン成功確認
   * @private
   */
  private async verifyM3LoginSuccess(): Promise<void> {
    console.log('🔍 M3.comでのログイン成功状態を確認中...')

    try {
      // M3.comヘッダーのユーザー名表示を確認（役割ベースセレクタを優先）
      // ユーザー名は「〇〇先生」または「〇〇さん」の形式で表示される
      const usernameElement = this.page.getByText(/先生|さん/).first()

      await usernameElement.waitFor({ state: 'visible', timeout: 10000 })

      const usernameText = await usernameElement.textContent()
      if (usernameText && usernameText.trim()) {
        console.log(`✅ M3.comログイン成功確認。ユーザー名: ${usernameText.trim()}`)
        return
      }
    } catch (error: unknown) {
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
      // 1. ユーザー名をクリックしてドロップダウンを開く（役割ベースセレクタを優先）
      const userNameButton = this.page.getByText(/先生|さん/).first()
      await userNameButton.waitFor({ state: 'visible', timeout: 10000 })
      await userNameButton.click()
      console.log('✅ ユーザー情報ドロップダウンを開きました')

      // 2. ドロップダウンが表示されるまで待機
      const userInfoBox = this.page.getByRole('menu')
      await userInfoBox.waitFor({ state: 'visible', timeout: 5000 })
      console.log('✅ ユーザー情報ボックスが表示されました')

      // 3. ログアウトリンクをクリック（役割ベースセレクタを優先）
      const logoutLink = this.page.getByRole('link', { name: 'ログアウト' })
      await logoutLink.waitFor({ state: 'visible', timeout: 5000 })
      await logoutLink.click()
      console.log('✅ ログアウトボタンをクリックしました')

      // 4. ページ遷移の完了を待機
      await this.page.waitForLoadState('domcontentloaded', { timeout: 30000 })
      console.log('✅ ログアウト処理が正常に完了しました')

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`⚠️ ユーザー情報ドロップダウン経由のログアウトに失敗しました: ${errorMessage}`)
      
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