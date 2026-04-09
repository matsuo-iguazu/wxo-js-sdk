import Config from './Config.js';
import HttpClient from '../api/HttpClient.js';
import AuthManager from '../auth/AuthManager.js';
import ChatManager from '../chat/ChatManager.js';

/**
 * Main client class for watsonx Orchestrate SDK
 */
class WxOClient {
  constructor() {
    this.config = Config;
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

    const path = `/v1/orchestrate/agents/${encodeURIComponent(agent.agentId)}/chat-starter-settings`;

    try {
      const data = await this.httpClient.get(path);
      const welcomeMessage = data?.welcome_content?.welcome_message || null;
      const description = data?.welcome_content?.description || null;
      const rawPrompts = data?.starter_prompts?.prompts || [];
      const prompts = rawPrompts
        .filter(p => p.state === 'active')
        .map(p => ({ title: p.title, prompt: p.prompt }));

      return { welcomeMessage, description, prompts };
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

export default WxOClient;

// Made with Bob
