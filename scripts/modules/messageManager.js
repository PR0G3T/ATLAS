/**
 * Message Manager
 * Handles message formatting, display, and DOM operations
 */
export class MessageManager {
    constructor(sessionContainer) {
        this.sessionContainer = sessionContainer;
        this.sessionMessages = sessionContainer.querySelector('.session-messages');
        this.typingIndicator = null;
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // Handle copy code button clicks
        this.sessionMessages.addEventListener('click', (e) => {
            const copyBtn = e.target.closest('.copy-code-btn');
            if (copyBtn) {
                this.handleCopyCode(copyBtn);
            }
        });
    }

    addMessage(content, sender, timestamp = null) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const time = timestamp || Date.now();
        const timeString = new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-bubble">
                ${this.formatMessageContent(content)}
            </div>
            <span class="message-timestamp">${timeString}</span>
        `;

        this.sessionMessages.appendChild(messageElement);
        this.scrollToBottom();

        // Highlight new code blocks
        messageElement.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });

        return {
            content,
            sender,
            timestamp: time
        };
    }

    clearMessages() {
        if (this.sessionMessages) {
            this.sessionMessages.innerHTML = '';
        }
    }

    showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.className = 'typing-indicator active';
        typingElement.innerHTML = `
            <div class="message-bubble">
                <span class="typing-dots">Assistant is typing</span>
            </div>
        `;
        
        this.sessionMessages.appendChild(typingElement);
        this.typingIndicator = typingElement;
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        if (this.typingIndicator && this.typingIndicator.parentNode) {
            this.typingIndicator.parentNode.removeChild(this.typingIndicator);
            this.typingIndicator = null;
        }
    }

    scrollToBottom(force = false) {
        if (this.sessionMessages) {
            const delay = force ? 200 : 100;
            setTimeout(() => {
                this.sessionMessages.scrollTop = this.sessionMessages.scrollHeight;
                
                if (force) {
                    setTimeout(() => {
                        this.sessionMessages.scrollTop = this.sessionMessages.scrollHeight;
                    }, 100);
                }
            }, delay);
        }
    }

    formatMessageContent(text) {
        const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
        let lastIndex = 0;
        let result = '';
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            const precedingText = text.substring(lastIndex, match.index);
            result += this.escapeHtml(precedingText).replace(/\n/g, '<br>');

            const language = match[1] || 'plaintext';
            const code = match[2];
            
            result += `
                <div class="code-block-wrapper">
                    <div class="code-block-header">
                        <span class="language-name">${this.escapeHtml(language)}</span>
                        <button class="copy-code-btn" title="Copy code">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                            </svg>
                        </button>
                    </div>
                    <pre><code class="language-${this.escapeHtml(language)}">${this.escapeHtml(code)}</code></pre>
                </div>
            `;
            
            lastIndex = match.index + match[0].length;
        }

        const remainingText = text.substring(lastIndex);
        result += this.escapeHtml(remainingText).replace(/\n/g, '<br>');

        return result;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async handleCopyCode(button) {
        const wrapper = button.closest('.code-block-wrapper');
        const codeElement = wrapper?.querySelector('code');
        if (!codeElement) return;

        const codeToCopy = codeElement.textContent;
        
        try {
            await navigator.clipboard.writeText(codeToCopy);
            button.classList.add('copied');
            setTimeout(() => {
                button.classList.remove('copied');
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code: ', err);
        }
    }
}
