import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

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
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
    ignoreHTTPSErrors: true,
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 0,
    navigationTimeout: 60_000,
    storageState: process.env.STORAGE_STATE || undefined,
    proxy: {
      server: 'http://mrqa1:8888', // デフォルトではQA1に接続
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
