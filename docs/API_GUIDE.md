# API Guide

wxo-js-sdkの詳細なAPI仕様とコード例を説明します。

## 目次

1. [初期化](#初期化)
2. [設定](#設定)
3. [チャット操作](#チャット操作)
4. [エージェント管理](#エージェント管理)
5. [メッセージ処理](#メッセージ処理)
6. [フィードバック](#フィードバック)
7. [エラーハンドリング](#エラーハンドリング)

---

## 初期化

### 基本的な初期化

```javascript
// 設定を定義
window.wxOConfiguration = {
  orchestrationID: 'your-orchestration-id',
  hostURL: 'https://your-watsonx-host.com',
  region: 'us-south',
  agents: [
    {
      id: 'sales',
      name: '営業サポート',
      agentId: 'agent-sales-001',
      skillId: 'skill-sales-001',
      description: '営業活動をサポートします'
    }
  ]
};

// SDKを初期化
const client = await wxoLoader.init();
```

### 初期化オプション

```javascript
window.wxOConfiguration = {
  // 必須項目
  orchestrationID: 'your-orchestration-id',
  hostURL: 'https://your-watsonx-host.com',
  
  // オプション項目
  region: 'us-south',           // デフォルト: 'us-south'
  tenantID: 'your-tenant-id',   // オプション
  
  // エージェント設定
  agents: [...],
  
  // テーマ設定
  theme: {
    primaryColor: '#0f62fe',
    fontFamily: 'IBM Plex Sans, sans-serif',
    borderRadius: '8px'
  },
  
  // UI設定
  ui: {
    position: 'bottom-right',
    width: '400px',
    height: '600px',
    expandedWidth: '800px',
    expandedHeight: '800px',
    showAgentSelector: true,
    enableResize: true
  },
  
  // 機能設定
  features: {
    feedback: true,
    multiAgent: true,
    fileUpload: false,
    voiceInput: false
  },
  
  // デバッグモード
  debug: false
};
```

---

## 設定

### 設定の取得

```javascript
// 全設定を取得
const config = client.getConfig();

// エージェント一覧を取得
const agents = client.getAgents();

// 特定のエージェントを取得
const agent = client.getAgent('sales');
```

### 初期化状態の確認

```javascript
// SDKが初期化済みか確認
if (client.isReady()) {
  console.log('SDK is ready');
}
```

---

## チャット操作

### チャットの開始

```javascript
// エージェントとのチャットを開始
const session = await client.startChat('sales');
console.log('Session ID:', session.sessionId);
```

### メッセージの送信

```javascript
// テキストメッセージを送信
const message = await client.sendMessage('こんにちは');

// オプション付きでメッセージを送信
const message = await client.sendMessage('見積もりを作成してください', {
  metadata: {
    priority: 'high',
    category: 'sales'
  }
});
```

### メッセージ履歴の取得

```javascript
// 現在のエージェントのメッセージ履歴を取得
const messages = client.getMessages();

// 特定のエージェントのメッセージ履歴を取得
const salesMessages = client.getAgentMessages('sales');
```

### メッセージ履歴のクリア

```javascript
// 現在のエージェントのメッセージ履歴をクリア
client.clearMessages();
```

### チャットの終了

```javascript
// 特定のエージェントとのチャットを終了
await client.endChat('sales');
```

---

## エージェント管理

### エージェントの切り替え

```javascript
// 別のエージェントに切り替え
const session = await client.switchAgent('tech');
console.log('Switched to:', session.agent.name);
```

### エージェント情報の取得

```javascript
// 全エージェントを取得
const agents = client.getAgents();
agents.forEach(agent => {
  console.log(`${agent.name}: ${agent.description}`);
});

// 特定のエージェントを取得
const salesAgent = client.getAgent('sales');
console.log(salesAgent.name);
```

---

## メッセージ処理

### メッセージイベントのリスニング

```javascript
// メッセージ受信時のハンドラを登録
client.onMessage((message) => {
  console.log('New message:', message);
  
  // メッセージの構造
  // {
  //   id: 'msg_xxx',
  //   sessionId: 'session_xxx',
  //   text: 'メッセージ内容',
  //   sender: 'user' | 'agent',
  //   timestamp: 1234567890,
  //   metadata: {}
  // }
  
  if (message.sender === 'agent') {
    displayAgentMessage(message);
  } else {
    displayUserMessage(message);
  }
});
```

### メッセージオブジェクトの構造

```javascript
{
  id: 'msg_1234567890_abc123',      // メッセージID
  sessionId: 'session_xxx',          // セッションID
  text: 'メッセージ内容',            // メッセージテキスト
  sender: 'user' | 'agent',          // 送信者
  timestamp: 1234567890,             // タイムスタンプ（ミリ秒）
  metadata: {                        // メタデータ（オプション）
    // カスタムデータ
  }
}
```

---

## フィードバック

### フィードバックの送信

```javascript
// ポジティブフィードバック
await client.sendFeedback(messageId, true);

// ネガティブフィードバック
await client.sendFeedback(messageId, false);

// コメント付きフィードバック
await client.sendFeedback(messageId, false, '回答が不正確でした');
```

### フィードバックボタンの実装例

```javascript
function createFeedbackButtons(messageId) {
  const container = document.createElement('div');
  
  const thumbsUp = document.createElement('button');
  thumbsUp.textContent = '👍';
  thumbsUp.onclick = async () => {
    await client.sendFeedback(messageId, true);
    console.log('Positive feedback sent');
  };
  
  const thumbsDown = document.createElement('button');
  thumbsDown.textContent = '👎';
  thumbsDown.onclick = async () => {
    const comment = prompt('改善点を教えてください（任意）');
    await client.sendFeedback(messageId, false, comment || '');
    console.log('Negative feedback sent');
  };
  
  container.appendChild(thumbsUp);
  container.appendChild(thumbsDown);
  
  return container;
}
```

---

## エラーハンドリング

### エラーイベントのリスニング

```javascript
// エラーハンドラを登録
client.onError((error) => {
  console.error('Error occurred:', error);
  
  // エラーの種類に応じた処理
  if (error.status === 401) {
    console.error('Authentication failed');
  } else if (error.status === 429) {
    console.error('Rate limit exceeded');
  } else {
    console.error('Unknown error:', error.message);
  }
});
```

### try-catchによるエラーハンドリング

```javascript
try {
  await client.sendMessage('こんにちは');
} catch (error) {
  if (error.message.includes('not initialized')) {
    console.error('SDK not initialized');
    await client.init();
  } else if (error.message.includes('No active agent')) {
    console.error('No agent selected');
    await client.startChat('sales');
  } else {
    console.error('Failed to send message:', error);
  }
}
```

### 一般的なエラーと対処法

| エラー | 原因 | 対処法 |
|--------|------|--------|
| `wxOConfiguration not found` | 設定が定義されていない | `window.wxOConfiguration`を定義 |
| `SDK not initialized` | `init()`が呼ばれていない | `await wxoLoader.init()`を実行 |
| `No active agent` | エージェントが選択されていない | `await client.startChat(agentId)`を実行 |
| `Authentication failed` | 認証情報が無効 | `orchestrationID`と`hostURL`を確認 |
| `Agent not found` | 存在しないエージェントID | `agents`配列の設定を確認 |

---

## 完全な使用例

```javascript
// 1. 設定
window.wxOConfiguration = {
  orchestrationID: 'your-orchestration-id',
  hostURL: 'https://your-watsonx-host.com',
  agents: [
    {
      id: 'sales',
      name: '営業サポート',
      agentId: 'agent-sales-001',
      skillId: 'skill-sales-001'
    }
  ],
  features: {
    feedback: true,
    multiAgent: true
  },
  debug: true
};

// 2. 初期化
const client = await wxoLoader.init();

// 3. イベントハンドラの設定
client.onMessage((message) => {
  console.log('Message:', message.text);
});

client.onError((error) => {
  console.error('Error:', error);
});

// 4. チャット開始
await client.startChat('sales');

// 5. メッセージ送信
const message = await client.sendMessage('見積もりを作成してください');

// 6. フィードバック送信（エージェントの返信後）
await client.sendFeedback(agentMessageId, true);

// 7. エージェント切り替え
await client.switchAgent('tech');

// 8. メッセージ履歴取得
const history = client.getMessages();

// 9. チャット終了
await client.endChat('sales');

// 10. クリーンアップ
client.disconnect();
```

---

## 次のステップ

- [使用例](../examples/) - 実際の実装例を確認
- [ARCHITECTURE.md](../ARCHITECTURE.md) - アーキテクチャの詳細
- [DEPLOYMENT_GUIDE.md](../DEPLOYMENT_GUIDE.md) - デプロイ方法