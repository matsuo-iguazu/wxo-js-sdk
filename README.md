# wxo-js-sdk

IBM watsonx Orchestrate のチャット UI を任意の Web ページに埋め込む JavaScript ライブラリ。`<script>` タグ 1 つで導入でき、ビルドツール不要。

## CDN

```html
<script src="https://matsuo-iguazu.github.io/wxo-js-sdk/dist/wxo-sdk.min.js"></script>
```

Markdown レンダリングを有効にする場合は先に読み込む：

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
```

XSS 対策（推奨）として DOMPurify も合わせて読み込む：

```html
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
```

## 使い方

```html
<script src="https://matsuo-iguazu.github.io/wxo-js-sdk/dist/wxo-sdk.min.js"></script>
<script>
  window.wxOConfiguration = {
    orchestrationID: 'YOUR_ORCHESTRATION_ID',
    hostURL: 'https://us-south.watson-orchestrate.cloud.ibm.com',
    crn: 'YOUR_CRN',
    agents: [
      {
        id: 'agent1',
        name: 'AIアシスタント',
        agentId: 'YOUR_AGENT_ID',
        agentEnvironmentId: 'YOUR_AGENT_ENVIRONMENT_ID'
      }
    ]
  };
  wxoLoader.init();
</script>
```

ページ右下にフローティングボタンが表示され、クリックするとチャットウィンドウが開く。

## 主な機能

- ストリーミング応答（リアルタイム表示）
- Markdown レンダリング
- ウェルカム画面・クイックスタートプロンプト
- 複数エージェントの切り替え
- 👍👎 フィードバック（Webhook 送信対応）
- チャット履歴の保持（ウィンドウ最小化後も維持）
- Garoon などの既存ページへの埋め込み対応

## Garoon への埋め込み

[examples/garoon-embed.js](examples/garoon-embed.js) を参考にスクリプトを作成し、Garoon の「カスタマイズ → JavaScript」に登録するだけで動作する。

## 設定

設定の全フィールドは [docs/CONFIGURATION.md](docs/CONFIGURATION.md) を参照。

## 開発

```bash
npm install
npm run build    # dist/ へビルド
npm run serve    # http://localhost:8080 でローカル確認
```

変更後のデプロイ：

```bash
npm run build
git add dist/ src/
git commit -m "説明"
git push         # GitHub Pages に自動反映
```

## ライセンス

MIT
