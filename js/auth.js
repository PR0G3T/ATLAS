import { startSession } from './session.js';
import { showToast } from './showToast.js';
import { showChatInterface } from './ui.js';

/**
 * Secure token generation
 */
function generateSecureToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Creates a local session for the app
 */
export function createLocalSession() {
    const sessionData = {
        token: generateSecureToken(),
        username: 'local_user',
        userId: 'local_' + generateSecureToken().substring(0, 16),
        createdAt: Date.now(),
        lastActivity: Date.now()
    };
    
    try {
        startSession(sessionData);
        showToast('Session initialized!', 'success');
        showChatInterface();
    } catch (error) {
        console.error('Failed to create session:', error);
        showToast('Failed to initialize session', 'error');
    }
}

/**
 * Real authentication methods
 */
export async function authenticateUser(credentials) {
    throw new Error('Real authentication not implemented');
}

export function logout() {
    try {
        endSession();
        showToast('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
    }
}