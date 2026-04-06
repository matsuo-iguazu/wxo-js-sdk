# wxo-js-sdk テスト戦略（調整版）

## 基本方針 🎯

**スピード重視**: まず動くものを作り、テストは後続フェーズで実施

### 開発フェーズとテストの関係

```
Phase 1-2: 実装優先（テスト最小限）
  ├─ 手動での動作確認のみ
  └─ テストコードは書かない
  
Phase 3-4: 機能実装継続
  ├─ 引き続き実装優先
  └─ 手動テストで動作確認
  
Phase 5: テスト実装フェーズ ⭐
  ├─ 全機能のテストを一括作成
  ├─ ユニットテスト
  ├─ 統合テスト
  └─ E2Eテスト
```

---

## Phase 1-4: 実装フェーズ（現在〜機能完成）

### やること ✅
- **実装**: すべての機能を実装
- **手動テスト**: ブラウザで動作確認
- **ドキュメント**: 使用例とAPIドキュメント

### やらないこと ❌
- ユニットテストの作成
- 統合テストの作成
- E2Eテストの作成
- カバレッジ測定

### 品質保証の方法
```
1. 実装完了後、ブラウザで手動確認
2. 主要なユースケースを実際に試す
3. エラーが出たら修正して再確認
4. 動作確認OKなら次の機能へ
```

---

## Phase 5: テスト実装フェーズ（機能完成後）

### 目標
全機能が動作する状態で、包括的なテストを一括作成

### テスト作成の順序

#### Step 1: テスト環境のセットアップ
```bash
# テストツールのインストール
npm install --save-dev jest @playwright/test

# 設定ファイルの作成
- jest.config.js
- playwright.config.js
```

#### Step 2: ユニットテスト作成（優先度順）
```
1. Config.js（設定管理）
   └─ 設定の検証、デフォルト値、エラーハンドリング

2. AgentManager.js（エージェント管理）
   └─ エージェント追加/削除/選択

3. HttpClient.js（HTTP通信）
   └─ GET/POST、エラーハンドリング、リトライ

4. Agent.js（個別エージェント）
   └─ セッション管理、メッセージ履歴

5. その他のユーティリティ
   └─ logger.js, errors.js など
```

#### Step 3: 統合テスト作成
```
1. エージェント切り替えフロー
   └─ A→B→Aの切り替えと履歴保持

2. フィードバック機能
   └─ メッセージへのフィードバック送信

3. WebSocket通信
   └─ 接続、メッセージ送受信、再接続
```

#### Step 4: E2Eテスト作成
```
1. 基本フロー
   └─ アイコンクリック→エージェント選択→チャット

2. 複数エージェント切り替え
   └─ 実際のUI操作でのエージェント切り替え

3. フィードバック送信
   └─ UIからのフィードバックボタン操作

4. ウィンドウリサイズ
   └─ リサイズボタンの動作確認
```

### カバレッジ目標（Phase 5で達成）
- **ユニットテスト**: 60%以上
- **統合テスト**: 主要フロー100%
- **E2Eテスト**: クリティカルパス100%

---

## テスト作業の見積もり

### Phase 5: テスト実装フェーズ
```
Day 1: テスト環境セットアップ + ユニットテスト（Config, AgentManager）
Day 2: ユニットテスト（HttpClient, Agent, その他）
Day 3: 統合テスト（全フロー）
Day 4: E2Eテスト（Playwright）
Day 5: カバレッジ確認、不足分の追加、ドキュメント更新
```

**合計**: 5日間

---

## 手動テストチェックリスト（Phase 1-4で使用）

### 各機能実装後に確認

#### ✅ Phase 1: 基盤機能
- [ ] 設定ファイル（JSON）が正しく読み込まれる
- [ ] 必須パラメータが欠けている場合、エラーが表示される
- [ ] HTTP通信が成功する
- [ ] エラー時に適切なメッセージが表示される

#### ✅ Phase 2: 複数エージェント
- [ ] フローティングアイコンが表示される
- [ ] クリックでエージェント一覧が展開される
- [ ] 各エージェントのアイコンとラベルが表示される
- [ ] エージェントを選択するとチャットウィンドウが開く
- [ ] エージェントAでメッセージ送信できる
- [ ] エージェントBに切り替えできる
- [ ] エージェントAに戻ると履歴が保持されている

#### ✅ Phase 3: フィードバック機能
- [ ] メッセージにフィードバックボタンが表示される
- [ ] 👍ボタンをクリックすると選択状態になる
- [ ] 👎ボタンをクリックすると選択状態になる
- [ ] フィードバックがAPIに送信される
- [ ] 確認メッセージが表示される

#### ✅ Phase 4: UI改善
- [ ] リサイズボタンが表示される
- [ ] クリックでウィンドウ幅が変更される
- [ ] アニメーションが滑らかに動作する
- [ ] ページリロード後もサイズが保持される
- [ ] モバイル画面で適切に表示される

---

## テストデータの管理

### Phase 1-4: 手動テスト用
```javascript
// examples/test-config.json
{
  "orchestrationID": "test-id",
  "hostURL": "https://us-south.watson-orchestrate.cloud.ibm.com",
  "agents": [
    {
      "id": "sales",
      "name": "営業サポート",
      "icon": "💼",
      "agentId": "実際のagentId",
      "agentEnvironmentId": "実際のenvironmentId"
    },
    {
      "id": "tech",
      "name": "技術サポート",
      "icon": "🔧",
      "agentId": "実際のagentId",
      "agentEnvironmentId": "実際のenvironmentId"
    }
  ]
}
```

### Phase 5: 自動テスト用
```javascript
// tests/fixtures/mock-config.js
export const mockConfig = {
  orchestrationID: "mock-id",
  hostURL: "https://mock.example.com",
  agents: [
    { id: "agent-1", name: "Agent 1", agentId: "mock-1" },
    { id: "agent-2", name: "Agent 2", agentId: "mock-2" }
  ]
};

// tests/fixtures/mock-responses.js
export const mockMessages = [
  { id: "msg-1", text: "こんにちは", sender: "user" },
  { id: "msg-2", text: "お手伝いします", sender: "agent" }
];
```

---

## ブラウザ互換性テスト

### Phase 1-4: 手動確認
開発中は**Chrome**のみで確認

### Phase 5: 包括的確認
- [ ] Chrome（最新版）
- [ ] Firefox（最新版）
- [ ] Safari（最新版）
- [ ] Edge（最新版）
- [ ] Chrome Mobile
- [ ] Safari Mobile

---

## Phase 5で作成するテストファイル一覧

```
tests/
├── unit/
│   ├── Config.test.js
│   ├── AgentManager.test.js
│   ├── HttpClient.test.js
│   ├── Agent.test.js
│   ├── WebSocketClient.test.js
│   └── utils/
│       ├── logger.test.js
│       └── errors.test.js
├── integration/
│   ├── agent-switching.test.js
│   ├── feedback.test.js
│   └── websocket-communication.test.js
├── e2e/
│   ├── basic-flow.spec.js
│   ├── multi-agent.spec.js
│   ├── feedback.spec.js
│   └── resize.spec.js
└── fixtures/
    ├── mock-config.js
    ├── mock-responses.js
    └── test-data.js
```

---

## まとめ

### 現在の方針（Phase 1-4）
✅ **実装優先**: テストコードは書かない
✅ **手動確認**: ブラウザで動作確認
✅ **スピード重視**: 早く動くものを作る

### 将来の方針（Phase 5）
📝 **テスト一括作成**: 全機能完成後にまとめて実施
📝 **包括的なテスト**: ユニット/統合/E2E
📝 **品質保証**: カバレッジ60%以上

### メリット
- 🚀 開発スピードが速い
- 💡 実装に集中できる
- 🎯 動くものが早く完成する
- 📊 後からまとめてテストを追加できる

---

**更新日**: 2026-04-06
**ステータス**: Phase 1-4は実装優先、Phase 5でテスト実装