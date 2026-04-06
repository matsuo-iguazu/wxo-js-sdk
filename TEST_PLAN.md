# wxo-js-sdk テスト計画

## 概要
このドキュメントは、wxo-js-sdkの包括的なテスト戦略を定義します。
各レベルのテストを実施することで、品質と信頼性を確保します。

---

## テスト戦略

### テストピラミッド
```
        /\
       /  \      E2Eテスト (少数)
      /----\     
     /      \    統合テスト (中程度)
    /--------\   
   /          \  ユニットテスト (多数)
  /____________\ 
```

### テストレベル
1. **ユニットテスト**: 個別の関数・クラスのテスト
2. **統合テスト**: モジュール間の連携テスト
3. **E2Eテスト**: エンドユーザー視点の動作テスト
4. **手動テスト**: 視覚的確認・ユーザビリティテスト

---

## Phase 1: ユニットテスト

### 1.1 設定管理 (Config.js)

#### テストケース
```javascript
describe('Config', () => {
  describe('正常系', () => {
    test('有効な設定で初期化できる', () => {
      const config = new Config({
        orchestrationID: 'test-id',
        hostURL: 'https://example.com',
        agents: [
          { id: 'agent-1', name: 'Test Agent', agentId: 'xxx' }
        ]
      });
      expect(config.orchestrationID).toBe('test-id');
    });

    test('デフォルト値が設定される', () => {
      const config = new Config({
        orchestrationID: 'test-id',
        hostURL: 'https://example.com',
        agents: []
      });
      expect(config.ui.theme).toBe('light');
      expect(config.ui.position).toBe('bottom-right');
    });

    test('複数エージェントを設定できる', () => {
      const config = new Config({
        orchestrationID: 'test-id',
        hostURL: 'https://example.com',
        agents: [
          { id: 'agent-1', name: 'Agent 1', agentId: 'xxx' },
          { id: 'agent-2', name: 'Agent 2', agentId: 'yyy' },
          { id: 'agent-3', name: 'Agent 3', agentId: 'zzz' }
        ]
      });
      expect(config.agents).toHaveLength(3);
    });
  });

  describe('異常系', () => {
    test('orchestrationIDが未指定の場合エラー', () => {
      expect(() => {
        new Config({ hostURL: 'https://example.com' });
      }).toThrow('orchestrationID is required');
    });

    test('hostURLが未指定の場合エラー', () => {
      expect(() => {
        new Config({ orchestrationID: 'test-id' });
      }).toThrow('hostURL is required');
    });

    test('無効なURLの場合エラー', () => {
      expect(() => {
        new Config({
          orchestrationID: 'test-id',
          hostURL: 'invalid-url'
        });
      }).toThrow('Invalid URL');
    });

    test('agentsが配列でない場合エラー', () => {
      expect(() => {
        new Config({
          orchestrationID: 'test-id',
          hostURL: 'https://example.com',
          agents: 'not-an-array'
        });
      }).toThrow('agents must be an array');
    });
  });

  describe('バリデーション', () => {
    test('エージェントIDの重複を検出', () => {
      expect(() => {
        new Config({
          orchestrationID: 'test-id',
          hostURL: 'https://example.com',
          agents: [
            { id: 'agent-1', name: 'Agent 1', agentId: 'xxx' },
            { id: 'agent-1', name: 'Agent 2', agentId: 'yyy' }
          ]
        });
      }).toThrow('Duplicate agent ID: agent-1');
    });

    test('必須フィールドの欠落を検出', () => {
      expect(() => {
        new Config({
          orchestrationID: 'test-id',
          hostURL: 'https://example.com',
          agents: [
            { id: 'agent-1', name: 'Agent 1' } // agentId missing
          ]
        });
      }).toThrow('agentId is required');
    });
  });
});
```

---

### 1.2 HTTP通信 (HttpClient.js)

#### テストケース
```javascript
describe('HttpClient', () => {
  let client;
  let mockFetch;

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    client = new HttpClient({
      hostURL: 'https://api.example.com',
      token: 'test-token'
    });
  });

  describe('GET リクエスト', () => {
    test('正常にGETリクエストを送信できる', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'test' })
      });

      const result = await client.get('/api/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      );
      expect(result).toEqual({ data: 'test' });
    });

    test('クエリパラメータを追加できる', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

      await client.get('/api/test', { params: { id: '123', type: 'user' } });
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/test?id=123&type=user',
        expect.any(Object)
      );
    });
  });

  describe('POST リクエスト', () => {
    test('正常にPOSTリクエストを送信できる', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      const data = { message: 'Hello' };
      const result = await client.post('/api/messages', data);
      
      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('エラーハンドリング', () => {
    test('ネットワークエラーを適切に処理', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(client.get('/api/test')).rejects.toThrow('Network error');
    });

    test('HTTPエラーステータスを処理', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(client.get('/api/test')).rejects.toThrow('404 Not Found');
    });

    test('タイムアウトを処理', async () => {
      jest.useFakeTimers();
      
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 10000))
      );

      const promise = client.get('/api/test', { timeout: 1000 });
      
      jest.advanceTimersByTime(1000);
      
      await expect(promise).rejects.toThrow('Request timeout');
      
      jest.useRealTimers();
    });
  });

  describe('リトライ機能', () => {
    test('失敗時に自動リトライする', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: 'success' })
        });

      const result = await client.get('/api/test', { retry: 3 });
      
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result).toEqual({ data: 'success' });
    });
  });
});
```

---

### 1.3 AgentManager

#### テストケース
```javascript
describe('AgentManager', () => {
  let manager;

  beforeEach(() => {
    manager = new AgentManager();
  });

  describe('エージェント管理', () => {
    test('エージェントを追加できる', () => {
      const agent = {
        id: 'agent-1',
        name: 'Test Agent',
        agentId: 'xxx'
      };
      
      manager.addAgent(agent);
      
      expect(manager.getAgent('agent-1')).toEqual(agent);
      expect(manager.getAllAgents()).toHaveLength(1);
    });

    test('複数のエージェントを管理できる', () => {
      manager.addAgent({ id: 'agent-1', name: 'Agent 1', agentId: 'xxx' });
      manager.addAgent({ id: 'agent-2', name: 'Agent 2', agentId: 'yyy' });
      manager.addAgent({ id: 'agent-3', name: 'Agent 3', agentId: 'zzz' });
      
      expect(manager.getAllAgents()).toHaveLength(3);
    });

    test('エージェントを削除できる', () => {
      manager.addAgent({ id: 'agent-1', name: 'Agent 1', agentId: 'xxx' });
      manager.removeAgent('agent-1');
      
      expect(manager.getAgent('agent-1')).toBeNull();
      expect(manager.getAllAgents()).toHaveLength(0);
    });
  });

  describe('エージェント選択', () => {
    beforeEach(() => {
      manager.addAgent({ id: 'agent-1', name: 'Agent 1', agentId: 'xxx' });
      manager.addAgent({ id: 'agent-2', name: 'Agent 2', agentId: 'yyy' });
    });

    test('エージェントを選択できる', () => {
      manager.selectAgent('agent-1');
      
      expect(manager.getActiveAgent().id).toBe('agent-1');
    });

    test('エージェントを切り替えできる', () => {
      manager.selectAgent('agent-1');
      expect(manager.getActiveAgent().id).toBe('agent-1');
      
      manager.selectAgent('agent-2');
      expect(manager.getActiveAgent().id).toBe('agent-2');
    });

    test('存在しないエージェントを選択するとエラー', () => {
      expect(() => {
        manager.selectAgent('non-existent');
      }).toThrow('Agent not found: non-existent');
    });
  });

  describe('イベント', () => {
    test('エージェント選択時にイベントが発火', () => {
      const callback = jest.fn();
      manager.on('agentSelected', callback);
      
      manager.addAgent({ id: 'agent-1', name: 'Agent 1', agentId: 'xxx' });
      manager.selectAgent('agent-1');
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'agent-1' })
      );
    });
  });
});
```

---

## Phase 2: 統合テスト

### 2.1 エージェント切り替えフロー

#### テストシナリオ
```javascript
describe('エージェント切り替え統合テスト', () => {
  let client;
  let mockWebSocket;

  beforeEach(() => {
    // モックWebSocketの設定
    mockWebSocket = createMockWebSocket();
    
    client = new WxOClient({
      orchestrationID: 'test-id',
      hostURL: 'https://example.com',
      agents: [
        { id: 'sales', name: '営業', agentId: 'xxx' },
        { id: 'tech', name: '技術', agentId: 'yyy' }
      ]
    });
  });

  test('エージェントAからBへの切り替え', async () => {
    // エージェントAを選択
    await client.selectAgent('sales');
    expect(client.getActiveAgent().id).toBe('sales');
    
    // メッセージを送信
    await client.sendMessage('こんにちは');
    
    // エージェントBに切り替え
    await client.selectAgent('tech');
    expect(client.getActiveAgent().id).toBe('tech');
    
    // エージェントAに戻る
    await client.selectAgent('sales');
    
    // 履歴が保持されているか確認
    const history = client.getMessageHistory();
    expect(history).toContainEqual(
      expect.objectContaining({ text: 'こんにちは' })
    );
  });

  test('複数エージェントの同時セッション管理', async () => {
    // エージェントAでメッセージ送信
    await client.selectAgent('sales');
    await client.sendMessage('営業の質問');
    
    // エージェントBでメッセージ送信
    await client.selectAgent('tech');
    await client.sendMessage('技術の質問');
    
    // 各エージェントの履歴が独立しているか確認
    await client.selectAgent('sales');
    const salesHistory = client.getMessageHistory();
    expect(salesHistory).toHaveLength(1);
    expect(salesHistory[0].text).toBe('営業の質問');
    
    await client.selectAgent('tech');
    const techHistory = client.getMessageHistory();
    expect(techHistory).toHaveLength(1);
    expect(techHistory[0].text).toBe('技術の質問');
  });
});
```

---

### 2.2 フィードバック機能統合テスト

#### テストシナリオ
```javascript
describe('フィードバック機能統合テスト', () => {
  let client;
  let mockAPI;

  beforeEach(() => {
    mockAPI = createMockAPI();
    client = new WxOClient({
      orchestrationID: 'test-id',
      hostURL: 'https://example.com',
      agents: [{ id: 'agent-1', name: 'Test', agentId: 'xxx' }],
      feedback: { enabled: true }
    });
  });

  test('メッセージにフィードバックを送信', async () => {
    await client.selectAgent('agent-1');
    
    // メッセージを受信
    const message = await client.sendMessage('テスト');
    
    // フィードバックを送信
    await client.sendFeedback(message.id, 'positive');
    
    // APIが呼ばれたか確認
    expect(mockAPI.post).toHaveBeenCalledWith(
      '/api/v1/feedback',
      expect.objectContaining({
        messageId: message.id,
        feedback: 'positive'
      })
    );
  });

  test('コメント付きフィードバック', async () => {
    await client.selectAgent('agent-1');
    const message = await client.sendMessage('テスト');
    
    await client.sendFeedback(message.id, 'negative', {
      comment: '改善が必要です'
    });
    
    expect(mockAPI.post).toHaveBeenCalledWith(
      '/api/v1/feedback',
      expect.objectContaining({
        messageId: message.id,
        feedback: 'negative',
        comment: '改善が必要です'
      })
    );
  });
});
```

---

## Phase 3: E2Eテスト

### 3.1 ブラウザ自動化テスト (Playwright)

#### テストシナリオ
```javascript
const { test, expect } = require('@playwright/test');

test.describe('wxo-js-sdk E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080/examples/basic.html');
  });

  test('フローティングアイコンが表示される', async ({ page }) => {
    const floatingButton = page.locator('.wxo-floating-button');
    await expect(floatingButton).toBeVisible();
  });

  test('エージェント選択フロー', async ({ page }) => {
    // フローティングアイコンをクリック
    await page.click('.wxo-floating-button');
    
    // エージェント一覧が表示される
    const agentList = page.locator('.wxo-agent-list');
    await expect(agentList).toBeVisible();
    
    // エージェントを選択
    await page.click('[data-agent-id="sales"]');
    
    // チャットウィンドウが開く
    const chatWindow = page.locator('.wxo-chat-window');
    await expect(chatWindow).toBeVisible();
    
    // ヘッダーにエージェント名が表示される
    const header = page.locator('.wxo-chat-header');
    await expect(header).toContainText('営業サポート');
  });

  test('メッセージ送信フロー', async ({ page }) => {
    // チャットを開く
    await page.click('.wxo-floating-button');
    await page.click('[data-agent-id="sales"]');
    
    // メッセージを入力
    await page.fill('.wxo-message-input', 'こんにちは');
    await page.click('.wxo-send-button');
    
    // メッセージが表示される
    const message = page.locator('.wxo-message-user').last();
    await expect(message).toContainText('こんにちは');
  });

  test('フィードバックボタンの動作', async ({ page }) => {
    // チャットを開いてメッセージを送信
    await page.click('.wxo-floating-button');
    await page.click('[data-agent-id="sales"]');
    await page.fill('.wxo-message-input', 'テスト');
    await page.click('.wxo-send-button');
    
    // エージェントの返信を待つ
    await page.waitForSelector('.wxo-message-agent');
    
    // フィードバックボタンをクリック
    await page.click('.wxo-feedback-positive');
    
    // 確認メッセージが表示される
    const thanks = page.locator('.wxo-feedback-thanks');
    await expect(thanks).toBeVisible();
  });

  test('ウィンドウリサイズ', async ({ page }) => {
    // チャットを開く
    await page.click('.wxo-floating-button');
    await page.click('[data-agent-id="sales"]');
    
    // 初期サイズを確認
    const chatWindow = page.locator('.wxo-chat-window');
    const initialWidth = await chatWindow.evaluate(el => el.offsetWidth);
    expect(initialWidth).toBe(400);
    
    // リサイズボタンをクリック
    await page.click('.wxo-resize-button');
    
    // サイズが変更されたか確認
    const newWidth = await chatWindow.evaluate(el => el.offsetWidth);
    expect(newWidth).toBe(600);
  });

  test('エージェント切り替えで履歴が保持される', async ({ page }) => {
    // エージェントAでメッセージ送信
    await page.click('.wxo-floating-button');
    await page.click('[data-agent-id="sales"]');
    await page.fill('.wxo-message-input', '営業の質問');
    await page.click('.wxo-send-button');
    
    // 最小化
    await page.click('.wxo-minimize-button');
    
    // エージェントBに切り替え
    await page.click('[data-agent-id="tech"]');
    await page.fill('.wxo-message-input', '技術の質問');
    await page.click('.wxo-send-button');
    
    // エージェントAに戻る
    await page.click('.wxo-minimize-button');
    await page.click('[data-agent-id="sales"]');
    
    // 履歴が保持されているか確認
    const messages = page.locator('.wxo-message-user');
    await expect(messages.first()).toContainText('営業の質問');
  });
});
```

---

## Phase 4: 手動テスト

### 4.1 視覚的確認チェックリスト

#### UI/UXテスト
- [ ] フローティングアイコンが適切な位置に表示される
- [ ] アイコンのホバー効果が動作する
- [ ] エージェント一覧の展開アニメーションが滑らか
- [ ] 各エージェントのアイコンとラベルが正しく表示される
- [ ] チャットウィンドウのデザインが仕様通り
- [ ] メッセージの表示が読みやすい
- [ ] フィードバックボタンが適切に配置されている
- [ ] リサイズアニメーションが滑らか
- [ ] レスポンシブデザインが機能する

#### ブラウザ互換性
- [ ] Chrome (最新版)
- [ ] Firefox (最新版)
- [ ] Safari (最新版)
- [ ] Edge (最新版)
- [ ] Chrome Mobile
- [ ] Safari Mobile

#### デバイステスト
- [ ] デスクトップ (1920x1080)
- [ ] ラップトップ (1366x768)
- [ ] タブレット (768x1024)
- [ ] モバイル (375x667)
- [ ] モバイル (414x896)

---

### 4.2 ユーザビリティテスト

#### テストシナリオ
1. **初回ユーザー**
   - SDKの初期設定ができるか
   - ドキュメントを見て実装できるか
   - エラーメッセージが理解できるか

2. **エンドユーザー**
   - エージェント選択が直感的か
   - チャット操作が快適か
   - フィードバック送信が簡単か

3. **管理者**
   - 設定ファイルの編集が容易か
   - エージェントの追加が簡単か
   - トラブルシューティングができるか

---

## Phase 5: パフォーマンステスト

### 5.1 負荷テスト

#### テストケース
```javascript
describe('パフォーマンステスト', () => {
  test('100メッセージの送受信', async () => {
    const startTime = Date.now();
    
    for (let i = 0; i < 100; i++) {
      await client.sendMessage(`メッセージ ${i}`);
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // 平均レスポンスタイム < 500ms
    expect(duration / 100).toBeLessThan(500);
  });

  test('メモリリークチェック', async () => {
    const initialMemory = performance.memory.usedJSHeapSize;
    
    // 1000回のエージェント切り替え
    for (let i = 0; i < 1000; i++) {
      await client.selectAgent('sales');
      await client.selectAgent('tech');
    }
    
    const finalMemory = performance.memory.usedJSHeapSize;
    const memoryIncrease = finalMemory - initialMemory;
    
    // メモリ増加 < 10MB
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });
});
```

---

## テスト実行計画

### 開発中
- ユニットテスト: 各機能実装後に実行
- 統合テスト: モジュール統合時に実行

### リリース前
- すべてのユニットテスト
- すべての統合テスト
- E2Eテスト (主要シナリオ)
- 手動テスト (視覚的確認)
- パフォーマンステスト

### リリース後
- 定期的な回帰テスト
- ユーザーフィードバックに基づくテスト追加

---

## テストツール

### 推奨ツール
- **ユニットテスト**: Jest
- **E2Eテスト**: Playwright
- **カバレッジ**: Jest Coverage
- **パフォーマンス**: Lighthouse, Chrome DevTools

### セットアップ
```bash
# テストツールのインストール
npm install --save-dev jest @playwright/test

# テスト実行
npm test                    # ユニットテスト
npm run test:e2e           # E2Eテスト
npm run test:coverage      # カバレッジレポート
```

---

## 成功基準

### カバレッジ目標
- ユニットテスト: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス100%

### 品質基準
- すべてのテストがパスする
- パフォーマンス基準を満たす
- セキュリティテストをクリアする
- ブラウザ互換性を確認済み

---

## 更新履歴
- 2026-04-03: 初版作成