import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';
import { PROMPT_ENDPOINT } from './config.js';
import { toggleFormState, adjustTextareaHeight, resetPromptInput, showSessionInterface, startNewSession } from './ui.js';
import { createNewSession, getCurrentSessionId, getSessions, renderSessionHistory } from './conversationHistory.js';

let isWaiting = false;

async function handlePromptSubmit(e) {
    if (e) e.preventDefault();
    if (isWaiting) {
        showToast('Please wait for a response before asking a new question.', 'error');
        return;
    }
    
    const promptInput = document.getElementById('messageInput');
    if (!promptInput) return;
    
    const prompt = promptInput.value.trim();
    // 
    if (!prompt || prompt.length > 4000) {
        showToast('Please enter a valid question (max 4000 characters).', 'error');
        return;
    }
    
    // ADD: Sanitize input to prevent XSS
    const sanitizedPrompt = prompt.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Ensure we have a session to save messages to
    let sessionId = getCurrentSessionId();
    if (!sessionId) {
        const session = createNewSession();
        sessionId = session.id;
    }

    isWaiting = true;
    toggleFormState(true);
    addMessage(sanitizedPrompt, 'user');
    resetPromptInput();

    // ADD: Request timeout and abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        const response = await fetch(PROMPT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: sanitizedPrompt }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || 'Server error');
        }

        const data = await response.json();
        // ADD: Validate response data
        if (!data || typeof data.response !== 'string') {
            throw new Error('Invalid response format');
        }
        
        addMessage(data.response || 'No response.', 'ai');
    } catch (err) {
        if (err.name === 'AbortError') {
            showToast('Request timed out. Please try again.', 'error');
        } else {
            showToast(`Error: ${err.message}`, 'error');
        }
    } finally {
        clearTimeout(timeoutId);
        isWaiting = false;
        toggleFormState(false);
        promptInput?.focus();
    }
}

let eventListenersAttached = false;

function initializeApp() {
    // Always show session interface
    showSessionInterface();
    
    // Create initial session if none exists OR if no current session is set
    let sessionId = getCurrentSessionId();
    const sessions = getSessions();
    
    if (!sessionId || sessions.length === 0) {
        console.log('Creating new session...');
        const newSession = createNewSession();
        sessionId = newSession.id;
        console.log('New session created:', sessionId);
    }
    
    // Force render session history immediately
    renderSessionHistory();
    
    // Attach event listeners only once
    if (!eventListenersAttached) {
        // Form submission handler
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'atlas-form') {
                handlePromptSubmit(e);
            }
        });
        
        eventListenersAttached = true;
    }
}

initializeApp();