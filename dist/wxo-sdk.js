(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.wxoLoader = factory());
})(this, (function () { 'use strict';

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
      const merged = {
        ...defaults
      };
      for (const key in userConfig) {
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
      const required = ['orchestrationID', 'hostURL'];
      const missing = required.filter(field => !this.config[field]);
      if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
      }

      // Validate hostURL format
      try {
        new URL(this.config.hostURL);
      } catch (e) {
        throw new Error(`Invalid hostURL: ${this.config.hostURL}`);
      }

      // Validate agents array if multiAgent is enabled
      if (this.config.features.multiAgent) {
        if (!Array.isArray(this.config.agents) || this.config.agents.length === 0) {
          throw new Error('agents array is required when multiAgent feature is enabled');
        }

        // Validate each agent configuration
        // Based on IBM watsonx Orchestrate requirements
        this.config.agents.forEach((agent, index) => {
          const agentRequired = ['id', 'name', 'agentId'];
          const agentMissing = agentRequired.filter(field => !agent[field]);
          if (agentMissing.length > 0) {
            throw new Error(`Agent at index ${index} is missing required fields: ${agentMissing.join(', ')}`);
          }

          // agentEnvironmentId is required for Live environment
          if (!agent.agentEnvironmentId) {
            console.warn(`[wxo-sdk] Agent at index ${index} is missing agentEnvironmentId (required for Live environment)`);
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
      const keys = key.split('.');
      let value = this.config;
      for (const k of keys) {
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
      return {
        ...this.config
      };
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
      return this.config?.agents || [];
    }

    /**
     * Check if a feature is enabled
     * @param {string} featureName - Feature name
     * @returns {boolean} True if feature is enabled
     */
    isFeatureEnabled(featureName) {
      return this.config?.features?.[featureName] === true;
    }

    /**
     * Get the feedback webhook URL (if configured)
     * @returns {string|null}
     */
    getFeedbackWebhookUrl() {
      return this.config?.feedbackWebhookUrl || null;
    }

    /**
     * Get feedback user info (spread into payload)
     * @returns {Object|null}
     */
    getFeedbackUserInfo() {
      return this.config?.feedbackUserInfo || null;
    }

    /**
     * Get feedback options (categories, showDetails, disclaimer per positive/negative)
     * @returns {Object}
     */
    getFeedbackOptions() {
      return this.config?.feedbackOptions || null;
    }

    /**
     * Get locale for chat starter settings (welcome message / prompts).
     * Priority: config.defaultLocale → navigator.language → null
     * @returns {string|null}
     */
    getLocale() {
      return this.config?.defaultLocale || (typeof navigator !== 'undefined' ? navigator.language : null) || null;
    }

    /**
     * Check if debug mode is enabled
     * @returns {boolean} True if debug mode is enabled
     */
    isDebug() {
      return this.config?.debug === true;
    }
  }

  // Export singleton instance
  var Config$1 = new Config();

  // Made with Bob

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
      const crn = this.config.get('crn');
      if (crn) {
        this.ibmHeaders['x-ibm-wo-crn'] = crn;
      }
    }

    /**
     * Get all current headers (base + IBM)
     * @returns {Object}
     */
    getHeaders(extra = {}) {
      return {
        ...this.baseHeaders,
        ...this.ibmHeaders,
        ...extra
      };
    }

    /**
     * Build full URL from path
     * @private
     */
    _buildURL(path) {
      const base = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
      const p = path.startsWith('/') ? path : `/${path}`;
      return `${base}${p}`;
    }

    /**
     * Make HTTP request
     * @private
     */
    async _request(method, path, options = {}) {
      const url = this._buildURL(path);
      const {
        body,
        headers = {},
        ...rest
      } = options;
      const requestConfig = {
        method,
        headers: this.getHeaders(headers),
        ...rest
      };
      if (body !== undefined) {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      if (this.config.isDebug()) {
        console.log(`[wxo-sdk] ${method} ${url}`, requestConfig);
      }
      const response = await fetch(url, requestConfig);
      const contentType = response.headers.get('content-type') || '';
      let data;
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      if (!response.ok) {
        const error = new Error(data && data.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = data;
        throw error;
      }
      if (this.config.isDebug()) {
        console.log(`[wxo-sdk] Response:`, data);
      }
      return data;
    }

    /**
     * Make a streaming POST request, yielding SSE/chunk lines
     * @param {string} path
     * @param {Object} body
     * @param {Object} options
     * @returns {Response} raw fetch Response for stream reading
     */
    async stream(path, body, options = {}) {
      const url = this._buildURL(path);
      const {
        headers = {}
      } = options;
      const requestConfig = {
        method: 'POST',
        headers: this.getHeaders(headers),
        body: JSON.stringify(body)
      };
      if (this.config.isDebug()) {
        console.log(`[wxo-sdk] STREAM POST ${url}`, requestConfig);
      }
      const response = await fetch(url, requestConfig);
      if (!response.ok) {
        const text = await response.text();
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = text;
        throw error;
      }
      return response;
    }
    async get(path, options = {}) {
      return this._request('GET', path, options);
    }
    async post(path, body, options = {}) {
      return this._request('POST', path, {
        ...options,
        body
      });
    }
    async patch(path, body, options = {}) {
      return this._request('PATCH', path, {
        ...options,
        body
      });
    }
    async delete(path, options = {}) {
      return this._request('DELETE', path, options);
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
    async init() {
      this.userId = `anonymous-${this._generateUUID()}`;
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Anonymous user ID generated:', this.userId);
      }
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
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : r & 0x3 | 0x8;
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
      this.deltaHandlers = [];
      this.errorHandlers = [];
    }

    /**
     * Initialize chat manager (no-op, kept for API compatibility)
     */
    async init() {
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] ChatManager initialized');
      }
    }

    /**
     * Switch to a different agent (creates session object, no API call yet)
     * @param {string} agentId
     * @returns {Object} session data
     */
    async switchAgent(agentId) {
      const agent = this.config.getAgent(agentId);
      if (!agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }
      this.currentAgentId = agentId;
      if (!this.sessions.has(agentId)) {
        // Session will be lazily created on first message
        this.sessions.set(agentId, {
          agentId,
          agent,
          threadId: null,
          messages: [],
          isActive: true
        });
      }
      if (this.config.isDebug()) {
        console.log(`[wxo-sdk] Switched to agent: ${agentId}`);
      }
      return this.sessions.get(agentId);
    }

    /**
     * Send message to current agent
     * Creates thread on first message, then posts to /orchestrate/runs
     * @param {string} text
     * @param {Object} options
     * @returns {Promise<Object>} user message object
     */
    async sendMessage(text, options = {}) {
      if (!this.currentAgentId) {
        throw new Error('No active agent. Call startChat() first.');
      }
      const session = this.sessions.get(this.currentAgentId);
      if (!session) {
        throw new Error(`No session for agent: ${this.currentAgentId}`);
      }

      // Create thread on first message (lazy initialization)
      if (!session.threadId) {
        await this._createThread(session, text);
      }

      // Build user message
      const userMessage = {
        id: this._generateMessageId(),
        text,
        sender: 'user',
        timestamp: Date.now()
      };
      session.messages.push(userMessage);
      session.lastUserMessage = text; // track for feedback payload
      // Note: user messages are returned to the caller for display.
      // onMessage handlers are reserved for agent responses only.

      // Send to orchestrate/runs with streaming
      try {
        await this._sendToRuns(session, text);
      } catch (error) {
        console.error('[wxo-sdk] Failed to send message:', error);
        this._handleError(error);
        throw error;
      }
      return userMessage;
    }

    /**
     * Create a thread for the session
     * POST /mfe_home_archer/api/v1/threads
     * @private
     */
    async _createThread(session, firstMessageText) {
      const path = '/mfe_home_archer/api/v1/threads';
      const body = {
        title: firstMessageText,
        agent_id: session.agent.agentId
      };
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Creating thread:', body);
      }
      const response = await this.httpClient.post(path, body);
      session.threadId = response.thread_id;
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Thread created:', session.threadId);
      }
    }

    /**
     * Send message via orchestrate/runs (streaming)
     * POST /mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000&multiple_content=true
     * @private
     */
    async _sendToRuns(session, text) {
      const path = '/mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000&multiple_content=true';
      const body = {
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
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Sending to runs:', body);
      }
      const response = await this.httpClient.stream(path, body);
      await this._handleStreamResponse(response, session);
    }

    /**
     * Handle streaming response (SSE or chunked)
     * @private
     */
    async _handleStreamResponse(response, session) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let agentText = '';
      const messageId = this._generateMessageId();
      let isFirstDelta = true;
      try {
        while (true) {
          const {
            done,
            value
          } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, {
            stream: true
          });
          buffer += chunk;

          // Process SSE lines
          const lines = buffer.split('\n');
          buffer = lines.pop(); // keep incomplete last line

          for (const line of lines) {
            this._processStreamLine(line, text => {
              agentText += text;
              this._triggerDeltaHandlers({
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
          if (this.config.isDebug()) {
            console.log('[wxo-sdk] Stream remaining buffer:', JSON.stringify(buffer));
          }
          this._processStreamLine(buffer, text => {
            agentText += text;
            this._triggerDeltaHandlers({
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

      // Signal stream complete
      this._triggerDeltaHandlers({
        messageId,
        text: '',
        isFirst: false,
        isDone: true,
        fullText: agentText
      });

      // Emit the complete agent message (for session history and non-streaming consumers)
      if (agentText) {
        const agentMessage = {
          id: messageId,
          text: agentText,
          sender: 'agent',
          timestamp: Date.now()
        };
        session.messages.push(agentMessage);
        this._triggerMessageHandlers(agentMessage);
      }
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Stream complete. Agent response:', agentText);
      }
    }

    /**
     * Process a single line from the stream and call onText with extracted text
     * @private
     */
    _processStreamLine(line, onText) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === ':') return;
      if (trimmed.startsWith('data:')) {
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          if (this.config.isDebug()) {
            console.log('[wxo-sdk] Stream event:', parsed);
          }
          const text = this._extractTextFromEvent(parsed);
          if (text) onText(text);
        } catch (_) {
          if (data) onText(data);
        }
      } else {
        try {
          const parsed = JSON.parse(trimmed);
          if (this.config.isDebug()) {
            console.log('[wxo-sdk] Stream JSON chunk:', parsed);
          }
          const text = this._extractTextFromEvent(parsed);
          if (text) onText(text);
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
      // IBM watsonx Orchestrate streaming format: {id, event, data}
      if (parsed.event) {
        if (parsed.event === 'message.delta') {
          const content = parsed.data?.delta?.content;
          if (Array.isArray(content)) {
            // No type filter — extract text from any content item to handle varying API formats
            return content.map(c => typeof c.text === 'string' ? c.text : c.text?.value ?? '').filter(t => t.length > 0).join('');
          }
          if (typeof content === 'string') return content;
        }
        return null; // message.completed and all other events — text comes from message.delta only
      }

      // Fallback for other formats
      if (typeof parsed === 'string') return parsed;
      if (parsed.delta?.content) return parsed.delta.content;
      if (parsed.choices?.[0]?.delta?.content) return parsed.choices[0].delta.content;
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
    async sendFeedback(messageId, isPositive, categories = [], text = '') {
      const webhookUrl = this.config.getFeedbackWebhookUrl();
      const session = this.sessions.get(this.currentAgentId);
      const agentConfig = this.config.getAgent(this.currentAgentId);
      const feedbackUserInfo = this.config.getFeedbackUserInfo() || {};

      // Find question/answer pair by locating the agent message and the user message before it
      const messages = session?.messages || [];
      const agentMsgIndex = messages.findIndex(m => m.id === messageId);
      const precedingMsg = agentMsgIndex > 0 ? messages[agentMsgIndex - 1] : null;
      const question = precedingMsg?.sender === 'user' ? precedingMsg.text : session?.lastUserMessage || '';
      const answer = agentMsgIndex >= 0 ? messages[agentMsgIndex].text || '' : '';
      const payload = {
        ...feedbackUserInfo,
        question,
        answer,
        isPositive: isPositive ? 1 : 0,
        categories: Array.isArray(categories) ? categories.join(', ') : '',
        text,
        agentId: agentConfig?.agentId || this.currentAgentId
      };
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Feedback payload:', payload);
      }
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      }
    }

    /**
     * Get messages for current agent
     * @returns {Array}
     */
    getMessages() {
      if (!this.currentAgentId) return [];
      const session = this.sessions.get(this.currentAgentId);
      return session ? [...session.messages] : [];
    }

    /**
     * Get messages for a specific agent
     * @param {string} agentId
     * @returns {Array}
     */
    getAgentMessages(agentId) {
      const session = this.sessions.get(agentId);
      return session ? [...session.messages] : [];
    }

    /**
     * Clear messages for current agent
     */
    clearMessages() {
      if (!this.currentAgentId) return;
      const session = this.sessions.get(this.currentAgentId);
      if (session) session.messages = [];
    }

    /**
     * End session for an agent
     * PATCH /mfe_home_archer/api/v1/threads/{thread_id}
     * @param {string} agentId
     */
    async endSession(agentId) {
      const session = this.sessions.get(agentId);
      if (!session || !session.threadId) {
        this.sessions.delete(agentId);
        return;
      }
      try {
        await this.httpClient.patch(`/mfe_home_archer/api/v1/threads/${session.threadId}`, {
          status: 'closed'
        });
        if (this.config.isDebug()) {
          console.log(`[wxo-sdk] Thread closed: ${session.threadId}`);
        }
      } catch (error) {
        console.warn('[wxo-sdk] Failed to close thread (non-fatal):', error.message);
      }
      session.isActive = false;
      this.sessions.delete(agentId);
      if (this.currentAgentId === agentId) {
        this.currentAgentId = null;
      }
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
      return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cleanup all sessions
     */
    destroy() {
      for (const agentId of this.sessions.keys()) {
        this.endSession(agentId);
      }
      this.sessions.clear();
      this.messageHandlers = [];
      this.deltaHandlers = [];
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
    async init() {
      if (this.isInitialized) {
        if (this.config.isDebug()) {
          console.log('[wxo-sdk] Already initialized');
        }
        return;
      }
      try {
        // Initialize configuration
        this.config.init();

        // Initialize HTTP client
        this.httpClient = new HttpClient(this.config);

        // Initialize authentication (generates anonymous user ID)
        this.authManager = new AuthManager(this.config);
        await this.authManager.init();

        // Set IBM custom headers on HTTP client
        this.httpClient.setIBMHeaders(this.authManager.getUserId());

        // Initialize chat manager
        this.chatManager = new ChatManager(this.config, this.httpClient);
        await this.chatManager.init();
        this.isInitialized = true;
        if (this.config.isDebug()) {
          console.log('[wxo-sdk] SDK initialized successfully');
        }
      } catch (error) {
        console.error('[wxo-sdk] Initialization failed:', error);
        throw error;
      }
    }

    /**
     * Start chat with an agent
     * @param {string} agentId
     * @returns {Promise<Object>} session data
     */
    async startChat(agentId) {
      this._ensureInitialized();
      return await this.chatManager.switchAgent(agentId);
    }

    /**
     * Send message to current agent
     * @param {string} text
     * @param {Object} options
     * @returns {Promise<Object>} user message object
     */
    async sendMessage(text, options = {}) {
      this._ensureInitialized();
      return await this.chatManager.sendMessage(text, options);
    }

    /**
     * Send feedback for a message
     * @param {string} messageId
     * @param {boolean} isPositive
     * @param {string} comment
     */
    async sendFeedback(messageId, isPositive, categories = [], text = '') {
      this._ensureInitialized();
      return await this.chatManager.sendFeedback(messageId, isPositive, categories, text);
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
    async switchAgent(agentId) {
      this._ensureInitialized();
      return await this.chatManager.switchAgent(agentId);
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
    async fetchChatStarterSettings(agentId) {
      const agent = this.config.getAgent(agentId);
      if (!agent) return null;

      // API docs: chat-starter-settings does NOT support locale query param.
      // IBM wxoLoader handles locale client-side: when is_default_message=true, show locale-specific default.
      const locale = this.config.getLocale();
      const path = `/mfe_home_archer/api/v1/orchestrate/agents/${encodeURIComponent(agent.agentId)}/chat-starter-settings`;

      // Hardcoded IBM default messages by locale (mirrors wxoLoader.js behavior)
      const defaultWelcomeMessages = {
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
      const defaultDescriptions = {
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
      if (this.config.isDebug()) {
        console.log(`[wxo-sdk] fetchChatStarterSettings: locale="${locale || 'none'}", path: ${path}`);
      }
      try {
        const data = await this.httpClient.get(path);
        const wc = data?.welcome_content;
        if (this.config.isDebug()) {
          console.log('[wxo-sdk] fetchChatStarterSettings response:', JSON.stringify(wc));
          console.log('[wxo-sdk] is_default_message:', wc?.is_default_message, '/ is_default_description:', wc?.is_default_description);
        }

        // If API returns default message, apply locale-specific default (IBM wxoLoader behavior)
        const localizedDefault = locale ? defaultWelcomeMessages[locale] || defaultWelcomeMessages['en'] : null;
        const welcomeMessage = wc?.is_default_message && localizedDefault ? localizedDefault : wc?.welcome_message || null;
        const localizedDescription = locale ? defaultDescriptions[locale] || defaultDescriptions['en'] : null;
        const description = wc?.is_default_description && localizedDescription ? localizedDescription : wc?.description || null;
        const rawPrompts = data?.starter_prompts?.prompts || [];
        const prompts = rawPrompts.filter(p => !p.state || p.state === 'active').map(p => ({
          title: p.title,
          prompt: p.prompt
        }));
        return {
          welcomeMessage,
          description,
          prompts
        };
      } catch (e) {
        if (this.config.isDebug()) {
          console.warn('[wxo-sdk] fetchChatStarterSettings failed:', e);
        }
        return null;
      }
    }

    /**
     * End chat session for an agent
     * @param {string} agentId
     */
    async endChat(agentId) {
      this._ensureInitialized();
      return await this.chatManager.endSession(agentId);
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
      this.el.innerHTML = `<span style="color:white;font-size:18px;font-weight:700;letter-spacing:0.5px;font-family:'IBM Plex Sans',-apple-system,sans-serif;">AI</span>`;
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
      const total = this.agents.length;
      this.agents.forEach((agent, index) => {
        const btn = document.createElement('div');
        btn.className = 'wxo-agent-item';
        btn.setAttribute('aria-label', agent.name);
        // Bottom item (closest to button) animates first; top items follow with increasing delay
        btn.dataset.animDelay = `${(total - 1 - index) * 0.07}s`;
        const labelEl = document.createElement('div');
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
    constructor({
      agent,
      messages = [],
      starterSettings = null,
      onSend,
      onFeedback,
      onMinimize,
      onReload,
      feedbackEnabled = true,
      feedbackOptions = null
    }) {
      this.agent = agent;
      this.starterSettings = starterSettings;
      this.messages = [...messages];
      this.onSend = onSend;
      this.onFeedback = onFeedback;
      this.onMinimize = onMinimize;
      this.onReload = onReload;
      this.feedbackEnabled = feedbackEnabled;
      this.feedbackOptions = feedbackOptions;
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
    }
    render(container) {
      this.el = document.createElement('div');
      this.el.className = 'wxo-chat-window';
      this.el.innerHTML = `
      <div class="wxo-chat-header">
        <div class="wxo-chat-header__left">
          <button class="wxo-btn-icon wxo-btn-reload tooltip-below" aria-label="Reload" data-tooltip="リセット">↺</button>
          <div class="wxo-chat-header__title">
            <span class="wxo-chat-header__icon">${this.agent.icon || '💬'}</span>
            <span class="wxo-chat-header__name">${this._escapeHtml(this.agent.name)}</span>
          </div>
        </div>
        <div class="wxo-chat-header__actions">
          <button class="wxo-btn-icon wxo-btn-resize tooltip-below" aria-label="Resize" data-tooltip="サイズ拡大する"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></button>
          <button class="wxo-btn-icon wxo-btn-minimize tooltip-below" aria-label="Minimize" data-tooltip="最小化">−</button>
        </div>
      </div>
      <div class="wxo-chat-messages"></div>
      <button class="wxo-scroll-bottom" data-tooltip="一番下へスクロール" style="display:none" aria-label="一番下へスクロール">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline><line x1="4" y1="19" x2="20" y2="19"></line></svg>
      </button>
      <div class="wxo-chat-input-area">
        <div class="wxo-input-wrap">
          <textarea class="wxo-chat-input" rows="1" placeholder="何かを入力してください..."></textarea>
          <button class="wxo-chat-send" data-tooltip="送信">
            <svg viewBox="0 0 32 32" fill="currentColor" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M27.45,15.11l-22-11a1,1,0,0,0-1.08.12,1,1,0,0,0-.33,1L7,16,4,26.74A1,1,0,0,0,5,28a1,1,0,0,0,.45-.11l22-11a1,1,0,0,0,0-1.78Zm-20.9,10L8.76,17H18V15H8.76L6.55,6.89,24.76,16Z"/>
            </svg>
          </button>
        </div>
      </div>
    `;
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

      container.appendChild(this.el);
      this._scrollToBottom();
    }
    addMessage(message) {
      // If already rendered via streamDelta, just update state (avoid duplicate DOM)
      if (message.id && this.messagesEl && this.messagesEl.querySelector(`[data-message-id="${message.id}"]`)) {
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
      const {
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
        const contentEl = this.streamingEl.querySelector('.wxo-message__content');
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
      const div = document.createElement('div');
      div.className = 'wxo-message wxo-message--agent';
      div.dataset.messageId = messageId;
      const metaEl = document.createElement('div');
      metaEl.className = 'wxo-message__meta';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'wxo-message__meta-name';
      nameSpan.textContent = this.agent.name;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'wxo-message__meta-time';
      timeSpan.textContent = new Date().toLocaleTimeString('ja-JP', {
        hour: 'numeric',
        minute: '2-digit'
      });
      metaEl.appendChild(nameSpan);
      metaEl.appendChild(timeSpan);
      div.appendChild(metaEl);
      const contentEl = document.createElement('div');
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
      const contentEl = this.streamingEl.querySelector('.wxo-message__content');
      const messageId = this._streamMessageId;
      if (contentEl) {
        contentEl.style.whiteSpace = '';
        const html = this._parseMarkdown(fullText || '');
        if (html !== null) {
          contentEl.innerHTML = html;
        } else {
          contentEl.textContent = fullText || '';
        }
      }

      // Add action row (copy + feedback)
      const actionRow = document.createElement('div');
      actionRow.className = 'wxo-message__actions';
      let fbPanelEl = null;
      if (this.feedbackEnabled && messageId && this.onFeedback) {
        fbPanelEl = document.createElement('div');
        fbPanelEl.className = 'wxo-feedback';
        const thumbUpSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
        const thumbDownSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
        [[thumbUpSVG, true, '応答良好'], [thumbDownSVG, false, '応答不良']].forEach(([svg, isPositive, tip]) => {
          const btn = document.createElement('button');
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
      const text = this.inputEl.value.trim();
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
    _appendMessageEl(message, isLoading = false) {
      const div = document.createElement('div');
      div.className = `wxo-message wxo-message--${message.sender}`;
      if (message.id) div.dataset.messageId = message.id;

      // Meta: sender name + timestamp above the bubble
      const metaEl = document.createElement('div');
      metaEl.className = 'wxo-message__meta';
      const senderName = message.sender === 'user' ? 'あなた' : this.agent.name;
      const timeStr = new Date(message.timestamp || Date.now()).toLocaleTimeString('ja-JP', {
        hour: 'numeric',
        minute: '2-digit'
      });
      const nameSpan = document.createElement('span');
      nameSpan.className = 'wxo-message__meta-name';
      nameSpan.textContent = senderName;
      const timeSpan = document.createElement('span');
      timeSpan.className = 'wxo-message__meta-time';
      timeSpan.textContent = timeStr;
      metaEl.appendChild(nameSpan);
      metaEl.appendChild(timeSpan);
      div.appendChild(metaEl);

      // Bubble content
      const contentEl = document.createElement('div');
      contentEl.className = 'wxo-message__content';
      if (isLoading) {
        contentEl.innerHTML = '<span class="wxo-loading-dots"><span>●</span><span>●</span><span>●</span></span>';
      } else if (message.sender === 'agent') {
        const html = this._parseMarkdown(message.text || '');
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
        const actionRow = document.createElement('div');
        actionRow.className = 'wxo-message__actions';
        let fbPanelEl = null;
        if (message.sender === 'agent' && this.feedbackEnabled && message.id && this.onFeedback) {
          fbPanelEl = document.createElement('div');
          fbPanelEl.className = 'wxo-feedback';
          const thumbUpSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
          const thumbDownSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
          [[thumbUpSVG, true, '応答良好'], [thumbDownSVG, false, '応答不良']].forEach(([svg, isPositive, tip]) => {
            const btn = document.createElement('button');
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
      const type = isPositive ? 'positive' : 'negative';
      const opts = this.feedbackOptions?.[type];

      // If showDetails is false, submit immediately with no details
      if (!opts?.showDetails) {
        this._submitFeedback(messageId, isPositive, [], '', fbEl);
        return;
      }
      const thumbUpSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
      const thumbDownSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
      const rating = isPositive ? thumbUpSVG : thumbDownSVG;
      const categories = opts.categories || [];
      const disclaimer = opts.disclaimer || '';
      const pillsHtml = categories.map((cat, i) => `<button class="wxo-feedback__pill" data-index="${i}">${this._escapeHtml(cat)}</button>`).join('');
      fbEl.innerHTML = `
      <div class="wxo-feedback__panel">
        <div class="wxo-feedback__panel-header">
          <span class="wxo-feedback__selected">${rating}</span>
          <span class="wxo-feedback__panel-title">追加フィードバック</span>
        </div>
        <div class="wxo-feedback__panel-subtitle">この評価をした理由は何ですか？</div>
        <div class="wxo-feedback__pills">${pillsHtml}</div>
        <textarea class="wxo-feedback__comment" placeholder="(オプション)他にご意見やご提案があればお知らせください" rows="2"></textarea>
        ${disclaimer ? `<div class="wxo-feedback__disclaimer">${this._escapeHtml(disclaimer)}</div>` : ''}
        <div class="wxo-feedback__panel-actions">
          <button class="wxo-feedback__cancel">キャンセル</button>
          <button class="wxo-feedback__submit">送信</button>
        </div>
      </div>
    `;
      const selectedCategories = new Set();
      fbEl.querySelectorAll('.wxo-feedback__pill').forEach((pill, i) => {
        pill.addEventListener('click', () => {
          const cat = categories[i];
          if (selectedCategories.has(cat)) {
            selectedCategories.delete(cat);
            pill.classList.remove('wxo-feedback__pill--selected');
          } else {
            selectedCategories.add(cat);
            pill.classList.add('wxo-feedback__pill--selected');
          }
        });
      });
      const textarea = fbEl.querySelector('.wxo-feedback__comment');
      fbEl.querySelector('.wxo-feedback__submit').addEventListener('click', () => {
        this._submitFeedback(messageId, isPositive, [...selectedCategories], textarea.value.trim(), fbEl);
      });
      fbEl.querySelector('.wxo-feedback__cancel').addEventListener('click', () => {
        fbEl.innerHTML = ''; // thumbs remain in action row above
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const actionsEl = fbEl.querySelector('.wxo-feedback__panel-actions');
          if (actionsEl && this.messagesEl) {
            const panelBottom = actionsEl.getBoundingClientRect().bottom;
            const containerBottom = this.messagesEl.getBoundingClientRect().bottom;
            if (panelBottom > containerBottom) {
              this.messagesEl.scrollTop += panelBottom - containerBottom + 8;
            }
          }
        });
      });
    }
    _submitFeedback(messageId, isPositive, categories, text, fbEl) {
      this.onFeedback(messageId, isPositive, categories, text);
      const svgIcon = isPositive ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>` : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
      fbEl.innerHTML = `<span class="wxo-feedback__thanks">${svgIcon} フィードバックありがとうございます</span>`;
    }
    _createCopyButton(text) {
      const btn = document.createElement('button');
      btn.className = 'wxo-copy-btn';
      btn.dataset.tooltip = 'コピー';
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
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
      // Use API data if available, fallback to agent config
      const greeting = this.starterSettings?.welcomeMessage || this.agent.welcomeMessage || this.agent.name;
      const description = this.starterSettings?.description || this.agent.welcomeSubtitle || '';
      // starterSettings.prompts: [{title, prompt}]; fallback: agent.quickStartPrompts (strings)
      const prompts = this.starterSettings?.prompts || (Array.isArray(this.agent.quickStartPrompts) ? this.agent.quickStartPrompts.map(p => ({
        title: p,
        prompt: p
      })) : []);
      this.welcomeEl = document.createElement('div');
      this.welcomeEl.className = 'wxo-welcome';
      const greetingEl = document.createElement('div');
      greetingEl.className = 'wxo-welcome__greeting';
      greetingEl.textContent = greeting;
      this.welcomeEl.appendChild(greetingEl);
      if (description) {
        const descEl = document.createElement('div');
        descEl.className = 'wxo-welcome__description';
        descEl.textContent = description;
        this.welcomeEl.appendChild(descEl);
      }
      if (prompts.length > 0) {
        const promptsEl = document.createElement('div');
        promptsEl.className = 'wxo-welcome__prompts';
        prompts.forEach(({
          title,
          prompt
        }) => {
          const btn = document.createElement('button');
          btn.className = 'wxo-welcome__prompt';
          const textSpan = document.createElement('span');
          textSpan.className = 'wxo-welcome__prompt-text';
          textSpan.textContent = title;
          const arrowSpan = document.createElement('span');
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
      const btn = this.el.querySelector('.wxo-btn-resize');
      btn.dataset.tooltip = this.isExpanded ? '元のサイズに戻す' : 'サイズ拡大する';
      if (this.isExpanded) {
        // Collapse icon: arrows pointing inward
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="10" y1="14" x2="3" y2="21"></line><line x1="21" y1="3" x2="14" y2="10"></line></svg>`;
      } else {
        // Expand icon: arrows pointing outward
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
      }
    }
    _scrollToBottom() {
      if (this.messagesEl) {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      }
      if (this.scrollBtnEl) this.scrollBtnEl.style.display = 'none';
    }
    _scrollToBottomIfNear() {
      if (!this.messagesEl) return;
      const {
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
      const atBottom = this.messagesEl.scrollHeight - this.messagesEl.scrollTop - this.messagesEl.clientHeight < 50;
      this.scrollBtnEl.style.display = atBottom ? 'none' : 'flex';
    }
    _parseMarkdown(text) {
      if (typeof window.marked === 'undefined') return null;
      let html = window.marked.parse(text);
      if (typeof window.DOMPurify !== 'undefined') {
        html = window.DOMPurify.sanitize(html);
      }
      const tmp = document.createElement('div');
      tmp.innerHTML = html;
      tmp.querySelectorAll('a').forEach(a => {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      });
      return tmp.innerHTML;
    }
    _escapeHtml(str) {
      const div = document.createElement('div');
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
      this._renderWelcomeScreen();
      this._setInputDisabled(false);
      if (this.sendBtn) this.sendBtn.disabled = true;
      if (this.scrollBtnEl) this.scrollBtnEl.style.display = 'none';
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
      const agents = this.config.getAgents();
      if (agents.length > 1) {
        this.agentSelector = new AgentSelector(agents, agentId => this._onAgentSelect(agentId));
        this.agentSelector.render(this.container);
      }

      // Route streaming deltas to the active chat window
      this.client.onDelta(delta => {
        if (this.currentAgentId) {
          const win = this.chatWindows.get(this.currentAgentId);
          if (win) win.streamDelta(delta);
        }
      });

      // Route complete messages to the active chat window (fallback / session history)
      this.client.onMessage(message => {
        if (this.currentAgentId) {
          const win = this.chatWindows.get(this.currentAgentId);
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
      const agents = this.config.getAgents();
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
    async _onAgentSelect(agentId) {
      await this._openChat(agentId);
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
    async _openChat(agentId) {
      this.state = 'chat';
      this.floatingButton.hide();
      if (this.agentSelector) this.agentSelector.hide();

      // Hide the window of the previously active agent (if switching)
      if (this.currentAgentId && this.currentAgentId !== agentId) {
        const prevWin = this.chatWindows.get(this.currentAgentId);
        if (prevWin && prevWin.el) prevWin.el.style.display = 'none';
      }

      // If a window already exists for this agent, just show it (history preserved)
      if (this.chatWindows.has(agentId)) {
        const win = this.chatWindows.get(agentId);
        if (win.el) win.el.style.display = 'flex';
        this.currentAgentId = agentId;
        await this.client.startChat(agentId); // re-activates session in ChatManager
        return;
      }

      // First open for this agent: render window immediately, fetch settings in background
      this.currentAgentId = agentId;
      const agent = this.config.getAgent(agentId);
      const feedbackEnabled = this.config.isFeatureEnabled('feedback');
      const feedbackOptions = this.config.getFeedbackOptions();

      // Render with starterSettings=null → shows loading spinner in content area
      const chatWindow = new ChatWindow({
        agent,
        starterSettings: null,
        messages: this.client.getMessages(),
        feedbackEnabled,
        feedbackOptions,
        onSend: async text => {
          await this.client.sendMessage(text);
        },
        onFeedback: (messageId, isPositive, categories, text) => {
          this.client.sendFeedback(messageId, isPositive, categories, text).catch(e => {
            console.warn('[wxo-sdk] Feedback error:', e);
          });
        },
        onMinimize: () => this._minimizeChat(),
        onReload: () => this._reloadChat()
      });
      chatWindow.render(this.container);
      this.chatWindows.set(agentId, chatWindow);

      // Fetch session and starter settings in background
      const [, starterSettings] = await Promise.all([this.client.startChat(agentId), this.client.fetchChatStarterSettings(agentId).catch(() => null)]);

      // Replace loading spinner with welcome screen
      chatWindow.setStarterSettings(starterSettings);
    }
    _minimizeChat() {
      // Hide (not destroy) the active window to preserve DOM and message history
      if (this.currentAgentId) {
        const win = this.chatWindows.get(this.currentAgentId);
        if (win && win.el) win.el.style.display = 'none';
      }
      this.floatingButton.show();
      const agents = this.config.getAgents();
      if (agents.length > 1) {
        this._expandSelector();
      } else {
        this._collapse();
      }
    }
    async _reloadChat() {
      if (!this.currentAgentId) return;
      const agentId = this.currentAgentId;
      const win = this.chatWindows.get(agentId);

      // End the current session (closes thread, clears messages in ChatManager)
      await this.client.endChat(agentId).catch(() => {});

      // Start new session and fetch starter settings concurrently
      const [, starterSettings] = await Promise.all([this.client.startChat(agentId), this.client.fetchChatStarterSettings(agentId).catch(() => null)]);

      // Reset the existing window in place (keep it open)
      if (win) {
        win.resetToWelcome(starterSettings);
      }
    }

    // ─── CSS injection ──────────────────────────────────────────────────────────

    _injectStyles() {
      if (document.getElementById('wxo-sdk-styles')) return;
      const primaryColor = this.config.get('theme.primaryColor') || '#0f62fe';
      const style = document.createElement('style');
      style.id = 'wxo-sdk-styles';
      style.textContent = `
      #wxo-ui-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 99999;
        display: flex;
        flex-direction: column-reverse;
        align-items: flex-end;
        gap: 10px;
        font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }

      /* Floating button */
      .wxo-floating-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${primaryColor};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        transition: transform 0.2s, box-shadow 0.2s;
        flex-shrink: 0;
      }
      .wxo-floating-btn:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0,0,0,0.3);
      }
      .wxo-floating-btn--active {
        background: #0043ce;
      }

      /* Agent selector rise animation */
      @keyframes wxo-agent-rise {
        0% {
          opacity: 0;
          transform: translateY(52px) rotate(90deg);
        }
        40% {
          opacity: 1;
        }
        100% {
          opacity: 1;
          transform: translateY(0) rotate(0deg);
        }
      }

      /* Agent selector */
      .wxo-agent-selector {
        flex-direction: column;
        gap: 8px;
        align-items: flex-end;
      }
      .wxo-agent-item {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        background: #ebf0fa;
        border-radius: 24px;
        padding: 10px 18px;
        cursor: pointer;
        box-shadow: 0 3px 8px rgba(0,0,0,0.12);
        white-space: nowrap;
        transform-origin: right center;
        animation: wxo-agent-rise 0.45s cubic-bezier(0.34, 1.3, 0.64, 1) both;
      }
      .wxo-agent-item:hover {
        box-shadow: 0 4px 10px rgba(0,0,0,0.18);
      }
      .wxo-agent-item__label {
        font-size: 14px;
        font-weight: 500;
        color: #161616;
      }

      /* Chat window */
      .wxo-chat-window {
        width: 380px;
        height: 580px;
        max-height: calc(100vh - 100px);
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transition: width 0.3s, height 0.3s;
        position: relative;
      }
      .wxo-chat-window--expanded {
        width: 620px;
        height: 720px;
      }

      /* Chat header */
      .wxo-chat-header {
        background: #ffffff;
        color: #161616;
        padding: 14px 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        border-bottom: 1px solid #e0e0e0;
      }
      .wxo-chat-header__left {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .wxo-chat-header__title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 15px;
        color: #161616;
      }
      .wxo-chat-header__icon {
        font-size: 20px;
      }
      .wxo-chat-header__actions {
        display: flex;
        gap: 4px;
      }
      .wxo-btn-icon {
        background: none;
        border: none;
        color: #525252;
        cursor: pointer;
        font-size: 18px;
        padding: 4px 6px;
        border-radius: 4px;
        line-height: 1;
        transition: background 0.15s, color 0.15s;
      }
      .wxo-btn-icon:hover {
        background: #f4f4f4;
        color: #161616;
      }

      /* Messages area - gradient: white top → #ebf0fa bottom */
      .wxo-chat-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px 16px 24px;
        background: linear-gradient(to bottom, #ffffff 0%, #ffffff 50%, #ebf0fa 100%);
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Individual messages */
      .wxo-message {
        max-width: 80%;
        display: flex;
        flex-direction: column;
      }
      .wxo-message--user {
        align-self: flex-end;
        align-items: flex-end;
      }
      .wxo-message--agent {
        align-self: flex-start;
        align-items: flex-start;
      }

      /* Sender name + time above bubble */
      .wxo-message__meta {
        font-size: 11px;
        color: #161616;
        margin-bottom: 3px;
        padding: 0 4px;
        display: flex;
        gap: 6px;
        align-items: baseline;
      }
      .wxo-message--user .wxo-message__meta { justify-content: flex-end; }
      .wxo-message--agent .wxo-message__meta { justify-content: flex-start; }
      .wxo-message__meta-name { font-weight: 700; font-size: 13px; }
      .wxo-message__meta-time { font-weight: 400; color: #525252; }

      .wxo-message__content {
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.5;
      }
      .wxo-message--user .wxo-message__content {
        background: #e0e0e0;
        color: #161616;
        border-top-right-radius: 4px;
      }
      .wxo-message--agent .wxo-message__content {
        background: transparent;
        color: #161616;
        border: none;
        padding-left: 0;
      }

      /* Loading dots */
      @keyframes wxo-blink {
        0%, 80%, 100% { opacity: 0.2; }
        40% { opacity: 1; }
      }
      .wxo-loading-dots span {
        animation: wxo-blink 1.4s infinite;
        display: inline-block;
        margin: 0 1px;
        font-size: 20px;
        line-height: 1;
      }
      .wxo-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
      .wxo-loading-dots span:nth-child(3) { animation-delay: 0.4s; }

      /* Window-open loading spinner */
      .wxo-window-loading {
        display: flex; justify-content: center; align-items: center; flex: 1; padding: 40px;
      }
      .wxo-window-loading::after {
        content: ''; width: 28px; height: 28px;
        border: 3px solid #e0e0e0; border-top-color: #525252;
        border-radius: 50%; animation: wxo-spin 0.8s linear infinite;
      }
      @keyframes wxo-spin { to { transform: rotate(360deg); } }

      /* Markdown inside agent messages */
      .wxo-message--agent .wxo-message__content p { margin: 4px 0; }
      .wxo-message--agent .wxo-message__content h1,
      .wxo-message--agent .wxo-message__content h2,
      .wxo-message--agent .wxo-message__content h3 {
        margin: 6px 0 3px; font-size: 1em; font-weight: 600;
      }
      .wxo-message--agent .wxo-message__content table {
        border-collapse: collapse; width: 100%; margin: 6px 0; font-size: 13px;
      }
      .wxo-message--agent .wxo-message__content th,
      .wxo-message--agent .wxo-message__content td {
        border: 1px solid #ccc; padding: 4px 8px; text-align: left;
      }
      .wxo-message--agent .wxo-message__content th {
        background: #f0f0f0; font-weight: 600;
      }
      .wxo-message--agent .wxo-message__content code {
        background: #f4f4f4; padding: 1px 4px; border-radius: 3px;
        font-family: monospace; font-size: 0.9em;
      }
      .wxo-message--agent .wxo-message__content pre {
        background: #f4f4f4; padding: 10px; border-radius: 4px;
        overflow-x: auto; margin: 4px 0;
      }
      .wxo-message--agent .wxo-message__content ul,
      .wxo-message--agent .wxo-message__content ol {
        margin: 4px 0; padding-left: 20px;
      }

      /* Feedback - thumbs (inline in action row, no border) */
      .wxo-feedback { margin-top: 4px; }
      .wxo-feedback__btn {
        background: none;
        border: none;
        border-radius: 4px;
        padding: 3px 4px;
        height: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        transition: background 0.15s;
      }
      .wxo-feedback__btn:hover { background: #f0f0f0; }

      /* Feedback - detail panel */
      .wxo-feedback__panel {
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 14px 14px 0;
        background: white;
      }
      .wxo-feedback__panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .wxo-feedback__selected { display: flex; align-items: center; }
      .wxo-feedback__panel-title {
        font-size: 13px;
        font-weight: 700;
        color: #161616;
      }
      .wxo-feedback__panel-subtitle {
        font-size: 12px;
        color: #525252;
        margin-top: -4px;
      }
      .wxo-feedback__pills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .wxo-feedback__pill {
        background: white;
        border: 1px solid #c6c6c6;
        border-radius: 16px;
        padding: 4px 12px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .wxo-feedback__pill:hover { background: #f4f4f4; }
      .wxo-feedback__pill--selected {
        background: #edf4ff;
        border-color: ${primaryColor};
        color: ${primaryColor};
      }
      .wxo-feedback__comment {
        width: 100%;
        border: 1px solid #c6c6c6;
        border-radius: 6px;
        padding: 8px 10px;
        font-size: 12px;
        font-family: inherit;
        resize: none;
        box-sizing: border-box;
        outline: none;
      }
      .wxo-feedback__comment:focus { border-color: ${primaryColor}; }
      .wxo-feedback__disclaimer {
        font-size: 11px;
        color: #525252;
        line-height: 1.4;
      }
      .wxo-feedback__panel-actions {
        display: flex;
        margin: 0 -14px;
        border-top: 1px solid #e0e0e0;
        overflow: hidden;
        border-bottom-left-radius: 7px;
        border-bottom-right-radius: 7px;
        min-height: 40px;
      }
      .wxo-feedback__cancel {
        flex: 1;
        background: white;
        border: none !important;
        border-right: 1px solid #e0e0e0 !important;
        border-radius: 0;
        padding: 0 12px;
        height: 40px;
        min-height: 40px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s;
        box-sizing: border-box !important;
        line-height: 40px;
      }
      .wxo-feedback__cancel:hover { background: #f4f4f4; }
      .wxo-feedback__submit {
        flex: 1;
        background: ${primaryColor};
        color: white;
        border: none !important;
        border-radius: 0;
        padding: 0 12px;
        height: 40px;
        min-height: 40px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s;
        box-sizing: border-box !important;
        line-height: 40px;
      }
      .wxo-feedback__submit:hover { background: #0043ce; }
      .wxo-feedback__thanks {
        font-size: 12px;
        color: #525252;
      }

      /* Input area */
      .wxo-chat-input-area {
        padding: 0;
        border-top: 1px solid #e0e0e0;
        background: white;
        flex-shrink: 0;
      }
      .wxo-chat-input-area:focus-within {
        border-top-color: #0f62fe;
      }
      .wxo-input-wrap {
        position: relative;
      }
      .wxo-chat-input {
        display: block;
        width: 100%;
        margin: 0;
        padding: 12px 52px 12px 16px;
        border: none !important;
        border-radius: 0 0 12px 12px;
        font-size: 14px;
        outline: none !important;
        box-shadow: none !important;
        font-family: inherit;
        box-sizing: border-box;
        resize: none;
        overflow-y: hidden;
        min-height: 52px;
        max-height: 160px;
        line-height: 1.5;
      }
      .wxo-chat-window .wxo-chat-input:focus {
        outline: none !important;
        border: none !important;
        box-shadow: inset 0 0 0 2px #0f62fe !important;
      }
      .wxo-chat-input:disabled { background: #f4f4f4; }
      .wxo-chat-send {
        position: absolute;
        right: 14px;
        bottom: 13px;
        width: 26px;
        height: 26px;
        background: #c6c6c6;
        color: #ffffff;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: default;
        transition: background 0.15s;
        flex-shrink: 0;
      }
      .wxo-chat-send:not(:disabled) {
        background: #161616;
        cursor: pointer;
      }
      .wxo-chat-send:not(:disabled):hover { background: #393939; }

      /* Scroll-to-bottom button */
      .wxo-scroll-bottom {
        position: absolute;
        bottom: 66px;
        left: 50%;
        transform: translateX(-50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #161616;
        border: none;
        box-shadow: 0 2px 8px rgba(0,0,0,0.25);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        transition: box-shadow 0.15s, background 0.15s;
        z-index: 10;
      }
      .wxo-scroll-bottom:hover {
        background: #393939;
        box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      }

      /* Welcome screen */
      .wxo-welcome {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 24px 20px 16px;
        gap: 0;
        flex: 1;
        overflow-y: auto;
      }
      .wxo-welcome__greeting {
        font-size: 28px;
        font-weight: 400;
        color: #161616;
        margin-bottom: 8px;
        line-height: 1.25;
      }
      .wxo-welcome__description {
        font-size: 13px;
        color: #525252;
        line-height: 1.6;
        margin-bottom: 24px;
      }
      .wxo-welcome__prompts-label {
        font-size: 11px;
        font-weight: 600;
        color: #525252;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 10px;
      }
      .wxo-welcome__prompts {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
      }
      .wxo-welcome__prompt {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        padding: 14px 16px;
        font-size: 13px;
        font-family: inherit;
        color: #161616;
        cursor: pointer;
        text-align: left;
        line-height: 1.5;
        transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-height: 96px;
        overflow: hidden;
      }
      .wxo-welcome__prompt:hover {
        background: #f4f4f4;
        border-color: #8d8d8d;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
      }
      .wxo-welcome__prompt-text {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
        width: 100%;
        margin-bottom: auto;
      }
      .wxo-welcome__prompt-arrow {
        color: ${primaryColor};
        font-size: 14px;
        line-height: 1;
        align-self: flex-end;
        margin-top: 8px;
      }

      /* Message action row (copy button) */
      .wxo-message__actions {
        display: flex;
        gap: 4px;
        margin-top: 4px;
        padding: 0 4px;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .wxo-message--agent .wxo-message__actions { opacity: 1; }
      .wxo-message--user .wxo-message__actions { justify-content: flex-end; }
      .wxo-message--user:hover .wxo-message__actions { opacity: 1; }
      .wxo-copy-btn {
        background: none;
        border: none;
        border-radius: 4px;
        padding: 3px 6px;
        height: 24px;
        cursor: pointer;
        color: #525252;
        display: flex;
        align-items: center;
        transition: background 0.15s, color 0.15s;
      }
      .wxo-copy-btn:hover {
        background: #f4f4f4;
        color: #161616;
      }

      /* Custom tooltip (data-tooltip) */
      [data-tooltip] { position: relative; }
      [data-tooltip]::after {
        content: attr(data-tooltip);
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%);
        background: #161616;
        color: #ffffff;
        font-size: 11px;
        line-height: 1;
        padding: 4px 8px;
        border-radius: 4px;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.1s;
        z-index: 100;
      }
      [data-tooltip]::before {
        content: '';
        position: absolute;
        bottom: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        border: 4px solid transparent;
        border-top-color: #161616;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.1s;
        z-index: 100;
      }
      [data-tooltip]:hover::after,
      [data-tooltip]:hover::before {
        opacity: 1;
        transition-delay: 0.1s;
      }
      /* These must stay absolutely positioned (overrides [data-tooltip]{position:relative}) */
      .wxo-input-wrap .wxo-chat-send { position: absolute; }
      .wxo-chat-window .wxo-scroll-bottom { position: absolute; }

      /* Tooltip below variant (for header buttons at top of window) */
      .tooltip-below[data-tooltip]::after {
        bottom: auto;
        top: calc(100% + 8px);
      }
      .tooltip-below[data-tooltip]::before {
        bottom: auto;
        top: calc(100% + 4px);
        border-top-color: transparent;
        border-bottom-color: #161616;
      }
    `;
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
      const styleEl = document.getElementById('wxo-sdk-styles');
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

  const client = new WxOClient();
  let uiManager = null;
  const wxoLoader = {
    version: '0.1.0',
    /**
     * Initialize the SDK.
     * Initializes WxOClient and launches the full chat UI automatically.
     * @returns {Promise<void>}
     */
    async init() {
      try {
        await client.init();
        uiManager = new UIManager(client.config, client);
        uiManager.init();
        if (window.wxOConfiguration?.debug) {
          console.log('[wxo-sdk] SDK loaded. Version:', this.version);
        }
      } catch (error) {
        console.error('[wxo-sdk] Failed to initialize SDK:', error);
        throw error;
      }
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

  return wxoLoader;

}));
//# sourceMappingURL=wxo-sdk.js.map
