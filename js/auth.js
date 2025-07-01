import { startSession } from './session.js';
import { showToast } from './showToast.js';
import { showChatInterface } from './ui.js';

/**
 * Creates a local session for the app
 */
export function createLocalSession() {
    const sessionData = {
        token: 'local_token_' + Date.now(),
        username: 'local_user',
        userId: 'local_' + Date.now()
    };
    
    startSession(sessionData);
    showToast('Session initialized!', 'success');
    showChatInterface();
}