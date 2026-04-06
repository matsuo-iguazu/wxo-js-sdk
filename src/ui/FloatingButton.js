/**
 * Floating chat button - renders in the bottom-right corner of the page
 */
class FloatingButton {
  constructor(onClick) {
    this.onClick = onClick;
    this.el = null;
  }

  render(container) {
    this.el = document.createElement('div');
    this.el.className = 'wxo-floating-btn';
    this.el.setAttribute('aria-label', 'Open chat');
    this.el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="white" width="28" height="28">
        <path d="M16 2C8.3 2 2 8.3 2 16s6.3 14 14 14c2.3 0 4.5-.6 6.5-1.6L28 30l-1.6-5.5C27.4 22.5 30 19.4 30 16 30 8.3 23.7 2 16 2zm0 26c-6.6 0-12-5.4-12-12S9.4 4 16 4s12 5.4 12 12-5.4 12-12 12z"/>
        <path d="M9 13h14v2H9zm0 4h10v2H9z"/>
      </svg>
    `;
    this.el.addEventListener('click', this.onClick);
    container.appendChild(this.el);
  }

  show() {
    if (this.el) this.el.style.display = 'flex';
  }

  hide() {
    if (this.el) this.el.style.display = 'none';
  }

  setActive(active) {
    if (this.el) {
      this.el.classList.toggle('wxo-floating-btn--active', active);
    }
  }

  destroy() {
    if (this.el && this.el.parentNode) {
      this.el.parentNode.removeChild(this.el);
    }
    this.el = null;
  }
}

export default FloatingButton;

// Made with Bob
