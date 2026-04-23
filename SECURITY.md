# Security

## XSS 対策

### エージェント応答（HTML レンダリング）

エージェントの応答は Markdown としてレンダリングするため、`innerHTML` への挿入前に2段階の対策を行っている。

| 処理 | 実装 | 状態 |
|------|------|------|
| Markdown パース | `marked.parse()` | ✅ |
| XSS サニタイズ | `DOMPurify.sanitize()` | ✅ 対応済み |
| リンクの安全化 | `target="_blank" rel="noopener noreferrer"` | ✅ 対応済み |

DOMPurify はオプション（`typeof window.DOMPurify !== 'undefined'` で存在確認）だが、`garoon-embed.js` では CDN から必ず読み込む構成にしている。

### ユーザー入力

ユーザーが入力したテキストは `_escapeHtml()` で `<`, `>`, `&`, `"`, `'` をエスケープしてから DOM に挿入する。IBM watsonx Orchestrate API へはエスケープ前の原文を送信する。

| 処理 | 実装 | 状態 |
|------|------|------|
| 表示時エスケープ | `_escapeHtml()` | ✅ 対応済み |

### 設定値（wxOConfiguration）

`agent.icon` や `theme.primaryColor` は `innerHTML` / CSS テンプレートリテラルに直接埋め込まれるため、理論上は XSS・CSS インジェクションのリスクがある。ただし `wxOConfiguration` は埋め込みページの開発者が記述するものであり、外部から操作される経路はない。

| 設定フィールド | リスク | 状態 |
|--------------|--------|------|
| `agent.icon` | `innerHTML` 直接埋め込みによる XSS | ⚠️ 未対応（[#7](https://github.com/matsuo-iguazu/wxo-js-sdk/issues/7)） |
| `theme.primaryColor` | CSS テンプレートリテラル直接埋め込みによる CSS インジェクション | ⚠️ 未対応（[#8](https://github.com/matsuo-iguazu/wxo-js-sdk/issues/8)） |
