const SESSION_KEY = 'atlas_session';

/**
 * Starts a new session by storing user data in sessionStorage.
 * @param {object} userData - The user data to store.
 */
export function startSession(userData) {
    try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(userData));
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
        return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
        console.error('Error retrieving session:', error);
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
