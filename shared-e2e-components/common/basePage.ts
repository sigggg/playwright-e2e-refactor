import { Page, expect, Locator } from '@playwright/test'

/**
 * 全てのPage Objectクラスが継承する基底クラス
 *
 * @description
 * - M3サービス群で共通利用される基本機能を提供
 * - ページ操作、要素検証、エラーハンドリングなどの共通処理を集約
 * - 各サービス固有のPage Objectはこのクラスを継承して拡張
 * - 堅牢な待機処理とリトライ機能を内蔵
 *
 * ## Playwright推奨パターンに準拠
 * - このクラスはユーティリティメソッドを提供する基底クラス
 * - 各Page Objectは固有のLocatorをreadonlyプロパティとしてコンストラクタで初期化
 * - 共通操作メソッドを提供し、DRY原則を維持
 *
 * ## 使用例
 * ```typescript
 * export class LoginPage extends BasePage {
 *   readonly loginButton: Locator;
 *   readonly emailField: Locator;
 *
 *   constructor(page: Page) {
 *     super(page);
 *     this.loginButton = page.getByRole('button', { name: 'ログイン' });
 *     this.emailField = page.getByLabel('メールアドレス');
 *   }
 * }
 * ```
 */
export abstract class BasePage {
  protected readonly page: Page
  protected url?: string

  constructor(page: Page) {
    this.page = page
  }

  /**
   * ページへのナビゲーション
   *
   * @param url 遷移先URL（省略時はクラス定義のURLを使用）
   * @param options ナビゲーションオプション
   */
  async navigate(url?: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): Promise<void> {
    const targetUrl = url || this.url
    if (!targetUrl) {
      throw new Error('ナビゲーション先のURLが指定されていません')
    }

    await this.page.goto(targetUrl, {
      waitUntil: options?.waitUntil || 'domcontentloaded'
    })
  }

  /**
   * ページの読み込み完了を待機
   *
   * @param timeout タイムアウト時間（ミリ秒）
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    try {
      await this.page.waitForLoadState('domcontentloaded', { timeout })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`⚠️ ページ読み込みタイムアウトが発生しましたが、テストを続行します: ${errorMessage}`)
    }
  }

  /**
   * 要素の表示を待機
   * 
   * @param locator 対象要素のLocator
   * @param timeout タイムアウト時間（ミリ秒）
   */
  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    await expect(locator).toBeVisible({ timeout })
  }

  /**
   * 要素のクリック（リトライ機能付き）
   * 
   * @param locator 対象要素のLocator
   * @param maxRetries 最大リトライ回数
   */
  async clickWithRetry(locator: Locator, maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await locator.waitFor({ state: 'visible' })
        await locator.click()
        return
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn(`⚠️ クリック試行 ${i + 1} 回目が失敗: ${errorMessage}`)
        if (i === maxRetries - 1) {
          throw new Error(`❌ ${maxRetries}回の試行後もクリックに失敗しました: ${locator}`)
        }
        // Playwrightの自動待機機能により、次の試行で自動的に待機される
      }
    }
  }

  /**
   * テキスト入力（クリア機能付き）
   * 
   * @param locator 対象要素のLocator
   * @param text 入力するテキスト
   */
  async fillWithClear(locator: Locator, text: string): Promise<void> {
    await locator.waitFor({ state: 'visible' })
    await locator.clear()
    await locator.fill(text)
  }

  /**
   * 要素のテキスト内容を取得
   * 
   * @param locator 対象要素のLocator
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 要素のテキスト内容
   */
  async getElementText(locator: Locator, timeout: number = 5000): Promise<string> {
    await locator.waitFor({ state: 'visible', timeout })
    const text = await locator.textContent()
    return text?.trim() || ''
  }

  /**
   * 要素の属性値を取得
   * 
   * @param locator 対象要素のLocator
   * @param attributeName 属性名
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 属性値
   */
  async getElementAttribute(locator: Locator, attributeName: string, timeout: number = 5000): Promise<string | null> {
    await locator.waitFor({ state: 'visible', timeout })
    return await locator.getAttribute(attributeName)
  }

  /**
   * 要素の存在確認
   * 
   * @param locator 対象要素のLocator
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 要素が存在する場合true
   */
  async isElementVisible(locator: Locator, timeout: number = 5000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout })
      return true
    } catch (error: unknown) {
      return false
    }
  }

  /**
   * 要素の非表示状態を確認
   * 
   * @param locator 対象要素のLocator
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 要素が非表示の場合true
   */
  async isElementHidden(locator: Locator, timeout: number = 5000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'hidden', timeout })
      return true
    } catch (error: unknown) {
      return false
    }
  }

  /**
   * 複数要素の取得と操作
   * 
   * @param locator 対象要素群のLocator
   * @returns 要素配列
   */
  async getAllElements(locator: Locator): Promise<Locator[]> {
    const count = await locator.count()
    const elements: Locator[] = []
    
    for (let i = 0; i < count; i++) {
      elements.push(locator.nth(i))
    }
    
    return elements
  }

  /**
   * ドロップダウンメニューの選択
   * 
   * @param locator セレクト要素のLocator
   * @param value 選択する値
   */
  async selectDropdownOption(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' })
    await locator.selectOption(value)
  }

  /**
   * チェックボックスまたはラジオボタンの操作
   * 
   * @param locator 対象要素のLocator
   * @param checked チェック状態（true: チェック、false: チェック解除）
   */
  async setCheckboxState(locator: Locator, checked: boolean): Promise<void> {
    await locator.waitFor({ state: 'visible' })
    await locator.setChecked(checked)
  }

  /**
   * スクリーンショットの撮影
   * 
   * @param name ファイル名（拡張子なし）
   * @param fullPage 全ページキャプチャの有無
   */
  async takeScreenshot(name: string, fullPage: boolean = true): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${name}-${timestamp}.png`

    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage
    })
  }

  /**
   * ページタイトルの検証
   * 
   * @param expectedTitle 期待するタイトル（部分一致可能な正規表現）
   */
  async verifyPageTitle(expectedTitle: string | RegExp): Promise<void> {
    await expect(this.page).toHaveTitle(expectedTitle)
  }

  /**
   * URLの検証
   *
   * @param expectedUrl 期待するURL（部分一致可能）
   */
  async verifyUrl(expectedUrl: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(expectedUrl)
  }

  /**
   * ページ上のエラーメッセージの確認
   * 
   * @returns 発見されたエラーメッセージの配列
   */
  async checkForErrorMessages(): Promise<string[]> {
    const errorSelectors = [
      '.alert-danger',
      '.alert-error',
      '.error-message',
      '.validation-error',
      '.form-error',
      '.login-error',
      '.system-error'
    ]

    const errors: string[] = []
    for (const selector of errorSelectors) {
      try {
        const errorElements = this.page.locator(selector)
        const count = await errorElements.count()
        
        for (let i = 0; i < count; i++) {
          const element = errorElements.nth(i)
          if (await element.isVisible()) {
            const errorText = await element.textContent()
            if (errorText && errorText.trim()) {
              errors.push(errorText.trim())
            }
          }
        }
      } catch (error: unknown) {
        // エラーが見つからない場合は続行
      }
    }

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length}個のエラーメッセージを発見しました:`, errors)
    }

    return errors
  }

  /**
   * 現在のページURLを取得
   * 
   * @returns 現在のページURL
   */
  getCurrentUrl(): string {
    return this.page.url()
  }

  /**
   * ページのリロード
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   */
  async reload(timeout: number = 30000): Promise<void> {
    await this.page.reload({ timeout })
    await this.waitForPageLoad()
  }

  /**
   * ブラウザの戻る操作
   */
  async goBack(): Promise<void> {
    await this.page.goBack()
    await this.waitForPageLoad()
  }

  /**
   * ブラウザの進む操作
   */
  async goForward(): Promise<void> {
    await this.page.goForward()
    await this.waitForPageLoad()
  }
}
