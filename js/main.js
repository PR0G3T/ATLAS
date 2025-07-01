import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';
import { getSession, isLoggedIn } from './session.js';
import { PROMPT_ENDPOINT } from './config.js';
import { toggleFormState, adjustTextareaHeight, resetPromptInput, showChatInterface, showLoginForm } from './ui.js';

let isWaiting = false;

const promptInput = document.getElementById('messageInput');
const form = document.getElementById('atlas-form');

if (promptInput) {
    promptInput.addEventListener('input', adjustTextareaHeight);
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePromptSubmit();
        }
    });
}

async function handlePromptSubmit(e) {
    if (e) e.preventDefault();
    if (isWaiting) {
        showToast('Please wait for a response before asking a new question.', 'error');
        return;
    }
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showToast('Please enter a question.', 'error');
        return;
    }

    const session = getSession();
    if (!session) {
        showToast('You must be logged in to ask a question.', 'error');
        return;
    }

    isWaiting = true;
    toggleFormState(true);
    addMessage(prompt, 'user');
    resetPromptInput();

    try {
        const response = await fetch(PROMPT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`
            },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
            throw new Error(errorData.message || 'Server error');
        }

        const data = await response.json();
        addMessage(data.response || 'No response.', 'ai');
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
    } finally {
        isWaiting = false;
        toggleFormState(false);
        promptInput.focus();
    }
}

if (form) {
    form.addEventListener('submit', handlePromptSubmit);
}

function initializeApp() {
    if (isLoggedIn()) {
        showChatInterface();
    } else {
        showLoginForm();
    }
}

initializeApp();