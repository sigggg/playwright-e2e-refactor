# Commit Review: CLAUDE.md準拠チェック

あなたはコードレビューの専門家です。指定されたGitリポジトリの特定のコミットが、CLAUDE.mdのコーディング規約に準拠しているかをチェックしてください。

## 📋 入力形式

ユーザーから以下の形式で情報を受け取ります：

```
/review-commit <リポジトリURL> <Commit ID>
```

**例**:
```
/review-commit https://github.com/user/repo.git abc123def456
```

---

## 🔍 レビュー手順

### Step 1: リポジトリのクローンと差分取得

```bash
# 一時ディレクトリ作成
mkdir -p tmp/review
cd tmp/review

# リポジトリをクローン（shallow clone）
git clone --depth=50 <リポジトリURL> repo
cd repo

# コミット情報を表示
git show <commit-id> --stat

# 変更されたファイル一覧を取得
git diff-tree --no-commit-id --name-only -r <commit-id>

# 詳細な差分を取得
git show <commit-id> > ../commit-diff.txt
```

### Step 2: 変更ファイルの読み取り

**対象ファイルのフィルタリング**:
- `.ts` (Page Objectファイル)
- `.spec.ts` (テストシナリオファイル)

上記以外のファイル（`.js`, `.html`, `.md`等）は**レビュー対象外**とします。

```bash
# 変更ファイル一覧を取得（.tsと.spec.tsのみ）
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r <commit-id> | grep -E '\.(spec\.)?ts$')

# 対象ファイルがない場合
if [ -z "$CHANGED_FILES" ]; then
  echo "⚠️ レビュー対象ファイル（.ts, .spec.ts）が見つかりません"
  exit 0
fi

# 各ファイルを読み取る
for file in $CHANGED_FILES; do
  echo "=== $file ==="
  cat "$file"
done
```

### Step 3: CLAUDE.md準拠チェック

**レビュー観点の詳細は以下のファイルを参照してください**：

📋 **`.claude/guidelines/review-checklist.md`**

このファイルには以下のチェック項目が定義されています：

1. **日本語コメント・JSDoc**
2. **役割ベースセレクタの使用**（Playwright関連）
3. **Page Object Modelパターン**
4. **TypeScript型定義**
5. **エラーハンドリング**
6. **セキュリティチェック**
7. **アクセシビリティ対応**（HTML関連）
8. **リファクタリング原則**
9. **命名規則**

各チェック項目には、具体例・準拠率の計算方法・評価基準が記載されています

---

## 📊 レポート形式

以下の形式でレポートを生成してください：

```markdown
# コード規約準拠チェックレポート

**リポジトリ**: <リポジトリURL>
**Commit ID**: <commit-id>
**コミットメッセージ**: <メッセージ>
**変更ファイル数**: X件

---

## 📊 チェック結果サマリー

| 項目 | ステータス | 準拠率 |
|------|-----------|--------|
| 日本語コメント・JSDoc | ✅ / ⚠️ / ❌ | XX% |
| 役割ベースセレクタ | ✅ / ⚠️ / ❌ | XX% |
| Page Object Model | ✅ / ⚠️ / ❌ | XX% |
| TypeScript型定義 | ✅ / ⚠️ / ❌ | XX% |
| エラーハンドリング | ✅ / ⚠️ / ❌ | XX% |
| セキュリティ | ✅ / ⚠️ / ❌ | XX% |
| アクセシビリティ | ✅ / ⚠️ / ❌ | XX% |
| リファクタリング原則 | ✅ / ⚠️ / ❌ | XX% |

**総合評価**: ✅ 準拠 / ⚠️ 部分準拠 / ❌ 要修正

---

## ✅ 準拠している点

### ファイル名: `path/to/file.ts`

1. **行番号**: 良い実装内容
   ```typescript
   // コード例
   ```

---

## ⚠️ 改善推奨

### ファイル名: `path/to/file.ts`

1. **行番号**: 問題の説明
   ```typescript
   // 問題のあるコード
   ```

   **推奨修正**:
   ```typescript
   // 修正後のコード
   ```

---

## ❌ 規約違反（要修正）

### ファイル名: `path/to/file.ts`

1. **行番号**: 重大な問題
   ```typescript
   // 問題のあるコード
   ```

   **修正必須**:
   ```typescript
   // 修正後のコード
   ```

---

## 💡 追加提案

- さらに改善できるポイント
- ベストプラクティスの提案

---

## 📝 次のアクション

### 🔴 高優先度（すぐに対応）
1. 項目1
2. 項目2

### 🟡 中優先度（計画的に対応）
1. 項目1
2. 項目2

### 🟢 低優先度（余裕があれば対応）
1. 項目1
2. 項目2
```

---

## 🧹 クリーンアップ

レビュー完了後、必ず一時ディレクトリを削除すること：

```bash
cd ../../..
rm -rf tmp/review
```

---

## ⚠️ 注意事項

### 対象ファイル

以下の拡張子のファイル**のみ**をチェック対象とします：
- `.ts` (Page Objectファイル)
- `.spec.ts` (テストシナリオファイル)

## 使用例

```
/review-commit https://github.com/user/playwright-e2e-refactor.git abc123def456
```

このコマンドを実行すると：
1. リポジトリをクローン
2. 指定コミットの差分を取得
3. CLAUDE.mdのコーディング規約に基づいてチェック
4. 詳細なレポートを生成
5. 一時ファイルをクリーンアップ
