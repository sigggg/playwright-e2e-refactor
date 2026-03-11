# Playwright Test Orchestrators - 作業フローガイド

このディレクトリには、Playwright E2Eテストの作成・移行を自動化する2つのオーケストレーターがあります。

---

## 📋 2つのオーケストレーター

| オーケストレーター | 用途 | 対象 |
|------------------|------|------|
| **test-creation-orchestrator.md** | テスト新規作成 | テストケース仕様書からPlaywrightテストを作成 |
| **mabl-migration-orchestrator.md** | mabl移行 | mablテストをPlaywrightに移行 |

---

## 🔄 テスト新規作成フロー（test-creation-orchestrator）

### 📥 入力

- **テストケース仕様書**（以下のいずれか）
  - `test-case-spec/original-spec.md`（ファイル）
  - Excel、スプレッドシート、Markdown
  - 口頭での説明

### 🎯 全体の流れ（7フェーズ）

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
  ↓         ↓         ↓         ↓         ↓         ↓         ↓
初期化    生成      実行    デバッグ   品質    仕様     完了
                              ↑         ↓      ↓
                              └─────3回まで─┘
                                      ↓
                                  再生成へ
```

---

### Phase 0: 初期化と準備

**担当**: オーケストレーター自身

**やること**:
1. テストケース仕様書を確認
2. ディレクトリ構造を作成:
   - `test-case-spec/` - 仕様書保存
   - `debug-artifacts/` - デバッグ証跡
   - `review-reports/` - レビューレポート

**成果物**:
```
プロジェクト/
├── test-case-spec/
├── debug-artifacts/
│   ├── screenshots/
│   ├── traces/
│   └── html-sources/
└── review-reports/
```

---

### Phase 1: 仕様解釈とコード生成

**担当エージェント**: `playwright-code-generator`（テストケース作成モード）

**場所**: `../code-generation/playwright-code-generator.md`

**やること**:
1. テストケース仕様書を解析
2. 確認事項を抽出
3. Page Object Model（POM）を設計
4. Playwrightコードを生成:
   - Page Objectクラス（`src/{domain}/pages/*.ts`）
   - テストファイル（`tests/{service}/*.spec.ts`）
   - テストデータ（`testcase/data/test-accounts.ts`）
5. 仕様書を保存:
   - `test-case-spec/original-spec.md` - ユーザー提供の原文
   - `test-case-spec/interpreted-spec.md` - エージェントの解釈
6. ドキュメント生成:
   - `README.md` - テスト概要
   - `TEST_DETAILS.md` - 詳細仕様

**成果物**:
```
src/{domain}/pages/
  └── LoginPage.ts          # Page Object

tests/{service}/
  └── login.spec.ts         # テストファイル

test-case-spec/
  ├── original-spec.md      # 原文
  └── interpreted-spec.md   # 解釈内容

README.md
TEST_DETAILS.md
```

---

### Phase 2: テスト実行

**担当**: オーケストレーター自身（Bash tool使用）

**やること**:
```bash
npx playwright test tests/{service}/*.spec.ts
```

**結果判定**:
- ✅ **全テスト成功** → Phase 4（コード品質チェック）へ
- ❌ **テスト失敗** → Phase 3（デバッグ）へ

**出力例**:
```
Running 4 tests using 1 worker

✓ C001_ログイン成功 (2.5s)
✓ C002_ログインフォーム表示確認 (1.2s)
✓ C003_ログイン後遷移確認 (1.8s)
✓ C004_ユーザー名表示確認 (1.1s)

4 passed (6.6s)
```

---

### Phase 3: デバッグと修正（失敗時のみ）

**担当エージェント**: `playwright-debug-fix-engine`

**場所**: `../code-generation/playwright-debug-fix-engine.md`

**やること**:
1. Playwright MCPでライブ診断
2. エラー証拠を収集:
   - スクリーンショット（`debug-artifacts/screenshots/`）
   - Playwright Trace（`debug-artifacts/traces/`）
   - HTML保存（`debug-artifacts/html-sources/`）
3. エラー原因を特定:
   - セレクタが見つからない
   - タイムアウト
   - アサーション失敗
4. コードを修正

**試行回数**: 最大3回まで

**3回で解決しない場合**:
- ユーザーにエスカレーション
- 収集した証跡を提示
- 推奨アクションを提案

**修正成功後**:
→ Phase 2（テスト再実行）へ戻る

---

### Phase 4: コード品質チェック（2段階レビュー + 優先度別修正）

このフェーズでは、**エージェントベースの詳細レビュー** と **ツールベースの自動チェック** の両方を実施し、優先度別に修正要否を判断します。

---

#### Phase 4-1: エージェントベース品質レビュー

**担当エージェント**: `playwright-code-quality-reviewer`

**場所**: `../code-review/playwright-code-quality-reviewer.md`

**やること**:
- CLAUDE.md規約への準拠を多角的に検証
- POM設計、セレクタ戦略、認証管理、CI/CD統合等をレビュー

**成果物**:
- `review-reports/{timestamp}_code-quality-agent-review.md`
  - 検出された問題のリスト
  - 各問題の重要度（Critical / High / Medium / Low）
  - 推奨修正内容

---

#### Phase 4-2: ツールベース自動チェック

**担当ツール**: `playwright-reviewer-v3.js`（Bash toolで実行）

**場所**: `../tool/playwright-reviewer-v3.js`

**やること**:
```bash
# Page Objectをチェック
node playwright-reviewer-v3.js src/{domain}/pages/*.ts

# テストファイルをチェック
node playwright-reviewer-v3.js tests/{service}/*.spec.ts
```

**チェック項目（23項目）**:
1. **形式規約**: ファイル末尾改行、LF改行コード
2. **アンチパターン**: waitForTimeout、test.only、console.log
3. **POM設計**: readonly修飾子、BasePage継承、expect使用制限
4. **環境管理**: 絶対URL禁止、TARGET_ENV明示、test-accounts.ts使用
5. **タイムアウト**: マジックタイムアウト禁止
6. **テスト構造**: test.step構造化
7. **セレクタ戦略**: 役割ベースセレクタ優先

**成果物**:
- `review-reports/{timestamp}_code-quality-tool-review.md`
  - チェック結果スコア（23/23）
  - 違反項目の詳細

---

#### Phase 4-3: 統合レビューと優先度別修正判断

**やること**:
1. Phase 4-1（エージェント）とPhase 4-2（ツール）の両レポートを統合分析
2. 検出された全問題を優先度別に分類
3. 修正要否を判断

**優先度判定基準**:

| 優先度 | 条件 | 対応 |
|--------|------|------|
| **Critical** | セキュリティリスク、テスト実行不可、CLAUDE.md重大違反 | **即座に修正** |
| **High** | 保守性の著しい低下、脆弱なセレクタ、POM設計違反 | **即座に修正** |
| **Medium** | 形式規約違反、マイナーなベストプラクティス違反 | **自動修正可能なら修正、不可なら記録のみ** |
| **Low** | コメント不足、改善提案 | **記録のみ（修正しない）** |

**修正方針**:
1. **Critical/High問題**:
   - 自動修正可能 → 即座に修正実施
   - 手動修正必要 → Phase 1（生成）に差し戻し
2. **Medium/Low問題**:
   - TEST_DETAILS.md の「既知の制約事項」「今後の改善案」に記載
   - 修正はスキップ

**成功条件（Phase 5へ進む）**:
- Critical/High問題: 0件
- Medium/Low問題: 記録済み（修正不要）

**不合格時**:
→ Phase 1（再生成）へ差し戻し（最大3回まで）

---

### Phase 5: 仕様完全性レビュー（優先度別判定）

このフェーズでは、テストが仕様を完全に満たしているかを検証し、実装漏れを優先度別に判定します。

---

#### Phase 5-1: 仕様完全性レビュー実施

**担当エージェント**: `playwright-spec-reviewer`（テストケース作成モード）

**場所**: `../code-review/playwright-spec-reviewer.md`

**やること**:
1. `test-case-spec/original-spec.md` から全確認事項を抽出
2. テストコードから実装済み確認事項を抽出
3. README.md / TEST_DETAILS.md の記載内容を検証
4. 実装完全性レポートを生成（各問題に重要度を付与）

**成果物**:
- `review-reports/{timestamp}_spec-completeness-review.md`
  - 実装漏れのリスト
  - 各漏れの重要度（Critical / High / Medium / Low）
  - 推奨修正内容

---

#### Phase 5-2: 優先度別修正判断

**やること**:
1. Phase 5-1のレポートを読み込み
2. 検出された実装漏れを優先度別に分析
3. 修正要否を判断

**優先度判定基準**:

| 優先度 | 条件 | 対応 |
|--------|------|------|
| **Critical** | 主要機能の確認事項が未実装、セキュリティ関連の検証漏れ | **必ず修正（Phase 1に差し戻し）** |
| **High** | 重要な確認事項が未実装、仕様との齟齬 | **必ず修正（Phase 1に差し戻し）** |
| **Medium** | 補助的な確認事項の未実装、README記載不足 | **記録のみ（TEST_DETAILS.mdに記載）** |
| **Low** | エッジケースの未実装、ドキュメントの細かい記載漏れ | **記録のみ（今後の改善案として記載）** |

**修正方針**:
1. **Critical/High問題**:
   - Phase 1（生成）に差し戻し、追加実装を指示
   - 最大3回まで再生成を試行
2. **Medium/Low問題**:
   - TEST_DETAILS.md の「既知の制約事項」「今後の改善案」に記載
   - 修正はスキップ（Phase 6へ進む）

**成功条件（Phase 6へ進む）**:
- Critical/High問題: 0件
- Medium/Low問題: TEST_DETAILS.mdに記録済み

**レビュー例（優先度別）**:
```markdown
## 仕様完全性レビュー結果

### 総合スコア: 85% ⚠️

### 実装状況
- 解釈精度: 100% (4/4)
- 確認事項実装率: 75% (3/4)
- README/TEST_DETAILS一致率: 90%

### 検出された実装漏れ（優先度別）

#### 🔄 必ず修正（Critical/High）
1. **High**: 確認事項3「パスワード入力欄がマスク表示であること」が未実装
   - 推奨修正: LoginPage.tsにpasswordInput追加、spec側で検証

#### 📝 記録のみ（Medium/Low - 修正しない）
1. **Medium**: README.mdの環境変数説明が不足
   → TEST_DETAILS.mdに記載
2. **Low**: エラーケースのテストが不足
   → TEST_DETAILS.mdの「今後の改善案」に記載

→ Phase 1に差し戻して、High問題を修正します（1回目）
```

**不合格時**:
→ Phase 1（再生成）へ差し戻し（最大3回まで）

---

### Phase 6: ドキュメント最終確認と完了

**担当**: オーケストレーター自身

**やること**:
1. README.md の内容確認
2. TEST_DETAILS.md の詳細度確認
3. 総合レポート生成

**総合レポート例**:
```markdown
# テスト作成完了レポート

## 成果物
✅ Page Object: src/login/pages/LoginPage.ts
✅ テストファイル: tests/login/login.spec.ts
✅ README.md
✅ TEST_DETAILS.md

## テスト実行結果
- 総テスト数: 4
- 成功: 4
- 失敗: 0
- 実行時間: 6.6秒

## コード品質
- playwright-reviewer-v3.js: 23/23 (100%)
- 仕様完全性レビュー: 100%

## デバッグ履歴
- 初回実行: 1件失敗（セレクタ不一致）
- 修正後: 全グリーン ✅
```

---

## 🔄 mabl移行フロー（mabl-migration-orchestrator）

### 📥 入力

以下のいずれか:
- **mablプランID**: テスト一覧を自動取得
- **mablテストID**: 個別テストを取得
- **既存mablエクスポート**: `mabl-export/*.json`（すでに用意されている場合）

### 🎯 全体の流れ（7フェーズ）

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
  ↓         ↓         ↓         ↓         ↓         ↓         ↓
mabl      移行      実行    デバッグ   品質    移行     完了
エクス    コード                       チェック 完全性
ポート    生成                                 レビュー
                              ↑         ↓      ↓
                              └─────3回まで─┘
                                      ↓
                                  再生成へ
```

---

### Phase 0: 初期化とmablエクスポート

**担当**: オーケストレーター自身

**やること**:

#### 1. ディレクトリ構造作成
```
プロジェクト/
├── mabl-export/           # mablエクスポート結果
├── test-case-spec/        # テストケース仕様
├── debug-artifacts/       # デバッグ証跡
└── review-reports/        # レビューレポート
```

#### 2. mablテストのエクスポート（必要な場合）

**mablプランIDが提供された場合**:
```bash
# ステップ1: プランからテストID一覧を取得
mabl plan get-tests --plan-id 12345

# ステップ2: Playwright形式でエクスポート
mabl export --plan-id 12345 --format playwright-typescript --output mabl-export/
```

**mablテストIDが提供された場合**:
```bash
# 個別テストをエクスポート
mabl export --test-id test-001 --format playwright-typescript --output mabl-export/
```

**既存エクスポートが提供された場合**:
- ファイルの存在確認のみ

#### 3. エクスポート結果確認

**保存ファイル**:
```
mabl-export/
├── original-mabl-test-001.json  # mabl原本（JSON）
├── original-mabl-test-002.json
└── ...
```

**確認項目**:
- セレクタ種類（XPath, CSS, ID, class）
- 認証フロー
- テストデータ依存関係
- テスト数

---

### Phase 1: mabl解析とコード生成

**担当エージェント**: `playwright-code-generator`（**mabl移行モード**）

**場所**: `../code-generation/playwright-code-generator.md`

**やること**:
1. mabl JSONを読み込み
2. mablステップを解析:
   - `visit` → `page.goto()`
   - `typeKeys` → `locator.fill()`
   - `click` → `locator.click()`
   - `assertElementVisible` → `expect(locator).toBeVisible()`
3. mablセレクタを役割ベースセレクタに変換:
   - `input#email` → `page.getByLabel('メールアドレス')`
   - `button[type='submit']` → `page.getByRole('button', { name: 'ログイン' })`
4. Page Object Model（POM）を設計
5. Playwrightコードを生成
6. ドキュメント生成:
   - `README.md`
   - `TEST_DETAILS.md`
   - `mabl-migration-report.md` - 移行レポート

**mabl移行レポート例**:
```markdown
# mabl→Playwright 移行レポート

## 移行元
- mablプランID: 12345
- mablテストID: test-001
- 元のファイル: mabl-export/original-mabl-test-001.json

## 移行内容
- 総ステップ数: 15
- 変換成功: 15
- 手動調整が必要: 0

## セレクタ変換
| mabl セレクタ | Playwright セレクタ | 変換方法 |
|--------------|---------------------|---------|
| `input#email` | `page.getByLabel('メールアドレス')` | 役割ベース変換 ✅ |
| `button[type='submit']` | `page.getByRole('button', { name: 'ログイン' })` | 役割ベース変換 ✅ |
| `div.dashboard` | `page.locator('.dashboard')` | 変換困難（CSS維持）⚠️ |
```

**成果物**:
```
src/{domain}/pages/
  └── LoginPage.ts

tests/{service}/
  └── login.spec.ts

mabl-export/
  └── original-mabl-test-001.json  # mabl原本

README.md
TEST_DETAILS.md
mabl-migration-report.md
```

---

### Phase 2: テスト実行

**担当**: オーケストレーター自身（test-creation-orchestratorと同じ）

```bash
npx playwright test tests/{service}/*.spec.ts
```

- ✅ **成功** → Phase 4へ
- ❌ **失敗** → Phase 3へ

---

### Phase 3: デバッグと修正

**担当エージェント**: `playwright-debug-fix-engine`

**場所**: `../code-generation/playwright-debug-fix-engine.md`

（test-creation-orchestratorと同じ動作）

最大3回まで修正試行 → 修正成功後はPhase 2へ戻る

---

### Phase 4: コード品質チェック（2段階レビュー + 優先度別修正）

**担当**:
- Phase 4-1: `playwright-code-quality-reviewer`（エージェント）
- Phase 4-2: `playwright-reviewer-v3.js`（ツール）
- Phase 4-3: 統合レビューと優先度別修正判断

（test-creation-orchestratorと同じ動作）

**優先度判定**:
- Critical/High問題: 必ず修正
- Medium/Low問題: 記録のみ（TEST_DETAILS.mdに記載）

**成功条件**: Critical/High問題が0件

**不合格時**: Phase 1へ差し戻し（最大3回まで）

---

### Phase 5: 移行完全性レビュー（優先度別判定）

**担当エージェント**: `playwright-spec-reviewer`（**mabl移行モード**）

**場所**: `../code-review/playwright-spec-reviewer.md`

---

#### Phase 5-1: 移行完全性レビュー実施

**やること**:
1. `mabl-export/original-mabl-test-{id}.json` から全ステップ・アサーションを抽出
2. Playwrightテストコードから実装済み内容を抽出
3. README.md / TEST_DETAILS.md の記載内容を検証
4. 移行完全性レポートを生成（各問題に重要度を付与）

**成果物**:
- `review-reports/{timestamp}_migration-completeness-review.md`
  - 移行漏れのリスト
  - 各漏れの重要度（Critical / High / Medium / Low）
  - 推奨修正内容

---

#### Phase 5-2: 優先度別修正判断

**優先度判定基準**:

| 優先度 | 条件 | 対応 |
|--------|------|------|
| **Critical** | 主要ステップの未移行、重要なアサーションの欠落 | **必ず修正** |
| **High** | 重要なステップの未移行、mabl原本との齟齬 | **必ず修正** |
| **Medium** | 補助的なステップの未移行、セレクタ変換の改善余地 | **記録のみ** |
| **Low** | マイナーなアサーション漏れ、ドキュメント記載漏れ | **記録のみ** |

**修正方針**:
1. **Critical/High問題**: Phase 1（mabl解析とコード生成）に差し戻し
2. **Medium/Low問題**: TEST_DETAILS.md / mabl-migration-report.mdに記載

**成功条件（Phase 6へ進む）**:
- Critical/High問題: 0件
- Medium/Low問題: 記録済み

**レビュー例（優先度別）**:
```markdown
## mabl移行完全性レビュー結果

### 総合スコア: 88% ⚠️

### 移行状況
- mabl原本ステップ数: 15
- 移行済みステップ数: 13
- mabl原本アサーション数: 8
- 移行済みアサーション数: 7
- セレクタ変換率: 80% (役割ベース化)

### 検出された移行漏れ（優先度別）

#### 🔄 必ず修正（Critical/High）
1. **High**: mablステップ12「ログアウト確認」が未移行
   → Phase 1に差し戻して実装

2. **High**: mablアサーション「エラーメッセージ表示確認」が未移行
   → Phase 1に差し戻して実装

#### 📝 記録のみ（Medium/Low - 修正しない）
1. **Medium**: セレクタ変換の改善余地（3箇所でCSSセレクタ残存）
   → TEST_DETAILS.mdに記載（アプリ側のaria-label不足のため）

2. **Low**: mablステップ「ページスクロール」の省略
   → mabl-migration-report.mdに記載（Playwright自動スクロール機能で代替）

→ Phase 1に差し戻して、High問題を修正します（1回目）
```

**不合格時**:
→ Phase 1（再生成）へ差し戻し（最大3回まで）

---

### Phase 6: ドキュメント最終確認と完了

**担当**: オーケストレーター自身

**総合レポート例**:
```markdown
# mabl移行完了レポート

## 移行元
- mablプランID: 12345
- テスト数: 10件

## 成果物
✅ Page Object: 5ファイル
✅ テストファイル: 10ファイル
✅ README.md
✅ TEST_DETAILS.md
✅ mabl-migration-report.md

## テスト実行結果
- 総テスト数: 10
- 成功: 10
- 失敗: 0

## コード品質
- playwright-reviewer-v3.js: 100%
- 移行完全性レビュー: 100%

## セレクタ変換統計
- 役割ベースセレクタ化: 85%
- CSS維持: 15%（変換困難な箇所）
```

---

## 📊 エージェント・ツール一覧

### コード生成・修正（code-generation/）

| エージェント | 役割 | 使用フェーズ |
|-------------|------|-------------|
| **playwright-code-generator** | テストコード生成（mabl移行 or 新規作成） | Phase 1 |
| **playwright-debug-fix-engine** | デバッグ・修正 | Phase 3（失敗時） |

### レビュー（code-review/）

| エージェント/ツール | 役割 | 使用フェーズ |
|-------------------|------|-------------|
| **playwright-reviewer-v3.js** | コード品質チェック（23項目） | Phase 4 |
| **playwright-spec-reviewer** | 仕様完全性レビュー（mabl移行 or 新規作成） | Phase 5 |

---

## 🎯 使用例

### テスト新規作成の場合

```
Task tool で test-creation-orchestrator エージェントを起動。

【タスク】
test-case-spec/original-spec.md に記載されたテストケースを、
Playwrightで実装し、全グリーン（成功）になるまで確認してください。

各フェーズの切り替え時に私に許可を求めず、ノンストップで実行してください。
```

### mabl移行の場合（プランID提供）

```
Task tool で mabl-migration-orchestrator エージェントを起動。

【タスク】
mablプランID: 12345 の全テストをPlaywrightに移行してください。

【要件】
- mabl APIでテスト一覧を取得
- 全グリーン（成功）になるまで確認
- 移行レポート作成

各フェーズの切り替え時に私に許可を求めず、ノンストップで実行してください。
```

### mabl移行の場合（既存エクスポート）

```
Task tool で mabl-migration-orchestrator エージェントを起動。

【タスク】
mabl-export/daily-mission.json を Playwright に移行し、
全グリーン（成功）になるまで確認してください。
```

---

## ⚙️ 自動実行の仕組み

### ノンストップ実行

両オーケストレーターは、以下のルールで**自律的に**動作します：

1. **Phase間の移動**: ユーザー許可不要で次のPhaseへ進む
2. **エラー検出時**: 自動的にデバッグエージェント起動（Phase 3）
3. **品質不合格時**: 自動的に再生成フェーズへ差し戻し（Phase 1）
4. **最大試行回数**: デバッグ3回、品質チェック3回、レビュー3回
5. **限界時**: ユーザーにエスカレーション

### エスカレーション条件

以下の場合、ユーザーに報告してプロセス停止:
- デバッグ3回で解決しない
- コード品質チェック3回で100%にならない
- 仕様完全性レビュー3回で100%にならない

---

## 📝 成果物の品質保証

両オーケストレーターが生成するテストは、以下の品質基準を満たします：

### ✅ コード品質（Phase 4で保証）
- CLAUDE.md完全準拠
- 役割ベースセレクタ優先
- test.step構造化
- expect配置の適切化
- ファイル末尾改行、LF改行コード

### ✅ 仕様完全性（Phase 5で保証）
- 原本（テストケース or mabl）の全確認事項を網羅
- README.md と TEST_DETAILS.md が詳細に記載
- 実装とドキュメントの一致

### ✅ 実行可能性（Phase 2で保証）
- 全テストがグリーン（成功）
- ヘッドレスモードでも動作
- CI/CD環境で実行可能

---

**🤖 Playwright E2E Test Automation Orchestrators v2.0**
