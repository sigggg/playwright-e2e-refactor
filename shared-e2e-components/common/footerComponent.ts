import { Page, Locator } from '@playwright/test'

/**
 * M3サービス群共通フッターコンポーネント
 *
 * @description
 * - M3.comの共通フッター（Atlas）とサービス固有フッターの両方に対応
 * - ユーザー情報表示、ポリシーリンク、アプリ紹介、著作権表示などを管理
 * - 利用規約、プライバシーポリシー、ヘルプなどの重要リンクを含む
 * - サービス固有のヘルプメニューにも対応
 *
 * ## Playwright推奨パターンに準拠
 * - コンストラクタで全Locatorをreadonly propertyとして一括初期化
 * - パフォーマンス向上：要素参照が固定され、毎回の評価が不要
 * - 可読性向上：プロパティとして明示的に定義
 * - 型安全性：TypeScriptによる厳格な型チェック
 */
export class FooterComponent {
  readonly page: Page

  // フッター全体
  readonly root: Locator

  // ユーザー情報エリア（SPフッター用）
  readonly userInfo: Locator
  readonly userName: Locator
  readonly userStatus: Locator
  readonly m3Point: Locator
  readonly actionPoint: Locator
  readonly pointProductLink: Locator
  readonly actionHistoryLink: Locator

  // アプリ紹介エリア
  readonly appSection: Locator
  readonly appLinks: Locator
  readonly m3App: Locator
  readonly todoPlusApp: Locator
  readonly webSeminarApp: Locator
  readonly careerApp: Locator
  readonly ebookApp: Locator

  // ポリシー・ナビゲーションエリア（Atlas共通）
  readonly policySection: Locator
  readonly termsOfUse: Locator
  readonly privacyPolicy: Locator
  readonly harassmentPolicy: Locator
  readonly help: Locator
  readonly contact: Locator
  readonly aboutM3: Locator
  readonly copyrightText: Locator
  readonly copyright: Locator
  readonly allLinks: Locator

  // サービス固有ヘルプメニュー（電子書籍など）
  readonly serviceHelpMenu: Locator
  readonly howToUse: Locator
  readonly aboutPrime: Locator
  readonly memberAgreement: Locator
  readonly primeServiceAgreement: Locator
  readonly legalNotice: Locator
  readonly faq: Locator
  readonly forBeginners: Locator
  readonly notice: Locator

  constructor(page: Page) {
    this.page = page

    // フッター全体の要素
    this.root = page.locator('footer.atlas-sp-footer')

    // ユーザー情報エリア（SPフッター用）
    this.userInfo = page.locator('footer.atlas-sp-footer .atlas-sp-userinfo')
    this.userName = page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__name')
    this.userStatus = page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__status')
    this.m3Point = page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--m3 a')
    this.actionPoint = page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--action a')
    this.pointProductLink = page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--m3 a[title="ポイント商品"]')
    this.actionHistoryLink = page.locator('footer.atlas-sp-footer .atlas-sp-userinfo__point--action a[title="アクションとは"]')

    // アプリ紹介エリア
    this.appSection = page.locator('.atlas-footer__apps')
    this.appLinks = page.locator('.atlas-footer__apps ul li a')
    this.m3App = page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3.comアプリ' })
    this.todoPlusApp = page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3 ToDo Plus' })
    this.webSeminarApp = page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3 Web講演会' })
    this.careerApp = page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3.com CAREER' })
    this.ebookApp = page.locator('.atlas-footer__apps .apps__title', { hasText: 'm3.com 電子書籍アプリ' })

    // ポリシー・ナビゲーションエリア（Atlas共通）
    // 役割ベースセレクタを優先使用
    this.policySection = page.locator('.atlas-footer__bottom .atlas-footer__nav')
    this.termsOfUse = page.getByRole('link', { name: '利用規約' })
    this.privacyPolicy = page.getByRole('link', { name: '個人情報の取り扱いについて' })
    this.harassmentPolicy = page.getByRole('link', { name: 'カスタマーハラスメントポリシー' })
    this.help = page.getByRole('link', { name: 'ヘルプ' })
    this.contact = page.getByRole('link', { name: 'お問い合わせ' })
    this.aboutM3 = page.getByRole('link', { name: 'm3.comとは' })
    this.copyrightText = page.locator('.atlas-footer__copyright')
    this.copyright = page.locator('footer.atlas-sp-footer small')
    this.allLinks = page.locator('footer.atlas-sp-footer a')

    // サービス固有ヘルプメニュー（電子書籍など）
    // 役割ベースセレクタを優先使用
    this.serviceHelpMenu = page.locator('.book-menu .content')
    this.howToUse = page.getByRole('link', { name: 'ご利用方法' })
    this.aboutPrime = page.getByRole('link', { name: 'プライム会員について' })
    this.memberAgreement = page.getByRole('link', { name: 'm3.com電子書籍会員規約' })
    this.primeServiceAgreement = page.getByRole('link', { name: 'プライム会員サービス個別規約' })
    this.legalNotice = page.getByRole('link', { name: '特定商取引に基づく表記' })
    this.faq = page.getByRole('link', { name: 'よくある質問' })
    this.forBeginners = page.getByRole('link', { name: '初めての方へ' })
    this.notice = page.getByRole('link', { name: 'お知らせ' })
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

/**
 * FooterComponentクラス - Playwright推奨パターンに準拠
 *
 * このクラスはPlaywrightの公式Page Object Modelパターンに準拠し、
 * 明確で保守性の高い実装となっています。
 *
 * ## Playwright推奨パターンの採用
 *
 * ### コンストラクタでの一括初期化
 * ```typescript
 * constructor(page: Page) {
 *   this.page = page;
 *   this.termsOfUse = page.locator('.atlas-footer__nav a', { hasText: '利用規約' });
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
 * ## 使用例
 *
 * ```typescript
 * import { FooterComponent } from '@/shared-e2e-components/common/footerComponent';
 *
 * test('フッター要素の検証', async ({ page }) => {
 *   const footer = new FooterComponent(page);
 *
 *   // フッターの表示確認
 *   const isVisible = await footer.isFooterVisible();
 *   expect(isVisible).toBe(true);
 *
 *   // 利用規約リンクのクリック
 *   await footer.clickTermsOfUse();
 *
 *   // サービス固有ヘルプメニューの確認
 *   const hasHelp = await footer.hasServiceHelpMenu();
 *   if (hasHelp) {
 *     await footer.clickServiceHelpLink('faq');
 *   }
 * });
 * ```
 */
