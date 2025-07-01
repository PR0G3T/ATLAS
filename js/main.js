/**
 * ATLAS - AI Assistant
 * Main Application
 */

class Atlas {
    constructor() {
        this.apiUrl = 'https://rds.teamcardinalis.com/atlas/prompt';
        this.sessions = this.loadSessions();
        this.currentSessionId = this.getCurrentSessionId();
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderSessions();
        
        // Create default session if none exists
        if (this.sessions.length === 0) {
            this.createNewSession();
        } else if (this.currentSessionId) {
            this.loadSession(this.currentSessionId);
        }
        
        this.focusInput();
    }
    
    setupEventListeners() {
        // New session
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.createNewSession();
        });
        
        // Send message
        document.getElementById('chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        // Auto-resize textarea
        const input = document.getElementById('message-input');
        input.addEventListener('input', () => {
            this.autoResizeTextarea(input);
            this.updateSendButton();
        });
        
        // Send with Ctrl+Enter
        input.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    // Session management
    loadSessions() {
        try {
            const sessions = localStorage.getItem('atlas_sessions');
            return sessions ? JSON.parse(sessions) : [];
        } catch {
            return [];
        }
    }
    
    saveSessions() {
        try {
            localStorage.setItem('atlas_sessions', JSON.stringify(this.sessions));
        } catch (error) {
            this.showToast('Error saving sessions', 'error');
        }
    }
    
    getCurrentSessionId() {
        return sessionStorage.getItem('atlas_current_session');
    }
    
    setCurrentSessionId(id) {
        sessionStorage.setItem('atlas_current_session', id);
        this.currentSessionId = id;
    }
    
    createNewSession() {
        const session = {
            id: Date.now().toString(),
            title: 'New conversation',
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.sessions.unshift(session);
        this.saveSessions();
        this.setCurrentSessionId(session.id);
        this.renderSessions();
        this.clearMessages();
        this.focusInput();
        this.showToast('New session created');
    }
    
    loadSession(sessionId) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (!session) return;
        
        this.setCurrentSessionId(sessionId);
        this.renderSessions();
        this.clearMessages();
        
        // Charger les messages
        session.messages.forEach(msg => {
            this.addMessageToUI(msg.content, msg.role, false);
        });
        
        this.focusInput();
    }
    
    updateSessionTitle(sessionId, title) {
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
            session.title = title;
            session.updatedAt = new Date().toISOString();
            this.saveSessions();
            this.renderSessions();
        }
    }
    
    addMessageToSession(content, role) {
        const session = this.sessions.find(s => s.id === this.currentSessionId);
        if (!session) return;
        
        const message = {
            content,
            role,
            timestamp: new Date().toISOString()
        };
        
        session.messages.push(message);
        session.updatedAt = new Date().toISOString();
        
        // Update title if this is the first user message
        if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
            const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
            this.updateSessionTitle(session.id, title);
        }
        
        this.saveSessions();
    }
    
    // User interface
    renderSessions() {
        const container = document.getElementById('sessions-list');
        if (this.sessions.length === 0) {
            container.innerHTML = '<div class="no-sessions">No conversations</div>';
            return;
        }
        
        container.innerHTML = this.sessions.map(session => `
            <button class="session-item ${session.id === this.currentSessionId ? 'active' : ''}" 
                    data-session-id="${session.id}"
                    onclick="atlas.loadSession('${session.id}')">
                ${this.escapeHtml(session.title)}
            </button>
        `).join('');
    }
    
    clearMessages() {
        const container = document.getElementById('messages');
        container.innerHTML = '';
    }
    
    addMessageToUI(content, role, saveToSession = true) {
        const container = document.getElementById('messages');
        
        // Remove welcome message
        const welcome = container.querySelector('.welcome-message');
        if (welcome) welcome.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
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
            // Use ATLAS favicon SVG for AI messages
            avatar.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.36 2.64c1.64 0 3 1.36 3 3c0 1.65-1.36 3-3 3c-1.65 0-3-1.35-3-3c0-.3.05-.58.14-.84c-1.07-.51-2.25-.8-3.5-.8a8 8 0 0 0-8 8l.04.84l-1.99.21L2 12A10 10 0 0 1 12 2c1.69 0 3.28.42 4.67 1.16c.49-.33 1.07-.52 1.69-.52m0 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1c.56 0 1-.45 1-1c0-.56-.44-1-1-1M5.64 15.36c1.65 0 3 1.35 3 3c0 .3-.05.58-.14.84c1.07.51 2.25.8 3.5.8a8 8 0 0 0 8-8l-.04-.84l1.99-.21L22 12a10 10 0 0 1-10 10c-1.69 0-3.28-.42-4.67-1.16c-.49.33-1.07.52-1.69.52c-1.64 0-3-1.36-3-3c0-1.65 1.36-3 3-3m0 2c-.56 0-1 .45-1 1c0 .56.44 1 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4"/>
                </svg>
            `;
        }
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
        
        if (saveToSession) {
            this.addMessageToSession(content, role);
        }
    }
    
    async sendMessage() {
        if (this.isLoading) return;
        
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) return;
        if (content.length > 4000) {
            this.showToast('Message too long (max 4000 characters)', 'error');
            return;
        }
        
        // Add user message
        this.addMessageToUI(content, 'user');
        input.value = '';
        this.autoResizeTextarea(input);
        this.updateSendButton();
        
        // Loading state
        this.setLoading(true);
        const loadingMessage = this.addLoadingMessage();
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt: content })
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Remove loading message
            loadingMessage.remove();
            
            // Add response
            if (data.response) {
                this.addMessageToUI(data.response, 'ai');
            } else {
                throw new Error('Invalid server response');
            }
            
        } catch (error) {
            console.error('Error:', error);
            loadingMessage.remove();
            this.showToast(`Error: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
            this.focusInput();
        }
    }
    
    addLoadingMessage() {
        const container = document.getElementById('messages');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai loading';
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.36 2.64c1.64 0 3 1.36 3 3c0 1.65-1.36 3-3 3c-1.65 0-3-1.35-3-3c0-.3.05-.58.14-.84c-1.07-.51-2.25-.8-3.5-.8a8 8 0 0 0-8 8l.04.84l-1.99.21L2 12A10 10 0 0 1 12 2c1.69 0 3.28.42 4.67 1.16c.49-.33 1.07-.52 1.69-.52m0 2a1 1 0 0 0-1 1a1 1 0 0 0 1 1c.56 0 1-.45 1-1c0-.56-.44-1-1-1M5.64 15.36c1.65 0 3 1.35 3 3c0 .3-.05.58-.14.84c1.07.51 2.25.8 3.5.8a8 8 0 0 0 8-8l-.04-.84l1.99-.21L22 12a10 10 0 0 1-10 10c-1.69 0-3.28-.42-4.67-1.16c-.49.33-1.07.52-1.69.52c-1.64 0-3-1.36-3-3c0-1.65 1.36-3 3-3m0 2c-.56 0-1 .45-1 1c0 .56.44 1 1 1a1 1 0 0 0 1-1a1 1 0 0 0-1-1M12 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4"/>
            </svg>
        `;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = 'Thinking...';
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        container.scrollTop = container.scrollHeight;
        
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
    
    // Utilities
    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
    
    updateSendButton() {
        const input = document.getElementById('message-input');
        const button = document.getElementById('send-btn');
        const hasContent = input.value.trim().length > 0;
        
        button.disabled = !hasContent || this.isLoading;
    }
    
    focusInput() {
        setTimeout(() => {
            document.getElementById('message-input').focus();
        }, 100);
    }
    
    showToast(message, type = 'info') {
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
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize application
const atlas = new Atlas();

// Expose globally for inline events
window.atlas = atlas;
