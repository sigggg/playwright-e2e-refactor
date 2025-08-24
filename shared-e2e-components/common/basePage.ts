import { Page, expect, Locator } from '@playwright/test'

/**
 * 全てのPage Objectクラスが継承する基底クラス
 * 
 * @description
 * - M3サービス群で共通利用される基本機能を提供
 * - ページ操作、要素検証、エラーハンドリングなどの共通処理を集約
 * - 各サービス固有のPage Objectはこのクラスを継承して拡張
 * - 堅牢な待機処理とリトライ機能を内蔵
 */
export abstract class BasePage {
  protected page: Page
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

    console.log(`📡 ${targetUrl} にナビゲート中...`)
    await this.page.goto(targetUrl, {
      waitUntil: options?.waitUntil || 'networkidle',
      timeout: 60000
    })
    console.log(`✅ ${targetUrl} への遷移が完了しました`)
  }

  /**
   * ページの読み込み完了を待機
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    console.log('⏳ ページの読み込み完了を待機中...')
    try {
      await this.page.waitForLoadState('networkidle', { timeout })
      await this.page.waitForLoadState('domcontentloaded', { timeout })
      // 安定化のための追加待機
      await this.page.waitForTimeout(1000)
      console.log('✅ ページの読み込みが完了しました')
    } catch (error) {
      console.warn(`⚠️ ページ読み込みタイムアウトが発生しましたが、テストを続行します: ${error.message}`)
    }
  }

  /**
   * 要素の表示を待機
   * 
   * @param locator 対象要素のLocator
   * @param timeout タイムアウト時間（ミリ秒）
   */
  async waitForElement(locator: Locator, timeout: number = 10000): Promise<void> {
    console.log(`⏳ 要素の表示を待機中: ${locator}`)
    await expect(locator).toBeVisible({ timeout })
    console.log(`✅ 要素が表示されました: ${locator}`)
  }

  /**
   * 要素のクリック（リトライ機能付き）
   * 
   * @param locator 対象要素のLocator
   * @param maxRetries 最大リトライ回数
   */
  async clickWithRetry(locator: Locator, maxRetries: number = 3): Promise<void> {
    console.log(`🖱️ 要素をクリック中: ${locator}`)
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        await locator.waitFor({ state: 'visible', timeout: 5000 })
        await locator.click()
        console.log(`✅ 要素のクリックが成功しました: ${locator}`)
        return
      } catch (error) {
        console.warn(`⚠️ クリック試行 ${i + 1} 回目が失敗: ${error.message}`)
        if (i === maxRetries - 1) {
          throw new Error(`❌ ${maxRetries}回の試行後もクリックに失敗しました: ${locator}`)
        }
        await this.page.waitForTimeout(1000) // 1秒待機してリトライ
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
    console.log(`📝 テキストを入力中: ${text}`)
    
    await locator.waitFor({ state: 'visible', timeout: 5000 })
    await locator.clear()
    await locator.fill(text)
    
    console.log(`✅ テキスト入力が完了しました: ${text}`)
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
    } catch (error) {
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
    } catch (error) {
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
    console.log(`📋 ドロップダウンから選択中: ${value}`)
    
    await locator.waitFor({ state: 'visible', timeout: 5000 })
    await locator.selectOption(value)
    
    console.log(`✅ ドロップダウン選択が完了しました: ${value}`)
  }

  /**
   * チェックボックスまたはラジオボタンの操作
   * 
   * @param locator 対象要素のLocator
   * @param checked チェック状態（true: チェック、false: チェック解除）
   */
  async setCheckboxState(locator: Locator, checked: boolean): Promise<void> {
    console.log(`☑️ チェックボックス状態を設定中: ${checked}`)
    
    await locator.waitFor({ state: 'visible', timeout: 5000 })
    await locator.setChecked(checked)
    
    console.log(`✅ チェックボックス状態の設定が完了しました: ${checked}`)
  }

  /**
   * スクリーンショットの撮影
   * 
   * @param name ファイル名（拡張子なし）
   * @param fullPage 全ページキャプチャの有無
   */
  async takeScreenshot(name: string, fullPage: boolean = true): Promise<void> {
    console.log(`📸 スクリーンショットを撮影中: ${name}`)
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${name}-${timestamp}.png`
    
    await this.page.screenshot({
      path: `test-results/screenshots/${filename}`,
      fullPage
    })
    
    console.log(`✅ スクリーンショットが保存されました: ${filename}`)
  }

  /**
   * ページタイトルの検証
   * 
   * @param expectedTitle 期待するタイトル（部分一致可能な正規表現）
   */
  async verifyPageTitle(expectedTitle: string | RegExp): Promise<void> {
    console.log(`🔍 ページタイトルを検証中: ${expectedTitle}`)
    
    await expect(this.page).toHaveTitle(expectedTitle)
    
    console.log(`✅ ページタイトルの検証が完了しました: ${expectedTitle}`)
  }

  /**
   * URLの検証
   * 
   * @param expectedUrl 期待するURL（部分一致可能）
   */
  async verifyUrl(expectedUrl: string | RegExp): Promise<void> {
    console.log(`🔍 URLを検証中: ${expectedUrl}`)
    
    if (typeof expectedUrl === 'string') {
      expect(this.page.url()).toContain(expectedUrl)
    } else {
      expect(this.page.url()).toMatch(expectedUrl)
    }
    
    console.log(`✅ URLの検証が完了しました: ${expectedUrl}`)
  }

  /**
   * ページ上のエラーメッセージの確認
   * 
   * @returns 発見されたエラーメッセージの配列
   */
  async checkForErrorMessages(): Promise<string[]> {
    console.log('🔍 ページ上のエラーメッセージを確認中...')

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
          if (await element.isVisible({ timeout: 1000 })) {
            const errorText = await element.textContent()
            if (errorText && errorText.trim()) {
              errors.push(errorText.trim())
            }
          }
        }
      } catch (error) {
        // エラーが見つからない場合は続行
      }
    }

    if (errors.length > 0) {
      console.warn(`⚠️ ${errors.length}個のエラーメッセージを発見しました:`, errors)
    } else {
      console.log('✅ エラーメッセージは見つかりませんでした')
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
    console.log('🔄 ページをリロード中...')
    await this.page.reload({ timeout })
    await this.waitForPageLoad()
    console.log('✅ ページのリロードが完了しました')
  }

  /**
   * ブラウザの戻る操作
   */
  async goBack(): Promise<void> {
    console.log('⬅️ ブラウザの戻る操作を実行中...')
    await this.page.goBack()
    await this.waitForPageLoad()
    console.log('✅ 戻る操作が完了しました')
  }

  /**
   * ブラウザの進む操作
   */
  async goForward(): Promise<void> {
    console.log('➡️ ブラウザの進む操作を実行中...')
    await this.page.goForward()
    await this.waitForPageLoad()
    console.log('✅ 進む操作が完了しました')
  }
}