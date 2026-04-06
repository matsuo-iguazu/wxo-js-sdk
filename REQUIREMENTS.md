# wxo-js-sdk 機能要件

## 概要

このSDKは、現状のIBM watsonx Orchestrate embedの以下4つの主要な制限を解決します：

1. **複数エージェント対応** - 1つのページで複数のエージェントを切り替え可能に
2. **フィードバック機能の統合** - Thumbs up/down機能の標準搭載
3. **設定管理の簡素化** - エージェント設定の外部ファイル化と管理画面
4. **チャットウィンドウのリサイズ** - ウィンドウ幅の動的変更機能

---

## 機能要件詳細

## 要件1: 複数エージェント対応 🎯 最優先

### 現状のIBM Embedの制限
現状のembedは、1つの`agentId`と`agentEnvironmentId`にしか対応していません。

```javascript
// 現状：1つのエージェントのみ
window.wxOConfiguration = {
  chatOptions: {
    agentId: "507785a9-c785-425a-aeff-8a4fce61074c",
    agentEnvironmentId: "2f1678cb-955e-4a62-a433-617116b1f55e"
  }
};
```

### 現状のUI動作
```
1. ページ読み込み
   ↓
2. 右下にフローティングアイコン（丸）が表示
   ↓ クリック
3. チャットウィンドウが開く（1つのエージェントに固定）
```

---

## 新しい要件：複数エージェント対応

### 目標のUI動作フロー

```
1. ページ読み込み
   ↓
2. 右下にメインフローティングアイコン（丸）が表示
   ↓ クリック
3. 複数のエージェントアイコンが展開表示
   │ ┌─ エージェントA のアイコン
   │ ├─ エージェントB のアイコン
   │ └─ エージェントC のアイコン
   ↓ いずれかをクリック
4. 選択したエージェントのチャットウィンドウが開く
   ↓ 最小化ボタンをクリック
5. チャットウィンドウが閉じ、複数アイコン表示に戻る
   ↓ Close/ミニアイコンをクリック
6. メインフローティングアイコンのみの状態に戻る
```

### 必要な機能

#### 1. 複数エージェント設定
```javascript
const client = new WxOClient({
  orchestrationID: "...",
  hostURL: "https://us-south.watson-orchestrate.cloud.ibm.com",
  agents: [
    {
      id: "agent-a",
      name: "営業サポート",
      icon: "💼",
      agentId: "507785a9-c785-425a-aeff-8a4fce61074c",
      agentEnvironmentId: "2f1678cb-955e-4a62-a433-617116b1f55e"
    },
    {
      id: "agent-b",
      name: "技術サポート",
      icon: "🔧",
      agentId: "another-agent-id",
      agentEnvironmentId: "another-environment-id"
    },
    {
      id: "agent-c",
      name: "カスタマーサポート",
      icon: "💬",
      agentId: "yet-another-agent-id",
      agentEnvironmentId: "yet-another-environment-id"
    }
  ]
});
```

#### 2. エージェント選択UI
- メインアイコンクリック → エージェント一覧を展開
- 各エージェントのアイコンとラベルを表示
- アイコンのカスタマイズ可能（絵文字、画像URL）

#### 3. 動的なエージェント切り替え
- 選択したエージェントのチャットセッションを開始
- 別のエージェントを選択したら、新しいセッションを開始
- 各エージェントのチャット履歴を個別に保持（オプション）

#### 4. 状態管理
- どのエージェントが現在アクティブか
- 各エージェントのチャット履歴
- 最小化/展開の状態

---

## 技術的な実装方針

### アーキテクチャ

```
WxOClient (メインクライアント)
  ├─ AgentManager (複数エージェント管理)
  │   ├─ Agent A (個別のエージェントインスタンス)
  │   │   ├─ ChatSession
  │   │   └─ MessageHistory
  │   ├─ Agent B
  │   └─ Agent C
  ├─ UIManager (UI制御)
  │   ├─ FloatingButton (メインアイコン)
  │   ├─ AgentSelector (エージェント選択UI)
  │   └─ ChatWindow (チャットウィンドウ)
  └─ SessionManager (セッション管理)
```

### 主要クラス

#### AgentManager
```javascript
class AgentManager {
  constructor(agents) {
    this.agents = new Map();
    this.activeAgent = null;
  }
  
  addAgent(agentConfig) { }
  selectAgent(agentId) { }
  getActiveAgent() { }
  getAllAgents() { }
}
```

#### Agent
```javascript
class Agent {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.icon = config.icon;
    this.agentId = config.agentId;
    this.agentEnvironmentId = config.agentEnvironmentId;
    this.chatSession = null;
    this.messageHistory = [];
  }
  
  async connect() { }
  async sendMessage(message) { }
  disconnect() { }
}
```

#### UIManager
```javascript
class UIManager {
  constructor(container) {
    this.container = container;
    this.state = 'collapsed'; // collapsed, expanded, chat-open
  }
  
  showFloatingButton() { }
  showAgentSelector(agents) { }
  showChatWindow(agent) { }
  minimize() { }
  close() { }
}
```

---

## UI/UXの詳細仕様

### 1. メインフローティングアイコン
- **位置**: 右下固定
- **サイズ**: 60x60px（カスタマイズ可能）
- **デザイン**: 丸型、カスタムアイコン/色
- **アニメーション**: ホバー時に拡大、未読メッセージがある場合はバッジ表示

### 2. エージェント選択UI
- **表示方法**: メインアイコンの上に展開（縦並び）
- **各アイコン**: 
  - サイズ: 50x50px
  - ラベル: アイコンの横に表示
  - ホバー効果: 背景色変更
- **アニメーション**: フェードイン/スライドイン

### 3. チャットウィンドウ
- **サイズ**: 
  - デフォルト: 400x600px
  - カスタマイズ可能
- **位置**: 右下（フローティングアイコンの上）
- **ヘッダー**: 
  - エージェント名とアイコン
  - 最小化ボタン
  - 閉じるボタン
- **本体**: 
  - メッセージ履歴
  - 入力フィールド
  - 送信ボタン

---

---

## 要件2: フィードバック機能の統合 👍👎

### 現状の課題
- 公式ドキュメントに実装方法は記載されている
  - 参考: https://developer.watson-orchestrate.ibm.com/webchat/events_feedback
- しかし、embedへの具体的な統合方法が不明確
- 試行錯誤で追加しているが、標準機能として統合したい

### 目標
各メッセージに対して、ユーザーがフィードバックを送信できる機能を標準搭載

### 実装仕様
```javascript
const client = new WxOClient({
  feedback: {
    enabled: true,
    showButtons: true,
    allowComments: true,
    thanksMessage: "フィードバックありがとうございます"
  }
});
```

---

## 要件3: 設定管理の簡素化 ⚙️

### 現状の課題
- 複数エージェントの設定をJSコード内に直接記述すると編集ミスのリスク
- 非技術者が設定を変更するのが困難

### 目標
設定を外部JSONファイル化し、簡単に管理できるようにする

```json
// wxo-config.json
{
  "agents": [
    {"id": "sales", "name": "営業", "icon": "💼", "agentId": "..."},
    {"id": "tech", "name": "技術", "icon": "🔧", "agentId": "..."}
  ]
}
```

---

## 要件4: チャットウィンドウのリサイズ 📏

### 現状の課題
- チャットウィンドウの幅が固定
- 長いメッセージが見づらい

### 目標
標準モード(400px)と拡大モード(600px)を切り替えるボタンを追加

---

## 追加の機能要件（検討中）

### 優先度: 高
- [ ] 複数エージェントの同時接続
- [ ] 各エージェントのチャット履歴の永続化
- [ ] フィードバックデータの分析

### 優先度: 中
- [ ] 未読メッセージカウント
- [ ] 通知機能
- [ ] 設定管理画面

### 優先度: 低
- [ ] ダークモード対応
- [ ] ドラッグリサイズ

---

## 実装の優先順位

### Phase 1: 基本機能（必須）
1. 複数エージェント設定の読み込み
2. エージェント選択UIの実装
3. 選択したエージェントでのチャット機能

### Phase 2: UI/UX改善
1. アニメーション効果
2. レスポンシブデザイン
3. カスタマイズオプション

### Phase 3: 高度な機能
1. チャット履歴の永続化
2. 複数セッションの同時管理
3. 通知機能

---

## 現状のIBM Embedとの比較

| 機能 | IBM Embed | wxo-js-sdk |
|------|-----------|------------|
| エージェント数 | 1つのみ | **複数対応** ✅ |
| フィードバック機能 | 統合方法不明確 | **標準搭載** ✅ |
| 設定管理 | コード内記述 | **外部ファイル化** ✅ |
| ウィンドウリサイズ | 固定 | **動的変更** ✅ |
| UI カスタマイズ | 制限あり | 完全カスタマイズ可能 ✅ |
| バンドルサイズ | 大きい | 最小限 ✅ |

---

## 実装の優先順位

### Phase 1: 基本機能 - 2-3日
1. プロジェクト構造
2. 設定管理（JSON対応）
3. 基本チャット機能

### Phase 2: 複数エージェント - 2-3日
1. AgentManager実装
2. エージェント選択UI
3. セッション管理

### Phase 3: フィードバック - 1-2日
1. フィードバックボタン
2. API連携

### Phase 4: UI改善 - 1-2日
1. リサイズ機能
2. アニメーション

**合計見積もり**: 7-11日

## 次のステップ

1. ✅ 要件の明確化
2. ⏭️ プロジェクト構造の作成
3. ⏭️ Phase 1の実装開始