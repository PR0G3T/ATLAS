const SESSION_KEY = 'atlas_session';

/**
 * Starts a new session by storing user data in sessionStorage.
 * @param {object} userData - The user data to store.
 */
export function startSession(userData) {
    try {
        // Add timestamp for session validation
        const sessionData = {
            ...userData,
            timestamp: Date.now()
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
        console.error('Error starting session:', error);
    }
}

/**
 * Ends the current session by removing user data from sessionStorage.
 */
export function endSession() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error('Error ending session:', error);
    }
}

/**
 * Retrieves the current session data from sessionStorage.
 * @returns {object|null} The user data object or null if no session exists.
 */
export function getSession() {
    try {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (!sessionData) return null;
        
        const session = JSON.parse(sessionData);
        
        // Validate session (check if it's not corrupted)
        if (!session.token || !session.timestamp) {
            endSession();
            return null;
        }
        
        // Optional: Check if session is too old (24 hours)
        const sessionAge = Date.now() - session.timestamp;
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        if (sessionAge > maxAge) {
            endSession();
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Error retrieving session:', error);
        // Clean corrupted session
        endSession();
        return null;
    }
}

/**
 * Retrieves the token from the current session.
 * @returns {string|null} The token or null if no session exists.
 */
export function getSessionToken() {
    const session = getSession();
    return session ? session.token : null;
}

/**
 * Checks if a user is currently logged in.
 * @returns {boolean} True if a session exists, false otherwise.
 */
export function isLoggedIn() {
    return !!getSession();
}

/**
 * Validates if the current session is still valid.
 * @returns {boolean} True if session is valid, false otherwise.
 */
export function isSessionValid() {
    const session = getSession();
    return session && session.token && session.timestamp;
}

/**
 * Updates the session timestamp to keep it active.
 */
export function refreshSession() {
    const session = getSession();
    if (session) {
        session.timestamp = Date.now();
        try {
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        } catch (error) {
            console.error('Error refreshing session:', error);
        }
    }
}

/**
 * Clears any example or test sessions from storage.
 */
export function clearExampleSessions() {
    try {
        const sessionData = sessionStorage.getItem(SESSION_KEY);
        if (sessionData) {
            const session = JSON.parse(sessionData);
            // Check if this looks like example data
            if (isExampleSession(session)) {
                sessionStorage.removeItem(SESSION_KEY);
                console.log('Removed example session data');
            }
        }
    } catch (error) {
        console.error('Error clearing example sessions:', error);
        // If there's any error parsing, just clear it
        sessionStorage.removeItem(SESSION_KEY);
    }
}

/**
 * Checks if a session appears to be example/test data.
 * @param {object} session - The session object to check.
 * @returns {boolean} True if this appears to be example data.
 */
function isExampleSession(session) {
    if (!session || typeof session !== 'object') return false;
    
    // Check for common example indicators
    const exampleIndicators = [
        'example', 'test', 'demo', 'sample', 'fake',
        'placeholder', 'mock', 'temp', 'temporary'
    ];
    
    const sessionString = JSON.stringify(session).toLowerCase();
    return exampleIndicators.some(indicator => sessionString.includes(indicator));
}
