# Configuration Reference

`window.wxOConfiguration` に渡すオブジェクトの全フィールドを記述する。

## トップレベル

| フィールド | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `orchestrationID` | ✓ | — | IBM Cloud オーケストレーションID |
| `hostURL` | ✓ | — | watsonx Orchestrate ホストURL |
| `crn` | ✓ | — | IBM Cloud CRN |
| `agents` | ✓ | — | エージェント設定配列（1件以上） |
| `region` | | `'us-south'` | IBM Cloud リージョン |
| `deploymentPlatform` | | `'ibmcloud'` | デプロイプラットフォーム |
| `feedbackWebhookUrl` | | — | フィードバック送信先 Webhook URL |
| `feedbackUserInfo` | | — | フィードバックペイロードに付加するユーザー情報オブジェクト |
| `feedbackOptions` | | — | フィードバックUIの詳細設定（後述） |
| `features` | | — | 機能フラグ（後述） |
| `theme` | | — | テーマ設定（後述） |
| `debug` | | `false` | コンソールデバッグログの出力 |

## agents[]

| フィールド | 必須 | 説明 |
|---|---|---|
| `id` | ✓ | SDK内部で使うユニークな識別子 |
| `name` | ✓ | UI上に表示される名前 |
| `agentId` | ✓ | IBM watsonx Orchestrate のエージェントUUID |
| `agentEnvironmentId` | ✓ | IBM watsonx Orchestrate の環境UUID |
| `icon` | | チャットウィンドウヘッダーに表示するアイコン（省略時: 💬） |
| `welcomeMessage` | | API取得失敗時のフォールバック用ウェルカムメッセージ |
| `welcomeSubtitle` | | API取得失敗時のフォールバック用サブテキスト |
| `quickStartPrompts` | | API取得失敗時のフォールバック用クイックスタートプロンプト（文字列配列） |

ウェルカムメッセージ・クイックスタートプロンプトは通常 IBM watsonx Orchestrate のエージェント設定（YAML）から自動取得される。`welcomeMessage` 等はその取得に失敗した場合のフォールバックとして機能する。

## features

| フィールド | デフォルト | 説明 |
|---|---|---|
| `feedback` | `true` | 👍👎フィードバックボタンの表示 |
| `multiAgent` | `true` | 複数エージェント機能の有効化 |

## theme

| フィールド | デフォルト | 説明 |
|---|---|---|
| `primaryColor` | `'#0f62fe'` | フローティングボタン・アクセントカラー |

## feedbackOptions

`positive` / `negative` それぞれに設定する。

| フィールド | デフォルト | 説明 |
|---|---|---|
| `showDetails` | `false` | `true` にするとカテゴリ選択・コメント入力パネルを表示 |
| `categories` | `[]` | 選択肢として表示するカテゴリ文字列配列 |
| `disclaimer` | `''` | パネル下部に表示する免責テキスト |

### feedbackUserInfo

`feedbackWebhookUrl` に送信するペイロードにフラットに展開されるオブジェクト。DB2 Code Engine スキーマと一致させる形で設定する。

```javascript
feedbackUserInfo: {
  id: 123,
  garoonId: 'user001',
  name: '山田 太郎'
}
```

## 設定例（フル）

```javascript
window.wxOConfiguration = {
  orchestrationID: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  hostURL: 'https://us-south.watson-orchestrate.cloud.ibm.com',
  region: 'us-south',
  deploymentPlatform: 'ibmcloud',
  crn: 'crn:v1:bluemix:...',
  agents: [
    {
      id: 'agent1',
      name: 'AIアシスタント',
      icon: '🤖',
      agentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      agentEnvironmentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    }
  ],
  feedbackWebhookUrl: 'https://your-webhook.example.com/',
  feedbackUserInfo: { id: 1, name: 'ユーザー名' },
  feedbackOptions: {
    positive: { showDetails: false },
    negative: {
      showDetails: true,
      categories: ['正しくない', '未完了', 'その他'],
      disclaimer: 'フィードバックは改善目的のみに使用されます。'
    }
  },
  features: {
    feedback: true,
    multiAgent: false
  },
  theme: {
    primaryColor: '#0f62fe'
  },
  debug: false
};
```
