import { Page, Locator } from '@playwright/test'

/**
 * M3サービス群共通フッターコンポーネント
 * 
 * @description
 * - M3.comの共通フッター（Atlas）とサービス固有フッターの両方に対応
 * - ユーザー情報表示、ポリシーリンク、アプリ紹介、著作権表示などを管理
 * - 利用規約、プライバシーポリシー、ヘルプなどの重要リンクを含む
 * - サービス固有のヘルプメニューにも対応
 */
export class FooterComponent {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  /**
   * フッター全体の要素
   * フッターの存在確認に使用
   */
  get root(): Locator {
    return this.page.locator('footer.atlas-sp-footer')
  }

  // ユーザー情報エリア（SPフッター用）

  /**
   * ユーザー情報エリア全体
   */
  get userInfo(): Locator {
    return this.page.locator('footer.atlas-sp-footer .atlas-sp-userinfo')
  }

  /**
   * ユーザー名表示
   */
  get userName(): Locator {
    return this.page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__name')
  }

  /**
   * ユーザーステータス表示
   */
  get userStatus(): Locator {
    return this.page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__status')
  }

  /**
   * M3ポイントリンク
   */
  get m3Point(): Locator {
    return this.page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--m3 a')
  }

  /**
   * アクションポイントリンク
   */
  get actionPoint(): Locator {
    return this.page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--action a')
  }

  /**
   * ポイント商品リンク
   */
  get pointProductLink(): Locator {
    return this.page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--m3 a[title="ポイント商品"]')
  }

  /**
   * アクション履歴リンク
   */
  get actionHistoryLink(): Locator {
    return this.page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--action a[title="アクションとは"]')
  }

  // アプリ紹介エリア

  /**
   * アプリ紹介セクション全体
   */
  get appSection(): Locator {
    return this.page.locator('.atlas-footer__apps')
  }

  /**
   * 全アプリリンク
   */
  get appLinks(): Locator {
    return this.page.locator('.atlas-footer__apps ul li a')
  }

  /**
   * m3.comアプリ
   */
  get m3App(): Locator {
    return this.page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3.comアプリ' })
  }

  /**
   * m3 ToDo Plusアプリ
   */
  get todoPlusApp(): Locator {
    return this.page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3 ToDo Plus' })
  }

  /**
   * m3 Web講演会アプリ
   */
  get webSeminarApp(): Locator {
    return this.page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3 Web講演会' })
  }

  /**
   * m3.com CAREERアプリ
   */
  get careerApp(): Locator {
    return this.page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3.com CAREER' })
  }

  /**
   * m3.com 電子書籍アプリ
   */
  get ebookApp(): Locator {
    return this.page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3.com 電子書籍アプリ' })
  }

  // ポリシー・ナビゲーションエリア（Atlas共通）

  /**
   * ポリシーセクション全体
   */
  get policySection(): Locator {
    return this.page.locator('.atlas-footer__bottom .atlas-footer__nav')
  }

  /**
   * 利用規約リンク
   */
  get termsOfUse(): Locator {
    return this.page.locator('.atlas-footer__nav a', { hasText: '利用規約' })
  }

  /**
   * プライバシーポリシーリンク
   */
  get privacyPolicy(): Locator {
    return this.page.locator('.atlas-footer__nav a', { hasText: '個人情報の取り扱いについて' })
  }

  /**
   * カスタマーハラスメントポリシーリンク
   */
  get harassmentPolicy(): Locator {
    return this.page.locator('.atlas-footer__nav a', { hasText: 'カスタマーハラスメントポリシー' })
  }

  /**
   * ヘルプリンク
   */
  get help(): Locator {
    return this.page.locator('.atlas-footer__nav a', { hasText: 'ヘルプ' })
  }

  /**
   * お問い合わせリンク
   */
  get contact(): Locator {
    return this.page.locator('.atlas-footer__nav a', { hasText: 'お問い合わせ' })
  }

  /**
   * m3.comとはリンク
   */
  get aboutM3(): Locator {
    return this.page.locator('.atlas-footer__nav a', { hasText: 'm3.comとは' })
  }

  /**
   * 著作権表示テキスト
   */
  get copyrightText(): Locator {
    return this.page.locator('.atlas-footer__copyright')
  }

  /**
   * 簡易著作権表示（SP用）
   */
  get copyright(): Locator {
    return this.page.locator('footer.atlas-sp-footer small')
  }

  /**
   * 全体のリンク要素
   */
  get allLinks(): Locator {
    return this.page.locator('footer.atlas-sp-footer a')
  }

  // サービス固有ヘルプメニュー（電子書籍など）

  /**
   * サービス固有ヘルプメニュー
   */
  get serviceHelpMenu(): Locator {
    return this.page.locator('.book-menu .content')
  }

  /**
   * ご利用方法リンク
   */
  get howToUse(): Locator {
    return this.page.locator('.book-menu .content a:has-text("ご利用方法")')
  }

  /**
   * プライム会員についてリンク
   */
  get aboutPrime(): Locator {
    return this.page.locator('.book-menu .content a:has-text("プライム会員について")')
  }

  /**
   * m3.com電子書籍会員規約リンク
   */
  get memberAgreement(): Locator {
    return this.page.locator('.book-menu .content a:has-text("m3.com電子書籍会員規約")')
  }

  /**
   * プライム会員サービス個別規約リンク
   */
  get primeServiceAgreement(): Locator {
    return this.page.locator('.book-menu .content a:has-text("プライム会員サービス個別規約")')
  }

  /**
   * 特定商取引に基づく表記リンク
   */
  get legalNotice(): Locator {
    return this.page.locator('.book-menu .content a:has-text("特定商取引に基づく表記")')
  }

  /**
   * よくある質問リンク
   */
  get faq(): Locator {
    return this.page.locator('.book-menu .content a:has-text("よくある質問")')
  }

  /**
   * 初めての方へリンク
   */
  get forBeginners(): Locator {
    return this.page.locator('.book-menu .content a:has-text("初めての方へ")')
  }

  /**
   * お知らせリンク
   */
  get notice(): Locator {
    return this.page.locator('.book-menu .content a:has-text("お知らせ")')
  }

  // 便利メソッド群

  /**
   * フッターの存在確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns フッターが存在する場合true
   */
  async isFooterVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.root.waitFor({ state: 'visible', timeout })
      return true
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
   * ユーザーステータスの取得
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns ユーザーステータス（取得できない場合は空文字）
   */
  async getUserStatus(timeout: number = 5000): Promise<string> {
    try {
      await this.userStatus.waitFor({ state: 'visible', timeout })
      const text = await this.userStatus.textContent()
      return text?.trim() || ''
    } catch (error) {
      return ''
    }
  }

  /**
   * 利用規約リンクのクリック
   * 
   * @description
   * 重要なポリシーページへの遷移テストに使用
   */
  async clickTermsOfUse(): Promise<void> {
    console.log('📜 利用規約リンクをクリック中...')
    await this.termsOfUse.waitFor({ state: 'visible', timeout: 10000 })
    await this.termsOfUse.click()
    console.log('✅ 利用規約リンクのクリックが完了しました')
  }

  /**
   * プライバシーポリシーリンクのクリック
   * 
   * @description
   * 個人情報保護方針ページへの遷移テストに使用
   */
  async clickPrivacyPolicy(): Promise<void> {
    console.log('🔒 プライバシーポリシーリンクをクリック中...')
    await this.privacyPolicy.waitFor({ state: 'visible', timeout: 10000 })
    await this.privacyPolicy.click()
    console.log('✅ プライバシーポリシーリンクのクリックが完了しました')
  }

  /**
   * ヘルプリンクのクリック
   * 
   * @description
   * ヘルプページへの遷移テストに使用
   */
  async clickHelp(): Promise<void> {
    console.log('❓ ヘルプリンクをクリック中...')
    await this.help.waitFor({ state: 'visible', timeout: 10000 })
    await this.help.click()
    console.log('✅ ヘルプリンクのクリックが完了しました')
  }

  /**
   * お問い合わせリンクのクリック
   * 
   * @description
   * お問い合わせページへの遷移テストに使用
   */
  async clickContact(): Promise<void> {
    console.log('📧 お問い合わせリンクをクリック中...')
    await this.contact.waitFor({ state: 'visible', timeout: 10000 })
    await this.contact.click()
    console.log('✅ お問い合わせリンクのクリックが完了しました')
  }

  /**
   * アプリリンクのクリック
   * 
   * @param appType アプリの種類
   * @description
   * 各種アプリダウンロードページへの遷移テストに使用
   */
  async clickAppLink(appType: 'm3' | 'todoplus' | 'webseminar' | 'career' | 'ebook'): Promise<void> {
    let appElement: Locator

    switch (appType) {
      case 'm3':
        appElement = this.m3App
        break
      case 'todoplus':
        appElement = this.todoPlusApp
        break
      case 'webseminar':
        appElement = this.webSeminarApp
        break
      case 'career':
        appElement = this.careerApp
        break
      case 'ebook':
        appElement = this.ebookApp
        break
      default:
        throw new Error(`未対応のアプリタイプです: ${appType}`)
    }

    console.log(`📱 ${appType}アプリリンクをクリック中...`)
    await appElement.waitFor({ state: 'visible', timeout: 10000 })
    await appElement.click()
    console.log(`✅ ${appType}アプリリンクのクリックが完了しました`)
  }

  /**
   * サービス固有ヘルプメニューの確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns サービス固有ヘルプメニューが存在する場合true
   */
  async hasServiceHelpMenu(timeout: number = 5000): Promise<boolean> {
    try {
      await this.serviceHelpMenu.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * サービス固有ヘルプリンクのクリック
   * 
   * @param linkType ヘルプリンクの種類
   * @description
   * サービス固有のヘルプページ遷移テストに使用
   */
  async clickServiceHelpLink(linkType: 'howToUse' | 'aboutPrime' | 'memberAgreement' | 'primeServiceAgreement' | 'legalNotice' | 'faq' | 'forBeginners' | 'notice'): Promise<void> {
    let helpElement: Locator

    switch (linkType) {
      case 'howToUse':
        helpElement = this.howToUse
        break
      case 'aboutPrime':
        helpElement = this.aboutPrime
        break
      case 'memberAgreement':
        helpElement = this.memberAgreement
        break
      case 'primeServiceAgreement':
        helpElement = this.primeServiceAgreement
        break
      case 'legalNotice':
        helpElement = this.legalNotice
        break
      case 'faq':
        helpElement = this.faq
        break
      case 'forBeginners':
        helpElement = this.forBeginners
        break
      case 'notice':
        helpElement = this.notice
        break
      default:
        throw new Error(`未対応のヘルプリンクタイプです: ${linkType}`)
    }

    console.log(`📖 ${linkType}ヘルプリンクをクリック中...`)
    await helpElement.waitFor({ state: 'visible', timeout: 10000 })
    await helpElement.click()
    console.log(`✅ ${linkType}ヘルプリンクのクリックが完了しました`)
  }

  /**
   * 著作権表示の取得
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 著作権表示テキスト（取得できない場合は空文字）
   */
  async getCopyrightText(timeout: number = 5000): Promise<string> {
    try {
      const copyrightElement = await this.copyrightText.count() > 0 ? this.copyrightText : this.copyright
      await copyrightElement.waitFor({ state: 'visible', timeout })
      const text = await copyrightElement.textContent()
      return text?.trim() || ''
    } catch (error) {
      return ''
    }
  }
}