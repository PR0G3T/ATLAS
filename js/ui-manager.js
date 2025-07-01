/**
 * ATLAS - UI Manager
 */

import { Utils } from './utils.js';

export class UIManager {
    constructor(sessionManager) {
        this.sessionManager = sessionManager;
        this.isLoading = false;
    }
    
    renderSessions() {
        const container = document.getElementById('sessions-list');
        const sessions = this.sessionManager.sessions;
        
        if (sessions.length === 0) {
            container.innerHTML = '<div class="no-sessions">No conversations</div>';
            return;
        }
        
        container.innerHTML = sessions.map(session => `
            <button class="session-item ${session.id === this.sessionManager.currentSessionId ? 'active' : ''}" 
                    data-session-id="${session.id}"
                    onclick="atlas.loadSession('${session.id}')">
                ${Utils.escapeHtml(session.title)}
            </button>
        `).join('');
    }
    
    clearMessages() {
        const container = document.getElementById('messages');
        container.innerHTML = '';
    }
    
    addMessageToUI(content, role, saveToSession = true) {
        const container = document.getElementById('messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = this.createMessageAvatar(role);
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        this.scrollToBottom();
        
        if (saveToSession) {
            this.sessionManager.addMessageToSession(content, role);
        }
    }
    
    createMessageAvatar(role) {
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (role === 'user') {
            avatar.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
            `;
        } else {
            avatar.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.36 2.64c1.64 0 3 1.36 3 3c0 1.65-1.36 3-3 3c-1.65 0-3-1.35-3-3c0-.3.05-.58.14-.84c-1.07-.51-2.25-.8-3.5-.8a8 8 0 0 0-8 8l.04.84l-1.99.21L2 12A10 10 0 0 1 12 2c1.69 0 3.28.42 4.67 1.16c.49-.33 1.07-.52 1.69-.52m0 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1c.56 0 1-.45 1-1c0-.56-.44-1-1-1M5.64 15.36c1.65 0 3 1.35 3 3c0 .3-.05.58-.14.84c1.07.51 2.25.8 3.5.8a8 8 0 0 0 8-8l-.04-.84l1.99-.21L22 12a10 10 0 0 1-10 10c-1.69 0-3.28-.42-4.67-1.16c-.49.33-1.07.52-1.69.52c-1.64 0-3-1.36-3-3c0-1.65 1.36-3 3-3m0 2c-.56 0-1 .45-1 1c0 .56.44 1 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4"/>
                </svg>
            `;
        }
        
        return avatar;
    }
    
    addLoadingMessage() {
        const container = document.getElementById('messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai loading';
        
        const avatar = this.createMessageAvatar('ai');
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = 'Thinking...';
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        this.scrollToBottom();
        
        return messageDiv;
    }
    
    setLoading(loading) {
        this.isLoading = loading;
        const button = document.getElementById('send-btn');
        const input = document.getElementById('message-input');
        
        button.disabled = loading;
        input.disabled = loading;
        
        if (loading) {
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
            `;
            button.style.animation = 'spin 1s linear infinite';
        } else {
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
            `;
            button.style.animation = '';
        }
    }
    
    updateSendButton() {
        const input = document.getElementById('message-input');
        const button = document.getElementById('send-btn');
        const hasContent = input.value.trim().length > 0;
        
        button.disabled = !hasContent || this.isLoading;
    }
    
    scrollToBottom() {
        const container = document.getElementById('messages');
        container.scrollTop = container.scrollHeight;
    }
    
    loadSessionMessages(session) {
        this.clearMessages();
        session.messages.forEach(msg => {
            this.addMessageToUI(msg.content, msg.role, false);
        });
    }
}
