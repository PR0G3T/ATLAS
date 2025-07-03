/**
 * Session State Manager
 * Handles session persistence and state management
 */
export class SessionStateManager {
    constructor() {
        this.sessions = [];
        this.currentSessionId = null;
        this.draftSession = null;
        this.init();
    }

    init() {
        this.loadSessionHistory();
    }

    createSession() {
        const sessionId = Date.now().toString();
        const session = {
            id: sessionId,
            title: 'New Session',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isDraft: true
        };

        this.draftSession = session;
        this.currentSessionId = sessionId;
        
        return session;
    }

    commitDraftSession() {
        if (!this.draftSession) return false;

        this.draftSession.isDraft = false;
        this.sessions.unshift(this.draftSession);
        this.draftSession = null;
        
        localStorage.setItem('atlas-current-session', this.currentSessionId);
        this.saveSessionHistory();
        
        return true;
    }

    getCurrentSession() {
        if (this.draftSession && this.draftSession.id === this.currentSessionId) {
            return this.draftSession;
        }
        return this.sessions.find(session => session.id === this.currentSessionId);
    }

    addMessageToSession(message) {
        const currentSession = this.getCurrentSession();
        if (currentSession) {
            currentSession.messages.push(message);
            currentSession.updatedAt = Date.now();
            
            // Update title if it's still "New Session"
            if (currentSession.title === 'New Session' && message.sender === 'user') {
                const title = message.content.length > 30 ? 
                    message.content.substring(0, 30) + '...' : 
                    message.content;
                currentSession.title = title;
            }
            
            return true;
        }
        return false;
    }

    deleteSession(sessionId) {
        const sessionIndex = this.sessions.findIndex(session => session.id === sessionId);
        if (sessionIndex === -1) return null;

        const session = this.sessions[sessionIndex];
        this.sessions.splice(sessionIndex, 1);

        // Return next session to switch to
        if (this.currentSessionId === sessionId) {
            this.currentSessionId = null;
            this.draftSession = null;
            
            if (this.sessions.length > 0) {
                return this.sessions[0];
            }
        }

        this.saveSessionHistory();
        return null;
    }

    getSessionList() {
        return this.sessions.filter(session => !session.isDraft);
    }

    switchToSession(sessionId) {
        // Discard draft if switching to different session
        if (this.draftSession && this.draftSession.id === this.currentSessionId && sessionId !== this.currentSessionId) {
            this.draftSession = null;
        }

        this.currentSessionId = sessionId;
        return this.getCurrentSession();
    }

    clearAllSessions() {
        this.sessions = [];
        this.currentSessionId = null;
        this.draftSession = null;
        this.saveSessionHistory();
    }

    saveSessionHistory() {
        const sessionsToSave = this.sessions.filter(session => !session.isDraft);
        localStorage.setItem('atlas-sessions', JSON.stringify(sessionsToSave));
        
        const currentSession = this.getCurrentSession();
        if (currentSession && !currentSession.isDraft) {
            localStorage.setItem('atlas-current-session', this.currentSessionId || '');
        }
    }

    loadSessionHistory() {
        const savedSessions = localStorage.getItem('atlas-sessions');
        const currentSessionId = localStorage.getItem('atlas-current-session');

        if (savedSessions) {
            this.sessions = JSON.parse(savedSessions);
        }

        if (currentSessionId && this.sessions.find(s => s.id === currentSessionId)) {
            this.currentSessionId = currentSessionId;
        }
    }
}
