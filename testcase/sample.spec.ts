import { test, expect } from '@playwright/test';

/**
 * サンプルテスト
 * Playwrightの基本的な動作を確認するためのテスト
 */
test.describe('サンプルテスト', () => {
  test('C001_Googleトップページにアクセスして検索ボックスを確認', async ({ page }) => {
    // Arrange: Googleトップページにアクセス
    await page.goto('https://www.google.com');

    // Action: ページタイトルを取得
    const title = await page.title();

    // Assert: タイトルに「Google」が含まれることを確認
    expect(title).toContain('Google');

    // Assert: 検索ボックスが表示されていることを確認
    const searchBox = page.getByRole('combobox', { name: '検索' });
    await expect(searchBox).toBeVisible();
  });
});
