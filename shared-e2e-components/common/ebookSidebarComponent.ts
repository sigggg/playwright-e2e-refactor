import { Page, Locator } from '@playwright/test'

/**
 * 電子書籍サービス専用サイドバーコンポーネント（LHS - Left Hand Side）
 * 
 * @description
 * - 電子書籍サービス特有の左サイドバー階層構造メニューを管理
 * - カテゴリ階層（大カテゴリ → 中カテゴリ → 小カテゴリ）の操作を提供
 * - 出版社リストなどのフィルタリング機能に対応
 * - ホバー操作による階層展開とクリック操作をサポート
 * - 電子書籍サービス固有の検索・絞り込み機能
 * 
 * @warning
 * このコンポーネントは電子書籍サービス専用です。
 * 他のM3サービスでは異なるサイドバー構造を持つ可能性があります。
 */
export class EbookSidebarComponent {
  private page: Page
  private root: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.locator('.l-sidebar__cnt')
  }

  /**
   * サイドバー全体の要素
   */
  get sidebarRoot(): Locator {
    return this.root
  }

  // カテゴリ関連要素

  /**
   * カテゴリセクション全体
   * カテゴリ機能の存在確認に使用
   */
  get categorySection(): Locator {
    return this.root.locator('.l-sidebar__nav__inner').filter({ 
      has: this.page.locator('.l-sidebar__heading', { hasText: 'カテゴリ' }) 
    })
  }

  /**
   * 大カテゴリリスト
   * 最上位階層のカテゴリ項目（例：初期研修医、雑誌など）
   */
  get majorCategoryList(): Locator {
    return this.categorySection.locator('ul.l-sidebar__list > li.is-nest')
  }

  /**
   * 出版社セクション全体
   * 出版社フィルタ機能の存在確認に使用
   */
  get publisherSection(): Locator {
    return this.root.locator('.l-sidebar__nav__inner').filter({ 
      has: this.page.locator('.l-sidebar__heading', { hasText: '出版社' }) 
    })
  }

  /**
   * 出版社リスト
   * 出版社によるフィルタリング機能
   */
  get publisherList(): Locator {
    return this.publisherSection.locator('ul.l-sidebar__list.l-sidebar__parent > li')
  }

  // カテゴリ操作メソッド

  /**
   * 大カテゴリ名で要素を取得
   * 
   * @param name 大カテゴリ名（例：初期研修医）
   * @returns 該当する大カテゴリのLocator
   */
  getMajorCategoryByName(name: string): Locator {
    return this.categorySection.locator('ul.l-sidebar__list > li.is-nest')
      .filter({
        has: this.page.locator('> a', { hasText: new RegExp(`^\\s*${name}\\s*$`) })
      })
  }

  /**
   * 大カテゴリ内の中カテゴリリストを取得
   * 
   * @param majorName 大カテゴリ名
   * @returns 中カテゴリリストのLocator
   */
  getChildCategoryList(majorName: string): Locator {
    return this.getMajorCategoryByName(majorName).locator('ul.l-sidebar__childlist > li')
  }

  /**
   * 中カテゴリ名で要素を取得
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名（例：内科）
   * @returns 該当する中カテゴリのLocator
   */
  getChildCategoryByName(majorName: string, childName: string): Locator {
    return this.getChildCategoryList(majorName).filter({ 
      has: this.page.locator('a', { hasText: new RegExp(`^\\s*${childName}\\s*$`) }) 
    })
  }

  /**
   * 中カテゴリ内の小カテゴリリストを取得
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名
   * @returns 小カテゴリリストのLocator
   */
  getGrandchildCategoryList(majorName: string, childName: string): Locator {
    return this.getChildCategoryByName(majorName, childName).locator('ul.l-sidebar__grandchildlist > li')
  }

  /**
   * 小カテゴリ名で要素を取得
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名
   * @param grandchildName 小カテゴリ名（例：病理と臨床）
   * @returns 該当する小カテゴリのLocator
   */
  getGrandchildCategoryByName(majorName: string, childName: string, grandchildName: string): Locator {
    return this.getGrandchildCategoryList(majorName, childName).filter({ 
      has: this.page.locator('a', { hasText: new RegExp(`^\\s*${grandchildName}\\s*$`) }) 
    })
  }

  // 出版社操作メソッド

  /**
   * 出版社名で要素を取得
   * 
   * @param name 出版社名（例：中外医学社）
   * @returns 該当する出版社のLocator
   */
  getPublisherByName(name: string): Locator {
    return this.publisherList.filter({ has: this.page.locator('a', { hasText: name }) })
  }

  // 高レベル操作メソッド

  /**
   * 大カテゴリをホバーして中カテゴリを表示
   * 
   * @param majorName 大カテゴリ名
   * @description
   * ホバー操作により階層メニューを展開し、中カテゴリの表示状態を確認
   */
  async hoverMajorCategory(majorName: string): Promise<void> {
    console.log(`🖱️ 大カテゴリ「${majorName}」をホバー中...`)
    
    const majorCategory = this.getMajorCategoryByName(majorName)
    await majorCategory.waitFor({ state: 'visible', timeout: 10000 })
    await majorCategory.hover()
    
    // ホバー後の安定化のための待機
    await this.page.waitForTimeout(500)
    
    console.log(`✅ 大カテゴリ「${majorName}」のホバーが完了しました`)
  }

  /**
   * 中カテゴリをホバーして小カテゴリを表示
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名
   * @description
   * 大カテゴリ表示後、中カテゴリをホバーして小カテゴリを展開
   */
  async hoverChildCategory(majorName: string, childName: string): Promise<void> {
    console.log(`🖱️ 中カテゴリ「${majorName} > ${childName}」をホバー中...`)
    
    // まず大カテゴリをホバーして中カテゴリを表示
    await this.hoverMajorCategory(majorName)
    
    const childCategory = this.getChildCategoryByName(majorName, childName)
    await childCategory.waitFor({ state: 'visible', timeout: 5000 })
    await childCategory.hover()
    
    // ホバー後の安定化のための待機
    await this.page.waitForTimeout(500)
    
    console.log(`✅ 中カテゴリ「${majorName} > ${childName}」のホバーが完了しました`)
  }

  /**
   * 大カテゴリをクリック
   * 
   * @param majorName 大カテゴリ名
   * @description
   * 大カテゴリページに遷移するためのクリック操作
   */
  async clickMajorCategory(majorName: string): Promise<void> {
    console.log(`🖱️ 大カテゴリ「${majorName}」をクリック中...`)
    
    const majorCategory = this.getMajorCategoryByName(majorName)
    const link = majorCategory.locator('> a')
    
    await link.waitFor({ state: 'visible', timeout: 10000 })
    await link.click()
    
    console.log(`✅ 大カテゴリ「${majorName}」のクリックが完了しました`)
  }

  /**
   * 中カテゴリをクリック
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名
   * @description
   * 中カテゴリページに遷移するためのクリック操作
   */
  async clickChildCategory(majorName: string, childName: string): Promise<void> {
    console.log(`🖱️ 中カテゴリ「${majorName} > ${childName}」をクリック中...`)
    
    // まず大カテゴリをホバーして中カテゴリを表示
    await this.hoverMajorCategory(majorName)
    
    const childCategory = this.getChildCategoryByName(majorName, childName)
    const link = childCategory.locator('a')
    
    await link.waitFor({ state: 'visible', timeout: 5000 })
    await link.click()
    
    console.log(`✅ 中カテゴリ「${majorName} > ${childName}」のクリックが完了しました`)
  }

  /**
   * 小カテゴリをクリック
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名
   * @param grandchildName 小カテゴリ名
   * @description
   * 小カテゴリページに遷移するためのクリック操作
   */
  async clickGrandchildCategory(majorName: string, childName: string, grandchildName: string): Promise<void> {
    console.log(`🖱️ 小カテゴリ「${majorName} > ${childName} > ${grandchildName}」をクリック中...`)
    
    // まず中カテゴリをホバーして小カテゴリを表示
    await this.hoverChildCategory(majorName, childName)
    
    const grandchildCategory = this.getGrandchildCategoryByName(majorName, childName, grandchildName)
    const link = grandchildCategory.locator('a')
    
    await link.waitFor({ state: 'visible', timeout: 5000 })
    await link.click()
    
    console.log(`✅ 小カテゴリ「${majorName} > ${childName} > ${grandchildName}」のクリックが完了しました`)
  }

  /**
   * 出版社をクリック
   * 
   * @param publisherName 出版社名
   * @description
   * 出版社フィルタを適用するためのクリック操作
   */
  async clickPublisher(publisherName: string): Promise<void> {
    console.log(`🖱️ 出版社「${publisherName}」をクリック中...`)
    
    const publisher = this.getPublisherByName(publisherName)
    const link = publisher.locator('a')
    
    await link.waitFor({ state: 'visible', timeout: 10000 })
    await link.click()
    
    console.log(`✅ 出版社「${publisherName}」のクリックが完了しました`)
  }

  // 検証メソッド

  /**
   * サイドバーの存在確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns サイドバーが存在する場合true
   */
  async isSidebarVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.sidebarRoot.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * カテゴリセクションの存在確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns カテゴリセクションが存在する場合true
   */
  async isCategorySectionVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.categorySection.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 出版社セクションの存在確認
   * 
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 出版社セクションが存在する場合true
   */
  async isPublisherSectionVisible(timeout: number = 5000): Promise<boolean> {
    try {
      await this.publisherSection.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 特定カテゴリの表示確認
   * 
   * @param majorName 大カテゴリ名
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 指定カテゴリが表示されている場合true
   */
  async isMajorCategoryVisible(majorName: string, timeout: number = 5000): Promise<boolean> {
    try {
      const category = this.getMajorCategoryByName(majorName)
      await category.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 中カテゴリの表示確認（ホバー後）
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 指定中カテゴリが表示されている場合true
   */
  async isChildCategoryVisible(majorName: string, childName: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.hoverMajorCategory(majorName)
      const childCategory = this.getChildCategoryByName(majorName, childName)
      await childCategory.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 小カテゴリの表示確認（ホバー後）
   * 
   * @param majorName 大カテゴリ名
   * @param childName 中カテゴリ名
   * @param grandchildName 小カテゴリ名
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 指定小カテゴリが表示されている場合true
   */
  async isGrandchildCategoryVisible(majorName: string, childName: string, grandchildName: string, timeout: number = 5000): Promise<boolean> {
    try {
      await this.hoverChildCategory(majorName, childName)
      const grandchildCategory = this.getGrandchildCategoryByName(majorName, childName, grandchildName)
      await grandchildCategory.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 特定出版社の表示確認
   * 
   * @param publisherName 出版社名
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns 指定出版社が表示されている場合true
   */
  async isPublisherVisible(publisherName: string, timeout: number = 5000): Promise<boolean> {
    try {
      const publisher = this.getPublisherByName(publisherName)
      await publisher.waitFor({ state: 'visible', timeout })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 利用可能な大カテゴリ一覧を取得
   * 
   * @returns 大カテゴリ名の配列
   */
  async getAvailableMajorCategories(): Promise<string[]> {
    const categories: string[] = []
    const majorItems = await this.majorCategoryList.all()
    
    for (const item of majorItems) {
      try {
        const link = item.locator('> a')
        const text = await link.textContent()
        if (text) {
          categories.push(text.trim())
        }
      } catch (error) {
        // エラーが発生した項目はスキップ
      }
    }
    
    return categories
  }

  /**
   * 利用可能な出版社一覧を取得
   * 
   * @returns 出版社名の配列
   */
  async getAvailablePublishers(): Promise<string[]> {
    const publishers: string[] = []
    const publisherItems = await this.publisherList.all()
    
    for (const item of publisherItems) {
      try {
        const link = item.locator('a')
        const text = await link.textContent()
        if (text) {
          publishers.push(text.trim())
        }
      } catch (error) {
        // エラーが発生した項目はスキップ
      }
    }
    
    return publishers
  }
}