import { showToast } from './showToast.js';
import { showSessionInterface } from './ui.js';

/**
 * Shows the session interface without requiring authentication
 */
export function initializeApp() {
    try {
        showToast('Welcome to ATLAS!', 'success');
        showSessionInterface();
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to initialize application', 'error');
    }
}

/**
 * Real authentication methods (placeholder for future implementation)
 */
export async function authenticateUser(credentials) {
    throw new Error('Real authentication not implemented');
}

export function logout() {
    try {
        showToast('Goodbye!', 'success');
        // Clear session history if needed
        localStorage.removeItem('atlas_sessions');
        localStorage.removeItem('atlas_current_session');
        // Reload the page to reset state
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}