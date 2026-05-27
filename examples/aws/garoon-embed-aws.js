  window.wxOConfiguration = {
    orchestrationID: "20260406-0629-1918-302e-af2f73dfb5c1_20260526-0600-4463-4045-23eb24e20465",
    hostURL: "https://ap-southeast-1.dl.watson-orchestrate.ibm.com",
    rootElementID: "root",
    chatOptions: {
        agentId: "e6d5714e-92a8-44bf-a752-51fc69314843", 
        agentEnvironmentId: "66d7ce9f-57bf-4a84-a798-8f2e9f51c522",
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
