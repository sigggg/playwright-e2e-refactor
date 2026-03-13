# Playwright E2E Test Automation Agents

Playwright E2Eテストの作成・移行・品質検証を自動化する専門エージェント集です。

## 📁 フォルダ構成（役割別）

```
agents/
├── orchestrators/          # エントリーポイント（ユーザーが最初に呼び出す）
│   ├── test-creation-orchestrator.md       # テスト新規作成の全体制御
│   └── mabl-migration-orchestrator.md      # mabl移行の全体制御
│
├── code-generation/        # コード生成・修正
│   ├── playwright-code-generator.md        # テストコード生成（mabl変換 or 仕様書から作成）
│   └── playwright-debug-fix-engine.md      # デバッグ・修正
│
├── code-review/            # 品質検証
│   ├── playwright-code-quality-reviewer.md # コード品質レビュー（技術的品質）
│   └── playwright-spec-reviewer.md         # 仕様完全性レビュー（実装漏れ検出）
│
└── knowledge/              # ナレッジベース
    └── playwright_knowledge_base.md        # Playwrightベストプラクティス
```

---

## 🚀 クイックスタート

### テスト新規作成の場合

```
Task tool で test-creation-orchestrator エージェントを起動。

【タスク】
test-case-spec/original-spec.md に記載されたテストケースを、
Playwrightで実装し、全グリーン（成功）になるまで確認してください。
```

### mabl移行の場合

```
Task tool で mabl-migration-orchestrator エージェントを起動。

【タスク】
mabl-export/daily-mission.json を Playwright に移行し、
全グリーン（成功）になるまで確認してください。
```

---

## 📝 変更履歴

| 日付 | バージョン | 変更内容 |
|------|-----------|---------|
| 2026-02-12 | 2.0.0 | フォルダ構成をシンプル3分類に変更（orchestrators/code-generation/code-review） |
| 2026-02-12 | 2.0.0 | エージェント統合（mabl-migration-core + test-case-to-playwright → playwright-code-generator） |
| 2026-02-12 | 2.0.0 | エージェント統合（2つのreview-specialized → playwright-spec-reviewer） |

---

**🤖 Playwright E2E Test Automation Ecosystem v2.0**
