(function () {
  // ─── 設定 ───────────────────────────────────────────────────────────────────
  window.wxOConfiguration = {
    orchestrationID: 'YOUR_ORCHESTRATION_ID',
    hostURL: 'https://us-south.watson-orchestrate.cloud.ibm.com',
    region: 'us-south',
    deploymentPlatform: 'ibmcloud',
    crn: 'YOUR_CRN',
    agents: [
      {
        id: 'agent1',
        name: 'AIアシスタント',
        agentId: 'YOUR_AGENT_ID',
        agentEnvironmentId: 'YOUR_AGENT_ENVIRONMENT_ID'
      }
    ],
    features: {
      feedback: true,
      multiAgent: true
    },
    feedbackWebhookUrl: 'YOUR_CODE_ENGINE_URL',  // フィードバック保存先 (Code Engine)
    feedbackUserInfo: garoon.base.user.getLoginUser(),  // Garoonユーザー情報をペイロードに含める
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
    // marked.js (エージェント応答のMarkdownレンダリング用・任意)
    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', function () {
      // wxo-js-sdk 本体
      loadScript('https://matsuo-iguazu.github.io/wxo-js-sdk/dist/wxo-sdk.min.js', function () {
        wxoLoader.init().catch(function (e) { console.error('[wxo]', e); });
      });
    });
  }

  // DOMの準備ができてから実行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
