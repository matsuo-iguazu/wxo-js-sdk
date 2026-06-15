function asyncGeneratorStep(n, t, e, r, o, a, c) {
  try {
    var i = n[a](c),
      u = i.value;
  } catch (n) {
    return void e(n);
  }
  i.done ? t(u) : Promise.resolve(u).then(r, o);
}
function _asyncToGenerator(n) {
  return function () {
    var t = this,
      e = arguments;
    return new Promise(function (r, o) {
      var a = n.apply(t, e);
      function _next(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
      }
      function _throw(n) {
        asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
      }
      _next(void 0);
    });
  };
}
function _defineProperty(e, r, t) {
  return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
    value: t,
    enumerable: true,
    configurable: true,
    writable: true
  }) : e[r] = t, e;
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
function _objectWithoutProperties(e, t) {
  if (null == e) return {};
  var o,
    r,
    i = _objectWithoutPropertiesLoose(e, t);
  if (Object.getOwnPropertySymbols) {
    var n = Object.getOwnPropertySymbols(e);
    for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]);
  }
  return i;
}
function _objectWithoutPropertiesLoose(r, e) {
  if (null == r) return {};
  var t = {};
  for (var n in r) if ({}.hasOwnProperty.call(r, n)) {
    if (-1 !== e.indexOf(n)) continue;
    t[n] = r[n];
  }
  return t;
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}

/**
 * Configuration management class for wxo-js-sdk
 * Handles validation and access to SDK configuration
 */
class Config {
  constructor() {
    this.config = null;
    this.defaultConfig = {
      orchestrationID: null,
      hostURL: null,
      region: 'us-south',
      deploymentPlatform: 'ibmcloud',
      crn: null,
      rootElementID: 'root',
      agents: [],
      theme: {
        primaryColor: '#0077C8',
        fontFamily: "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', -apple-system, sans-serif",
        borderRadius: '8px'
      },
      ui: {
        position: 'bottom-right',
        width: '400px',
        height: '600px',
        expandedWidth: '800px',
        expandedHeight: '800px',
        showAgentSelector: true,
        enableResize: true
      },
      features: {
        feedback: true,
        multiAgent: true,
        fileUpload: false,
        voiceInput: false
      },
      defaultLocale: null,
      // Locale for welcome message / starter prompts (e.g. 'ja', 'en'). Falls back to browser language.
      feedbackWebhookUrl: null,
      // POST destination for feedback data (optional)
      feedbackUserInfo: null,
      // User info object to spread into feedback payload (optional)
      feedbackOptions: {
        positive: {
          showDetails: true,
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
  }

  /**
   * Initialize configuration from window.wxOConfiguration
   * @throws {Error} If required configuration is missing or invalid
   */
  init() {
    if (!window.wxOConfiguration) {
      throw new Error('wxOConfiguration not found. Please define window.wxOConfiguration before calling init()');
    }

    // Deep merge user config with defaults
    this.config = this._mergeConfig(this.defaultConfig, window.wxOConfiguration);

    // Validate required fields
    this._validate();
    if (this.config.debug) {
      console.log('[wxo-sdk] Configuration initialized:', this.config);
    }
  }

  /**
   * Deep merge two configuration objects
   * @private
   */
  _mergeConfig(defaults, userConfig) {
    var merged = _objectSpread2({}, defaults);
    for (var key in userConfig) {
      if (userConfig[key] !== null && typeof userConfig[key] === 'object' && !Array.isArray(userConfig[key])) {
        merged[key] = this._mergeConfig(defaults[key] || {}, userConfig[key]);
      } else {
        merged[key] = userConfig[key];
      }
    }
    return merged;
  }

  /**
   * Validate required configuration fields
   * @private
   * @throws {Error} If validation fails
   */
  _validate() {
    var required = ['orchestrationID', 'hostURL'];
    var missing = required.filter(field => !this.config[field]);
    if (missing.length > 0) {
      throw new Error("Missing required configuration: ".concat(missing.join(', ')));
    }

    // Validate hostURL format
    try {
      new URL(this.config.hostURL);
    } catch (e) {
      throw new Error("Invalid hostURL: ".concat(this.config.hostURL));
    }

    // Validate agents array if multiAgent is enabled
    if (this.config.features.multiAgent) {
      if (!Array.isArray(this.config.agents) || this.config.agents.length === 0) {
        throw new Error('agents array is required when multiAgent feature is enabled');
      }

      // Validate each agent configuration
      // Based on IBM watsonx Orchestrate requirements
      this.config.agents.forEach((agent, index) => {
        var agentRequired = ['id', 'name', 'agentId'];
        var agentMissing = agentRequired.filter(field => !agent[field]);
        if (agentMissing.length > 0) {
          throw new Error("Agent at index ".concat(index, " is missing required fields: ").concat(agentMissing.join(', ')));
        }

        // agentEnvironmentId is required for Live environment
        if (!agent.agentEnvironmentId) {
          console.warn("[wxo-sdk] Agent at index ".concat(index, " is missing agentEnvironmentId (required for Live environment)"));
        }
      });
    }
  }

  /**
   * Get configuration value by key
   * @param {string} key - Configuration key (supports dot notation)
   * @returns {*} Configuration value
   */
  get(key) {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call init() first.');
    }
    var keys = key.split('.');
    var value = this.config;
    for (var k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }
    return value;
  }

  /**
   * Get all configuration
   * @returns {Object} Complete configuration object
   */
  getAll() {
    if (!this.config) {
      throw new Error('Configuration not initialized. Call init() first.');
    }
    return _objectSpread2({}, this.config);
  }

  /**
   * Get agent configuration by ID
   * @param {string} agentId - Agent ID
   * @returns {Object|null} Agent configuration or null if not found
   */
  getAgent(agentId) {
    if (!this.config || !this.config.agents) {
      return null;
    }
    return this.config.agents.find(agent => agent.id === agentId) || null;
  }

  /**
   * Get all agents
   * @returns {Array} Array of agent configurations
   */
  getAgents() {
    var _this$config;
    return ((_this$config = this.config) === null || _this$config === void 0 ? void 0 : _this$config.agents) || [];
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Feature name
   * @returns {boolean} True if feature is enabled
   */
  isFeatureEnabled(featureName) {
    var _this$config2;
    return ((_this$config2 = this.config) === null || _this$config2 === void 0 || (_this$config2 = _this$config2.features) === null || _this$config2 === void 0 ? void 0 : _this$config2[featureName]) === true;
  }

  /**
   * Get the feedback webhook URL (if configured)
   * @returns {string|null}
   */
  getFeedbackWebhookUrl() {
    var _this$config3;
    return ((_this$config3 = this.config) === null || _this$config3 === void 0 ? void 0 : _this$config3.feedbackWebhookUrl) || null;
  }

  /**
   * Get feedback user info (spread into payload)
   * @returns {Object|null}
   */
  getFeedbackUserInfo() {
    var _this$config4;
    return ((_this$config4 = this.config) === null || _this$config4 === void 0 ? void 0 : _this$config4.feedbackUserInfo) || null;
  }

  /**
   * Get feedback options (categories, showDetails, disclaimer per positive/negative)
   * @returns {Object}
   */
  getFeedbackOptions() {
    var _this$config5;
    return ((_this$config5 = this.config) === null || _this$config5 === void 0 ? void 0 : _this$config5.feedbackOptions) || null;
  }

  /**
   * Get locale for chat starter settings (welcome message / prompts).
   * Priority: config.defaultLocale → navigator.language → null
   * @returns {string|null}
   */
  getLocale() {
    var _this$config6;
    return ((_this$config6 = this.config) === null || _this$config6 === void 0 ? void 0 : _this$config6.defaultLocale) || (typeof navigator !== 'undefined' ? navigator.language : null) || null;
  }

  /**
   * Check if debug mode is enabled
   * @returns {boolean} True if debug mode is enabled
   */
  isDebug() {
    var _this$config7;
    return ((_this$config7 = this.config) === null || _this$config7 === void 0 ? void 0 : _this$config7.debug) === true;
  }
}

// Export singleton instance
var Config$1 = new Config();

// Made with Bob

var _excluded = ["body", "headers"];
/**
 * HTTP client for watsonx Orchestrate API communication
 * Uses IBM custom headers for authentication (no Bearer token required)
 */
class HttpClient {
  constructor(config) {
    this.config = config;
    this.baseURL = config.get('hostURL');
    this.baseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };
    this.ibmHeaders = {};
  }

  /**
   * Set IBM authentication headers
   * @param {string} userId - Anonymous user ID (e.g. "anonymous-{uuid}")
   */
  setIBMHeaders(userId) {
    this.ibmHeaders = {
      'x-ibm-wo-orchestrate-id': this.config.get('orchestrationID'),
      'x-ibm-wo-user-id': userId
    };
    var crn = this.config.get('crn');
    if (crn) {
      this.ibmHeaders['x-ibm-wo-crn'] = crn;
    }
  }

  /**
   * Get all current headers (base + IBM)
   * @returns {Object}
   */
  getHeaders() {
    var extra = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return _objectSpread2(_objectSpread2(_objectSpread2({}, this.baseHeaders), this.ibmHeaders), extra);
  }

  /**
   * Build full URL from path
   * @private
   */
  _buildURL(path) {
    var base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
    var p = path.startsWith('/') ? path : "/".concat(path);
    return "".concat(base).concat(p);
  }

  /**
   * Make HTTP request
   * @private
   */
  _request(method, path) {
    var _arguments = arguments,
      _this = this;
    return _asyncToGenerator(function* () {
      var options = _arguments.length > 2 && _arguments[2] !== undefined ? _arguments[2] : {};
      var url = _this._buildURL(path);
      var {
          body,
          headers = {}
        } = options,
        rest = _objectWithoutProperties(options, _excluded);
      var requestConfig = _objectSpread2({
        method,
        headers: _this.getHeaders(headers)
      }, rest);
      if (body !== undefined) {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      if (_this.config.isDebug()) {
        console.log("[wxo-sdk] ".concat(method, " ").concat(url), requestConfig);
      }
      var response = yield fetch(url, requestConfig);
      var contentType = response.headers.get('content-type') || '';
      var data;
      if (contentType.includes('application/json')) {
        data = yield response.json();
      } else {
        data = yield response.text();
      }
      if (!response.ok) {
        var error = new Error(data && data.message || "HTTP ".concat(response.status, ": ").concat(response.statusText));
        error.status = response.status;
        error.response = data;
        throw error;
      }
      if (_this.config.isDebug()) {
        console.log("[wxo-sdk] Response:", data);
      }
      return data;
    })();
  }

  /**
   * Make a streaming POST request, yielding SSE/chunk lines
   * @param {string} path
   * @param {Object} body
   * @param {Object} options
   * @returns {Response} raw fetch Response for stream reading
   */
  stream(path, body) {
    var _arguments2 = arguments,
      _this2 = this;
    return _asyncToGenerator(function* () {
      var options = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : {};
      var url = _this2._buildURL(path);
      var {
        headers = {}
      } = options;
      var requestConfig = {
        method: 'POST',
        headers: _this2.getHeaders(headers),
        body: JSON.stringify(body)
      };
      if (_this2.config.isDebug()) {
        console.log("[wxo-sdk] STREAM POST ".concat(url), requestConfig);
      }
      var response = yield fetch(url, requestConfig);
      if (!response.ok) {
        var text = yield response.text();
        var error = new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
        error.status = response.status;
        error.response = text;
        throw error;
      }
      return response;
    })();
  }
  get(path) {
    var _arguments3 = arguments,
      _this3 = this;
    return _asyncToGenerator(function* () {
      var options = _arguments3.length > 1 && _arguments3[1] !== undefined ? _arguments3[1] : {};
      return _this3._request('GET', path, options);
    })();
  }
  post(path, body) {
    var _arguments4 = arguments,
      _this4 = this;
    return _asyncToGenerator(function* () {
      var options = _arguments4.length > 2 && _arguments4[2] !== undefined ? _arguments4[2] : {};
      return _this4._request('POST', path, _objectSpread2(_objectSpread2({}, options), {}, {
        body
      }));
    })();
  }
  patch(path, body) {
    var _arguments5 = arguments,
      _this5 = this;
    return _asyncToGenerator(function* () {
      var options = _arguments5.length > 2 && _arguments5[2] !== undefined ? _arguments5[2] : {};
      return _this5._request('PATCH', path, _objectSpread2(_objectSpread2({}, options), {}, {
        body
      }));
    })();
  }
  delete(path) {
    var _arguments6 = arguments,
      _this6 = this;
    return _asyncToGenerator(function* () {
      var options = _arguments6.length > 1 && _arguments6[1] !== undefined ? _arguments6[1] : {};
      return _this6._request('DELETE', path, options);
    })();
  }
}

// Made with Bob

/**
 * Authentication manager for watsonx Orchestrate
 * Uses anonymous user ID - no token authentication required
 */
class AuthManager {
  constructor(config) {
    this.config = config;
    this.userId = null;
  }

  /**
   * Initialize authentication
   * Generates an anonymous user ID
   * @returns {Promise<void>}
   */
  init() {
    var _this = this;
    return _asyncToGenerator(function* () {
      _this.userId = "anonymous-".concat(_this._generateUUID());
      if (_this.config.isDebug()) {
        console.log('[wxo-sdk] Anonymous user ID generated:', _this.userId);
      }
    })();
  }

  /**
   * Get the anonymous user ID
   * @returns {string|null}
   */
  getUserId() {
    return this.userId;
  }

  /**
   * Generate a UUID v4
   * @private
   * @returns {string}
   */
  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Destroy and cleanup
   */
  destroy() {
    this.userId = null;
  }
}

// Made with Bob

/**
 * Chat manager for handling chat sessions and message flow
 *
 * API Flow (discovered via DevTools):
 * 1. First message sent → POST /mfe_home_archer/api/v1/threads  (create thread)
 * 2. Every message     → POST /mfe_home_archer/api/v1/orchestrate/runs?stream=true&...
 * 3. Session end       → PATCH /mfe_home_archer/api/v1/threads/{thread_id}
 *
 * Authentication: IBM custom headers only (no Bearer token)
 *   x-ibm-wo-orchestrate-id, x-ibm-wo-user-id, x-ibm-wo-crn
 */
class ChatManager {
  constructor(config, httpClient) {
    var socketClient = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    this.config = config;
    this.httpClient = httpClient;
    this.socketClient = socketClient;
    this.sessions = new Map(); // agentId -> session data
    this.currentAgentId = null;
    this.messageHandlers = [];
    this.deltaHandlers = [];
    this.errorHandlers = [];
  }

  /**
   * Initialize chat manager (no-op, kept for API compatibility)
   */
  init() {
    var _this = this;
    return _asyncToGenerator(function* () {
      if (_this.config.isDebug()) {
        console.log('[wxo-sdk] ChatManager initialized');
      }
    })();
  }

  /**
   * Switch to a different agent (creates session object, no API call yet)
   * @param {string} agentId
   * @returns {Object} session data
   */
  switchAgent(agentId) {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      var agent = _this2.config.getAgent(agentId);
      if (!agent) {
        throw new Error("Agent not found: ".concat(agentId));
      }
      _this2.currentAgentId = agentId;
      if (!_this2.sessions.has(agentId)) {
        // Session will be lazily created on first message
        _this2.sessions.set(agentId, {
          agentId,
          agent,
          threadId: null,
          messages: [],
          isActive: true
        });
      }
      if (_this2.config.isDebug()) {
        console.log("[wxo-sdk] Switched to agent: ".concat(agentId));
      }
      return _this2.sessions.get(agentId);
    })();
  }

  /**
   * Send message to current agent
   * Creates thread on first message, then posts to /orchestrate/runs
   * @param {string} text
   * @param {Object} options
   * @returns {Promise<Object>} user message object
   */
  sendMessage(text) {
    var _this3 = this;
    return _asyncToGenerator(function* () {
      if (!_this3.currentAgentId) {
        throw new Error('No active agent. Call startChat() first.');
      }
      var session = _this3.sessions.get(_this3.currentAgentId);
      if (!session) {
        throw new Error("No session for agent: ".concat(_this3.currentAgentId));
      }

      // Create thread on first message (lazy initialization)
      if (!session.threadId) {
        yield _this3._createThread(session, text);
      }

      // Build user message
      var userMessage = {
        id: _this3._generateMessageId(),
        text,
        sender: 'user',
        timestamp: Date.now()
      };
      session.messages.push(userMessage);
      session.lastUserMessage = text; // track for feedback payload
      // Note: user messages are returned to the caller for display.
      // onMessage handlers are reserved for agent responses only.

      try {
        yield _this3._sendToRuns(session, text);
      } catch (error) {
        console.error('[wxo-sdk] Failed to send message:', error);
        _this3._handleError(error);
        throw error;
      }
      return userMessage;
    })();
  }

  /**
   * Create a thread for the session
   * POST /mfe_home_archer/api/v1/threads
   * @private
   */
  _createThread(session, firstMessageText) {
    var _this4 = this;
    return _asyncToGenerator(function* () {
      var path = '/mfe_home_archer/api/v1/threads';
      var body = {
        title: firstMessageText,
        agent_id: session.agent.agentId
      };
      if (_this4.config.isDebug()) {
        console.log('[wxo-sdk] Creating thread:', body);
      }
      var response = yield _this4.httpClient.post(path, body);
      session.threadId = response.thread_id;
      if (_this4.config.isDebug()) {
        console.log('[wxo-sdk] Thread created:', session.threadId);
      }
    })();
  }

  /**
   * Send message via orchestrate/runs (streaming)
   * POST /mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000
   * @private
   */
  _sendToRuns(session, text) {
    var _this5 = this;
    return _asyncToGenerator(function* () {
      var path = '/mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000';
      var body = {
        message: {
          role: 'user',
          content: text,
          additional_properties: {}
        },
        context: {},
        agent_id: session.agent.agentId,
        thread_id: session.threadId,
        environment_id: session.agent.agentEnvironmentId || ''
      };
      if (_this5.config.isDebug()) {
        console.log('[wxo-sdk] Sending to runs:', body);
      }

      // Pre-register WS buffer BEFORE HTTP request to avoid missing early events.
      // If the HTTP stream returns a "flow started" notification, we switch to consuming
      // the WS buffer for the actual response. Simple agents produce no WS events so the
      // buffer stays empty and is cleaned up after HTTP streaming completes.
      var wsBuffer = _this5.socketClient && _this5.socketClient.isConnected() ? _this5._bufferWebSocketEvents(session) : null;
      var response = yield _this5.httpClient.stream(path, body);
      yield _this5._handleStreamResponse(response, session, wsBuffer);
    })();
  }

  /**
   * Buffer WebSocket WORKER_MESSAGE events for a session before HTTP response arrives.
   * Returns a handle with consume(onEvent) and cleanup().
   * @private
   */
  _bufferWebSocketEvents(session) {
    var buffered = [];
    var liveConsumer = null;
    var handler = workerMsg => {
      var _workerMsg$data;
      var threadId = ((_workerMsg$data = workerMsg.data) === null || _workerMsg$data === void 0 ? void 0 : _workerMsg$data.thread_id) || workerMsg.thread_id;
      if (threadId && threadId !== session.threadId) return;
      if (!workerMsg.event) return; // skip tenant-notification messages

      if (liveConsumer) {
        liveConsumer(workerMsg);
      } else {
        buffered.push(workerMsg);
      }
    };
    this.socketClient.onWorkerMessage(handler);
    return {
      consume: onEvent => {
        buffered.splice(0).forEach(e => onEvent(e));
        liveConsumer = onEvent;
      },
      cleanup: () => {
        this.socketClient.removeWorkerMessageHandler(handler);
        buffered.length = 0;
        liveConsumer = null;
      }
    };
  }

  /**
   * Consume buffered + live WebSocket events and stream them as agent response.
   * Called when HTTP stream detects a flow-started notification.
   * @private
   */
  _consumeFromWebSocketBuffer(wsBuffer, session, messageId) {
    var _this6 = this;
    return _asyncToGenerator(function* () {
      var agentText = ''; // accumulated silently as fallback if REST fails

      return new Promise(resolve => {
        wsBuffer.consume(workerMsg => {
          var chunk = _this6._extractTextFromEvent(workerMsg);
          if (chunk) {
            agentText += chunk; // no UI emission — display after REST fetch
          }
          if (workerMsg.event === 'done') {
            wsBuffer.cleanup();

            // WebSocket delivery has a server-side character corruption bug.
            // Fetch the authoritative stored text via REST, then display all at once.
            _asyncToGenerator(function* () {
              var finalText = agentText;
              try {
                var messages = yield _this6.httpClient.get("/mfe_home_archer/api/v1/threads/".concat(session.threadId, "/messages"));
                var agentMessages = (messages || []).filter(m => {
                  var _m$content;
                  return m.role === 'assistant' && ((_m$content = m.content) === null || _m$content === void 0 ? void 0 : _m$content.some(c => {
                    var _c$text;
                    return c.response_type === 'text' && !((_c$text = c.text) !== null && _c$text !== void 0 && _c$text.toLowerCase().includes('new flow has started'));
                  }));
                });
                var lastMsg = agentMessages.at(-1);
                if (lastMsg !== null && lastMsg !== void 0 && lastMsg.content) {
                  finalText = lastMsg.content.filter(c => {
                    var _c$text2;
                    return c.response_type === 'text' && !((_c$text2 = c.text) !== null && _c$text2 !== void 0 && _c$text2.toLowerCase().includes('new flow has started'));
                  }).map(c => c.text || '').join('');
                }
              } catch (e) {
                if (_this6.config.isDebug()) {
                  console.warn('[wxo-sdk] REST message fetch failed, using WS text:', e.message);
                }
              }

              // Display full text at once: create bubble then immediately finalize
              _this6._triggerDeltaHandlers({
                messageId,
                text: '',
                isFirst: true,
                isDone: false
              });
              _this6._triggerDeltaHandlers({
                messageId,
                text: '',
                isFirst: false,
                isDone: true,
                fullText: finalText
              });
              if (finalText) {
                var agentMessage = {
                  id: messageId,
                  text: finalText,
                  sender: 'agent',
                  timestamp: Date.now()
                };
                session.messages.push(agentMessage);
                _this6._triggerMessageHandlers(agentMessage);
              }
              if (_this6.config.isDebug()) {
                console.log('[wxo-sdk] Flow agent response:', finalText);
              }
              resolve();
            })();
          }
        });
      });
    })();
  }

  /**
   * Handle streaming response (SSE or chunked).
   * If wsBuffer is provided and a flow-started notification is detected in the HTTP stream,
   * switches to consuming WebSocket events for the actual agent response.
   * @private
   */
  _handleStreamResponse(response, session) {
    var _arguments2 = arguments,
      _this7 = this;
    return _asyncToGenerator(function* () {
      var wsBuffer = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : null;
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var agentText = '';
      var messageId = _this7._generateMessageId();
      var isFirstDelta = true;
      var flowDetected = false;
      try {
        while (true) {
          var {
            done,
            value
          } = yield reader.read();
          if (done) break;
          var chunk = decoder.decode(value, {
            stream: true
          });
          buffer += chunk;

          // Process SSE lines
          var lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete last line

          for (var line of lines) {
            _this7._processStreamLine(line, text => {
              if (text.toLowerCase().includes('new flow has started')) {
                flowDetected = true;
                return; // don't emit flow notification to UI
              }
              agentText += text;
              _this7._triggerDeltaHandlers({
                messageId,
                text,
                isFirst: isFirstDelta,
                isDone: false
              });
              isFirstDelta = false;
            });
          }
        }

        // Process any remaining buffer content after stream ends
        if (buffer.trim()) {
          if (_this7.config.isDebug()) {
            console.log('[wxo-sdk] Stream remaining buffer:', JSON.stringify(buffer));
          }
          _this7._processStreamLine(buffer, text => {
            if (text.toLowerCase().includes('new flow has started')) {
              flowDetected = true;
              return;
            }
            agentText += text;
            _this7._triggerDeltaHandlers({
              messageId,
              text,
              isFirst: isFirstDelta,
              isDone: false
            });
            isFirstDelta = false;
          });
        }
      } finally {
        reader.releaseLock();
      }

      // Flow agent: HTTP stream carried only the "flow started" notification; actual response arrives via WebSocket
      if (flowDetected && wsBuffer) {
        if (_this7.config.isDebug()) {
          console.log('[wxo-sdk] Flow detected in HTTP stream, switching to WebSocket events');
        }
        yield _this7._consumeFromWebSocketBuffer(wsBuffer, session, messageId);
        return;
      }

      // Simple agent: cleanup unused WS buffer
      if (wsBuffer) wsBuffer.cleanup();

      // Signal stream complete
      _this7._triggerDeltaHandlers({
        messageId,
        text: '',
        isFirst: false,
        isDone: true,
        fullText: agentText
      });

      // Emit the complete agent message (for session history and non-streaming consumers)
      if (agentText) {
        var agentMessage = {
          id: messageId,
          text: agentText,
          sender: 'agent',
          timestamp: Date.now()
        };
        session.messages.push(agentMessage);
        _this7._triggerMessageHandlers(agentMessage);
      }
      if (_this7.config.isDebug()) {
        console.log('[wxo-sdk] Stream complete. Agent response:', agentText);
      }
    })();
  }

  /**
   * Process a single line from the stream and call onText with extracted text
   * @private
   */
  _processStreamLine(line, onText) {
    var trimmed = line.trim();
    if (!trimmed || trimmed === ':') return;
    if (trimmed.startsWith('data:')) {
      var data = trimmed.slice(5).trim();
      if (!data || data === '[DONE]') return;
      try {
        var parsed = JSON.parse(data);
        if (this.config.isDebug()) {
          console.log('[wxo-sdk] Stream event:', parsed);
        }
        var text = this._extractTextFromEvent(parsed);
        if (text) onText(text);
      } catch (_) {
        if (data) onText(data);
      }
    } else {
      try {
        var _parsed = JSON.parse(trimmed);
        if (this.config.isDebug()) {
          console.log('[wxo-sdk] Stream JSON chunk:', _parsed);
        }
        var _text = this._extractTextFromEvent(_parsed);
        if (_text) onText(_text);
      } catch (_) {
        onText(trimmed);
      }
    }
  }

  /**
   * Extract text content from an IBM watsonx Orchestrate stream event
   * Format: { id, event, data: { delta: { content: [{type, text: {value}}] } } }
   * @private
   */
  _extractTextFromEvent(parsed) {
    var _parsed$delta, _parsed$choices;
    // IBM watsonx Orchestrate streaming format: {id, event, data}
    if (parsed.event) {
      if (parsed.event === 'message.delta') {
        var _parsed$data;
        var content = (_parsed$data = parsed.data) === null || _parsed$data === void 0 || (_parsed$data = _parsed$data.delta) === null || _parsed$data === void 0 ? void 0 : _parsed$data.content;
        if (Array.isArray(content)) {
          // No type filter — extract text from any content item to handle varying API formats
          return content.map(c => {
            var _c$text$value, _c$text3;
            return typeof c.text === 'string' ? c.text : (_c$text$value = (_c$text3 = c.text) === null || _c$text3 === void 0 ? void 0 : _c$text3.value) !== null && _c$text$value !== void 0 ? _c$text$value : '';
          }).filter(t => t.length > 0).join('');
        }
        if (typeof content === 'string') return content;
      }
      return null; // message.completed and all other events — text comes from message.delta only
    }

    // Fallback for other formats
    if (typeof parsed === 'string') return parsed;
    if ((_parsed$delta = parsed.delta) !== null && _parsed$delta !== void 0 && _parsed$delta.content) return parsed.delta.content;
    if ((_parsed$choices = parsed.choices) !== null && _parsed$choices !== void 0 && (_parsed$choices = _parsed$choices[0]) !== null && _parsed$choices !== void 0 && (_parsed$choices = _parsed$choices.delta) !== null && _parsed$choices !== void 0 && _parsed$choices.content) return parsed.choices[0].delta.content;
    return null;
  }

  /**
   * Send feedback for a message
   * Payload aligned with existing Code Engine / DB2 schema
   * @param {string} messageId
   * @param {boolean} isPositive
   * @param {string[]} categories - selected category labels
   * @param {string} text - free text comment
   */
  sendFeedback(messageId, isPositive) {
    var _arguments3 = arguments,
      _this8 = this;
    return _asyncToGenerator(function* () {
      var categories = _arguments3.length > 2 && _arguments3[2] !== undefined ? _arguments3[2] : [];
      var text = _arguments3.length > 3 && _arguments3[3] !== undefined ? _arguments3[3] : '';
      var webhookUrl = _this8.config.getFeedbackWebhookUrl();
      var session = _this8.sessions.get(_this8.currentAgentId);
      var agentConfig = _this8.config.getAgent(_this8.currentAgentId);
      var feedbackUserInfo = _this8.config.getFeedbackUserInfo() || {};

      // Find question/answer pair by locating the agent message and the user message before it
      var messages = (session === null || session === void 0 ? void 0 : session.messages) || [];
      var agentMsgIndex = messages.findIndex(m => m.id === messageId);
      var precedingMsg = agentMsgIndex > 0 ? messages[agentMsgIndex - 1] : null;
      var question = (precedingMsg === null || precedingMsg === void 0 ? void 0 : precedingMsg.sender) === 'user' ? precedingMsg.text : (session === null || session === void 0 ? void 0 : session.lastUserMessage) || '';
      var answer = agentMsgIndex >= 0 ? messages[agentMsgIndex].text || '' : '';
      var payload = _objectSpread2(_objectSpread2({}, feedbackUserInfo), {}, {
        question,
        answer,
        isPositive: isPositive ? 1 : 0,
        categories: Array.isArray(categories) ? categories.join(', ') : '',
        text,
        agentId: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.agentId) || _this8.currentAgentId
      });
      if (_this8.config.isDebug()) {
        console.log('[wxo-sdk] Feedback payload:', payload);
      }
      if (webhookUrl) {
        yield fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
    })();
  }

  /**
   * Get messages for current agent
   * @returns {Array}
   */
  getMessages() {
    if (!this.currentAgentId) return [];
    var session = this.sessions.get(this.currentAgentId);
    return session ? [...session.messages] : [];
  }

  /**
   * Get messages for a specific agent
   * @param {string} agentId
   * @returns {Array}
   */
  getAgentMessages(agentId) {
    var session = this.sessions.get(agentId);
    return session ? [...session.messages] : [];
  }

  /**
   * Clear messages for current agent
   */
  clearMessages() {
    if (!this.currentAgentId) return;
    var session = this.sessions.get(this.currentAgentId);
    if (session) session.messages = [];
  }

  /**
   * End session for an agent
   * PATCH /mfe_home_archer/api/v1/threads/{thread_id}
   * @param {string} agentId
   */
  endSession(agentId) {
    var _this9 = this;
    return _asyncToGenerator(function* () {
      var session = _this9.sessions.get(agentId);
      if (!session || !session.threadId) {
        _this9.sessions.delete(agentId);
        return;
      }
      try {
        yield _this9.httpClient.patch("/mfe_home_archer/api/v1/threads/".concat(session.threadId), {
          status: 'closed'
        });
        if (_this9.config.isDebug()) {
          console.log("[wxo-sdk] Thread closed: ".concat(session.threadId));
        }
      } catch (error) {
        console.warn('[wxo-sdk] Failed to close thread (non-fatal):', error.message);
      }
      session.isActive = false;
      _this9.sessions.delete(agentId);
      if (_this9.currentAgentId === agentId) {
        _this9.currentAgentId = null;
      }
    })();
  }

  /**
   * Register message handler (called once with complete message after stream ends)
   * @param {Function} handler
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Register delta handler for streaming incremental text
   * Called with {messageId, text, isFirst, isDone, fullText}
   * @param {Function} handler
   */
  onDelta(handler) {
    this.deltaHandlers.push(handler);
  }

  /**
   * Register error handler
   * @param {Function} handler
   */
  onError(handler) {
    this.errorHandlers.push(handler);
  }

  /** @private */
  _triggerMessageHandlers(message) {
    this.messageHandlers.forEach(h => {
      try {
        h(message);
      } catch (e) {
        console.error('[wxo-sdk] Message handler error:', e);
      }
    });
  }

  /** @private */
  _triggerDeltaHandlers(delta) {
    this.deltaHandlers.forEach(h => {
      try {
        h(delta);
      } catch (e) {
        console.error('[wxo-sdk] Delta handler error:', e);
      }
    });
  }

  /** @private */
  _handleError(error) {
    this.errorHandlers.forEach(h => {
      try {
        h(error);
      } catch (e) {
        console.error('[wxo-sdk] Error handler error:', e);
      }
    });
  }

  /** @private */
  _generateMessageId() {
    return "msg_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
  }

  /**
   * Cleanup all sessions
   */
  destroy() {
    for (var agentId of this.sessions.keys()) {
      this.endSession(agentId);
    }
    this.sessions.clear();
    this.messageHandlers = [];
    this.deltaHandlers = [];
    this.errorHandlers = [];
    this.currentAgentId = null;
    this.socketClient = null;
  }
}

// Made with Bob

/**
 * Minimal Socket.IO v4 / Engine.IO v4 WebSocket client
 *
 * Used for watsonx Orchestrate environments where agent response events are delivered
 * via WebSocket instead of HTTP streaming (e.g. flow-based agents).
 *
 * WebSocket URL: wss://{host}/mfe_home_archer/ws/?tenantId={orchestrationID}&userId={userId}&EIO=4&transport=websocket
 *
 * Engine.IO v4 protocol:
 *   Server→Client  0{...}  OPEN (JSON with pingInterval etc.) → reply with 40 (Socket.IO CONNECT)
 *   Server→Client  40{...} Socket.IO CONNECT ACK
 *   Server→Client  2       PING → reply with 3 (PONG)
 *   Server→Client  42[...] Socket.IO EVENT
 *
 * Relevant Socket.IO event: WORKER_MESSAGE — same {id, event, data} structure as HTTP NDJSON.
 */
class SocketClient {
  constructor(config) {
    this.config = config;
    this.ws = null;
    this.workerMessageHandlers = [];
    this._connectResolve = null;
    this._connectReject = null;
  }
  connect(userId) {
    var _this = this;
    return _asyncToGenerator(function* () {
      var host = _this.config.get('hostURL').replace(/^https?:\/\//, '');
      var orchestrationID = _this.config.get('orchestrationID');
      var url = "wss://".concat(host, "/mfe_home_archer/ws/?tenantId=").concat(encodeURIComponent(orchestrationID), "&userId=").concat(encodeURIComponent(userId), "&EIO=4&transport=websocket");
      if (_this.config.isDebug()) {
        console.log('[wxo-sdk] SocketClient connecting:', url);
      }
      return new Promise((resolve, reject) => {
        _this._connectResolve = resolve;
        _this._connectReject = reject;
        _this.ws = new WebSocket(url);
        _this.ws.onmessage = e => _this._onMessage(e.data);
        _this.ws.onerror = () => {
          var err = new Error('WebSocket connection failed');
          if (_this._connectReject) {
            _this._connectReject(err);
            _this._connectResolve = null;
            _this._connectReject = null;
          }
        };
        _this.ws.onclose = () => {
          if (_this.config.isDebug()) {
            console.log('[wxo-sdk] SocketClient closed');
          }
        };
      });
    })();
  }
  _onMessage(data) {
    if (this.config.isDebug()) {
      var preview = data.length > 120 ? data.substring(0, 120) + '...' : data;
      console.log('[wxo-sdk] SocketClient <', preview);
    }

    // Engine.IO PING → PONG
    if (data === '2') {
      if (this.ws.readyState === WebSocket.OPEN) this.ws.send('3');
      return;
    }

    // Engine.IO OPEN → Socket.IO CONNECT to default namespace
    if (data.charAt(0) === '0') {
      if (this.ws.readyState === WebSocket.OPEN) this.ws.send('40');
      return;
    }

    // Socket.IO CONNECT ACK → connected and ready
    if (data.startsWith('40')) {
      if (this._connectResolve) {
        this._connectResolve();
        this._connectResolve = null;
        this._connectReject = null;
      }
      return;
    }

    // Socket.IO EVENT: 42["WORKER_MESSAGE", {...}]
    if (data.startsWith('42')) {
      try {
        var [eventName, eventData] = JSON.parse(data.slice(2));
        if (eventName === 'WORKER_MESSAGE') {
          this.workerMessageHandlers.forEach(h => {
            try {
              h(eventData);
            } catch (e) {
              console.error('[wxo-sdk] SocketClient handler error:', e);
            }
          });
        }
      } catch (_) {}
    }
  }
  onWorkerMessage(handler) {
    this.workerMessageHandlers.push(handler);
  }
  removeWorkerMessageHandler(handler) {
    this.workerMessageHandlers = this.workerMessageHandlers.filter(h => h !== handler);
  }
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.workerMessageHandlers = [];
    this._connectResolve = null;
    this._connectReject = null;
  }
}

// Made with Bob

/**
 * Main client class for watsonx Orchestrate SDK
 */
class WxOClient {
  constructor() {
    this.config = Config$1;
    this.httpClient = null;
    this.authManager = null;
    this.chatManager = null;
    this.socketClient = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the SDK
   * @returns {Promise<void>}
   */
  init() {
    var _this = this;
    return _asyncToGenerator(function* () {
      if (_this.isInitialized) {
        if (_this.config.isDebug()) {
          console.log('[wxo-sdk] Already initialized');
        }
        return;
      }
      try {
        // Initialize configuration
        _this.config.init();

        // Initialize HTTP client
        _this.httpClient = new HttpClient(_this.config);

        // Initialize authentication (generates anonymous user ID)
        _this.authManager = new AuthManager(_this.config);
        yield _this.authManager.init();

        // Set IBM custom headers on HTTP client
        _this.httpClient.setIBMHeaders(_this.authManager.getUserId());

        // Establish WebSocket connection for flow-based agent response delivery.
        // Works on both IBM Cloud and AWS; falls back to HTTP streaming if connection fails.
        _this.socketClient = new SocketClient(_this.config);
        try {
          yield _this.socketClient.connect(_this.authManager.getUserId());
          if (_this.config.isDebug()) {
            console.log('[wxo-sdk] WebSocket connected');
          }
        } catch (e) {
          console.warn('[wxo-sdk] WebSocket connection failed, falling back to HTTP streaming:', e.message);
          _this.socketClient = null;
        }

        // Initialize chat manager
        _this.chatManager = new ChatManager(_this.config, _this.httpClient, _this.socketClient);
        yield _this.chatManager.init();
        _this.isInitialized = true;
        if (_this.config.isDebug()) {
          console.log('[wxo-sdk] SDK initialized successfully');
        }
      } catch (error) {
        console.error('[wxo-sdk] Initialization failed:', error);
        throw error;
      }
    })();
  }

  /**
   * Start chat with an agent
   * @param {string} agentId
   * @returns {Promise<Object>} session data
   */
  startChat(agentId) {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      _this2._ensureInitialized();
      return yield _this2.chatManager.switchAgent(agentId);
    })();
  }

  /**
   * Send message to current agent
   * @param {string} text
   * @param {Object} options
   * @returns {Promise<Object>} user message object
   */
  sendMessage(text) {
    var _arguments = arguments,
      _this3 = this;
    return _asyncToGenerator(function* () {
      var options = _arguments.length > 1 && _arguments[1] !== undefined ? _arguments[1] : {};
      _this3._ensureInitialized();
      return yield _this3.chatManager.sendMessage(text, options);
    })();
  }

  /**
   * Send feedback for a message
   * @param {string} messageId
   * @param {boolean} isPositive
   * @param {string} comment
   */
  sendFeedback(messageId, isPositive) {
    var _arguments2 = arguments,
      _this4 = this;
    return _asyncToGenerator(function* () {
      var categories = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : [];
      var text = _arguments2.length > 3 && _arguments2[3] !== undefined ? _arguments2[3] : '';
      _this4._ensureInitialized();
      return yield _this4.chatManager.sendFeedback(messageId, isPositive, categories, text);
    })();
  }

  /**
   * Get messages for current agent
   * @returns {Array}
   */
  getMessages() {
    this._ensureInitialized();
    return this.chatManager.getMessages();
  }

  /**
   * Get messages for a specific agent
   * @param {string} agentId
   * @returns {Array}
   */
  getAgentMessages(agentId) {
    this._ensureInitialized();
    return this.chatManager.getAgentMessages(agentId);
  }

  /**
   * Clear messages for current agent
   */
  clearMessages() {
    this._ensureInitialized();
    this.chatManager.clearMessages();
  }

  /**
   * Switch to a different agent
   * @param {string} agentId
   * @returns {Promise<Object>} session data
   */
  switchAgent(agentId) {
    var _this5 = this;
    return _asyncToGenerator(function* () {
      _this5._ensureInitialized();
      return yield _this5.chatManager.switchAgent(agentId);
    })();
  }

  /**
   * Get all agent configurations
   * @returns {Array}
   */
  getAgents() {
    this._ensureInitialized();
    return this.config.getAgents();
  }

  /**
   * Get a specific agent configuration
   * @param {string} agentId
   * @returns {Object|null}
   */
  getAgent(agentId) {
    this._ensureInitialized();
    return this.config.getAgent(agentId);
  }

  /**
   * Register message handler
   * @param {Function} handler
   */
  onMessage(handler) {
    this._ensureInitialized();
    this.chatManager.onMessage(handler);
  }

  /**
   * Register delta handler for streaming incremental text
   * @param {Function} handler
   */
  onDelta(handler) {
    this._ensureInitialized();
    this.chatManager.onDelta(handler);
  }

  /**
   * Register error handler
   * @param {Function} handler
   */
  onError(handler) {
    this._ensureInitialized();
    this.chatManager.onError(handler);
  }

  /**
   * Fetch welcome message and starter prompts from WxO API for an agent
   * @param {string} agentId - internal agent id (from config.agents[].id)
   * @returns {Promise<Object|null>} { welcomeMessage, description, prompts: [{title, prompt}] } or null on failure
   */
  fetchChatStarterSettings(agentId) {
    var _this6 = this;
    return _asyncToGenerator(function* () {
      var agent = _this6.config.getAgent(agentId);
      if (!agent) return null;

      // API docs: chat-starter-settings does NOT support locale query param.
      // IBM wxoLoader handles locale client-side: when is_default_message=true, show locale-specific default.
      var locale = _this6.config.getLocale();
      var path = "/mfe_home_archer/api/v1/orchestrate/agents/".concat(encodeURIComponent(agent.agentId), "/chat-starter-settings");

      // Hardcoded IBM default messages by locale (mirrors wxoLoader.js behavior)
      var defaultWelcomeMessages = {
        ja: 'こんにちは、watsonx Orchestrateへようこそ',
        en: 'Hello, welcome to watsonx Orchestrate',
        fr: 'Bonjour, bienvenue sur watsonx Orchestrate',
        de: 'Hallo, willkommen bei watsonx Orchestrate',
        es: 'Hola, bienvenido a watsonx Orchestrate',
        it: 'Ciao, benvenuto a watsonx Orchestrate',
        ko: '안녕하세요, watsonx Orchestrate에 오신 것을 환영합니다',
        'pt-BR': 'Olá, bem-vindo ao watsonx Orchestrate',
        'zh-TW': '您好，歡迎使用 watsonx Orchestrate',
        'zh-CN': '您好，欢迎使用 watsonx Orchestrate'
      };
      var defaultDescriptions = {
        ja: '生成される回答の精度は異なる場合があります。 回答を再確認してください。',
        en: 'Accuracy of generated answers may vary. Please double-check responses.',
        fr: 'La précision des réponses générées peut varier. Veuillez revérifier les réponses.',
        de: 'Die Genauigkeit generierter Antworten kann variieren. Bitte überprüfen Sie die Antworten.',
        es: 'La precisión de las respuestas generadas puede variar. Verifique las respuestas.',
        it: 'La precisione delle risposte generate può variare. Si prega di ricontrollare le risposte.',
        ko: '생성된 답변의 정확도는 다를 수 있습니다. 답변을 다시 확인하세요.',
        'pt-BR': 'A precisão das respostas geradas pode variar. Verifique as respostas.',
        'zh-TW': '生成答案的準確性可能有所不同。請仔細確認回答。',
        'zh-CN': '生成答案的准确性可能有所不同。请仔细确认回答。'
      };
      if (_this6.config.isDebug()) {
        console.log("[wxo-sdk] fetchChatStarterSettings: locale=\"".concat(locale || 'none', "\", path: ").concat(path));
      }
      try {
        var _data$starter_prompts;
        var data = yield _this6.httpClient.get(path);
        var wc = data === null || data === void 0 ? void 0 : data.welcome_content;
        if (_this6.config.isDebug()) {
          console.log('[wxo-sdk] fetchChatStarterSettings response:', JSON.stringify(wc));
          console.log('[wxo-sdk] is_default_message:', wc === null || wc === void 0 ? void 0 : wc.is_default_message, '/ is_default_description:', wc === null || wc === void 0 ? void 0 : wc.is_default_description);
        }

        // If API returns default message, apply locale-specific default (IBM wxoLoader behavior)
        var localizedDefault = locale ? defaultWelcomeMessages[locale] || defaultWelcomeMessages['en'] : null;
        var welcomeMessage = wc !== null && wc !== void 0 && wc.is_default_message && localizedDefault ? localizedDefault : (wc === null || wc === void 0 ? void 0 : wc.welcome_message) || null;
        var localizedDescription = locale ? defaultDescriptions[locale] || defaultDescriptions['en'] : null;
        var description = wc !== null && wc !== void 0 && wc.is_default_description && localizedDescription ? localizedDescription : (wc === null || wc === void 0 ? void 0 : wc.description) || null;
        var rawPrompts = (data === null || data === void 0 || (_data$starter_prompts = data.starter_prompts) === null || _data$starter_prompts === void 0 ? void 0 : _data$starter_prompts.prompts) || [];
        var prompts = rawPrompts.filter(p => !p.state || p.state === 'active').map(p => ({
          title: p.title,
          prompt: p.prompt
        }));
        return {
          welcomeMessage,
          description,
          prompts
        };
      } catch (e) {
        if (_this6.config.isDebug()) {
          console.warn('[wxo-sdk] fetchChatStarterSettings failed:', e);
        }
        return null;
      }
    })();
  }

  /**
   * End chat session for an agent
   * @param {string} agentId
   */
  endChat(agentId) {
    var _this7 = this;
    return _asyncToGenerator(function* () {
      _this7._ensureInitialized();
      return yield _this7.chatManager.endSession(agentId);
    })();
  }

  /**
   * Disconnect and cleanup
   */
  disconnect() {
    if (!this.isInitialized) return;
    if (this.chatManager) {
      this.chatManager.destroy();
    }
    if (this.socketClient) {
      this.socketClient.disconnect();
      this.socketClient = null;
    }
    if (this.authManager) {
      this.authManager.destroy();
    }
    this.isInitialized = false;
    if (this.config.isDebug()) {
      console.log('[wxo-sdk] SDK disconnected');
    }
  }

  /**
   * Check if SDK is initialized
   * @returns {boolean}
   */
  isReady() {
    return this.isInitialized;
  }

  /**
   * Get SDK configuration
   * @returns {Object}
   */
  getConfig() {
    return this.config.getAll();
  }

  /** @private */
  _ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('SDK not initialized. Call init() first.');
    }
  }
}

// Made with Bob

/**
 * Floating chat button - renders in the bottom-right corner of the page
 */
class FloatingButton {
  constructor(onClick) {
    this.onClick = onClick;
    this.el = null;
  }
  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-floating-btn';
    this.el.setAttribute('aria-label', 'Open chat');
    this.el.innerHTML = "<span style=\"color:white;font-size:18px;font-weight:700;letter-spacing:0.5px;font-family:'IBM Plex Sans',-apple-system,sans-serif;\">AI</span>";
    this.el.addEventListener('click', this.onClick);
    container.appendChild(this.el);
  }
  show() {
    if (this.el) this.el.style.display = 'flex';
  }
  hide() {
    if (this.el) this.el.style.display = 'none';
  }
  setActive(active) {
    if (this.el) {
      this.el.classList.toggle('wxo-floating-btn--active', active);
    }
  }
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

// Made with Bob

/**
 * Agent selector - shows list of agents above the floating button
 * Visible when user clicks the floating button and multiple agents are configured
 */
class AgentSelector {
  constructor(agents, onAgentSelect) {
    this.agents = agents;
    this.onAgentSelect = onAgentSelect;
    this.el = null;
  }
  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-agent-selector';
    this.el.style.display = 'none';
    var total = this.agents.length;
    this.agents.forEach((agent, index) => {
      var btn = document.createElement('div');
      btn.className = 'wxo-agent-item';
      btn.setAttribute('aria-label', agent.name);
      // Bottom item (closest to button) animates first; top items follow with increasing delay
      btn.dataset.animDelay = "".concat((total - 1 - index) * 0.07, "s");
      var labelEl = document.createElement('div');
      labelEl.className = 'wxo-agent-item__label';
      labelEl.textContent = agent.name;
      btn.appendChild(labelEl);
      btn.addEventListener('click', () => this.onAgentSelect(agent.id));
      this.el.appendChild(btn);
    });
    container.appendChild(this.el);
  }
  show() {
    if (!this.el) return;
    this.el.style.display = 'flex';
    // Restart rise animations every time the selector opens
    this.el.querySelectorAll('.wxo-agent-item').forEach(item => {
      item.style.animation = 'none';
      void item.offsetWidth; // force reflow
      item.style.animationDelay = item.dataset.animDelay || '0s';
      item.style.animation = '';
    });
  }
  hide() {
    if (this.el) this.el.style.display = 'none';
  }
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

// Made with Bob

/**
 * ContractAssistPanel - clause assist side panel for the chat window
 *
 * Accepts clauseAssistData: { "<契約書名>": { "<第N条>": { title, content, clauses: { "1": "..." } } } }
 * Calls onInsert(text) when user clicks "入力エリアに挿入".
 */
class ContractAssistPanel {
  constructor(_ref) {
    var {
      clauseAssistData,
      onInsert
    } = _ref;
    this.data = clauseAssistData;
    this.onInsert = onInsert;
    this.el = null;
    this._visible = false;

    // Selected state
    this._contract = '';
    this._article = '';
    this._clause = '';
  }
  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-assist-panel';
    this.el.innerHTML = "\n      <div class=\"wxo-assist-header\">\n        <span class=\"wxo-assist-title\">\uD83D\uDCCB \u6761\u9805\u30A2\u30B7\u30B9\u30C8</span>\n        <button class=\"wxo-assist-close\" aria-label=\"\u9589\u3058\u308B\">\xD7</button>\n      </div>\n      <div class=\"wxo-assist-body\">\n        <div class=\"wxo-assist-row\">\n          <label class=\"wxo-assist-label\">\u5951\u7D04\u66F8</label>\n          <div class=\"wxo-assist-field\">\n            <select class=\"wxo-assist-select\" data-role=\"contract\">\n              <option value=\"\">-- \u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044 --</option>\n            </select>\n          </div>\n        </div>\n        <div class=\"wxo-assist-row\">\n          <label class=\"wxo-assist-label\">\u6761</label>\n          <div class=\"wxo-assist-field\">\n            <select class=\"wxo-assist-select\" data-role=\"article\" disabled>\n              <option value=\"\">-- \u307E\u305A\u5951\u7D04\u66F8\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044 --</option>\n            </select>\n            <div class=\"wxo-assist-preview wxo-assist-preview--empty\" data-role=\"article-preview\">\u6761\u3092\u9078\u629E\u3059\u308B\u3068\u672C\u6587\u304C\u8868\u793A\u3055\u308C\u307E\u3059</div>\n          </div>\n        </div>\n        <div class=\"wxo-assist-row\">\n          <label class=\"wxo-assist-label\">\u9805\uFF08\u4EFB\u610F\uFF09</label>\n          <div class=\"wxo-assist-field\">\n            <select class=\"wxo-assist-select\" data-role=\"clause\" disabled>\n              <option value=\"\">-- \u9805\u306A\u3057\uFF08\u6761\u5168\u4F53\uFF09 --</option>\n            </select>\n            <div class=\"wxo-assist-preview wxo-assist-preview--empty\" data-role=\"clause-preview\">\u9805\u3092\u9078\u629E\u3059\u308B\u3068\u672C\u6587\u304C\u8868\u793A\u3055\u308C\u307E\u3059</div>\n          </div>\n        </div>\n        <div class=\"wxo-assist-row\">\n          <label class=\"wxo-assist-label\">\u5909\u66F4\u5185\u5BB9</label>\n          <div class=\"wxo-assist-field\">\n            <select class=\"wxo-assist-select\" data-role=\"change-preset\">\n              <option value=\"\">-- \u30B5\u30F3\u30D7\u30EB\u304B\u3089\u9078\u629E --</option>\n              <option value=\"\u9805\u5168\u4F53\u3092\u524A\u9664\u3057\u3066\u304F\u3060\u3055\u3044\u3002\">\u9805\u5168\u4F53\u3092\u524A\u9664\u3057\u3066\u304F\u3060\u3055\u3044\u3002</option>\n              <option value=\"\u25B3\u3092\u524A\u9664\u3057\u3066\u304F\u3060\u3055\u3044\u3002\">\u25B3\u3092\u524A\u9664\u3057\u3066\u304F\u3060\u3055\u3044\u3002</option>\n              <option value=\"\u25B3\u3092\u25CB\u306B\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002\">\u25B3\u3092\u25CB\u306B\u5909\u66F4\u3057\u3066\u304F\u3060\u3055\u3044\u3002</option>\n            </select>\n            <textarea class=\"wxo-assist-change\" data-role=\"change\" rows=\"2\" placeholder=\"\u307E\u305F\u306F\u3001\u76F4\u63A5\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\"></textarea>\n          </div>\n        </div>\n        <div class=\"wxo-assist-row\">\n          <label class=\"wxo-assist-label\">\u30EA\u30AF\u30A8\u30B9\u30C8\u6587</label>\n          <div class=\"wxo-assist-generated\" data-role=\"generated\">\u6761\u9805\u3092\u9078\u629E\u3059\u308B\u3068\u81EA\u52D5\u751F\u6210\u3055\u308C\u307E\u3059</div>\n        </div>\n      </div>\n      <div class=\"wxo-assist-footer\">\n        <button class=\"wxo-assist-insert\" data-role=\"insert\" disabled>\u5165\u529B\u30A8\u30EA\u30A2\u306B\u633F\u5165</button>\n      </div>\n    ";
    this._contractSel = this.el.querySelector('[data-role="contract"]');
    this._articleSel = this.el.querySelector('[data-role="article"]');
    this._clauseSel = this.el.querySelector('[data-role="clause"]');
    this._articlePreview = this.el.querySelector('[data-role="article-preview"]');
    this._clausePreview = this.el.querySelector('[data-role="clause-preview"]');
    this._changePreset = this.el.querySelector('[data-role="change-preset"]');
    this._changeInput = this.el.querySelector('[data-role="change"]');
    this._generatedEl = this.el.querySelector('[data-role="generated"]');
    this._insertBtn = this.el.querySelector('[data-role="insert"]');
    this._initContractOptions();
    this._wireEvents();
    container.appendChild(this.el);
  }
  show() {
    if (!this.el) return;
    this.el.classList.add('wxo-assist-panel--visible');
    this._visible = true;
    this.el.scrollTop = 0;
  }
  hide() {
    if (!this.el) return;
    this.el.classList.remove('wxo-assist-panel--visible');
    this._visible = false;
  }
  toggle() {
    if (this._visible) this.hide();else this.show();
  }
  get isVisible() {
    return this._visible;
  }
  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  _initContractOptions() {
    Object.keys(this.data).forEach(name => {
      var opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      this._contractSel.appendChild(opt);
    });
  }
  _wireEvents() {
    this.el.querySelector('.wxo-assist-close').addEventListener('click', () => this.hide());

    // Restore full text when opening dropdowns (so preview text is visible while choosing)
    this._articleSel.addEventListener('mousedown', () => this._restoreFullText(this._articleSel));
    this._clauseSel.addEventListener('mousedown', () => this._restoreFullText(this._clauseSel));
    this._contractSel.addEventListener('change', e => this._onContractChange(e.target.value));
    this._articleSel.addEventListener('change', e => this._onArticleChange(e.target.value));
    this._clauseSel.addEventListener('change', e => this._onClauseChange(e.target.value));
    this._changePreset.addEventListener('change', e => {
      if (e.target.value) {
        this._changeInput.value = e.target.value;
        e.target.value = '';
        this._updateGenerated();
      }
    });
    this._changeInput.addEventListener('input', () => this._updateGenerated());
    this._insertBtn.addEventListener('click', () => {
      var text = this._generatedEl.textContent;
      if (text && !this._insertBtn.disabled) {
        this.onInsert(text);
        this.hide();
      }
    });
  }
  _restoreFullText(selectEl) {
    Array.from(selectEl.options).forEach(opt => {
      var full = opt.getAttribute('data-full-text');
      if (full) opt.textContent = full;
    });
  }
  _onContractChange(contractName) {
    this._contract = contractName;
    this._article = '';
    this._clause = '';

    // Reset article
    this._articleSel.innerHTML = '<option value="">-- 選択してください --</option>';
    this._articleSel.disabled = !contractName;
    this._setPreview(this._articlePreview, null);

    // Reset clause
    this._clauseSel.innerHTML = '<option value="">-- 項なし（条全体） --</option>';
    this._clauseSel.disabled = true;
    this._setPreview(this._clausePreview, null);
    if (contractName) {
      var contract = this.data[contractName];
      Object.keys(contract).forEach(articleNum => {
        var article = contract[articleNum];
        var preview30 = article.content.substring(0, 30);
        var fullText = preview30 ? "".concat(articleNum, " (").concat(article.title, ") ").concat(preview30, "...") : "".concat(articleNum, " (").concat(article.title, ")");
        var shortText = "".concat(articleNum, " (").concat(article.title, ")");
        var opt = document.createElement('option');
        opt.value = articleNum;
        opt.textContent = fullText;
        opt.setAttribute('data-full-text', fullText);
        opt.setAttribute('data-short-text', shortText);
        this._articleSel.appendChild(opt);
      });
    }
    this._updateGenerated();
  }
  _onArticleChange(articleNum) {
    this._article = articleNum;
    this._clause = '';

    // Reset clause
    this._clauseSel.innerHTML = '<option value="">-- 項なし（条全体） --</option>';
    this._clauseSel.disabled = true;
    this._setPreview(this._clausePreview, null);
    if (articleNum) {
      var article = this.data[this._contract][articleNum];
      this._setPreview(this._articlePreview, article.content);

      // Collapse selected option to short text
      var sel = this._articleSel.options[this._articleSel.selectedIndex];
      var short = sel.getAttribute('data-short-text');
      if (short) sel.textContent = short;

      // Populate clause select if clauses exist
      var clauseKeys = Object.keys(article.clauses || {});
      if (clauseKeys.length > 0) {
        this._clauseSel.disabled = false;
        clauseKeys.forEach(num => {
          var content = article.clauses[num];
          var preview30 = content.substring(0, 30);
          var fullText = "\u7B2C".concat(num, "\u9805 ").concat(preview30, "...");
          var shortText = "\u7B2C".concat(num, "\u9805");
          var opt = document.createElement('option');
          opt.value = num;
          opt.textContent = fullText;
          opt.setAttribute('data-full-text', fullText);
          opt.setAttribute('data-short-text', shortText);
          this._clauseSel.appendChild(opt);
        });
      }
    } else {
      this._setPreview(this._articlePreview, null);
    }
    this._updateGenerated();
  }
  _onClauseChange(clauseNum) {
    this._clause = clauseNum;
    if (clauseNum) {
      var content = this.data[this._contract][this._article].clauses[clauseNum];
      this._setPreview(this._clausePreview, content);

      // Collapse selected option to short text
      var sel = this._clauseSel.options[this._clauseSel.selectedIndex];
      var short = sel.getAttribute('data-short-text');
      if (short) sel.textContent = short;
    } else {
      this._setPreview(this._clausePreview, null);
    }
    this._updateGenerated();
  }
  _setPreview(el, text) {
    el.innerHTML = '';
    if (text) {
      el.classList.remove('wxo-assist-preview--empty');
      var textEl = document.createElement('div');
      textEl.className = 'wxo-assist-preview-text';
      textEl.textContent = text;
      el.appendChild(textEl);
      var toggleEl = document.createElement('button');
      toggleEl.className = 'wxo-assist-preview-toggle';
      toggleEl.textContent = 'さらに表示 ∨';
      el.appendChild(toggleEl);
      requestAnimationFrame(() => {
        if (textEl.scrollHeight <= textEl.clientHeight + 2) {
          toggleEl.style.display = 'none';
        }
      });
      var expanded = false;
      toggleEl.addEventListener('click', () => {
        expanded = !expanded;
        textEl.classList.toggle('wxo-assist-preview-text--expanded', expanded);
        toggleEl.textContent = expanded ? '少なく表示 ∧' : 'さらに表示 ∨';
      });
    } else {
      el.classList.add('wxo-assist-preview--empty');
      el.textContent = el === this._articlePreview ? '条を選択すると本文が表示されます' : '項を選択すると本文が表示されます';
    }
  }
  _updateGenerated() {
    if (!this._contract || !this._article) {
      this._generatedEl.textContent = '条項を選択すると自動生成されます';
      this._insertBtn.disabled = true;
      return;
    }
    var article = this.data[this._contract][this._article];
    var text = "".concat(this._contract, "\uFF1A").concat(this._article, " (").concat(article.title, ")");
    if (this._clause) text += "\u7B2C".concat(this._clause, "\u9805");
    text += 'について、';
    var change = this._changeInput.value.trim();
    text += change || '変更をお願いします。';
    this._generatedEl.textContent = text;
    this._insertBtn.disabled = false;
  }
}

// Made with Bob

/**
 * Chat window UI component
 * Renders the full chat interface: header, messages, input, feedback buttons
 */
class ChatWindow {
  constructor(_ref) {
    var {
      agent,
      messages = [],
      starterSettings = null,
      onSend,
      onFeedback,
      onMinimize,
      onReload,
      feedbackEnabled = true,
      feedbackOptions = null,
      clauseAssistData = null,
      clauseAssistAutoOpen = true
    } = _ref;
    this.agent = agent;
    this.starterSettings = starterSettings;
    this.messages = [...messages];
    this.onSend = onSend;
    this.onFeedback = onFeedback;
    this.onMinimize = onMinimize;
    this.onReload = onReload;
    this.feedbackEnabled = feedbackEnabled;
    this.feedbackOptions = feedbackOptions;
    this.clauseAssistData = clauseAssistData;
    this.clauseAssistAutoOpen = clauseAssistAutoOpen;
    this.el = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.loadingEl = null;
    this.streamingEl = null;
    this._streamMessageId = null;
    this.scrollBtnEl = null;
    this.isExpanded = false;
    this.welcomeEl = null;
    this._windowLoadingEl = null;
    this.assistPanel = null;
  }
  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-chat-window';
    var assistBtnHtml = this.clauseAssistData ? "<button class=\"wxo-assist-btn\" data-tooltip=\"\u6761\u9805\u30A2\u30B7\u30B9\u30C8\" aria-label=\"\u6761\u9805\u30A2\u30B7\u30B9\u30C8\">\uD83D\uDCCB</button>" : '';
    this.el.innerHTML = "\n      <div class=\"wxo-chat-header\">\n        <div class=\"wxo-chat-header__left\">\n          <button class=\"wxo-btn-icon wxo-btn-reload tooltip-below\" aria-label=\"Reload\" data-tooltip=\"\u30EA\u30BB\u30C3\u30C8\">\u21BA</button>\n          <div class=\"wxo-chat-header__title\">\n            <span class=\"wxo-chat-header__icon\">".concat(this.agent.icon || '💬', "</span>\n            <span class=\"wxo-chat-header__name\">").concat(this._escapeHtml(this.agent.name), "</span>\n          </div>\n        </div>\n        <div class=\"wxo-chat-header__actions\">\n          <button class=\"wxo-btn-icon wxo-btn-download tooltip-below\" aria-label=\"Download\" data-tooltip=\"\u30C6\u30AD\u30B9\u30C8\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path><polyline points=\"7 10 12 15 17 10\"></polyline><line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"></line></svg></button>\n          <button class=\"wxo-btn-icon wxo-btn-resize tooltip-below\" aria-label=\"Resize\" data-tooltip=\"\u30B5\u30A4\u30BA\u62E1\u5927\u3059\u308B\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><polyline points=\"15 3 21 3 21 9\"></polyline><polyline points=\"9 21 3 21 3 15\"></polyline><line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"></line><line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"></line></svg></button>\n          <button class=\"wxo-btn-icon wxo-btn-minimize tooltip-below\" aria-label=\"Minimize\" data-tooltip=\"\u6700\u5C0F\u5316\">\u2212</button>\n        </div>\n      </div>\n      <div class=\"wxo-chat-messages\"></div>\n      <button class=\"wxo-scroll-bottom\" data-tooltip=\"\u4E00\u756A\u4E0B\u3078\u30B9\u30AF\u30ED\u30FC\u30EB\" style=\"display:none\" aria-label=\"\u4E00\u756A\u4E0B\u3078\u30B9\u30AF\u30ED\u30FC\u30EB\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\"><polyline points=\"6 9 12 15 18 9\"></polyline><line x1=\"4\" y1=\"19\" x2=\"20\" y2=\"19\"></line></svg>\n      </button>\n      <div class=\"wxo-chat-input-area\">\n        <div class=\"wxo-input-wrap").concat(this.clauseAssistData ? ' wxo-input-wrap--with-assist' : '', "\">\n          <textarea class=\"wxo-chat-input\" rows=\"1\" placeholder=\"\u4F55\u304B\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044...\"></textarea>\n          ").concat(assistBtnHtml, "\n          <button class=\"wxo-chat-send\" data-tooltip=\"\u9001\u4FE1\">\n            <svg viewBox=\"0 0 32 32\" fill=\"currentColor\" width=\"16\" height=\"16\" xmlns=\"http://www.w3.org/2000/svg\">\n              <path d=\"M27.45,15.11l-22-11a1,1,0,0,0-1.08.12,1,1,0,0,0-.33,1L7,16,4,26.74A1,1,0,0,0,5,28a1,1,0,0,0,.45-.11l22-11a1,1,0,0,0,0-1.78Zm-20.9,10L8.76,17H18V15H8.76L6.55,6.89,24.76,16Z\"/>\n            </svg>\n          </button>\n        </div>\n      </div>\n    ");
    this.messagesEl = this.el.querySelector('.wxo-chat-messages');
    this.inputEl = this.el.querySelector('.wxo-chat-input');
    this.sendBtn = this.el.querySelector('.wxo-chat-send');
    this.scrollBtnEl = this.el.querySelector('.wxo-scroll-bottom');

    // Render existing messages, welcome screen, or loading spinner
    if (this.messages.length > 0) {
      this.messages.forEach(msg => this._appendMessageEl(msg));
    } else if (this.starterSettings !== null) {
      this._renderWelcomeScreen();
    } else {
      this._windowLoadingEl = document.createElement('div');
      this._windowLoadingEl.className = 'wxo-window-loading';
      this.messagesEl.appendChild(this._windowLoadingEl);
    }

    // Event listeners
    this.el.querySelector('.wxo-btn-minimize').addEventListener('click', () => this.onMinimize());
    this.el.querySelector('.wxo-btn-reload').addEventListener('click', () => this.onReload());
    this.el.querySelector('.wxo-btn-resize').addEventListener('click', () => this._toggleResize());
    this.el.querySelector('.wxo-btn-download').addEventListener('click', () => this._downloadChat());

    // Scroll-to-bottom button
    this.messagesEl.addEventListener('scroll', () => this._updateScrollBtn());
    this.scrollBtnEl.addEventListener('click', () => this._scrollToBottom());
    this.sendBtn.addEventListener('click', () => this._handleSend());
    // Enter to send, Shift+Enter for newline
    this.inputEl.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        this._handleSend();
      }
    });
    // Auto-resize + toggle send button
    this.inputEl.addEventListener('input', () => {
      this.sendBtn.disabled = this.inputEl.value.trim() === '';
      this._resizeInput();
    });
    this.sendBtn.disabled = true; // initially empty

    // Clause assist panel
    if (this.clauseAssistData) {
      this.assistPanel = new ContractAssistPanel({
        clauseAssistData: this.clauseAssistData,
        onInsert: text => {
          this.inputEl.value = text;
          this.sendBtn.disabled = false;
          this._resizeInput();
          this.inputEl.focus();
        }
      });
      this.assistPanel.render(this.el);
      // Move panel to just before the input area so it sits in the flex flow
      var inputAreaEl = this.el.querySelector('.wxo-chat-input-area');
      this.el.insertBefore(this.assistPanel.el, inputAreaEl);
      var assistBtn = this.el.querySelector('.wxo-assist-btn');
      assistBtn.addEventListener('click', () => {
        var active = this.assistPanel.isVisible;
        this.assistPanel.toggle();
        assistBtn.classList.toggle('wxo-assist-btn--active', !active);
      });
      if (this.clauseAssistAutoOpen) {
        container.appendChild(this.el);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            this.assistPanel.show();
            assistBtn.classList.add('wxo-assist-btn--active');
          });
        });
        this._scrollToBottom();
        return;
      }
    }
    container.appendChild(this.el);
    this._scrollToBottom();
  }
  addMessage(message) {
    // If already rendered via streamDelta, just update state (avoid duplicate DOM)
    if (message.id && this.messagesEl && this.messagesEl.querySelector("[data-message-id=\"".concat(message.id, "\"]"))) {
      this.messages.push(message);
      if (message.sender === 'agent') this._setInputDisabled(false);
      return;
    }
    this._hideLoading();
    this._hideWelcomeScreen();
    this.messages.push(message);
    this._appendMessageEl(message);
    this._scrollToBottom();
    if (message.sender === 'agent') {
      this._setInputDisabled(false);
    }
  }

  /**
   * Handle incoming streaming delta from ChatManager.
   * Appends text directly as it arrives; finalizes with Markdown on isDone.
   * @param {{messageId, text, isFirst, isDone, fullText}} delta
   */
  streamDelta(delta) {
    var {
      messageId,
      text,
      isFirst,
      isDone,
      fullText
    } = delta;
    if (isFirst && !this.streamingEl) {
      this._createStreamingBubble(messageId);
    }
    if (!isDone && text && this.streamingEl) {
      var contentEl = this.streamingEl.querySelector('.wxo-message__content');
      if (contentEl) contentEl.textContent += text;
      this._scrollToBottomIfNear();
    }
    if (isDone) {
      if (!this.streamingEl && fullText) {
        this._createStreamingBubble(messageId);
      }
      this._finalizeStreaming(fullText || '');
    }
  }

  /** @private */
  _createStreamingBubble(messageId) {
    this._hideLoading();
    this._hideWelcomeScreen();
    var div = document.createElement('div');
    div.className = 'wxo-message wxo-message--agent';
    div.dataset.messageId = messageId;
    var metaEl = document.createElement('div');
    metaEl.className = 'wxo-message__meta';
    var nameSpan = document.createElement('span');
    nameSpan.className = 'wxo-message__meta-name';
    nameSpan.textContent = this.agent.name;
    var timeSpan = document.createElement('span');
    timeSpan.className = 'wxo-message__meta-time';
    timeSpan.textContent = new Date().toLocaleTimeString('ja-JP', {
      hour: 'numeric',
      minute: '2-digit'
    });
    metaEl.appendChild(nameSpan);
    metaEl.appendChild(timeSpan);
    div.appendChild(metaEl);
    var contentEl = document.createElement('div');
    contentEl.className = 'wxo-message__content';
    contentEl.style.whiteSpace = 'pre-wrap';
    div.appendChild(contentEl);
    this.messagesEl.appendChild(div);
    this.streamingEl = div;
    this._streamMessageId = messageId;
    this._scrollToBottom();
  }

  /** @private */
  _finalizeStreaming(fullText) {
    if (!this.streamingEl) return;
    var contentEl = this.streamingEl.querySelector('.wxo-message__content');
    var messageId = this._streamMessageId;
    if (contentEl) {
      contentEl.style.whiteSpace = '';
      var html = this._parseMarkdown(fullText || '');
      if (html !== null) {
        contentEl.innerHTML = html;
      } else {
        contentEl.textContent = fullText || '';
      }
    }

    // Add action row (copy + feedback)
    var actionRow = document.createElement('div');
    actionRow.className = 'wxo-message__actions';
    var fbPanelEl = null;
    if (this.feedbackEnabled && messageId && this.onFeedback) {
      fbPanelEl = document.createElement('div');
      fbPanelEl.className = 'wxo-feedback';
      var thumbUpSVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\"><path d=\"M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3\"/></svg>";
      var thumbDownSVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\"><path d=\"M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17\"/></svg>";
      [[thumbUpSVG, true, '応答良好'], [thumbDownSVG, false, '応答不良']].forEach(_ref2 => {
        var [svg, isPositive, tip] = _ref2;
        var btn = document.createElement('button');
        btn.className = 'wxo-feedback__btn';
        btn.innerHTML = svg;
        btn.dataset.tooltip = tip;
        btn.addEventListener('click', () => this._onRatingClick(messageId, isPositive, fbPanelEl));
        actionRow.appendChild(btn);
      });
    }
    actionRow.appendChild(this._createCopyButton(fullText || ''));
    this.streamingEl.appendChild(actionRow);
    if (fbPanelEl) this.streamingEl.appendChild(fbPanelEl);
    this.streamingEl = null;
    this._scrollToBottom();
  }
  _handleSend() {
    if (!this.inputEl || this.sendBtn.disabled) return;
    var text = this.inputEl.value.trim();
    if (!text) return;
    this.inputEl.value = '';
    this._resizeInput();
    this._setInputDisabled(true);

    // Display user message immediately
    this.addMessage({
      text,
      sender: 'user',
      timestamp: Date.now()
    });
    // Show loading indicator while waiting for agent
    this._showLoading();
    this.onSend(text).catch(() => {
      this._hideLoading();
      this._setInputDisabled(false);
    });
  }
  _resizeInput() {
    if (!this.inputEl) return;
    this.inputEl.style.height = 'auto';
    this.inputEl.style.height = this.inputEl.scrollHeight + 'px';
  }
  _setInputDisabled(disabled) {
    if (this.inputEl) this.inputEl.disabled = disabled;
    if (this.sendBtn) {
      if (disabled) {
        this.sendBtn.disabled = true;
      } else {
        this.sendBtn.disabled = !this.inputEl || this.inputEl.value.trim() === '';
        // Refocus input when re-enabled (after agent response)
        requestAnimationFrame(() => {
          if (this.inputEl) this.inputEl.focus();
        });
      }
    }
  }

  /**
   * Append a message bubble with sender name + time above it.
   * @param {Object} message
   * @param {boolean} isLoading - renders animated dots instead of text
   * @returns {HTMLElement}
   */
  _appendMessageEl(message) {
    var isLoading = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var div = document.createElement('div');
    div.className = "wxo-message wxo-message--".concat(message.sender);
    if (message.id) div.dataset.messageId = message.id;

    // Meta: sender name + timestamp above the bubble
    var metaEl = document.createElement('div');
    metaEl.className = 'wxo-message__meta';
    var senderName = message.sender === 'user' ? 'あなた' : this.agent.name;
    var timeStr = new Date(message.timestamp || Date.now()).toLocaleTimeString('ja-JP', {
      hour: 'numeric',
      minute: '2-digit'
    });
    var nameSpan = document.createElement('span');
    nameSpan.className = 'wxo-message__meta-name';
    nameSpan.textContent = senderName;
    var timeSpan = document.createElement('span');
    timeSpan.className = 'wxo-message__meta-time';
    timeSpan.textContent = timeStr;
    metaEl.appendChild(nameSpan);
    metaEl.appendChild(timeSpan);
    div.appendChild(metaEl);

    // Bubble content
    var contentEl = document.createElement('div');
    contentEl.className = 'wxo-message__content';
    if (isLoading) {
      contentEl.innerHTML = '<span class="wxo-loading-dots"><span>●</span><span>●</span><span>●</span></span>';
    } else if (message.sender === 'agent') {
      var html = this._parseMarkdown(message.text || '');
      if (html !== null) {
        contentEl.innerHTML = html;
      } else {
        contentEl.textContent = message.text || '';
      }
    } else {
      contentEl.textContent = message.text || '';
    }
    div.appendChild(contentEl);

    // Action row: thumbs (agent only) + copy — agent always visible, user hover-only
    if (!isLoading) {
      var actionRow = document.createElement('div');
      actionRow.className = 'wxo-message__actions';
      var fbPanelEl = null;
      if (message.sender === 'agent' && this.feedbackEnabled && message.id && this.onFeedback) {
        fbPanelEl = document.createElement('div');
        fbPanelEl.className = 'wxo-feedback';
        var thumbUpSVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\"><path d=\"M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3\"/></svg>";
        var thumbDownSVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\"><path d=\"M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17\"/></svg>";
        [[thumbUpSVG, true, '応答良好'], [thumbDownSVG, false, '応答不良']].forEach(_ref3 => {
          var [svg, isPositive, tip] = _ref3;
          var btn = document.createElement('button');
          btn.className = 'wxo-feedback__btn';
          btn.innerHTML = svg;
          btn.dataset.tooltip = tip;
          btn.addEventListener('click', () => this._onRatingClick(message.id, isPositive, fbPanelEl));
          actionRow.appendChild(btn);
        });
      }
      actionRow.appendChild(this._createCopyButton(message.text || ''));
      div.appendChild(actionRow);
      if (fbPanelEl) div.appendChild(fbPanelEl);
    }
    this.messagesEl.appendChild(div);
    return div;
  }
  _showLoading() {
    if (this.loadingEl) return; // already visible
    this.loadingEl = this._appendMessageEl({
      sender: 'agent',
      timestamp: Date.now()
    }, true);
    this._scrollToBottom();
  }
  _hideLoading() {
    if (this.loadingEl && this.loadingEl.parentNode) {
      this.loadingEl.parentNode.removeChild(this.loadingEl);
    }
    this.loadingEl = null;
  }
  _onRatingClick(messageId, isPositive, fbEl) {
    var _this$feedbackOptions;
    var type = isPositive ? 'positive' : 'negative';
    var opts = (_this$feedbackOptions = this.feedbackOptions) === null || _this$feedbackOptions === void 0 ? void 0 : _this$feedbackOptions[type];

    // If showDetails is false, submit immediately with no details
    if (!(opts !== null && opts !== void 0 && opts.showDetails)) {
      this._submitFeedback(messageId, isPositive, [], '', fbEl);
      return;
    }
    var thumbUpSVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><path d=\"M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3\"/></svg>";
    var thumbDownSVG = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><path d=\"M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17\"/></svg>";
    var rating = isPositive ? thumbUpSVG : thumbDownSVG;
    var categories = opts.categories || [];
    var disclaimer = opts.disclaimer || '';
    var pillsHtml = categories.map((cat, i) => "<button class=\"wxo-feedback__pill\" data-index=\"".concat(i, "\">").concat(this._escapeHtml(cat), "</button>")).join('');
    fbEl.innerHTML = "\n      <div class=\"wxo-feedback__panel\">\n        <div class=\"wxo-feedback__panel-header\">\n          <span class=\"wxo-feedback__selected\">".concat(rating, "</span>\n          <span class=\"wxo-feedback__panel-title\">\u8FFD\u52A0\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF</span>\n        </div>\n        <div class=\"wxo-feedback__panel-subtitle\">\u3053\u306E\u8A55\u4FA1\u3092\u3057\u305F\u7406\u7531\u306F\u4F55\u3067\u3059\u304B\uFF1F</div>\n        <div class=\"wxo-feedback__pills\">").concat(pillsHtml, "</div>\n        <textarea class=\"wxo-feedback__comment\" placeholder=\"(\u30AA\u30D7\u30B7\u30E7\u30F3)\u4ED6\u306B\u3054\u610F\u898B\u3084\u3054\u63D0\u6848\u304C\u3042\u308C\u3070\u304A\u77E5\u3089\u305B\u304F\u3060\u3055\u3044\" rows=\"2\"></textarea>\n        ").concat(disclaimer ? "<div class=\"wxo-feedback__disclaimer\">".concat(this._escapeHtml(disclaimer), "</div>") : '', "\n        <div class=\"wxo-feedback__panel-actions\">\n          <button class=\"wxo-feedback__cancel\">\u30AD\u30E3\u30F3\u30BB\u30EB</button>\n          <button class=\"wxo-feedback__submit\">\u9001\u4FE1</button>\n        </div>\n      </div>\n    ");
    var selectedCategories = new Set();
    fbEl.querySelectorAll('.wxo-feedback__pill').forEach((pill, i) => {
      pill.addEventListener('click', () => {
        var cat = categories[i];
        if (selectedCategories.has(cat)) {
          selectedCategories.delete(cat);
          pill.classList.remove('wxo-feedback__pill--selected');
        } else {
          selectedCategories.add(cat);
          pill.classList.add('wxo-feedback__pill--selected');
        }
      });
    });
    var textarea = fbEl.querySelector('.wxo-feedback__comment');
    fbEl.querySelector('.wxo-feedback__submit').addEventListener('click', () => {
      this._submitFeedback(messageId, isPositive, [...selectedCategories], textarea.value.trim(), fbEl);
    });
    fbEl.querySelector('.wxo-feedback__cancel').addEventListener('click', () => {
      fbEl.innerHTML = ''; // thumbs remain in action row above
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        var actionsEl = fbEl.querySelector('.wxo-feedback__panel-actions');
        if (actionsEl && this.messagesEl) {
          var panelBottom = actionsEl.getBoundingClientRect().bottom;
          var containerBottom = this.messagesEl.getBoundingClientRect().bottom;
          if (panelBottom > containerBottom) {
            this.messagesEl.scrollTop += panelBottom - containerBottom + 8;
          }
        }
      });
    });
  }
  _submitFeedback(messageId, isPositive, categories, text, fbEl) {
    this.onFeedback(messageId, isPositive, categories, text);
    var svgIcon = isPositive ? "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><path d=\"M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3\"/></svg>" : "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><path d=\"M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17\"/></svg>";
    fbEl.innerHTML = "<span class=\"wxo-feedback__thanks\">".concat(svgIcon, " \u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059</span>");
  }
  _createCopyButton(text) {
    var btn = document.createElement('button');
    btn.className = 'wxo-copy-btn';
    btn.dataset.tooltip = 'コピー';
    btn.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\"><rect x=\"9\" y=\"9\" width=\"13\" height=\"13\" rx=\"2\" ry=\"2\"></rect><path d=\"M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1\"></path></svg>";
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        btn.dataset.tooltip = 'コピーしました';
        setTimeout(() => {
          btn.dataset.tooltip = 'コピー';
        }, 2000);
      }).catch(() => {});
    });
    return btn;
  }
  _renderWelcomeScreen() {
    var _this$starterSettings, _this$starterSettings2, _this$starterSettings3;
    // Use API data if available, fallback to agent config
    var greeting = ((_this$starterSettings = this.starterSettings) === null || _this$starterSettings === void 0 ? void 0 : _this$starterSettings.welcomeMessage) || this.agent.welcomeMessage || this.agent.name;
    var description = ((_this$starterSettings2 = this.starterSettings) === null || _this$starterSettings2 === void 0 ? void 0 : _this$starterSettings2.description) || this.agent.welcomeSubtitle || '';
    // starterSettings.prompts: [{title, prompt}]; fallback: agent.quickStartPrompts (strings)
    var prompts = ((_this$starterSettings3 = this.starterSettings) === null || _this$starterSettings3 === void 0 ? void 0 : _this$starterSettings3.prompts) || (Array.isArray(this.agent.quickStartPrompts) ? this.agent.quickStartPrompts.map(p => ({
      title: p,
      prompt: p
    })) : []);
    this.welcomeEl = document.createElement('div');
    this.welcomeEl.className = 'wxo-welcome';
    var greetingEl = document.createElement('div');
    greetingEl.className = 'wxo-welcome__greeting';
    greetingEl.textContent = greeting;
    this.welcomeEl.appendChild(greetingEl);
    if (description) {
      var descEl = document.createElement('div');
      descEl.className = 'wxo-welcome__description';
      descEl.textContent = description;
      this.welcomeEl.appendChild(descEl);
    }
    if (prompts.length > 0) {
      var promptsEl = document.createElement('div');
      promptsEl.className = 'wxo-welcome__prompts';
      prompts.forEach(_ref4 => {
        var {
          title,
          prompt
        } = _ref4;
        var btn = document.createElement('button');
        btn.className = 'wxo-welcome__prompt';
        var textSpan = document.createElement('span');
        textSpan.className = 'wxo-welcome__prompt-text';
        textSpan.textContent = title;
        var arrowSpan = document.createElement('span');
        arrowSpan.className = 'wxo-welcome__prompt-arrow';
        arrowSpan.textContent = '→';
        btn.appendChild(textSpan);
        btn.appendChild(arrowSpan);
        btn.addEventListener('click', () => {
          if (this.inputEl && !this.inputEl.disabled) {
            this.inputEl.value = prompt;
            this.sendBtn.disabled = false;
            this._resizeInput();
            this._handleSend();
          }
        });
        promptsEl.appendChild(btn);
      });
      this.welcomeEl.appendChild(promptsEl);
    }
    this.messagesEl.appendChild(this.welcomeEl);
  }
  _hideWelcomeScreen() {
    if (this.welcomeEl && this.welcomeEl.parentNode) {
      this.welcomeEl.parentNode.removeChild(this.welcomeEl);
      this.welcomeEl = null;
    }
  }
  _toggleResize() {
    this.isExpanded = !this.isExpanded;
    this.el.classList.toggle('wxo-chat-window--expanded', this.isExpanded);
    var btn = this.el.querySelector('.wxo-btn-resize');
    btn.dataset.tooltip = this.isExpanded ? '元のサイズに戻す' : 'サイズ拡大する';
    if (this.isExpanded) {
      // Collapse icon: arrows pointing inward
      btn.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><polyline points=\"4 14 10 14 10 20\"></polyline><polyline points=\"20 10 14 10 14 4\"></polyline><line x1=\"10\" y1=\"14\" x2=\"3\" y2=\"21\"></line><line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"></line></svg>";
    } else {
      // Expand icon: arrows pointing outward
      btn.innerHTML = "<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"14\" height=\"14\"><polyline points=\"15 3 21 3 21 9\"></polyline><polyline points=\"9 21 3 21 3 15\"></polyline><line x1=\"21\" y1=\"3\" x2=\"14\" y2=\"10\"></line><line x1=\"3\" y1=\"21\" x2=\"10\" y2=\"14\"></line></svg>";
    }
  }
  _downloadChat() {
    if (this.messages.length === 0) return;
    var lines = this.messages.map(msg => {
      var sender = msg.sender === 'user' ? 'あなた' : this.agent.name;
      var dt = new Date(msg.timestamp || Date.now());
      var y = dt.getFullYear();
      var mo = String(dt.getMonth() + 1).padStart(2, '0');
      var d = String(dt.getDate()).padStart(2, '0');
      var h = String(dt.getHours()).padStart(2, '0');
      var mi = String(dt.getMinutes()).padStart(2, '0');
      return "[".concat(sender, "] ").concat(y, "-").concat(mo, "-").concat(d, " ").concat(h, ":").concat(mi, "\n").concat(this._stripMarkdown(msg.text || ''));
    });
    var today = new Date();
    var filename = "chat-".concat(today.getFullYear(), "-").concat(String(today.getMonth() + 1).padStart(2, '0'), "-").concat(String(today.getDate()).padStart(2, '0'), ".txt");
    var blob = new Blob([lines.join('\n\n')], {
      type: 'text/plain;charset=utf-8'
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  _scrollToBottom() {
    if (this.messagesEl) {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
    if (this.scrollBtnEl) this.scrollBtnEl.style.display = 'none';
  }
  _scrollToBottomIfNear() {
    if (!this.messagesEl) return;
    var {
      scrollTop,
      scrollHeight,
      clientHeight
    } = this.messagesEl;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      this.messagesEl.scrollTop = scrollHeight;
    }
  }
  _updateScrollBtn() {
    if (!this.scrollBtnEl || !this.messagesEl) return;
    var atBottom = this.messagesEl.scrollHeight - this.messagesEl.scrollTop - this.messagesEl.clientHeight < 50;
    this.scrollBtnEl.style.display = atBottom ? 'none' : 'flex';
  }
  _stripMarkdown(text) {
    return text.replace(/```[\w]*\n?([\s\S]*?)```/g, '$1') // code blocks: keep content
    .replace(/`(.+?)`/g, '$1') // inline code
    .replace(/^[-*_]{3,}\s*$/gm, '') // horizontal rules (before italic _ to avoid mis-parse)
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/\*\*([^]+?)\*\*/g, '$1') // bold **
    .replace(/__([^]+?)__/g, '$1') // bold __
    .replace(/\*([^]+?)\*/g, '$1') // italic *
    .replace(/_([^]+?)_/g, '$1') // italic _
    .replace(/!\[.*?\]\(.+?\)/g, '') // images
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // links → label only
    .replace(/^>\s?/gm, '') // blockquotes
    .replace(/^[-*+]\s+/gm, '') // unordered list bullets
    .replace(/^\d+\.\s+/gm, '') // ordered list numbers
    .replace(/(\S)_(\s|$)/gm, '$1$2') // orphaned closing _
    .replace(/(^|\s)_(\S)/gm, '$1$2') // orphaned opening _
    .trim();
  }
  _parseMarkdown(text) {
    if (typeof window.marked === 'undefined') return null;
    var html = window.marked.parse(text);
    if (typeof window.DOMPurify !== 'undefined') {
      html = window.DOMPurify.sanitize(html);
    }
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('a').forEach(a => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
    return tmp.innerHTML;
  }
  _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  setStarterSettings(starterSettings) {
    this.starterSettings = starterSettings;
    if (this._windowLoadingEl && this._windowLoadingEl.parentNode) {
      this._windowLoadingEl.parentNode.removeChild(this._windowLoadingEl);
      this._windowLoadingEl = null;
    }
    if (this.messages.length === 0) {
      this._renderWelcomeScreen();
    }
  }
  resetToWelcome(starterSettings) {
    this.streamingEl = null;
    this._streamMessageId = null;
    this.messages = [];
    this.starterSettings = starterSettings;
    if (this.messagesEl) {
      this.messagesEl.innerHTML = '';
      this.welcomeEl = null;
    }
    if (this.inputEl) {
      this.inputEl.value = '';
      this._resizeInput();
    }
    if (this.assistPanel) this.assistPanel.hide();
    this._renderWelcomeScreen();
    this._setInputDisabled(false);
    if (this.sendBtn) this.sendBtn.disabled = true;
    if (this.scrollBtnEl) this.scrollBtnEl.style.display = 'none';
  }
  destroy() {
    if (this.assistPanel) this.assistPanel.destroy();
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

// Made with Bob

/**
 * UIManager - orchestrates the entire SDK UI
 *
 * States:
 *   collapsed  - only floating button visible
 *   expanded   - floating button (bottom) + selector above it; clicking button collapses
 *   chat       - chat window visible; button/selector hidden
 *
 * Per-agent chat windows are created on first open and hidden/shown on minimize/reopen.
 * Sessions are never ended on agent switch — only on explicit reload.
 */
class UIManager {
  constructor(config, wxoClient) {
    this.config = config;
    this.client = wxoClient;
    this.state = 'collapsed';
    this.container = null;
    this.floatingButton = null;
    this.agentSelector = null;
    this.chatWindows = new Map(); // agentId → ChatWindow
    this.currentAgentId = null;
    this._outsideClickHandler = null;
  }
  init() {
    this.container = document.createElement('div');
    this.container.id = 'wxo-ui-container';
    document.body.appendChild(this.container);
    this._injectStyles();

    // Floating button (always rendered, shown/hidden by state)
    this.floatingButton = new FloatingButton(() => this._onFloatingButtonClick());
    this.floatingButton.render(this.container);

    // Agent selector (only rendered if multiple agents)
    var agents = this.config.getAgents();
    if (agents.length > 1) {
      this.agentSelector = new AgentSelector(agents, agentId => this._onAgentSelect(agentId));
      this.agentSelector.render(this.container);
    }

    // Route streaming deltas to the active chat window
    this.client.onDelta(delta => {
      if (this.currentAgentId) {
        var win = this.chatWindows.get(this.currentAgentId);
        if (win) win.streamDelta(delta);
      }
    });

    // Route complete messages to the active chat window (fallback / session history)
    this.client.onMessage(message => {
      if (this.currentAgentId) {
        var win = this.chatWindows.get(this.currentAgentId);
        if (win) win.addMessage(message);
      }
    });
    this.client.onError(error => {
      console.error('[wxo-sdk] Chat error:', error);
    });
    if (this.config.isDebug()) {
      console.log('[wxo-sdk] UIManager initialized');
    }
  }

  // ─── Event handlers ────────────────────────────────────────────────────────

  _onFloatingButtonClick() {
    var agents = this.config.getAgents();
    if (this.state === 'collapsed') {
      if (agents.length === 1) {
        this._openChat(agents[0].id);
      } else {
        this._expandSelector();
      }
    } else if (this.state === 'expanded') {
      this._collapse();
    }
    // In 'chat' state the button is hidden so this won't fire
  }
  _onAgentSelect(agentId) {
    var _this = this;
    return _asyncToGenerator(function* () {
      yield _this._openChat(agentId);
    })();
  }

  // ─── State transitions ──────────────────────────────────────────────────────

  _expandSelector() {
    this.state = 'expanded';
    this.floatingButton.setActive(true);
    if (this.agentSelector) this.agentSelector.show();
  }
  _collapse() {
    this.state = 'collapsed';
    this.floatingButton.setActive(false);
    if (this.agentSelector) this.agentSelector.hide();
  }
  _openChat(agentId) {
    var _this2 = this;
    return _asyncToGenerator(function* () {
      _this2.state = 'chat';
      _this2.floatingButton.hide();
      if (_this2.agentSelector) _this2.agentSelector.hide();

      // Hide the window of the previously active agent (if switching)
      if (_this2.currentAgentId && _this2.currentAgentId !== agentId) {
        var prevWin = _this2.chatWindows.get(_this2.currentAgentId);
        if (prevWin && prevWin.el) prevWin.el.style.display = 'none';
      }

      // If a window already exists for this agent, just show it (history preserved)
      if (_this2.chatWindows.has(agentId)) {
        var win = _this2.chatWindows.get(agentId);
        if (win.el) win.el.style.display = 'flex';
        _this2.currentAgentId = agentId;
        yield _this2.client.startChat(agentId); // re-activates session in ChatManager
        return;
      }

      // First open for this agent: render window immediately, fetch settings in background
      _this2.currentAgentId = agentId;
      var agent = _this2.config.getAgent(agentId);
      var feedbackEnabled = _this2.config.isFeatureEnabled('feedback');
      var feedbackOptions = _this2.config.getFeedbackOptions();

      // Render with starterSettings=null → shows loading spinner in content area
      var chatWindow = new ChatWindow({
        agent,
        starterSettings: null,
        messages: [],
        feedbackEnabled,
        feedbackOptions,
        clauseAssistData: agent.clauseAssistData || null,
        clauseAssistAutoOpen: agent.clauseAssistAutoOpen !== false,
        onSend: function () {
          var _onSend = _asyncToGenerator(function* (text) {
            yield _this2.client.sendMessage(text);
          });
          function onSend(_x) {
            return _onSend.apply(this, arguments);
          }
          return onSend;
        }(),
        onFeedback: (messageId, isPositive, categories, text) => {
          _this2.client.sendFeedback(messageId, isPositive, categories, text).catch(e => {
            console.warn('[wxo-sdk] Feedback error:', e);
          });
        },
        onMinimize: () => _this2._minimizeChat(),
        onReload: () => _this2._reloadChat()
      });
      chatWindow.render(_this2.container);
      _this2.chatWindows.set(agentId, chatWindow);

      // Fetch session and starter settings in background
      var [, starterSettings] = yield Promise.all([_this2.client.startChat(agentId), _this2.client.fetchChatStarterSettings(agentId).catch(() => null)]);

      // Replace loading spinner with welcome screen
      chatWindow.setStarterSettings(starterSettings);
    })();
  }
  _minimizeChat() {
    // Hide (not destroy) the active window to preserve DOM and message history
    if (this.currentAgentId) {
      var win = this.chatWindows.get(this.currentAgentId);
      if (win && win.el) win.el.style.display = 'none';
    }
    this.floatingButton.show();
    var agents = this.config.getAgents();
    if (agents.length > 1) {
      this._expandSelector();
    } else {
      this._collapse();
    }
  }
  _reloadChat() {
    var _this3 = this;
    return _asyncToGenerator(function* () {
      if (!_this3.currentAgentId) return;
      var agentId = _this3.currentAgentId;
      var win = _this3.chatWindows.get(agentId);

      // End the current session (closes thread, clears messages in ChatManager)
      yield _this3.client.endChat(agentId).catch(() => {});

      // Start new session and fetch starter settings concurrently
      var [, starterSettings] = yield Promise.all([_this3.client.startChat(agentId), _this3.client.fetchChatStarterSettings(agentId).catch(() => null)]);

      // Reset the existing window in place (keep it open)
      if (win) {
        win.resetToWelcome(starterSettings);
      }
    })();
  }

  // ─── CSS injection ──────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('wxo-sdk-styles')) return;
    var primaryColor = this.config.get('theme.primaryColor') || '#0f62fe';
    var style = document.createElement('style');
    style.id = 'wxo-sdk-styles';
    style.textContent = "\n      #wxo-ui-container {\n        position: fixed;\n        bottom: 20px;\n        right: 20px;\n        z-index: 99999;\n        display: flex;\n        flex-direction: column-reverse;\n        align-items: flex-end;\n        gap: 10px;\n        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n      }\n\n      /* Floating button */\n      .wxo-floating-btn {\n        width: 60px;\n        height: 60px;\n        border-radius: 50%;\n        background: ".concat(primaryColor, ";\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        cursor: pointer;\n        box-shadow: 0 4px 12px rgba(0,0,0,0.25);\n        transition: transform 0.2s, box-shadow 0.2s;\n        flex-shrink: 0;\n      }\n      .wxo-floating-btn:hover {\n        transform: scale(1.05);\n        box-shadow: 0 6px 16px rgba(0,0,0,0.3);\n      }\n      .wxo-floating-btn--active {\n        background: #005A96;\n      }\n\n      /* Agent selector rise animation */\n      @keyframes wxo-agent-rise {\n        0% {\n          opacity: 0;\n          transform: translateY(52px) rotate(90deg);\n        }\n        40% {\n          opacity: 1;\n        }\n        100% {\n          opacity: 1;\n          transform: translateY(0) rotate(0deg);\n        }\n      }\n\n      /* Agent selector */\n      .wxo-agent-selector {\n        flex-direction: column;\n        gap: 8px;\n        align-items: flex-end;\n      }\n      .wxo-agent-item {\n        display: flex;\n        align-items: center;\n        justify-content: flex-end;\n        background: #E8F4FC;\n        border-radius: 24px;\n        padding: 10px 18px;\n        cursor: pointer;\n        box-shadow: 0 3px 8px rgba(0,0,0,0.12);\n        white-space: nowrap;\n        transform-origin: right center;\n        animation: wxo-agent-rise 0.45s cubic-bezier(0.34, 1.3, 0.64, 1) both;\n      }\n      .wxo-agent-item:hover {\n        box-shadow: 0 4px 10px rgba(0,0,0,0.18);\n      }\n      .wxo-agent-item__label {\n        font-size: 14px;\n        font-weight: 500;\n        color: #161616;\n      }\n\n      /* Chat window */\n      .wxo-chat-window {\n        width: 380px;\n        height: 580px;\n        max-height: calc(100vh - 100px);\n        background: white;\n        border-radius: 12px;\n        box-shadow: 0 8px 32px rgba(0,0,0,0.2);\n        display: flex;\n        flex-direction: column;\n        overflow: hidden;\n        transition: width 0.3s, height 0.3s;\n        position: relative;\n      }\n      .wxo-chat-window--expanded {\n        width: 620px;\n        height: 720px;\n      }\n\n      /* Chat header */\n      .wxo-chat-header {\n        background: #ffffff;\n        color: #161616;\n        padding: 14px 16px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        flex-shrink: 0;\n        border-bottom: 1px solid #e0e0e0;\n      }\n      .wxo-chat-header__left {\n        display: flex;\n        align-items: center;\n        gap: 4px;\n      }\n      .wxo-chat-header__title {\n        display: flex;\n        align-items: center;\n        gap: 8px;\n        font-weight: 700;\n        font-size: 15px;\n        color: #161616;\n      }\n      .wxo-chat-header__icon {\n        font-size: 20px;\n      }\n      .wxo-chat-header__actions {\n        display: flex;\n        gap: 4px;\n      }\n      .wxo-btn-icon {\n        background: none;\n        border: none;\n        color: #525252;\n        cursor: pointer;\n        font-size: 18px;\n        padding: 4px 6px;\n        border-radius: 4px;\n        line-height: 1;\n        transition: background 0.15s, color 0.15s;\n      }\n      .wxo-btn-icon:hover {\n        background: #f4f4f4;\n        color: #161616;\n      }\n\n      /* Messages area - gradient: white top \u2192 #E8F4FC bottom */\n      .wxo-chat-messages {\n        flex: 1;\n        overflow-y: auto;\n        padding: 16px 16px 24px;\n        background: linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #E8F4FC 100%);\n        display: flex;\n        flex-direction: column;\n        gap: 12px;\n      }\n\n      /* Individual messages */\n      .wxo-message {\n        max-width: 80%;\n        display: flex;\n        flex-direction: column;\n      }\n      .wxo-message--user {\n        align-self: flex-end;\n        align-items: flex-end;\n      }\n      .wxo-message--agent {\n        align-self: flex-start;\n        align-items: flex-start;\n      }\n\n      /* Sender name + time above bubble */\n      .wxo-message__meta {\n        font-size: 11px;\n        color: #161616;\n        margin-bottom: 3px;\n        padding: 0 4px;\n        display: flex;\n        gap: 6px;\n        align-items: baseline;\n      }\n      .wxo-message--user .wxo-message__meta { justify-content: flex-end; }\n      .wxo-message--agent .wxo-message__meta { justify-content: flex-start; }\n      .wxo-message__meta-name { font-weight: 700; font-size: 13px; }\n      .wxo-message__meta-time { font-weight: 400; color: #525252; }\n\n      .wxo-message__content {\n        padding: 10px 14px;\n        border-radius: 12px;\n        font-size: 14px;\n        line-height: 1.5;\n      }\n      .wxo-message--user .wxo-message__content {\n        background: #e0e0e0;\n        color: #161616;\n        border-top-right-radius: 4px;\n      }\n      .wxo-message--agent .wxo-message__content {\n        background: transparent;\n        color: #161616;\n        border: none;\n        padding-left: 0;\n      }\n\n      /* Loading dots */\n      @keyframes wxo-blink {\n        0%, 80%, 100% { opacity: 0.2; }\n        40% { opacity: 1; }\n      }\n      .wxo-loading-dots span {\n        animation: wxo-blink 1.4s infinite;\n        display: inline-block;\n        margin: 0 1px;\n        font-size: 20px;\n        line-height: 1;\n      }\n      .wxo-loading-dots span:nth-child(2) { animation-delay: 0.2s; }\n      .wxo-loading-dots span:nth-child(3) { animation-delay: 0.4s; }\n\n      /* Window-open loading spinner */\n      .wxo-window-loading {\n        display: flex; justify-content: center; align-items: center; flex: 1; padding: 40px;\n      }\n      .wxo-window-loading::after {\n        content: ''; width: 28px; height: 28px;\n        border: 3px solid #e0e0e0; border-top-color: #8d8d8d;\n        border-radius: 50%; animation: wxo-spin 1.4s linear infinite;\n      }\n      @keyframes wxo-spin { to { transform: rotate(360deg); } }\n\n      /* Markdown inside agent messages */\n      .wxo-message--agent .wxo-message__content p { margin: 4px 0; }\n      .wxo-message--agent .wxo-message__content h1,\n      .wxo-message--agent .wxo-message__content h2,\n      .wxo-message--agent .wxo-message__content h3 {\n        margin: 6px 0 3px; font-size: 1em; font-weight: 600;\n      }\n      .wxo-message--agent .wxo-message__content table {\n        border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 13px;\n      }\n      .wxo-message--agent .wxo-message__content th,\n      .wxo-message--agent .wxo-message__content td {\n        border: 1px solid #ccc; padding: 4px 8px; text-align: left;\n      }\n      .wxo-message--agent .wxo-message__content th {\n        background: #f0f0f0; font-weight: 600;\n      }\n      .wxo-message--agent .wxo-message__content code {\n        background: #f4f4f4; padding: 1px 4px; border-radius: 3px;\n        font-family: monospace; font-size: 0.9em;\n      }\n      .wxo-message--agent .wxo-message__content pre {\n        background: #f4f4f4; padding: 10px; border-radius: 4px;\n        overflow-x: auto; margin: 4px 0;\n      }\n      .wxo-message--agent .wxo-message__content ul,\n      .wxo-message--agent .wxo-message__content ol {\n        margin: 4px 0; padding-left: 20px;\n      }\n      .wxo-message--agent .wxo-message__content blockquote {\n        margin: 4px 0; padding: 4px 12px;\n        border-left: 3px solid #8d8d8d;\n        color: #525252;\n        background: #f4f4f4;\n        border-radius: 0 4px 4px 0;\n        font-style: normal;\n      }\n\n      /* Feedback - thumbs (inline in action row, no border) */\n      .wxo-feedback { margin-top: 4px; }\n      .wxo-feedback__btn {\n        background: none;\n        border: none;\n        border-radius: 4px;\n        padding: 3px 4px;\n        height: 24px;\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        transition: background 0.15s;\n      }\n      .wxo-feedback__btn:hover { background: #f0f0f0; }\n\n      /* Feedback - detail panel */\n      .wxo-feedback__panel {\n        display: flex;\n        flex-direction: column;\n        gap: 10px;\n        border: 1px solid #e0e0e0;\n        border-radius: 8px;\n        padding: 14px 14px 0;\n        background: white;\n      }\n      .wxo-feedback__panel-header {\n        display: flex;\n        align-items: center;\n        gap: 8px;\n      }\n      .wxo-feedback__selected { display: flex; align-items: center; }\n      .wxo-feedback__panel-title {\n        font-size: 13px;\n        font-weight: 700;\n        color: #161616;\n      }\n      .wxo-feedback__panel-subtitle {\n        font-size: 12px;\n        color: #525252;\n        margin-top: -4px;\n      }\n      .wxo-feedback__pills {\n        display: flex;\n        flex-wrap: wrap;\n        gap: 6px;\n      }\n      .wxo-feedback__pill {\n        background: white;\n        border: 1px solid #c6c6c6;\n        border-radius: 16px;\n        padding: 4px 12px;\n        font-size: 12px;\n        font-family: inherit;\n        cursor: pointer;\n        transition: background 0.15s, border-color 0.15s, color 0.15s;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n      }\n      .wxo-feedback__pill:hover { background: #f4f4f4; }\n      .wxo-feedback__pill--selected {\n        background: #E8F4FC;\n        border-color: ").concat(primaryColor, ";\n        color: ").concat(primaryColor, ";\n      }\n      .wxo-feedback__comment {\n        width: 100%;\n        border: 1px solid #c6c6c6;\n        border-radius: 6px;\n        padding: 8px 10px;\n        font-size: 12px;\n        font-family: inherit;\n        resize: none;\n        box-sizing: border-box;\n        outline: none;\n      }\n      .wxo-feedback__comment:focus { border-color: ").concat(primaryColor, "; }\n      .wxo-feedback__disclaimer {\n        font-size: 11px;\n        color: #525252;\n        line-height: 1.4;\n      }\n      .wxo-feedback__panel-actions {\n        display: flex;\n        margin: 0 -14px;\n        border-top: 1px solid #e0e0e0;\n        overflow: hidden;\n        border-bottom-left-radius: 7px;\n        border-bottom-right-radius: 7px;\n        min-height: 40px;\n      }\n      .wxo-feedback__cancel {\n        flex: 1;\n        background: white;\n        border: none !important;\n        border-right: 1px solid #e0e0e0 !important;\n        border-radius: 0;\n        padding: 0 12px;\n        height: 40px;\n        min-height: 40px;\n        font-size: 12px;\n        font-family: inherit;\n        cursor: pointer;\n        transition: background 0.15s;\n        box-sizing: border-box !important;\n        line-height: 40px;\n      }\n      .wxo-feedback__cancel:hover { background: #f4f4f4; }\n      .wxo-feedback__submit {\n        flex: 1;\n        background: ").concat(primaryColor, ";\n        color: white;\n        border: none !important;\n        border-radius: 0;\n        padding: 0 12px;\n        height: 40px;\n        min-height: 40px;\n        font-size: 12px;\n        font-family: inherit;\n        cursor: pointer;\n        transition: background 0.15s;\n        box-sizing: border-box !important;\n        line-height: 40px;\n      }\n      .wxo-feedback__submit:hover { background: #005A96; }\n      .wxo-feedback__thanks {\n        font-size: 12px;\n        color: #525252;\n      }\n\n      /* Input area */\n      .wxo-chat-input-area {\n        padding: 0;\n        border-top: 1px solid #e0e0e0;\n        background: white;\n        flex-shrink: 0;\n      }\n      .wxo-chat-input-area:focus-within {\n        border-top-color: #0f62fe;\n      }\n      .wxo-input-wrap {\n        position: relative;\n      }\n      .wxo-chat-input {\n        display: block;\n        width: 100%;\n        margin: 0;\n        padding: 12px 52px 12px 16px;\n        border: none !important;\n        border-radius: 0 0 12px 12px;\n        font-size: 14px;\n        outline: none !important;\n        box-shadow: none !important;\n        font-family: inherit;\n        box-sizing: border-box;\n        resize: none;\n        overflow-y: hidden;\n        min-height: 52px;\n        max-height: 160px;\n        line-height: 1.5;\n      }\n      .wxo-chat-window .wxo-chat-input:focus {\n        outline: none !important;\n        border: none !important;\n        box-shadow: inset 0 0 0 2px #0f62fe !important;\n      }\n      .wxo-chat-input:disabled { background: #f4f4f4; }\n      .wxo-chat-send {\n        position: absolute;\n        right: 14px;\n        bottom: 13px;\n        width: 26px;\n        height: 26px;\n        background: #c6c6c6;\n        color: #ffffff;\n        border: none;\n        border-radius: 50%;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        cursor: default;\n        transition: background 0.15s;\n        flex-shrink: 0;\n      }\n      .wxo-chat-send:not(:disabled) {\n        background: #161616;\n        cursor: pointer;\n      }\n      .wxo-chat-send:not(:disabled):hover { background: #393939; }\n\n      /* Scroll-to-bottom button */\n      .wxo-scroll-bottom {\n        position: absolute;\n        bottom: 66px;\n        left: 50%;\n        transform: translateX(-50%);\n        width: 32px;\n        height: 32px;\n        border-radius: 50%;\n        background: #161616;\n        border: none;\n        box-shadow: 0 2px 8px rgba(0,0,0,0.25);\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        color: #ffffff;\n        transition: box-shadow 0.15s, background 0.15s;\n        z-index: 10;\n      }\n      .wxo-scroll-bottom:hover {\n        background: #393939;\n        box-shadow: 0 3px 10px rgba(0,0,0,0.3);\n      }\n\n      /* Welcome screen */\n      .wxo-welcome {\n        display: flex;\n        flex-direction: column;\n        align-items: flex-start;\n        padding: 24px 20px 16px;\n        gap: 0;\n        flex: 1;\n        overflow-y: auto;\n      }\n      .wxo-welcome__greeting {\n        font-size: 28px;\n        font-weight: 400;\n        color: #161616;\n        margin-bottom: 8px;\n        line-height: 1.25;\n      }\n      .wxo-welcome__description {\n        font-size: 13px;\n        color: #525252;\n        line-height: 1.6;\n        margin-bottom: 24px;\n      }\n      .wxo-welcome__prompts-label {\n        font-size: 11px;\n        font-weight: 600;\n        color: #525252;\n        text-transform: uppercase;\n        letter-spacing: 0.08em;\n        margin-bottom: 10px;\n      }\n      .wxo-welcome__prompts {\n        display: flex;\n        flex-direction: column;\n        gap: 8px;\n        width: 100%;\n      }\n      .wxo-welcome__prompt {\n        background: white;\n        border: 1px solid #e0e0e0;\n        border-radius: 8px;\n        padding: 14px 16px;\n        font-size: 13px;\n        font-family: inherit;\n        color: #161616;\n        cursor: pointer;\n        text-align: left;\n        line-height: 1.5;\n        transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;\n        display: flex;\n        flex-direction: column;\n        align-items: flex-start;\n        min-height: 96px;\n        overflow: hidden;\n      }\n      .wxo-welcome__prompt:hover {\n        background: #f4f4f4;\n        border-color: #8d8d8d;\n        box-shadow: 0 2px 6px rgba(0,0,0,0.08);\n      }\n      .wxo-welcome__prompt-text {\n        display: -webkit-box;\n        -webkit-line-clamp: 3;\n        -webkit-box-orient: vertical;\n        overflow: hidden;\n        width: 100%;\n        margin-bottom: auto;\n      }\n      .wxo-welcome__prompt-arrow {\n        color: ").concat(primaryColor, ";\n        font-size: 14px;\n        line-height: 1;\n        align-self: flex-end;\n        margin-top: 8px;\n      }\n\n      /* Message action row (copy button) */\n      .wxo-message__actions {\n        display: flex;\n        gap: 4px;\n        margin-top: 4px;\n        padding: 0 4px;\n        opacity: 0;\n        transition: opacity 0.15s;\n      }\n      .wxo-message--agent .wxo-message__actions { opacity: 1; }\n      .wxo-message--user .wxo-message__actions { justify-content: flex-end; }\n      .wxo-message--user:hover .wxo-message__actions { opacity: 1; }\n      .wxo-copy-btn {\n        background: none;\n        border: none;\n        border-radius: 4px;\n        padding: 3px 6px;\n        height: 24px;\n        cursor: pointer;\n        color: #525252;\n        display: flex;\n        align-items: center;\n        transition: background 0.15s, color 0.15s;\n      }\n      .wxo-copy-btn:hover {\n        background: #f4f4f4;\n        color: #161616;\n      }\n\n      /* Custom tooltip (data-tooltip) */\n      [data-tooltip] { position: relative; }\n      [data-tooltip]::after {\n        content: attr(data-tooltip);\n        position: absolute;\n        bottom: calc(100% + 8px);\n        left: 50%;\n        transform: translateX(-50%);\n        background: #161616;\n        color: #ffffff;\n        font-size: 11px;\n        line-height: 1;\n        padding: 4px 8px;\n        border-radius: 4px;\n        white-space: nowrap;\n        pointer-events: none;\n        opacity: 0;\n        transition: opacity 0.1s;\n        z-index: 100;\n      }\n      [data-tooltip]::before {\n        content: '';\n        position: absolute;\n        bottom: calc(100% + 4px);\n        left: 50%;\n        transform: translateX(-50%);\n        border: 4px solid transparent;\n        border-top-color: #161616;\n        pointer-events: none;\n        opacity: 0;\n        transition: opacity 0.1s;\n        z-index: 100;\n      }\n      [data-tooltip]:hover::after,\n      [data-tooltip]:hover::before {\n        opacity: 1;\n        transition-delay: 0.1s;\n      }\n      /* These must stay absolutely positioned (overrides [data-tooltip]{position:relative}) */\n      .wxo-input-wrap .wxo-chat-send { position: absolute; }\n      .wxo-chat-window .wxo-scroll-bottom { position: absolute; }\n\n      /* Tooltip below variant (for header buttons at top of window) */\n      .tooltip-below[data-tooltip]::after {\n        bottom: auto;\n        top: calc(100% + 8px);\n      }\n      .tooltip-below[data-tooltip]::before {\n        bottom: auto;\n        top: calc(100% + 4px);\n        border-top-color: transparent;\n        border-bottom-color: #161616;\n      }\n\n      /* Clause assist button (\uD83D\uDCCB) in input wrap */\n      .wxo-assist-btn {\n        position: absolute;\n        right: 46px;\n        bottom: 13px;\n        width: 26px;\n        height: 26px;\n        background: none;\n        border: none;\n        border-radius: 50%;\n        font-size: 15px;\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        color: #525252;\n        transition: background 0.15s, color 0.15s;\n        line-height: 1;\n        padding: 0;\n      }\n      .wxo-assist-btn:hover { background: #f4f4f4; }\n      .wxo-assist-btn--active { color: ").concat(primaryColor, "; background: #e8f4ff; }\n\n      /* Wider right padding when assist button is present */\n      .wxo-input-wrap--with-assist .wxo-chat-input { padding-right: 80px; }\n\n      /* Clause assist panel (absolute overlay inside .wxo-chat-window) */\n      .wxo-assist-panel {\n        flex: 0 1 320px;\n        min-height: 0;\n        background: #e8f4ff;\n        border-top: 1px solid ").concat(primaryColor, ";\n        box-shadow: 0 -2px 8px rgba(0,0,0,0.1);\n        display: flex;\n        flex-direction: column;\n        overflow: hidden;\n        max-height: 0;\n        opacity: 0;\n        pointer-events: none;\n        transition: max-height 0.25s ease-out, opacity 0.25s ease-out;\n      }\n      .wxo-assist-panel--visible {\n        max-height: 320px;\n        opacity: 1;\n        pointer-events: all;\n      }\n      .wxo-assist-header {\n        display: flex;\n        justify-content: space-between;\n        align-items: center;\n        padding: 12px 16px 10px;\n        border-bottom: 1px solid #c6d9ee;\n        flex-shrink: 0;\n      }\n      .wxo-assist-title {\n        font-size: 13px;\n        font-weight: 600;\n        color: #161616;\n      }\n      .wxo-assist-close {\n        background: transparent;\n        border: none;\n        color: #525252;\n        font-size: 20px;\n        line-height: 1;\n        cursor: pointer;\n        padding: 2px 6px;\n        border-radius: 4px;\n      }\n      .wxo-assist-close:hover { background: #d0e8f8; color: #161616; }\n      .wxo-assist-body {\n        flex: 1;\n        height: 0;\n        overflow-y: auto;\n        padding: 12px 16px;\n        display: flex;\n        flex-direction: column;\n        gap: 12px;\n      }\n      .wxo-assist-row {\n        display: flex;\n        gap: 12px;\n        align-items: flex-start;\n      }\n      .wxo-assist-label {\n        font-size: 12px;\n        font-weight: 600;\n        color: #525252;\n        min-width: 72px;\n        flex-shrink: 0;\n        padding-top: 8px;\n      }\n      .wxo-assist-field {\n        flex: 1;\n        display: flex;\n        flex-direction: column;\n        gap: 6px;\n      }\n      .wxo-assist-select {\n        width: 100%;\n        padding: 6px 28px 6px 10px;\n        border: 1px solid #c6c6c6;\n        border-radius: 4px;\n        font-size: 13px;\n        font-family: inherit;\n        background: white url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23525252' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\") no-repeat right 8px center;\n        -webkit-appearance: none;\n        -moz-appearance: none;\n        appearance: none;\n        box-sizing: border-box;\n      }\n      .wxo-assist-select:focus {\n        outline: none;\n        border-color: ").concat(primaryColor, ";\n        box-shadow: 0 0 0 1px ").concat(primaryColor, ";\n      }\n      .wxo-assist-select:disabled { background: #f4f4f4; color: #8d8d8d; }\n      .wxo-assist-preview {\n        background: #f4f4f4;\n        border: 1px solid #e0e0e0;\n        border-radius: 4px;\n        padding: 8px 10px;\n        font-size: 12px;\n        color: #161616;\n        line-height: 1.5;\n        min-height: 40px;\n      }\n      .wxo-assist-preview--empty { color: #8d8d8d; font-style: italic; }\n      .wxo-assist-preview-text {\n        display: -webkit-box;\n        -webkit-box-orient: vertical;\n        -webkit-line-clamp: 3;\n        overflow: hidden;\n      }\n      .wxo-assist-preview-text--expanded {\n        display: block;\n        overflow: visible;\n      }\n      .wxo-assist-preview-toggle {\n        background: none;\n        border: none;\n        color: ").concat(primaryColor, ";\n        font-size: 11px;\n        font-family: inherit;\n        cursor: pointer;\n        padding: 3px 0;\n        display: block;\n        width: fit-content;\n        margin-left: auto;\n        margin-top: 6px;\n      }\n      .wxo-assist-change {\n        width: 100%;\n        padding: 6px 10px;\n        border: 1px solid #c6c6c6;\n        border-radius: 4px;\n        font-size: 13px;\n        font-family: inherit;\n        resize: none;\n        box-sizing: border-box;\n      }\n      .wxo-assist-change:focus {\n        outline: none;\n        border-color: ").concat(primaryColor, ";\n        box-shadow: 0 0 0 1px ").concat(primaryColor, ";\n      }\n      .wxo-assist-generated {\n        flex: 1;\n        background: #f4f4f4;\n        border: 1px solid #e0e0e0;\n        border-radius: 4px;\n        padding: 8px 10px;\n        font-size: 13px;\n        color: #161616;\n        line-height: 1.5;\n        min-height: 40px;\n      }\n      .wxo-assist-footer {\n        padding: 10px 16px 12px;\n        border-top: 1px solid #c6d9ee;\n        flex-shrink: 0;\n      }\n      .wxo-assist-insert {\n        width: 100%;\n        padding: 10px;\n        background: ").concat(primaryColor, ";\n        color: white;\n        border: none;\n        border-radius: 4px;\n        font-size: 13px;\n        font-family: inherit;\n        cursor: pointer;\n        transition: background 0.15s;\n      }\n      .wxo-assist-insert:hover:not(:disabled) { background: #0353e9; }\n      .wxo-assist-insert:disabled { background: #c6c6c6; cursor: not-allowed; }\n    ");
    document.head.appendChild(style);
  }
  destroy() {
    this.chatWindows.forEach(win => win.destroy());
    this.chatWindows.clear();
    if (this.agentSelector) this.agentSelector.destroy();
    if (this.floatingButton) this.floatingButton.destroy();
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    var styleEl = document.getElementById('wxo-sdk-styles');
    if (styleEl) styleEl.parentNode.removeChild(styleEl);
  }
}

// Made with Bob

/**
 * wxo-js-sdk - Pure JavaScript SDK for IBM watsonx Orchestrate
 *
 * Drop-in replacement for IBM's wxoLoader.js
 *
 * Usage:
 *   <script>
 *     window.wxOConfiguration = {
 *       orchestrationID: "...",
 *       hostURL: "https://us-south.watson-orchestrate.cloud.ibm.com",
 *       rootElementID: "root",
 *       agents: [ ... ],   // our enhancement: multiple agents
 *       debug: false
 *     };
 *   </script>
 *   <script src="wxo-sdk.min.js"></script>
 *   <script>wxoLoader.init();</script>
 */

var client = new WxOClient();
var uiManager = null;
var wxoLoader = {
  version: '0.1.0',
  /**
   * Initialize the SDK.
   * Initializes WxOClient and launches the full chat UI automatically.
   * @returns {Promise<void>}
   */
  init() {
    var _this = this;
    return _asyncToGenerator(function* () {
      try {
        var _window$wxOConfigurat;
        yield client.init();
        uiManager = new UIManager(client.config, client);
        uiManager.init();
        if ((_window$wxOConfigurat = window.wxOConfiguration) !== null && _window$wxOConfigurat !== void 0 && _window$wxOConfigurat.debug) {
          console.log('[wxo-sdk] SDK loaded. Version:', _this.version);
        }
      } catch (error) {
        console.error('[wxo-sdk] Failed to initialize SDK:', error);
        throw error;
      }
    })();
  },
  /**
   * Destroy and cleanup all UI and sessions.
   */
  destroy() {
    if (uiManager) {
      uiManager.destroy();
      uiManager = null;
    }
    client.disconnect();
  },
  /**
   * Check if SDK is ready.
   * @returns {boolean}
   */
  isReady() {
    return client.isReady();
  }
};

// Expose globally for browser <script> tag usage
if (typeof window !== 'undefined') {
  window.wxoLoader = wxoLoader;
}

// Made with Bob

export { wxoLoader as default };
//# sourceMappingURL=wxo-sdk.esm.js.map
