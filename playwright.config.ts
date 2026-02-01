import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

export default defineConfig({
  timeout: 360_000, // 各テストの最大実行時間（6分）
  expect: {
    timeout: 15000, // expectのデフォルトタイムアウト
  },
  retries: 0, // 必要に応じてリトライ回数を設定
  testDir: './testcase', // テストケースのディレクトリ
  outputDir: 'test-results',
  testMatch: '**/*.spec.ts',
  reporter: [['list'], ['html', { open: 'never' }]],

  // グローバルセットアップ: 全テスト実行前に1回だけ認証を実行
  globalSetup: require.resolve('./testcase/auth.setup.ts'),

  use: {
    baseURL: process.env.BASE_URL || 'https://www.m3.com',
    headless: false, // trueにするとヘッドレスモード、falseでブラウザ表示
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 30_000, // アクションのデフォルトタイムアウト（30秒）
    navigationTimeout: 60_000,

    // 認証状態を全テストで共有
    storageState: path.join(__dirname, 'testcase/.auth/user.json'),

    proxy: {
      server: 'http://mrqa1.office.so-netm3.com:8889', // デフォルトではQA1に接続
    },
    permissions: ['local-network-access'],
    launchOptions: {
      args: ['--deny-permission-prompts'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
