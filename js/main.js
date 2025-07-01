/**
 * ATLAS - AI Assistant
 * Main Application Orchestrator
 */

import { SessionManager } from './session-manager.js';
import { UIManager } from './ui-manager.js';
import { ApiClient } from './api-client.js';
import { MessageManager } from './message-manager.js';
import { Utils } from './utils.js';

class Atlas {
    constructor() {
        this.sessionManager = new SessionManager();
        this.uiManager = new UIManager(this.sessionManager);
        this.apiClient = new ApiClient();
        this.messageManager = new MessageManager(
            this.sessionManager, 
            this.uiManager, 
            this.apiClient
        );
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.uiManager.renderSessions();
        
        // Create default session if none exists
        if (this.sessionManager.sessions.length === 0) {
            this.createNewSession();
        } else if (this.sessionManager.currentSessionId) {
            this.loadSession(this.sessionManager.currentSessionId);
        }
        
        Utils.focusInput();
    }
    
    setupEventListeners() {
        // Send message
        document.getElementById('chat-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
        
        // Auto-resize textarea and update send button
        const input = document.getElementById('message-input');
        input.addEventListener('input', () => {
            Utils.autoResizeTextarea(input);
            this.uiManager.updateSendButton();
        });
        
        // Send with Ctrl+Enter
        input.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // New session with Ctrl+N
            if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                this.createNewSession();
            }
        });
    }
    
    createNewSession() {
        const session = this.sessionManager.createNewSession();
        this.uiManager.renderSessions();
        this.uiManager.clearMessages();
        Utils.focusInput();
    }
    
    loadSession(sessionId) {
        const session = this.sessionManager.getSession(sessionId);
        if (!session) return;
        
        this.sessionManager.setCurrentSessionId(sessionId);
        this.uiManager.renderSessions();
        this.uiManager.loadSessionMessages(session);
        Utils.focusInput();
    }
    
    async sendMessage() {
        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) return;
        
        const success = await this.messageManager.sendMessage(content);
        
        if (success) {
            input.value = '';
            Utils.autoResizeTextarea(input);
            this.uiManager.updateSendButton();
            this.uiManager.renderSessions(); // Update session list with new title if needed
        }
    }
}

// Initialize application
const atlas = new Atlas();

// Expose globally for inline events
window.atlas = atlas;
