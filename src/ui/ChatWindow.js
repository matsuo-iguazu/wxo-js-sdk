import ContractAssistPanel from './ContractAssistPanel.js';

/**
 * Chat window UI component
 * Renders the full chat interface: header, messages, input, feedback buttons
 */
class ChatWindow {
  constructor({ agent, messages = [], starterSettings = null, onSend, onFeedback, onMinimize, onReload, feedbackEnabled = true, feedbackOptions = null, clauseAssistData = null, clauseAssistAutoOpen = true, escalationWebhookUrl = null, escalationTriggerPhrases = [], escalationAutoSend = false, userInfo = null }) {
    this.agent = agent;
    this.starterSettings = starterSettings;
    this.messages = [...messages];
    this.onSend = onSend;
    this.onFeedback = onFeedback;
    this.onMinimize = onMinimize;
    this.onReload = onReload;
    this.feedbackEnabled = feedbackEnabled;
    this.feedbackOptions = feedbackOptions;
    this.clauseAssistData = clauseAssistData;
    this.clauseAssistAutoOpen = clauseAssistAutoOpen;
    this.escalationWebhookUrl = escalationWebhookUrl;
    this.escalationTriggerPhrases = escalationTriggerPhrases;
    this.escalationAutoSend = escalationAutoSend;
    this.userInfo = userInfo;
    this.el = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.sendBtn = null;
    this.loadingEl = null;
    this.streamingEl = null;
    this._streamMessageId = null;
    this.scrollBtnEl = null;
    this.isExpanded = false;
    this.welcomeEl = null;
    this._windowLoadingEl = null;
    this.assistPanel = null;
  }

  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-chat-window';

    const assistBtnHtml = this.clauseAssistData
      ? `<button class="wxo-assist-btn" data-tooltip="条項アシスト" aria-label="条項アシスト">📋</button>`
      : '';

    this.el.innerHTML = `
      <div class="wxo-chat-header">
        <div class="wxo-chat-header__left">
          <button class="wxo-btn-icon wxo-btn-reload tooltip-below" aria-label="Reload" data-tooltip="リセット">↺</button>
          <div class="wxo-chat-header__title">
            <span class="wxo-chat-header__icon">${this.agent.icon || '💬'}</span>
            <span class="wxo-chat-header__name">${this._escapeHtml(this.agent.name)}</span>
          </div>
        </div>
        <div class="wxo-chat-header__actions">
          <button class="wxo-btn-icon wxo-btn-download tooltip-below" aria-label="Download" data-tooltip="テキストダウンロード"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
          <button class="wxo-btn-icon wxo-btn-resize tooltip-below" aria-label="Resize" data-tooltip="サイズ拡大する"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></button>
          <button class="wxo-btn-icon wxo-btn-minimize tooltip-below" aria-label="Minimize" data-tooltip="最小化">−</button>
        </div>
      </div>
      <div class="wxo-chat-messages"></div>
      <button class="wxo-scroll-bottom" data-tooltip="一番下へスクロール" style="display:none" aria-label="一番下へスクロール">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><polyline points="6 9 12 15 18 9"></polyline><line x1="4" y1="19" x2="20" y2="19"></line></svg>
      </button>
      <div class="wxo-chat-input-area">
        <div class="wxo-input-wrap${this.clauseAssistData ? ' wxo-input-wrap--with-assist' : ''}">
          <textarea class="wxo-chat-input" rows="1" placeholder="何かを入力してください..."></textarea>
          ${assistBtnHtml}
          <button class="wxo-chat-send" data-tooltip="送信">
            <svg viewBox="0 0 32 32" fill="currentColor" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
              <path d="M27.45,15.11l-22-11a1,1,0,0,0-1.08.12,1,1,0,0,0-.33,1L7,16,4,26.74A1,1,0,0,0,5,28a1,1,0,0,0,.45-.11l22-11a1,1,0,0,0,0-1.78Zm-20.9,10L8.76,17H18V15H8.76L6.55,6.89,24.76,16Z"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.messagesEl = this.el.querySelector('.wxo-chat-messages');
    this.inputEl = this.el.querySelector('.wxo-chat-input');
    this.sendBtn = this.el.querySelector('.wxo-chat-send');
    this.scrollBtnEl = this.el.querySelector('.wxo-scroll-bottom');

    // Render existing messages, welcome screen, or loading spinner
    if (this.messages.length > 0) {
      this.messages.forEach(msg => this._appendMessageEl(msg));
    } else if (this.starterSettings !== null) {
      this._renderWelcomeScreen();
    } else {
      this._windowLoadingEl = document.createElement('div');
      this._windowLoadingEl.className = 'wxo-window-loading';
      this.messagesEl.appendChild(this._windowLoadingEl);
    }

    // Event listeners
    this.el.querySelector('.wxo-btn-minimize').addEventListener('click', () => this.onMinimize());
    this.el.querySelector('.wxo-btn-reload').addEventListener('click', () => this.onReload());
    this.el.querySelector('.wxo-btn-resize').addEventListener('click', () => this._toggleResize());
    this.el.querySelector('.wxo-btn-download').addEventListener('click', () => this._downloadChat());

    // Scroll-to-bottom button
    this.messagesEl.addEventListener('scroll', () => this._updateScrollBtn());
    this.scrollBtnEl.addEventListener('click', () => this._scrollToBottom());

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

    // Clause assist panel
    if (this.clauseAssistData) {
      this.assistPanel = new ContractAssistPanel({
        clauseAssistData: this.clauseAssistData,
        onInsert: (text) => {
          this.inputEl.value = text;
          this.sendBtn.disabled = false;
          this._resizeInput();
          this.inputEl.focus();
        },
      });
      this.assistPanel.render(this.el);
      // Move panel to just before the input area so it sits in the flex flow
      const inputAreaEl = this.el.querySelector('.wxo-chat-input-area');
      this.el.insertBefore(this.assistPanel.el, inputAreaEl);

      const assistBtn = this.el.querySelector('.wxo-assist-btn');
      assistBtn.addEventListener('click', () => {
        const active = this.assistPanel.isVisible;
        this.assistPanel.toggle();
        assistBtn.classList.toggle('wxo-assist-btn--active', !active);
      });

      if (this.clauseAssistAutoOpen) {
        container.appendChild(this.el);
        requestAnimationFrame(() => {
          const inputArea = this.el.querySelector('.wxo-chat-input-area');
          if (inputArea) this.assistPanel.el.style.bottom = inputArea.offsetHeight + 'px';
          requestAnimationFrame(() => {
            this.assistPanel.show();
            assistBtn.classList.add('wxo-assist-btn--active');
          });
        });
        this._scrollToBottom();
        return;
      }
    }

    container.appendChild(this.el);
    this._scrollToBottom();
  }

  addMessage(message) {
    // If already rendered via streamDelta, just update state (avoid duplicate DOM)
    if (message.id && this.messagesEl && this.messagesEl.querySelector(`[data-message-id="${message.id}"]`)) {
      this.messages.push(message);
      if (message.sender === 'agent') this._setInputDisabled(false);
      return;
    }
    this._hideLoading();
    this._hideWelcomeScreen();
    this.messages.push(message);
    this._appendMessageEl(message);
    this._scrollToBottom();
    if (message.sender === 'agent') {
      this._setInputDisabled(false);
    }
  }

  /**
   * Handle incoming streaming delta from ChatManager.
   * Appends text directly as it arrives; finalizes with Markdown on isDone.
   * @param {{messageId, text, isFirst, isDone, fullText}} delta
   */
  streamDelta(delta) {
    const { messageId, text, isFirst, isDone, fullText } = delta;

    if (isFirst && !this.streamingEl) {
      this._createStreamingBubble(messageId);
    }

    if (!isDone && text && this.streamingEl) {
      const contentEl = this.streamingEl.querySelector('.wxo-message__content');
      if (contentEl) contentEl.textContent += text;
      this._scrollToBottomIfNear();
    }

    if (isDone) {
      if (!this.streamingEl && fullText) {
        this._createStreamingBubble(messageId);
      }
      this._finalizeStreaming(fullText || '');
    }
  }

  /** @private */
  _createStreamingBubble(messageId) {
    this._hideLoading();
    this._hideWelcomeScreen();

    const div = document.createElement('div');
    div.className = 'wxo-message wxo-message--agent';
    div.dataset.messageId = messageId;

    const metaEl = document.createElement('div');
    metaEl.className = 'wxo-message__meta';
    const nameSpan = document.createElement('span');
    nameSpan.className = 'wxo-message__meta-name';
    nameSpan.textContent = this.agent.name;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'wxo-message__meta-time';
    timeSpan.textContent = new Date().toLocaleTimeString('ja-JP', { hour: 'numeric', minute: '2-digit' });
    metaEl.appendChild(nameSpan);
    metaEl.appendChild(timeSpan);
    div.appendChild(metaEl);

    const contentEl = document.createElement('div');
    contentEl.className = 'wxo-message__content';
    contentEl.style.whiteSpace = 'pre-wrap';
    div.appendChild(contentEl);

    this.messagesEl.appendChild(div);
    this.streamingEl = div;
    this._streamMessageId = messageId;
    this._scrollToBottom();
  }

  /** @private */
  _finalizeStreaming(fullText) {
    if (!this.streamingEl) return;
    const contentEl = this.streamingEl.querySelector('.wxo-message__content');
    const messageId = this._streamMessageId;

    if (contentEl) {
      contentEl.style.whiteSpace = '';
      const html = this._parseMarkdown(fullText || '');
      if (html !== null) {
        contentEl.innerHTML = html;
      } else {
        contentEl.textContent = fullText || '';
      }
    }

    // Add action row (copy + feedback)
    const actionRow = document.createElement('div');
    actionRow.className = 'wxo-message__actions';

    let fbPanelEl = null;
    if (this.feedbackEnabled && messageId && this.onFeedback) {
      fbPanelEl = document.createElement('div');
      fbPanelEl.className = 'wxo-feedback';
      const thumbUpSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
      const thumbDownSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
      [[thumbUpSVG, true, '応答良好'], [thumbDownSVG, false, '応答不良']].forEach(([svg, isPositive, tip]) => {
        const btn = document.createElement('button');
        btn.className = 'wxo-feedback__btn';
        btn.innerHTML = svg;
        btn.dataset.tooltip = tip;
        btn.addEventListener('click', () => this._onRatingClick(messageId, isPositive, fbPanelEl));
        actionRow.appendChild(btn);
      });
    }

    actionRow.appendChild(this._createCopyButton(fullText || ''));

    // Escalation button: shown when agent response contains a trigger phrase
    if (this.escalationWebhookUrl && this.escalationTriggerPhrases.length > 0) {
      const triggered = this.escalationTriggerPhrases.some(p => (fullText || '').includes(p));
      if (triggered) {
        const escalateBtn = document.createElement('button');
        escalateBtn.className = 'wxo-escalation-btn';
        escalateBtn.textContent = '法務に通知';
        escalateBtn.addEventListener('click', () => this._sendEscalationNotification(fullText || '', escalateBtn));
        actionRow.appendChild(escalateBtn);
      }
    }

    // Auto-send: silently post every response as a log record
    if (this.escalationWebhookUrl && this.escalationAutoSend) {
      this._sendEscalationNotification(fullText || '', null);
    }

    this.streamingEl.appendChild(actionRow);
    if (fbPanelEl) this.streamingEl.appendChild(fbPanelEl);

    this.streamingEl = null;
    this._scrollToBottom();
  }

  _sendEscalationNotification(answer, btn) {
    const isAutoSend = btn === null;
    if (!isAutoSend) {
      btn.disabled = true;
      btn.textContent = '送信中...';
    }

    const question = [...this.messages].reverse().find(m => m.sender === 'user')?.text || '';
    const userName = this.userInfo?.displayName || this.userInfo?.name || this.userInfo?.loginName || '不明';

    const title = isAutoSend
      ? '📋 法務AIエージェント 応答記録'
      : '🔔 法務AIエージェント エスカレーション';
    const summary = isAutoSend ? '法務AIエージェント 応答記録' : '法務AIエージェント エスカレーション';

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary,
      themeColor: '0077C8',
      title,
      sections: [
        {
          facts: [
            { name: 'エージェント', value: this.agent.name },
            { name: '質問者', value: userName },
            { name: '質問', value: question },
          ]
        },
        {
          text: `**AIの回答:** ${answer.replace(/\n/g, '<br>')}`
        }
      ]
    };

    fetch(this.escalationWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(() => {
      if (!isAutoSend) {
        btn.textContent = '✓ 通知済み';
        btn.classList.add('wxo-escalation-btn--sent');
      }
    }).catch(() => {
      if (!isAutoSend) {
        btn.disabled = false;
        btn.textContent = '法務に通知';
      }
    });
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
    if (this.assistPanel && this.assistPanel.el) {
      const inputArea = this.el.querySelector('.wxo-chat-input-area');
      if (inputArea) this.assistPanel.el.style.bottom = inputArea.offsetHeight + 'px';
    }
  }

  _setInputDisabled(disabled) {
    if (this.inputEl) this.inputEl.disabled = disabled;
    if (this.sendBtn) {
      if (disabled) {
        this.sendBtn.disabled = true;
      } else {
        this.sendBtn.disabled = !this.inputEl || this.inputEl.value.trim() === '';
        // Refocus input when re-enabled (after agent response)
        requestAnimationFrame(() => { if (this.inputEl) this.inputEl.focus(); });
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
    } else if (message.sender === 'agent') {
      const html = this._parseMarkdown(message.text || '');
      if (html !== null) {
        contentEl.innerHTML = html;
      } else {
        contentEl.textContent = message.text || '';
      }
    } else {
      contentEl.textContent = message.text || '';
    }
    div.appendChild(contentEl);

    // Action row: thumbs (agent only) + copy — agent always visible, user hover-only
    if (!isLoading) {
      const actionRow = document.createElement('div');
      actionRow.className = 'wxo-message__actions';

      let fbPanelEl = null;
      if (message.sender === 'agent' && this.feedbackEnabled && message.id && this.onFeedback) {
        fbPanelEl = document.createElement('div');
        fbPanelEl.className = 'wxo-feedback';

        const thumbUpSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
        const thumbDownSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
        [[thumbUpSVG, true, '応答良好'], [thumbDownSVG, false, '応答不良']].forEach(([svg, isPositive, tip]) => {
          const btn = document.createElement('button');
          btn.className = 'wxo-feedback__btn';
          btn.innerHTML = svg;
          btn.dataset.tooltip = tip;
          btn.addEventListener('click', () => this._onRatingClick(message.id, isPositive, fbPanelEl));
          actionRow.appendChild(btn);
        });
      }

      actionRow.appendChild(this._createCopyButton(message.text || ''));
      div.appendChild(actionRow);
      if (fbPanelEl) div.appendChild(fbPanelEl);
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

  _onRatingClick(messageId, isPositive, fbEl) {
    const type = isPositive ? 'positive' : 'negative';
    const opts = this.feedbackOptions?.[type];

    // If showDetails is false, submit immediately with no details
    if (!opts?.showDetails) {
      this._submitFeedback(messageId, isPositive, [], '', fbEl);
      return;
    }

    const thumbUpSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`;
    const thumbDownSVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
    const rating = isPositive ? thumbUpSVG : thumbDownSVG;
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
      fbEl.innerHTML = ''; // thumbs remain in action row above
    });

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const actionsEl = fbEl.querySelector('.wxo-feedback__panel-actions');
        if (actionsEl && this.messagesEl) {
          const panelBottom = actionsEl.getBoundingClientRect().bottom;
          const containerBottom = this.messagesEl.getBoundingClientRect().bottom;
          if (panelBottom > containerBottom) {
            this.messagesEl.scrollTop += panelBottom - containerBottom + 8;
          }
        }
      });
    });
  }

  _submitFeedback(messageId, isPositive, categories, text, fbEl) {
    this.onFeedback(messageId, isPositive, categories, text);
    const svgIcon = isPositive
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>`;
    fbEl.innerHTML = `<span class="wxo-feedback__thanks">${svgIcon} フィードバックありがとうございます</span>`;
  }

  _createCopyButton(text) {
    const btn = document.createElement('button');
    btn.className = 'wxo-copy-btn';
    btn.dataset.tooltip = 'コピー';
    btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(text).then(() => {
        btn.dataset.tooltip = 'コピーしました';
        setTimeout(() => { btn.dataset.tooltip = 'コピー'; }, 2000);
      }).catch(() => {});
    });
    return btn;
  }

  _renderWelcomeScreen() {
    // Use API data if available, fallback to agent config
    const greeting = this.starterSettings?.welcomeMessage
      || this.agent.welcomeMessage
      || this.agent.name;
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
      const promptsEl = document.createElement('div');
      promptsEl.className = 'wxo-welcome__prompts';
      prompts.forEach(({ title, prompt }) => {
        const btn = document.createElement('button');
        btn.className = 'wxo-welcome__prompt';
        const textSpan = document.createElement('span');
        textSpan.className = 'wxo-welcome__prompt-text';
        textSpan.textContent = title;
        const arrowSpan = document.createElement('span');
        arrowSpan.className = 'wxo-welcome__prompt-arrow';
        arrowSpan.textContent = '→';
        btn.appendChild(textSpan);
        btn.appendChild(arrowSpan);
        btn.addEventListener('click', () => {
          if (this.inputEl && !this.inputEl.disabled) {
            this.inputEl.value = prompt;
            this.sendBtn.disabled = false;
            this._resizeInput();
            this._handleSend();
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
    btn.dataset.tooltip = this.isExpanded ? '元のサイズに戻す' : 'サイズ拡大する';
    if (this.isExpanded) {
      // Collapse icon: arrows pointing inward
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="10" y1="14" x2="3" y2="21"></line><line x1="21" y1="3" x2="14" y2="10"></line></svg>`;
    } else {
      // Expand icon: arrows pointing outward
      btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>`;
    }
  }

  _downloadChat() {
    if (this.messages.length === 0) return;
    const lines = this.messages.map(msg => {
      const sender = msg.sender === 'user' ? 'あなた' : this.agent.name;
      const dt = new Date(msg.timestamp || Date.now());
      const y = dt.getFullYear();
      const mo = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const h = String(dt.getHours()).padStart(2, '0');
      const mi = String(dt.getMinutes()).padStart(2, '0');
      return `[${sender}] ${y}-${mo}-${d} ${h}:${mi}\n${this._stripMarkdown(msg.text || '')}`;
    });
    const today = new Date();
    const filename = `chat-${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}.txt`;
    const blob = new Blob([lines.join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  _scrollToBottom() {
    if (this.messagesEl) {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }
    if (this.scrollBtnEl) this.scrollBtnEl.style.display = 'none';
  }

  _scrollToBottomIfNear() {
    if (!this.messagesEl) return;
    const { scrollTop, scrollHeight, clientHeight } = this.messagesEl;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      this.messagesEl.scrollTop = scrollHeight;
    }
  }

  _updateScrollBtn() {
    if (!this.scrollBtnEl || !this.messagesEl) return;
    const atBottom = this.messagesEl.scrollHeight - this.messagesEl.scrollTop - this.messagesEl.clientHeight < 50;
    this.scrollBtnEl.style.display = atBottom ? 'none' : 'flex';
  }

  _stripMarkdown(text) {
    return text
      .replace(/```[\w]*\n?([\s\S]*?)```/g, '$1')  // code blocks: keep content
      .replace(/`(.+?)`/g, '$1')                    // inline code
      .replace(/^[-*_]{3,}\s*$/gm, '')              // horizontal rules (before italic _ to avoid mis-parse)
      .replace(/^#{1,6}\s+/gm, '')                  // headings
      .replace(/\*\*(.+?)\*\*/gs, '$1')             // bold **
      .replace(/__(.+?)__/gs, '$1')                 // bold __
      .replace(/\*(.+?)\*/gs, '$1')                 // italic *
      .replace(/_(.+?)_/gs, '$1')                   // italic _
      .replace(/!\[.*?\]\(.+?\)/g, '')              // images
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')           // links → label only
      .replace(/^>\s?/gm, '')                       // blockquotes
      .replace(/^[-*+]\s+/gm, '')                   // unordered list bullets
      .replace(/^\d+\.\s+/gm, '')                   // ordered list numbers
      .replace(/(\S)_(\s|$)/gm, '$1$2')            // orphaned closing _
      .replace(/(^|\s)_(\S)/gm, '$1$2')            // orphaned opening _
      .trim();
  }

  _parseMarkdown(text) {
    if (typeof window.marked === 'undefined') return null;
    let html = window.marked.parse(text);
    if (typeof window.DOMPurify !== 'undefined') {
      html = window.DOMPurify.sanitize(html);
    }
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('a').forEach(a => {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    });
    return tmp.innerHTML;
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  setStarterSettings(starterSettings) {
    this.starterSettings = starterSettings;
    if (this._windowLoadingEl && this._windowLoadingEl.parentNode) {
      this._windowLoadingEl.parentNode.removeChild(this._windowLoadingEl);
      this._windowLoadingEl = null;
    }
    if (this.messages.length === 0) {
      this._renderWelcomeScreen();
    }
  }

  resetToWelcome(starterSettings) {
    this.streamingEl = null;
    this._streamMessageId = null;
    this.messages = [];
    this.starterSettings = starterSettings;
    if (this.messagesEl) {
      this.messagesEl.innerHTML = '';
      this.welcomeEl = null;
    }
    if (this.inputEl) {
      this.inputEl.value = '';
      this._resizeInput();
    }
    if (this.assistPanel) { this.assistPanel.hide(); this.assistPanel.reset(); }
    this._renderWelcomeScreen();
    this._setInputDisabled(false);
    if (this.sendBtn) this.sendBtn.disabled = true;
    if (this.scrollBtnEl) this.scrollBtnEl.style.display = 'none';
    if (this.assistPanel && this.clauseAssistAutoOpen) {
      requestAnimationFrame(() => {
        const inputArea = this.el && this.el.querySelector('.wxo-chat-input-area');
        if (inputArea && this.assistPanel.el) this.assistPanel.el.style.bottom = inputArea.offsetHeight + 'px';
        requestAnimationFrame(() => {
          this.assistPanel.show();
          const assistBtn = this.el && this.el.querySelector('.wxo-assist-btn');
          if (assistBtn) assistBtn.classList.add('wxo-assist-btn--active');
        });
      });
    }
  }

  destroy() {
    if (this.assistPanel) this.assistPanel.destroy();
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

export default ChatWindow;

// Made with Bob
