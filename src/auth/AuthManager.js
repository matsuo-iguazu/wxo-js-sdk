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
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
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

export default AuthManager;

// Made with Bob
