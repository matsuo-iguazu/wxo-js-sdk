# IBM watsonx Orchestrate API Endpoints

このドキュメントは、実際のIBM watsonx Orchestrate APIエンドポイントに基づいた実装の詳細を記載しています。

## 分析元

- `analysis/wxo-embed-live.js` - IBM公式のembed実装
- `analysis/ANALYSIS.md` - wxoLoader.jsの詳細分析結果

## 実際のAPIエンドポイント

### ベースURL
```
https://us-south.watson-orchestrate.cloud.ibm.com
```

### 主要エンドポイント

| エンドポイント | 用途 | 実装箇所 |
|--------------|------|---------|
| `/mfe_home_archer/api/v1` | メインAPI・認証 | `AuthManager.js` |
| `/mfe_agent_architect/api/v1` | エージェント管理・セッション | `ChatManager.js` |
| `/mfe_builder/api/v1` | ビルダー機能 | 未実装 |
| `/socket.io/` | WebSocket通信 | `WebSocketClient.js` |

## 認証 (AuthManager.js)

### エンドポイント
```
POST /mfe_home_archer/api/v1/auth/token
```

### リクエスト
```javascript
{
  orchestrationID: "63c38798359e4eb9917d478a2b67fbfb_0e9590c3-c50a-4598-8e57-b604604cfc36",
  deploymentPlatform: "ibmcloud",
  crn: "crn:v1:bluemix:public:watsonx-orchestrate:us-south:a/..."
}
```

### ヘッダー
```javascript
{
  'Content-Type': 'application/json',
  'X-Request-ID': 'wxo-sdk-{timestamp}-{random}',
  'X-Global-Transaction-ID': 'wxo-sdk-{timestamp}-{random}'
}
```

### レスポンス
```javascript
{
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  // または
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresIn: 3600,  // 秒単位
  // または
  expires_in: 3600
}
```

## セッション作成 (ChatManager.js)

### エンドポイント
```
POST /mfe_agent_architect/api/v1/sessions
```

### リクエスト
```javascript
{
  orchestrationID: "63c38798359e4eb9917d478a2b67fbfb_0e9590c3-c50a-4598-8e57-b604604cfc36",
  agentId: "507785a9-c785-425a-aeff-8a4fce61074c",
  agentEnvironmentId: "2f1678cb-955e-4a62-a433-617116b1f55e",
  chatOptions: {
    agentId: "507785a9-c785-425a-aeff-8a4fce61074c",
    agentEnvironmentId: "2f1678cb-955e-4a62-a433-617116b1f55e"
  }
}
```

### ヘッダー
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {token}',
  'X-Request-ID': 'wxo-sdk-{timestamp}-{random}',
  'X-Global-Transaction-ID': 'wxo-sdk-{timestamp}-{random}'
}
```

### レスポンス
```javascript
{
  sessionId: "session_abc123...",
  // その他のセッション情報
}
```

## WebSocket接続 (WebSocketClient.js)

### エンドポイント
```
wss://us-south.watson-orchestrate.cloud.ibm.com/socket.io/
```

### 接続URL
```
wss://us-south.watson-orchestrate.cloud.ibm.com/socket.io/?sessionId={sessionId}&token={token}&EIO=4&transport=websocket
```

### パラメータ
- `sessionId`: セッションID
- `token`: 認証トークン
- `EIO=4`: Engine.IO プロトコルバージョン4
- `transport=websocket`: WebSocketトランスポート

### メッセージフォーマット（推測）
```javascript
// 送信
{
  type: 'message',
  sessionId: 'session_abc123',
  message: {
    text: 'こんにちは'
  }
}

// 受信
{
  type: 'message',
  sessionId: 'session_abc123',
  message: {
    id: 'msg_xyz789',
    text: 'こんにちは！何かお手伝いできることはありますか？',
    timestamp: 1234567890
  }
}
```

## 設定パラメータ

### 必須項目
```javascript
{
  orchestrationID: string,  // Orchestration ID
  hostURL: string,          // ホストURL
  agents: [                 // エージェント配列
    {
      id: string,                    // 内部ID
      name: string,                  // 表示名
      agentId: string,               // IBM Agent ID
      agentEnvironmentId: string     // 環境ID（Live/Draft）
    }
  ]
}
```

### オプション項目
```javascript
{
  region: 'us-south',              // リージョン
  deploymentPlatform: 'ibmcloud',  // デプロイメントプラットフォーム
  crn: string,                     // Cloud Resource Name
  rootElementID: 'root',           // ルート要素ID
  debug: false                     // デバッグモード
}
```

## 実装の変更点

### 1. AuthManager.js
- エンドポイント: `/api/v1/auth/token` → `/mfe_home_archer/api/v1/auth/token`
- パラメータ: `orchestrationID`, `deploymentPlatform`, `crn`を使用
- ヘッダー: `X-Request-ID`, `X-Global-Transaction-ID`を追加

### 2. ChatManager.js
- エンドポイント: `/api/v1/chat/sessions` → `/mfe_agent_architect/api/v1/sessions`
- パラメータ: `agentEnvironmentId`を追加
- `chatOptions`オブジェクトを追加

### 3. WebSocketClient.js
- URL: `/api/v1/chat/ws` → `/socket.io/`
- パラメータ: `EIO=4&transport=websocket`を追加
- Socket.ioプロトコルに対応

### 4. Config.js
- デフォルト設定に`deploymentPlatform`, `crn`, `rootElementID`を追加
- エージェント検証から`skillId`を削除（必須ではない）
- `agentEnvironmentId`の警告を追加

## 注意事項

⚠️ **これらのエンドポイントは分析に基づく推測を含みます**

実際の動作確認が必要な項目：
1. 認証エンドポイントの正確なパス
2. レスポンスフィールド名（`token` vs `access_token`）
3. WebSocketメッセージフォーマット
4. エラーレスポンスの構造

⚠️ **実装前に必ず確認してください**
- ブラウザDevToolsでネットワークトラフィックを記録
- 実際のリクエスト/レスポンスを確認
- エラーハンドリングをテスト

## 次のステップ

1. **ビルドとテスト**
   ```bash
   npm install
   npm run build
   ```

2. **実際のAPIテスト**
   - `examples/basic-example.html`を開く
   - ブラウザDevToolsでネットワークタブを確認
   - 実際のAPI呼び出しを観察

3. **必要に応じて調整**
   - エンドポイントパスの修正
   - リクエスト/レスポンス形式の調整
   - エラーハンドリングの改善

## 参考資料

- `analysis/ANALYSIS.md` - 詳細な分析結果
- `analysis/wxo-embed-live.js` - IBM公式実装
- IBM watsonx Orchestrate公式ドキュメント（要確認）