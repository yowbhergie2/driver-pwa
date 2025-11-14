/**
 * Gmail-Style Modal System
 * A lightweight, modern modal manager inspired by Gmail's UI
 */

class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.modalStack = [];
    this.backdropElement = null;
    this.init();
  }

  /**
   * Initialize the modal system
   */
  init() {
    // Create backdrop element
    this.backdropElement = document.createElement('div');
    this.backdropElement.className = 'gmail-modal-backdrop';
    document.body.appendChild(this.backdropElement);

    // Close modal on backdrop click
    this.backdropElement.addEventListener('click', (e) => {
      if (e.target === this.backdropElement) {
        this.closeTopModal();
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.closeTopModal();
      }
    });
  }

  /**
   * Create and show a modal
   * @param {Object} options - Modal configuration
   * @returns {HTMLElement} - The modal element
   */
  show(options = {}) {
    const {
      title = 'Modal Title',
      content = '',
      size = 'medium', // small, medium, large, fullscreen
      buttons = [],
      closable = true,
      onClose = null,
      className = ''
    } = options;

    // Create modal element
    const modalId = 'modal_' + Date.now();
    const modal = document.createElement('div');
    modal.className = `gmail-modal gmail-modal-${size} ${className}`;
    modal.id = modalId;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `${modalId}-title`);

    // Modal content structure
    modal.innerHTML = `
      <div class="gmail-modal-container">
        <div class="gmail-modal-header">
          <h2 class="gmail-modal-title" id="${modalId}-title">${title}</h2>
          ${closable ? '<button class="gmail-modal-close" aria-label="Close"><i class="bi bi-x-lg"></i></button>' : ''}
        </div>
        <div class="gmail-modal-body">
          ${content}
        </div>
        ${buttons.length > 0 ? `
          <div class="gmail-modal-footer">
            ${buttons.map((btn, index) => `
              <button class="gmail-modal-btn gmail-modal-btn-${btn.type || 'default'}" data-action="${index}">
                ${btn.icon ? `<i class="bi bi-${btn.icon} me-2"></i>` : ''}
                ${btn.label}
              </button>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // Add modal to DOM
    document.body.appendChild(modal);

    // Store modal data
    this.modals.set(modalId, {
      element: modal,
      options: options,
      onClose: onClose
    });

    // Add to stack
    this.modalStack.push(modalId);
    this.activeModal = modalId;

    // Show backdrop
    this.backdropElement.classList.add('active');
    document.body.classList.add('modal-open');

    // Animate modal in
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);

    // Attach event listeners
    if (closable) {
      const closeBtn = modal.querySelector('.gmail-modal-close');
      closeBtn.addEventListener('click', () => this.close(modalId));
    }

    // Attach button event listeners
    buttons.forEach((btn, index) => {
      const buttonElement = modal.querySelector(`[data-action="${index}"]`);
      if (buttonElement && btn.onClick) {
        buttonElement.addEventListener('click', async (e) => {
          if (btn.closeOnClick !== false) {
            await btn.onClick(e, modal);
            this.close(modalId);
          } else {
            await btn.onClick(e, modal);
          }
        });
      }
    });

    return modal;
  }

  /**
   * Create a confirmation dialog
   */
  confirm(options = {}) {
    const {
      title = 'Confirm Action',
      message = 'Are you sure?',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmType = 'primary',
      onConfirm = null,
      onCancel = null
    } = options;

    return new Promise((resolve) => {
      this.show({
        title: title,
        content: `<p class="gmail-modal-message">${message}</p>`,
        size: 'small',
        buttons: [
          {
            label: cancelText,
            type: 'secondary',
            onClick: () => {
              if (onCancel) onCancel();
              resolve(false);
            }
          },
          {
            label: confirmText,
            type: confirmType,
            onClick: () => {
              if (onConfirm) onConfirm();
              resolve(true);
            }
          }
        ]
      });
    });
  }

  /**
   * Create an alert dialog
   */
  alert(options = {}) {
    const {
      title = 'Alert',
      message = '',
      type = 'info', // info, success, warning, error
      buttonText = 'OK'
    } = options;

    const icons = {
      info: 'info-circle',
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'x-circle'
    };

    return new Promise((resolve) => {
      this.show({
        title: title,
        content: `
          <div class="gmail-modal-alert gmail-modal-alert-${type}">
            <i class="bi bi-${icons[type]} gmail-modal-alert-icon"></i>
            <p class="gmail-modal-message">${message}</p>
          </div>
        `,
        size: 'small',
        buttons: [
          {
            label: buttonText,
            type: 'primary',
            onClick: () => resolve(true)
          }
        ]
      });
    });
  }

  /**
   * Create a loading modal
   */
  loading(options = {}) {
    const {
      title = 'Loading',
      message = 'Please wait...'
    } = options;

    const modal = this.show({
      title: title,
      content: `
        <div class="gmail-modal-loading">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="gmail-modal-message">${message}</p>
        </div>
      `,
      size: 'small',
      closable: false,
      buttons: []
    });

    return modal.id;
  }

  /**
   * Close a specific modal
   */
  close(modalId) {
    const modalData = this.modals.get(modalId);
    if (!modalData) return;

    const { element, onClose } = modalData;

    // Call onClose callback
    if (onClose) onClose();

    // Animate out
    element.classList.remove('active');

    // Remove from stack
    const index = this.modalStack.indexOf(modalId);
    if (index > -1) {
      this.modalStack.splice(index, 1);
    }

    // Update active modal
    if (this.modalStack.length > 0) {
      this.activeModal = this.modalStack[this.modalStack.length - 1];
    } else {
      this.activeModal = null;
      this.backdropElement.classList.remove('active');
      document.body.classList.remove('modal-open');
    }

    // Remove from DOM after animation
    setTimeout(() => {
      element.remove();
      this.modals.delete(modalId);
    }, 300);
  }

  /**
   * Close the topmost modal
   */
  closeTopModal() {
    if (this.activeModal) {
      this.close(this.activeModal);
    }
  }

  /**
   * Close all modals
   */
  closeAll() {
    const modalIds = Array.from(this.modals.keys());
    modalIds.forEach(id => this.close(id));
  }

  /**
   * Check if any modal is open
   */
  isOpen() {
    return this.modalStack.length > 0;
  }

  /**
   * Get the active modal element
   */
  getActiveModal() {
    if (!this.activeModal) return null;
    const modalData = this.modals.get(this.activeModal);
    return modalData ? modalData.element : null;
  }
}

// Create global instance
const modalManager = new ModalManager();

// Export for module usage (optional)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
}