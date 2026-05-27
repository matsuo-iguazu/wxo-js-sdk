/**
 * Minimal Socket.IO v4 / Engine.IO v4 WebSocket client
 *
 * Used for AWS-hosted watsonx Orchestrate, which delivers agent response events
 * via WebSocket instead of HTTP streaming.
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

  async connect(userId) {
    const host = this.config.get('hostURL').replace(/^https?:\/\//, '');
    const orchestrationID = this.config.get('orchestrationID');
    const url = `wss://${host}/mfe_home_archer/ws/?tenantId=${encodeURIComponent(orchestrationID)}&userId=${encodeURIComponent(userId)}&EIO=4&transport=websocket`;

    if (this.config.isDebug()) {
      console.log('[wxo-sdk] SocketClient connecting:', url);
    }

    return new Promise((resolve, reject) => {
      this._connectResolve = resolve;
      this._connectReject = reject;

      this.ws = new WebSocket(url);
      this.ws.onmessage = (e) => this._onMessage(e.data);
      this.ws.onerror = () => {
        const err = new Error('WebSocket connection failed');
        if (this._connectReject) {
          this._connectReject(err);
          this._connectResolve = null;
          this._connectReject = null;
        }
      };
      this.ws.onclose = () => {
        if (this.config.isDebug()) {
          console.log('[wxo-sdk] SocketClient closed');
        }
      };
    });
  }

  _onMessage(data) {
    if (this.config.isDebug()) {
      const preview = data.length > 120 ? data.substring(0, 120) + '...' : data;
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
        const [eventName, eventData] = JSON.parse(data.slice(2));
        if (eventName === 'WORKER_MESSAGE') {
          this.workerMessageHandlers.forEach(h => {
            try { h(eventData); } catch (e) {
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

export default SocketClient;

// Made with Bob
