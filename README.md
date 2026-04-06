# wxo-js-sdk

Pure JavaScript SDK for IBM watsonx Orchestrate with enhanced features.

IBMの公式ライブラリに依存しない、純粋なJavaScript実装のwatsonx Orchestrate SDKです。複数エージェント対応、フィードバック機能、柔軟な設定管理など、公式embedを超える機能を提供します。

## ✨ 特徴

- **🚀 Pure JavaScript** - IBM公式ライブラリへの依存なし
- **👥 複数エージェント対応** - 1つのSDKで複数のエージェントを管理
- **👍 フィードバック機能** - メッセージごとの評価機能を内蔵
- **⚙️ 柔軟な設定管理** - 外部JSONファイルからの設定読み込みに対応
- **📱 レスポンシブUI** - チャットウィンドウのリサイズ機能
- **🔌 簡単な統合** - `<script>`タグ1つで導入可能
- **📦 複数のデプロイ方法** - CDN、npm、セルフホスティングに対応

## 📦 インストール

### CDN経由（推奨）

```html
<script src="https://cdn.jsdelivr.net/gh/yourusername/wxo-js-sdk@latest/dist/wxo-sdk.min.js"></script>
```

### npm経由

```bash
npm install wxo-js-sdk
```

### セルフホスティング

1. リポジトリをクローン
2. `npm install && npm run build`
3. `dist/wxo-sdk.min.js`を配置

## 🚀 クイックスタート

### 1. HTMLに追加

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your content -->

  <!-- SDK読み込み -->
  <script src="https://cdn.jsdelivr.net/gh/yourusername/wxo-js-sdk@latest/dist/wxo-sdk.min.js"></script>
  
  <!-- 設定と初期化 -->
  <script>
    window.wxOConfiguration = {
      orchestrationID: 'your-orchestration-id',
      hostURL: 'https://your-watsonx-host.com',
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

    // SDK初期化
    wxoLoader.init().then(client => {
      console.log('SDK ready!');
      
      // チャット開始
      client.startChat('sales').then(() => {
        console.log('Chat started');
      });
    });
  </script>
</body>
</html>
```

### 2. メッセージの送受信

```javascript
// メッセージ受信ハンドラ
client.onMessage((message) => {
  console.log('Received:', message.text);
});

// メッセージ送信
await client.sendMessage('こんにちは');
```

### 3. フィードバック送信

```javascript
// ポジティブフィードバック
await client.sendFeedback(messageId, true);

// ネガティブフィードバック（コメント付き）
await client.sendFeedback(messageId, false, '回答が不正確でした');
```

## 📖 ドキュメント

- **[API Guide](docs/API_GUIDE.md)** - 詳細なAPI仕様
- **[Architecture](ARCHITECTURE.md)** - システムアーキテクチャ
- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - デプロイ方法
- **[Test Strategy](TEST_STRATEGY.md)** - テスト戦略
- **[Project Plan](PROJECT_PLAN.md)** - プロジェクト計画

## 💡 使用例

### 基本的な使用例

```javascript
// 設定
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
  }
};

// 初期化
const client = await wxoLoader.init();

// メッセージハンドラ
client.onMessage((message) => {
  if (message.sender === 'agent') {
    displayMessage(message.text);
  }
});

// チャット開始
await client.startChat('sales');

// メッセージ送信
await client.sendMessage('見積もりを作成してください');
```

### 複数エージェントの切り替え

```javascript
// 営業エージェントで開始
await client.startChat('sales');
await client.sendMessage('見積もりを作成してください');

// 技術エージェントに切り替え
await client.switchAgent('tech');
await client.sendMessage('APIの使い方を教えてください');

// 人事エージェントに切り替え
await client.switchAgent('hr');
await client.sendMessage('休暇申請の方法を教えてください');
```

### エラーハンドリング

```javascript
client.onError((error) => {
  console.error('Error:', error);
  
  if (error.status === 401) {
    // 認証エラー
    showAuthError();
  } else if (error.status === 429) {
    // レート制限
    showRateLimitError();
  }
});
```

完全な使用例は[examples/](examples/)ディレクトリを参照してください。

## ⚙️ 設定オプション

### 必須設定

```javascript
{
  orchestrationID: 'your-orchestration-id',  // Orchestration ID
  hostURL: 'https://your-watsonx-host.com',  // watsonx ホストURL
  agents: [...]                               // エージェント設定配列
}
```

### オプション設定

```javascript
{
  region: 'us-south',              // リージョン（デフォルト: 'us-south'）
  tenantID: 'your-tenant-id',      // テナントID（オプション）
  
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
    showAgentSelector: true,
    enableResize: true
  },
  
  // 機能設定
  features: {
    feedback: true,        // フィードバック機能
    multiAgent: true,      // 複数エージェント
    fileUpload: false,     // ファイルアップロード
    voiceInput: false      // 音声入力
  },
  
  debug: false             // デバッグモード
}
```

詳細は[API Guide](docs/API_GUIDE.md)を参照してください。

## 🏗️ 開発

### セットアップ

```bash
# 依存関係のインストール
npm install

# 開発モード（ウォッチモード）
npm run dev

# ビルド
npm run build

# テスト実行
npm test

# リント
npm run lint

# ローカルサーバー起動
npm run serve
```

### ディレクトリ構造

```
wxo-js-sdk/
├── src/
│   ├── core/           # コア機能
│   ├── api/            # API通信
│   ├── auth/           # 認証管理
│   ├── chat/           # チャット管理
│   ├── agents/         # エージェント管理
│   ├── ui/             # UI コンポーネント
│   └── utils/          # ユーティリティ
├── examples/           # 使用例
├── docs/               # ドキュメント
├── tests/              # テスト
└── dist/               # ビルド成果物
```

## 🧪 テスト

```bash
# 全テスト実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジ
npm run test:coverage
```

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

プルリクエストを歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📮 サポート

- **Issues**: [GitHub Issues](https://github.com/yourusername/wxo-js-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/wxo-js-sdk/discussions)

## 🗺️ ロードマップ

- [x] Phase 1: プロジェクト基盤構築
- [x] Phase 2: コア機能実装
- [x] Phase 3: チャット機能実装
- [x] Phase 4: ドキュメント作成
- [ ] Phase 5: テスト実装
- [ ] Phase 6: UI コンポーネント実装
- [ ] Phase 7: 追加機能実装

詳細は[PROJECT_PLAN.md](PROJECT_PLAN.md)を参照してください。

## 📊 ステータス

- **バージョン**: 0.1.0
- **ステータス**: 開発中（Phase 4完了）
- **テストカバレッジ**: 未実装（Phase 5で実装予定）

---

Made with ❤️ for watsonx Orchestrate developers