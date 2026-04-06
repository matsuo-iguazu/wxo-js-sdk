/**
 * Agent selector - shows list of agents above the floating button
 * Visible when user clicks the floating button and multiple agents are configured
 */
class AgentSelector {
  constructor(agents, onAgentSelect) {
    this.agents = agents;
    this.onAgentSelect = onAgentSelect;
    this.el = null;
  }

  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-agent-selector';
    this.el.style.display = 'none';

    const total = this.agents.length;
    this.agents.forEach((agent, index) => {
      const btn = document.createElement('div');
      btn.className = 'wxo-agent-item';
      btn.setAttribute('aria-label', agent.name);
      // Bottom item (closest to button) animates first; top items follow with increasing delay
      btn.dataset.animDelay = `${(total - 1 - index) * 0.07}s`;

      const labelEl = document.createElement('div');
      labelEl.className = 'wxo-agent-item__label';
      labelEl.textContent = agent.name;

      btn.appendChild(labelEl);
      btn.addEventListener('click', () => this.onAgentSelect(agent.id));
      this.el.appendChild(btn);
    });

    container.appendChild(this.el);
  }

  show() {
    if (!this.el) return;
    this.el.style.display = 'flex';
    // Restart rise animations every time the selector opens
    this.el.querySelectorAll('.wxo-agent-item').forEach(item => {
      item.style.animation = 'none';
      void item.offsetWidth; // force reflow
      item.style.animationDelay = item.dataset.animDelay || '0s';
      item.style.animation = '';
    });
  }

  hide() {
    if (this.el) this.el.style.display = 'none';
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

export default AgentSelector;

// Made with Bob
