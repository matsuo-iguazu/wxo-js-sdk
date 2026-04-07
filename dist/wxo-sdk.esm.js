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
        primaryColor: '#0f62fe',
        fontFamily: 'IBM Plex Sans, sans-serif',
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
      feedbackWebhookUrl: null,
      // POST destination for feedback data (optional)
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
   * Check if debug mode is enabled
   * @returns {boolean} True if debug mode is enabled
   */
  isDebug() {
    var _this$config4;
    return ((_this$config4 = this.config) === null || _this$config4 === void 0 ? void 0 : _this$config4.debug) === true;
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
    this.config = config;
    this.httpClient = httpClient;
    this.sessions = new Map(); // agentId -> session data
    this.currentAgentId = null;
    this.messageHandlers = [];
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
      // Note: user messages are returned to the caller for display.
      // onMessage handlers are reserved for agent responses only.

      // Send to orchestrate/runs with streaming
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
   * POST /mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000&multiple_content=true
   * @private
   */
  _sendToRuns(session, text) {
    var _this5 = this;
    return _asyncToGenerator(function* () {
      var path = '/mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000&multiple_content=true';
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
      var response = yield _this5.httpClient.stream(path, body);
      yield _this5._handleStreamResponse(response, session);
    })();
  }

  /**
   * Handle streaming response (SSE or chunked)
   * @private
   */
  _handleStreamResponse(response, session) {
    var _this6 = this;
    return _asyncToGenerator(function* () {
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var agentText = '';
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
            _this6._processStreamLine(line, text => {
              agentText += text;
            });
          }
        }

        // Process any remaining buffer content after stream ends
        if (buffer.trim()) {
          if (_this6.config.isDebug()) {
            console.log('[wxo-sdk] Stream remaining buffer:', JSON.stringify(buffer));
          }
          _this6._processStreamLine(buffer, text => {
            agentText += text;
          });
        }
      } finally {
        reader.releaseLock();
      }

      // Emit the complete agent message
      if (agentText) {
        var agentMessage = {
          id: _this6._generateMessageId(),
          text: agentText,
          sender: 'agent',
          timestamp: Date.now()
        };
        session.messages.push(agentMessage);
        _this6._triggerMessageHandlers(agentMessage);
      }
      if (_this6.config.isDebug()) {
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
          return content.filter(c => c.response_type === 'text' || c.type === 'text').map(c => {
            var _c$text$value, _c$text;
            return typeof c.text === 'string' ? c.text : (_c$text$value = (_c$text = c.text) === null || _c$text === void 0 ? void 0 : _c$text.value) !== null && _c$text$value !== void 0 ? _c$text$value : '';
          }).join('');
        }
        if (typeof content === 'string') return content;
      }
      // message.completed: fallback for full final text
      if (parsed.event === 'message.completed') {
        var _parsed$data$content, _parsed$data2, _parsed$data3;
        var _content = (_parsed$data$content = (_parsed$data2 = parsed.data) === null || _parsed$data2 === void 0 ? void 0 : _parsed$data2.content) !== null && _parsed$data$content !== void 0 ? _parsed$data$content : (_parsed$data3 = parsed.data) === null || _parsed$data3 === void 0 || (_parsed$data3 = _parsed$data3.delta) === null || _parsed$data3 === void 0 ? void 0 : _parsed$data3.content;
        if (Array.isArray(_content)) {
          return _content.filter(c => c.response_type === 'text' || c.type === 'text').map(c => {
            var _c$text$value2, _c$text2;
            return typeof c.text === 'string' ? c.text : (_c$text$value2 = (_c$text2 = c.text) === null || _c$text2 === void 0 ? void 0 : _c$text2.value) !== null && _c$text$value2 !== void 0 ? _c$text$value2 : '';
          }).join('');
        }
      }
      return null; // all other events (run.started, run.completed, etc.)
    }

    // Fallback for other formats
    if (typeof parsed === 'string') return parsed;
    if ((_parsed$delta = parsed.delta) !== null && _parsed$delta !== void 0 && _parsed$delta.content) return parsed.delta.content;
    if ((_parsed$choices = parsed.choices) !== null && _parsed$choices !== void 0 && (_parsed$choices = _parsed$choices[0]) !== null && _parsed$choices !== void 0 && (_parsed$choices = _parsed$choices.delta) !== null && _parsed$choices !== void 0 && _parsed$choices.content) return parsed.choices[0].delta.content;
    return null;
  }

  /**
   * Send feedback for a message
   * @param {string} messageId
   * @param {string} feedback - 'positive' or 'negative'
   * @param {string} comment
   */
  sendFeedback(messageId, feedback) {
    var _arguments2 = arguments,
      _this7 = this;
    return _asyncToGenerator(function* () {
      var comment = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : '';
      var messageText = _arguments2.length > 3 && _arguments2[3] !== undefined ? _arguments2[3] : '';
      var webhookUrl = _this7.config.getFeedbackWebhookUrl();
      var session = _this7.sessions.get(_this7.currentAgentId);
      var agentConfig = _this7.config.getAgent(_this7.currentAgentId);
      var payload = {
        timestamp: new Date().toISOString(),
        rating: feedback,
        comment,
        message_id: messageId,
        message_text: messageText,
        thread_id: (session === null || session === void 0 ? void 0 : session.threadId) || null,
        agent_id: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.agentId) || _this7.currentAgentId,
        agent_name: (agentConfig === null || agentConfig === void 0 ? void 0 : agentConfig.name) || _this7.currentAgentId,
        orchestration_id: _this7.config.get('orchestrationID')
      };
      if (webhookUrl) {
        yield fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      } else if (_this7.config.isDebug()) {
        console.log('[wxo-sdk] Feedback (no feedbackWebhookUrl configured):', payload);
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
    var _this8 = this;
    return _asyncToGenerator(function* () {
      var session = _this8.sessions.get(agentId);
      if (!session || !session.threadId) {
        _this8.sessions.delete(agentId);
        return;
      }
      try {
        yield _this8.httpClient.patch("/mfe_home_archer/api/v1/threads/".concat(session.threadId), {
          status: 'closed'
        });
        if (_this8.config.isDebug()) {
          console.log("[wxo-sdk] Thread closed: ".concat(session.threadId));
        }
      } catch (error) {
        console.warn('[wxo-sdk] Failed to close thread (non-fatal):', error.message);
      }
      session.isActive = false;
      _this8.sessions.delete(agentId);
      if (_this8.currentAgentId === agentId) {
        _this8.currentAgentId = null;
      }
    })();
  }

  /**
   * Register message handler
   * @param {Function} handler
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
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
    this.errorHandlers = [];
    this.currentAgentId = null;
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

        // Initialize chat manager
        _this.chatManager = new ChatManager(_this.config, _this.httpClient);
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
      var comment = _arguments2.length > 2 && _arguments2[2] !== undefined ? _arguments2[2] : '';
      var messageText = _arguments2.length > 3 && _arguments2[3] !== undefined ? _arguments2[3] : '';
      _this4._ensureInitialized();
      var feedback = isPositive ? 'positive' : 'negative';
      return yield _this4.chatManager.sendFeedback(messageId, feedback, comment, messageText);
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
   * Register error handler
   * @param {Function} handler
   */
  onError(handler) {
    this._ensureInitialized();
    this.chatManager.onError(handler);
  }

  /**
   * End chat session for an agent
   * @param {string} agentId
   */
  endChat(agentId) {
    var _this6 = this;
    return _asyncToGenerator(function* () {
      _this6._ensureInitialized();
      return yield _this6.chatManager.endSession(agentId);
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
    this.el.innerHTML = "\n      <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\" fill=\"white\" width=\"28\" height=\"28\">\n        <path d=\"M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14c2.3 0 4.5-.6 6.5-1.6L28 30l-1.6-5.5C27.4 22.5 30 19.4 30 16 30 8.3 23.7 2 16 2zm0 26c-6.6 0-12-5.4-12-12S9.4 4 16 4s12 5.4 12 12-5.4 12-12 12z\"/>\n        <path d=\"M9 13h14v2H9zm0 4h10v2H9z\"/>\n      </svg>\n    ";
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
 * Chat window UI component
 * Renders the full chat interface: header, messages, input, feedback buttons
 */
class ChatWindow {
  constructor(_ref) {
    var {
      agent,
      messages = [],
      onSend,
      onFeedback,
      onMinimize,
      onReload,
      feedbackEnabled = true
    } = _ref;
    this.agent = agent;
    this.messages = [...messages];
    this.onSend = onSend;
    this.onFeedback = onFeedback;
    this.onMinimize = onMinimize;
    this.onReload = onReload;
    this.feedbackEnabled = feedbackEnabled;
    this.el = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.loadingEl = null;
    this.isExpanded = false;
  }
  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-chat-window';
    this.el.innerHTML = "\n      <div class=\"wxo-chat-header\">\n        <div class=\"wxo-chat-header__title\">\n          <span class=\"wxo-chat-header__icon\">".concat(this.agent.icon || '💬', "</span>\n          <span class=\"wxo-chat-header__name\">").concat(this._escapeHtml(this.agent.name), "</span>\n        </div>\n        <div class=\"wxo-chat-header__actions\">\n          <button class=\"wxo-btn-icon wxo-btn-reload\" aria-label=\"Reload\" title=\"\u4F1A\u8A71\u3092\u30EA\u30BB\u30C3\u30C8\">\u21BA</button>\n          <button class=\"wxo-btn-icon wxo-btn-resize\" aria-label=\"Resize\" title=\"\u30B5\u30A4\u30BA\u5909\u66F4\">\u2922</button>\n          <button class=\"wxo-btn-icon wxo-btn-minimize\" aria-label=\"Minimize\" title=\"\u6700\u5C0F\u5316\">\u2212</button>\n        </div>\n      </div>\n      <div class=\"wxo-chat-messages\"></div>\n      <div class=\"wxo-chat-input-area\">\n        <div class=\"wxo-input-wrap\">\n          <textarea class=\"wxo-chat-input\" rows=\"1\" placeholder=\"\u4F55\u304B\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044...\"></textarea>\n          <button class=\"wxo-chat-send\" aria-label=\"\u9001\u4FE1\">\n            <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" width=\"16\" height=\"16\" xmlns=\"http://www.w3.org/2000/svg\">\n              <path d=\"M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z\"/>\n            </svg>\n          </button>\n        </div>\n      </div>\n    ");
    this.messagesEl = this.el.querySelector('.wxo-chat-messages');
    this.inputEl = this.el.querySelector('.wxo-chat-input');
    this.sendBtn = this.el.querySelector('.wxo-chat-send');

    // Re-render existing messages
    this.messages.forEach(msg => this._appendMessageEl(msg));

    // Event listeners
    this.el.querySelector('.wxo-btn-minimize').addEventListener('click', () => this.onMinimize());
    this.el.querySelector('.wxo-btn-reload').addEventListener('click', () => this.onReload());
    this.el.querySelector('.wxo-btn-resize').addEventListener('click', () => this._toggleResize());
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

    container.appendChild(this.el);
    this._scrollToBottom();
  }
  addMessage(message) {
    this._hideLoading();
    this.messages.push(message);
    this._appendMessageEl(message);
    this._scrollToBottom();
    if (message.sender === 'agent') {
      this._setInputDisabled(false);
    }
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
    if (this.sendBtn) this.sendBtn.disabled = disabled;
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
      hour: '2-digit',
      minute: '2-digit'
    });
    metaEl.textContent = "".concat(senderName, "  ").concat(timeStr);
    div.appendChild(metaEl);

    // Bubble content
    var contentEl = document.createElement('div');
    contentEl.className = 'wxo-message__content';
    if (isLoading) {
      contentEl.innerHTML = '<span class="wxo-loading-dots"><span>●</span><span>●</span><span>●</span></span>';
    } else if (message.sender === 'agent' && typeof window.marked !== 'undefined') {
      contentEl.innerHTML = window.marked.parse(message.text || '');
    } else {
      contentEl.textContent = message.text || '';
    }
    div.appendChild(contentEl);

    // Feedback buttons for agent messages (not loading)
    if (!isLoading && message.sender === 'agent' && this.feedbackEnabled && message.id && this.onFeedback) {
      var fbEl = document.createElement('div');
      fbEl.className = 'wxo-feedback';
      var thumbUp = document.createElement('button');
      thumbUp.className = 'wxo-feedback__btn';
      thumbUp.textContent = '👍';
      thumbUp.addEventListener('click', () => this._onRatingClick(message.id, true, fbEl, message.text));
      var thumbDown = document.createElement('button');
      thumbDown.className = 'wxo-feedback__btn';
      thumbDown.textContent = '👎';
      thumbDown.addEventListener('click', () => this._onRatingClick(message.id, false, fbEl, message.text));
      fbEl.appendChild(thumbUp);
      fbEl.appendChild(thumbDown);
      div.appendChild(fbEl);
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
  _onRatingClick(messageId, isPositive, fbEl, messageText) {
    var rating = isPositive ? '👍' : '👎';
    fbEl.innerHTML = "\n      <div class=\"wxo-feedback__selected\">".concat(rating, "</div>\n      <div class=\"wxo-feedback__comment-wrap\">\n        <textarea class=\"wxo-feedback__comment\" placeholder=\"\u30B3\u30E1\u30F3\u30C8\u304C\u3042\u308C\u3070\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF08\u4EFB\u610F\uFF09\" rows=\"2\"></textarea>\n        <div class=\"wxo-feedback__comment-actions\">\n          <button class=\"wxo-feedback__submit\">\u9001\u4FE1</button>\n          <span class=\"wxo-feedback__skip\">\u30B9\u30AD\u30C3\u30D7</span>\n        </div>\n      </div>\n    ");
    var textarea = fbEl.querySelector('.wxo-feedback__comment');
    fbEl.querySelector('.wxo-feedback__submit').addEventListener('click', () => {
      this._submitFeedback(messageId, isPositive, textarea.value.trim(), fbEl, messageText);
    });
    fbEl.querySelector('.wxo-feedback__skip').addEventListener('click', () => {
      this._submitFeedback(messageId, isPositive, '', fbEl, messageText);
    });
    this._scrollToBottom();
  }
  _submitFeedback(messageId, isPositive, comment, fbEl, messageText) {
    this.onFeedback(messageId, isPositive, comment, messageText);
    fbEl.innerHTML = "<span class=\"wxo-feedback__thanks\">".concat(isPositive ? '👍' : '👎', " \u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059</span>");
  }
  _toggleResize() {
    this.isExpanded = !this.isExpanded;
    this.el.classList.toggle('wxo-chat-window--expanded', this.isExpanded);
    var btn = this.el.querySelector('.wxo-btn-resize');
    btn.textContent = this.isExpanded ? '⤡' : '⤢';
  }
  _scrollToBottom() {
    if (this.messagesEl) {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
  }
  _escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
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

    // Route incoming messages to the active chat window
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

      // First open for this agent: start session and create window
      _this2.currentAgentId = agentId;
      yield _this2.client.startChat(agentId);
      var agent = _this2.config.getAgent(agentId);
      var feedbackEnabled = _this2.config.isFeatureEnabled('feedback');
      var chatWindow = new ChatWindow({
        agent,
        messages: _this2.client.getMessages(),
        feedbackEnabled,
        onSend: function () {
          var _onSend = _asyncToGenerator(function* (text) {
            yield _this2.client.sendMessage(text);
          });
          function onSend(_x) {
            return _onSend.apply(this, arguments);
          }
          return onSend;
        }(),
        onFeedback: (messageId, isPositive, comment, messageText) => {
          _this2.client.sendFeedback(messageId, isPositive, comment, messageText).catch(e => {
            console.warn('[wxo-sdk] Feedback error:', e);
          });
        },
        onMinimize: () => _this2._minimizeChat(),
        onReload: () => _this2._reloadChat()
      });
      chatWindow.render(_this2.container);
      _this2.chatWindows.set(agentId, chatWindow);
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

      // Destroy the current window for this agent
      var win = _this3.chatWindows.get(agentId);
      if (win) {
        win.destroy();
        _this3.chatWindows.delete(agentId);
      }

      // End the session (closes thread, clears messages in ChatManager)
      yield _this3.client.endChat(agentId).catch(() => {});
      _this3.currentAgentId = null;

      // Reopen with a fresh session
      yield _this3._openChat(agentId);
    })();
  }

  // ─── CSS injection ──────────────────────────────────────────────────────────

  _injectStyles() {
    if (document.getElementById('wxo-sdk-styles')) return;
    var primaryColor = this.config.get('theme.primaryColor') || '#0f62fe';
    var style = document.createElement('style');
    style.id = 'wxo-sdk-styles';
    style.textContent = "\n      #wxo-ui-container {\n        position: fixed;\n        bottom: 20px;\n        right: 20px;\n        z-index: 99999;\n        display: flex;\n        flex-direction: column-reverse;\n        align-items: flex-end;\n        gap: 10px;\n        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;\n      }\n\n      /* Floating button */\n      .wxo-floating-btn {\n        width: 60px;\n        height: 60px;\n        border-radius: 50%;\n        background: ".concat(primaryColor, ";\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        cursor: pointer;\n        box-shadow: 0 4px 12px rgba(0,0,0,0.25);\n        transition: transform 0.2s, box-shadow 0.2s;\n        flex-shrink: 0;\n      }\n      .wxo-floating-btn:hover {\n        transform: scale(1.05);\n        box-shadow: 0 6px 16px rgba(0,0,0,0.3);\n      }\n      .wxo-floating-btn--active {\n        background: #0043ce;\n      }\n\n      /* Agent selector rise animation */\n      @keyframes wxo-agent-rise {\n        0% {\n          opacity: 0;\n          transform: translateY(52px) rotate(90deg);\n        }\n        40% {\n          opacity: 1;\n        }\n        100% {\n          opacity: 1;\n          transform: translateY(0) rotate(0deg);\n        }\n      }\n\n      /* Agent selector */\n      .wxo-agent-selector {\n        flex-direction: column;\n        gap: 8px;\n        align-items: flex-end;\n      }\n      .wxo-agent-item {\n        display: flex;\n        align-items: center;\n        justify-content: flex-end;\n        background: white;\n        border-radius: 24px;\n        padding: 10px 18px;\n        cursor: pointer;\n        box-shadow: 0 2px 8px rgba(0,0,0,0.15);\n        white-space: nowrap;\n        transform-origin: right center;\n        animation: wxo-agent-rise 0.45s cubic-bezier(0.34, 1.3, 0.64, 1) both;\n      }\n      .wxo-agent-item:hover {\n        box-shadow: 0 4px 12px rgba(0,0,0,0.2);\n      }\n      .wxo-agent-item__label {\n        font-size: 14px;\n        font-weight: 500;\n        color: #161616;\n      }\n\n      /* Chat window */\n      .wxo-chat-window {\n        width: 380px;\n        height: 580px;\n        background: white;\n        border-radius: 12px;\n        box-shadow: 0 8px 32px rgba(0,0,0,0.2);\n        display: flex;\n        flex-direction: column;\n        overflow: hidden;\n        transition: width 0.3s, height 0.3s;\n      }\n      .wxo-chat-window--expanded {\n        width: 620px;\n        height: 720px;\n      }\n\n      /* Chat header */\n      .wxo-chat-header {\n        background: #ffffff;\n        color: #161616;\n        padding: 14px 16px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        flex-shrink: 0;\n        border-bottom: 1px solid #e0e0e0;\n      }\n      .wxo-chat-header__title {\n        display: flex;\n        align-items: center;\n        gap: 8px;\n        font-weight: 700;\n        font-size: 15px;\n        color: #161616;\n      }\n      .wxo-chat-header__icon {\n        font-size: 20px;\n      }\n      .wxo-chat-header__actions {\n        display: flex;\n        gap: 4px;\n      }\n      .wxo-btn-icon {\n        background: none;\n        border: none;\n        color: #525252;\n        cursor: pointer;\n        font-size: 18px;\n        padding: 4px 6px;\n        border-radius: 4px;\n        line-height: 1;\n        transition: background 0.15s, color 0.15s;\n      }\n      .wxo-btn-icon:hover {\n        background: #f4f4f4;\n        color: #161616;\n      }\n\n      /* Messages area - gradient: white top \u2192 #ebf0fa bottom */\n      .wxo-chat-messages {\n        flex: 1;\n        overflow-y: auto;\n        padding: 16px;\n        background: linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #ebf0fa 100%);\n        display: flex;\n        flex-direction: column;\n        gap: 12px;\n      }\n\n      /* Individual messages */\n      .wxo-message {\n        max-width: 80%;\n        display: flex;\n        flex-direction: column;\n      }\n      .wxo-message--user {\n        align-self: flex-end;\n        align-items: flex-end;\n      }\n      .wxo-message--agent {\n        align-self: flex-start;\n        align-items: flex-start;\n      }\n\n      /* Sender name + time above bubble */\n      .wxo-message__meta {\n        font-size: 11px;\n        font-weight: 700;\n        color: #161616;\n        margin-bottom: 3px;\n        padding: 0 4px;\n      }\n      .wxo-message--user .wxo-message__meta { text-align: right; }\n      .wxo-message--agent .wxo-message__meta { text-align: left; }\n\n      .wxo-message__content {\n        padding: 10px 14px;\n        border-radius: 12px;\n        font-size: 14px;\n        line-height: 1.5;\n      }\n      .wxo-message--user .wxo-message__content {\n        background: #e0e0e0;\n        color: #161616;\n        border-bottom-right-radius: 4px;\n      }\n      .wxo-message--agent .wxo-message__content {\n        background: transparent;\n        color: #161616;\n        border: none;\n        padding-left: 0;\n      }\n\n      /* Loading dots */\n      @keyframes wxo-blink {\n        0%, 80%, 100% { opacity: 0.2; }\n        40% { opacity: 1; }\n      }\n      .wxo-loading-dots span {\n        animation: wxo-blink 1.4s infinite;\n        display: inline-block;\n        margin: 0 1px;\n        font-size: 20px;\n        line-height: 1;\n      }\n      .wxo-loading-dots span:nth-child(2) { animation-delay: 0.2s; }\n      .wxo-loading-dots span:nth-child(3) { animation-delay: 0.4s; }\n\n      /* Markdown inside agent messages */\n      .wxo-message--agent .wxo-message__content p { margin: 4px 0; }\n      .wxo-message--agent .wxo-message__content h1,\n      .wxo-message--agent .wxo-message__content h2,\n      .wxo-message--agent .wxo-message__content h3 {\n        margin: 6px 0 3px; font-size: 1em; font-weight: 600;\n      }\n      .wxo-message--agent .wxo-message__content table {\n        border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 13px;\n      }\n      .wxo-message--agent .wxo-message__content th,\n      .wxo-message--agent .wxo-message__content td {\n        border: 1px solid #ccc; padding: 4px 8px; text-align: left;\n      }\n      .wxo-message--agent .wxo-message__content th {\n        background: #f0f0f0; font-weight: 600;\n      }\n      .wxo-message--agent .wxo-message__content code {\n        background: #f4f4f4; padding: 1px 4px; border-radius: 3px;\n        font-family: monospace; font-size: 0.9em;\n      }\n      .wxo-message--agent .wxo-message__content pre {\n        background: #f4f4f4; padding: 10px; border-radius: 4px;\n        overflow-x: auto; margin: 4px 0;\n      }\n      .wxo-message--agent .wxo-message__content ul,\n      .wxo-message--agent .wxo-message__content ol {\n        margin: 4px 0; padding-left: 20px;\n      }\n\n      /* Feedback */\n      .wxo-feedback {\n        display: flex;\n        flex-direction: column;\n        gap: 4px;\n        margin-top: 4px;\n        padding: 0 4px;\n        max-width: 260px;\n      }\n      .wxo-feedback > .wxo-feedback__btn {\n        align-self: flex-start;\n      }\n      .wxo-feedback__btn {\n        background: white;\n        border: 1px solid #e0e0e0;\n        border-radius: 4px;\n        padding: 3px 8px;\n        cursor: pointer;\n        font-size: 13px;\n        transition: background 0.15s;\n      }\n      .wxo-feedback__btn:hover { background: #f0f0f0; }\n      .wxo-feedback__selected {\n        font-size: 16px;\n        margin-bottom: 4px;\n      }\n      .wxo-feedback__comment-wrap {\n        display: flex;\n        flex-direction: column;\n        gap: 6px;\n        width: 100%;\n      }\n      .wxo-feedback__comment {\n        width: 100%;\n        border: 1px solid #c6c6c6;\n        border-radius: 6px;\n        padding: 6px 8px;\n        font-size: 13px;\n        font-family: inherit;\n        resize: none;\n        box-sizing: border-box;\n        outline: none;\n      }\n      .wxo-feedback__comment:focus { border-color: ").concat(primaryColor, "; }\n      .wxo-feedback__comment-actions {\n        display: flex;\n        align-items: center;\n        gap: 10px;\n      }\n      .wxo-feedback__submit {\n        background: #161616;\n        color: white;\n        border: none;\n        border-radius: 4px;\n        padding: 4px 12px;\n        font-size: 12px;\n        cursor: pointer;\n      }\n      .wxo-feedback__submit:hover { background: #393939; }\n      .wxo-feedback__skip {\n        font-size: 12px;\n        color: #525252;\n        cursor: pointer;\n        text-decoration: underline;\n      }\n      .wxo-feedback__skip:hover { color: #161616; }\n      .wxo-feedback__thanks {\n        font-size: 12px;\n        color: #525252;\n      }\n\n      /* Input area */\n      .wxo-chat-input-area {\n        padding: 12px;\n        border-top: 1px solid #e0e0e0;\n        background: white;\n        flex-shrink: 0;\n      }\n      .wxo-input-wrap {\n        position: relative;\n      }\n      .wxo-chat-input {\n        width: 100%;\n        padding: 10px 46px 10px 14px;\n        border: 1px solid #c6c6c6;\n        border-radius: 8px;\n        font-size: 14px;\n        outline: none;\n        font-family: inherit;\n        box-sizing: border-box;\n        resize: none;\n        overflow-y: hidden;\n        min-height: 42px;\n        max-height: 160px;\n        line-height: 1.5;\n        transition: border-color 0.15s;\n      }\n      .wxo-chat-input:focus { border-color: ").concat(primaryColor, "; }\n      .wxo-chat-input:disabled { background: #f4f4f4; }\n      .wxo-chat-send {\n        position: absolute;\n        right: 6px;\n        bottom: 6px;\n        width: 30px;\n        height: 30px;\n        background: #c6c6c6;\n        color: #ffffff;\n        border: none;\n        border-radius: 50%;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        cursor: default;\n        transition: background 0.15s;\n        flex-shrink: 0;\n      }\n      .wxo-chat-send:not(:disabled) {\n        background: #161616;\n        cursor: pointer;\n      }\n      .wxo-chat-send:not(:disabled):hover { background: #393939; }\n    ");
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
