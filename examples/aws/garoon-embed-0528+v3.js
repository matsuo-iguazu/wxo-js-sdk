(function () {
  window.wxOConfiguration = {
    orchestrationID: "20260406-0629-1918-302e-af2f73dfb5c1_20260526-0600-4463-4045-23eb24e20465",
    hostURL: "https://ap-southeast-1.dl.watson-orchestrate.ibm.com",
    defaultLocale: 'ja', // ウェルカムメッセージとクイックプロンプトの翻訳言語
    agents: [
//      {
//        id: 'houmu01',
//        name: '法務AIエージェント（法務関連の質問受付）',
//        agentId: '4458e8a4-6bf7-4d8a-8b7d-2a16256b03d0',
//        agentEnvironmentId: '319a14a3-3d14-46db-9ff6-848a889ddcb4'
//      },
//      {
//        id: 'houmu02',
//        name: '法務AIエージェント（お客様向け契約用）',
//        agentId: '2e804a47-db6f-4c25-b642-e63945739e4a',
//        agentEnvironmentId: 'c4cc2c9e-ccc3-4279-b243-82fdaae63ded'
//      },
//      {
//        id: 'houmu03',
//        name: '法務AIエージェント（仕入先向け契約用）',
//        agentId: 'd08b013d-ce09-4b50-96bf-3817ce5ba16a',
//        agentEnvironmentId: 'df778936-2340-4fae-91fb-5429e9b04667'
//      },
      {
        id: 'houmu04',
        name: '法務エージェント（お客様向け回答集）',
        agentId: 'a05c07e8-1dda-4dca-ba2c-d180a7b0b1e3',
        agentEnvironmentId: '768c2b7c-e60d-42b1-a947-d872589f6fa0'
      },
      {
        id: 'houmu05',
        name: '法務AIエージェント（V3-仕入先向け契約用）',
        agentId: 'e6d5714e-92a8-44bf-a752-51fc69314843',
        agentEnvironmentId: '66d7ce9f-57bf-4a84-a798-8f2e9f51c522'
      }
    ],
    features: {
      feedback: true,
      multiAgent: true
    },
    feedbackWebhookUrl: 'https://insert-db2.27zcpgifragj.us-south.codeengine.appdomain.cloud/',
    feedbackUserInfo: garoon.base.user.getLoginUser(),
    feedbackOptions: {
      positive: {
        showDetails: false,  // trueにするとカテゴリ/コメント入力パネルを表示
        categories: ['役立った', '正確', 'わかりやすい', 'その他'],
        disclaimer: ''
      },
      negative: {
        showDetails: true,
        categories: ['正しくない', '未完了', '長すぎます', '関係ない', 'その他'],
        disclaimer: 'フィードバックに機密情報や個人を特定できる情報を含めないようにしてください'
      }
    },
    // escalationWebhookUrl: 'https://...webhook.office.com/...',  // Teams Incoming Webhook URL
    // escalationTriggerPhrases: ['法務担当に質問してください'],    // 「法務に通知」ボタンを表示するフレーズ
    debug: false
  };

  function loadScript(src, onload) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = onload;
    document.head.appendChild(s);
  }

  function init() {
    loadScript('https://cdn.jsdelivr.net/npm/marked/marked.min.js', function () {
      loadScript('https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js', function () {
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
