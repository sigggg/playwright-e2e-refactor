import { Page, Locator } from '@playwright/test'

/**
 * M3サービス群共通ヘッダーコンポーネント
 *
 * @description
 * - M3.comの共通ヘッダー（Atlas）とサービス固有ヘッダーの両方に対応
 * - **役割ベースセレクタを優先**した要素選択戦略を採用
 * - 段階的セレクタ戦略（役割ベース → data-testid → CSSセレクタ）による堅牢な要素特定
 * - ログイン状態の確認、ユーザー情報表示、ナビゲーション機能を提供
 * - PC/SP両対応で画面サイズに応じた要素の取得が可能
 * - ポイント情報、サービス固有アイコンなど汎用的な要素を管理
 * - アクセシビリティを重視したWAI-ARIA準拠の要素特定
 *
 * ## Playwright推奨パターンに準拠
 * - コンストラクタで全Locatorをreadonly propertyとして一括初期化
 * - Locatorは「定義」であり、実際の検索はアクションメソッド呼び出し時に実行される
 * - 可読性向上：プロパティとして明示的に定義
 * - 型安全性：TypeScriptによる厳格な型チェック
 *
 * ## セレクタ選択の改善点
 * - **アクセシビリティ重視**: WAI-ARIAの役割、ラベル、alt属性を優先
 * - **`.or()`による段階的フォールバック**: 役割ベース → 属性ベース → CSSセレクタの順で試行
 * - **保守性向上**: セマンティックな意味に基づく要素特定で変更に強い実装
 */
export class HeaderComponent {
  readonly page: Page

  // Atlas ヘッダー要素
  readonly atlasHeader: Locator
  readonly userName: Locator
  readonly userInfoBox: Locator
  readonly memberStatus: Locator

  // ポイント・アクション情報関連
  readonly pointInfo: Locator
  readonly pointAmount: Locator
  readonly actionInfo: Locator
  readonly actionAmount: Locator

  // サービスアイコン群
  readonly serviceDetail: Locator
  readonly messagesBadge: Locator
  readonly serviceConference: Locator
  readonly serviceSurvey: Locator
  readonly serviceCampaign: Locator
  readonly serviceTodo: Locator
  readonly todoBadge: Locator

  // 検索機能
  readonly searchArea: Locator

  constructor(page: Page) {
    this.page = page

    // Atlas ヘッダー全体（役割ベースセレクタ対応）
    // 注: M3.comのヘッダーにはrole="banner"が設定されていないため、
    // 他の要素で代替（heading "m3.com"の存在で確認）
    this.atlasHeader = page.getByRole('heading', { name: 'm3.com', level: 1 })

    // ユーザー名表示要素（M3共通）（役割ベースセレクタ対応）
    // 注: .or()を使って複数のセレクタを試行（Playwright推奨）
    // .first()で最初の要素を選択（strict mode違反を回避）
    this.userName = page.getByRole('button', { name: /先生|さん|様/ })
      .or(page.locator('.atlas-header__username'))
      .or(page.locator('.atlas-header__name'))
      .first()

    // ユーザー情報ドロップダウンエリア（役割ベースセレクタ対応）
    this.userInfoBox = page.getByRole('menu')
      .or(page.locator('[role="menu"]'))
      .or(page.locator('.atlas-header__infobox'))

    // 会員ステータス表示（役割ベースセレクタ対応）
    // .first()で最初の要素を選択（複数マッチする場合に対応）
    this.memberStatus = page.getByText(/ブロンズ会員|シルバー会員|ゴールド会員|プラチナ会員/)
      .or(page.locator('.atlas-header__point__status'))
      .first()

    // ポイント情報エリア全体
    this.pointInfo = page.locator('.atlas-header__point')

    // ポイント数表示（役割ベースセレクタ対応）
    // .first()で最初の要素を選択（複数マッチする場合に対応）
    this.pointAmount = page.getByText(/\d+p/)
      .or(page.locator('[title="ポイント商品"]').locator('span'))
      .or(page.locator('.atlas-header__point__amount'))
      .first()

    // アクション情報エリア全体
    this.actionInfo = page.locator('.atlas-header__action')

    // アクション数表示（役割ベースセレクタ対応）
    // .first()で最初の要素を選択（複数マッチする場合に対応）
    this.actionAmount = page.locator('[title="アクションとは"]').locator('span')
      .or(page.locator('.atlas-header__action .atlas-header__point__status'))
      .first()

    // メッセージ・詳細サービスアイコン（役割ベースセレクタ対応）
    this.serviceDetail = page.locator('[title="未読のメッセージに遷移します"]')
      .or(page.locator('.atlas-header__service-detail'))

    // メッセージ未読バッジ
    this.messagesBadge = page.locator('.atlas-header__service-detail .atlas-header__badge')

    // Web講演会サービスアイコン（役割ベースセレクタ対応）
    this.serviceConference = page.locator('[title="Web講演会"]')
      .or(page.locator('.atlas-header__service-conference'))

    // アンケートサービスアイコン（役割ベースセレクタ対応）
    this.serviceSurvey = page.locator('[title="アンケート"]')
      .or(page.locator('.atlas-header__service-survey'))

    // キャンペーンサービスアイコン（役割ベースセレクタ対応）
    this.serviceCampaign = page.locator('[title="キャンペーン"]')
      .or(page.locator('.atlas-header__service-campaign'))

    // ToDoサービスアイコン（役割ベースセレクタ対応）
    this.serviceTodo = page.locator('[title="ToDo"]')
      .or(page.locator('.atlas-header__service-todo'))

    // ToDoバッジ
    this.todoBadge = page.locator('.atlas-header__service-todo .atlas-header__badge')

    // 検索機能（役割ベースセレクタ対応）
    this.searchArea = page.getByRole('search')
      .or(page.getByRole('button', { name: /検索/ }))
      .or(page.locator('.atlas-header__search'))
  }

  // 便利メソッド群

  /**
   * Atlas ヘッダーの表示確認
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ヘッダーが表示されている場合true
   */
  async isHeaderVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.atlasHeader.waitFor({ state: 'visible', timeout })
      return true
    } catch (error: unknown) {
      return false
    }
  }

  /**
   * ログイン状態の確認（役割ベースセレクタ対応）
   *
   * @param timeout タイムアウト時間（ミリ秒、デフォルト: 2000）
   * @returns ログイン済みの場合true
   * @description
   * ユーザー名要素の可視性でログイン状態を判定。
   * 未ログイン状態を即座に判定するため、短いタイムアウトを使用。
   */
  async isLoggedIn(timeout: number = 2000): Promise<boolean> {
    return await this.userName.isVisible({ timeout }).catch(() => false)
  }

  /**
   * ユーザー名の取得（役割ベースセレクタ対応）
   *
   * @param timeout タイムアウト時間（ミリ秒、デフォルト: 2000）
   * @returns ユーザー名（取得できない場合は空文字）
   * @description
   * 要素の可視性を確認してからテキストを取得。
   * 短いタイムアウトで即座に判定。
   */
  async getUserName(timeout: number = 2000): Promise<string> {
    const isVisible = await this.userName.isVisible({ timeout }).catch(() => false)
    if (!isVisible) {
      return ''
    }
    const text = await this.userName.textContent()
    return text?.trim() || ''
  }

  /**
   * ポイント数の取得
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ポイント数（取得できない場合は0）
   */
  async getPointValue(timeout: number = 5000): Promise<number> {
    try {
      await this.pointAmount.waitFor({ state: 'visible', timeout })
      const text = await this.pointAmount.textContent()
      const match = text?.match(/(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    } catch (error: unknown) {
      return 0
    }
  }

  /**
   * アクション数の取得
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns アクション数（取得できない場合は0）
   */
  async getActionValue(timeout: number = 5000): Promise<number> {
    try {
      await this.actionAmount.waitFor({ state: 'visible', timeout })
      const text = await this.actionAmount.textContent()
      const match = text?.match(/(\d+)/)
      return match ? parseInt(match[1], 10) : 0
    } catch (error: unknown) {
      return 0
    }
  }

  /**
   * 会員ステータスの取得
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 会員ステータス（取得できない場合は空文字）
   */
  async getMemberStatus(timeout: number = 5000): Promise<string> {
    try {
      await this.memberStatus.waitFor({ state: 'visible', timeout })
      const text = await this.memberStatus.textContent()
      return text?.trim() || ''
    } catch (error: unknown) {
      return ''
    }
  }

  /**
   * サービスアイコンのクリック
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

    await service.waitFor({ state: 'visible' })
    await service.click()
  }

  /**
   * 未読メッセージ数の取得
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
   * ToDo状態の取得
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
   * ログアウト処理
   *
   * @description
   * ユーザー名をクリックしてドロップダウンメニューを開き、
   * ログアウトリンクをクリックしてログアウトを実行。
   * SPA対応のため、ユーザー名要素が非表示になることでログアウト完了を判定。
   *
   * @throws ログアウト処理に失敗した場合にエラーをスロー
   */
  async performLogout(): Promise<void> {
    // ユーザー名をクリックしてドロップダウンメニューを開く
    await this.userName.waitFor({ state: 'visible' })
    await this.userName.click()

    // ログアウトリンクをクリック
    const logoutLink = this.page.getByRole('link', { name: 'ログアウト' })
    await logoutLink.waitFor({ state: 'visible' })
    await logoutLink.click()

    // ログアウト完了を待機（ユーザー名が非表示になることを確認）
    await this.userName.waitFor({ state: 'hidden' })
  }
}

/**
 * HeaderComponentクラス - Playwright推奨パターンに準拠
 *
 * このクラスはPlaywrightの公式Page Object Modelパターンに準拠し、
 * 役割ベースセレクタを採用した堅牢な実装となっています。
 *
 * ## Playwright推奨パターンの採用
 *
 * ### コンストラクタでの一括初期化
 * ```typescript
 * constructor(page: Page) {
 *   this.page = page
 *   // .or()を使って複数のセレクタを定義（Playwright推奨）
 *   this.userName = page.getByRole('button', { name: /先生|さん|様/ })
 *     .or(page.locator('.atlas-header__username'))
 *     .or(page.locator('.atlas-header__name'))
 * }
 * ```
 *
 * ### 利点
 * - **Locatorは「定義」**: 実際の検索はアクションメソッド呼び出し時に実行される
 * - **可読性向上**: プロパティとして明示的に定義され、コード補完が効く
 * - **型安全性**: TypeScriptの型チェックが厳格に機能
 * - **保守性向上**: 要素定義が一箇所に集約され、変更が容易
 *
 * ## `.or()`による段階的セレクタ戦略
 *
 * ### 使用方法
 * ```typescript
 * this.userName = page.getByRole('button', { name: /先生|さん|様/ })
 *   .or(page.locator('.atlas-header__username'))
 *   .or(page.locator('.atlas-header__name'))
 * ```
 *
 * ### セレクタ優先順位
 * 1. **役割ベース**: `getByRole()`, `getByLabel()`, `getByText()`
 * 2. **属性ベース**: `[title="..."]`, `[data-testid="..."]`
 * 3. **CSSセレクタ**: `.class-name`（最後の手段）
 *
 * ### 特徴
 * - Playwrightが自動的に最初にマッチした要素を使用
 * - try-catchは不要（Locatorは定義時にエラーを投げない）
 * - 動的なDOM変更にも対応（各アクションメソッド呼び出し時に再評価）
 *
 * ## 使用例
 *
 * ```typescript
 * import { HeaderComponent } from '@/shared-e2e-components/common/headerComponent'
 *
 * test('ヘッダー要素の検証', async ({ page }) => {
 *   const header = new HeaderComponent(page)
 *
 *   // ログイン状態確認（isVisible()ベースで即座に判定）
 *   const isLoggedIn = await header.isLoggedIn()
 *   expect(isLoggedIn).toBe(true)
 *
 *   // ユーザー名取得
 *   const username = await header.getUserName()
 *   expect(username).toBeTruthy()
 *
 *   // ログアウト（状態変化ベースで完了を待機）
 *   await header.performLogout()
 * })
 * ```
 */
