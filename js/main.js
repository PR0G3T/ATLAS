import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';
import { getSession, isLoggedIn, endSession, isSessionValid, refreshSession, clearExampleSessions } from './session.js';
import { PROMPT_ENDPOINT } from './config.js';
import { toggleFormState, adjustTextareaHeight, resetPromptInput, showChatInterface, startNewChat } from './ui.js';
import { createLocalSession } from './auth.js';
import { createNewConversation, getCurrentConversationId } from './conversationHistory.js';

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
    if (!prompt) {
        showToast('Please enter a question.', 'error');
        return;
    }

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
    addMessage(prompt, 'user');
    resetPromptInput();

    try {
        const currentSession = getSession();
        const response = await fetch(PROMPT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentSession.token}`
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || 'Server error');
        }

        const data = await response.json();
        addMessage(data.response || 'No response.', 'ai');
        
        // Refresh session on successful request
        refreshSession();
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        isWaiting = false;
        toggleFormState(false);
        promptInput.focus();
    }
}

// Add global event delegation for form submission
document.addEventListener('submit', (e) => {
    if (e.target.id === 'atlas-form') {
        handlePromptSubmit(e);
    }
});

// Add global event delegation for new chat button with better targeting
document.addEventListener('click', (e) => {
    // Check if clicked element or its parent is the new chat button
    const newChatBtn = e.target.closest('.new-chat-btn');
    if (newChatBtn) {
        e.preventDefault();
        e.stopPropagation();
        startNewChat();
    }
});

function initializeApp() {
    // Clear any example sessions first
    clearExampleSessions();
    
    // Always show chat interface, create session if needed
    if (!isLoggedIn() || !isSessionValid()) {
        createLocalSession();
    } else {
        showChatInterface();
    }
    
    // Create initial conversation if none exists
    if (!getCurrentConversationId()) {
        createNewConversation();
    }
}

initializeApp();