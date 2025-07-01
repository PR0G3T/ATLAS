/**
 * ATLAS - Session Manager
 */

import { Utils } from './utils.js';

export class SessionManager {
    constructor() {
        this.sessions = this.loadSessions();
        this.currentSessionId = this.getCurrentSessionId();
    }
    
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
            Utils.showToast('Error saving sessions', 'error');
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
        
        Utils.showToast('New session created');
        return session;
    }
    
    getSession(sessionId) {
        return this.sessions.find(s => s.id === sessionId);
    }
    
    getCurrentSession() {
        return this.getSession(this.currentSessionId);
    }
    
    updateSessionTitle(sessionId, title) {
        const session = this.getSession(sessionId);
        if (session) {
            session.title = title;
            session.updatedAt = new Date().toISOString();
            this.saveSessions();
            return true;
        }
        return false;
    }
    
    addMessageToSession(content, role) {
        const session = this.getCurrentSession();
        if (!session) return false;
        
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
        return true;
    }
    
    deleteSession(sessionId) {
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
            this.sessions.splice(index, 1);
            this.saveSessions();
            
            if (this.currentSessionId === sessionId) {
                this.currentSessionId = null;
                sessionStorage.removeItem('atlas_current_session');
            }
            
            return true;
        }
        return false;
    }
}
