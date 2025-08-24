# Shared E2E Components

M3サービス群で共通利用されるE2Eテストコンポーネントライブラリです。

## 概要

base-e2e-testsの優秀な共通処理をCLAUDE.md規約に準拠してリファクタリングし、各サービスのE2Eテストで再利用可能な形で提供します。

## フォルダ構造

```
shared-e2e-components/
├── auth/                           # 認証関連
│   └── m3LoginPage.ts             # M3.com共通ログイン処理
├── common/                         # 共通レイアウト
│   ├── basePage.ts                # 基底クラス（高度な機能統合済み）
│   ├── headerComponent.ts         # M3共通ヘッダー（Atlas対応）
│   ├── footerComponent.ts         # M3共通フッター（Atlas対応）
│   └── ebookSidebarComponent.ts   # ⚠️電子書籍専用サイドバー
├── utils/                          # ユーティリティ
│   ├── authHelper.ts              # 認証ヘルパー
│   └── testHelpers.ts             # テストヘルパー関数
├── config/                         # 設定ファイル
│   └── ignored-errors.json        # エラー無視設定
└── README.md                      # このファイル
```

## 使用方法

### 1. 基本的な使用例

```typescript
import { M3LoginPage } from '../shared-e2e-components/auth/m3LoginPage';
import { HeaderComponent } from '../shared-e2e-components/common/headerComponent';
import { EbookSidebarComponent } from '../shared-e2e-components/common/ebookSidebarComponent';

test('サービステスト', async ({ page }) => {
  // 共通ログイン処理
  const m3Login = new M3LoginPage(page);
  await m3Login.performLogin(credentials);
  
  // 共通ヘッダー操作
  const header = new HeaderComponent(page);
  const isLoggedIn = await header.isLoggedIn();
  const userName = await header.getUserName();
  
  // 電子書籍専用サイドバーナビゲーション（電子書籍サービスのみ）
  const sidebar = new EbookSidebarComponent(page);
  await sidebar.clickMajorCategory('初期研修医');
  await sidebar.clickChildCategory('初期研修医', '内科');
});
```

### 2. サービス固有の拡張

```typescript
// サービス固有のPage Objectでは共通コンポーネントを継承・組み合わせ
export class ServiceSpecificPage extends BasePage {
  private header: HeaderComponent;
  
  constructor(page: Page) {
    super(page);
    this.header = new HeaderComponent(page);
  }
  
  // サービス固有の機能を追加
  async performServiceSpecificAction(): Promise<void> {
    // 共通機能と組み合わせた独自処理
    const isLoggedIn = await this.header.isLoggedIn();
    if (!isLoggedIn) {
      throw new Error('ログインが必要です');
    }
    // サービス固有の処理...
  }
}
```

## 主要コンポーネント

### M3LoginPage (auth/m3LoginPage.ts)
- **機能**: M3.com共通ログイン処理
- **特徴**: APIレスポンス監視、エラーハンドリング、汎用的なサービス遷移
- **メソッド**: 
  - `performFullLogin()`: 完全なログインフロー
  - `loginAndRedirectToService()`: ログイン後サービス遷移

### M3HeaderComponent (common/m3HeaderComponent.ts)
- **機能**: M3共通ヘッダーの操作
- **特徴**: PC/SP自動判定、ユーザー情報取得、ポイント情報管理
- **メソッド**:
  - `verifyLoggedInState()`: ログイン状態確認
  - `getUserName()`: ユーザー名取得
  - `getPointInfo()`: ポイント情報取得

### SidebarComponent (common/sidebarComponent.ts)
- **機能**: 階層的サイドバーナビゲーション
- **特徴**: 大・中・小カテゴリの階層対応、出版社管理
- **メソッド**:
  - `navigateToCategory()`: 階層ナビゲーション
  - `getMajorCategoryNames()`: カテゴリ一覧取得

### BasePage (common/basePage.ts)
- **機能**: 全Page Objectの基底クラス
- **特徴**: base-e2e-testsの高度な機能を統合
- **追加機能**:
  - エラー監視とJSON出力
  - パフォーマンス計測
  - 視覚的回帰テスト
  - リトライ機能付き操作

## CLAUDE.md規約準拠

- ✅ 日本語コメント・ログ出力
- ✅ Page Object Modelパターン
- ✅ セマンティックセレクタ優先
- ✅ 型安全なテストデータ管理
- ✅ エラーハンドリング強化

## 各サービスでの活用方法

1. **共通処理の継承**: 認証・レイアウトコンポーネントを直接利用
2. **拡張ポイントの活用**: サービス固有の機能は独自Page Objectで実装
3. **段階的移行**: 既存テストと共存しながら徐々に共通基盤に移行

## 保守・拡張指針

- 共通性の高い機能は積極的に追加
- サービス固有の要素は含めない
- CLAUDE.md規約の継続的な準拠
- テストの安定性とパフォーマンスを重視