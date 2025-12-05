# ページ品質監査コマンド（アクセシビリティ & PSI測定）

あなたはWebページの品質監査の専門家です。ユーザーが指定したURLに対して、アクセシビリティとPageSpeed Insights（PSI）を自動測定します。

## 🎯 このコマンドの目的

**対象者**: 開発者、QAエンジニア、アクセシビリティ担当者

**目的**: Webページの品質を総合的に評価し、改善点を明確化する

**測定項目**:
1. **アクセシビリティ**: ARIA属性、hasAccessibleName、セマンティックHTML、キーボード操作性
2. **パフォーマンス**: PageSpeed Insights（Lighthouse）スコア
3. **ベストプラクティス**: セキュリティ、HTTPS、コンソールエラー
4. **SEO**: メタタグ、構造化データ

---

## 📋 監査フロー

### Step 1: URLの受け取り

ユーザーに以下を質問してください：

**「監査対象ページのURLを教えてください」**

- 例: `https://www.m3.com`
- 例: `https://www.m3.com/settings`

**認証が必要なページの場合**:
- 認証情報（.env）が設定されている場合は、自動ログイン後に監査を実行
- 認証不要ページの場合は直接アクセス

### Step 2: M3.com認証の実行

**⚠️ 重要**: 監査対象ページにアクセスする前に、必ずM3.com認証を実行します

#### **2-1. 環境変数の読み込み**

```typescript
import * as dotenv from 'dotenv'
dotenv.config()

const username = process.env.USERNAME || ''
const password = process.env.PASSWORD || ''

if (!username || !password) {
  throw new Error('❌ 認証情報が設定されていません。.envファイルを確認してください')
}
```

#### **2-2. M3.com認証の実行**

**既存の認証基盤（shared-e2e-components/auth/m3LoginPage.ts）を活用**:

```typescript
import { chromium, Browser, BrowserContext, Page } from '@playwright/test'
import { M3LoginPage } from '../shared-e2e-components/auth/m3LoginPage'

// ブラウザ起動
const browser: Browser = await chromium.launch({ headless: false })
const context: BrowserContext = await browser.newContext({
  viewport: { width: 1920, height: 1080 }
})
const page: Page = await context.newPage()

// M3.com認証を実行
const m3Login = new M3LoginPage(page)
await m3Login.performLogin({
  username: username,
  password: password
})

console.log('✅ M3.com認証が完了しました')
```

#### **2-3. 監査対象ページへのアクセス**

認証完了後、監査対象ページにアクセス：

```typescript
// 監査対象URLへ遷移
await page.goto('{ユーザー指定のURL}', {
  waitUntil: 'domcontentloaded',
  timeout: 60000
})
console.log(`✅ 監査対象ページにアクセスしました: ${page.url()}`)
```

**⚠️ Playwright MCP使用時の注意**

Playwright MCPを使う場合は、以下の順序で実行：

1. **認証なしページへの初回アクセス（m3.com）**
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_navigate({
     url: 'https://www.m3.com',
     browserType: 'chromium',
     headless: false,
     width: 1920,
     height: 1080
   })
   ```

2. **ログインフォームへの入力**
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_fill({
     selector: '#loginId',
     value: process.env.USERNAME
   })

   await mcp___executeautomation_playwright-mcp-server__playwright_fill({
     selector: '#password',
     value: process.env.PASSWORD
   })
   ```

3. **ログインボタンのクリック**
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_click({
     selector: 'button.pls-button.--primary.opentop__button[type="submit"]'
   })
   ```

4. **ログイン成功確認（ユーザー名表示を待機）**
   ```typescript
   // ユーザー名ヘッダーの表示を確認
   await page.waitForSelector('.atlas-header__username', { timeout: 10000 })
   console.log('✅ M3.comログイン成功確認')
   ```

5. **監査対象ページへ遷移**
   ```typescript
   await mcp___executeautomation_playwright-mcp-server__playwright_navigate({
     url: '{ユーザー指定のURL}',
     browserType: 'chromium',
     headless: false,
     width: 1920,
     height: 1080
   })
   ```

### Step 3: HTML構造とスクリーンショットの取得

**認証済みページのHTML構造を取得**:

```typescript
// Playwright MCP使用時
await mcp___executeautomation_playwright-mcp-server__playwright_get_visible_html({
  removeScripts: false,  // アクセシビリティ監査のためスクリプトも含める
  cleanHtml: false,       // 元のHTMLを保持
  maxLength: 50000        // より大きなサイズまで取得
})

// または、直接取得
const htmlContent = await page.content()
await fs.writeFile('tmp/audit-page.html', htmlContent, 'utf-8')
console.log('✅ HTML構造を保存しました: tmp/audit-page.html')
```

**スクリーンショットを取得**:
```typescript
// Playwright MCP使用時
await mcp___executeautomation_playwright-mcp-server__playwright_screenshot({
  name: 'audit-screenshot',
  fullPage: true,
  savePng: true
})

// または、直接取得
await page.screenshot({
  path: 'test-results/audit-screenshot.png',
  fullPage: true
})
console.log('✅ スクリーンショットを保存しました: test-results/audit-screenshot.png')
```

### Step 4: アクセシビリティ監査

**認証済みページのHTML**を解析し、以下の項目を自動チェックします：

#### **4-1. ARIA属性のチェック**

以下を検出・評価：

- **適切なARIAラベル**: `aria-label`, `aria-labelledby`, `aria-describedby`
- **ランドマーク**: `role="navigation"`, `role="main"`, `role="complementary"`等
- **状態管理**: `aria-expanded`, `aria-selected`, `aria-checked`
- **非表示要素**: `aria-hidden`の適切な使用

**検出例**:
```typescript
// ボタンにaria-labelがあるかチェック
const buttons = page.locator('button')
for (const button of await buttons.all()) {
  const ariaLabel = await button.getAttribute('aria-label')
  const hasAccessibleName = await button.evaluate(el => {
    return (el as HTMLElement).ariaLabel !== null || el.textContent !== ''
  })

  if (!hasAccessibleName) {
    console.warn(`⚠️ アクセシブルな名前がないボタンを検出: ${await button.innerHTML()}`)
  }
}
```

#### **4-2. セマンティックHTMLのチェック**

以下を検出・評価：

- **見出し構造**: `<h1>`〜`<h6>`の階層が正しいか
- **リスト**: `<ul>`, `<ol>`の適切な使用
- **フォーム**: `<label>`と`<input>`の関連付け
- **ランドマーク**: `<header>`, `<nav>`, `<main>`, `<footer>`の使用

**検出例**:
```typescript
// 見出し階層のチェック
const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
let previousLevel = 0
for (const heading of headings) {
  const tagName = await heading.evaluate(el => el.tagName)
  const level = parseInt(tagName.charAt(1))

  if (level - previousLevel > 1) {
    console.warn(`⚠️ 見出しレベルが飛んでいます: ${tagName}`)
  }
  previousLevel = level
}
```

#### **4-3. キーボード操作性のチェック**

以下を検出・評価：

- **tabindex**: 適切な値（0, -1）の使用
- **フォーカス可能要素**: インタラクティブ要素がキーボードで操作可能か
- **フォーカスインジケーター**: `:focus`スタイルの存在

**検出例**:
```typescript
// tabindex属性のチェック
const tabindexElements = await page.locator('[tabindex]').all()
for (const element of tabindexElements) {
  const tabindex = await element.getAttribute('tabindex')
  const tabindexValue = parseInt(tabindex || '0')

  if (tabindexValue > 0) {
    console.warn(`⚠️ 正の値のtabindexを検出（推奨されません）: tabindex="${tabindex}"`)
  }
}
```

#### **4-4. 画像の代替テキストチェック**

以下を検出・評価：

- **alt属性**: すべての`<img>`に適切なalt属性があるか
- **装飾画像**: 装飾画像には`alt=""`または`role="presentation"`があるか

**検出例**:
```typescript
// 画像のalt属性チェック
const images = await page.locator('img').all()
for (const img of images) {
  const alt = await img.getAttribute('alt')
  const src = await img.getAttribute('src')

  if (alt === null) {
    console.warn(`⚠️ alt属性がない画像を検出: ${src}`)
  } else if (alt.trim() === '' && !(await img.getAttribute('role'))) {
    console.info(`ℹ️ 装飾画像の可能性: ${src}（alt=""）`)
  }
}
```

#### **4-5. カラーコントラストのチェック**

以下を検出・評価：

- **テキストと背景のコントラスト比**: WCAG AA基準（4.5:1以上）
- **大きいテキスト**: WCAG AA基準（3:1以上）

**検出例**:
```typescript
// カラーコントラストのチェック（簡易版）
const textElements = await page.locator('p, span, a, button, h1, h2, h3, h4, h5, h6').all()
for (const element of textElements) {
  const color = await element.evaluate(el => {
    const style = window.getComputedStyle(el)
    return {
      text: style.color,
      background: style.backgroundColor
    }
  })

  // コントラスト比の計算は簡易実装
  console.info(`ℹ️ テキスト色: ${color.text}, 背景色: ${color.background}`)
}
```

### Step 5: PageSpeed Insights（Lighthouse）測定

**Lighthouse CLIを使用してPSI測定を実行**:

#### **5-1. Lighthouse CLIのインストール確認**

```bash
# Lighthouseがインストールされているか確認
npx lighthouse --version

# インストールされていない場合は自動インストール
npm install -g lighthouse
```

#### **5-2. Lighthouse実行**

```bash
# PC（デスクトップ）版の測定
npx lighthouse "{URL}" \
  --output=json \
  --output=html \
  --output-path=./test-results/lighthouse-report \
  --preset=desktop \
  --chrome-flags="--headless" \
  --quiet

# モバイル版の測定
npx lighthouse "{URL}" \
  --output=json \
  --output=html \
  --output-path=./test-results/lighthouse-report-mobile \
  --preset=mobile \
  --chrome-flags="--headless" \
  --quiet
```

#### **5-3. Lighthouseレポートの解析**

生成されたJSONレポートを解析し、以下を抽出：

```typescript
// JSONレポートの読み込み
const reportJson = JSON.parse(await fs.readFile('./test-results/lighthouse-report.report.json', 'utf-8'))

// 主要スコアの抽出
const scores = {
  performance: reportJson.categories.performance.score * 100,
  accessibility: reportJson.categories.accessibility.score * 100,
  bestPractices: reportJson.categories['best-practices'].score * 100,
  seo: reportJson.categories.seo.score * 100,
  pwa: reportJson.categories.pwa?.score * 100 || 0
}

// パフォーマンス指標の抽出
const metrics = {
  firstContentfulPaint: reportJson.audits['first-contentful-paint'].numericValue,
  largestContentfulPaint: reportJson.audits['largest-contentful-paint'].numericValue,
  totalBlockingTime: reportJson.audits['total-blocking-time'].numericValue,
  cumulativeLayoutShift: reportJson.audits['cumulative-layout-shift'].numericValue,
  speedIndex: reportJson.audits['speed-index'].numericValue
}
```

### Step 6: 監査結果の総合レポート生成

#### **6-1. アクセシビリティ監査結果のサマリー**

以下の形式で結果を出力：

```
📊 アクセシビリティ監査結果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【ARIA属性】
✅ 適切なARIAラベル: 45/50要素
⚠️ アクセシブルな名前がない要素: 5件
  - ボタン（3件）
  - リンク（2件）

【セマンティックHTML】
✅ 見出し構造: 正しい階層
✅ フォームラベル: すべて関連付けられています
⚠️ ランドマーク: <main>タグが見つかりません

【キーボード操作性】
✅ tabindex: すべて適切な値
⚠️ 正の値のtabindex: 2件検出（推奨されません）

【画像の代替テキスト】
✅ alt属性: 90/95画像
⚠️ alt属性がない画像: 5件

【カラーコントラスト】
⚠️ 低コントラストの可能性: 12要素
  ※ 詳細な測定にはLighthouseレポートを参照

【総合評価】
🟢 良好: 3項目
🟡 改善推奨: 4項目
🔴 要対応: 0項目
```

#### **6-2. PageSpeed Insights結果のサマリー**

以下の形式で結果を出力：

```
🚀 PageSpeed Insights測定結果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【総合スコア（PC版）】
パフォーマンス:      ████████░░ 85/100
アクセシビリティ:    ██████████ 95/100
ベストプラクティス:  ████████░░ 88/100
SEO:                 ████████░░ 90/100

【主要パフォーマンス指標】
First Contentful Paint:     1.2秒 🟢
Largest Contentful Paint:   2.5秒 🟡
Total Blocking Time:        150ms 🟢
Cumulative Layout Shift:    0.08  🟢
Speed Index:                3.1秒 🟡

【改善提案】
🔧 画像の最適化: 800KB削減可能
🔧 未使用JavaScript削除: 450KB削減可能
🔧 レンダリングブロックリソース: 2件検出

【詳細レポート】
HTML: ./test-results/lighthouse-report.report.html
JSON: ./test-results/lighthouse-report.report.json
```

#### **6-3. 優先度付き改善アクションリスト**

以下の形式で改善アクションを提示：

```
📝 優先度付き改善アクションリスト
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【🔴 高優先度（すぐに対応）】
1. アクセシブルな名前がないボタンの修正
   - 該当箇所: 3件
   - 対応方法: aria-labelまたはテキストコンテンツを追加

2. alt属性がない画像の修正
   - 該当箇所: 5件
   - 対応方法: 適切なalt属性を追加

【🟡 中優先度（計画的に対応）】
3. 画像の最適化
   - 削減可能サイズ: 800KB
   - 対応方法: WebP形式への変換、圧縮

4. 未使用JavaScriptの削除
   - 削減可能サイズ: 450KB
   - 対応方法: コード分割、Tree shaking

【🟢 低優先度（余裕があれば対応）】
5. 正の値のtabindexの見直し
   - 該当箇所: 2件
   - 対応方法: tabindex="0"または削除

6. <main>ランドマークの追加
   - 対応方法: メインコンテンツを<main>で囲む
```

---

## 🔄 継続的監査のワークフロー

### Step 7: 監査結果の保存と履歴管理

#### **7-1. 監査結果の保存**

```bash
# 監査結果を日時付きで保存
mkdir -p audit-results/$(date +%Y%m%d)

# アクセシビリティ監査結果
cp tmp/accessibility-audit.md audit-results/$(date +%Y%m%d)/

# Lighthouseレポート
cp test-results/lighthouse-report.report.html audit-results/$(date +%Y%m%d)/
cp test-results/lighthouse-report.report.json audit-results/$(date +%Y%m%d)/
```

#### **7-2. 監査スコアの履歴グラフ生成（オプション）**

```typescript
// JSONレポートから履歴データを生成
const historyData = {
  date: new Date().toISOString(),
  scores: {
    performance: scores.performance,
    accessibility: scores.accessibility,
    bestPractices: scores.bestPractices,
    seo: scores.seo
  },
  metrics: metrics
}

// audit-results/history.jsonに追記
const history = JSON.parse(await fs.readFile('audit-results/history.json', 'utf-8') || '[]')
history.push(historyData)
await fs.writeFile('audit-results/history.json', JSON.stringify(history, null, 2))
```

### Step 8: CI/CDパイプラインへの統合

#### **8-1. GitLab CIへの組み込み**

`.gitlab-ci.yml`に監査ジョブを追加：

```yaml
audit-page-quality:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  before_script:
    - npm ci
    - npm install -g lighthouse
  script:
    - npx playwright test --project=audit
    - npx lighthouse "$TARGET_URL" --output=json --output=html --output-path=./audit-results/lighthouse-report
  artifacts:
    paths:
      - audit-results/
    reports:
      junit: audit-results/junit.xml
  only:
    - merge_requests
    - main
```

#### **8-2. 監査失敗時の通知設定**

```yaml
# スコアが閾値を下回った場合は失敗
script:
  - |
    ACCESSIBILITY_SCORE=$(jq '.categories.accessibility.score * 100' audit-results/lighthouse-report.report.json)
    if (( $(echo "$ACCESSIBILITY_SCORE < 90" | bc -l) )); then
      echo "❌ アクセシビリティスコアが基準値を下回っています: $ACCESSIBILITY_SCORE"
      exit 1
    fi
```

---

## 📚 参照情報

### アクセシビリティ基準
- **WCAG 2.1**: https://www.w3.org/TR/WCAG21/
- **ARIA Authoring Practices**: https://www.w3.org/WAI/ARIA/apg/

### Lighthouse
- **公式ドキュメント**: https://developer.chrome.com/docs/lighthouse/
- **スコアリング**: https://web.dev/performance-scoring/

### 補足
- このコマンドは **CLAUDE.md** のコーディング規約に準拠しています
- Playwright MCPが利用可能な環境を推奨します
- 認証が必要なページの場合は、事前に `.env` に認証情報を設定してください
