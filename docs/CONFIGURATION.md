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
| `feedbackWebhookUrl` | | — | フィードバック送信先 Webhook URL（レガシー） |
| `supabaseUrl` | | — | Supabase プロジェクト URL（設定時はフィードバックを Supabase に送信） |
| `supabaseAnonKey` | | — | Supabase anon key |
| `supabaseTable` | | `'wxo_log'` | Supabase テーブル名 |
| `feedbackUserInfo` | | — | フィードバックペイロードに付加するユーザー情報オブジェクト |
| `feedbackOptions` | | — | フィードバックUIの詳細設定（後述） |
| `defaultLocale` | | — | ウェルカム画面・スタータープロンプトのロケール（例: `'ja'`）。省略時はブラウザ言語 |
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
| `clauseAssistData` | | 条項アシストパネル用データ（`window.wxoContractDataCustomer` 等） |
| `clauseAssistAutoOpen` | | 条項アシストパネルを起動時に自動表示（省略時: `true`） |
| `escalationWebhookUrl` | | 法務通知先 Teams Incoming Webhook URL（設定時のみ通知ボタン表示） |
| `escalationTriggerPhrases` | | 通知ボタン表示のトリガーフレーズ配列 |
| `escalationAutoSend` | | `true` にすると全応答をバックグラウンドで自動送信（省略時: `false`） |

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
      id: 'legal-agent',
      name: '法務AIエージェント',
      icon: '⚖️',
      agentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      agentEnvironmentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      // 条項アシスト（任意）
      clauseAssistData: window.wxoContractDataCustomer,
      clauseAssistAutoOpen: true,
      // 法務エスカレーション通知（任意）
      escalationWebhookUrl: 'https://prod-xx.westus.logic.azure.com/...',
      escalationTriggerPhrases: ['回答に必要な情報が見つかりません。法務担当に質問してください'],
      escalationAutoSend: true
    },
    {
      id: 'general-agent',
      name: 'AIアシスタント',
      icon: '🤖',
      agentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      agentEnvironmentId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
      // escalation設定なし → 通知ボタン非表示
    }
  ],
  // フィードバック送信先（Supabase 推奨）
  supabaseUrl: 'https://xxxx.supabase.co',
  supabaseAnonKey: 'eyJ...',
  feedbackUserInfo: { id: 1, name: 'ユーザー名' },
  feedbackOptions: {
    positive: { showDetails: false },
    negative: {
      showDetails: true,
      categories: ['正しくない', '未完了', 'その他'],
      disclaimer: 'フィードバックは改善目的のみに使用されます。'
    }
  },
  defaultLocale: 'ja',
  features: {
    feedback: true,
    multiAgent: true
  },
  theme: {
    primaryColor: '#0f62fe'
  },
  debug: false
};
```
