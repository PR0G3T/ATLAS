/**
 * Session Module
 * Handles session interface and message management
 */
export class SessionManager {
    constructor() {
        this.sessions = [];
        this.currentSessionId = null;
        this.draftSession = null; // Track draft session that hasn't been saved yet
        this.isFirstMessage = true;
        this.sessionContainer = null;
        this.sessionInput = null;
        this.sessionMessages = null;
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
        this.init();
    }

    init() {
        this.sessionList = document.querySelector('.session-list');
        this.createSessionContainer();
        this.bindEvents();
        this.loadSessionHistory();
        
        // Listen for custom events
        this.bindCustomEvents();
        
        // Check if we should restore a session or start fresh
        this.initializeDefaultState();
    }

    initializeDefaultState() {
        const savedSessions = localStorage.getItem('atlas-sessions');
        const currentSessionId = localStorage.getItem('atlas-current-session');
        const currentPage = localStorage.getItem('atlas-current-page');
        
        // If no settings page and no active session, create a new session
        if (currentPage !== 'settings' && (!currentSessionId || !savedSessions)) {
            setTimeout(() => {
                this.createNewSession();
            }, 100);
        }
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
            <div class="typing-indicator">
                <span class="typing-dots">Assistant is typing</span>
            </div>
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

        // Get references to elements
        this.sessionMessages = this.sessionContainer.querySelector('.session-messages');
        this.sessionInput = this.sessionContainer.querySelector('.session-input');
        this.sendButton = this.sessionContainer.querySelector('.send-button');
        this.typingIndicator = this.sessionContainer.querySelector('.typing-indicator');
        this.welcomeInput = this.sessionContainer.querySelector('.session-welcome-input');
        this.welcomeSendButton = this.sessionContainer.querySelector('.session-welcome-send');
    }

    bindCustomEvents() {
        // Listen for new session creation - use more specific event name
        window.addEventListener('atlas-create-new-session', (e) => {
            console.log('Creating new session from:', e.detail?.source);
            this.createNewSession();
        });
        
        // Keep the old event for backward compatibility
        window.addEventListener('atlas-create-session', (e) => {
            console.log('Creating session (legacy event)');
            this.createNewSession();
        });
    }

    getRandomWelcomePhrase() {
        return this.welcomePhrases[Math.floor(Math.random() * this.welcomePhrases.length)];
    }

    bindEvents() {
        if (!this.sessionInput || !this.sendButton || !this.welcomeInput || !this.welcomeSendButton) return;

        // Handle regular send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Handle welcome send button click
        this.welcomeSendButton.addEventListener('click', () => {
            this.sendWelcomeMessage();
        });

        // Handle Enter key for regular input
        this.sessionInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Handle Enter key for welcome input
        this.welcomeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendWelcomeMessage();
            }
        });

        // Auto-resize textareas
        this.sessionInput.addEventListener('input', () => {
            this.autoResizeTextarea(this.sessionInput);
        });

        this.welcomeInput.addEventListener('input', () => {
            this.autoResizeTextarea(this.welcomeInput);
        });
    }

    createNewSession() {
        // Prevent creating multiple sessions rapidly
        const now = Date.now();
        if (this.lastSessionCreated && (now - this.lastSessionCreated) < 500) {
            console.log('Session creation throttled');
            return;
        }
        this.lastSessionCreated = now;

        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            title: 'New Session',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDraft: true // Mark as draft initially
        };

        // Store as draft session instead of adding to sessions array
        this.draftSession = session;
        this.currentSessionId = sessionId;
        
        // Don't save to localStorage yet - wait for first message
        
        this.showSessionInterface();
        this.clearMessages();
        this.setWelcomeMode(true);

        // Focus on welcome input and set new phrase
        setTimeout(() => {
            this.updateWelcomePhrase();
            if (this.welcomeInput) {
                this.welcomeInput.focus();
            }
        }, 100);

        console.log('Draft session created:', sessionId);
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

    sendWelcomeMessage() {
        const message = this.welcomeInput.value.trim();
        if (!message) return;

        // Convert draft session to real session on first message
        if (this.draftSession && this.draftSession.isDraft) {
            this.commitDraftSession();
        }

        // Switch to chat mode
        this.setWelcomeMode(false);
        
        // Add user message
        this.addMessage(message, 'user');
        
        // Update session title
        this.updateSessionTitle(message);
        
        // Clear welcome input
        this.welcomeInput.value = '';
        
        // Simulate assistant response
        this.getAssistantResponse();
        
        this.saveSessionHistory();
    }

    commitDraftSession() {
        if (!this.draftSession) return;

        // Mark as no longer draft
        this.draftSession.isDraft = false;
        
        // Add to sessions array
        this.sessions.unshift(this.draftSession);
        
        // Update session list
        this.renderSessionList();
        
        // Clear draft
        this.draftSession = null;
        
        // Save current session ID
        localStorage.setItem('atlas-current-session', this.currentSessionId);
        
        console.log('Draft session committed:', this.currentSessionId);
    }

    sendMessage() {
        const message = this.sessionInput.value.trim();
        if (!message) return;

        // Create new session if none exists
        if (!this.currentSessionId) {
            this.createNewSession();
            // Wait for session creation then send message
            setTimeout(() => this.sendWelcomeMessage(), 50);
            this.welcomeInput.value = message;
            return;
        }

        // Add user message
        this.addMessage(message, 'user');
        
        // Clear input
        this.sessionInput.value = '';
        this.autoResizeTextarea(this.sessionInput);
        
        // Simulate assistant response
        this.getAssistantResponse();
        
        this.saveSessionHistory();
    }

    addMessage(content, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-bubble">
                ${this.escapeHtml(content)}
            </div>
            <span class="message-timestamp">${timestamp}</span>
        `;

        this.sessionMessages.appendChild(messageElement);
        this.scrollToBottom();

        // Add to current session (either real session or draft)
        const currentSession = this.getCurrentSession();
        if (currentSession) {
            currentSession.messages.push({
                content,
                sender,
                timestamp: Date.now()
            });
            currentSession.updatedAt = Date.now();
        }
    }

    getCurrentSession() {
        // Return draft session if it exists, otherwise find in sessions array
        if (this.draftSession && this.draftSession.id === this.currentSessionId) {
            return this.draftSession;
        }
        return this.sessions.find(session => session.id === this.currentSessionId);
    }

    switchToSession(sessionId) {
        // If switching away from a draft session, discard it
        if (this.draftSession && this.draftSession.id === this.currentSessionId && sessionId !== this.currentSessionId) {
            this.draftSession = null;
        }

        // Close settings if they are open when switching to a session
        const settingsContainer = document.querySelector('.settings-container');
        const isSettingsOpen = settingsContainer && settingsContainer.classList.contains('active');
        
        if (isSettingsOpen) {
            // Dispatch event to close settings
            window.dispatchEvent(new CustomEvent('atlas-close-settings'));
        }

        this.currentSessionId = sessionId;
        this.clearMessages();
        
        const session = this.getCurrentSession();
        if (session) {
            // Check if session has messages to determine layout
            const hasMessages = session.messages && session.messages.length > 0;
            this.setWelcomeMode(!hasMessages);
            
            if (hasMessages) {
                // Load session messages
                session.messages.forEach(message => {
                    this.addMessageToDOM(message.content, message.sender, message.timestamp);
                });
            } else {
                // New session, update welcome phrase
                this.updateWelcomePhrase();
            }
        }
        
        this.renderSessionList();
        this.showSessionInterface();
    }

    renderSessionList() {
        if (!this.sessionList) return;

        this.sessionList.innerHTML = '';
        
        // Only render non-draft sessions
        this.sessions.filter(session => !session.isDraft).forEach(session => {
            const sessionItem = document.createElement('button');
            sessionItem.className = `session-item ${session.id === this.currentSessionId ? 'active' : ''}`;
            
            sessionItem.innerHTML = `
                <span class="session-item-text">${session.title}</span>
                <button class="session-delete-btn" data-session-id="${session.id}" title="Delete session">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 7H5v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7H6zM8 9v10h1V9H8zm3 0v10h1V9h-1zm3 0v10h1V9h-1z"/>
                        <path d="M15.5 4H14V3a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1H8.5a.5.5 0 0 0 0 1h7a.5.5 0 0 0 0-1z"/>
                    </svg>
                </button>
            `;
            
            // Handle session click (switch to session)
            sessionItem.addEventListener('click', (e) => {
                // Don't switch session if delete button was clicked
                if (e.target.closest('.session-delete-btn')) {
                    return;
                }
                this.switchToSession(session.id);
            });

            // Handle delete button click
            const deleteBtn = sessionItem.querySelector('.session-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSession(session.id);
            });
            
            this.sessionList.appendChild(sessionItem);
        });
    }

    deleteSession(sessionId) {
        // Find session index
        const sessionIndex = this.sessions.findIndex(session => session.id === sessionId);
        if (sessionIndex === -1) return;

        const session = this.sessions[sessionIndex];
        
        // Confirm deletion
        if (!confirm(`Delete session "${session.title}"?`)) {
            return;
        }

        // Remove session from array
        this.sessions.splice(sessionIndex, 1);

        // If this was the current session, handle switching to another session or home
        if (this.currentSessionId === sessionId) {
            if (this.sessions.length > 0) {
                // Switch to the most recent session
                const mostRecentSession = this.sessions[0];
                this.switchToSession(mostRecentSession.id);
            } else {
                // No sessions left, go to home
                this.currentSessionId = null;
                this.hideSessionInterface();
            }
        }

        // Update UI and save
        this.renderSessionList();
        this.saveSessionHistory();
    }

    clearMessages() {
        if (this.sessionMessages) {
            this.sessionMessages.innerHTML = '';
        }
    }

    async getAssistantResponse() {
        const currentSession = this.getCurrentSession();
        if (!currentSession) return;

        this.showTypingIndicator();

        try {
            const response = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompts: currentSession.messages })
            });

            this.hideTypingIndicator();
            const errorText = await response.text();

            if (!response.ok) {
                const errorMessage = `API Error: ${response.status} - ${errorText || 'Failed to fetch response.'}`;
                this.addMessage(errorMessage, 'assistant');
                console.error(errorMessage);
                this.saveSessionHistory();
                return;
            }

            const data = await response.json();
            const assistantMessage = data.response || "Sorry, I couldn't get a response.";
            
            this.addMessage(assistantMessage, 'assistant');
            this.saveSessionHistory();

        } catch (error) {
            this.hideTypingIndicator();
            const errorMessage = `Network Error: ${error.message}`;
            this.addMessage(errorMessage, 'assistant');
            console.error('Error fetching assistant response:', error);
            this.saveSessionHistory();
        }
    }

    showTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.add('active');
            this.scrollToBottom();
        }
    }

    hideTypingIndicator() {
        if (this.typingIndicator) {
            this.typingIndicator.classList.remove('active');
        }
    }

    autoResizeTextarea(textarea) {
        if (!textarea) return;
        
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }

    scrollToBottom() {
        if (this.sessionMessages) {
            setTimeout(() => {
                this.sessionMessages.scrollTop = this.sessionMessages.scrollHeight;
            }, 100);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveSessionHistory() {
        // Only save non-draft sessions
        const sessionsToSave = this.sessions.filter(session => !session.isDraft);
        localStorage.setItem('atlas-sessions', JSON.stringify(sessionsToSave));
        
        // Only save current session if it's not a draft
        const currentSession = this.getCurrentSession();
        if (currentSession && !currentSession.isDraft) {
            localStorage.setItem('atlas-current-session', this.currentSessionId || '');
        }
        
        localStorage.setItem('atlas-session-active', this.sessionContainer?.classList.contains('active') ? 'true' : 'false');
        localStorage.setItem('atlas-first-message', this.isFirstMessage ? 'true' : 'false');
    }

    loadSessionHistory() {
        const savedSessions = localStorage.getItem('atlas-sessions');
        const currentSessionId = localStorage.getItem('atlas-current-session');
        const isSessionActive = localStorage.getItem('atlas-session-active') === 'true';
        const isFirstMessage = localStorage.getItem('atlas-first-message');
        
        if (isFirstMessage !== null) {
            this.isFirstMessage = isFirstMessage === 'true';
        }

        if (savedSessions) {
            this.sessions = JSON.parse(savedSessions);
            this.renderSessionList();
        }

        if (currentSessionId && this.sessions.find(s => s.id === currentSessionId)) {
            this.currentSessionId = currentSessionId;
            
            if (isSessionActive) {
                this.switchToSession(currentSessionId);
            }
        }
    }

    addMessageToDOM(content, sender, timestamp) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;
        
        const date = new Date(timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageElement.innerHTML = `
            <div class="message-bubble">
                ${this.escapeHtml(content)}
            </div>
            <span class="message-timestamp">${timeString}</span>
        `;

        this.sessionMessages.appendChild(messageElement);
    }

    clearAllSessions() {
        this.sessions = [];
        this.currentSessionId = null;
        this.draftSession = null; // Clear draft session too
        this.isFirstMessage = true;
        this.clearMessages();
        this.renderSessionList();
        
        if (this.sessionContainer) {
            this.sessionContainer.classList.remove('active');
        }
        
        this.saveSessionHistory();
    }

    showSessionInterface() {
        // Force close settings first
        const settingsContainer = document.querySelector('.settings-container');
        if (settingsContainer && settingsContainer.classList.contains('active')) {
            window.dispatchEvent(new CustomEvent('atlas-close-settings'));
        }
        
        if (this.sessionContainer) {
            this.sessionContainer.classList.add('active');
        }
        this.saveSessionHistory();
    }

    hideSessionInterface() {
        if (this.sessionContainer) {
            this.sessionContainer.classList.remove('active');
        }
        this.saveSessionHistory();
    }

    handleFirstMessage(message) {
        console.log('Handling first message:', message);
        
        // Always create a new session for first message
        this.createNewSession();
        
        // Wait for session creation then send message
        setTimeout(() => {
            if (this.welcomeInput) {
                this.welcomeInput.value = message;
                this.sendWelcomeMessage();
            }
        }, 150);
    }

    updateSessionTitle(message) {
        const currentSession = this.getCurrentSession();
        if (currentSession && currentSession.title === 'New Session') {
            // Use first 30 characters of message as title
            currentSession.title = message.length > 30 ? message.substring(0, 30) + '...' : message;
            
            // Only update the session list if it's not a draft
            if (!currentSession.isDraft) {
                this.renderSessionList();
            }
        }
    }
}