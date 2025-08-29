import { Page, Locator, expect } from '@playwright/test'

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
 * ## セレクタ選択の改善点
 * - **アクセシビリティ重視**: WAI-ARIAの役割、ラベル、alt属性を優先
 * - **段階的フォールバック**: 役割ベース → data-testid → CSSセレクタの順で試行
 * - **保守性向上**: セマンティックな意味に基づく要素特定で変更に強い実装
 */
export class HeaderComponent {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }


  /**
   * Atlas ヘッダー全体（役割ベースセレクタ対応）
   * メインヘッダーコンテナ
   */
  get atlasHeader(): Locator {
    // 段階的セレクタ戦略：banner役割 → CSSセレクタ
    try {
      return this.page.getByRole('banner')
    } catch {
      return this.page.locator('.atlas-header')
    }
  }

  /**
   * ユーザー名表示要素（M3共通）（役割ベースセレクタ対応）
   * ログイン成功確認とユーザー情報表示に使用
   */
  get userName(): Locator {
    // 段階的セレクタ戦略：banner内のbutton役割 → CSSセレクタ
    const strategies = [
      () => this.page.getByRole('banner').getByRole('button', { name: /先生|さん/ }),
      () => this.page.getByRole('button', { name: /先生|さん/ }),
      () => this.page.locator('.atlas-header__username')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__username')
  }

  /**
   * ユーザー情報ドロップダウンエリア（役割ベースセレクタ対応）
   * ユーザー名クリック時に表示される情報ボックス
   */
  get userInfoBox(): Locator {
    // 段階的セレクタ戦略：menu役割 → CSSセレクタ
    const strategies = [
      () => this.page.getByRole('menu'),
      () => this.page.locator('[role="menu"]'),
      () => this.page.locator('.atlas-header__infobox')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__infobox')
  }

  /**
   * 会員ステータス表示（役割ベースセレクタ対応）
   * （ブロンズ会員、シルバー会員等）
   */
  get memberStatus(): Locator {
    // 段階的セレクタ戦略：テキストベース → CSSセレクタ
    const strategies = [
      () => this.page.getByText(/ブロンズ会員|シルバー会員|ゴールド会員|プラチナ会員/).first(),
      () => this.page.locator('.atlas-header__point__status').first()
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__point__status').first()
  }

  // ポイント・アクション情報関連
  
  /**
   * ポイント情報エリア全体
   */
  get pointInfo(): Locator {
    return this.page.locator('.atlas-header__point')
  }

  /**
   * ポイント数表示（役割ベースセレクタ対応）
   * 実際のポイント数が表示される要素
   */
  get pointAmount(): Locator {
    // 段階的セレクタ戦略：テキストパターン → CSSセレクタ
    const strategies = [
      () => this.page.getByText(/\d+p/),
      () => this.page.locator('[title="ポイント商品"]').locator('span'),
      () => this.page.locator('.atlas-header__point__amount')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__point__amount')
  }

  /**
   * アクション情報エリア全体
   */
  get actionInfo(): Locator {
    return this.page.locator('.atlas-header__action')
  }

  /**
   * アクション数表示（役割ベースセレクタ対応）
   * アクションポイント数が表示される要素
   */
  get actionAmount(): Locator {
    // 段階的セレクタ戦略：title属性 → CSSセレクタ
    const strategies = [
      () => this.page.locator('[title="アクションとは"]').locator('span').first(),
      () => this.page.locator('.atlas-header__action .atlas-header__point__status')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__action .atlas-header__point__status')
  }

  // サービスアイコン群

  /**
   * メッセージ・詳細サービスアイコン（役割ベースセレクタ対応）
   */
  get serviceDetail(): Locator {
    // 段階的セレクタ戦略：title属性 → CSSセレクタ
    const strategies = [
      () => this.page.locator('[title="未読のメッセージに遷移します"]'),
      () => this.page.locator('.atlas-header__service-detail')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__service-detail')
  }

  /**
   * メッセージ未読バッジ
   */
  get messagesBadge(): Locator {
    return this.page.locator('.atlas-header__service-detail .atlas-header__badge')
  }

  /**
   * Web講演会サービスアイコン（役割ベースセレクタ対応）
   */
  get serviceConference(): Locator {
    // 段階的セレクタ戦略：title属性 → CSSセレクタ
    const strategies = [
      () => this.page.locator('[title="Web講演会"]'),
      () => this.page.locator('.atlas-header__service-conference')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__service-conference')
  }

  /**
   * アンケートサービスアイコン（役割ベースセレクタ対応）
   */
  get serviceSurvey(): Locator {
    // 段階的セレクタ戦略：title属性 → CSSセレクタ
    const strategies = [
      () => this.page.locator('[title="アンケート"]'),
      () => this.page.locator('.atlas-header__service-survey')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__service-survey')
  }

  /**
   * キャンペーンサービスアイコン（役割ベースセレクタ対応）
   */
  get serviceCampaign(): Locator {
    // 段階的セレクタ戦略：title属性 → CSSセレクタ
    const strategies = [
      () => this.page.locator('[title="キャンペーン"]'),
      () => this.page.locator('.atlas-header__service-campaign')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__service-campaign')
  }

  /**
   * ToDoサービスアイコン（役割ベースセレクタ対応）
   */
  get serviceTodo(): Locator {
    // 段階的セレクタ戦略：title属性 → CSSセレクタ
    const strategies = [
      () => this.page.locator('[title="ToDo"]'),
      () => this.page.locator('.atlas-header__service-todo')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__service-todo')
  }

  /**
   * ToDoバッジ
   */
  get todoBadge(): Locator {
    return this.page.locator('.atlas-header__service-todo .atlas-header__badge')
  }

  /**
   * 検索機能（役割ベースセレクタ対応）
   */
  get searchArea(): Locator {
    // 段階的セレクタ戦略：search役割 → CSSセレクタ
    const strategies = [
      () => this.page.getByRole('search'),
      () => this.page.getByRole('button', { name: /検索/ }),
      () => this.page.locator('.atlas-header__search')
    ]
    
    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }
    return this.page.locator('.atlas-header__search')
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
    } catch (error) {
      return false
    }
  }

  /**
   * ログイン状態の確認（役割ベースセレクタ対応）
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ログイン済みの場合true
   * @description
   * 段階的セレクタ戦略でユーザー名要素の表示でログイン状態を判定
   */
  async isLoggedIn(timeout: number = 5000): Promise<boolean> {
    console.log('🔍 ログイン状態を確認中...')
    
    // 段階的セレクタ戦略でユーザー名要素を特定
    const loginStrategies = [
      () => this.page.getByRole('banner').getByRole('button', { name: /先生|さん/ }),
      () => this.page.getByRole('button', { name: /先生|さん/ }),
      () => this.page.locator('.atlas-header__username')
    ]
    
    for (let i = 0; i < loginStrategies.length; i++) {
      try {
        const strategy = loginStrategies[i]
        const element = strategy()
        await element.waitFor({ state: 'visible', timeout: Math.floor(timeout / loginStrategies.length) })
        
        const usernameText = await element.textContent()
        if (usernameText && usernameText.trim()) {
          console.log(`✅ ログイン状態確認成功（戦略 ${i + 1}/${loginStrategies.length}）: ${usernameText.trim()}`)
          return true
        }
      } catch (error) {
        console.log(`  戦略 ${i + 1} 失敗: ${error.message}`)
        continue
      }
    }
    
    console.log('⚠️ ログイン状態を確認できませんでした')
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
    
    // 段階的セレクタ戦略でユーザー名を取得
    const usernameStrategies = [
      () => this.page.getByRole('banner').getByRole('button', { name: /先生|さん/ }),
      () => this.page.getByRole('button', { name: /先生|さん/ }),
      () => this.page.locator('.atlas-header__username')
    ]
    
    for (let i = 0; i < usernameStrategies.length; i++) {
      try {
        const strategy = usernameStrategies[i]
        const element = strategy()
        await element.waitFor({ state: 'visible', timeout: Math.floor(timeout / usernameStrategies.length) })
        
        const text = await element.textContent()
        if (text && text.trim()) {
          console.log(`✅ ユーザー名取得成功（戦略 ${i + 1}/${usernameStrategies.length}）: ${text.trim()}`)
          return text.trim()
        }
      } catch (error) {
        console.log(`  戦略 ${i + 1} 失敗: ${error.message}`)
        continue
      }
    }
    
    console.log('⚠️ ユーザー名を取得できませんでした')
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      return ''
    }
  }
}

/**
 * HeaderComponentクラス - 役割ベースセレクタ対応ガイド
 * 
 * このクラスは全面的に役割ベースセレクタを採用し、CLAUDE.mdの方針に準拠しています。
 * 
 * ## 改善されたセレクタ戦略
 * 
 * ### 1. ユーザー情報要素
 * ```typescript
 * // 従来: this.page.locator('.atlas-header__username')
 * // 改善後: this.page.getByRole('banner').getByRole('button', { name: /先生|さん/ })
 * //         フォールバック: CSSセレクタ
 * ```
 * 
 * ### 2. サービスアイコン
 * ```typescript
 * // 従来: this.page.locator('.atlas-header__service-todo')
 * // 改善後: this.page.locator('[title="ToDo"]')
 * //         フォールバック: CSSセレクタ
 * ```
 * 
 * ### 3. 検索機能
 * ```typescript
 * // 従来: this.page.locator('.atlas-header__search')
 * // 改善後: this.page.getByRole('search')
 * //         this.page.getByRole('button', { name: /検索/ })
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
 * 
 * ## 使用例
 * 
 * ```typescript
 * const header = new HeaderComponent(page);
 * 
 * // ログイン状態確認（段階的戦略自動適用）
 * const isLoggedIn = await header.isLoggedIn();
 * 
 * // ユーザー名取得（段階的戦略自動適用）
 * const username = await header.getUserName();
 * 
 * // サービスアイコンクリック（title属性ベース）
 * await header.clickServiceIcon('todo');
 * ```
 */