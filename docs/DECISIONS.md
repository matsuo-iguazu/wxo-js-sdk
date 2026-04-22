# 設計判断の記録

実装において選択肢があった場合の判断根拠を記録する。

---

## [2026-04-22] リンクの `target="_blank"` 付与方法

### 背景

エージェントの応答に含まれる URL を別タブで開くために、`marked.parse()` が生成する `<a>` タグに
`target="_blank" rel="noopener noreferrer"` を付与する必要があった。

### 選択肢

#### ① DOM ポストプロセス（採用）

```javascript
_parseMarkdown(text) {
  let html = window.marked.parse(text);
  if (typeof window.DOMPurify !== 'undefined') {
    html = window.DOMPurify.sanitize(html);
  }
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.querySelectorAll('a').forEach(a => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
  return tmp.innerHTML;
}
```

- HTML を一度 DOM に parse し、全 `<a>` 要素を走査して属性を追加してから返す。
- marked のバージョンに依存しない（v4/v5/v6 すべてで動作）。
- DOMPurify のサニタイズ後に実行するため、XSS 対策と組み合わせやすい。

#### ② marked Renderer API

```javascript
const renderer = new marked.Renderer();
renderer.link = function (href, title, text) {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
};
marked.setOptions({ renderer });
```

- marked の公式 API を使った、意味的により正しい方法。
- marked v4 以前と v5 以降でシグネチャが異なるため、CDN バージョン固定が必要になる。
- グローバルな `marked.setOptions` を使うと他ライブラリへの副作用リスクがある（`new Renderer()` + `marked.parse(text, { renderer })` のインスタンス渡し形式なら回避可能）。

### 判断

**① DOM ポストプロセスを採用。**

理由：

- このプロジェクトは CDN 経由で任意のページに読み込む Drop-in ライブラリ。marked のバージョンを固定できない環境での安定性を優先した。
- DOMPurify の sanitize 後に処理するため、XSS サニタイズ → target付与 の順序が明確に保たれる。
- `marked.setOptions` のグローバル汚染を避けられる。

将来的に marked バージョンを固定できる環境（npm install + bundler）に移行する場合は ② Renderer API への切り替えを検討する。
