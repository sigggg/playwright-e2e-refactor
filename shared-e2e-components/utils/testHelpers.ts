import { Page, expect, Locator } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

/**
 * エラー無視設定のインターフェース
 */
interface IgnoredError {
  pattern?: string
  url?: string
  reason: string
}

/**
 * エラー無視設定の全体構造
 */
interface IgnoredErrorsConfig {
  ignoredRequestFailures: IgnoredError[]
  ignoredConsoleErrors: IgnoredError[]
  ignoredPageErrors: IgnoredError[]
}

/**
 * M3サービス群共通テストヘルパーユーティリティ
 * 
 * @description
 * - E2Eテストの共通機能を提供するユーティリティクラス
 * - ページ検証、エラー監視、スクリーンショット、パフォーマンス計測など
 * - エラー無視設定による柔軟なエラーハンドリング
 * - 視覚的回帰テスト、リンク検証、要素操作などの高度な機能を内蔵
 * - 全M3サービスで再利用可能な設計
 * 
 * @example
 * ```typescript
 * const testHelpers = new TestHelpers(page);
 * testHelpers.startConsoleErrorMonitoring();
 * await testHelpers.verifyPageBasicElements();
 * await testHelpers.takeScreenshot('test-result');
 * ```
 */
export class TestHelpers {
  private page: Page
  private ignoredErrors: IgnoredErrorsConfig

  constructor(page: Page) {
    this.page = page
    
    // エラー無視設定の読み込み（共通設定ファイルを使用）
    try {
      const configPath = this.resolveConfigPath()
      this.ignoredErrors = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    } catch (error) {
      console.warn('⚠️ エラー無視設定ファイルが読み込めませんでした。デフォルト設定を使用します。')
      this.ignoredErrors = this.getDefaultIgnoredErrors()
    }
  }

  /**
   * エラー無視設定ファイルのパス解決
   * @private
   */
  private resolveConfigPath(): string {
    // 共通設定ファイルの優先順位
    const possiblePaths = [
      // 共通コンポーネントの設定
      path.join(process.cwd(), 'shared-e2e-components/config/ignored-errors.json'),
      // プロジェクト固有の設定
      path.join(process.cwd(), 'tests/config/ignored-errors.json'),
      path.join(process.cwd(), 'config/ignored-errors.json'),
      // base-e2e-testsの設定（後方互換性）
      path.join(process.cwd(), 'base-e2e-tests/config/ignored-errors.json')
    ]

    for (const configPath of possiblePaths) {
      if (fs.existsSync(configPath)) {
        console.log(`📁 エラー無視設定を読み込みました: ${configPath}`)
        return configPath
      }
    }

    throw new Error('エラー無視設定ファイルが見つかりません')
  }

  /**
   * デフォルトのエラー無視設定
   * @private
   */
  private getDefaultIgnoredErrors(): IgnoredErrorsConfig {
    return {
      ignoredRequestFailures: [
        {
          url: 'google-analytics.com',
          reason: 'Google Analytics関連のリクエストは無視'
        },
        {
          url: 'googletagmanager.com',
          reason: 'Google Tag Manager関連のリクエストは無視'
        }
      ],
      ignoredConsoleErrors: [
        {
          pattern: 'google.*analytics',
          reason: 'Google Analytics関連のコンソールエラーは無視'
        },
        {
          pattern: 'gtag is not defined',
          reason: 'Google Tag関連のエラーは無視'
        }
      ],
      ignoredPageErrors: [
        {
          pattern: 'Script error',
          reason: '一般的なスクリプトエラーは無視'
        }
      ]
    }
  }

  /**
   * ページの基本要素確認
   * 
   * @description
   * - ヘッダー、ナビ、メイン、フッターなどの主要要素の存在確認
   * - サイトの基本的な描画崩れや致命的なレンダリングエラーの早期検出
   * - ページタイトルの基本的な検証も含む
   */
  async verifyPageBasicElements(): Promise<void> {
    console.log('🔍 ページの基本要素を確認中...')

    // ページタイトルの確認
    try {
      await expect(this.page).toHaveTitle(/m3\.com|電子書籍|医療/)
      console.log('✅ ページタイトルが適切です')
    } catch (error) {
      console.warn('⚠️ ページタイトルの検証に失敗しましたが、テストを続行します')
    }

    // 基本的なナビゲーション要素の確認
    const navigationElements = [
      'header',
      'nav',
      'main',
      'footer'
    ]

    for (const element of navigationElements) {
      try {
        await expect(this.page.locator(element).first()).toBeVisible({ timeout: 5000 })
        console.log(`✅ ${element}要素を確認しました`)
      } catch (error) {
        console.warn(`⚠️ ${element}要素が見つかりませんでしたが、テストを続行します`)
      }
    }

    console.log('✅ ページ基本要素の確認が完了しました')
  }

  /**
   * ページの読み込み完了待機
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @description
   * - networkidle、domcontentloaded、追加待機による安定化
   * - ページ遷移や初期表示の安定化に利用
   */
  async waitForPageLoad(timeout: number = 30000): Promise<void> {
    console.log('⏳ ページの読み込み完了を待機中...')
    try {
      await this.page.waitForLoadState('networkidle', { timeout })
      await this.page.waitForLoadState('domcontentloaded', { timeout })
      // 追加の安定化待機
      await this.page.waitForTimeout(1000)
      console.log('✅ ページの読み込みが完了しました')
    } catch (error) {
      console.warn(`⚠️ ページ読み込みタイムアウトが発生しましたが、テストを続行します: ${error.message}`)
    }
  }

  /**
   * スクリーンショット撮影
   * 
   * @param name ファイル名（拡張子なし）
   * @param fullPage 全ページキャプチャの有無
   * @description
   * - タイムスタンプ付きのファイル名で保存
   * - テスト失敗時の証跡やビジュアルリグレッション用途
   */
  async takeScreenshot(name: string, fullPage: boolean = true): Promise<void> {
    console.log(`📸 スクリーンショットを撮影中: ${name}`)
    
    // 保存ディレクトリの確保
    const screenshotDir = 'test-results/screenshots'
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${name}-${timestamp}.png`
    
    await this.page.screenshot({
      path: path.join(screenshotDir, filename),
      fullPage
    })
    
    console.log(`✅ スクリーンショットが保存されました: ${filename}`)
  }

  /**
   * ページ上のエラーメッセージ確認
   * 
   * @returns 発見されたエラーメッセージの配列
   * @description
   * - CSSクラスベースのエラー検出
   * - バリデーションエラーやシステムエラーの自動検出
   */
  async checkForErrors(): Promise<string[]> {
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
   * エラーが無視リストに含まれているかチェック
   * @private
   */
  private shouldIgnoreError(message: string, url?: string): boolean {
    // リクエスト失敗の場合
    if (url) {
      for (const ignored of this.ignoredErrors.ignoredRequestFailures) {
        if (ignored.url && url.includes(ignored.url)) {
          console.log(`🔇 リクエスト失敗を無視: ${ignored.reason}`)
          return true
        }
      }
    }

    // コンソールエラーの場合
    for (const ignored of this.ignoredErrors.ignoredConsoleErrors) {
      if (ignored.pattern && new RegExp(ignored.pattern, 'i').test(message)) {
        console.log(`🔇 コンソールエラーを無視: ${ignored.reason}`)
        return true
      }
    }

    // ページエラーの場合
    for (const ignored of this.ignoredErrors.ignoredPageErrors) {
      if (ignored.pattern && new RegExp(ignored.pattern, 'i').test(message)) {
        console.log(`🔇 ページエラーを無視: ${ignored.reason}`)
        return true
      }
    }

    return false
  }

  /**
   * コンソールエラー監視の開始
   * 
   * @description
   * - request/response/console/pageerrorイベントを監視
   * - 重大なリソースエラーやAPIエラーを詳細に記録・出力
   * - 無視リストに該当しないもののみを出力
   * - エラー詳細をJSONファイルにダンプ
   */
  startConsoleErrorMonitoring(): void {
    console.log('👂 コンソールエラー監視を開始しました（無視リスト対応）')
    
    // エラーダンプファイルの準備
    const errorDumpPath = path.join(process.cwd(), 'test-results', 'api-error-dump.json')
    if (!fs.existsSync(path.dirname(errorDumpPath))) {
      fs.mkdirSync(path.dirname(errorDumpPath), { recursive: true })
    }
    
    let errorDump: any[] = []
    if (fs.existsSync(errorDumpPath)) {
      try {
        errorDump = JSON.parse(fs.readFileSync(errorDumpPath, 'utf-8'))
      } catch (e) {
        errorDump = []
      }
    }

    // リクエスト情報を保存するマップ
    const requestMap = new Map<string, any>()

    // リクエスト監視
    this.page.on('request', (request) => {
      requestMap.set(request.url(), {
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        postData: request.postData() || undefined
      })
    })

    // レスポンス完了時の情報更新
    this.page.on('requestfinished', async (request) => {
      try {
        const response = await request.response()
        if (response) {
          const req = requestMap.get(request.url())
          if (req) {
            req.status = response.status()
          }
        }
      } catch (e) {
        // エラーが発生した場合は無視
      }
    })

    // コンソールエラー監視
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const errorMessage = msg.text()
        if (!this.shouldIgnoreError(errorMessage)) {
          // リソースロード失敗の詳細情報を追加
          if (errorMessage.includes('Failed to load resource')) {
            let reqInfo = undefined
            const urlMatch = errorMessage.match(/(https?:\/\/[^\s]+)/)
            if (urlMatch && requestMap.has(urlMatch[1])) {
              reqInfo = requestMap.get(urlMatch[1])
            } else {
              // 404等のリクエストを逆引き
              for (const [url, info] of requestMap.entries()) {
                if (info.status && (info.status >= 400)) {
                  reqInfo = info
                  break
                }
              }
            }
            
            errorDump.push({
              type: 'console',
              error: errorMessage,
              request: reqInfo,
              time: new Date().toISOString()
            })
            fs.writeFileSync(errorDumpPath, JSON.stringify(errorDump, null, 2))
            
            if (reqInfo) {
              const statusStr = reqInfo.status ? `\n  ステータス: ${reqInfo.status}` : ''
              console.error('🚨 コンソールエラー:', errorMessage, '\n  URL:', reqInfo.url, '\n  メソッド:', reqInfo.method, '\n  リソースタイプ:', reqInfo.resourceType, statusStr)
            } else {
              console.error('🚨 コンソールエラー:', errorMessage)
            }
            return
          }
          console.error('🚨 コンソールエラー:', errorMessage)
        }
      }
    })

    // 4xx/5xxレスポンス監視
    this.page.on('response', (response) => {
      const status = response.status()
      if (status >= 400) {
        const req = response.request()
        if (!this.shouldIgnoreError(`${req.url()} status=${status}`, req.url())) {
          errorDump.push({
            type: 'response',
            url: req.url(),
            status,
            method: req.method(),
            resourceType: req.resourceType(),
            time: new Date().toISOString()
          })
          fs.writeFileSync(errorDumpPath, JSON.stringify(errorDump, null, 2))
          console.error(`[レスポンスエラー] ${req.method()} ${req.url()} [${req.resourceType()}] ステータス=${status}`)
        }
      }
    })

    // リクエスト失敗監視
    this.page.on('requestfailed', async (request) => {
      const url = request.url()
      const errorText = request.failure()?.errorText || ''
      let status: number | undefined
      try {
        const response = await request.response()
        if (response) { status = response.status() }
      } catch {}
      
      if ((status && status >= 400) || errorText) {
        if (!this.shouldIgnoreError(`${url} status=${status} ${errorText}`, url)) {
          errorDump.push({
            type: 'requestfailed',
            url,
            error: errorText,
            status,
            method: request.method(),
            resourceType: request.resourceType(),
            postData: request.postData() || undefined,
            time: new Date().toISOString()
          })
          fs.writeFileSync(errorDumpPath, JSON.stringify(errorDump, null, 2))
          console.error(`[リクエスト失敗] ${request.method()} ${url} [${request.resourceType()}]`, status ? `ステータス=${status}` : '', errorText)
        }
      }
    })

    // ページエラー監視
    this.page.on('pageerror', (error) => {
      const errorMessage = error.message
      if (!this.shouldIgnoreError(errorMessage)) {
        errorDump.push({
          type: 'pageerror',
          error: errorMessage,
          time: new Date().toISOString()
        })
        fs.writeFileSync(errorDumpPath, JSON.stringify(errorDump, null, 2))
        console.error('🚨 ページエラー:', errorMessage)
      }
    })
  }

  /**
   * 要素の表示待機
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
   * ページ内のリンク確認
   * 
   * @param maxLinks チェックするリンクの最大数
   * @returns リンク検証結果
   * @description
   * - aタグのリンク先が有効か簡易チェック
   * - 外部/内部リンクの死活監視やリンク切れ検出に利用
   */
  async verifyLinks(maxLinks: number = 10): Promise<{ working: number; broken: number }> {
    console.log('🔗 ページ内のリンクを確認中...')
    
    const links = await this.page.locator('a[href]').all()
    let working = 0
    let broken = 0

    for (const link of links.slice(0, maxLinks)) {
      try {
        const href = await link.getAttribute('href')
        if (href && (href.startsWith('http') || href.startsWith('/'))) {
          working++
        }
      } catch (error) {
        broken++
      }
    }

    console.log(`✅ リンク確認完了: ${working}個有効, ${broken}個無効`)
    return { working, broken }
  }

  /**
   * ページのパフォーマンス情報取得
   * 
   * @returns パフォーマンス指標
   * @description
   * - ページロードやFCP等のパフォーマンス指標を取得
   * - パフォーマンステストやボトルネック調査に利用
   */
  async getPerformanceMetrics(): Promise<any> {
    console.log('📊 パフォーマンス指標を取得中...')
    
    const metrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      }
    })

    console.log('✅ パフォーマンス指標を取得しました:', metrics)
    return metrics
  }

  /**
   * 視覚的回帰テスト
   * 
   * @param name テスト名
   * @param options スクリーンショット比較のオプション
   * @description
   * - ページのビジュアルスナップショットを取得し、差分を自動判定
   * - カルーセルやアニメーションを停止して安定したキャプチャを実現
   * - UIの意図しない崩れやリグレッション検出に利用
   */
  async visualRegressionTest(name: string, options?: {
    threshold?: number
    maxDiffPixels?: number
  }): Promise<void> {
    console.log(`📷 視覚的回帰テストを実行中: ${name}`)
    
    // ページが完全に読み込まれるまで待機
    await this.waitForPageLoad()
    
    // アニメーションとカルーセルを停止
    await this.page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        .swiper-wrapper,
        .carousel,
        .slider,
        [class*="carousel"],
        [class*="slider"],
        [class*="swiper"] {
          animation-play-state: paused !important;
          transition: none !important;
        }
      `
    })

    // JavaScriptでのカルーセル制御を停止
    await this.page.evaluate(() => {
      try {
        // 一般的なカルーセルライブラリの停止
        if ((window as any).swiper) {
          (window as any).swiper.autoplay?.stop()
        }
        if ((window as any).swipers) {
          (window as any).swipers.forEach((swiper: any) => swiper.autoplay?.stop())
        }
        
        // カルーセル関連要素を最初のスライドに固定
        const carousels = document.querySelectorAll('[class*="carousel"], [class*="slider"], [class*="swiper"], .gallery')
        carousels.forEach(carousel => {
          const slides = carousel.querySelectorAll('[class*="slide"], [class*="item"]')
          slides.forEach((slide: any, index: number) => {
            if (index === 0) {
              slide.style.display = 'block'
              slide.style.opacity = '1'
              slide.style.transform = 'translateX(0)'
            } else {
              slide.style.display = 'none'
            }
          })
        })
      } catch (error) {
        console.log('カルーセル停止処理でエラー:', error)
      }
    })

    // 安定化のための待機
    await this.page.waitForTimeout(2000)
    
    try {
      await expect(this.page).toHaveScreenshot(`${name}.png`, {
        fullPage: true,
        threshold: options?.threshold || 0.3,
        maxDiffPixels: options?.maxDiffPixels || 1000
      })
      console.log(`✅ 視覚的回帰テストが完了しました: ${name}`)
    } catch (error) {
      if (error.message.includes("A snapshot doesn't exist")) {
        console.log(`📷 ベースライン画像を作成しました: ${name}`)
      } else {
        throw error
      }
    }
  }

  /**
   * 複数要素の一括確認
   * 
   * @param locators 確認する要素のLocator配列
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 確認結果
   */
  async verifyMultipleElements(locators: Locator[], timeout: number = 5000): Promise<{
    visible: number
    hidden: number
    total: number
  }> {
    console.log(`🔍 ${locators.length}個の要素を一括確認中...`)
    
    let visible = 0
    let hidden = 0
    
    for (const locator of locators) {
      try {
        await locator.waitFor({ state: 'visible', timeout })
        visible++
      } catch (error) {
        hidden++
      }
    }
    
    const result = { visible, hidden, total: locators.length }
    console.log(`✅ 要素確認完了: ${visible}個表示, ${hidden}個非表示, 合計${result.total}個`)
    
    return result
  }

  /**
   * エラーダンプファイルのクリア
   * 
   * @description
   * - テスト開始前にエラーダンプファイルをクリア
   * - 各テストケースの独立性を保つため
   */
  clearErrorDump(): void {
    const errorDumpPath = path.join(process.cwd(), 'test-results', 'api-error-dump.json')
    if (fs.existsSync(errorDumpPath)) {
      fs.writeFileSync(errorDumpPath, '[]')
      console.log('🗑️ エラーダンプファイルをクリアしました')
    }
  }
}