import { Page, Locator } from '@playwright/test'
import { BasePage } from '../common/basePage'

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
export class M3LoginPage extends BasePage {
  readonly loginIdField: Locator
  readonly passwordField: Locator
  readonly loginButton: Locator
  readonly caContainer: Locator
  readonly skipLink: Locator
  readonly usernameElement: Locator
  readonly userInfoBox: Locator
  readonly logoutLink: Locator

  constructor(page: Page) {
    super(page)
    this.loginIdField = page.locator('[name="loginId"]')
    this.passwordField = page.locator('[name="password"]')
    this.loginButton = page.getByRole('button', { name: /ログイン/ })
    this.caContainer = page.locator('.m3_ca-container')
    this.skipLink = page.locator('.m3_li-sp-notsetting a:has-text("スキップする")')
    this.usernameElement = page.getByText(/先生|さん|様/).first()
    this.userInfoBox = page.getByRole('menu')
    this.logoutLink = page.getByRole('link', { name: 'ログアウト' })
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
    // 1. m3.comにアクセス
    await this.navigateToM3()

    // 2. ログイン情報入力と実行
    await this.executeLogin(credentials)

    // 3. ログイン成功確認
    await this.verifyM3LoginSuccess()

    // 4. ログイン後CA広告スキップ
    await this.skipPostLoginCA()
  }

  /**
   * m3.comへのナビゲーション
   * @private
   */
  private async navigateToM3(): Promise<void> {
    const m3comURL = 'https://www.m3.com'

    try {
      await this.page.goto(m3comURL, {
        waitUntil: 'domcontentloaded'
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`⚠️ 初期アクセスが失敗、loadイベントで再試行: ${errorMessage}`)
      await this.page.goto(m3comURL, {
        waitUntil: 'load'
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
    try {
      // ログインID入力フィールド（name属性ベースセレクタ）
      // 注: ログインページのUIによりplaceholderの有無が異なる
      //     （/open/login はplaceholderあり、/login?promotionCode=... はplaceholderなし）。
      //     name="loginId" はいずれのUIにも共通して存在するため、name属性ベースで統一する
      await this.loginIdField.waitFor({ state: 'visible' })
      return
    } catch (error: unknown) {
      // ログインフォームが非表示の場合、ログインボタンを探索
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
        if (await element.isVisible()) {
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
    try {
      // ログインID入力フィールド（name属性ベースセレクタ）
      await this.loginIdField.waitFor({ state: 'visible' })
      await this.loginIdField.fill(credentials.username)

      // パスワード入力フィールド（name属性ベースセレクタ）
      await this.passwordField.waitFor({ state: 'visible' })
      await this.passwordField.fill(credentials.password)

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
    // ログインAPIレスポンスの監視設定（PC版・SP版両対応）
    const loginResponsePromise = this.page.waitForResponse(
      response =>
        response.url().includes('/login') &&
        response.request().method() === 'POST' &&
        (response.status() === 200 || response.status() === 303)
    )

    try {
      await this.loginButton.waitFor({ state: 'visible' })
      await this.loginButton.click()

      // APIレスポンスの確認
      const loginResponse = await loginResponsePromise
      const status = loginResponse.status()

      // ステータスコード200または303を成功と見なす
      if (status !== 303 && status !== 200) {
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
    try {
      // M3.comヘッダーのユーザー名表示を確認（役割ベースセレクタを優先）
      // ユーザー名は「〇〇先生」「〇〇さん」または「〇〇様」の形式で表示される
      await this.usernameElement.waitFor({ state: 'visible' })

      const usernameText = await this.usernameElement.textContent()
      if (usernameText && usernameText.trim()) {
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
   * - CAモーダルが表示されるまで短時間待機し、表示された場合のみスキップ処理を実行
   * - PC版では .m3_li-sp-notsetting 内の「スキップする」リンクをクリック
   */
  private async skipPostLoginCA(): Promise<void> {
    try {
      // CAコンテナが表示されるか確認（短時間待機）
      await this.caContainer.waitFor({ state: 'visible', timeout: 3000 })

      if (await this.skipLink.isVisible()) {
        await this.skipLink.click()
        console.log('✅ ログイン後CAをスキップしました')

        // スキップ後のページ遷移を待機
        await this.page.waitForLoadState('domcontentloaded')
        return
      }
    } catch {
      // CAが表示されない、またはスキップリンクが見つからない場合
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
    try {
      // 1. ユーザー名をクリックしてドロップダウンを開く（役割ベースセレクタを優先）
      await this.usernameElement.waitFor({ state: 'visible' })
      await this.usernameElement.click()

      // 2. ドロップダウンが表示されるまで待機
      await this.userInfoBox.waitFor({ state: 'visible' })

      // 3. ログアウトリンクをクリック（役割ベースセレクタを優先）
      await this.logoutLink.waitFor({ state: 'visible' })
      await this.logoutLink.click()

      // 4. ページ遷移の完了を待機
      await this.page.waitForLoadState('domcontentloaded')

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`⚠️ ユーザー情報ドロップダウン経由のログアウトに失敗しました: ${errorMessage}`)

      // フォールバック: 直接的なログアウト要素の検索
      const fallbackSelectors = [
        'a[onclick*="atlas-logout"]',
        'form#atlas-logout a',
        'a[eop-contents="logout"]',
        'text=ログアウト'
      ]

      for (const selector of fallbackSelectors) {
        try {
          const element = this.page.locator(selector).first()
          if (await element.isVisible()) {
            await element.click()
            await this.page.waitForLoadState('domcontentloaded')
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

