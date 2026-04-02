import {
  Reporter,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter'
import * as fs from 'fs'
import * as path from 'path'

/**
 * テスト失敗時にHTML構造を自動保存するカスタムレポーター
 * video/screenshotと同様に、失敗時のみHTML構造をダンプする
 */
class HtmlDumpReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    // テストが失敗した場合のみ実行
    if (result.status !== 'passed' && result.status !== 'skipped') {
      // 添付ファイルからHTML構造を取得
      const htmlAttachment = result.attachments.find(
        (attachment) => attachment.name === 'page-html-dump'
      )

      if (htmlAttachment && htmlAttachment.body) {
        // 出力ディレクトリを準備
        const testName = test.title.replace(/[^a-z0-9]/gi, '_')
        const outputDir = path.join(
          'test-results',
          `${testName}-${test.id.replace(/[^a-z0-9]/gi, '_')}`
        )

        // test-resultsディレクトリは既に存在する（video/screenshotと同じ場所）
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true })
        }

        const htmlPath = path.join(outputDir, 'failure-page.html')
        fs.writeFileSync(htmlPath, htmlAttachment.body)

        console.log(`\n📄 HTML構造を保存: ${htmlPath}`)
      }
    }
  }

  onEnd(result: FullResult) {
    // 何もしない（終了時の処理は不要）
  }
}

export default HtmlDumpReporter
