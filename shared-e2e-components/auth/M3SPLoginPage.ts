import { Page } from '@playwright/test'
import { BasePage } from '../common/basePage'

/**
 * M3.com SPログイン認証情報のインターフェース
 */
export interface SPLoginCredentials {
  username: string
  password: string
}

/**
 * M3.com SPログインページ
 *
 * @description
 * - M3.com SP（スマートフォン）版でのログイン処理を提供
 * - SP専用のログインフォーム構造に対応
 * - APIレスポンス監視による確実なログイン成功判定
 * - ユーザー名表示確認によるログイン状態の検証
 * - m3LoginPage.tsと統一された設計パターン
 * - BasePage継承により共通機能を活用
 * - URL: 環境変数 SP_BASE_URL から取得（デフォルト: https://sp.m3.com/）
 */
export class M3SPLoginPage extends BasePage {
  constructor(page: Page) {
    super(page)
    // 環境変数からSP URLを取得（環境切り替え対応）
    this.url = process.env.SP_BASE_URL || 'https://sp.m3.com/'
  }

  /**
   * M3.com SPページへのナビゲート
   *
   * @description
   * - SP版のM3.comトップページへ遷移
   * - BasePageのnavigate()メソッドを活用
   */
  async navigate(): Promise<void> {
    console.log(`📡 M3.com SPページにアクセス中: ${this.url}`)
    await super.navigate()
    console.log('✅ M3.com SPページへのアクセスが完了しました')
  }

  /**
   * M3.com SPでのログイン処理
   *
   * @param credentials ログイン認証情報
   * @description
   * - M3.com SP版での認証処理を実行
   * - 既にログイン済みの場合は処理をスキップ
   * - ログイン後CA広告のスキップ処理を含む
   */
  async performLogin(credentials: SPLoginCredentials): Promise<void> {
    console.log('🔐 M3.com SPログイン処理を開始中...')

    // 1. SP版のm3.comにアクセス
    await this.navigateToSP()

    // 2. ログイン情報入力と実行
    await this.executeLogin(credentials)

    // 3. ログイン後CA広告スキップ
    await this.skipPostLoginCA()

    // 4. ログイン成功確認
    await this.verifySPLoginSuccess()

    console.log('✅ M3.com SPログイン処理が完了しました')
  }

  /**
   * 後方互換性のためのラッパーメソッド
   * @deprecated performLogin()を使用してください
   */
  async login(username: string, password: string): Promise<void> {
    await this.performLogin({ username, password })
  }

  /**
   * SP版m3.comへのナビゲーション
   * @private
   */
  private async navigateToSP(): Promise<void> {
    console.log(`📡 ${this.url} にアクセス中...`)

    try {
      await this.page.goto(this.url, {
        waitUntil: 'domcontentloaded'
      })
    } catch (error) {
      console.warn(`⚠️ 初期アクセスが失敗、loadイベントで再試行: ${error.message}`)
      await this.page.goto(this.url, {
        waitUntil: 'load'
      })
    }
  }

  /**
   * ログイン情報の入力と実行
   * @private
   */
  private async executeLogin(credentials: SPLoginCredentials): Promise<void> {
    // ページ読み込み完了を待機
    await this.page.waitForLoadState('domcontentloaded')

    // ログインフォームの表示確認（既にログイン済みかチェック）
    const shouldLogin = await this.ensureLoginFormVisible()
    if (!shouldLogin) {
      console.log('✅ 既にログイン済みです。ログイン処理をスキップします。')
      return
    }

    // 認証情報の入力
    await this.fillLoginCredentials(credentials)

    // ログイン実行
    await this.submitLoginForm()
  }

  /**
   * ログインフォームの表示確認（既にログイン済みかチェック）
   * @private
   * @returns ログインが必要な場合はtrue、既にログイン済みの場合はfalse
   */
  private async ensureLoginFormVisible(): Promise<boolean> {
    console.log('🔍 ログインフォームの表示状態を確認中...')

    // ログイン済みかどうかを確認（メニューボタンの存在で判定）
    try {
      const menuButton = this.page.getByRole('button', { name: 'メニュー' })
      const isVisible = await menuButton.isVisible()
      if (isVisible) {
        return false // 既にログイン済み
      }
    } catch (error) {
      console.log('🔍 メニューボタンが見つかりません。ログインフォームを確認します。')
    }

    // ログインフォームが表示されているか確認
    const loginIdField = this.page.getByRole('textbox').first()
    const loginFormExists = await loginIdField.isVisible().catch(() => false)

    if (!loginFormExists) {
      console.log('⚠️ ログインフォームが見つかりません。既にログイン済みの可能性があります。')
      return false // ログインフォームがない = 既にログイン済み
    }

    console.log('✅ ログインフォームが表示されています')
    return true // ログインが必要
  }

  /**
   * ログイン認証情報の入力
   * @private
   */
  private async fillLoginCredentials(credentials: SPLoginCredentials): Promise<void> {
    console.log('📝 ログイン情報を入力中...')

    try {
      // ログインID入力（最初のテキストボックス）
      const loginIdField = this.page.getByRole('textbox').first()
      await loginIdField.waitFor({ state: 'visible' })
      await loginIdField.fill(credentials.username)
      console.log(`✅ ログインIDを入力しました: ${credentials.username}`)

      // パスワード入力（2番目のテキストボックス）
      const passwordField = this.page.getByRole('textbox').nth(1)
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
    const loginResponsePromise = this.page.waitForResponse(
      response => response.url().includes('/login') && response.request().method() === 'POST'
    )

    try {
      // ログインボタンをクリック
      const loginButton = this.page.getByRole('button', { name: /ログイン/ })
      await loginButton.click()
      console.log('✅ ログインボタンをクリックしました')

      // ログインAPIレスポンスを待機
      const loginResponse = await loginResponsePromise
      const statusCode = loginResponse.status()
      console.log(`📡 ログインAPIレスポンス: ${statusCode}`)

      // ステータスコード確認
      if (statusCode === 303 || statusCode === 302) {
        console.log('✅ ログイン成功（303/302リダイレクト受信）')
        const location = loginResponse.headers()['location']
        if (location) {
          console.log(`📍 リダイレクト先: ${location}`)
        }
      } else if (statusCode === 200) {
        console.log('✅ ログイン成功（200 OK受信）')
      } else {
        throw new Error(`❌ ログインが失敗しました。ステータス: ${statusCode}`)
      }

      // ページ遷移の完了を待機
      await this.page.waitForLoadState('domcontentloaded')

    } catch (error) {
      throw new Error(`❌ ログイン送信処理でエラーが発生しました: ${error.message}`)
    }
  }

  /**
   * M3.com SPでのログイン成功確認
   * @private
   * @description
   * - SP版のユーザー名表示要素を確認してログイン成功を検証
   * - SP版ではフッターの .atlas-sp-userinfo__name でユーザー名を確認
   * - ログイン失敗時はエラーをスローしてテストを停止
   */
  private async verifySPLoginSuccess(): Promise<void> {
    console.log('🔍 M3.com SPでのログイン成功状態を確認中...')

    try {
      // SP版のユーザー名表示要素を確認（フッター内の専用クラス）
      // 例: "ユニットヨ 先生"
      const usernameElement = this.page.locator('.atlas-sp-userinfo__name')
      await usernameElement.waitFor({ state: 'visible' })

      const usernameText = await usernameElement.textContent()
      if (usernameText && usernameText.trim()) {
        console.log(`✅ M3.com SPログイン成功確認。ユーザー名: ${usernameText.trim()}`)
        return
      }
    } catch (error) {
      throw new Error(`❌ M3.com SPログイン失敗: フッターのユーザー名が見つかりません。エラー: ${error}`)
    }

    throw new Error('❌ M3.com SPログイン失敗: ユーザー名が空です')
  }

  /**
   * ログイン後のCA広告をスキップ
   * @private
   * @description
   * - ログイン後に表示される可能性のあるCA広告をスキップ
   * - 「スキップする」または「あとで確認する」リンクが存在する場合のみクリック
   */
  private async skipPostLoginCA(): Promise<void> {
    try {
      // 「スキップする」リンクを探す
      const skipLink = this.page.getByText('スキップする')
      if (await skipLink.isVisible()) {
        await skipLink.click()
        console.log('✅ ログイン後CAをスキップしました（スキップする）')
        return
      }
    } catch {
      // スキップするリンクが見つからない場合は次へ
    }

    try {
      // 「あとで確認する」リンクを探す
      const laterLink = this.page.getByText('あとで確認する')
      if (await laterLink.isVisible()) {
        await laterLink.click()
        console.log('✅ ログイン後CAをスキップしました（あとで確認する）')
        return
      }
    } catch {
      // あとで確認するリンクも見つからない場合は何もしない
    }

    console.log('ℹ️ ログイン後CAは表示されませんでした')
  }

  /**
   * ログアウト処理
   *
   * @description
   * - SP版のメニューからログアウトを実行
   * - フッターのユーザー情報エリアからログアウトリンクをクリック
   */
  async logout(): Promise<void> {
    console.log('🚪 ログアウト処理を実行中...')

    try {
      // 1. メニューボタンをクリック
      const menuButton = this.page.getByRole('button', { name: 'メニュー' })
      await menuButton.waitFor({ state: 'visible' })
      await menuButton.click()
      console.log('✅ メニューボタンをクリックしました')

      // 2. ログアウトリンクをクリック
      const logoutLink = this.page.getByRole('link', { name: 'ログアウト' })
      await logoutLink.waitFor({ state: 'visible' })
      await logoutLink.click()
      console.log('✅ ログアウトリンクをクリックしました')

      // 3. ページ遷移の完了を待機
      await this.page.waitForLoadState('domcontentloaded')
      console.log('✅ ログアウト処理が正常に完了しました')

    } catch (error) {
      console.warn(`⚠️ メニュー経由のログアウトに失敗しました: ${error.message}`)

      // フォールバック: 直接的なログアウト要素の検索
      console.log('🔄 フォールバックログアウト処理を試行中...')

      const fallbackSelectors = [
        'a[href*="logout"]',
        'text=ログアウト',
        '.logout-link',
        '[data-testid="logout"]'
      ]

      for (const selector of fallbackSelectors) {
        try {
          const element = this.page.locator(selector).first()
          if (await element.isVisible()) {
            await element.click()
            await this.page.waitForLoadState('domcontentloaded')
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

