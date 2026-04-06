# wxo-js-sdk 実装計画

## 現在の状況
✅ **Phase 0: 分析完了**
- 既存embedコードの分析完了
- APIエンドポイントの特定完了
- 技術スタックの理解完了

## 実装ロードマップ

### Phase 1: プロジェクト基盤構築 【次のステップ】
**目標**: 開発環境とプロジェクト構造の整備

#### 1.1 プロジェクト構造の作成
```
wxo-js-sdk/
├── src/
│   ├── index.js              # メインエントリーポイント
│   ├── core/
│   │   ├── WxOClient.js      # メインクライアントクラス
│   │   └── config.js         # 設定管理
│   ├── auth/
│   │   ├── AuthManager.js    # 認証管理
│   │   └── TokenManager.js   # トークン管理
│   ├── api/
│   │   ├── HttpClient.js     # HTTP通信
│   │   └── WebSocketClient.js # WebSocket通信
│   ├── chat/
│   │   ├── ChatManager.js    # チャット機能
│   │   └── MessageHandler.js # メッセージ処理
│   └── utils/
│       ├── logger.js         # ロギング
│       └── errors.js         # エラー定義
├── examples/
│   ├── basic.html            # 基本的な使用例
│   └── chat.html             # チャット例
├── tests/                    # テスト（後で追加）
├── package.json
├── .gitignore
└── README.md
```

#### 1.2 package.json の作成
- プロジェクトメタデータ
- 依存関係の定義（最小限）
- ビルドスクリプト

#### 1.3 基本ファイルの作成
- `.gitignore`
- `LICENSE`
- 基本的なREADME更新

**所要時間**: 30分
**成果物**: プロジェクト構造、package.json

---

### Phase 2: コア機能実装
**目標**: 基本的なHTTP通信と認証機能

#### 2.1 設定管理 (`src/core/config.js`)
```javascript
// 設定の検証とデフォルト値の管理
class Config {
  constructor(options) {
    this.orchestrationID = options.orchestrationID;
    this.hostURL = options.hostURL;
    this.agentId = options.chatOptions?.agentId;
    // ...
  }
}
```

#### 2.2 HTTP通信 (`src/api/HttpClient.js`)
```javascript
// fetch APIを使用したHTTP通信
class HttpClient {
  async request(endpoint, options) {
    // リクエスト送信
    // エラーハンドリング
    // レスポンス処理
  }
}
```

#### 2.3 認証管理 (`src/auth/AuthManager.js`)
```javascript
// IAM認証の実装
class AuthManager {
  async authenticate() {
    // トークン取得
    // トークン保存
  }
}
```

**所要時間**: 2-3時間
**成果物**: 基本的なHTTP通信と認証機能

---

### Phase 3: チャット機能実装
**目標**: WebSocketを使用したリアルタイムチャット

#### 3.1 WebSocket接続 (`src/api/WebSocketClient.js`)
```javascript
class WebSocketClient {
  connect(url) {
    // WebSocket接続
    // 再接続ロジック
    // イベントハンドリング
  }
}
```

#### 3.2 チャット管理 (`src/chat/ChatManager.js`)
```javascript
class ChatManager {
  async sendMessage(message) {
    // メッセージ送信
    // レスポンス受信
  }
}
```

#### 3.3 メインクライアント (`src/core/WxOClient.js`)
```javascript
class WxOClient {
  constructor(config) {
    this.config = new Config(config);
    this.auth = new AuthManager(this.config);
    this.chat = new ChatManager(this.config);
  }
  
  async init() {
    await this.auth.authenticate();
    await this.chat.connect();
  }
}
```

**所要時間**: 3-4時間
**成果物**: 動作するチャット機能

---

### Phase 4: 使用例とドキュメント
**目標**: 実際に使える形にする

#### 4.1 使用例の作成
- `examples/basic.html`: 基本的な使用例
- `examples/chat.html`: チャット機能のデモ

#### 4.2 ドキュメント作成
- API仕様書 (`docs/API.md`)
- 入門ガイド (`docs/GETTING_STARTED.md`)
- サンプルコード集 (`docs/EXAMPLES.md`)

**所要時間**: 2-3時間
**成果物**: 使用可能なSDKとドキュメント

---

### Phase 5: テストとビルド（オプション）
**目標**: 品質保証と配布準備

#### 5.1 テストコード
- ユニットテスト
- 統合テスト

#### 5.2 ビルド設定
- Webpack/Rollup設定
- 圧縮版の生成

**所要時間**: 4-5時間
**成果物**: テスト済みの配布可能なSDK

---

## 今日の作業計画

### ステップ1: プロジェクト構造の作成 ✅ 次
1. 基本ディレクトリ構造の作成
2. `package.json` の作成
3. `.gitignore` の作成

### ステップ2: 設定管理の実装
1. `src/core/config.js` の実装
2. 設定の検証ロジック

### ステップ3: HTTP通信の実装
1. `src/api/HttpClient.js` の実装
2. 基本的なリクエスト/レスポンス処理

### ステップ4: 簡単な動作確認
1. `examples/basic.html` の作成
2. 実際にAPIを呼び出してみる

---

## 重要な判断ポイント

### 依存関係について
**オプション1: 完全に依存なし（推奨）**
- ✅ 純粋なJavaScript
- ✅ ブラウザの標準API（fetch, WebSocket）のみ
- ❌ ポリフィルが必要な古いブラウザは非対応

**オプション2: 最小限の依存**
- Axios（HTTP通信を簡単に）
- Socket.io-client（WebSocket接続を簡単に）

**推奨**: まずはオプション1で進め、必要に応じてオプション2を検討

### ビルドツールについて
**オプション1: ビルドなし**
- ✅ シンプル
- ✅ すぐに使える
- ❌ ES6モジュールのブラウザサポートが必要

**オプション2: Webpack/Rollup**
- ✅ 古いブラウザ対応
- ✅ 最適化された配布物
- ❌ 設定が複雑

**推奨**: まずはオプション1で進め、Phase 5でビルドツールを追加

---

## 次のアクション

今から以下を実行します：

1. ✅ プロジェクト構造の作成
2. ✅ `package.json` の作成
3. ✅ `.gitignore` の作成
4. ✅ 基本的な設定管理クラスの実装

準備ができたら、実装を開始します！