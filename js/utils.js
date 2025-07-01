/**
 * ATLAS - Utility Functions
 */

export class Utils {
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    static autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
    
    static showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
    
    static focusInput() {
        setTimeout(() => {
            document.getElementById('message-input').focus();
        }, 100);
    }
    
    static validateMessage(content) {
        if (!content.trim()) {
            return { valid: false, error: 'Message cannot be empty' };
        }
        
        if (content.length > 4000) {
            return { valid: false, error: 'Message too long (max 4000 characters)' };
        }
        
        return { valid: true };
    }
}
