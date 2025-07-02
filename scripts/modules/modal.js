/**
 * Modal Module
 * Handles custom modal dialogs
 */
export class ModalManager {
    constructor() {
        this.activeModal = null;
        this.init();
    }

    init() {
        // Handle escape key globally
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });
    }

    show(config) {
        // Remove any existing modal
        this.close();

        const modal = this.createModal(config);
        document.body.appendChild(modal);
        this.activeModal = modal;

        // Trigger animation
        requestAnimationFrame(() => {
            modal.classList.add('active');
        });

        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    }

    createModal(config) {
        const {
            title = 'Confirmation',
            message = '',
            details = null,
            highlight = null,
            prompt = null, // New: for input fields
            type = 'warning', // 'warning' or 'danger' or 'info'
            confirmText = 'Confirm',
            cancelText = 'Cancel'
        } = config;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';

        let iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#ffd500" d="M8.681 2.785c.568-1.047 2.071-1.047 2.638 0l6.5 12.002A1.5 1.5 0 0 1 16.502 17H3.498a1.5 1.5 0 0 1-1.319-2.215zM10.5 7.5a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm.25 6.25a.75.75 0 1 0-1.5 0a.75.75 0 0 0 1.5 0"/></svg>`;
        if (type === 'info') {
            iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="#3b82f6" d="M10 2a8 8 0 1 0 0 16a8 8 0 0 0 0-16M9 5h2v2H9zm0 4h2v6H9z"/></svg>`;
        }

        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <div class="modal-icon ${type}">
                        ${iconSvg}
                    </div>
                    <h2 class="modal-title">${title}</h2>
                </div>
                <div class="modal-content">
                    <p class="modal-message">${message}</p>
                    ${details ? `
                        <div class="modal-details">
                            <div class="modal-details-title">${details.title}</div>
                            <ul class="modal-details-list">
                                ${details.items.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${highlight ? `
                        <div class="modal-highlight">
                            ${highlight}
                        </div>
                    ` : ''}
                    ${prompt ? `
                        <div class="modal-prompt">
                            <label for="modal-input" class="modal-prompt-label">${prompt.label}</label>
                            <input type="${prompt.type || 'text'}" id="modal-input" class="modal-prompt-input" placeholder="${prompt.placeholder || ''}" value="${prompt.value || ''}">
                        </div>
                    ` : ''}
                </div>
                <div class="modal-actions">
                    <button class="modal-btn modal-btn-cancel" data-action="cancel">
                        ${cancelText}
                    </button>
                    <button class="modal-btn modal-btn-confirm" data-action="confirm">
                        ${confirmText}
                    </button>
                </div>
            </div>
        `;

        // Handle clicks
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.handleAction('cancel');
            } else if (e.target.dataset.action) {
                this.handleAction(e.target.dataset.action);
            }
        });

        return modal;
    }

    handleAction(action) {
        const result = {
            confirmed: action === 'confirm',
            value: null
        };

        if (this.activeModal) {
            const input = this.activeModal.querySelector('#modal-input');
            if (input) {
                result.value = input.value;
            }
        }

        this.close();
        if (this.resolvePromise) {
            this.resolvePromise(result);
        }
    }

    close() {
        if (this.activeModal) {
            this.activeModal.classList.remove('active');
            setTimeout(() => {
                if (this.activeModal && this.activeModal.parentNode) {
                    this.activeModal.parentNode.removeChild(this.activeModal);
                }
                this.activeModal = null;
            }, 300);
        }
    }
}
