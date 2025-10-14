# CLAUDE.md

このファイルは、MablからPlaywrightへのE2Eテストリファクタリング作業におけるClaude Codeへのガイダンスです。

## プロジェクト概要

**Mabl生成PlaywrightテストをPage Object Modelパターンを適用した保守性の高いE2Eテストリポジトリに再構成する**

### 目的
- Mabl生成テストの保守性・可読性向上
- Page Object Modelパターンの適用
- 型安全なテストデータ管理
- 安定したE2Eテスト実行環境の構築

### 対象サービスの特徴

このプロジェクトで扱うサービスには以下の特徴があります：

- **サービスの多様性**: 提供サービスは多岐にわたるが、認証システムは共通
- **複合ページ構造**: 一つのページに複数のサービスのコンテンツエリアが存在する可能性あり
- **共通レイアウト**: ほぼ全てのサービスのページは共通ヘッダ・フッタ・サイドのエリアを持つ
- **専門分野**: 医療従事者向けサービス
- **権限管理**: 医療従事者の職種により閲覧できるサービスが変わる

#### Page Object設計への影響

これらの特徴により、以下の設計方針を採用します：

- **共通コンポーネント**: ヘッダ・フッタ・サイドバーを独立したPage Objectとして作成
- **認証基盤**: 共通認証を活用した効率的なテストセットアップ
- **複合ページ対応**: ページ内の複数サービスエリアを適切に分離したPage Object構造

## 重要な注意事項

**すべての作業は日本語で行ってください**
- コメント、データ、ログ出力、エラーメッセージは日本語で記述
- **JSDocコメントの推奨**: クラス・メソッドには機能説明・実装理由・注意事項を日本語で記述

**リファクタリングの原則**
> 詳細なコーディング規約は[コーディングルール](#コーディングルール)セクションを参照してください

- **既存テストの忠実な再現**: 新機能追加ではなく変換が目的
- **役割ベースセレクタの優先使用**: アクセシビリティを重視した堅牢で保守性の高い要素選択
- **段階的セレクタ戦略**: 役割ベース → data-testid → CSSセレクタのフォールバック対応
- **複数サービスエリア対応**: 頑健なアサーションによる慎重な要素特定
- **URL遷移時のwaitUntil設定**: `page.goto()`や`page.click()`等のURL遷移時は、`waitUntil: 'domcontentloaded'`を明示的に指定する
  - ❌ 避けるべき設定: `networkidle`や`load`は別サービスのエラーや読み込みに引っ張られてタイムアウトする可能性がある
  - ✅ 推奨設定: DOM契機（`domcontentloaded`）を使用し、必要に応じて特定要素の出現待機を追加

**📝 README.md作成の必須化**
- **リファクタリング完了時には必ずREADME.mdを作成すること**
- 元のMablテストと変換後テストの対応表を明記
- プロジェクトの価値と使用方法を明確に文書化
- 将来の保守・拡張作業を効率化する重要なドキュメント

## ⚠️ 作業開始前の必須確認

### 元のMablテストの動作確認（最重要）

1. **環境セットアップ**: Playwright・dotenv・環境変数（.env）の設定
2. **Mablテストの簡易修正**: dotenv追加、環境変数修正、XPath→セレクタ置換、API更新（type→fill等）
3. **動作確認**: `npx playwright test testcase/` で全テスト実行確認

⚠️ **元のテストが動作しない場合は、リファクタリングを開始せず、まず元のテストを修正すること**
⚠️ **修正後は必ず `npx playwright test testcase/` でテスト実行し、動作確認すること**

### 必要な情報収集

- **システム情報**: URL、認証方式、権限、ブラウザ対応
- **アカウント情報**: テストユーザー、権限レベル、データ制約
- **技術要件**: CI/CD環境、実行環境、並列実行、外部依存
- **既存テスト**: 実行状況、不安定要素、カバレッジ、メンテナンス状況
- **サービス固有認証**: サービス固有の管理画面の認証情報が必要か（サービス内部なので別の認証フローを作成する必要がある）

### サービス固有仕様の管理

**⚠️ 重要**: 作業者とリファクタリングを開始する前に、収集した情報を以下の手順で整理すること：

1. **仕様ファイル作成**: 収集した情報を`.claude/services/service-[サービス名]-specs.md`として作成
2. **情報の集約**: 上記で収集した全ての情報を該当するサービス固有仕様ファイルに記載
3. **参照の限定**: 以降のリファクタリング作業では、**指定されたサービスの仕様ファイルのみを参照**し、`.claude/services/`フォルダ内の他のサービス仕様ファイルは参照しない

**作業指示例**:
```
作業者: "サービスAのリファクタリングを開始します。.claude/services/service-a-specs.mdを読んでください"
Claude: [該当ファイルのみを読み込み、そのサービスの仕様のみに基づいて作業を実行]
```

**利点**:
- サービス固有の情報が分離され、他サービスとの混同を防止
- 複数サービスの並行作業が可能
- 仕様変更時の影響範囲が限定される

## 📋 作業手順の全体像

### **STEP 1: 現状確認・準備** 
→ **STEP 2: 簡易修正・動作確認** 
→ **STEP 3: 本格リファクタリング**

---

## STEP 1: 現状確認・準備

### ⚠️ 作業開始前の必須確認
- 環境セットアップ（Playwright・dotenv・.env設定）
- 必要情報収集（システム情報・アカウント情報・技術要件）
- サービス固有仕様の管理（`.claude/services/service-[名前]-specs.md`作成）

---

## STEP 2: Mablテスト簡易修正

### 基本原則
**最小限の修正で元のテストを動作させる**
CLAUDEとの対話による段階的修正：環境確認→問題分析→修正実行→動作確認のサイクル。

### ⚠️ 重要：段階的アプローチの厳守

**❌ 避けるべき失敗パターン**
- いきなり全体をrefactorして一括テスト実行
- **実HTML構造を事前取得せずにセレクタを推測変更**
- 元のテストの動作確認を怠った状態でのrefactor開始
- **テスト実行してから「HTMLを取得してください」と後から依頼**

**✅ 正しい段階的アプローチ**

#### **Phase A: 現状把握（最重要）**
```
1. 【必須】実HTML構造の事前取得
   - Mablシナリオを読み取り、訪問するページを特定
   - 作業者にテスト対象の全ページのHTML取得を依頼
   - 保存先: tmp/[サービス名]_[ページ名].html
   
   **取得対象ページの特定方法:**
   - Mablテストのconsole.log(`#セクション名`)でページ切り替えを把握
   - page.goto()で直接遷移するページを特定
   - ボタンクリックやリンククリックで遷移するページを特定
   - 各ページの主要な機能・操作対象の要素を含むHTML構造を取得
   
2. backup版の未定義変数のみ最小修正
   - login_id, login_pw, renewal_top_flg等の値設定のみ
   - セレクタは元のXPathのまま維持
   
3. 修正版を実行して現状分析
   - どこまで動作するか？
   - どこで具体的に失敗するか？
   - エラーメッセージの詳細確認

4. 取得済みHTML構造と照合して問題点特定
   - XPathセレクタの問題箇所を特定
   - 実HTML構造に基づく修正方針決定
```

#### **Phase B: 小単位修正**
```
1. ログイン〜ホーム画面など最小単位で修正
2. 各修正後に動作確認（部分実行）
3. 成功を確認してから次のステップへ
```

#### **Phase C: 段階的拡張**
```
1. 動作確認済み部分を基盤に範囲拡大
2. 新しい問題と既存問題の明確な区別
3. 修正効果の測定可能性確保
```

**✅ このアプローチの利点**:
- **事前HTML取得**: 推測に基づく修正を排除、正確なセレクタ設計が可能
- **段階的確認**: 「ここまでは動く」基準点が明確になり、効率的なデバッグと改善が可能  
- **時間短縮**: 後からHTML取得依頼→待機→修正のサイクルを回避

**✅ STEP 2完了条件**: 元のMablテストが最後まで実行成功すること

---

## STEP 3: 本格リファクタリング

## E2Eテストリポジトリの標準構造

### フォルダ構造

```
{project-name}-e2e-tests/
├── src/                    # Page Object Model（複数ドメイン対応）
│   ├── {domain}/           # ドメイン別分離
│   │   ├── pages/
│   │   │   ├── BasePage.ts # 基底クラス
│   │   │   └── {feature}/  # 機能別ページオブジェクト
│   │   ├── helper/         # 業務ロジックヘルパー
│   │   │   ├── AuthHelper.ts      # 認証関連
│   │   │   ├── SetupHelper.ts     # セットアップ関連
│   │   │   └── {feature}Helper.ts # 機能別ヘルパー
│   │   └── utils/          # ユーティリティ関数
│   │       ├── account.ts  # アカウント生成
│   │       └── formatter.ts # フォーマット処理
├── tests/                  # テストファイル
│   ├── global_setup/       # グローバルセットアップ
│   │   ├── global_account_setup.ts
│   │   └── global_dataset_setup.ts
│   ├── data/               # テストデータと型定義
│   │   ├── test-data.ts    # テストデータ
│   │   └── types.d.ts      # TypeScript型定義
│   ├── {service}/          # サービス別テスト
│   │   └── *.spec.ts       # テストケース
├── playwright.config.ts    # Playwright設定
├── tsconfig.json          # TypeScript設定
└── package.json           # パッケージ設定
```

### 命名規則

- **テストファイル**: `*.spec.ts`
- **テストケース**: `C[ID]_[テスト内容説明]`
- **ページオブジェクト**: `{ページ名}Page.ts` (PascalCase + Page)
- **ファイル名**: `camelCase`

### コーディングルール

#### **基本原則**

**🔴 プロジェクトの目的**
- **テストの追加禁止**: 新しいテストケースやシナリオを勝手に追加しないこと（このプロジェクトはあくまで既存テストの変換を目的とする）
- **元の動作の保持**: 既存のMablテストの動作・検証内容を可能な限り忠実に再現する

**🟦 要素選択の戦略**
- **役割ベースの要素選択**: `page.locator()`よりも`getByRole()`、`getByLabel()`、`getByPlaceholder()`、`getByText()`などの役割ベースのセレクタを優先して使用する
  - ボタン: `page.getByRole('button', { name: 'ログイン' })`
  - リンク: `page.getByRole('link', { name: 'ホーム' })`
  - 入力フィールド: `page.getByLabel('メールアドレス')` または `page.getByPlaceholder('例: user@example.com')`
  - テキスト: `page.getByText('特定のテキスト')`
- **堅牢性の確保**: id・classなど内部仕様ではなく、text・roleなど見た目や振る舞いを対象とする
- **セレクタ優先順位**: getByRole・getByLabel・getByPlaceholder → data-testid → CSSセレクタ（最後の手段）

**🟡 アサーション・検証**
- **頑健なアサーション**: ページ内に複数サービスエリアが存在する可能性があるため、要素の特定とアサーションはより慎重に行う

#### Page Object Model

**基本設計原則**
- 全ページクラスは `BasePage` を継承
- セマンティックなセレクタを使用
- レスポンシブ対応（PC/SP分岐）を基底クラスで統一
- 循環参照回避のため遅延インポートを活用

**Page Object責務と独立性**
- **操作に専念**: ページの操作に関するメソッドのみ提供
- **検証の禁止**: Page Object内でexpectによるアサーションは行わない
- **独立性の保持**: 自身のページの操作にのみ責任を持つ
- **URL検証**: Page Object生成前にURLの事前確認を実行

**メソッド設計規則**
- **目的志向の命名**: 操作ではなく目的をメソッド名とする
  ```typescript
  // ❌ 悪い例：操作ベース
  async clickLoginButton() { }

  // ✅ 良い例：目的ベース
  async forwardToLoginPage() { }
  ```
- **パス構造の一致**: ページオブジェクトのパスは実際のページパス構造と一致させる
- **直接遷移の回避**: 導線確認もテスト観点のため、原則として直接テスト対象ページへの遷移は避ける

#### Helper設計パターン（段階的廃止予定）

> ⚠️ **重要**: Helperクラスは将来的に廃止予定です。新規実装や利用は避け、必要な処理はPage Objectに実装してください。

**現在のHelper使用原則**
- 既存Helperの新規利用は避ける
- テストに必要なブラウザ操作処理はPage Objectに実装
- 複雑な業務ロジックは段階的にPage Objectに移行

**代替設計パターン**

##### **1. 認証系Helper（AuthHelper/LoginHelper）**
```typescript
/**
 * ログイン処理を統一するヘルパークラス
 * 複数の認証方式に対応し、テストで再利用可能な形で提供
 */
export class AuthHelper {
  /**
   * 標準ログイン処理
   * @param page Playwrightページオブジェクト
   * @param email ユーザーメールアドレス
   * @param password パスワード
   * @returns ログイン後のトップページオブジェクト
   */
  static async login(page: Page, email: string, password: string): Promise<TopPage> {
    const topPage = await TopPage.land(page);
    const loginPage = await topPage.forwardToLoginPage();
    await loginPage.login(email, password);
    return topPage;
  }

  /**
   * 外部サービス経由ログイン（Amazon Pay等）
   */
  static async loginWithExternalService(
    page: Page,
    serviceType: 'amazon' | 'softbank' | 'docomo',
    credentials: ExternalServiceCredentials
  ): Promise<TopPage> {
    // 外部サービス別の認証フロー実装
  }
}
```

##### **2. セットアップ系Helper（SetupHelper/AccountSetupHelper）**
```typescript
/**
 * テスト用アカウントセットアップを統一するヘルパークラス
 * 各種プランのアカウント作成を効率化
 */
export class AccountSetupHelper {
  /**
   * 無料会員アカウントを作成
   * @param page Playwrightページオブジェクト
   * @returns 作成されたアカウント情報
   */
  static async createFreeAccount(page: Page): Promise<AccountInfo> {
    const { uuid, email, password } = generateAccountCredentials();
    await UserPreRegisterFreePage.goto(page);
    await UserRegisterHelper.registerFree(page, email, password);
    return { uuid, email, password };
  }

  /**
   * 有料プラン会員アカウントを作成
   * @param page Playwrightページオブジェクト
   * @param planType プラン種別
   * @param paymentInfo 決済情報（オプション）
   * @returns 作成されたアカウント情報
   */
  static async createPaidAccount(
    page: Page,
    planType: 'trial' | 'monthly' | 'yearly' | 'basic',
    paymentInfo?: PaymentInfo
  ): Promise<AccountInfo> {
    // プラン別の登録フロー実装
  }
}
```

##### **3. 業務ロジック系Helper（機能別Helper）**
```typescript
/**
 * 会員登録の複雑なフローを隠蔽するヘルパークラス
 * 多様な決済方式や外部サービス連携に対応
 */
export class UserRegisterHelper {
  /**
   * 無料会員登録
   */
  static async registerFree(page: Page, email: string, password: string): Promise<void> {
    // メール認証を含む完全な登録フロー
  }

  /**
   * クレジットカード決済での有料会員登録
   */
  static async registerWithCreditCard(
    page: Page,
    userInfo: UserInfo,
    creditCardInfo: CreditCardInfo,
    profileInfo: ProfileInfo
  ): Promise<void> {
    // 決済情報入力からプロフィール設定まで一括処理
  }

  /**
   * 外部決済サービス経由登録（デバイス別対応）
   */
  static async registerWithExternalPayment(
    page: Page,
    serviceType: 'amazon' | 'softbank' | 'docomo',
    deviceType: 'pc' | 'android' | 'iphone',
    credentials: ExternalServiceCredentials
  ): Promise<void> {
    // デバイス別の外部サービス認証フロー
  }
}
```

##### **4. Helper設計の原則**

**単一責任の原則**
- 1つのHelperクラスは1つの業務領域に特化
- 認証、セットアップ、業務フローを明確に分離

**静的メソッド設計**
- Helperクラスは状態を持たない静的メソッドで構成
- インスタンス化せずに直接呼び出し可能

**型安全性の確保**
```typescript
// 引数・戻り値の型を明確に定義
export interface AccountInfo {
  uuid: string;
  email: string;
  password: string;
}

export interface ExternalServiceCredentials {
  serviceEmail: string;
  servicePassword: string;
  additionalInfo?: Record<string, string>;
}
```

**エラーハンドリングの統一**
```typescript
export class AuthHelper {
  static async login(page: Page, email: string, password: string): Promise<TopPage> {
    try {
      // ログイン処理
      return topPage;
    } catch (error) {
      throw new Error(`ログイン処理に失敗しました: ${error.message}`);
    }
  }
}
```

**デバイス・環境対応**
```typescript
// デバイス別の処理分岐をHelperで吸収
static async registerForDevice(
  page: Page,
  deviceType: 'pc' | 'android' | 'iphone',
  userInfo: UserInfo
): Promise<void> {
  switch (deviceType) {
    case 'pc':
      return await this.registerPc(page, userInfo);
    case 'android':
      return await this.registerAndroid(page, userInfo);
    case 'iphone':
      return await this.registerIphone(page, userInfo);
  }
}
```

#### テストコード

**基本構造**
- **AAA構造**: Arrange（準備）/ Action（実行）/ Assert（検証）に基づいたコードブロック
- **分岐の最小化**: テストコード内でif・switchによる分岐は限りなくゼロにする
  - PC/SP画面判定分岐は例外とする
  - 同一パスで大きく異なる場合は、PC/SP別Page Objectを用意
- **ユーザー視点**: 内部的な挙動ではなく、ユーザーから見た振る舞いをテスト

**実装ガイドライン**
- `test.beforeEach()` でページ初期化
- 適切な `expect()` でアサーション（専用メソッドがある場合は使用）
  ```typescript
  // ✅ 推奨：専用メソッド使用
  await expect(page).toHaveURL(/dashboard/);

  // ❌ 非推奨：汎用的な比較
  expect(page.url()).toContain('dashboard');
  ```
- 明示的なタイムアウト設定
- 認証テストでは `storageState` 使用
- デバイス別実行制御（タグベース）
- シリアル実行制御（依存関係のあるテスト）

**パフォーマンス最適化**
- **データベース直接操作**: テストシナリオに直接関連しない部分（テストデータ作成、状態確認等）
- **共通処理の慎重な使用**: 読んだ通りの流れで実行されるべき。Fixtures・Global Setupを活用
- **既存Page Object優先**: 新規実装前に既存のPage Object・Fixturesを確認

#### TypeScript
- 型定義は `tests/data/types.d.ts` に集約
- `enum` でステータス管理
- インターフェースでデータ型定義
- Helper引数・戻り値の型安全性確保

### Mablコードの主要問題点
**脆弱なXPathセレクタ、未定義環境変数、非推奨API、不適切な条件分岐、待機処理不足、Page Object未適用**

### リファクタリング方針
**XPath→セマンティックセレクタ、Page Object適用、データ外部化、型安全性向上、エラーハンドリング強化、日本語化**

### 作業順序

#### **Phase 1: Mablシナリオ分析とHTML取得**
- **シナリオ読み取り**: Mablテストの動作とページ遷移を把握
- **URL調査**: 遷移先URLの確認と既存Page Objectの有無をチェック
- **HTML取得**: 未対応のページがある場合、作業者にHTML取得を依頼
  ```
  作業者への指示例:
  「https://example.com/new-page にアクセスし、ページのHTMLソースを取得してtmp/new-page.htmlとして保存してください」
  ```
- **セレクタ調査**: 取得したHTMLを基に役割ベースのセレクタ（getByRole、getByLabel等）を特定

#### **Phase 2: 基盤構築（ドメイン別フォルダ構造）**
- **フォルダ構造作成**: `src/{domain}/` 形式での複数ドメイン対応構造
- **BasePage設計**: レスポンシブ対応・循環参照対策を含む基底クラス
- **設定ファイル**: playwright.config.ts（企業環境・グローバルセットアップ対応）

#### **Phase 3: データ層・ユーティリティ構築**
- **型定義作成**: `tests/data/types.d.ts` での型安全性確保
- **ユーティリティ**: アカウント生成・フォーマット処理等
- **テストデータ**: 外部化されたテストデータ管理

#### **Phase 4: Helper層設計・実装**
- **認証系Helper**: AuthHelper・LoginHelper実装
- **セットアップ系Helper**: AccountSetupHelper・DataSetupHelper実装
- **業務ロジック系Helper**: 機能別の複雑フロー隠蔽

#### **Phase 5: Page Object作成**
- **基底Page Object**: BasePage継承による共通機能
- **主要ページ**: ログイン→ホーム→主要機能ページ
- **詳細ページ**: 機能別の詳細ページ群

#### **Phase 6: テストケース変換**
- **Helper活用**: 複雑な業務ロジックはHelperで隠蔽
- **デバイス別対応**: タグベーステストでの実行制御
- **段階的変換**: 単純→複雑→統合テストの順序

### 品質向上のポイント
- **セレクタ**: セマンティック優先、XPath最小化
- **認証**: storageState活用
- **待機**: networkidle・expect().toBeVisible()使用、固定時間回避

## 設計書テンプレート

**基本情報**: サービス名・URL・機能・認証方式・技術制約
**構造設計**: Page Object分類・テスト分類・命名規則  
**データ設計**: ユーザーアカウント・URL・テストデータ構成
**認証戦略**: 認証方式・セッション管理・権限レベル対応

## README.md作成ガイド

### 必須含有内容
**プロジェクト概要・使用方法・構造説明・リファクタリング対応表・改善点・テスト結果・トラブルシューティング・今後の拡張**

### 生成タイミング
Mablテスト変換完了・テスト実行成功・Page Object構造構築済みの時点で生成

## 🏗️ 共通基盤を活用したリファクタリング戦略

### shared-e2e-componentsの活用

**構成**: auth（M3ログイン）・common（ヘッダー・サイドバー・BasePage）・config（エラー無視設定）  
**改良**: 共通基盤 First → サービス個別開発

### 実装手順

**Phase 1**: 共通基盤配置 → BasePage継承確認 → 認証処理標準化  
**Phase 2**: 共通ヘッダー・サイドバーコンポーネント活用  
**Phase 3**: 共通基盤組み合わせ + サービス固有機能実装、段階的移行

### 共通基盤活用の利点

#### 🚀 開発効率の向上
- **認証処理**: 複雑なM3.comログインフローが1行で完了
- **レイアウト操作**: ヘッダー・サイドバーの標準的な操作が簡単
- **エラー処理**: 高度なエラー監視・分析機能が自動で利用可能

#### 🛡️ 品質・安定性の向上
- **APIレスポンス監視**: ログイン成功/失敗の確実な判定
- **リトライ機能**: 一時的な要素の読み込み遅延に対応
- **エラー無視設定**: Google Analytics等の無関係なエラーを除外

#### 🔧 保守性の向上
- **統一された実装**: 全サービスで共通の操作パターン
- **中央集約管理**: 共通機能の改善が全サービスに反映
- **CLAUDE.md準拠**: 日本語コメント、型安全性などの品質基準を継承

### 実装ガイドライン

#### 共通基盤の拡張原則
1. **高い共通性**: 複数サービスで利用される機能のみ追加
2. **サービス非依存**: 特定サービス固有の要素は含めない
3. **後方互換性**: 既存の利用箇所に影響を与えない拡張

#### リファクタリング優先順位
1. **認証処理**: 最も効果が高く、全テストで利用
2. **共通レイアウト**: ヘッダー・サイドバー等の頻出要素
3. **エラー処理**: テスト安定性の向上に直結
4. **サービス固有機能**: 個別の画面・機能操作

### トラブルシューティング

#### よくある問題と解決方法

**Q: 共通基盤のパスが解決できない**
```typescript
// 相対パス指定を確認
import { BasePage } from '../shared/common/basePage';
// または絶対パス指定
import { BasePage } from '../../shared-e2e-components/common/basePage';
```

**Q: サービス固有の要素が共通コンポーネントで操作できない**
```typescript
// 共通コンポーネント + サービス固有処理の組み合わせ
const header = new M3HeaderComponent(page);
await header.verifyLoggedInState(); // 共通処理

// サービス固有の要素は直接操作
await page.locator('.service-specific-element').click();
```

**Q: 既存テストとの共存方法**
```typescript
// 段階的移行: まず認証処理から置換
// 従来
// await performComplexLogin(user);

// 共通基盤活用
const m3Login = new M3LoginPage(page);
await m3Login.performFullLogin(user);
// 以降の処理は既存のまま保持
```

この共通基盤を活用することで、リファクタリング効率が大幅に向上し、より安定で保守性の高いE2Eテストが構築できます。