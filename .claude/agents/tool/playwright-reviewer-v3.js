#!/usr/bin/env node

/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 📊 Playwright E2Eテストコード自動レビューツール v3.3
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 【このツールについて】
 * Playwright E2Eテストのコーディング規約違反やアンチパターンを自動検出し、
 * 保守性・安定性・可読性の高いテストコードの実現を支援します。
 *
 * 【使い方】
 * # 引数なし：デフォルトフォルダをスキャン
 * node playwright-reviewer-v3.js
 * → shared-e2e-components/、src/、testcase/ をスキャン（存在するフォルダのみ）
 *
 * # 特定のディレクトリをスキャン
 * node playwright-reviewer-v3.js /path/to/project
 * node playwright-reviewer-v3.js shared-e2e-components/
 *
 * 【チェック内容（8カテゴリ・23項目）】
 *
 * ■ 形式規約（2項目）
 *   - ファイル末尾の空行（POSIX準拠）
 *   - LF改行コード（CRLF禁止）
 *
 * ■ アンチパターン（9項目）
 *   - waitForTimeout使用禁止（固定時間待機は不安定）
 *   - test.only / describe.only 残留（本番混入防止）
 *   - page.pause() 残留（デバッグコード混入防止）
 *   - async関数内のawait忘れ
 *   - テストコード内console.log使用禁止
 *   - リトライ設定ゼロ（retries: 0）
 *   - 非推奨・レガシーAPI（type(), page.$, waitForNavigation, accessibility）
 *   - 高度なベストプラクティス（Web-first Assertions、コンストラクタ操作、マジック文字列、動的ID）
 *
 * ■ POM設計（3項目）
 *   - Page Object内でのexpect使用（要注意）
 *   - Locatorプロパティにreadonly必須
 *   - BasePage継承チェック（共通機能の再利用）
 *
 * ■ 環境・Proxy（4項目）
 *   - 絶対URL使用禁止（環境切り替え困難）
 *   - TARGET_ENVデフォルト値依存禁止
 *   - process.env直接参照禁止（テストコード内）
 *   - QA環境Proxy設定必須
 *
 * ■ タイムアウト（1項目）
 *   - マジックタイムアウト禁止（playwright.config.tsのデフォルト値に任せる）
 *
 * ■ テスト構造（1項目）
 *   - test.step構造化（実コード5行以上で未使用の場合警告）
 *
 * ■ セキュリティ（1項目）
 *   - パッケージマネージャ混在（yarn.lockとpackage-lock.json）
 *
 * ■ セレクタ戦略（2項目）
 *   - テストコード内でのLocator直接使用
 *   - 脆弱なセレクタ検出（CSSクラス、複雑なセレクタ、結合子使用）
 *     対象メソッド: locator(), click(), fill(), $(), $$(), waitForSelector(), type()
 *
 * 【出力内容】
 * - ターミナルにカラー表示されたレポート
 * - review-reports/ ディレクトリに Markdown形式のレポートファイル
 * - ファイルパスはVSCodeでCmd+クリック（Mac）/ Ctrl+クリック（Windows）で開ける
 *
 * 【レポート構成】
 * 1. 総合評価（PASS/WARNING/FAIL）
 * 2. チェック結果サマリ（合格/総数、パーセンテージ）
 * 3. カテゴリ別チェック結果（プログレスバー付き）
 * 4. Worst Offenders（違反数の多いファイル Top 3）
 * 5. 修正が必要な箇所の詳細（カテゴリ別）
 * 6. スキャン済みファイル一覧
 *
 * 【終了コード】
 * - 0: すべてのチェックに合格
 * - 1: 1つ以上の違反を検出
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 */

const fs = require('fs');
const path = require('path');

// =========================================
// カラー出力ヘルパー
// =========================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

// =========================================
// ユーティリティ関数
// =========================================

/**
 * 行からコメントを除去して有効なコード部分を取得（改善版）
 * 文字列リテラル内のコメント記号は保持する
 * エスケープされた引用符やテンプレートリテラルに対応
 * @param {string} line - 処理対象の行
 * @returns {string} - コメント除去後のコード部分
 */
function stripComments(line) {
  // 文字列リテラル（エスケープ対応）とコメントを正規表現でマッチ
  // - ("(?:\\.|[^"])*") : ダブルクォート文字列（エスケープ対応）
  // - ('(?:\\.|[^'])*') : シングルクォート文字列（エスケープ対応）
  // - (`(?:\\.|[^`])*`) : テンプレートリテラル（エスケープ対応）
  // - ([^"'`/]+) : 文字列でもコメントでもない通常のコード
  // - (\/(?![/*])) : コメント開始でない単独のスラッシュ
  // - (\/\*[\s\S]*?\*\/) : ブロックコメント
  // - (\/\/.*) : 行末コメント
  return line.replace(/("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|[^"'`/]+|\/(?![/*]))|\/\*[\s\S]*?\*\/|\/\/.*/g, (match, group1) => {
    // group1 が存在する場合は文字列またはコード部分なので保持
    // それ以外（コメント）は空文字に置換
    return group1 ? group1 : '';
  });
}

/**
 * プログレスバーを生成
 * @param {number} percentage - 0-100の割合
 * @param {number} width - バーの幅（文字数）
 * @returns {string} - プログレスバー文字列
 */
function createProgressBar(percentage, width = 20) {
  const filledLength = Math.round((width * percentage) / 100);
  const emptyLength = width - filledLength;
  const filled = '█'.repeat(filledLength);
  const empty = '░'.repeat(emptyLength);
  return `[${filled}${empty}] ${percentage}%`;
}

// =========================================
// チェック項目定義
// =========================================
const CHECK_CATEGORIES = {
  FORMAT: '形式規約',
  ANTI_PATTERN: 'アンチパターン',
  POM_DESIGN: 'POM設計',
  ENVIRONMENT: '環境・Proxy',
  TIMEOUT: 'タイムアウト',
  STRUCTURE: 'テスト構造',
  SECURITY: 'セキュリティ',
  SELECTOR: 'セレクタ戦略',
};

// 各チェック項目の定義
const CHECKS = [
  {
    id: 'FORMAT_EOF_NEWLINE',
    category: CHECK_CATEGORIES.FORMAT,
    name: 'ファイル末尾の空行(POSIX)',
    detect: (content) => {
      if (!content.endsWith('\n')) {
        return {
          line: content.split('\n').length,
          reason: 'ファイル末尾に改行がありません。POSIX準拠のため、末尾に1行の空行を追加してください。',
        };
      }
      return null;
    },
  },
  {
    id: 'FORMAT_LF_NEWLINE',
    category: CHECK_CATEGORIES.FORMAT,
    name: 'LF改行コード',
    detect: (content) => {
      if (content.includes('\r\n')) {
        return {
          line: 1,
          reason: 'CRLF改行コードが検出されました。LF改行コード(\n)に統一してください。',
        };
      }
      return null;
    },
  },
  {
    id: 'ANTI_PATTERN_WAIT_FOR_TIMEOUT',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: 'waitForTimeout使用禁止',
    detect: (content) => {
      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);
        if (/waitForTimeout\s*\(/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: 'waitForTimeout（固定時間待機）を避け、Web-first Assertions（toBeVisible()等）を使用してください。',
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ANTI_PATTERN_TEST_ONLY',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: 'test.only残留',
    detect: (content) => {
      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);
        if (/test\.only\s*\(/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: 'test.only が残留しています。他のテストが実行されず、CI/CDでパスしたと誤認するリスクがあります。',
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ANTI_PATTERN_DESCRIBE_ONLY',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: 'describe.only残留',
    detect: (content) => {
      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);
        if (/describe\.only\s*\(/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: 'describe.only が残留しています。他のテストグループが実行されず、CI/CDでパスしたと誤認するリスクがあります。',
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ANTI_PATTERN_PAGE_PAUSE',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: 'page.pause()残留',
    detect: (content) => {
      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);
        if (/page\.pause\s*\(\s*\)/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: 'page.pause() が残留しています。CI環境でプロセスが停止する原因となります。',
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ANTI_PATTERN_ASYNC_WITHOUT_AWAIT',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: 'async関数内のawait忘れ',
    detect: (content, filePath) => {
      // .spec.tsファイルのtest()やフック関数は除外
      const isTestFile = filePath.includes('.spec.ts');

      const lines = content.split('\n');
      const violations = [];

      let inAsyncFunction = false;
      let asyncStartLine = 0;
      let braceCount = 0;
      let hasAwait = false;
      let isTestOrHook = false;

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line);

        // async関数の開始を検出
        if (/async\s+/.test(cleanLine) && !inAsyncFunction) {
          // test()、describe()、beforeEach()等のフック関数は除外
          if (isTestFile && (/test\s*\(|test\.\w+\s*\(|describe\s*\(|beforeEach\s*\(|afterEach\s*\(|beforeAll\s*\(|afterAll\s*\(/.test(cleanLine))) {
            isTestOrHook = true;
          } else {
            isTestOrHook = false;
          }

          inAsyncFunction = true;
          asyncStartLine = index + 1;
          braceCount = 0;
          hasAwait = false;
        }

        if (inAsyncFunction) {
          // 中括弧のカウント
          braceCount += (cleanLine.match(/{/g) || []).length;
          braceCount -= (cleanLine.match(/}/g) || []).length;

          // await の検出
          if (/\bawait\b/.test(cleanLine)) {
            hasAwait = true;
          }

          // 関数の終了を検出
          if (braceCount <= 0 && index > asyncStartLine - 1) {
            if (!hasAwait && !isTestOrHook) {
              // コメント行や空関数は除外
              const functionBody = lines.slice(asyncStartLine - 1, index + 1).join('\n');
              if (functionBody.trim().length > 30) {
                violations.push({
                  line: asyncStartLine,
                  reason: 'async関数内でawaitが使用されていません。Promiseを直接返している（return this.xxx）場合は問題ありませんが、待機漏れ（await忘れ）がないか念のため確認してください。',
                });
              }
            }
            inAsyncFunction = false;
          }
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ANTI_PATTERN_CONSOLE_LOG_IN_TEST',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: 'テストコード内console.log使用禁止',
    detect: (content, filePath) => {
      if (!filePath.includes('.spec.ts')) {
        return null;
      }

      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);
        if (/console\.log\s*\(/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: 'テストコード内でconsole.logを使用しています。ログ出力はPage Object内で行い、テストはtest.stepで構造化してください。',
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ANTI_PATTERN_RETRY_ZERO',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: 'リトライ設定ゼロ',
    detect: (content, filePath) => {
      // playwright.config.tsのみチェック
      if (!filePath.includes('playwright.config')) {
        return null;
      }

      const lines = content.split('\n');

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);

        // retries: 0 の検出
        if (/retries\s*:\s*0/.test(cleanLine)) {
          return {
            line: index + 1,
            reason: 'retries: 0 が設定されています。ネットワークの一時的エラーに弱くなるため、1回以上のリトライ設定を推奨します。',
          };
        }
      }

      return null;
    },
  },
  {
    id: 'LEGACY_API_USAGE',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: '非推奨・レガシーAPIの使用',
    detect: (content) => {
      const lines = content.split('\n');
      const violations = [];
      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);

        // 1. type() の検出
        if (/\.type\s*\(/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            level: 'WARNING',
            reason: '【推奨】type() は非推奨です。原則 fill() を使用してください。ただし、AngularJS等で fill() だと値が反映されない（データバインディングが効かない）場合に限り、pressSequentially() への置き換えを検討してください。',
          });
        }

        // 2. page.$() または page.$$() の検出
        if (/\.[\$]{1,2}\s*\(/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            level: 'WARNING',
            reason: '【推奨】page.$ や page.$$ ではなく locator() を使用してください。locator() は要素がDOMに現れるのを自動待機するため、テストが安定します。',
          });
        }

        // 3. waitForNavigation() の検出
        if (/waitForNavigation/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            level: 'WARNING',
            reason: '【推奨】waitForNavigation() はタイミングによりタイムアウトしやすいため、waitForURL() または expect(page).toHaveURL() を検討してください。',
          });
        }

        // 4. accessibility の検出
        if (/\.accessibility\./.test(cleanLine)) {
          violations.push({
            line: index + 1,
            level: 'WARNING',
            reason: '【重要】page.accessibility は最新のPlaywrightで削除されました。アクセシビリティ検証には axe-core などの外部ライブラリの使用を推奨します。',
          });
        }
      }
      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ADVANCED_BEST_PRACTICES',
    category: CHECK_CATEGORIES.ANTI_PATTERN,
    name: '高度なベストプラクティスの確認',
    detect: (content, filePath) => {
      const lines = content.split('\n');
      const violations = [];

      // コンストラクタ内のチェック用フラグ
      let inConstructor = false;
      let constructorBraceCount = 0;

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line);

        // 1. 不適切なアサーション（isVisible vs toBeVisible）
        if (/expect\s*\(await.*isVisible/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: '【修正推奨】expect(await...isVisible) ではなく await expect(locator).toBeVisible() を使用してください。Web-first Assertions を使うことで自動待機が有効になり、テストが劇的に安定します。',
          });
        }

        // 2. POM設計：コンストラクタ内でのページ操作禁止
        if (filePath.match(/Page\.ts$/)) {
          if (/constructor\s*\(/.test(cleanLine)) {
            inConstructor = true;
            constructorBraceCount = 0;
          }
          if (inConstructor) {
            constructorBraceCount += (cleanLine.match(/{/g) || []).length;
            constructorBraceCount -= (cleanLine.match(/}/g) || []).length;

            if (/\.(goto|waitFor|click|fill)\s*\(/.test(cleanLine)) {
              violations.push({
                line: index + 1,
                reason: '【修正推奨】コンストラクタ内でページ操作（goto, waitFor等）が行われています。初期化とアクションを分離するため、navigate() や navigateToMap() 等の専用メソッドへ移動してください。',
              });
            }
            if (constructorBraceCount <= 0 && index > 0 && cleanLine.includes('}')) inConstructor = false;
          }
        }

        // 3. テスト構造：ハードコードされたマジック文字列（.spec.tsのみ）
        if (filePath.includes('.spec.ts')) {
          // 長い固定文字列（15文字以上）が直接引数に入っている場合を簡易的に検知
          const magicStringMatch = /\.(goto|fill)\s*\(\s*['"`]([^'"`]{15,})['"`]\s*\)/.exec(cleanLine);
          if (magicStringMatch) {
            violations.push({
              line: index + 1,
              reason: `【修正推奨】マジック文字列（"${magicStringMatch[2].substring(0, 10)}..."）が直接入力されています。環境変化に強くするため、定数ファイル（test-data.ts等）や Config から取得することを検討してください。`,
            });
          }
        }

        // 4. セレクタ戦略：動的IDへの依存
        // IDの末尾がハイフン+数字や、ランダムに見える文字列を検知
        if (/\.locator\s*\(\s*['"`].*#[a-zA-Z0-9_-]+[0-9]{2,}/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: '【修正推奨】動的生成と思われるIDセレクタ（#...数字）が検出されました。ビルド毎に変更される可能性があるため、getByRole や data-testid への変更を検討してください。',
          });
        }
      }
      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'POM_EXPECT_IN_PAGE_OBJECT',
    category: CHECK_CATEGORIES.POM_DESIGN,
    name: 'Page Object内でのexpect使用（要注意）',
    detect: (content, filePath) => {
      if (!filePath.match(/Page\.ts$/)) {
        return null;
      }

      const lines = content.split('\n');

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line);

        if (/\bexpect\s*\(/.test(cleanLine) && !line.includes('import')) {
          // アサーション行の全容を抽出
          const assertionCode = line.trim();

          // 文脈コメントを抽出
          let previousLineComment = null;
          let sameLineComment = null;

          // 前の行のコメントを取得
          if (index > 0) {
            const prevLine = lines[index - 1].trim();

            // 単一行コメント（//）
            if (prevLine.startsWith('//')) {
              previousLineComment = prevLine.replace(/^\/\/\s*/, '');
            }
            // ブロックコメント（/* ... */）
            else if (prevLine.startsWith('/*') && prevLine.endsWith('*/')) {
              previousLineComment = prevLine.replace(/^\/\*\s*|\s*\*\/$/g, '');
            }
            // JSDocコメント（/** ... */）
            else if (prevLine.startsWith('/**') && prevLine.endsWith('*/')) {
              previousLineComment = prevLine.replace(/^\/\*\*\s*|\s*\*\/$/g, '');
            }
            // 複数行コメントの一部（* ...）
            else if (prevLine.startsWith('*') && !prevLine.startsWith('*/')) {
              previousLineComment = prevLine.replace(/^\*\s*/, '');
            }
          }

          // 同じ行の末尾コメントを取得
          const commentIndex = line.indexOf('//');
          if (commentIndex !== -1) {
            // expect(...) の後にコメントがあるか確認
            const expectIndex = line.indexOf('expect');
            if (commentIndex > expectIndex) {
              sameLineComment = line.substring(commentIndex + 2).trim();
            }
          }

          // reasonを構築（簡潔に）
          let reason = `${assertionCode}\n`;

          if (previousLineComment || sameLineComment) {
            reason += '\n文脈:\n';
            if (previousLineComment) {
              reason += `  ${previousLineComment}\n`;
            }
            if (sameLineComment) {
              reason += `  ${sameLineComment}\n`;
            }
          }

          reason += '\n💡 内部状態検証など特定ケースでは許容。必要に応じてテストコード側への移行を検討。';

          return {
            line: index + 1,
            reason: reason,
          };
        }
      }

      return null;
    },
  },
  {
    id: 'POM_READONLY_LOCATOR',
    category: CHECK_CATEGORIES.POM_DESIGN,
    name: 'Locatorプロパティにreadonly必須',
    detect: (content, filePath) => {
      if (!filePath.match(/Page\.ts$/)) {
        return null;
      }

      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);

        // Locator型のプロパティを検出
        if (/:\s*Locator\s*[;=]/.test(cleanLine) && !cleanLine.includes('readonly')) {
          // privateやprotectedの場合は除外
          if (!cleanLine.includes('private') && !cleanLine.includes('protected')) {
            violations.push({
              line: index + 1,
              reason: 'Locatorプロパティにreadonlyが付いていません。パフォーマンス向上と型安全性のため、readonly修飾子を追加してください。',
            });
          }
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ENV_ABSOLUTE_URL',
    category: CHECK_CATEGORIES.ENVIRONMENT,
    name: '絶対URL使用禁止',
    detect: (content) => {
      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);
        const match = /page\.goto\s*\(\s*['"`](https?:\/\/[^'"`]+)['"`]/.exec(cleanLine);
        if (match) {
          violations.push({
            line: index + 1,
            reason: `絶対URL「${match[1]}」を使用しています。相対パスとbaseURL設定を使用し、環境切り替えを容易にしてください。`,
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ENV_TARGET_ENV_DEFAULT',
    category: CHECK_CATEGORIES.ENVIRONMENT,
    name: 'TARGET_ENVデフォルト値依存禁止',
    detect: (content, filePath) => {
      if (!filePath.includes('playwright.config')) {
        return null;
      }

      const lines = content.split('\n');

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);

        // TARGET_ENVのデフォルト値設定を検出
        if (/TARGET_ENV\s*\|\|\s*['"`]/.test(cleanLine) || /TARGET_ENV\s*\?\?\s*['"`]/.test(cleanLine)) {
          return {
            line: index + 1,
            reason: 'TARGET_ENVにデフォルト値を設定しています。意図しない環境（本番等）に接続するリスクがあるため、未設定時はエラーを投げてください。',
          };
        }
      }

      return null;
    },
  },
  {
    id: 'ENV_PROCESS_ENV_DIRECT_ACCESS',
    category: CHECK_CATEGORIES.ENVIRONMENT,
    name: 'process.env直接参照禁止',
    detect: (content, filePath) => {
      if (!filePath.includes('.spec.ts')) {
        return null;
      }

      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line);

        // process.envの直接参照を検出
        if (/process\.env\.\w+/.test(cleanLine) && !line.includes('import')) {
          violations.push({
            line: index + 1,
            reason: 'テストコード内でprocess.envを直接参照しています。環境変数は設定ファイル（playwright.config.ts）またはテストデータファイルから取得してください。',
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'ENV_QA_PROXY_MISSING',
    category: CHECK_CATEGORIES.ENVIRONMENT,
    name: 'QA環境Proxy設定必須',
    detect: (content, filePath) => {
      if (!filePath.includes('playwright.config')) {
        return null;
      }

      const lines = content.split('\n');
      let inQaEnv = false;
      let qaEnvName = '';
      let qaEnvStartLine = 0;
      let braceCount = 0;
      let hasProxy = false;
      let hasProxyServer = false;

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);

        // QA環境設定の開始を検出
        const qaEnvMatch = /(['"`]?)(qa\d+)\1\s*:\s*{/.exec(cleanLine);
        if (qaEnvMatch) {
          inQaEnv = true;
          qaEnvName = qaEnvMatch[2];
          qaEnvStartLine = index + 1;
          braceCount = 1;
          hasProxy = false;
          hasProxyServer = false;
          continue;
        }

        if (inQaEnv) {
          braceCount += (cleanLine.match(/{/g) || []).length;
          braceCount -= (cleanLine.match(/}/g) || []).length;

          if (/proxy\s*:\s*{/.test(cleanLine)) {
            hasProxy = true;
          }

          if (/server\s*:\s*['"`]https?:\/\//.test(cleanLine)) {
            hasProxyServer = true;
          }

          if (braceCount <= 0) {
            if (!hasProxy) {
              return {
                line: qaEnvStartLine,
                reason: `QA環境「${qaEnvName}」の設定においてproxyが未定義です。社内ネットワーク経由でのアクセスが必要な場合、タイムアウトが発生する可能性があります。`,
              };
            } else if (!hasProxyServer) {
              return {
                line: qaEnvStartLine,
                reason: `QA環境「${qaEnvName}」のproxy設定にserverプロパティが見当たりません。proxy.server に適切なProxyサーバーのURLを設定してください。`,
              };
            }
            inQaEnv = false;
          }
        }
      }

      return null;
    },
  },
  {
    id: 'TIMEOUT_MAGIC_TIMEOUT',
    category: CHECK_CATEGORIES.TIMEOUT,
    name: 'マジックタイムアウト禁止',
    detect: (content) => {
      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const cleanLine = stripComments(lines[index]);

        // 正当なタイムアウト設定（test.setTimeout, test.slow）は除外
        if (/test\.(setTimeout|slow)\s*\(/.test(cleanLine)) {
          continue;
        }

        // 関数パラメータのデフォルト値（例: timeout: number = 5000）は除外
        if (/timeout\s*:\s*number\s*=/.test(cleanLine) || /timeout\s*=/.test(cleanLine)) {
          continue;
        }

        // expect や waitFor のオプション引数としての timeout を検出
        // { timeout: 10000 } や { state: 'visible', timeout: 10000 } のパターン
        if (/timeout\s*:\s*\d+/.test(cleanLine)) {
          violations.push({
            line: index + 1,
            reason: 'タイムアウト値のハードコード（マジックタイムアウト）が検出されました。playwright.config.tsのデフォルト値に任せてください。',
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'STRUCTURE_TEST_STEP',
    category: CHECK_CATEGORIES.STRUCTURE,
    name: 'test.step構造化',
    detect: (content, filePath) => {
      if (!filePath.includes('.spec.ts')) {
        return null;
      }

      const lines = content.split('\n');
      let inTestFunction = false;
      let testStartLine = 0;
      let braceDepth = 0;
      let codeLineCount = 0;

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line).trim();

        // test関数の開始を検出
        if (/test\s*\(\s*['"`]/.test(cleanLine)) {
          inTestFunction = true;
          testStartLine = index + 1;
          braceDepth = 0;
          codeLineCount = 0;
        }

        if (inTestFunction) {
          // 波括弧の深さを追跡
          for (const char of cleanLine) {
            if (char === '{') braceDepth++;
            if (char === '}') braceDepth--;
          }

          // コードがある行をカウント（空行とコメントを除く）
          if (cleanLine && !cleanLine.startsWith('//') && !cleanLine.startsWith('/*') && !cleanLine.startsWith('*')) {
            codeLineCount++;
          }

          // test関数の終了を検出
          if (braceDepth === 0 && codeLineCount > 0) {
            // test.stepの使用をチェック
            const testContent = lines.slice(testStartLine - 1, index + 1).join('\n');
            const hasTestStep = /test\.step\s*\(/.test(testContent);

            // 実コード5行以上でtest.stepが使われていない場合のみ警告
            if (codeLineCount >= 5 && !hasTestStep) {
              return {
                line: testStartLine,
                reason: `テスト関数内に${codeLineCount}行のコードがありますが、test.stepで構造化されていません。複数の操作を行う場合は、test.stepで区切ることでレポートの可読性が向上します。`,
              };
            }

            inTestFunction = false;
          }
        }
      }

      return null;
    },
  },
  {
    id: 'SELECTOR_LOCATOR_IN_TEST',
    category: CHECK_CATEGORIES.SELECTOR,
    name: 'テストコード内でのLocator直接使用',
    detect: (content, filePath) => {
      if (!filePath.includes('.spec.ts')) {
        return null;
      }

      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line);

        // page.locator()の直接使用を検出
        if (/page\s*\.\s*locator\s*\(/.test(cleanLine) && !line.includes('import')) {
          violations.push({
            line: index + 1,
            reason: 'テストコード内でpage.locator()を直接使用しています。セレクタはPage Objectに隠蔽し、テストコードからはメソッド経由でアクセスしてください。',
          });
        }

        // 複雑なセレクタチェーン（3つ以上の.getBy...が連鎖）を検出
        const getByCount = (cleanLine.match(/\.getBy\w+\s*\(/g) || []).length;
        if (getByCount >= 3 && !line.includes('import')) {
          violations.push({
            line: index + 1,
            reason: `複雑なセレクタチェーン（${getByCount}個の.getBy...）がテストコード内にあります。Page Objectのプロパティまたはメソッドに抽出してください。`,
          });
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'SELECTOR_FRAGILE_SELECTOR',
    category: CHECK_CATEGORIES.SELECTOR,
    name: '脆弱なセレクタ検出',
    detect: (content, filePath) => {
      // Page ObjectとTestファイルの両方をチェック
      if (!filePath.match(/Page\.ts$/) && !filePath.includes('.spec.ts')) {
        return null;
      }

      const lines = content.split('\n');
      const violations = [];

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line);

        // セレクタを引数に取るメソッド全般をチェック
        // locator(), .click(), .fill(), .$(), .$$(), .waitForSelector(), .type() など
        // 引用符の対を厳格化（後方参照を使用）
        const selectorMethods = /(?:locator|click|fill|\$\$?|waitForSelector|type)\s*\(\s*(['"`])(.*?)\1/g;
        let match;

        while ((match = selectorMethods.exec(cleanLine)) !== null) {
          const selector = match[2]; // group2 がセレクタ本体

          // import文とdata-testidは除外
          if (line.includes('import') || line.includes('data-testid')) {
            continue;
          }

          // 1. 【許容範囲外】複雑な構造（結合子、nth-child、複数階層）
          if (selector.match(/[>+~]/) || selector.includes(':nth-child') || selector.includes(':nth-of-type')) {
            violations.push({
              line: index + 1,
              reason: `【修正推奨：許容範囲外】構造に依存した複雑なセレクタです。\n検出: ${selector}\n理由: 階層（>）や順序（nth-child）の指定はUI変更で即座に壊れます。\n対策: getByRole()やfilter()を用いて、意味のある要素を特定してください。`,
            });
            break;
          }

          // 2. 【許容範囲】シンプルな単一クラスセレクタ（.class-name のみ）
          if (selector.match(/^\.[a-zA-Z0-9_-]+$/)) {
            violations.push({
              line: index + 1,
              reason: `【確認：許容範囲】単一クラスセレクタが検出されました。\n検出: ${selector}\n理由: クラス名のみの指定は許容されますが、可能であれば getByRole() 等への置き換えを検討してください。\n特記: 外部ライブラリ（Select2等）や共通スタイルの場合はそのままで問題ありません。`,
            });
            break;
          }

          // 3. 【修正推奨】複雑なクラスセレクタ（複数クラス、属性セレクタ等）
          if (selector.match(/^\./)) {
            violations.push({
              line: index + 1,
              reason: `【修正推奨】複雑なクラスセレクタが検出されました。\n検出: ${selector}\n理由: 複数のクラスや属性セレクタはメンテナンス性が低下します。\n対策: getByRole()、getByLabel()、またはdata-testid属性を使用してください。`,
            });
            break;
          }
        }
      }

      return violations.length > 0 ? violations : null;
    },
  },
  {
    id: 'POM_BASE_PAGE_INHERITANCE',
    category: CHECK_CATEGORIES.POM_DESIGN,
    name: 'BasePage継承チェック',
    detect: (content, filePath) => {
      // Page Objectファイルのみをチェック
      if (!filePath.match(/Page\.ts$/)) {
        return null;
      }

      // BasePage自体は除外
      if (filePath.includes('BasePage') || filePath.includes('basePage')) {
        return null;
      }

      const lines = content.split('\n');

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const cleanLine = stripComments(line).trim();

        // class定義を検出
        if (/class\s+\w+/.test(cleanLine)) {
          // extends BasePageがあるかチェック
          if (/extends\s+BasePage/.test(cleanLine)) {
            return null; // BasePage継承あり：OK
          }

          // classの開始行を見つけたがextends BasePageがない
          return {
            line: index + 1,
            reason: 'Page ObjectがBasePageを継承していません。共通機能の再利用とコードの一貫性のため、extends BasePageを使用してください。',
          };
        }
      }

      return null;
    },
  },
];

// =========================================
// ファイルスキャナー
// =========================================
class PlaywrightReviewer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.cwd = process.cwd(); // コマンド実行ディレクトリを保存（絶対パス）
    this.scannedDirectories = []; // スキャンしたディレクトリのリスト
    this.violations = [];
    this.scannedFiles = [];
    this.totalChecks = 0;
    this.passedChecks = 0;
    this.categoryStats = {};
    this.fileViolationCounts = {}; // ファイルごとの違反数
    this.fileCategoryViolations = {}; // ファイルごと、カテゴリごとの違反フラグ

    // カテゴリ別統計の初期化（ファイル単位でカウント）
    for (const category of Object.values(CHECK_CATEGORIES)) {
      this.categoryStats[category] = { total: 0, passed: 0 };
    }
  }

  /**
   * 指定されたディレクトリ内の.ts/.jsファイルを再帰的に取得
   */
  findTypeScriptFiles(dir) {
    const files = [];

    const walk = (currentPath) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          // node_modules, .git等を除外
          if (!['node_modules', '.git', 'dist', 'build', 'coverage', 'test-results', 'playwright-report', 'review-reports'].includes(entry.name)) {
            walk(fullPath);
          }
        } else if (entry.isFile()) {
          // .ts, .js, .config.tsファイルを対象
          if (/\.(ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
            // レビューツール自身を除外
            if (!entry.name.startsWith('playwright-reviewer')) {
              files.push(fullPath);
            }
          }
        }
      }
    };

    walk(dir);
    return files;
  }

  /**
   * パッケージマネージャ混在チェック（1回のみ実行）
   */
  checkPackageManagerMix() {
    const yarnLockPath = path.join(this.projectRoot, 'yarn.lock');
    const packageLockPath = path.join(this.projectRoot, 'package-lock.json');

    const hasYarnLock = fs.existsSync(yarnLockPath);
    const hasPackageLock = fs.existsSync(packageLockPath);

    this.totalChecks++;
    this.categoryStats[CHECK_CATEGORIES.SECURITY].total++;

    if (hasYarnLock && hasPackageLock) {
      this.violations.push({
        filePath: this.projectRoot,
        relativePath: '.',
        checkId: 'SECURITY_PACKAGE_MANAGER_MIX',
        category: CHECK_CATEGORIES.SECURITY,
        name: 'パッケージマネージャ混在',
        line: 1,
        reason: 'yarn.lockとpackage-lock.jsonが混在しています。どちらか一方のパッケージマネージャに統一してください。',
      });

      // ファイルごとの違反数をカウント
      const key = this.projectRoot;
      this.fileViolationCounts[key] = (this.fileViolationCounts[key] || 0) + 1;
    } else {
      this.passedChecks++;
      this.categoryStats[CHECK_CATEGORIES.SECURITY].passed++;
    }
  }

  /**
   * 単一ファイルをスキャン
   */
  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.cwd, filePath);

    this.scannedFiles.push(filePath);

    // このファイルでの各カテゴリの違反を追跡
    const categoryViolationsInFile = {};
    for (const category of Object.values(CHECK_CATEGORIES)) {
      categoryViolationsInFile[category] = false;
    }

    for (const check of CHECKS) {
      this.totalChecks++;

      try {
        const violation = check.detect(content, relativePath, this.projectRoot);

        if (violation) {
          // このカテゴリで違反があったことを記録
          categoryViolationsInFile[check.category] = true;

          if (Array.isArray(violation)) {
            // 複数の違反がある場合
            violation.forEach(v => {
              this.violations.push({
                filePath: filePath,
                relativePath: relativePath,
                checkId: check.id,
                category: check.category,
                name: check.name,
                line: v.line,
                reason: v.reason,
              });

              // ファイルごとの違反数をカウント
              this.fileViolationCounts[filePath] = (this.fileViolationCounts[filePath] || 0) + 1;
            });
          } else {
            this.violations.push({
              filePath: filePath,
              relativePath: relativePath,
              checkId: check.id,
              category: check.category,
              name: check.name,
              line: violation.line,
              reason: violation.reason,
            });

            // ファイルごとの違反数をカウント
            this.fileViolationCounts[filePath] = (this.fileViolationCounts[filePath] || 0) + 1;
          }
        } else {
          this.passedChecks++;
        }
      } catch (error) {
        console.error(`Error checking ${check.name} in ${relativePath}:`, error.message);
      }
    }

    // ファイルスキャン完了後、カテゴリ別統計を更新（ファイル単位）
    for (const category of Object.values(CHECK_CATEGORIES)) {
      this.categoryStats[category].total++;
      if (!categoryViolationsInFile[category]) {
        this.categoryStats[category].passed++;
      }
    }
  }

  /**
   * 全ファイルをスキャン
   */
  scan(showProgress = true) {
    // スキャンしたディレクトリを記録（絶対パス）
    if (!this.scannedDirectories.includes(this.projectRoot)) {
      this.scannedDirectories.push(this.projectRoot);
    }

    // パッケージマネージャ混在チェック（1回のみ）
    this.checkPackageManagerMix();

    const files = this.findTypeScriptFiles(this.projectRoot);

    if (showProgress) {
      console.log(`📂 ${path.relative(this.cwd, this.projectRoot)}: ${files.length} ファイル`);
    }

    let processed = 0;
    for (const file of files) {
      this.scanFile(file);
      processed++;

      // 進捗表示
      if (showProgress && (processed % 5 === 0 || processed === files.length)) {
        process.stdout.write(`\r   📖 進捗: ${processed}/${files.length} ファイル`);
      }
    }

    if (showProgress && files.length > 0) {
      console.log('\n');
    }
  }

  /**
   * ワーストファイルランキングを取得
   */
  getWorstOffenders(topN = 3) {
    const entries = Object.entries(this.fileViolationCounts);
    entries.sort((a, b) => b[1] - a[1]); // 違反数の降順
    return entries.slice(0, topN);
  }

  /**
   * レポート生成
   */
  generateReport() {
    const now = new Date();
    const dateStr = now.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const passRate = this.totalChecks > 0
      ? Math.round((this.passedChecks / this.totalChecks) * 100)
      : 100;

    let report = '';

    // ========================================
    // 総合サマリー
    // ========================================
    report += colorize('━'.repeat(75) + '\n', colors.cyan);
    report += colorize('📊 Playwright Code Quality Report v3.3\n', colors.bright);
    report += colorize('━'.repeat(75) + '\n', colors.cyan);
    report += `実行日時: ${dateStr}\n`;

    // 複数ディレクトリをスキャンした場合は全て表示
    if (this.scannedDirectories.length > 1) {
      report += `対象ディレクトリ:\n`;
      this.scannedDirectories.forEach(dir => {
        report += `  - ${dir}\n`;
      });
    } else {
      report += `対象ディレクトリ: ${this.projectRoot}\n`;
    }

    report += `✅ チェック結果: ${colorize(`${this.passedChecks}/${this.totalChecks}`, colors.green)} (${passRate}%)\n`;
    report += `📂 スキャン済みファイル数: ${this.scannedFiles.length}\n`;
    report += `🚨 検出された問題: ${colorize(this.violations.length.toString(), this.violations.length > 0 ? colors.red : colors.green)}\n`;
    report += '\n';

    // ========================================
    // カテゴリ別サマリー（プログレスバー付き）
    // ========================================
    report += colorize('━'.repeat(75) + '\n', colors.blue);
    report += colorize('📋 カテゴリ別チェック結果（OK/Total）\n', colors.bright);
    report += colorize('━'.repeat(75) + '\n', colors.blue);

    for (const [category, stats] of Object.entries(this.categoryStats)) {
      const categoryPassRate = stats.total > 0
        ? Math.round((stats.passed / stats.total) * 100)
        : 100;

      const statusIcon = categoryPassRate === 100 ? '✅' : categoryPassRate >= 80 ? '🟡' : '🔴';
      const colorFunc = categoryPassRate === 100 ? colors.green : categoryPassRate >= 80 ? colors.yellow : colors.red;

      const progressBar = createProgressBar(categoryPassRate, 15);

      report += `  ${statusIcon} ${category.padEnd(20)} : ${colorize(`${stats.passed}/${stats.total}`.padEnd(8), colorFunc)} ${colorize(progressBar, colorFunc)}\n`;
    }
    report += '\n';

    // ========================================
    // 問題のカテゴリ別集計
    // ========================================
    if (this.violations.length > 0) {
      report += colorize('━'.repeat(75) + '\n', colors.yellow);
      report += colorize('⚠️  検出された問題の内訳\n', colors.bright);
      report += colorize('━'.repeat(75) + '\n', colors.yellow);

      const categoryCounts = {};
      for (const violation of this.violations) {
        categoryCounts[violation.category] = (categoryCounts[violation.category] || 0) + 1;
      }

      for (const [category, count] of Object.entries(categoryCounts)) {
        report += `  ${category}: ${colorize(count.toString(), colors.red)} 件\n`;
      }
      report += '\n';

      // ========================================
      // ワーストファイルランキング
      // ========================================
      const worstOffenders = this.getWorstOffenders(3);
      if (worstOffenders.length > 0) {
        report += colorize('━'.repeat(75) + '\n', colors.magenta);
        report += colorize('🏆 Worst Offenders（違反数の多いファイル Top 3）\n', colors.bright);
        report += colorize('━'.repeat(75) + '\n', colors.magenta);

        worstOffenders.forEach(([filePath, count], index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          report += `  ${medal} ${colorize(count.toString().padStart(3), colors.red)} 件 - ${filePath}\n`;
        });

        report += '\n';
      }

      // ========================================
      // 修正が必要なファイル（詳細）
      // ========================================
      report += colorize('━'.repeat(75) + '\n', colors.red);
      report += colorize('🚨 修正が必要な箇所（詳細）\n', colors.bright);
      report += colorize('━'.repeat(75) + '\n', colors.red);
      report += '\n';

      // カテゴリごとにグループ化（見出しあり）
      const violationsByCategory = {};
      for (const violation of this.violations) {
        if (!violationsByCategory[violation.category]) {
          violationsByCategory[violation.category] = [];
        }
        violationsByCategory[violation.category].push(violation);
      }

      // カテゴリ別に出力（TypeScript/ESLint形式）
      for (const [category, violations] of Object.entries(violationsByCategory)) {
        report += colorize(`[${category}]\n`, colors.yellow);
        report += '\n';

        for (const violation of violations) {
          // 形式: /path/to/file.ts:line:column - 違反名
          report += `${colorize(violation.filePath, colors.cyan)}:${violation.line}:1 - ${violation.name}\n`;
          report += `  ${violation.reason}\n`;
          report += '\n';
        }
      }
    }

    // ========================================
    // スキャン済みファイル一覧
    // ========================================
    report += colorize('━'.repeat(75) + '\n', colors.blue);
    report += colorize('📝 スキャン済みファイル一覧\n', colors.bright);
    report += colorize('━'.repeat(75) + '\n', colors.blue);
    report += '\n';

    for (const file of this.scannedFiles) {
      report += `  ${file}\n`;
    }
    report += '\n';

    // ========================================
    // フッター
    // ========================================
    report += colorize('━'.repeat(75) + '\n', colors.cyan);
    report += colorize('🤖 Generated by Playwright Code Reviewer v3.3\n', colors.bright);
    report += colorize('━'.repeat(75) + '\n', colors.cyan);

    return report;
  }

  /**
   * レポートをファイルに保存
   */
  saveReport(reportContent) {
    const reportsDir = path.join(this.cwd, 'review-reports');

    // ディレクトリがなければ作成
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // ファイル名生成（YYYYMMDD-HHMMSS形式）
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const fileName = `${dateStr}-${timeStr}_playwright-code-tool-review.md`;
    const filePath = path.join(reportsDir, fileName);

    // ANSIカラーコードを除去
    const plainReport = reportContent.replace(/\x1b\[[0-9;]*m/g, '');

    fs.writeFileSync(filePath, plainReport, 'utf8');

    return filePath;
  }
}

// =========================================
// メイン処理
// =========================================
function main() {
  const cwd = process.cwd();
  let targetDirs = [];

  // 引数がない場合：デフォルトフォルダをスキャン
  if (!process.argv[2]) {
    const defaultDirs = ['shared-e2e-components', 'src', 'testcase'];

    for (const dir of defaultDirs) {
      const dirPath = path.join(cwd, dir);
      if (fs.existsSync(dirPath)) {
        targetDirs.push(dirPath);
      }
    }

    if (targetDirs.length === 0) {
      console.error(colorize('❌ エラー: デフォルトフォルダ（shared-e2e-components、src、testcase）が見つかりません。', colors.red));
      console.error(colorize('   特定のディレクトリを指定してください: node playwright-reviewer-v3.js <directory>', colors.yellow));
      process.exit(1);
    }

    console.log(colorize('📂 デフォルトフォルダをスキャン:', colors.bright));
    targetDirs.forEach(dir => {
      console.log(colorize(`   - ${path.relative(cwd, dir)}`, colors.cyan));
    });
    console.log();
  } else {
    // 引数がある場合：指定されたディレクトリをスキャン
    const projectRoot = path.resolve(process.argv[2]);

    if (!fs.existsSync(projectRoot)) {
      console.error(colorize(`❌ エラー: ディレクトリが見つかりません: ${projectRoot}`, colors.red));
      process.exit(1);
    }

    targetDirs.push(projectRoot);
  }

  // スキャン開始メッセージ
  console.log(colorize('\n🔍 Playwrightコード品質チェック開始...\n', colors.bright));

  // 複数ディレクトリをスキャン
  const reviewer = new PlaywrightReviewer(targetDirs[0]);

  // 全ディレクトリをスキャン
  for (let i = 0; i < targetDirs.length; i++) {
    if (i > 0) {
      reviewer.projectRoot = targetDirs[i];
    }
    reviewer.scan();
  }

  // レポート生成
  const report = reviewer.generateReport();

  // コンソールに出力
  console.log(report);

  // ファイルに保存
  const reportFilePath = reviewer.saveReport(report);
  console.log(colorize(`\n💾 レポートを保存しました: ${reportFilePath}\n`, colors.green));

  // 違反がある場合はexit code 1で終了
  if (reviewer.violations.length > 0) {
    process.exit(1);
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { PlaywrightReviewer, CHECKS };
