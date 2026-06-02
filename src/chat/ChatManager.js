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
  constructor(config, httpClient, socketClient = null) {
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
   * POST /mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000
   * @private
   */
  async _sendToRuns(session, text) {
    const path = '/mfe_home_archer/api/v1/orchestrate/runs?stream=true&stream_timeout=180000';
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

    // Pre-register WS buffer BEFORE HTTP request to avoid missing early events.
    // If the HTTP stream returns a "flow started" notification, we switch to consuming
    // the WS buffer for the actual response. Simple agents produce no WS events so the
    // buffer stays empty and is cleaned up after HTTP streaming completes.
    const wsBuffer = (this.socketClient && this.socketClient.isConnected())
      ? this._bufferWebSocketEvents(session)
      : null;

    const response = await this.httpClient.stream(path, body);
    await this._handleStreamResponse(response, session, wsBuffer);
  }

  /**
   * Buffer WebSocket WORKER_MESSAGE events for a session before HTTP response arrives.
   * Returns a handle with consume(onEvent) and cleanup().
   * @private
   */
  _bufferWebSocketEvents(session) {
    const buffered = [];
    let liveConsumer = null;

    const handler = (workerMsg) => {
      const threadId = workerMsg.data?.thread_id || workerMsg.thread_id;
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
      consume: (onEvent) => {
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
  async _consumeFromWebSocketBuffer(wsBuffer, session, messageId) {
    let agentText = ''; // accumulated silently as fallback if REST fails

    return new Promise((resolve) => {
      wsBuffer.consume((workerMsg) => {
        const chunk = this._extractTextFromEvent(workerMsg);
        if (chunk) {
          agentText += chunk; // no UI emission — display after REST fetch
        }

        if (workerMsg.event === 'done') {
          wsBuffer.cleanup();

          // WebSocket delivery has a server-side character corruption bug.
          // Fetch the authoritative stored text via REST, then display all at once.
          (async () => {
            let finalText = agentText;
            try {
              const messages = await this.httpClient.get(
                `/mfe_home_archer/api/v1/threads/${session.threadId}/messages`
              );
              const agentMessages = (messages || []).filter(m =>
                m.role === 'assistant' &&
                m.content?.some(c => c.response_type === 'text' && !c.text?.toLowerCase().includes('new flow has started'))
              );
              const lastMsg = agentMessages.at(-1);
              if (lastMsg?.content) {
                finalText = lastMsg.content
                  .filter(c => c.response_type === 'text' && !c.text?.toLowerCase().includes('new flow has started'))
                  .map(c => c.text || '')
                  .join('');
              }
            } catch (e) {
              if (this.config.isDebug()) {
                console.warn('[wxo-sdk] REST message fetch failed, using WS text:', e.message);
              }
            }

            // Display full text at once: create bubble then immediately finalize
            this._triggerDeltaHandlers({ messageId, text: '', isFirst: true, isDone: false });
            this._triggerDeltaHandlers({ messageId, text: '', isFirst: false, isDone: true, fullText: finalText });

            if (finalText) {
              const agentMessage = {
                id: messageId,
                text: finalText,
                sender: 'agent',
                timestamp: Date.now()
              };
              session.messages.push(agentMessage);
              this._triggerMessageHandlers(agentMessage);
            }

            if (this.config.isDebug()) {
              console.log('[wxo-sdk] Flow agent response:', finalText);
            }

            resolve();
          })();
        }
      });
    });
  }

  /**
   * Handle streaming response (SSE or chunked).
   * If wsBuffer is provided and a flow-started notification is detected in the HTTP stream,
   * switches to consuming WebSocket events for the actual agent response.
   * @private
   */
  async _handleStreamResponse(response, session, wsBuffer = null) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let agentText = '';
    const messageId = this._generateMessageId();
    let isFirstDelta = true;
    let flowDetected = false;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          this._processStreamLine(line, (text) => {
            if (text.toLowerCase().includes('new flow has started')) {
              flowDetected = true;
              return; // don't emit flow notification to UI
            }
            agentText += text;
            this._triggerDeltaHandlers({ messageId, text, isFirst: isFirstDelta, isDone: false });
            isFirstDelta = false;
          });
        }
      }

      // Process any remaining buffer content after stream ends
      if (buffer.trim()) {
        if (this.config.isDebug()) {
          console.log('[wxo-sdk] Stream remaining buffer:', JSON.stringify(buffer));
        }
        this._processStreamLine(buffer, (text) => {
          if (text.toLowerCase().includes('new flow has started')) {
            flowDetected = true;
            return;
          }
          agentText += text;
          this._triggerDeltaHandlers({ messageId, text, isFirst: isFirstDelta, isDone: false });
          isFirstDelta = false;
        });
      }
    } finally {
      reader.releaseLock();
    }

    // Flow agent: HTTP stream carried only the "flow started" notification; actual response arrives via WebSocket
    if (flowDetected && wsBuffer) {
      if (this.config.isDebug()) {
        console.log('[wxo-sdk] Flow detected in HTTP stream, switching to WebSocket events');
      }
      await this._consumeFromWebSocketBuffer(wsBuffer, session, messageId);
      return;
    }

    // Simple agent: cleanup unused WS buffer
    if (wsBuffer) wsBuffer.cleanup();

    // Signal stream complete
    this._triggerDeltaHandlers({ messageId, text: '', isFirst: false, isDone: true, fullText: agentText });

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
          return content
            .map(c => (typeof c.text === 'string' ? c.text : (c.text?.value ?? '')))
            .filter(t => t.length > 0)
            .join('');
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
    const question = precedingMsg?.sender === 'user' ? precedingMsg.text : (session?.lastUserMessage || '');
    const answer = agentMsgIndex >= 0 ? (messages[agentMsgIndex].text || '') : '';

    const payload = {
      ...feedbackUserInfo,
      question,
      answer,
      isPositive: isPositive ? 1 : 0,
      categories: Array.isArray(categories) ? categories.join(', ') : '',
      text,
      agentId: agentConfig?.agentId || this.currentAgentId,
    };

    if (this.config.isDebug()) {
      console.log('[wxo-sdk] Feedback payload:', payload);
    }

    if (webhookUrl) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      await this.httpClient.patch(
        `/mfe_home_archer/api/v1/threads/${session.threadId}`,
        { status: 'closed' }
      );
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
      try { h(message); } catch (e) { console.error('[wxo-sdk] Message handler error:', e); }
    });
  }

  /** @private */
  _triggerDeltaHandlers(delta) {
    this.deltaHandlers.forEach(h => {
      try { h(delta); } catch (e) { console.error('[wxo-sdk] Delta handler error:', e); }
    });
  }

  /** @private */
  _handleError(error) {
    this.errorHandlers.forEach(h => {
      try { h(error); } catch (e) { console.error('[wxo-sdk] Error handler error:', e); }
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
    this.socketClient = null;
  }
}

export default ChatManager;

// Made with Bob
