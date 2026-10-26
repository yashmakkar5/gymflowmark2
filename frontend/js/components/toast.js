// Toast Notification System
import { Icons } from './icons.js';

let toastContainer = null;

function ensureContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

export const Toast = {
  show(message, type = 'info', duration = 3500) {
    ensureContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = Icons.check;
    if (type === 'error') iconSvg = Icons.x;
    if (type === 'info') iconSvg = Icons.dashboard;

    toast.innerHTML = `
      <div style="flex-shrink:0; display:flex; align-items:center;">${iconSvg}</div>
      <div style="flex:1; line-height:1.4;">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    const timeout = setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }, duration);

    toast.addEventListener('click', () => {
      clearTimeout(timeout);
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    });
  },

  success(message, duration) {
    this.show(message, 'success', duration);
  },

  error(message, duration) {
    this.show(message, 'error', duration);
  },

  info(message, duration) {
    this.show(message, 'info', duration);
  },
};
