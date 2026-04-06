/**
 * Chat window UI component
 * Renders the full chat interface: header, messages, input, feedback buttons
 */
class ChatWindow {
  constructor({ agent, messages = [], onSend, onFeedback, onMinimize, onReload, feedbackEnabled = true }) {
    this.agent = agent;
    this.messages = [...messages];
    this.onSend = onSend;
    this.onFeedback = onFeedback;
    this.onMinimize = onMinimize;
    this.onReload = onReload;
    this.feedbackEnabled = feedbackEnabled;
    this.el = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.loadingEl = null;
    this.isExpanded = false;
  }

  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-chat-window';

    this.el.innerHTML = `
      <div class="wxo-chat-header">
        <div class="wxo-chat-header__title">
          <span class="wxo-chat-header__icon">${this.agent.icon || '💬'}</span>
          <span class="wxo-chat-header__name">${this._escapeHtml(this.agent.name)}</span>
        </div>
        <div class="wxo-chat-header__actions">
          <button class="wxo-btn-icon wxo-btn-reload" aria-label="Reload" title="会話をリセット">↺</button>
          <button class="wxo-btn-icon wxo-btn-resize" aria-label="Resize" title="サイズ変更">⤢</button>
          <button class="wxo-btn-icon wxo-btn-minimize" aria-label="Minimize" title="最小化">−</button>
        </div>
      </div>
      <div class="wxo-chat-messages"></div>
      <div class="wxo-chat-input-area">
        <div class="wxo-input-wrap">
          <textarea class="wxo-chat-input" rows="1" placeholder="何かを入力してください..."></textarea>
          <button class="wxo-chat-send" aria-label="送信">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.messagesEl = this.el.querySelector('.wxo-chat-messages');
    this.inputEl = this.el.querySelector('.wxo-chat-input');
    this.sendBtn = this.el.querySelector('.wxo-chat-send');

    // Re-render existing messages
    this.messages.forEach(msg => this._appendMessageEl(msg));

    // Event listeners
    this.el.querySelector('.wxo-btn-minimize').addEventListener('click', () => this.onMinimize());
    this.el.querySelector('.wxo-btn-reload').addEventListener('click', () => this.onReload());
    this.el.querySelector('.wxo-btn-resize').addEventListener('click', () => this._toggleResize());

    this.sendBtn.addEventListener('click', () => this._handleSend());
    // Enter to send, Shift+Enter for newline
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
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
    this._hideLoading();
    this.messages.push(message);
    this._appendMessageEl(message);
    this._scrollToBottom();
    if (message.sender === 'agent') {
      this._setInputDisabled(false);
    }
  }

  _handleSend() {
    if (!this.inputEl || this.sendBtn.disabled) return;
    const text = this.inputEl.value.trim();
    if (!text) return;

    this.inputEl.value = '';
    this._resizeInput();
    this._setInputDisabled(true);

    // Display user message immediately
    this.addMessage({ text, sender: 'user', timestamp: Date.now() });
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
    if (this.sendBtn) this.sendBtn.disabled = disabled;
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
      hour: '2-digit',
      minute: '2-digit',
    });
    metaEl.textContent = `${senderName}  ${timeStr}`;
    div.appendChild(metaEl);

    // Bubble content
    const contentEl = document.createElement('div');
    contentEl.className = 'wxo-message__content';

    if (isLoading) {
      contentEl.innerHTML = '<span class="wxo-loading-dots"><span>●</span><span>●</span><span>●</span></span>';
    } else if (message.sender === 'agent' && typeof window.marked !== 'undefined') {
      contentEl.innerHTML = window.marked.parse(message.text || '');
    } else {
      contentEl.textContent = message.text || '';
    }
    div.appendChild(contentEl);

    // Feedback buttons for agent messages (not loading)
    if (!isLoading && message.sender === 'agent' && this.feedbackEnabled && message.id && this.onFeedback) {
      const fbEl = document.createElement('div');
      fbEl.className = 'wxo-feedback';

      const thumbUp = document.createElement('button');
      thumbUp.className = 'wxo-feedback__btn';
      thumbUp.textContent = '👍';
      thumbUp.addEventListener('click', () => this._sendFeedback(message.id, true, fbEl));

      const thumbDown = document.createElement('button');
      thumbDown.className = 'wxo-feedback__btn';
      thumbDown.textContent = '👎';
      thumbDown.addEventListener('click', () => this._sendFeedback(message.id, false, fbEl));

      fbEl.appendChild(thumbUp);
      fbEl.appendChild(thumbDown);
      div.appendChild(fbEl);
    }

    this.messagesEl.appendChild(div);
    return div;
  }

  _showLoading() {
    if (this.loadingEl) return; // already visible
    this.loadingEl = this._appendMessageEl(
      { sender: 'agent', timestamp: Date.now() },
      true
    );
    this._scrollToBottom();
  }

  _hideLoading() {
    if (this.loadingEl && this.loadingEl.parentNode) {
      this.loadingEl.parentNode.removeChild(this.loadingEl);
    }
    this.loadingEl = null;
  }

  _sendFeedback(messageId, isPositive, fbEl) {
    this.onFeedback(messageId, isPositive);
    fbEl.innerHTML = `<span class="wxo-feedback__thanks">${isPositive ? '👍' : '👎'} フィードバックありがとうございます</span>`;
  }

  _toggleResize() {
    this.isExpanded = !this.isExpanded;
    this.el.classList.toggle('wxo-chat-window--expanded', this.isExpanded);
    const btn = this.el.querySelector('.wxo-btn-resize');
    btn.textContent = this.isExpanded ? '⤡' : '⤢';
  }

  _scrollToBottom() {
    if (this.messagesEl) {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

export default ChatWindow;

// Made with Bob
