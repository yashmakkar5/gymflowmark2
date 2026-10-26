// Reusable Modal Component
import { Icons } from './icons.js';

let modalOverlay = null;

function ensureModal() {
  if (!modalOverlay) {
    modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
      <div class="modal-container" id="global-modal-container">
        <div class="modal-header">
          <h3 class="modal-title" id="global-modal-title">Modal Title</h3>
          <button class="modal-close-btn" id="global-modal-close" aria-label="Close modal">
            ${Icons.x}
          </button>
        </div>
        <div class="modal-body" id="global-modal-body"></div>
        <div class="modal-footer" id="global-modal-footer"></div>
      </div>
    `;
    document.body.appendChild(modalOverlay);

    // Event listeners
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) Modal.close();
    });

    document.getElementById('global-modal-close').addEventListener('click', () => {
      Modal.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('open')) {
        Modal.close();
      }
    });
  }
}

export const Modal = {
  open({ title, bodyHTML, footerHTML, large = false, onOpen }) {
    ensureModal();

    const titleEl = document.getElementById('global-modal-title');
    const bodyEl = document.getElementById('global-modal-body');
    const footerEl = document.getElementById('global-modal-footer');
    const container = document.getElementById('global-modal-container');

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHTML;
    footerEl.innerHTML = footerHTML || '';

    if (large) {
      container.classList.add('large');
    } else {
      container.classList.remove('large');
    }

    modalOverlay.classList.add('open');

    if (onOpen) {
      onOpen(bodyEl, footerEl);
    }
  },

  close() {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
    }
  },
};
