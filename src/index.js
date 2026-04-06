import WxOClient from './core/WxOClient.js';
import UIManager from './ui/UIManager.js';

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

export default wxoLoader;

// Expose globally for browser <script> tag usage
if (typeof window !== 'undefined') {
  window.wxoLoader = wxoLoader;
}

// Made with Bob
