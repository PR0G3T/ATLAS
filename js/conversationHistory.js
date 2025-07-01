const SESSIONS_KEY = 'atlas_sessions';
const CURRENT_SESSION_KEY = 'atlas_current_session';

const MAX_SESSIONS = 100; // Limit to prevent storage bloat
const MAX_MESSAGES_PER_SESSION = 1000;

// ADD: Loading state management
let isLoadingSession = false;
let loadingTimeout = null;

/**
 * Gets all sessions from localStorage
 */
export function getSessions() {
    try {
        const sessions = localStorage.getItem(SESSIONS_KEY);
        const parsed = sessions ? JSON.parse(sessions) : [];
        
        // Validate session structure
        return parsed.filter(session => 
            session && 
            typeof session === 'object' && 
            session.id && 
            Array.isArray(session.messages)
        );
    } catch (error) {
        console.error('Error getting sessions:', error);
        // Recovery mechanism
        try {
            localStorage.removeItem(SESSIONS_KEY);
            console.log('Cleared corrupted session data');
        } catch (e) {
            console.error('Failed to clear corrupted data:', e);
        }
        return [];
    }
}

/**
 * Saves sessions to localStorage
 */
function saveSessions(sessions) {
    try {
        // Validate and limit sessions
        const validSessions = sessions
            .filter(session => session && typeof session === 'object' && session.id)
            .slice(0, MAX_SESSIONS);
            
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(validSessions));
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            // Handle storage quota exceeded
            console.warn('Storage quota exceeded, removing old sessions');
            try {
                const reducedSessions = sessions.slice(0, Math.floor(MAX_SESSIONS / 2));
                localStorage.setItem(SESSIONS_KEY, JSON.stringify(reducedSessions));
            } catch (e) {
                console.error('Failed to save even reduced sessions:', e);
            }
        } else {
            console.error('Error saving sessions:', error);
        }
    }
}

/**
 * Creates a new session
 */
export function createNewSession() {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    const session = {
        id: sessionId,
        title: 'New Session',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    };
    
    const sessions = getSessions();
    sessions.unshift(session);
    saveSessions(sessions);
    setCurrentSession(sessionId);
    
    // Force immediate render with a small delay to ensure DOM is ready
    setTimeout(() => {
        renderSessionHistory();
    }, 50);
    
    return session;
}

/**
 * Updates a session with new message
 */
export function updateSession(sessionId, message) {
    // Input validation
    if (!sessionId || !message || typeof message !== 'object') {
        console.error('Invalid session update parameters');
        return;
    }
    
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (session) {
        // Limit messages per session
        if (session.messages.length >= MAX_MESSAGES_PER_SESSION) {
            session.messages = session.messages.slice(-MAX_MESSAGES_PER_SESSION + 1);
        }
        
        session.messages.push({
            ...message,
            id: Date.now() + Math.random(), // Unique message ID
            timestamp: message.timestamp || Date.now()
        });
        
        session.updatedAt = Date.now();
        
        if (session.title === 'New Session' && message.sender === 'user') {
            // Better title generation
            const cleanText = message.text.replace(/[^\w\s]/gi, '').trim();
            session.title = cleanText.substring(0, 50) + (cleanText.length > 50 ? '...' : '');
        }
        
        saveSessions(sessions);
        renderSessionHistory();
    }
}

/**
 * Gets the current session ID
 */
export function getCurrentSessionId() {
    return sessionStorage.getItem(CURRENT_SESSION_KEY);
}

/**
 * Sets the current session ID
 */
export function setCurrentSession(sessionId) {
    sessionStorage.setItem(CURRENT_SESSION_KEY, sessionId);
}

/**
 * Gets the current session
 */
export function getCurrentSession() {
    const sessionId = getCurrentSessionId();
    if (!sessionId) return null;
    
    const sessions = getSessions();
    return sessions.find(s => s.id === sessionId) || null;
}

/**
 * Loads a session by ID
 */
export function loadSession(sessionId) {
    // Prevent rapid switching
    if (isLoadingSession) {
        console.log('Already loading a session, ignoring request');
        return;
    }
    
    // Clear any pending loading timeout
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
    }
    
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    
    if (!session) {
        console.warn('Session not found:', sessionId);
        return;
    }
    
    // Set loading state
    isLoadingSession = true;
    setCurrentSession(sessionId);
    
    // Clear current messages with proper cleanup
    const sessionMessages = document.getElementById('session-messages');
    if (sessionMessages) {
        // Use more efficient cleanup
        sessionMessages.textContent = '';
    }
    
    // Load messages with debouncing and proper async handling
    loadingTimeout = setTimeout(async () => {
        try {
            if (session.messages && session.messages.length > 0) {
                const { addMessage } = await import('./addMessage.js');
                
                // Add messages sequentially with proper cleanup flag
                for (let i = 0; i < session.messages.length; i++) {
                    const message = session.messages[i];
                    // Only add to DOM, don't save to session again
                    addMessage(message.text, message.sender, false);
                    
                    // Small delay to prevent UI blocking on large sessions
                    if (i % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            }
            
            renderSessionHistory();
        } catch (error) {
            console.error('Error loading session messages:', error);
        } finally {
            isLoadingSession = false;
            loadingTimeout = null;
        }
    }, 50); // Debounce delay
}

/**
 * Renders the session history in the sidebar
 */
export function renderSessionHistory() {
    const sessionHistory = document.querySelector('.session-history');
    if (!sessionHistory) {
        console.warn('Session history element not found');
        return;
    }
    
    const sessions = getSessions();
    const currentSessionId = getCurrentSessionId();
    
    if (sessions.length === 0) {
        sessionHistory.innerHTML = '<div class="no-sessions">No sessions yet</div>';
        return;
    }
    
    const sessionHTML = sessions.map(session => {
        const isActive = session.id === currentSessionId;
        
        return `
            <a href="#" class="session-item ${isActive ? 'active' : ''}" 
               data-session-id="${session.id}"
               title="${session.title}">
                ${session.title}
            </a>
        `;
    }).join('');
    
    sessionHistory.innerHTML = sessionHTML;
}

/**
 * Deletes a session
 */
export function deleteSession(sessionId) {
    const sessions = getSessions();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(updatedSessions);
    
    // If this was the current session, clear it
    if (getCurrentSessionId() === sessionId) {
        sessionStorage.removeItem(CURRENT_SESSION_KEY);
    }
    
    renderSessionHistory();
}

// Export legacy names for backward compatibility
export const getConversations = getSessions;
export const createNewConversation = createNewSession;
export const updateConversation = updateSession;
export const getCurrentConversationId = getCurrentSessionId;
export const setCurrentConversation = setCurrentSession;
export const getCurrentConversation = getCurrentSession;
export const loadConversation = loadSession;
export const renderConversationHistory = renderSessionHistory;
export const deleteConversation = deleteSession;
/**
 * Deletes a conversation
 */
export function deleteConversation(conversationId) {
    const conversations = getConversations();
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    saveConversations(updatedConversations);
    
    // If this was the current conversation, clear it
    if (getCurrentConversationId() === conversationId) {
        sessionStorage.removeItem(CURRENT_CONVERSATION_KEY);
    }
    
    renderConversationHistory();
}
