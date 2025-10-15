MablからPlaywrightへのE2Eテストリファクタリングエージェントを起動します。

## 使い方

```bash
/refactor <Mablテストファイルパス>
```

例：
```bash
/refactor testcase/test-1.spec.ts
```

## 機能

refactor-agentが以下のステップを自律的に実行します：

### STEP 1: 現状確認・準備
- Mablテストファイルの分析
- サービス情報の収集
- 訪問ページの特定とHTML取得
- サービス仕様ファイルの作成

### STEP 2: Mablテスト簡易修正
- 段階的アプローチによる修正
- 動作確認と問題点の特定
- 元のMablテストの実行成功を確認

### STEP 3: 本格リファクタリング
- Page Object Modelパターンの適用
- 役割ベースセレクタへの変換
- テストケースの変換
- README.md作成

## 注意事項

- 各ステップでagentが作業者に確認・質問を行います
- HTML取得が必要な場合、Playwright MCPがあれば自動取得を試みます
- 問題発生時は作業者と協議しながら進めます
