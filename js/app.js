/**
 * ATLAS - AI Assistant
 * Application principale
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
        
        // Créer une session par défaut si aucune n'existe
        if (this.sessions.length === 0) {
            this.createNewSession();
        } else if (this.currentSessionId) {
            this.loadSession(this.currentSessionId);
        }
        
        this.focusInput();
    }
    
    setupEventListeners() {
        // Nouvelle session
        document.getElementById('new-session-btn').addEventListener('click', () => {
            this.createNewSession();
        });
        
        // Envoi de message
        document.getElementById('chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        // Auto-resize du textarea
        const input = document.getElementById('message-input');
        input.addEventListener('input', () => {
            this.autoResizeTextarea(input);
            this.updateSendButton();
        });
        
        // Envoi avec Ctrl+Entrée
        input.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }
    
    // Gestion des sessions
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
            this.showToast('Erreur lors de la sauvegarde', 'error');
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
            title: 'Nouvelle conversation',
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
        this.showToast('Nouvelle session créée');
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
        
        // Mettre à jour le titre si c'est le premier message utilisateur
        if (role === 'user' && session.messages.filter(m => m.role === 'user').length === 1) {
            const title = content.length > 30 ? content.substring(0, 30) + '...' : content;
            this.updateSessionTitle(session.id, title);
        }
        
        this.saveSessions();
    }
    
    // Interface utilisateur
    renderSessions() {
        const container = document.getElementById('sessions-list');
        if (this.sessions.length === 0) {
            container.innerHTML = '<div class="no-sessions">Aucune conversation</div>';
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
        
        // Supprimer le message de bienvenue
        const welcome = container.querySelector('.welcome-message');
        if (welcome) welcome.remove();
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = role === 'user' ? '👤' : '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);
        
        // Scroll vers le bas
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
            this.showToast('Message trop long (max 4000 caractères)', 'error');
            return;
        }
        
        // Ajouter le message utilisateur
        this.addMessageToUI(content, 'user');
        input.value = '';
        this.autoResizeTextarea(input);
        this.updateSendButton();
        
        // État de chargement
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
                throw new Error(`Erreur ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Supprimer le message de chargement
            loadingMessage.remove();
            
            // Ajouter la réponse
            if (data.response) {
                this.addMessageToUI(data.response, 'ai');
            } else {
                throw new Error('Réponse invalide du serveur');
            }
            
        } catch (error) {
            console.error('Erreur:', error);
            loadingMessage.remove();
            this.showToast(`Erreur: ${error.message}`, 'error');
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
        avatar.innerHTML = '🤖';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = 'En cours de réflexion...';
        
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
    
    // Utilitaires
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

// Initialiser l'application
const atlas = new Atlas();

// Exposer globalement pour les événements inline
window.atlas = atlas;
