/**
 * ContractAssistPanel - clause assist side panel for the chat window
 *
 * Accepts clauseAssistData: { "<契約書名>": { "<第N条>": { title, content, clauses: { "1": "..." } } } }
 * Calls onInsert(text) when user clicks "入力エリアに挿入".
 */
class ContractAssistPanel {
  constructor({ clauseAssistData, onInsert }) {
    this.data = clauseAssistData;
    this.onInsert = onInsert;
    this.el = null;
    this._visible = false;

    // Selected state
    this._contract = '';
    this._article = '';
    this._clause = '';
  }

  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-assist-panel';

    this.el.innerHTML = `
      <div class="wxo-assist-header">
        <span class="wxo-assist-title">📋 条項アシスト</span>
        <button class="wxo-assist-close" aria-label="閉じる">×</button>
      </div>
      <div class="wxo-assist-body">
        <div class="wxo-assist-row">
          <label class="wxo-assist-label">契約書</label>
          <div class="wxo-assist-field">
            <select class="wxo-assist-select" data-role="contract">
              <option value="">-- 選択してください --</option>
            </select>
          </div>
        </div>
        <div class="wxo-assist-row">
          <label class="wxo-assist-label">条</label>
          <div class="wxo-assist-field">
            <select class="wxo-assist-select" data-role="article" disabled>
              <option value="">-- まず契約書を選択してください --</option>
            </select>
            <div class="wxo-assist-preview wxo-assist-preview--empty" data-role="article-preview">条を選択すると本文が表示されます</div>
          </div>
        </div>
        <div class="wxo-assist-row">
          <label class="wxo-assist-label">項（任意）</label>
          <div class="wxo-assist-field">
            <select class="wxo-assist-select" data-role="clause" disabled>
              <option value="">-- 項なし（条全体） --</option>
            </select>
            <div class="wxo-assist-preview wxo-assist-preview--empty" data-role="clause-preview">項を選択すると本文が表示されます</div>
          </div>
        </div>
        <div class="wxo-assist-row">
          <label class="wxo-assist-label">変更内容</label>
          <div class="wxo-assist-field">
            <select class="wxo-assist-select" data-role="change-preset">
              <option value="">-- サンプルから選択 --</option>
              <option value="項全体を削除してください。">項全体を削除してください。</option>
              <option value="△を削除してください。">△を削除してください。</option>
              <option value="△を○に変更してください。">△を○に変更してください。</option>
            </select>
            <textarea class="wxo-assist-change" data-role="change" rows="2" placeholder="または、直接入力してください"></textarea>
          </div>
        </div>
        <div class="wxo-assist-row">
          <label class="wxo-assist-label">リクエスト文</label>
          <div class="wxo-assist-generated" data-role="generated">条項を選択すると自動生成されます</div>
        </div>
      </div>
      <div class="wxo-assist-footer">
        <button class="wxo-assist-insert" data-role="insert" disabled>入力エリアに挿入</button>
      </div>
    `;

    this._contractSel = this.el.querySelector('[data-role="contract"]');
    this._articleSel = this.el.querySelector('[data-role="article"]');
    this._clauseSel = this.el.querySelector('[data-role="clause"]');
    this._articlePreview = this.el.querySelector('[data-role="article-preview"]');
    this._clausePreview = this.el.querySelector('[data-role="clause-preview"]');
    this._changePreset = this.el.querySelector('[data-role="change-preset"]');
    this._changeInput = this.el.querySelector('[data-role="change"]');
    this._generatedEl = this.el.querySelector('[data-role="generated"]');
    this._insertBtn = this.el.querySelector('[data-role="insert"]');

    this._initContractOptions();
    this._wireEvents();

    container.appendChild(this.el);
  }

  show() {
    if (!this.el) return;
    this.el.classList.add('wxo-assist-panel--visible');
    this._visible = true;
    this.el.scrollTop = 0;
  }

  hide() {
    if (!this.el) return;
    this.el.classList.remove('wxo-assist-panel--visible');
    this._visible = false;
  }

  toggle() {
    if (this._visible) this.hide();
    else this.show();
  }

  get isVisible() {
    return this._visible;
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  _initContractOptions() {
    Object.keys(this.data).forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      this._contractSel.appendChild(opt);
    });
  }

  _wireEvents() {
    this.el.querySelector('.wxo-assist-close').addEventListener('click', () => this.hide());

    // Restore full text when opening dropdowns (so preview text is visible while choosing)
    this._articleSel.addEventListener('mousedown', () => this._restoreFullText(this._articleSel));
    this._clauseSel.addEventListener('mousedown', () => this._restoreFullText(this._clauseSel));

    this._contractSel.addEventListener('change', (e) => this._onContractChange(e.target.value));
    this._articleSel.addEventListener('change', (e) => this._onArticleChange(e.target.value));
    this._clauseSel.addEventListener('change', (e) => this._onClauseChange(e.target.value));

    this._changePreset.addEventListener('change', (e) => {
      if (e.target.value) {
        this._changeInput.value = e.target.value;
        e.target.value = '';
        this._updateGenerated();
      }
    });
    this._changeInput.addEventListener('input', () => this._updateGenerated());

    this._insertBtn.addEventListener('click', () => {
      const text = this._generatedEl.textContent;
      if (text && !this._insertBtn.disabled) {
        this.onInsert(text);
        this.hide();
      }
    });
  }

  _restoreFullText(selectEl) {
    Array.from(selectEl.options).forEach(opt => {
      const full = opt.getAttribute('data-full-text');
      if (full) opt.textContent = full;
    });
  }

  _onContractChange(contractName) {
    this._contract = contractName;
    this._article = '';
    this._clause = '';

    // Reset article
    this._articleSel.innerHTML = '<option value="">-- 選択してください --</option>';
    this._articleSel.disabled = !contractName;
    this._setPreview(this._articlePreview, null);

    // Reset clause
    this._clauseSel.innerHTML = '<option value="">-- 項なし（条全体） --</option>';
    this._clauseSel.disabled = true;
    this._setPreview(this._clausePreview, null);

    if (contractName) {
      const contract = this.data[contractName];
      Object.keys(contract).forEach(articleNum => {
        const article = contract[articleNum];
        const preview30 = article.content.substring(0, 30);
        const fullText = preview30
          ? `${articleNum} (${article.title}) ${preview30}...`
          : `${articleNum} (${article.title})`;
        const shortText = `${articleNum} (${article.title})`;
        const opt = document.createElement('option');
        opt.value = articleNum;
        opt.textContent = fullText;
        opt.setAttribute('data-full-text', fullText);
        opt.setAttribute('data-short-text', shortText);
        this._articleSel.appendChild(opt);
      });
    }

    this._updateGenerated();
  }

  _onArticleChange(articleNum) {
    this._article = articleNum;
    this._clause = '';

    // Reset clause
    this._clauseSel.innerHTML = '<option value="">-- 項なし（条全体） --</option>';
    this._clauseSel.disabled = true;
    this._setPreview(this._clausePreview, null);

    if (articleNum) {
      const article = this.data[this._contract][articleNum];
      this._setPreview(this._articlePreview, article.content);

      // Collapse selected option to short text
      const sel = this._articleSel.options[this._articleSel.selectedIndex];
      const short = sel.getAttribute('data-short-text');
      if (short) sel.textContent = short;

      // Populate clause select if clauses exist
      const clauseKeys = Object.keys(article.clauses || {});
      if (clauseKeys.length > 0) {
        this._clauseSel.disabled = false;
        clauseKeys.forEach(num => {
          const content = article.clauses[num];
          const preview30 = content.substring(0, 30);
          const fullText = `第${num}項 ${preview30}...`;
          const shortText = `第${num}項`;
          const opt = document.createElement('option');
          opt.value = num;
          opt.textContent = fullText;
          opt.setAttribute('data-full-text', fullText);
          opt.setAttribute('data-short-text', shortText);
          this._clauseSel.appendChild(opt);
        });
      }
    } else {
      this._setPreview(this._articlePreview, null);
    }

    this._updateGenerated();
  }

  _onClauseChange(clauseNum) {
    this._clause = clauseNum;

    if (clauseNum) {
      const content = this.data[this._contract][this._article].clauses[clauseNum];
      this._setPreview(this._clausePreview, content);

      // Collapse selected option to short text
      const sel = this._clauseSel.options[this._clauseSel.selectedIndex];
      const short = sel.getAttribute('data-short-text');
      if (short) sel.textContent = short;
    } else {
      this._setPreview(this._clausePreview, null);
    }

    this._updateGenerated();
  }

  _setPreview(el, text) {
    el.innerHTML = '';
    if (text) {
      el.classList.remove('wxo-assist-preview--empty');

      const textEl = document.createElement('div');
      textEl.className = 'wxo-assist-preview-text';
      textEl.textContent = text;
      el.appendChild(textEl);

      const toggleEl = document.createElement('button');
      toggleEl.className = 'wxo-assist-preview-toggle';
      toggleEl.textContent = 'さらに表示 ∨';
      el.appendChild(toggleEl);

      requestAnimationFrame(() => {
        if (textEl.scrollHeight <= textEl.clientHeight + 2) {
          toggleEl.style.display = 'none';
        }
      });

      let expanded = false;
      toggleEl.addEventListener('click', () => {
        expanded = !expanded;
        textEl.classList.toggle('wxo-assist-preview-text--expanded', expanded);
        toggleEl.textContent = expanded ? '少なく表示 ∧' : 'さらに表示 ∨';
      });
    } else {
      el.classList.add('wxo-assist-preview--empty');
      el.textContent = el === this._articlePreview
        ? '条を選択すると本文が表示されます'
        : '項を選択すると本文が表示されます';
    }
  }

  _updateGenerated() {
    if (!this._contract || !this._article) {
      this._generatedEl.textContent = '条項を選択すると自動生成されます';
      this._insertBtn.disabled = true;
      return;
    }

    const article = this.data[this._contract][this._article];
    let text = `${this._contract}：${this._article} (${article.title})`;
    if (this._clause) text += `第${this._clause}項`;
    text += 'について、';

    const change = this._changeInput.value.trim();
    text += change || '変更をお願いします。';

    this._generatedEl.textContent = text;
    this._insertBtn.disabled = false;
  }
}

export default ContractAssistPanel;

// Made with Bob
