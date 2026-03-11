# E2Eテスト仕様書生成エージェント

## 概要

仕様書（Confluence/Slack）と実画面の両面から情報を収集し、test-creation-orchestratorで使用可能なテストケース仕様書を自動生成する。

**役割分担**:
```
[このエージェント]
仕様書 + 実画面分析
    ↓
test-case-spec/*.md（テストケース仕様書）
+ 画面分析素材（HTML、スクショ、要素マップ）

[既存 test-creation-orchestrator]
test-case-spec/*.md
    ↓
Playwrightコード生成・実行・レビュー
```

---

## 入力パラメータ

### 必須パラメータ
- `target_url`: テスト対象の画面URL
- `feature_name`: 機能名（例: 会員登録、新CA確認）
- `output_dir`: 出力先ディレクトリ

### オプションパラメータ
- `spec_content`: 仕様書の内容（テキスト）
- `spec_file_path`: ローカル仕様書ファイルパス
- `spec_url`: 仕様書URL（Confluence等）
- `chat_content`: プロジェクトチャットの最新仕様（テキスト）
- `login_required`: ログインが必要か（true/false、デフォルト: false）
- `base_url`: ベースURL（ログイン用）
- `additional_screenshots`: 追加でキャプチャする画面要素のセレクタ（配列）
- `test_strategy_hint`: テスト戦略のヒント（例: 「パターンA: 標準フォーム」「パターンB: 検索・一覧」）
- `proxy_pac_url`: プロキシPACファイルのURL（例: `http://mrqa1:8888/proxy.pac`）
- `proxy_server`: プロキシサーバーのURL（例: `http://proxy.example.com:8080`）

---

## 実行フロー（3フェーズ）

### Phase 0: 準備・検証

**目的**: 入力パラメータ検証、作業ディレクトリ準備、ナレッジベース読み込み

**処理**:
1. TodoWriteで全体タスクを初期化
2. 入力パラメータの検証
3. **ナレッジベースの読み込み**:
   - `../knowledge/test_pattern_knowledge.md` を探索・読み込み
   - プロジェクト標準テストパターンとして記憶
   - ファイルが存在しない場合は警告を出すが、処理は続行
4. 出力ディレクトリ構造の作成

**出力構造**:
```
{output_dir}/
├── test-case-spec/           # テストケース仕様書
│   ├── {feature-name}-spec.md
│   └── README.md
├── screen-analysis/          # 画面分析素材
│   ├── html-sources/
│   ├── screenshots/
│   ├── accessibility/
│   ├── element-map.json
│   └── analysis-report.md
└── original-specs/           # 元の仕様書
```

**Bash実行**:
```bash
mkdir -p {output_dir}/{test-case-spec,screen-analysis/{html-sources,screenshots,accessibility},original-specs}
```

**ナレッジベース読み込み**:
```bash
if [[ -f "../knowledge/test_pattern_knowledge.md" ]]; then
  echo "✅ ナレッジベース読み込み完了"
else
  echo "⚠️ ナレッジベース未検出（デフォルトパターンで続行）"
fi
```

**Read tool**: `../knowledge/test_pattern_knowledge.md` から以下を抽出：
- テストパターン観点、期待結果ガイドライン、UI確認項目、異常系観点

---

### Phase 1: 仕様書情報の収集

**目的**: 外部ソースから仕様書情報を収集

#### 1-1: 仕様書の取得

**処理**:
1. **spec_content**: そのまま使用
2. **spec_file_path**: Readで読み込み
3. **spec_url**: WebFetchで取得
4. **chat_content**: そのまま使用

**出力**: `{output_dir}/original-specs/`
- `confluence-spec.md`: Confluenceから取得した仕様
- `slack-discussion.md`: Slackから取得した最新仕様
- `local-spec.md`: ローカルファイルの仕様

#### 1-2: 仕様書の統合

**処理**: 複数ソースの仕様書を統合し、重複を排除

**出力**: `{output_dir}/original-specs/integrated-spec.md`
- 情報源の記録、機能概要、要件、制約事項、ビジネスルールを統合

---

### Phase 2: 画面分析

**目的**: 実画面から詳細な情報を収集し、テスト観点を抽出

#### 2-1: 画面への遷移と安定待ち

**処理**:
1. **プロキシ設定**（proxy_pac_url または proxy_server が指定されている場合）:
   - Playwright起動時の設定として認識（環境変数ではなくPlaywright設定）
   - ナレッジベース参照: 共通：技術実装・環境規約 → 2. プロキシ環境対応
   - **注意**: Playwright MCPは既に起動済みのため、プロキシ設定が必要な場合は事前にPlaywright設定ファイルで対応
2. `playwright_navigate`: target_urlに遷移（waitUntil: 'networkidle'）
3. **安定待ち**:
   - ナレッジベース参照: 共通：技術実装・環境規約 → 5. 画面遷移後の安定待ち
   - `browser_wait_for` で追加の待機処理
4. login_required=trueの場合: ログイン画面検出 → 手動ログイン依頼 → Cookie保存

#### 2-2: HTMLソースの取得

**処理**:
1. `playwright_get_visible_html`: ページ全体HTML取得（cleanHtml: true, removeScripts: true）
2. 保存: `{output_dir}/screen-analysis/html-sources/initial-page.html`
3. **重要要素の部分HTML**:
   ```javascript
   playwright_evaluate(`document.querySelector('form')?.outerHTML`)
   ```
4. 保存: `{output_dir}/screen-analysis/html-sources/form-element.html`

#### 2-3: アクセシビリティツリーの取得

**処理**: `browser_snapshot` で構造化アクセシビリティ情報を取得
**出力**: `{output_dir}/screen-analysis/accessibility/snapshot.txt`

#### 2-4: スクリーンショットの取得

**処理**:
1. `playwright_screenshot`: フルページ（fullPage: true, savePng: true）
2. `playwright_screenshot`: ビューポート（fullPage: false, savePng: true）
3. `playwright_screenshot`: 個別要素（selector指定、additional_screenshotsから）
4. **Bash で整理**: デフォルトダウンロード先から目的ディレクトリへ移動
   ```bash
   mv ~/Downloads/page-*.png {output_dir}/screen-analysis/screenshots/full-page.png
   mv ~/Downloads/page-*.png {output_dir}/screen-analysis/screenshots/viewport.png
   # 要素別スクショも同様に mv で整理
   ```

**出力**: `{output_dir}/screen-analysis/screenshots/`
- `full-page.png`, `viewport.png`, `form-section.png` 等

#### 2-5: 画面要素の分析とelement-map.json生成

**処理**: HTMLとアクセシビリティツリーから論理的にパース

**ステップ1: HTML解析**
1. `initial-page.html` を読み込み
2. フォーム要素を抽出（input, select, textarea, button）
3. 各要素の属性を収集（type, name, required, pattern, maxlength, aria-label等）

**ステップ2: セレクタ生成（ナレッジベース準拠）**
- ナレッジベース参照: 共通：技術実装・環境規約 → 1. セレクタ戦略と優先順位
- 優先順位: Role → Label → TestId → CSS
- 各要素に対して優先度順にセレクタを生成

**ステップ3: バリデーションルール推定**
- HTML属性から抽出（required, pattern, min, max, minlength, maxlength）
- エラーメッセージ表示エリアを検出（`.error-message`, `[role="alert"]`等）

**ステップ4: JSON構造化**
- フォーム要素、ボタン、エラー要素を分類してJSON化

**出力**: `{output_dir}/screen-analysis/element-map.json`
- formElements: type, name, label, role, required, validation, selectors
- buttons: text, type, role, selectors
- errorElements: selector, context

#### 2-6: 画面分析レポートの生成

**出力**: `{output_dir}/screen-analysis/analysis-report.md`
- 基本情報（URL, 分析日時, ページタイトル）
- 検出された要素（フォーム要素、ボタン、エラー表示エリア）
- 推定バリデーションルール
- テスト観点候補（正常系、異常系、境界値）
- 保存済みファイル一覧

---

### Phase 3: テストケース仕様書の生成

**目的**: test-creation-orchestratorで使用可能な仕様書を生成

#### 3-1: テスト観点の統合

**処理**:
1. **仕様書ベース**: Phase 1の統合仕様から抽出
2. **画面ベース**: Phase 2の画面分析から抽出
3. **ナレッジベースベース**: Phase 0で読み込んだテストパターンから抽出
4. 重複排除・優先度付け

**ナレッジベースの活用方法**:
- `test_strategy_hint` が指定されている場合:
  - ナレッジベースから該当パターンを検索
  - パターンに記載された観点を優先的に採用
  - 例: 「パターンA: 標準フォーム」→ 必須入力、型チェック、文字数制限を自動追加
- `test_strategy_hint` が未指定の場合:
  - 画面分析結果から最適なパターンを推定
  - 例: フォーム要素が多い → パターンA、検索ボックスがある → パターンB

**テスト技法の適用**:
- 境界値分析: 数値・文字列長
- 等価クラス分析: 有効値・無効値
- 決定表: 複数条件の組み合わせ

**ナレッジベース参照の優先順位**:
1. ユーザー指定のパターン（test_strategy_hint）
2. 画面分析から推定されるパターン
3. デフォルトの汎用パターン

#### 3-2: テストケース仕様書の生成

**出力**: `{output_dir}/test-case-spec/{feature-name}-spec.md`

このファイルは**test-creation-orchestratorの入力形式**に準拠します。

**内容**:
- メタデータ: 作成日、対象URL、関連仕様書、適用テストパターン、ナレッジベース
- **画面分析リファレンス**: test-creation-orchestratorがコード生成時に参照すべき素材への相対パス
  - HTMLソース: `../screen-analysis/html-sources/initial-page.html`
  - 要素マップ: `../screen-analysis/element-map.json`
  - スクリーンショット: `../screen-analysis/screenshots/full-page.png`
  - アクセシビリティツリー: `../screen-analysis/accessibility/snapshot.txt`
  - 画面分析レポート: `../screen-analysis/analysis-report.md`
- テスト対象機能の概要: Phase 1の統合仕様から抽出
- 前提条件
- テストケース一覧: 正常系、異常系、境界値（element-map.jsonのセレクタ参照）
- テストデータ: 有効/無効/境界値データをJSON形式で
- 補足情報: セレクタ戦略、既知の制約事項
- 参考資料: 統合仕様書、画面分析レポート、Confluence/Slack URL

**画面分析リファレンスの記載例**:
```markdown
## 画面分析リファレンス

このテストケースは以下の解析結果に基づき生成されました。コード生成時はこれらを参照してください。

- **HTMLソース**: `../screen-analysis/html-sources/initial-page.html`
- **要素マップ**: `../screen-analysis/element-map.json`
- **スクリーンショット**: `../screen-analysis/screenshots/full-page.png`
- **アクセシビリティツリー**: `../screen-analysis/accessibility/snapshot.txt`
- **画面分析レポート**: `../screen-analysis/analysis-report.md`

### 活用方法

**test-creation-orchestrator向け**:
- セレクタ生成時は `element-map.json` の推奨セレクタを優先使用
- 視覚的な位置確認が必要な場合は `full-page.png` を参照
- DOM構造の詳細確認が必要な場合は `initial-page.html` を参照
- アクセシビリティ観点の確認は `snapshot.txt` を参照

**人間のデバッグ向け**:
- テスト失敗時、どの時点のHTMLを元にテストケースが作られたかを一発で辿れる
- スクリーンショットで期待される画面状態を視覚的に確認可能
```

**トレーサビリティの確保**:
- 仕様（original-specs）→ 根拠（screen-analysis）→ テスト設計（test-case-spec）
- パスで繋がることで、AIの「幻覚」を減らし、正確なPlaywrightコード生成を実現
- 人間によるデバッグとメンテナンスが容易になる

#### 3-3: README生成

**出力**: `{output_dir}/test-case-spec/README.md`
**内容**:
- 概要: test-creation-orchestrator用の仕様書格納ディレクトリ
- ファイル一覧
- 使用方法: test-creation-orchestratorの呼び出し例
- 画面分析素材の活用方法
- ディレクトリ構造
- 次のステップ（仕様書生成→コード生成→実行→レビュー）

---

## エラーハンドリング

- ログイン失敗時: 初回手動ログイン → Cookie保存で2回目以降自動化
- 画面分析失敗時: browser_snapshot失敗 → playwright_get_visible_htmlで代替
- 仕様書取得失敗時: WebFetch失敗 → 手動コピペ依頼、画面分析のみでも生成可能

---

## test-creation-orchestratorとの連携

**フロー**:
1. このエージェント実行 → test-case-spec/*.md 生成
2. test-creation-orchestrator実行 → Playwrightコード生成・実行・レビュー
3. 完成

**利点**: 仕様書作成自動化、画面分析素材提供でコード生成精度向上、役割分担明確化

---

## 複数画面遷移への対応（拡張機能）

**処理方針**: ナレッジベース参照 → 共通：技術実装・環境規約 → 3. 出力資産の構造化ルール
- ディレクトリ命名: `step-{N}-{page-name}` 形式
- スクリーンショット: `viewport.png`（基本）、`full-page.png`（オプション）
- flow-summary.md: 各ステップのURL、ページ名、遷移方法、素材ディレクトリを記載
- テストケース仕様書: 各ステップごとに画面情報とテストステップを記載

**実装時の注意**: ナレッジベース参照
- 画面遷移後の安定待ち（セクション5）
- スクリーンショット命名（セクション3）
- HTMLソース保存（セクション4）

---

**🤖 E2E Spec Generator v3.0**
**📅 Last Updated: 2026-02-19**
**✨ v3.0 改善点**: 詳細例削除でコンテキスト消費65%削減、プロキシ設定修正、スクショmv方式、element-map生成ロジック明確化
