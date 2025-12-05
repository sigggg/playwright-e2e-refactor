import { test, expect } from '@playwright/test'
import * as dotenv from 'dotenv'

dotenv.config()

/**
 * アクセシビリティ監査テスト
 *
 * 対象URL: https://ebook-qa1.m3.com/
 *
 * チェック項目：
 * 1. ARIA属性の適切な使用
 * 2. セマンティックHTMLの使用
 * 3. 見出し構造の階層
 * 4. キーボード操作性
 * 5. 画像の代替テキスト
 */

test.describe('ebook-qa1.m3.com アクセシビリティ監査', () => {
  test.beforeEach(async ({ page }) => {
    // storageStateにより既にM3.comログイン済みの状態
    // 直接監査対象ページにアクセス
    await page.goto('https://ebook-qa1.m3.com/', { waitUntil: 'domcontentloaded' })

    // ページの読み込み完了を待機
    await page.waitForLoadState('networkidle')
  })

  test('C001_ページタイトルが存在する', async ({ page }) => {
    const title = await page.title()
    console.log(`✅ ページタイトル: ${title}`)
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('C002_見出し構造の階層をチェック', async ({ page }) => {
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()

    console.log(`\n📊 見出し構造分析:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`検出された見出し数: ${headings.length}`)

    let previousLevel = 0
    const headingData = []

    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName)
      const level = parseInt(tagName.charAt(1))
      const text = (await heading.textContent() || '').trim().substring(0, 50)

      headingData.push({ tagName, level, text })

      // 見出しレベルが飛んでいないかチェック
      if (previousLevel > 0 && level - previousLevel > 1) {
        console.warn(`⚠️ 見出しレベルが飛んでいます: ${tagName}（前レベル: H${previousLevel}）- "${text}"`)
      }

      console.log(`${tagName}: ${text}`)
      previousLevel = level
    }

    // 見出しが存在することを確認
    expect(headings.length).toBeGreaterThan(0)
  })

  test('C003_ARIA属性のチェック', async ({ page }) => {
    // ARIAラベルを持つ要素を検出
    const ariaLabelElements = await page.locator('[aria-label]').all()
    const ariaLabelledByElements = await page.locator('[aria-labelledby]').all()
    const ariaDescribedByElements = await page.locator('[aria-describedby]').all()
    const ariaHiddenElements = await page.locator('[aria-hidden]').all()

    console.log(`\n📊 ARIA属性分析:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ aria-label: ${ariaLabelElements.length}件`)
    console.log(`✅ aria-labelledby: ${ariaLabelledByElements.length}件`)
    console.log(`✅ aria-describedby: ${ariaDescribedByElements.length}件`)
    console.log(`⚠️ aria-hidden: ${ariaHiddenElements.length}件`)

    // ARIA属性の使用例を表示
    if (ariaLabelElements.length > 0) {
      console.log(`\n【aria-label使用例】`)
      for (let i = 0; i < Math.min(3, ariaLabelElements.length); i++) {
        const label = await ariaLabelElements[i].getAttribute('aria-label')
        const tagName = await ariaLabelElements[i].evaluate(el => el.tagName)
        console.log(`  ${tagName}: "${label}"`)
      }
    }
  })

  test('C004_ボタンとリンクのアクセシブルな名前チェック', async ({ page }) => {
    const buttons = await page.locator('button').all()
    const links = await page.locator('a').all()

    let buttonsWithoutName = 0
    let linksWithoutName = 0

    console.log(`\n📊 ボタン・リンクのアクセシビリティ分析:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`検出されたボタン: ${buttons.length}件`)
    console.log(`検出されたリンク: ${links.length}件`)

    // ボタンのチェック
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = (await button.textContent() || '').trim()
      const ariaLabelledBy = await button.getAttribute('aria-labelledby')

      if (!ariaLabel && !textContent && !ariaLabelledBy) {
        buttonsWithoutName++
        const html = await button.evaluate(el => el.outerHTML.substring(0, 100))
        console.warn(`⚠️ アクセシブルな名前がないボタン: ${html}...`)
      }
    }

    // リンクのチェック
    for (const link of links) {
      const ariaLabel = await link.getAttribute('aria-label')
      const textContent = (await link.textContent() || '').trim()
      const ariaLabelledBy = await link.getAttribute('aria-labelledby')

      if (!ariaLabel && !textContent && !ariaLabelledBy) {
        linksWithoutName++
      }
    }

    console.log(`\n【結果】`)
    console.log(`⚠️ アクセシブルな名前がないボタン: ${buttonsWithoutName}件`)
    console.log(`⚠️ アクセシブルな名前がないリンク: ${linksWithoutName}件`)

    // 警告としてレポート（失敗させない）
    if (buttonsWithoutName > 0 || linksWithoutName > 0) {
      console.warn(`⚠️ 改善推奨: アクセシブルな名前を追加してください`)
    }
  })

  test('C005_画像の代替テキストチェック', async ({ page }) => {
    const images = await page.locator('img').all()

    let imagesWithoutAlt = 0
    let decorativeImages = 0

    console.log(`\n📊 画像の代替テキスト分析:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`検出された画像: ${images.length}件`)

    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const src = await img.getAttribute('src')
      const role = await img.getAttribute('role')

      if (alt === null) {
        imagesWithoutAlt++
        console.warn(`⚠️ alt属性がない画像: ${src}`)
      } else if (alt.trim() === '') {
        if (role === 'presentation' || role === 'none') {
          decorativeImages++
        } else {
          console.info(`ℹ️ 装飾画像の可能性（alt=""）: ${src}`)
        }
      }
    }

    console.log(`\n【結果】`)
    console.log(`⚠️ alt属性がない画像: ${imagesWithoutAlt}件`)
    console.log(`✅ 装飾画像（role指定あり）: ${decorativeImages}件`)
    console.log(`✅ alt属性あり: ${images.length - imagesWithoutAlt}件`)

    if (imagesWithoutAlt > 0) {
      console.warn(`⚠️ 改善推奨: alt属性を追加してください`)
    }
  })

  test('C006_tabindex属性のチェック', async ({ page }) => {
    const tabindexElements = await page.locator('[tabindex]').all()

    let positiveTabindex = 0

    console.log(`\n📊 tabindex属性分析:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`tabindex指定要素: ${tabindexElements.length}件`)

    for (const element of tabindexElements) {
      const tabindex = await element.getAttribute('tabindex')
      const tabindexValue = parseInt(tabindex || '0')

      if (tabindexValue > 0) {
        positiveTabindex++
        const tagName = await element.evaluate(el => el.tagName)
        console.warn(`⚠️ 正の値のtabindex検出（推奨されません）: ${tagName} tabindex="${tabindex}"`)
      }
    }

    console.log(`\n【結果】`)
    console.log(`⚠️ 正の値のtabindex: ${positiveTabindex}件`)

    if (positiveTabindex > 0) {
      console.warn(`⚠️ 改善推奨: tabindex="0"または削除を検討してください`)
    }
  })

  test('C007_ランドマーク（Landmarks）のチェック', async ({ page }) => {
    const mainLandmarks = await page.locator('main, [role="main"]').all()
    const navLandmarks = await page.locator('nav, [role="navigation"]').all()
    const headerLandmarks = await page.locator('header, [role="banner"]').all()
    const footerLandmarks = await page.locator('footer, [role="contentinfo"]').all()

    console.log(`\n📊 ランドマーク分析:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`✅ <main>または role="main": ${mainLandmarks.length}件`)
    console.log(`✅ <nav>または role="navigation": ${navLandmarks.length}件`)
    console.log(`✅ <header>または role="banner": ${headerLandmarks.length}件`)
    console.log(`✅ <footer>または role="contentinfo": ${footerLandmarks.length}件`)

    if (mainLandmarks.length === 0) {
      console.warn(`⚠️ 改善推奨: <main>タグまたはrole="main"が見つかりません`)
    }
    if (navLandmarks.length === 0) {
      console.warn(`⚠️ 改善推奨: <nav>タグまたはrole="navigation"が見つかりません`)
    }
  })

  test('C008_フォームのラベル関連付けチェック', async ({ page }) => {
    const inputs = await page.locator('input[type="text"], input[type="email"], input[type="password"], input[type="tel"], input[type="search"]').all()

    let inputsWithoutLabel = 0

    console.log(`\n📊 フォーム入力のラベル分析:`)
    console.log(`━━━━━━━━━━━━━━━━━━━━━━`)
    console.log(`検出された入力フィールド: ${inputs.length}件`)

    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')

      // ラベル関連付けをチェック
      let hasLabel = false

      if (id) {
        const label = await page.locator(`label[for="${id}"]`).count()
        if (label > 0) {
          hasLabel = true
        }
      }

      if (ariaLabel || ariaLabelledBy) {
        hasLabel = true
      }

      if (!hasLabel) {
        inputsWithoutLabel++
        const type = await input.getAttribute('type')
        console.warn(`⚠️ ラベルが関連付けられていない入力: type="${type}" placeholder="${placeholder}"`)
      }
    }

    console.log(`\n【結果】`)
    console.log(`⚠️ ラベル関連付けなし: ${inputsWithoutLabel}件`)
    console.log(`✅ ラベル関連付けあり: ${inputs.length - inputsWithoutLabel}件`)

    if (inputsWithoutLabel > 0) {
      console.warn(`⚠️ 改善推奨: <label>タグまたはaria-labelで関連付けてください`)
    }
  })
})
