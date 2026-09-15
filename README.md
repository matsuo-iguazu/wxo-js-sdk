# wxo-js-sdk

IBM watsonx Orchestrate のチャット UI を任意の Web ページに埋め込む JavaScript ライブラリ。`<script>` タグ 1 つで導入でき、ビルドツール不要。

## 主な機能

- ストリーミング応答（リアルタイム表示）
- Markdown レンダリング
- ウェルカム画面・クイックスタートプロンプト
- 複数エージェントの選択・切り替え
- 👍👎 フィードバック（Webhook / Supabase 対応）
- 条項アシスト（契約書の条項を参照しながらエージェントと対話）
- エスカレーション通知（Teams Webhook 連携）
- 全応答の自動送信（Teams Webhook 連携）
- チャット履歴の保持（ウィンドウ最小化後も維持）
- Garoon などの既存ページへの埋め込み対応

## CDN

```html
<script src="https://matsuo-iguazu.github.io/wxo-js-sdk/dist/wxo-sdk.min.js"></script>
```

Markdown レンダリングと XSS 対策のため、以下も合わせて読み込むことを推奨する：

```html
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js"></script>
```

## Garoon への埋め込み

[examples/garoon-embed.js](examples/garoon-embed.js) をベースに設定ファイルを作成し、Garoon の「カスタマイズ → JavaScript」に登録する。

## 設定

`orchestrationID` と `hostURL` は wxO コンソールの「埋め込み」設定画面から取得した値をそのまま使用する。SDK は `orchestrationID` の形式から接続先（IBM Cloud / AWS）を自動判別する。

```js
window.wxOConfiguration = {
  orchestrationID: 'YOUR_ORCHESTRATION_ID',
  hostURL: 'https://api.REGION.dl.watson-orchestrate.ibm.com',
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
```

### エージェント設定

各エージェントに設定できるフィールド：

| フィールド | 必須 | 説明 |
|---|---|---|
| `id` | ✅ | SDK 内部で使う ID（任意の文字列） |
| `name` | ✅ | チャット画面に表示される名称 |
| `agentId` | ✅ | wxO コンソールのエージェント ID |
| `agentEnvironmentId` | 推奨 | wxO コンソールの環境 ID（Live 環境では必須） |
| `icon` | | エージェントアイコン（絵文字） |
| `escalationWebhookUrl` | | エスカレーション通知先 Teams Webhook URL |
| `escalationTriggerPhrases` | | 通知トリガーとなるフレーズの配列 |
| `allSendWebhookUrl` | | 全応答の自動送信先 Teams Webhook URL |
| `clauseAssistData` | | 条項アシスト用の契約書データ |
| `clauseAssistAutoOpen` | | 条項アシストを起動時に自動展開（デフォルト: `true`） |

### フィードバック機能

フィードバックの保存先は Webhook または Supabase から選択する。

```js
window.wxOConfiguration = {
  // ...
  feedbackWebhookUrl: 'https://YOUR_WEBHOOK_URL',    // Webhook 送信先 URL
  // または Supabase:
  // supabaseUrl: 'https://xxxx.supabase.co',
  // supabaseAnonKey: 'YOUR_ANON_KEY',
  feedbackUserInfo: garoon.base.user.getLoginUser(),  // ペイロードに含めるユーザー情報
  feedbackOptions: {
    positive: { showDetails: false },
    negative: {
      showDetails: true,
      disclaimer: 'フィードバックに機密情報や個人を特定できる情報を含めないようにしてください'
    }
  }
};
```

## 注意事項

- `feedbackWebhookUrl`・`supabaseAnonKey` などの資格情報を含む設定ファイルは、公開リポジトリにはコミットしないこと。
- エスカレーション通知・全応答自動送信は、エージェントごとに `escalationWebhookUrl` / `allSendWebhookUrl` を設定した場合のみ有効になる。未設定のエージェントには影響しない。

## 開発

```bash
npm install
npm run build    # dist/ へビルド
npm run serve    # http://localhost:8080 でローカル確認
```

ビルド後は [examples/basic-example.template.html](examples/basic-example.template.html) に実際の値を入力してブラウザで動作確認できる。

変更後のデプロイ：

```bash
npm run build
git add dist/ src/
git commit -m "説明"
git push         # GitHub Pages に自動反映
```

全設定フィールドの詳細は [docs/CONFIGURATION.md](docs/CONFIGURATION.md) を参照。

## ライセンス

MIT
