# wxo-js-sdk

IBM watsonx Orchestrate 用の純粋JavaScript製チャットUIライブラリ。
`<script>`タグ1つと設定数行で、任意のWebページにチャットUIを埋め込めます。

## 特徴

- **Pure JavaScript** - フレームワーク不要、`<script>`タグで動作
- **複数エージェント対応** - エージェントセレクタUIを内蔵
- **完全なチャットUI** - フローティングボタン・チャットウィンドウ・フィードバック機能を一括提供
- **ストリーミング応答** - リアルタイムでエージェントの返答を表示
- **Markdown対応** - エージェント応答をMarkdownレンダリング（オプション）

## クイックスタート

```html
<!-- Optional: Markdown rendering -->
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>

<!-- Load SDK -->
<script src="https://matsuo-iguazu.github.io/wxo-js-sdk/dist/wxo-sdk.min.js"></script>

<!-- Configure and initialize -->
<script>
  window.wxOConfiguration = {
    orchestrationID: 'YOUR_ORCHESTRATION_ID',
    hostURL: 'https://us-south.watson-orchestrate.cloud.ibm.com',
    region: 'us-south',
    deploymentPlatform: 'ibmcloud',
    crn: 'YOUR_CRN',
    agents: [
      {
        id: 'agent1',
        name: 'AIアシスタント',
        agentId: 'YOUR_AGENT_ID',
        agentEnvironmentId: 'YOUR_AGENT_ENVIRONMENT_ID'
      }
    ],
    features: {
      feedback: true,
      multiAgent: true
    }
  };

  wxoLoader.init().catch(console.error);
</script>
```

右下にチャットボタンが表示されます。それだけです。

## Garoon への埋め込み

Garoon の「カスタマイズ → JavaScript」に [examples/garoon-embed.js](examples/garoon-embed.js) を参考にしたスクリプトを登録するだけで動作します。ローカルサーバー・ビルドツール不要。

## 設定リファレンス

### 必須項目

| フィールド | 説明 |
|---|---|
| `orchestrationID` | IBM Cloud オーケストレーションID |
| `hostURL` | watsonx Orchestrate ホストURL |
| `crn` | IBM Cloud CRN |
| `agents` | エージェント設定配列（1件以上） |

### agents[] の各エージェント

| フィールド | 説明 |
|---|---|
| `id` | SDK内部で使うユニークな識別子（任意の文字列） |
| `name` | UI上に表示される名前 |
| `agentId` | IBM watsonx Orchestrate のエージェントUUID |
| `agentEnvironmentId` | IBM watsonx Orchestrate の環境UUID |
| `icon` | チャットウィンドウヘッダーに表示するアイコン（省略時: 💬） |

### オプション項目

| フィールド | デフォルト | 説明 |
|---|---|---|
| `region` | `'us-south'` | IBM Cloud リージョン |
| `deploymentPlatform` | `'ibmcloud'` | デプロイプラットフォーム |
| `features.feedback` | `true` | 👍👎フィードバックボタンの表示 |
| `features.multiAgent` | `true` | 複数エージェント機能の有効化 |
| `theme.primaryColor` | `'#0f62fe'` | フローティングボタンの色 |
| `debug` | `false` | コンソールデバッグログの出力 |

## ドキュメント

- [ARCHITECTURE.md](ARCHITECTURE.md) - 内部アーキテクチャ
- [docs/API_GUIDE.md](docs/API_GUIDE.md) - API詳細
- [docs/API_ENDPOINTS.md](docs/API_ENDPOINTS.md) - IBMエンドポイント仕様
- [docs/TESTING.md](docs/TESTING.md) - テスト方針

## 開発

```bash
npm install       # 依存関係インストール
npm run build     # dist/ にビルド
npm run serve     # ローカル確認用サーバー (http://localhost:8080)
```

変更をデプロイする場合:

```bash
npm run build
git add dist/ src/
git commit -m "描述"
git push
```

GitHub Pages に自動反映されます（数分かかる場合あり）。

## ライセンス

MIT
