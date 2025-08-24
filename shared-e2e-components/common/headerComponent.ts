import { Page, Locator } from '@playwright/test'

/**
 * M3サービス群共通ヘッダーコンポーネント
 * 
 * @description
 * - M3.comの共通ヘッダー（Atlas）とサービス固有ヘッダーの両方に対応
 * - ログイン状態の確認、ユーザー情報表示、ナビゲーション機能を提供
 * - PC/SP両対応で画面サイズに応じた要素の取得が可能
 * - ポイント情報、サービス固有アイコンなど汎用的な要素を管理
 */
export class HeaderComponent {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }


  /**
   * Atlas ヘッダー全体
   * メインヘッダーコンテナ
   */
  get atlasHeader(): Locator {
    return this.page.locator('.atlas-header')
  }

  /**
   * ユーザー名表示要素（M3共通）
   * ログイン成功確認とユーザー情報表示に使用
   */
  get userName(): Locator {
    return this.page.locator('.atlas-header__username')
  }

  /**
   * ユーザー情報ドロップダウンエリア
   * ユーザー名クリック時に表示される情報ボックス
   */
  get userInfoBox(): Locator {
    return this.page.locator('.atlas-header__infobox')
  }

  /**
   * 会員ステータス表示
   * （ブロンズ会員、シルバー会員等）
   */
  get memberStatus(): Locator {
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
   * ポイント数表示
   * 実際のポイント数が表示される要素
   */
  get pointAmount(): Locator {
    return this.page.locator('.atlas-header__point__amount')
  }

  /**
   * アクション情報エリア全体
   */
  get actionInfo(): Locator {
    return this.page.locator('.atlas-header__action')
  }

  /**
   * アクション数表示
   * アクションポイント数が表示される要素
   */
  get actionAmount(): Locator {
    return this.page.locator('.atlas-header__action .atlas-header__point__status')
  }

  // サービスアイコン群

  /**
   * メッセージ・詳細サービスアイコン
   */
  get serviceDetail(): Locator {
    return this.page.locator('.atlas-header__service-detail')
  }

  /**
   * メッセージ未読バッジ
   */
  get messagesBadge(): Locator {
    return this.page.locator('.atlas-header__service-detail .atlas-header__badge')
  }

  /**
   * Web講演会サービスアイコン
   */
  get serviceConference(): Locator {
    return this.page.locator('.atlas-header__service-conference')
  }

  /**
   * アンケートサービスアイコン
   */
  get serviceSurvey(): Locator {
    return this.page.locator('.atlas-header__service-survey')
  }

  /**
   * キャンペーンサービスアイコン
   */
  get serviceCampaign(): Locator {
    return this.page.locator('.atlas-header__service-campaign')
  }

  /**
   * ToDoサービスアイコン
   */
  get serviceTodo(): Locator {
    return this.page.locator('.atlas-header__service-todo')
  }

  /**
   * ToDoバッジ
   */
  get todoBadge(): Locator {
    return this.page.locator('.atlas-header__service-todo .atlas-header__badge')
  }

  /**
   * 検索機能
   */
  get searchArea(): Locator {
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
   * ログイン状態の確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ログイン済みの場合true
   * @description
   * ユーザー名要素の表示でログイン状態を判定
   */
  async isLoggedIn(timeout: number = 5000): Promise<boolean> {
    try {
      await this.userName.waitFor({ state: 'visible', timeout })
      const usernameText = await this.userName.textContent()
      return !!(usernameText && usernameText.trim())
    } catch (error) {
      return false
    }
  }

  /**
   * ユーザー名の取得
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ユーザー名（取得できない場合は空文字）
   */
  async getUserName(timeout: number = 5000): Promise<string> {
    try {
      await this.userName.waitFor({ state: 'visible', timeout })
      const text = await this.userName.textContent()
      return text?.trim() || ''
    } catch (error) {
      return ''
    }
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