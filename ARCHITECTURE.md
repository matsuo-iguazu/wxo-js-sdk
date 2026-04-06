# wxo-js-sdk アーキテクチャ設計

## 概要

このSDKは、**2つの主要コンポーネント**で構成されます：

### 1. SDKライブラリ（コアライブラリ）
純粋なJavaScriptで実装されたライブラリ

### 2. Embedスクリプト（統合コード）
任意のWebページに埋め込むための簡単なスクリプト

---

## 配布形態

### オプションA: スクリプトタグで読み込み（推奨）

#### 使用例
```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <!-- あなたのWebサイトのコンテンツ -->
  <h1>Welcome to My Site</h1>
  
  <!-- wxo-js-sdk の統合（ページの最後に配置） -->
  <script src="https://cdn.example.com/wxo-sdk.min.js"></script>
  <script>
    // 設定
    window.wxOConfiguration = {
      orchestrationID: "your-orchestration-id",
      hostURL: "https://us-south.watson-orchestrate.cloud.ibm.com",
      rootElementID: "wxo-chat-root",
      agents: [
        {
          id: "sales",
          name: "営業サポート",
          icon: "💼",
          agentId: "your-agent-id",
          agentEnvironmentId: "your-environment-id"
        },
        {
          id: "tech",
          name: "技術サポート",
          icon: "🔧",
          agentId: "another-agent-id",
          agentEnvironmentId: "another-environment-id"
        }
      ]
    };
    
    // 初期化
    wxoLoader.init();
  </script>
  
  <!-- チャットUIが表示される場所 -->
  <div id="wxo-chat-root"></div>
</body>
</html>
```

### オプションB: npmパッケージとして使用

```bash
npm install wxo-js-sdk
```

```javascript
import WxOClient from 'wxo-js-sdk';

const client = new WxOClient({
  orchestrationID: "your-orchestration-id",
  hostURL: "https://us-south.watson-orchestrate.cloud.ibm.com",
  agents: [...]
});

await client.init();
```

---

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                    ユーザーのWebページ                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │  <script src="wxo-sdk.min.js"></script>          │  │
│  │  <script>                                         │  │
│  │    window.wxOConfiguration = { ... };            │  │
│  │    wxoLoader.init();                             │  │
│  │  </script>                                        │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │           wxo-js-sdk (ライブラリ)                 │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  WxOClient (メインクライアント)             │  │  │
│  │  │    ├─ AgentManager (エージェント管理)       │  │  │
│  │  │    ├─ UIManager (UI制御)                    │  │  │
│  │  │    ├─ HttpClient (HTTP通信)                 │  │  │
│  │  │    └─ WebSocketClient (WebSocket通信)       │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │              UI コンポーネント                     │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │  フローティングアイコン                      │  │  │
│  │  │  エージェント選択UI                          │  │  │
│  │  │  チャットウィンドウ                          │  │  │
│  │  │  フィードバックボタン                        │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│          watsonx Orchestrate API (IBM Cloud)            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  /mfe_home_archer/api/v1                          │  │
│  │  /mfe_agent_architect/api/v1                      │  │
│  │  WebSocket: wss://...                             │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ファイル構成

### 配布物
```
dist/
├── wxo-sdk.js          # 開発用（非圧縮、コメント付き）
├── wxo-sdk.min.js      # 本番用（圧縮版）
└── wxo-sdk.css         # スタイルシート（オプション）
```

### ソースコード
```
src/
├── index.js            # エントリーポイント
├── core/
│   ├── WxOClient.js    # メインクライアント
│   └── Config.js       # 設定管理
├── agents/
│   ├── AgentManager.js # エージェント管理
│   └── Agent.js        # 個別エージェント
├── api/
│   ├── HttpClient.js   # HTTP通信
│   └── WebSocketClient.js # WebSocket通信
├── ui/
│   ├── UIManager.js    # UI制御
│   ├── FloatingButton.js # フローティングアイコン
│   ├── AgentSelector.js  # エージェント選択
│   ├── ChatWindow.js     # チャットウィンドウ
│   └── FeedbackButtons.js # フィードバックボタン
└── utils/
    ├── logger.js       # ロギング
    └── errors.js       # エラー定義
```

---

## 統合方法の詳細

### 方法1: CDN経由（最も簡単）

```html
<!-- ステップ1: SDKを読み込む -->
<script src="https://cdn.example.com/wxo-sdk.min.js"></script>

<!-- ステップ2: 設定を定義 -->
<script>
  window.wxOConfiguration = {
    orchestrationID: "...",
    hostURL: "...",
    agents: [...]
  };
</script>

<!-- ステップ3: 初期化 -->
<script>
  wxoLoader.init();
</script>
```

### 方法2: ローカルファイル

```html
<!-- ダウンロードしたファイルを使用 -->
<script src="/js/wxo-sdk.min.js"></script>
<script>
  window.wxOConfiguration = { ... };
  wxoLoader.init();
</script>
```

### 方法3: npm + バンドラー（React, Vue等）

```javascript
// インストール
// npm install wxo-js-sdk

// 使用
import WxOClient from 'wxo-js-sdk';

const client = new WxOClient({
  orchestrationID: "...",
  hostURL: "...",
  agents: [...]
});

// React コンポーネント内で
useEffect(() => {
  client.init();
  return () => client.destroy();
}, []);
```

---

## 既存のIBM embedとの比較

### IBM公式embed
```html
<script>
  window.wxOConfiguration = {
    orchestrationID: "...",
    hostURL: "...",
    chatOptions: {
      agentId: "single-agent-only",  // ← 1つのみ
      agentEnvironmentId: "..."
    }
  };
  setTimeout(function () {
    const script = document.createElement('script');
    script.src = `${window.wxOConfiguration.hostURL}/wxochat/wxoLoader.js?embed=true`;
    script.addEventListener('load', function () {
        wxoLoader.init();
    });
    document.head.appendChild(script);
  }, 0);
</script>
```

### wxo-js-sdk（私たちのSDK）
```html
<script src="wxo-sdk.min.js"></script>
<script>
  window.wxOConfiguration = {
    orchestrationID: "...",
    hostURL: "...",
    agents: [                        // ← 複数対応！
      { id: "sales", name: "営業", agentId: "...", ... },
      { id: "tech", name: "技術", agentId: "...", ... },
      { id: "support", name: "サポート", agentId: "...", ... }
    ],
    feedback: { enabled: true },     // ← フィードバック機能
    ui: {
      defaultWidth: 400,             // ← リサイズ機能
      expandedWidth: 600
    }
  };
  wxoLoader.init();
</script>
```

---

## グローバルAPI

SDKが提供するグローバルオブジェクト：

```javascript
// wxoLoader: 初期化用
wxoLoader.init()           // SDKを初期化
wxoLoader.destroy()        // SDKを破棄

// wxoClient: 実行時制御用（init後に利用可能）
wxoClient.selectAgent(id)  // エージェントを選択
wxoClient.sendMessage(msg) // メッセージを送信
wxoClient.show()           // UIを表示
wxoClient.hide()           // UIを非表示
wxoClient.resize(width)    // ウィンドウをリサイズ
```

---

## 質問への回答

### Q: ライブラリとそれにアクセスして利用するJavaScriptという組み合わせ？

**A: はい、その通りです！**

```
┌─────────────────────────────────────┐
│  wxo-sdk.min.js (ライブラリ)        │  ← 私たちが作るもの
│  - すべての機能を含む               │
│  - 1つのファイルで完結              │
└─────────────────────────────────────┘
              ↓ 読み込み
┌─────────────────────────────────────┐
│  ユーザーのHTML/JavaScript          │  ← ユーザーが書くもの
│  - 設定を定義                       │
│  - wxoLoader.init() を呼ぶ          │
└─────────────────────────────────────┘
```

### Q: embedコードに類似したもので任意のページ等に統合できる？

**A: はい、まさにその通りです！**

IBM公式embedと同じように：
1. `<script>`タグで読み込む
2. 設定を書く
3. `init()`を呼ぶ

だけで、どんなWebページにも統合できます。

---

## 実装の優先順位

### Phase 1: コアライブラリ
```javascript
// src/index.js - エントリーポイント
window.wxoLoader = {
  init: function() {
    // SDKを初期化
  }
};
```

### Phase 2: 基本機能
- 設定読み込み
- HTTP/WebSocket通信
- 単一エージェントでのチャット

### Phase 3: 拡張機能
- 複数エージェント対応
- フィードバック機能
- UI改善

### Phase 4: ビルド・配布
- Webpackでバンドル
- 圧縮版の生成
- CDN対応

---

## まとめ

✅ **ライブラリ**: `wxo-sdk.min.js` - 1つのファイルで完結
✅ **統合方法**: `<script>`タグで読み込み + 設定 + `init()`
✅ **互換性**: IBM公式embedと同じような使い方
✅ **拡張性**: 複数エージェント、フィードバック、リサイズなど

**この理解で正しいですか？他に確認したい点はありますか？**