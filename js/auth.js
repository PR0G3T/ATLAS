import { showToast } from './showToast.js';
import { showChatInterface } from './ui.js';

/**
 * Shows the chat interface without requiring authentication
 */
export function initializeApp() {
    try {
        showToast('Welcome to ATLAS!', 'success');
        showChatInterface();
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
        // Clear conversation history if needed
        localStorage.removeItem('atlas_conversations');
        localStorage.removeItem('atlas_current_conversation');
        // Reload the page to reset state
        window.location.reload();
    } catch (error) {
        console.error('Logout error:', error);
    }
}