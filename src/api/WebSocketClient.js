/**
 * WebSocket client for real-time chat communication
 * Handles connection lifecycle, message sending/receiving, and reconnection
 */
class WebSocketClient {
  constructor(config, authManager) {
    this.config = config;
    this.authManager = authManager;
    this.ws = null;
    this.url = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.reconnectTimer = null;
    this.messageQueue = [];
    this.eventHandlers = {
      open: [],
      message: [],
      error: [],
      close: []
    };
  }

  /**
   * Connect to WebSocket server
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<void>}
   */
  async connect(sessionId) {
    if (this.isConnected) {
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] WebSocket already connected');
      }
      return;
    }

    const token = this.authManager.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Build WebSocket URL based on IBM watsonx Orchestrate API
    const hostURL = this.config.get('hostURL');
    const wsProtocol = hostURL.startsWith('https') ? 'wss' : 'ws';
    const wsHost = hostURL.replace(/^https?:\/\//, '');
    
    // IBM uses Socket.io for WebSocket communication
    // Actual endpoint: wss://us-south.watson-orchestrate.cloud.ibm.com/socket.io/
    this.url = `${wsProtocol}://${wsHost}/socket.io/?sessionId=${sessionId}&token=${token}&EIO=4&transport=websocket`;

    if (this.config.isDebug()) {
      console.log('[wxo-sdk] Connecting to WebSocket:', this.url);
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = (event) => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;

          if (this.config.isDebug()) {
            console.log('[wxo-sdk] WebSocket connected');
          }

          // Send queued messages
          this._flushMessageQueue();

          // Trigger open event handlers
          this._triggerEvent('open', event);

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (this.config.isDebug()) {
              console.log('[wxo-sdk] WebSocket message received:', data);
            }

            // Trigger message event handlers
            this._triggerEvent('message', data);
          } catch (error) {
            console.error('[wxo-sdk] Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (event) => {
          console.error('[wxo-sdk] WebSocket error:', event);
          
          // Trigger error event handlers
          this._triggerEvent('error', event);
        };

        this.ws.onclose = (event) => {
          this.isConnected = false;

          if (this.config.isDebug()) {
            console.log('[wxo-sdk] WebSocket closed:', event.code, event.reason);
          }

          // Trigger close event handlers
          this._triggerEvent('close', event);

          // Attempt reconnection if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this._scheduleReconnect(sessionId);
          }
        };

        // Timeout for connection
        setTimeout(() => {
          if (!this.isConnected) {
            reject(new Error('WebSocket connection timeout'));
            this.disconnect();
          }
        }, 10000);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send message through WebSocket
   * @param {Object} message - Message object
   */
  send(message) {
    if (!this.isConnected || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] WebSocket not ready, queuing message');
      }
      this.messageQueue.push(message);
      return;
    }

    try {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Sending WebSocket message:', message);
      }

      this.ws.send(payload);
    } catch (error) {
      console.error('[wxo-sdk] Failed to send WebSocket message:', error);
      throw error;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.messageQueue = [];

    if (this.config.isDebug()) {
      console.log('[wxo-sdk] WebSocket disconnected');
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name (open, message, error, close)
   * @param {Function} handler - Event handler function
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} handler - Event handler function
   */
  off(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
    }
  }

  /**
   * Trigger event handlers
   * @private
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  _triggerEvent(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[wxo-sdk] Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Flush queued messages
   * @private
   */
  _flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.send(message);
    }
  }

  /**
   * Schedule reconnection attempt
   * @private
   * @param {string} sessionId - Chat session ID
   */
  _scheduleReconnect(sessionId) {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    
    if (this.config.isDebug()) {
      console.log(`[wxo-sdk] Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = null;
      
      try {
        await this.connect(sessionId);
      } catch (error) {
        console.error('[wxo-sdk] Reconnection failed:', error);
        
        // Exponential backoff
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      }
    }, this.reconnectDelay);
  }

  /**
   * Check if WebSocket is connected
   * @returns {boolean} Connection status
   */
  isWebSocketConnected() {
    return this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}

export default WebSocketClient;

// Made with Bob
