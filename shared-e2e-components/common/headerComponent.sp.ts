import { Page, Locator } from '@playwright/test'

/**
 * M3サービス群共通ヘッダーコンポーネント（SP版）
 *
 * @description
 * - SP（スマートフォン）版のM3.com共通ヘッダーに対応
 * - PC版とは全く異なるDOM構造・レイアウトを持つため、専用のPOMを提供
 * - 共通化されたヘッダー要素のため、基本的に変更が入らない想定
 * - シンプルで読みやすいセレクタ定義
 * - ハンバーガーメニュー、トップナビゲーション、ボトムナビゲーションに対応
 *
 * ## Playwright推奨パターンに準拠
 * - コンストラクタで全Locatorをreadonly propertyとして一括初期化
 * - パフォーマンス向上：要素参照が固定され、毎回の評価が不要
 * - 可読性向上：プロパティとして明示的に定義
 * - 型安全性：TypeScriptによる厳格な型チェック
 *
 * ## PC版との主な違い
 * - ユーザー名：ヘッダーに常時表示されない（ハンバーガーメニュー内またはコンテンツエリア）
 * - ナビゲーション：トップアイコンバー + ボトムナビゲーションバー
 * - ポイント情報：表示位置・構造が異なる
 * - ハンバーガーメニュー：SP特有の三本線メニュー
 */
export class HeaderComponentSP {
  readonly page: Page

  // Atlas ヘッダー要素（SP版）
  readonly atlasHeader: Locator
  readonly logo: Locator

  // ハンバーガーメニュー（SP特有）
  readonly hamburgerMenu: Locator

  // トップナビゲーション（アイコンバー）
  readonly topNavigation: Locator
  readonly serviceDetail: Locator      // メッセージアイコン
  readonly messagesBadge: Locator       // メッセージ未読バッジ
  readonly serviceConference: Locator   // 講演会アイコン
  readonly serviceSurvey: Locator       // アンケートアイコン
  readonly serviceCampaign: Locator     // キャンペーンアイコン
  readonly serviceTodo: Locator         // ToDoアイコン
  readonly todoBadge: Locator           // ToDoバッジ

  // 検索機能
  readonly searchArea: Locator

  // ボトムナビゲーション（SP特有）
  readonly bottomNavigation: Locator

  // ユーザー情報（コンテンツエリア内またはメニュー内）
  readonly userName: Locator

  constructor(page: Page) {
    this.page = page

    // Atlas ヘッダー全体（SP版）
    // SP版では空のdiv要素として存在
    this.atlasHeader = page.locator('#atlas-header')

    // M3ロゴ画像
    this.logo = page.getByRole('img', { name: 'm3.com' })

    // ハンバーガーメニューボタン（SP特有）
    this.hamburgerMenu = page.getByRole('button', { name: /メニュー|menu/i })

    // トップナビゲーションバー全体
    this.topNavigation = page.locator('nav').first()

    // メッセージ・詳細サービスアイコン
    this.serviceDetail = page.getByRole('link', { name: /メッセ/ }).first()

    // メッセージ未読バッジ
    this.messagesBadge = this.serviceDetail.locator('div').filter({ hasText: /^\d+$/ })

    // Web講演会サービスアイコン
    this.serviceConference = page.getByRole('link', { name: /講演会/ }).first()

    // アンケートサービスアイコン
    this.serviceSurvey = page.getByRole('link', { name: /アンケ/ }).first()

    // キャンペーンサービスアイコン
    this.serviceCampaign = page.getByRole('link', { name: /キャン/ }).first()

    // ToDoサービスアイコン
    this.serviceTodo = page.getByRole('link', { name: /ToDo/ }).first()

    // ToDoバッジ
    this.todoBadge = this.serviceTodo.locator('div').filter({ hasText: /^(未|\d+)$/ })

    // 検索機能
    this.searchArea = page.getByRole('search')

    // ボトムナビゲーション（SP特有）
    this.bottomNavigation = page.locator('nav').last()

    // ユーザー名表示要素（SP版）
    // SP版ではフッター内の専用クラスでユーザー名が表示される
    // 例: "ユニットヨ 先生"
    this.userName = page.locator('.atlas-sp-userinfo__name')
  }

  // 便利メソッド群

  /**
   * Atlas ヘッダーの表示確認（SP版）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ヘッダーが表示されている場合true
   * @description
   * SP版ではヘッダー要素が空のdivとして存在するため、
   * 存在確認のみで表示確認とする
   */
  async isHeaderVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.atlasHeader.waitFor({ state: 'attached', timeout })
      return true
    } catch (error: unknown) {
      return false
    }
  }

  /**
   * ログイン状態の確認（SP版）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ログイン済みの場合true
   * @description
   * SP版ではユーザー名がコンテンツエリアに表示されるため、
   * その要素の表示でログイン状態を判定
   */
  async isLoggedIn(timeout: number = 5000): Promise<boolean> {
    console.log('🔍 SP版ログイン状態を確認中...')

    try {
      await this.userName.waitFor({ state: 'visible', timeout })
      const usernameText = await this.userName.textContent()

      if (usernameText && usernameText.trim()) {
        console.log(`✅ SP版ログイン状態確認成功: ${usernameText.trim()}`)
        return true
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`⚠️ SP版ログイン状態を確認できませんでした: ${errorMessage}`)
    }

    return false
  }

  /**
   * ユーザー名の取得（SP版）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ユーザー名（取得できない場合は空文字）
   * @description
   * SP版ではユーザー名がコンテンツエリアまたはメニュー内に表示される
   */
  async getUserName(timeout: number = 5000): Promise<string> {
    console.log('📝 SP版ユーザー名を取得中...')

    try {
      await this.userName.waitFor({ state: 'visible', timeout })
      const text = await this.userName.textContent()

      if (text && text.trim()) {
        console.log(`✅ SP版ユーザー名取得成功: ${text.trim()}`)
        return text.trim()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`⚠️ SP版ユーザー名を取得できませんでした: ${errorMessage}`)
    }

    return ''
  }

  /**
   * ハンバーガーメニューを開く（SP特有）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   */
  async openHamburgerMenu(timeout: number = 5000): Promise<void> {
    console.log('🍔 ハンバーガーメニューを開く...')

    try {
      await this.hamburgerMenu.waitFor({ state: 'visible', timeout })
      await this.hamburgerMenu.click()
      console.log('✅ ハンバーガーメニューを開きました')
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`⚠️ ハンバーガーメニューを開けませんでした: ${errorMessage}`)
      throw error
    }
  }

  /**
   * サービスアイコンのクリック（SP版）
   *
   * @param serviceType サービスの種類
   */
  async clickServiceIcon(serviceType: 'detail' | 'conference' | 'survey' | 'campaign' | 'todo'): Promise<void> {
    let service: Locator

    switch (serviceType) {
      case 'detail':
        service = this.serviceDetail
        break
      case 'conference':
        service = this.serviceConference
        break
      case 'survey':
        service = this.serviceSurvey
        break
      case 'campaign':
        service = this.serviceCampaign
        break
      case 'todo':
        service = this.serviceTodo
        break
      default:
        throw new Error(`未対応のサービスタイプです: ${serviceType}`)
    }

    console.log(`🖱️ SP版${serviceType}サービスアイコンをクリック中...`)
    await service.waitFor({ state: 'visible', timeout: 10000 })
    await service.click()
    console.log(`✅ SP版${serviceType}サービスアイコンのクリックが完了しました`)
  }

  /**
   * 未読メッセージ数の取得（SP版）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 未読メッセージ数（取得できない場合は0）
   */
  async getUnreadMessageCount(timeout: number = 5000): Promise<number> {
    try {
      await this.messagesBadge.waitFor({ state: 'visible', timeout })
      const text = await this.messagesBadge.textContent()
      const match = text?.match(/(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    } catch (error: unknown) {
      return 0
    }
  }

  /**
   * ToDo状態の取得（SP版）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ToDoバッジのテキスト（取得できない場合は空文字）
   */
  async getTodoStatus(timeout: number = 5000): Promise<string> {
    try {
      await this.todoBadge.waitFor({ state: 'visible', timeout })
      const text = await this.todoBadge.textContent()
      return text?.trim() || ''
    } catch (error: unknown) {
      return ''
    }
  }

  /**
   * トップナビゲーションの表示確認（SP特有）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns トップナビゲーションが表示されている場合true
   */
  async isTopNavigationVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.topNavigation.waitFor({ state: 'visible', timeout })
      return true
    } catch (error: unknown) {
      return false
    }
  }

  /**
   * ボトムナビゲーションの表示確認（SP特有）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ボトムナビゲーションが表示されている場合true
   */
  async isBottomNavigationVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.bottomNavigation.waitFor({ state: 'visible', timeout })
      return true
    } catch (error: unknown) {
      return false
    }
  }
}

/**
 * HeaderComponentSPクラス - Playwright推奨パターンに準拠（SP版）
 *
 * このクラスはPlaywrightの公式Page Object Modelパターンに準拠し、
 * 役割ベースセレクタを採用した堅牢なSP版実装となっています。
 *
 * ## PC版との構造的違い
 *
 * ### DOM構造の違い
 * - **PC版**: ヘッダーにユーザー名・ポイント・アクションが常時表示
 * - **SP版**: ヘッダーは最小限、ユーザー情報はコンテンツエリアまたはメニュー内
 *
 * ### ナビゲーションの違い
 * - **PC版**: 横並びのサービスアイコン + ドロップダウンメニュー
 * - **SP版**: トップアイコンバー + ボトムナビゲーションバー + ハンバーガーメニュー
 *
 * ### レスポンシブ対応
 * - **PC版**: `devices['Desktop Chrome']` (1280x800)
 * - **SP版**: `devices['iPhone 13']` (390x844)
 *
 * ## 使用例
 *
 * ```typescript
 * import { HeaderComponentSP } from '@/shared-e2e-components/common/headerComponent.sp';
 * import { devices } from '@playwright/test';
 *
 * test.use({
 *   ...devices['iPhone 13']
 * });
 *
 * test('SP版ヘッダー要素の検証', async ({ page }) => {
 *   const header = new HeaderComponentSP(page);
 *
 *   // ヘッダー表示確認
 *   const isHeaderVisible = await header.isHeaderVisible();
 *   expect(isHeaderVisible).toBe(true);
 *
 *   // ログイン状態確認
 *   const isLoggedIn = await header.isLoggedIn();
 *   expect(isLoggedIn).toBe(true);
 *
 *   // ハンバーガーメニューを開く
 *   await header.openHamburgerMenu();
 *
 *   // サービスアイコンクリック
 *   await header.clickServiceIcon('todo');
 * });
 * ```
 */
