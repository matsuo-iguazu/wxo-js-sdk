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
    this.el.innerHTML = `<span style="color:white;font-size:18px;font-weight:700;letter-spacing:0.5px;font-family:'IBM Plex Sans',-apple-system,sans-serif;">AI</span>`;
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
