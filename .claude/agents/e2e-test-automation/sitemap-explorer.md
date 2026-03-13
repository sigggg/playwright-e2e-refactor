# サイトマップ探索エージェント

## 概要

Community v3のような複雑なSPAアプリケーションの全ページを自動探索し、e2e-spec-generatorで使用可能なページ一覧を生成する。

## 入力パラメータ

### 必須パラメータ
- `base_url`: アプリケーションのベースURL（例: `https://community-qa1.m3.com/v3/`）
- `output_file`: 出力先ファイルパス（例: `./community-v3-sitemap.json`）

### オプションパラメータ
- `login_required`: ログインが必要か（デフォルト: true）
- `max_depth`: 探索の最大深度（デフォルト: 3）
- `exclude_patterns`: 除外するURLパターン（配列、例: `["/api/", "/static/"]`）
- `include_patterns`: 含めるURLパターンのみ（配列、例: `["/v3/"]`）

---

## 実行フロー

### Phase 1: 初期ページアクセス

**処理**:
1. `playwright_navigate`: base_urlに遷移
2. ログイン処理（login_required=trueの場合）
3. `browser_snapshot`: ページ構造を取得

### Phase 2: ナビゲーション要素の抽出

**処理**:
1. ヘッダーメニューからリンクを抽出
2. サイドバーメニューからリンクを抽出
3. フッターからリンクを抽出
4. ページ内のすべての内部リンクを抽出

**Playwright Evaluate**:
```javascript
const links = Array.from(document.querySelectorAll('a[href]'))
  .map(a => ({
    href: a.href,
    text: a.textContent?.trim(),
    ariaLabel: a.getAttribute('aria-label'),
    location: a.closest('nav, aside, header, footer, main')?.tagName
  }))
  .filter(link => link.href.startsWith(window.location.origin))
```

### Phase 3: ページ分類とメタデータ収集

**処理**:
各発見されたURLについて:
1. URLパターンから機能を推定
   - `/v3/users/{id}` → ユーザープロフィール
   - `/v3/profile/edit` → プロフィール編集
   - `/v3/notifications` → 通知
2. ページタイトルを取得（`playwright_navigate` + `document.title`）
3. 主要な機能要素を検出（フォーム、ボタン、リスト等）
4. ページタイプを分類（一覧、詳細、フォーム、ダッシュボード等）

### Phase 4: サイトマップJSON生成

**出力**: `{output_file}`

```json
{
  "metadata": {
    "base_url": "https://community-qa1.m3.com/v3/",
    "explored_at": "2026-02-20T12:00:00Z",
    "total_pages": 15,
    "login_required": true
  },
  "pages": [
    {
      "url": "/v3/",
      "title": "タイムライン - Community v3",
      "page_type": "timeline",
      "priority": "high",
      "test_status": "completed",
      "navigation": {
        "menu_location": "header",
        "link_text": "ホーム"
      },
      "features": ["投稿一覧", "いいね", "コメント", "投稿作成"],
      "test_spec_file": "./test-specs/timeline-spec.md"
    },
    {
      "url": "/v3/users/{user-id}",
      "title": "ユーザープロフィール - Community v3",
      "page_type": "profile",
      "priority": "high",
      "test_status": "not_started",
      "navigation": {
        "menu_location": "sidebar",
        "link_text": "マイページ"
      },
      "features": ["プロフィール表示", "投稿一覧", "フォロー/フォロワー"],
      "test_spec_file": null,
      "notes": "user-idは動的パラメータ"
    },
    {
      "url": "/v3/profile/edit",
      "title": "プロフィール編集 - Community v3",
      "page_type": "form",
      "priority": "medium",
      "test_status": "not_started",
      "navigation": {
        "menu_location": "profile-menu",
        "link_text": "プロフィール編集"
      },
      "features": ["プロフィール編集フォーム", "画像アップロード"],
      "test_spec_file": null
    },
    {
      "url": "/v3/notifications",
      "title": "通知 - Community v3",
      "page_type": "list",
      "priority": "medium",
      "test_status": "not_started",
      "navigation": {
        "menu_location": "header",
        "link_text": "通知"
      },
      "features": ["通知一覧", "既読/未読管理"],
      "test_spec_file": null
    }
  ],
  "url_patterns": {
    "dynamic_routes": [
      {
        "pattern": "/v3/users/{user-id}",
        "example": "/v3/users/6218a9ed-e9b9-4f17-9034-d0a7a2921c70",
        "parameter": "user-id",
        "description": "ユーザープロフィールページ"
      },
      {
        "pattern": "/v3/comments/{post-id}",
        "example": "/v3/comments/abc123",
        "parameter": "post-id",
        "description": "投稿詳細ページ"
      }
    ]
  },
  "test_coverage": {
    "total_pages": 15,
    "tested_pages": 1,
    "coverage_percentage": 6.7
  }
}
```

---

## 使用例

### 1. サイトマップ生成
```bash
sitemap-explorer \
  --base_url="https://community-qa1.m3.com/v3/" \
  --output_file="./community-v3-sitemap.json" \
  --login_required=true
```

### 2. サイトマップからテスト仕様生成
```bash
# サイトマップJSONを読み込み
cat community-v3-sitemap.json | jq '.pages[] | select(.test_status == "not_started")'

# 各ページに対してe2e-spec-generatorを実行
for page in $(jq -r '.pages[] | select(.test_status == "not_started") | .url' community-v3-sitemap.json); do
  e2e-spec-generator \
    --target_url="https://community-qa1.m3.com${page}" \
    --feature_name="${page##*/}" \
    --output_dir="./test-specs/${page##*/}"
done
```

---

## e2e-spec-generatorとの連携

**統合フロー**:
1. `sitemap-explorer` → `community-v3-sitemap.json` 生成
2. サイトマップから未テストページを抽出
3. 各ページに対して `e2e-spec-generator` を実行
4. `test-creation-orchestrator` でテストコード生成
5. サイトマップの `test_status` を更新（"completed"）

**メリット**:
- ページ追加時の自動検出
- テストカバレッジの可視化
- 優先度に基づくテスト計画

---

**🤖 Sitemap Explorer v1.0**
**📅 Created: 2026-02-20**
