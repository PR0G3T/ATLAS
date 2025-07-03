/**
 * Session Manager
 * Coordinates session interface and delegates to specialized managers
 */
import { MessageManager } from './messageManager.js';
import { APIManager } from './apiManager.js';
import { SessionStateManager } from './sessionStateManager.js';

export class SessionManager {
    constructor() {
        this.messageManager = null;
        this.apiManager = null;
        this.stateManager = null;
        
        this.sessionContainer = null;
        this.sessionInput = null;
        this.sendButton = null;
        this.sessionList = null;
        this.welcomeInput = null;
        this.welcomeSendButton = null;
        
        this.welcomePhrases = [
            "What can I do for you?",
            "How can I assist you today?",
            "What would you like to explore?",
            "How may I help you?",
            "What's on your mind?",
            "Ready to help you out!",
            "What brings you here today?",
            "How can I make your day better?"
        ];
        
        this.lastSessionCreated = 0;
        this.init();
    }

    init() {
        this.sessionList = document.querySelector('.session-list');
        this.stateManager = new SessionStateManager();
        this.apiManager = new APIManager();
        
        this.createSessionContainer();
        this.messageManager = new MessageManager(this.sessionContainer);
        
        this.bindEvents();
        this.bindCustomEvents();
        this.renderSessionList();
        this.initializeDefaultState();
    }

    createSessionContainer() {
        const mainContent = document.querySelector('.main-content');
        if (!mainContent) return;

        this.sessionContainer = document.createElement('div');
        this.sessionContainer.className = 'session-container';
        this.sessionContainer.innerHTML = `
            <div class="session-welcome">
                <h1 class="session-welcome-text">${this.getRandomWelcomePhrase()}</h1>
                <div class="session-welcome-input-wrapper">
                    <textarea 
                        class="session-welcome-input" 
                        placeholder="Type your message..."
                        rows="1"
                    ></textarea>
                    <button class="session-welcome-send">Send</button>
                </div>
            </div>
            <div class="session-messages"></div>
            <div class="session-input-container">
                <div class="session-input-wrapper">
                    <textarea 
                        class="session-input" 
                        placeholder="Type your message..."
                        rows="1"
                    ></textarea>
                    <button class="send-button">Send</button>
                </div>
            </div>
        `;

        mainContent.appendChild(this.sessionContainer);
        this.getElementReferences();
    }

    getElementReferences() {
        this.sessionInput = this.sessionContainer.querySelector('.session-input');
        this.sendButton = this.sessionContainer.querySelector('.send-button');
        this.welcomeInput = this.sessionContainer.querySelector('.session-welcome-input');
        this.welcomeSendButton = this.sessionContainer.querySelector('.session-welcome-send');
    }

    bindEvents() {
        if (!this.sessionInput || !this.sendButton || !this.welcomeInput || !this.welcomeSendButton) return;

        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.welcomeSendButton.addEventListener('click', () => this.sendWelcomeMessage());

        this.sessionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.welcomeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendWelcomeMessage();
            }
        });

        this.sessionInput.addEventListener('input', () => {
            this.autoResizeTextarea(this.sessionInput);
        });

        this.welcomeInput.addEventListener('input', () => {
            this.autoResizeTextarea(this.welcomeInput);
        });
    }

    bindCustomEvents() {
        window.addEventListener('atlas-create-new-session', (e) => {
            console.log('Creating new session from:', e.detail?.source);
            this.createNewSession();
        });
        
        window.addEventListener('atlas-create-session', (e) => {
            console.log('Creating session (legacy event)');
            this.createNewSession();
        });
    }

    initializeDefaultState() {
        const currentPage = localStorage.getItem('atlas-current-page');
        
        if (currentPage !== 'settings' && !this.stateManager.currentSessionId) {
            setTimeout(() => {
                this.createNewSession();
            }, 100);
        }
    }

    createNewSession() {
        const now = Date.now();
        if (this.lastSessionCreated && (now - this.lastSessionCreated) < 500) {
            console.log('Session creation throttled');
            return;
        }
        this.lastSessionCreated = now;

        const session = this.stateManager.createSession();
        this.messageManager.clearMessages();
        this.setWelcomeMode(true);
        this.showSessionInterface();

        setTimeout(() => {
            this.updateWelcomePhrase();
            if (this.welcomeInput) {
                this.welcomeInput.focus();
            }
        }, 100);

        console.log('Draft session created:', session.id);
    }

    async sendWelcomeMessage() {
        const message = this.welcomeInput.value.trim();
        if (!message) return;

        const currentSession = this.stateManager.getCurrentSession();
        if (currentSession && currentSession.isDraft) {
            this.stateManager.commitDraftSession();
            this.renderSessionList();
        }

        this.setWelcomeMode(false);
        this.welcomeInput.value = '';
        await this.processMessage(message);
    }

    async sendMessage() {
        const message = this.sessionInput.value.trim();
        if (!message) return;

        if (!this.stateManager.currentSessionId) {
            this.createNewSession();
            setTimeout(() => this.sendWelcomeMessage(), 50);
            this.welcomeInput.value = message;
            return;
        }

        this.sessionInput.value = '';
        this.autoResizeTextarea(this.sessionInput);
        await this.processMessage(message);
    }

    async processMessage(content) {
        const messageData = this.messageManager.addMessage(content, 'user');
        this.stateManager.addMessageToSession(messageData);
        
        await this.getAssistantResponse();
        this.stateManager.saveSessionHistory();
    }

    async getAssistantResponse() {
        const currentSession = this.stateManager.getCurrentSession();
        if (!currentSession) return;

        this.messageManager.showTypingIndicator();

        try {
            const response = await this.apiManager.getAssistantResponse(currentSession.messages);
            this.messageManager.hideTypingIndicator();
            
            const messageData = this.messageManager.addMessage(response, 'assistant');
            this.stateManager.addMessageToSession(messageData);
            
        } catch (error) {
            this.messageManager.hideTypingIndicator();
            const messageData = this.messageManager.addMessage(error.message, 'assistant');
            this.stateManager.addMessageToSession(messageData);
            console.error('Error fetching assistant response:', error);
        }
    }

    switchToSession(sessionId) {
        const settingsContainer = document.querySelector('.settings-container');
        const isSettingsOpen = settingsContainer && settingsContainer.classList.contains('active');
        
        if (isSettingsOpen) {
            window.dispatchEvent(new CustomEvent('atlas-close-settings'));
        }

        const session = this.stateManager.switchToSession(sessionId);
        this.messageManager.clearMessages();
        
        if (session) {
            const hasMessages = session.messages && session.messages.length > 0;
            this.setWelcomeMode(!hasMessages);
            
            if (hasMessages) {
                session.messages.forEach(message => {
                    this.messageManager.addMessage(message.content, message.sender, message.timestamp);
                });
                this.messageManager.scrollToBottom(true);
            } else {
                this.updateWelcomePhrase();
            }
        }
        
        this.renderSessionList();
        this.showSessionInterface();
    }

    renderSessionList() {
        if (!this.sessionList) return;

        this.sessionList.innerHTML = '';
        
        this.stateManager.getSessionList().forEach(session => {
            const sessionItem = document.createElement('button');
            sessionItem.className = `session-item ${session.id === this.stateManager.currentSessionId ? 'active' : ''}`;
            
            sessionItem.innerHTML = `
                <span class="session-item-text">${session.title}</span>
                <button class="session-delete-btn" data-session-id="${session.id}" title="Delete session">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zM8 9v10h1V9H8zm3 0v10h1V9h-1zm3 0v10h1V9h-1z"/>
                        <path d="M15.5 4H14V3a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1H8.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"/>
                    </svg>
                </button>
            `;
            
            sessionItem.addEventListener('click', (e) => {
                if (e.target.closest('.session-delete-btn')) return;
                this.switchToSession(session.id);
            });

            const deleteBtn = sessionItem.querySelector('.session-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(session.id);
            });
            
            this.sessionList.appendChild(sessionItem);
        });
    }

    deleteSession(sessionId) {
        const session = this.stateManager.sessions.find(s => s.id === sessionId);
        if (!session) return;

        if (!confirm(`Delete session "${session.title}"?`)) return;

        const nextSession = this.stateManager.deleteSession(sessionId);
        
        if (nextSession) {
            this.switchToSession(nextSession.id);
        } else {
            this.hideSessionInterface();
        }

        this.renderSessionList();
    }

    getRandomWelcomePhrase() {
        return this.welcomePhrases[Math.floor(Math.random() * this.welcomePhrases.length)];
    }

    setWelcomeMode(isWelcome) {
        if (!this.sessionContainer) return;
        
        if (isWelcome) {
            this.sessionContainer.classList.add('welcome-mode');
        } else {
            this.sessionContainer.classList.remove('welcome-mode');
        }
    }

    updateWelcomePhrase() {
        const welcomeText = this.sessionContainer?.querySelector('.session-welcome-text');
        if (welcomeText) {
            welcomeText.textContent = this.getRandomWelcomePhrase();
        }
    }

    autoResizeTextarea(textarea) {
        if (!textarea) return;
        
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    showSessionInterface() {
        const settingsContainer = document.querySelector('.settings-container');
        if (settingsContainer && settingsContainer.classList.contains('active')) {
            window.dispatchEvent(new CustomEvent('atlas-close-settings'));
        }
        
        if (this.sessionContainer) {
            this.sessionContainer.classList.add('active');
        }
    }

    hideSessionInterface() {
        if (this.sessionContainer) {
            this.sessionContainer.classList.remove('active');
        }
    }

    clearAllSessions() {
        this.stateManager.clearAllSessions();
        this.messageManager.clearMessages();
        this.renderSessionList();
        
        if (this.sessionContainer) {
            this.sessionContainer.classList.remove('active');
        }
    }

    handleFirstMessage(message) {
        console.log('Handling first message:', message);
        
        this.createNewSession();
        
        setTimeout(() => {
            if (this.welcomeInput) {
                this.welcomeInput.value = message;
                this.sendWelcomeMessage();
            }
        }, 150);
    }

    updateSessionTitle(message) {
        const currentSession = this.stateManager.getCurrentSession();
        if (currentSession && currentSession.title === 'New Session') {
            currentSession.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
            
            if (!currentSession.isDraft) {
                this.renderSessionList();
            }
        }
    }
}