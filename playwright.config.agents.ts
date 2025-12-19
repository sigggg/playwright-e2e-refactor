import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

/**
 * Playwright Test Agents用設定ファイル
 *
 * @description
 * - Playwright 1.56以降のTest Agents機能に対応
 * - specs/: Planner Agentが生成するMarkdownプラン
 * - tests/: Generator Agentが生成するテストコード
 * - seed.spec.ts: 環境セットアップ（認証処理）
 */
export default defineConfig({
  timeout: 360_000, // 各テストの最大実行時間（6分）
  expect: {
    timeout: 15000, // expectのデフォルトタイムアウト
  },
  retries: 0, // 必要に応じてリトライ回数を設定

  // Test Agents用ディレクトリ設定
  testDir: './tests',  // Generator Agentが生成するテストファイル
  outputDir: 'test-results',
  testMatch: '**/*.spec.ts',

  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  use: {
    headless: false, // trueにするとヘッドレスモード、falseでブラウザ表示
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 30_000, // アクションのデフォルトタイムアウト（30秒）
    navigationTimeout: 60_000,

    // seed.spec.tsで生成された認証状態を全テストで共有
    storageState: path.join(__dirname, '.auth/user.json'),

    proxy: {
      server: 'http://mrqa1.office.so-netm3.com:8889', // デフォルトではQA1に接続
    },
  },

  projects: [
    // 環境セットアップ（認証処理）
    {
      name: 'setup',
      testMatch: /seed\.spec\.ts/,
    },
    // 通常のテスト（認証状態を再利用）
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],  // setupプロジェクト完了後に実行
    },
  ],
});
