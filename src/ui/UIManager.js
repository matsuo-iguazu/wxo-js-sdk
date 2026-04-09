import FloatingButton from './FloatingButton.js';
import AgentSelector from './AgentSelector.js';
import ChatWindow from './ChatWindow.js';

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
      this.agentSelector = new AgentSelector(agents, (agentId) => this._onAgentSelect(agentId));
      this.agentSelector.render(this.container);
    }

    // Route incoming messages to the active chat window
    this.client.onMessage((message) => {
      if (this.currentAgentId) {
        const win = this.chatWindows.get(this.currentAgentId);
        if (win) win.addMessage(message);
      }
    });

    this.client.onError((error) => {
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

    // First open for this agent: start session and create window
    this.currentAgentId = agentId;
    await this.client.startChat(agentId);

    const agent = this.config.getAgent(agentId);
    const feedbackEnabled = this.config.isFeatureEnabled('feedback');
    const feedbackOptions = this.config.getFeedbackOptions();

    const chatWindow = new ChatWindow({
      agent,
      messages: this.client.getMessages(),
      feedbackEnabled,
      feedbackOptions,
      onSend: async (text) => {
        await this.client.sendMessage(text);
      },
      onFeedback: (messageId, isPositive, categories, text) => {
        this.client.sendFeedback(messageId, isPositive, categories, text).catch((e) => {
          console.warn('[wxo-sdk] Feedback error:', e);
        });
      },
      onMinimize: () => this._minimizeChat(),
      onReload: () => this._reloadChat(),
    });

    chatWindow.render(this.container);
    this.chatWindows.set(agentId, chatWindow);
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

    // Destroy the current window for this agent
    const win = this.chatWindows.get(agentId);
    if (win) {
      win.destroy();
      this.chatWindows.delete(agentId);
    }

    // End the session (closes thread, clears messages in ChatManager)
    await this.client.endChat(agentId).catch(() => {});
    this.currentAgentId = null;

    // Reopen with a fresh session
    await this._openChat(agentId);
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
        background: linear-gradient(to bottom, #ffffff 0%, #ebf0fa 100%);
        border-radius: 24px;
        padding: 10px 18px;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        white-space: nowrap;
        transform-origin: right center;
        animation: wxo-agent-rise 0.45s cubic-bezier(0.34, 1.3, 0.64, 1) both;
      }
      .wxo-agent-item:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
        padding: 16px;
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
        border-bottom-right-radius: 4px;
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

      /* Feedback - initial buttons */
      .wxo-feedback {
        display: flex;
        flex-direction: row;
        gap: 4px;
        margin-top: 4px;
        padding: 0 4px;
      }
      .wxo-feedback__btn {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 3px 8px;
        cursor: pointer;
        font-size: 13px;
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
        padding: 14px;
        max-width: 280px;
        background: white;
      }
      .wxo-feedback__panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .wxo-feedback__selected { font-size: 16px; }
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
        gap: 8px;
      }
      .wxo-feedback__cancel {
        flex: 1;
        background: white;
        border: 1px solid #c6c6c6;
        border-radius: 4px;
        padding: 7px 12px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s;
      }
      .wxo-feedback__cancel:hover { background: #f4f4f4; }
      .wxo-feedback__submit {
        flex: 1;
        background: ${primaryColor};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 7px 12px;
        font-size: 12px;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s;
      }
      .wxo-feedback__submit:hover { background: #0043ce; }
      .wxo-feedback__thanks {
        font-size: 12px;
        color: #525252;
      }

      /* Input area */
      .wxo-chat-input-area {
        padding: 8px 12px;
        border-top: 1px solid #e0e0e0;
        background: white;
        flex-shrink: 0;
      }
      .wxo-input-wrap {
        position: relative;
      }
      .wxo-chat-input {
        width: 100%;
        padding: 10px 46px 10px 14px;
        border: 1px solid #c6c6c6;
        border-radius: 8px;
        font-size: 14px;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
        resize: none;
        overflow-y: hidden;
        min-height: 42px;
        max-height: 160px;
        line-height: 1.5;
        transition: border-color 0.15s;
      }
      .wxo-chat-input:focus { border-color: ${primaryColor}; }
      .wxo-chat-input:disabled { background: #f4f4f4; }
      .wxo-chat-send {
        position: absolute;
        right: 6px;
        bottom: 6px;
        width: 30px;
        height: 30px;
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

      /* Welcome screen */
      .wxo-welcome {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 32px 24px;
        gap: 12px;
        flex: 1;
      }
      .wxo-welcome__icon { font-size: 40px; }
      .wxo-welcome__title {
        font-size: 16px;
        font-weight: 700;
        color: #161616;
      }
      .wxo-welcome__subtitle {
        font-size: 13px;
        color: #525252;
        line-height: 1.5;
      }
      .wxo-welcome__prompts {
        display: flex;
        flex-direction: column;
        gap: 8px;
        width: 100%;
        margin-top: 8px;
      }
      .wxo-welcome__prompt {
        background: white;
        border: 1px solid #c6c6c6;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 13px;
        font-family: inherit;
        color: #161616;
        cursor: pointer;
        text-align: left;
        transition: background 0.15s, border-color 0.15s;
      }
      .wxo-welcome__prompt:hover {
        background: #f4f4f4;
        border-color: #8d8d8d;
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
      .wxo-message:hover .wxo-message__actions { opacity: 1; }
      .wxo-copy-btn {
        background: none;
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        padding: 3px 6px;
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

export default UIManager;

// Made with Bob
