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
      feedbackWebhookUrl: null,  // POST destination for feedback data (optional)
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
    const merged = { ...defaults };

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
    return { ...this.config };
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
   * Check if debug mode is enabled
   * @returns {boolean} True if debug mode is enabled
   */
  isDebug() {
    return this.config?.debug === true;
  }
}

// Export singleton instance
export default new Config();

// Made with Bob
