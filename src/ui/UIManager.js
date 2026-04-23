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

    // Route streaming deltas to the active chat window
    this.client.onDelta((delta) => {
      if (this.currentAgentId) {
        const win = this.chatWindows.get(this.currentAgentId);
        if (win) win.streamDelta(delta);
      }
    });

    // Route complete messages to the active chat window (fallback / session history)
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

    // Fetch session and starter settings in background
    const [, starterSettings] = await Promise.all([
      this.client.startChat(agentId),
      this.client.fetchChatStarterSettings(agentId).catch(() => null),
    ]);

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
    const [, starterSettings] = await Promise.all([
      this.client.startChat(agentId),
      this.client.fetchChatStarterSettings(agentId).catch(() => null),
    ]);

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
        border-radius: 50%; animation: wxo-spin 1.4s linear infinite;
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

export default UIManager;

// Made with Bob
