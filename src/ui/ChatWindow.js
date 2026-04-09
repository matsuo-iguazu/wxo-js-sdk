/**
 * Chat window UI component
 * Renders the full chat interface: header, messages, input, feedback buttons
 */
class ChatWindow {
  constructor({ agent, messages = [], starterSettings = null, onSend, onFeedback, onMinimize, onReload, feedbackEnabled = true, feedbackOptions = null }) {
    this.agent = agent;
    this.starterSettings = starterSettings;
    this.messages = [...messages];
    this.onSend = onSend;
    this.onFeedback = onFeedback;
    this.onMinimize = onMinimize;
    this.onReload = onReload;
    this.feedbackEnabled = feedbackEnabled;
    this.feedbackOptions = feedbackOptions;
    this.el = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.loadingEl = null;
    this.isExpanded = false;
    this.welcomeEl = null;
  }

  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-chat-window';

    this.el.innerHTML = `
      <div class="wxo-chat-header">
        <div class="wxo-chat-header__left">
          <button class="wxo-btn-icon wxo-btn-reload" aria-label="Reload" title="チャットのリセット">↺</button>
          <div class="wxo-chat-header__title">
            <span class="wxo-chat-header__icon">${this.agent.icon || '💬'}</span>
            <span class="wxo-chat-header__name">${this._escapeHtml(this.agent.name)}</span>
          </div>
        </div>
        <div class="wxo-chat-header__actions">
          <button class="wxo-btn-icon wxo-btn-resize" aria-label="Resize" title="サイズ変更">⤢</button>
          <button class="wxo-btn-icon wxo-btn-minimize" aria-label="Minimize" title="最小化">−</button>
        </div>
      </div>
      <div class="wxo-chat-messages"></div>
      <div class="wxo-chat-input-area">
        <div class="wxo-input-wrap">
          <textarea class="wxo-chat-input" rows="1" placeholder="何かを入力してください..."></textarea>
          <button class="wxo-chat-send" aria-label="クリックしてメッセージを送信" title="クリックしてメッセージを送信">
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

    // Render existing messages or welcome screen
    if (this.messages.length > 0) {
      this.messages.forEach(msg => this._appendMessageEl(msg));
    } else {
      this._renderWelcomeScreen();
    }

    // Event listeners
    this.el.querySelector('.wxo-btn-minimize').addEventListener('click', () => this.onMinimize());
    this.el.querySelector('.wxo-btn-reload').addEventListener('click', () => this.onReload());
    this.el.querySelector('.wxo-btn-resize').addEventListener('click', () => this._toggleResize());

    this.sendBtn.addEventListener('click', () => this._handleSend());
    // Enter to send, Shift+Enter for newline
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
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
    this._hideWelcomeScreen();
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
    if (this.sendBtn) {
      if (disabled) {
        this.sendBtn.disabled = true;
      } else {
        this.sendBtn.disabled = !this.inputEl || this.inputEl.value.trim() === '';
      }
    }
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
      hour: 'numeric',
      minute: '2-digit',
    });
    const nameSpan = document.createElement('span');
    nameSpan.className = 'wxo-message__meta-name';
    nameSpan.textContent = senderName;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'wxo-message__meta-time';
    timeSpan.textContent = timeStr;
    metaEl.appendChild(nameSpan);
    metaEl.appendChild(timeSpan);
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

    // Copy button (agent: always visible, user: hover-only) (WXOSDK-6)
    if (!isLoading) {
      const actionRow = document.createElement('div');
      actionRow.className = 'wxo-message__actions';
      actionRow.appendChild(this._createCopyButton(message.text || ''));
      div.appendChild(actionRow);
    }

    // Feedback buttons for agent messages (not loading)
    if (!isLoading && message.sender === 'agent' && this.feedbackEnabled && message.id && this.onFeedback) {
      const fbEl = document.createElement('div');
      fbEl.className = 'wxo-feedback';
      this._renderFeedbackButtons(message.id, fbEl, message.text);
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

  _renderFeedbackButtons(messageId, fbEl, messageText) {
    fbEl.innerHTML = '';
    const thumbUp = document.createElement('button');
    thumbUp.className = 'wxo-feedback__btn';
    thumbUp.textContent = '👍';
    thumbUp.title = '応答良好';
    thumbUp.addEventListener('click', () => this._onRatingClick(messageId, true, fbEl, messageText));

    const thumbDown = document.createElement('button');
    thumbDown.className = 'wxo-feedback__btn';
    thumbDown.textContent = '👎';
    thumbDown.title = '応答不良';
    thumbDown.addEventListener('click', () => this._onRatingClick(messageId, false, fbEl, messageText));

    fbEl.appendChild(thumbUp);
    fbEl.appendChild(thumbDown);
  }

  _onRatingClick(messageId, isPositive, fbEl, messageText) {
    const type = isPositive ? 'positive' : 'negative';
    const opts = this.feedbackOptions?.[type];

    // If showDetails is false, submit immediately with no details
    if (!opts?.showDetails) {
      this._submitFeedback(messageId, isPositive, [], '', fbEl);
      return;
    }

    const rating = isPositive ? '👍' : '👎';
    const categories = opts.categories || [];
    const disclaimer = opts.disclaimer || '';

    const pillsHtml = categories
      .map((cat, i) => `<button class="wxo-feedback__pill" data-index="${i}">${this._escapeHtml(cat)}</button>`)
      .join('');

    fbEl.innerHTML = `
      <div class="wxo-feedback__panel">
        <div class="wxo-feedback__panel-header">
          <span class="wxo-feedback__selected">${rating}</span>
          <span class="wxo-feedback__panel-title">追加フィードバック</span>
        </div>
        <div class="wxo-feedback__panel-subtitle">この評価をした理由は何ですか？</div>
        <div class="wxo-feedback__pills">${pillsHtml}</div>
        <textarea class="wxo-feedback__comment" placeholder="(オプション)他にご意見やご提案があればお知らせください" rows="2"></textarea>
        ${disclaimer ? `<div class="wxo-feedback__disclaimer">${this._escapeHtml(disclaimer)}</div>` : ''}
        <div class="wxo-feedback__panel-actions">
          <button class="wxo-feedback__cancel">キャンセル</button>
          <button class="wxo-feedback__submit">送信</button>
        </div>
      </div>
    `;

    const selectedCategories = new Set();
    fbEl.querySelectorAll('.wxo-feedback__pill').forEach((pill, i) => {
      pill.addEventListener('click', () => {
        const cat = categories[i];
        if (selectedCategories.has(cat)) {
          selectedCategories.delete(cat);
          pill.classList.remove('wxo-feedback__pill--selected');
        } else {
          selectedCategories.add(cat);
          pill.classList.add('wxo-feedback__pill--selected');
        }
      });
    });

    const textarea = fbEl.querySelector('.wxo-feedback__comment');
    fbEl.querySelector('.wxo-feedback__submit').addEventListener('click', () => {
      this._submitFeedback(messageId, isPositive, [...selectedCategories], textarea.value.trim(), fbEl);
    });
    fbEl.querySelector('.wxo-feedback__cancel').addEventListener('click', () => {
      this._renderFeedbackButtons(messageId, fbEl, messageText);
    });

    this._scrollToBottom();
  }

  _submitFeedback(messageId, isPositive, categories, text, fbEl) {
    this.onFeedback(messageId, isPositive, categories, text);
    fbEl.innerHTML = `<span class="wxo-feedback__thanks">${isPositive ? '👍' : '👎'} フィードバックありがとうございます</span>`;
  }

  _createCopyButton(text) {
    const btn = document.createElement('button');
    btn.className = 'wxo-copy-btn';
    btn.title = 'コピー';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        btn.title = 'コピーしました';
        setTimeout(() => { btn.title = 'コピー'; }, 2000);
      }).catch(() => {});
    });
    return btn;
  }

  _renderWelcomeScreen() {
    // Use API data if available, fallback to agent config
    const greeting = this.starterSettings?.welcomeMessage
      || this.agent.welcomeMessage
      || `こんにちは！${this.agent.name}です。`;
    const description = this.starterSettings?.description
      || this.agent.welcomeSubtitle
      || '';
    // starterSettings.prompts: [{title, prompt}]; fallback: agent.quickStartPrompts (strings)
    const prompts = this.starterSettings?.prompts
      || (Array.isArray(this.agent.quickStartPrompts)
        ? this.agent.quickStartPrompts.map(p => ({ title: p, prompt: p }))
        : []);

    this.welcomeEl = document.createElement('div');
    this.welcomeEl.className = 'wxo-welcome';

    const greetingEl = document.createElement('div');
    greetingEl.className = 'wxo-welcome__greeting';
    greetingEl.textContent = greeting;
    this.welcomeEl.appendChild(greetingEl);

    if (description) {
      const descEl = document.createElement('div');
      descEl.className = 'wxo-welcome__description';
      descEl.textContent = description;
      this.welcomeEl.appendChild(descEl);
    }

    if (prompts.length > 0) {
      const labelEl = document.createElement('div');
      labelEl.className = 'wxo-welcome__prompts-label';
      labelEl.textContent = '質問例';
      this.welcomeEl.appendChild(labelEl);

      const promptsEl = document.createElement('div');
      promptsEl.className = 'wxo-welcome__prompts';
      prompts.forEach(({ title, prompt }) => {
        const btn = document.createElement('button');
        btn.className = 'wxo-welcome__prompt';
        btn.textContent = title;
        btn.addEventListener('click', () => {
          if (this.inputEl) {
            this.inputEl.value = prompt;
            this.sendBtn.disabled = false;
            this.inputEl.focus();
            this._resizeInput();
          }
        });
        promptsEl.appendChild(btn);
      });
      this.welcomeEl.appendChild(promptsEl);
    }

    this.messagesEl.appendChild(this.welcomeEl);
  }

  _hideWelcomeScreen() {
    if (this.welcomeEl && this.welcomeEl.parentNode) {
      this.welcomeEl.parentNode.removeChild(this.welcomeEl);
      this.welcomeEl = null;
    }
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
