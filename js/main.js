import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';
import { getSession, isLoggedIn, endSession, isSessionValid, refreshSession, clearExampleSessions } from './session.js';
import { PROMPT_ENDPOINT } from './config.js';
import { toggleFormState, adjustTextareaHeight, resetPromptInput, showChatInterface, startNewChat } from './ui.js';
import { createLocalSession } from './auth.js';
import { createNewConversation, getCurrentConversationId, getConversations, renderConversationHistory } from './conversationHistory.js';

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
    // ADD: Input validation and sanitization
    if (!prompt || prompt.length > 4000) {
        showToast('Please enter a valid question (max 4000 characters).', 'error');
        return;
    }
    
    // ADD: Sanitize input to prevent XSS
    const sanitizedPrompt = prompt.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    const session = getSession();
    if (!session || !isSessionValid()) {
        // Create new local session if none exists
        createLocalSession();
        const newSession = getSession();
        if (!newSession) {
            showToast('Failed to create session.', 'error');
            return;
        }
    }

    // Ensure we have a conversation to save messages to
    let conversationId = getCurrentConversationId();
    if (!conversationId) {
        const conversation = createNewConversation();
        conversationId = conversation.id;
    }

    isWaiting = true;
    toggleFormState(true);
    addMessage(sanitizedPrompt, 'user'); // Use sanitized input
    resetPromptInput();

    // ADD: Request timeout and abort controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
        const currentSession = getSession();
        const response = await fetch(PROMPT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentSession.token}`
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
        refreshSession();
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

// Remove duplicate event listener setup
let eventListenersAttached = false;

function initializeApp() {
    console.log('Initializing app...');
    
    // Clear any example sessions first
    clearExampleSessions();
    
    // Always show chat interface, create session if needed
    if (!isLoggedIn() || !isSessionValid()) {
        console.log('Creating new local session...');
        createLocalSession();
    } else {
        console.log('Using existing session');
        showChatInterface();
    }
    
    // Create initial conversation if none exists OR if no current conversation is set
    let conversationId = getCurrentConversationId();
    const conversations = getConversations();
    
    console.log('Current conversation ID:', conversationId);
    console.log('Available conversations:', conversations.length);
    
    if (!conversationId || conversations.length === 0) {
        console.log('Creating initial conversation...');
        const newConversation = createNewConversation();
        conversationId = newConversation.id;
    }
    
    // Force render conversation history
    setTimeout(() => {
        renderConversationHistory();
    }, 200);
    
    // Attach event listeners only once
    if (!eventListenersAttached) {
        console.log('Attaching event listeners...');
        
        // Form submission handler
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'atlas-form') {
                handlePromptSubmit(e);
            }
        });
        
        eventListenersAttached = true;
        console.log('Event listeners attached');
    }
}

// Remove the duplicate new chat button handler that was causing issues

initializeApp();