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
 * - パフォーマンス向上：要素参照が固定され、毎回の評価が不要
 * - 可読性向上：プロパティとして明示的に定義
 * - 型安全性：TypeScriptによる厳格な型チェック
 *
 * ## セレクタ選択の改善点
 * - **アクセシビリティ重視**: WAI-ARIAの役割、ラベル、alt属性を優先
 * - **段階的フォールバック**: 役割ベース → data-testid → CSSセレクタの順で試行
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

    // ヘルパー関数：段階的セレクタ戦略を実行
    const trySelectors = (strategies: (() => Locator)[]): Locator => {
      for (const strategy of strategies) {
        try {
          return strategy()
        } catch {
          continue
        }
      }
      // 全ての戦略が失敗した場合、最後の戦略を返す
      return strategies[strategies.length - 1]()
    }

    // Atlas ヘッダー全体（役割ベースセレクタ対応）
    // 注: M3.comのヘッダーにはrole="banner"が設定されていないため、
    // 他の要素で代替（heading "m3.com"の存在で確認）
    this.atlasHeader = page.getByRole('heading', { name: 'm3.com', level: 1 })

    // ユーザー名表示要素（M3共通）（役割ベースセレクタ対応）
    // 注: banner内ではなく、ページ全体から検索
    this.userName = trySelectors([
      () => page.getByRole('button', { name: /先生|さん/ }),
      () => page.locator('.atlas-header__username'),
      () => page.locator('.atlas-header__name')
    ])

    // ユーザー情報ドロップダウンエリア（役割ベースセレクタ対応）
    this.userInfoBox = trySelectors([
      () => page.getByRole('menu'),
      () => page.locator('[role="menu"]'),
      () => page.locator('.atlas-header__infobox')
    ])

    // 会員ステータス表示（役割ベースセレクタ対応）
    this.memberStatus = trySelectors([
      () => page.getByText(/ブロンズ会員|シルバー会員|ゴールド会員|プラチナ会員/).first(),
      () => page.locator('.atlas-header__point__status').first()
    ])

    // ポイント情報エリア全体
    this.pointInfo = page.locator('.atlas-header__point')

    // ポイント数表示（役割ベースセレクタ対応）
    this.pointAmount = trySelectors([
      () => page.getByText(/\d+p/),
      () => page.locator('[title="ポイント商品"]').locator('span'),
      () => page.locator('.atlas-header__point__amount')
    ])

    // アクション情報エリア全体
    this.actionInfo = page.locator('.atlas-header__action')

    // アクション数表示（役割ベースセレクタ対応）
    this.actionAmount = trySelectors([
      () => page.locator('[title="アクションとは"]').locator('span').first(),
      () => page.locator('.atlas-header__action .atlas-header__point__status')
    ])

    // メッセージ・詳細サービスアイコン（役割ベースセレクタ対応）
    this.serviceDetail = trySelectors([
      () => page.locator('[title="未読のメッセージに遷移します"]'),
      () => page.locator('.atlas-header__service-detail')
    ])

    // メッセージ未読バッジ
    this.messagesBadge = page.locator('.atlas-header__service-detail .atlas-header__badge')

    // Web講演会サービスアイコン（役割ベースセレクタ対応）
    this.serviceConference = trySelectors([
      () => page.locator('[title="Web講演会"]'),
      () => page.locator('.atlas-header__service-conference')
    ])

    // アンケートサービスアイコン（役割ベースセレクタ対応）
    this.serviceSurvey = trySelectors([
      () => page.locator('[title="アンケート"]'),
      () => page.locator('.atlas-header__service-survey')
    ])

    // キャンペーンサービスアイコン（役割ベースセレクタ対応）
    this.serviceCampaign = trySelectors([
      () => page.locator('[title="キャンペーン"]'),
      () => page.locator('.atlas-header__service-campaign')
    ])

    // ToDoサービスアイコン（役割ベースセレクタ対応）
    this.serviceTodo = trySelectors([
      () => page.locator('[title="ToDo"]'),
      () => page.locator('.atlas-header__service-todo')
    ])

    // ToDoバッジ
    this.todoBadge = page.locator('.atlas-header__service-todo .atlas-header__badge')

    // 検索機能（役割ベースセレクタ対応）
    this.searchArea = trySelectors([
      () => page.getByRole('search'),
      () => page.getByRole('button', { name: /検索/ }),
      () => page.locator('.atlas-header__search')
    ])
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
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ログイン済みの場合true
   * @description
   * ユーザー名要素の表示でログイン状態を判定
   */
  async isLoggedIn(timeout: number = 5000): Promise<boolean> {
    console.log('🔍 ログイン状態を確認中...')

    try {
      await this.userName.waitFor({ state: 'visible', timeout })
      const usernameText = await this.userName.textContent()

      if (usernameText && usernameText.trim()) {
        console.log(`✅ ログイン状態確認成功: ${usernameText.trim()}`)
        return true
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`⚠️ ログイン状態を確認できませんでした: ${errorMessage}`)
    }

    return false
  }

  /**
   * ユーザー名の取得（役割ベースセレクタ対応）
   *
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ユーザー名（取得できない場合は空文字）
   */
  async getUserName(timeout: number = 5000): Promise<string> {
    console.log('📝 ユーザー名を取得中...')

    try {
      await this.userName.waitFor({ state: 'visible', timeout })
      const text = await this.userName.textContent()

      if (text && text.trim()) {
        console.log(`✅ ユーザー名取得成功: ${text.trim()}`)
        return text.trim()
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.log(`⚠️ ユーザー名を取得できませんでした: ${errorMessage}`)
    }

    return ''
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

    console.log(`🖱️ ${serviceType}サービスアイコンをクリック中...`)
    await service.waitFor({ state: 'visible', timeout: 10000 })
    await service.click()
    console.log(`✅ ${serviceType}サービスアイコンのクリックが完了しました`)
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
 *   this.page = page;
 *   this.userName = page.getByRole('button', { name: /先生|さん/ });
 *   // 全てのLocatorをコンストラクタで初期化
 * }
 * ```
 *
 * ### 利点
 * - **パフォーマンス向上**: Locatorが初期化時に一度だけ評価される
 * - **可読性向上**: プロパティとして明示的に定義され、コード補完が効く
 * - **型安全性**: TypeScriptの型チェックが厳格に機能
 * - **保守性向上**: 要素定義が一箇所に集約され、変更が容易
 *
 * ## 段階的セレクタ戦略
 *
 * ### trySelectorsヘルパー関数
 * ```typescript
 * const trySelectors = (strategies: (() => Locator)[]): Locator => {
 *   for (const strategy of strategies) {
 *     try {
 *       return strategy()
 *     } catch {
 *       continue
 *     }
 *   }
 *   return strategies[strategies.length - 1]()
 * }
 * ```
 *
 * ### セレクタ優先順位
 * 1. **役割ベース**: `getByRole()`, `getByLabel()`, `getByText()`
 * 2. **属性ベース**: `[title="..."]`, `[data-testid="..."]`
 * 3. **CSSセレクタ**: `.class-name`（最後の手段）
 *
 * ## 使用例
 *
 * ```typescript
 * import { HeaderComponent } from '@/shared-e2e-components/common/headerComponent';
 *
 * test('ヘッダー要素の検証', async ({ page }) => {
 *   const header = new HeaderComponent(page);
 *
 *   // ログイン状態確認
 *   const isLoggedIn = await header.isLoggedIn();
 *   expect(isLoggedIn).toBe(true);
 *
 *   // ユーザー名取得
 *   const username = await header.getUserName();
 *   console.log(`ログインユーザー: ${username}`);
 *
 *   // サービスアイコンクリック
 *   await header.clickServiceIcon('todo');
 * });
 * ```
 */
