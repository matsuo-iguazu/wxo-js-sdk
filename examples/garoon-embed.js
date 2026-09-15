(function () {
  // ─── 設定 ───────────────────────────────────────────────────────────────────
  window.wxOConfiguration = {
    // 必須: wxO コンソールの「埋め込み」設定から取得した値をそのまま使用
    orchestrationID: 'YOUR_ORCHESTRATION_ID',
    hostURL: 'https://api.REGION.dl.watson-orchestrate.ibm.com',
    crn: 'YOUR_CRN',

    agents: [
      {
        id: 'agent1',                                    // SDK内部で使うID（任意の文字列）
        name: 'AIアシスタント',                           // チャット画面に表示される名称
        // icon: '🤖',                                   // 任意: エージェントアイコン絵文字
        agentId: 'YOUR_AGENT_ID',                        // wxO コンソールのエージェントID
        agentEnvironmentId: 'YOUR_AGENT_ENVIRONMENT_ID', // wxO コンソールの環境ID

        // エスカレーション通知（任意）: 設定するとチャット内に通知ボタンが表示される
        // escalationWebhookUrl: 'https://YOUR_TEAMS_WEBHOOK_URL',
        // escalationTriggerPhrases: ['トリガーフレーズをここに'],

        // 全応答の自動送信（任意）: 全AIの回答を指定チャネルに送信する
        // allSendWebhookUrl: 'https://YOUR_TEAMS_WEBHOOK_URL',

        // 条項アシスト（任意）: 契約書データを参照しながら対話する機能
        // clauseAssistData: window.wxoContractData,   // 別途読み込んだ契約書データ
        // clauseAssistAutoOpen: true,                  // 起動時に自動展開（デフォルト: true）
      }
    ],

    // フィードバック機能（任意）
    // feedbackWebhookUrl: 'https://YOUR_WEBHOOK_URL',   // Webhook送信（Code Engine等）
    // supabaseUrl: 'https://xxxx.supabase.co',          // または Supabase
    // supabaseAnonKey: 'YOUR_ANON_KEY',
    // feedbackUserInfo: garoon.base.user.getLoginUser(), // ペイロードに含めるユーザー情報
    feedbackOptions: {
      positive: {
        showDetails: false,
        categories: ['役立った', '正確', 'わかりやすい', 'その他'],
        disclaimer: ''
      },
      negative: {
        showDetails: true,
        categories: ['正しくない', '未完了', '長すぎます', '関係ない', 'その他'],
        disclaimer: 'フィードバックに機密情報や個人を特定できる情報を含めないようにしてください'
      }
    },

    debug: false
  };

  // ─── スクリプトを順番にロードして初期化 ─────────────────────────────────────
  function loadScript(src, onload) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    document.head.appendChild(s);
  }

  function init() {
    // marked.js（Markdown レンダリング用・推奨）
    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', function () {
      // DOMPurify（XSS 対策・推奨）
      loadScript('https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js', function () {
        // wxo-js-sdk 本体
        loadScript('https://matsuo-iguazu.github.io/wxo-js-sdk/dist/wxo-sdk.min.js', function () {
          wxoLoader.init().catch(function (e) { console.error('[wxo]', e); });
        });
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
