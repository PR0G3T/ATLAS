const SESSIONS_KEY = 'atlas_sessions';
const CURRENT_SESSION_KEY = 'atlas_current_session';

const MAX_SESSIONS = 100;
const MAX_MESSAGES_PER_SESSION = 1000;
const BATCH_SIZE = 5; // Load messages in batches
const SESSION_CACHE_SIZE = 10; // Cache last 10 loaded sessions

// ADD: Session caching and performance optimization
let sessionCache = new Map();
let isLoadingSession = false;
let loadingTimeout = null;
let currentAbortController = null;

/**
 * Gets all sessions from localStorage with caching
 */
export function getSessions() {
    const cacheKey = 'sessions_list';
    if (sessionCache.has(cacheKey)) {
        return sessionCache.get(cacheKey);
    }

    try {
        const sessions = localStorage.getItem(SESSIONS_KEY);
        const parsed = sessions ? JSON.parse(sessions) : [];
        
        const validSessions = parsed.filter(session => 
            session && 
            typeof session === 'object' && 
            session.id && 
            Array.isArray(session.messages)
        );

        // Cache the result
        sessionCache.set(cacheKey, validSessions);
        return validSessions;
    } catch (error) {
        console.error('Error getting sessions:', error);
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
 * Saves sessions to localStorage with cache invalidation
 */
function saveSessions(sessions) {
    try {
        const validSessions = sessions
            .filter(session => session && typeof session === 'object' && session.id)
            .slice(0, MAX_SESSIONS);
            
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(validSessions));
        
        // Invalidate cache
        sessionCache.delete('sessions_list');
        
        // Clean cache if it gets too large
        if (sessionCache.size > SESSION_CACHE_SIZE) {
            const keys = Array.from(sessionCache.keys());
            keys.slice(0, keys.length - SESSION_CACHE_SIZE).forEach(key => {
                sessionCache.delete(key);
            });
        }
    } catch (error) {
        if (error.name === 'QuotaExceededError') {
            console.warn('Storage quota exceeded, removing old sessions');
            try {
                const reducedSessions = sessions.slice(0, Math.floor(MAX_SESSIONS / 2));
                localStorage.setItem(SESSIONS_KEY, JSON.stringify(reducedSessions));
                sessionCache.clear(); // Clear all cache on quota error
            } catch (e) {
                console.error('Failed to save even reduced sessions:', e);
            }
        } else {
            console.error('Error saving sessions:', error);
        }
    }
}

/**
 * Creates a new session with optimized rendering
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
    
    // Cache the new session
    sessionCache.set(sessionId, session);
    
    // Immediate render without delay
    requestAnimationFrame(() => {
        renderSessionHistory();
    });
    
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
 * Gets the current session with caching
 */
export function getCurrentSession() {
    const sessionId = getCurrentSessionId();
    if (!sessionId) return null;
    
    // Check cache first
    if (sessionCache.has(sessionId)) {
        return sessionCache.get(sessionId);
    }
    
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId) || null;
    
    // Cache the session if found
    if (session) {
        sessionCache.set(sessionId, session);
    }
    
    return session;
}

/**
 * Loads a session by ID
 */
export function loadSession(sessionId) {
    // Prevent rapid switching and abort previous loading
    if (isLoadingSession) {
        if (currentAbortController) {
            currentAbortController.abort();
        }
        console.log('Aborting previous session load');
    }
    
    // Clear any pending loading timeout
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
    }
    
    const session = getCurrentSession() || getSessions().find(s => s.id === sessionId);
    
    if (!session) {
        console.warn('Session not found:', sessionId);
        return;
    }
    
    // Set loading state
    isLoadingSession = true;
    currentAbortController = new AbortController();
    setCurrentSession(sessionId);
    
    // Show loading indicator
    const sessionMessages = document.getElementById('session-messages');
    if (sessionMessages) {
        sessionMessages.innerHTML = '<div class="loading-messages">Loading messages...</div>';
    }
    
    // Progressive message loading
    loadingTimeout = setTimeout(async () => {
        try {
            await loadMessagesProgressively(session, currentAbortController.signal);
            renderSessionHistory();
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error loading session messages:', error);
                if (sessionMessages) {
                    sessionMessages.innerHTML = '<div class="error-messages">Error loading messages</div>';
                }
            }
        } finally {
            isLoadingSession = false;
            currentAbortController = null;
            loadingTimeout = null;
        }
    }, 10); // Minimal delay for UI responsiveness
}

/**
 * Load messages progressively in batches
 */
async function loadMessagesProgressively(session, signal) {
    const sessionMessages = document.getElementById('session-messages');
    if (!sessionMessages) return;
    
    // Clear loading indicator
    sessionMessages.innerHTML = '';
    
    if (!session.messages || session.messages.length === 0) {
        return;
    }
    
    const { addMessage } = await import('./addMessage.js');
    const messages = session.messages;
    
    // Load messages in batches for better performance
    for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        // Check if operation was aborted
        if (signal.aborted) {
            throw new Error('AbortError');
        }
        
        const batch = messages.slice(i, i + BATCH_SIZE);
        
        // Use document fragment for efficient DOM manipulation
        const fragment = document.createDocumentFragment();
        
        batch.forEach(message => {
            addMessage(message.text, message.sender, false);
        });
        
        // Yield control to browser every batch
        if (i % (BATCH_SIZE * 2) === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    // Scroll to bottom after all messages are loaded
    requestAnimationFrame(() => {
        sessionMessages.scrollTop = sessionMessages.scrollHeight;
    });
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
    
    // Use DocumentFragment for efficient DOM updates
    const fragment = document.createDocumentFragment();
    
    // Limit visible sessions for performance (implement virtual scrolling for large lists)
    const visibleSessions = sessions.slice(0, 50); // Show first 50 sessions
    
    visibleSessions.forEach(session => {
        const isActive = session.id === currentSessionId;
        
        const sessionElement = document.createElement('a');
        sessionElement.href = '#';
        sessionElement.className = `session-item ${isActive ? 'active' : ''}`;
        sessionElement.dataset.sessionId = session.id;
        sessionElement.title = session.title;
        sessionElement.textContent = session.title;
        
        fragment.appendChild(sessionElement);
    });
    
    // If there are more sessions, add a "load more" indicator
    if (sessions.length > 50) {
        const loadMoreElement = document.createElement('div');
        loadMoreElement.className = 'load-more-sessions';
        loadMoreElement.textContent = `... and ${sessions.length - 50} more sessions`;
        fragment.appendChild(loadMoreElement);
    }
    
    // Single DOM update
    sessionHistory.innerHTML = '';
    sessionHistory.appendChild(fragment);
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