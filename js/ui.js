import { createNewSession, renderSessionHistory, loadSession } from './conversationHistory.js';

const promptInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');

export function toggleFormState(isWaiting) {
    if (promptInput) promptInput.disabled = isWaiting;
    if (sendButton) sendButton.disabled = isWaiting;
}

export function adjustTextareaHeight() {
    if (!promptInput) return;
    promptInput.style.height = 'auto';
    promptInput.style.height = (promptInput.scrollHeight) + 'px';
}

export function resetPromptInput() {
    if (promptInput) {
        promptInput.value = '';
        adjustTextareaHeight();
        promptInput.focus();
    }
}

/**
 * Shows the session interface
 */
export function showSessionInterface() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // FIX: Use safer DOM creation instead of innerHTML
    const sessionContainer = document.createElement('div');
    sessionContainer.className = 'session-container';
    
    const sessionMessages = document.createElement('div');
    sessionMessages.className = 'session-messages';
    sessionMessages.id = 'session-messages';
    // ADD: Accessibility attributes
    sessionMessages.setAttribute('role', 'log');
    sessionMessages.setAttribute('aria-live', 'polite');
    sessionMessages.setAttribute('aria-label', 'Session messages');
    
    const sessionInputArea = document.createElement('div');
    sessionInputArea.className = 'session-input-area';
    
    const form = document.createElement('form');
    form.id = 'atlas-form';
    form.setAttribute('autocomplete', 'off');
    
    const messageBox = document.createElement('div');
    messageBox.className = 'messageBox';
    
    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Message...';
    textarea.id = 'messageInput';
    textarea.name = 'prompt';
    textarea.rows = 1;
    textarea.setAttribute('aria-label', 'Enter your message');
    textarea.setAttribute('maxlength', '4000'); // ADD: Character limit
    
    const sendButton = document.createElement('button');
    sendButton.id = 'sendButton';
    sendButton.type = 'submit';
    sendButton.setAttribute('aria-label', 'Send message');
    
    // Assemble the DOM structure
    messageBox.appendChild(textarea);
    messageBox.appendChild(sendButton);
    
    form.appendChild(messageBox);
    sessionInputArea.appendChild(form);
    
    sessionContainer.appendChild(sessionMessages);
    sessionContainer.appendChild(sessionInputArea);
    
    // Clear and append
    mainContent.innerHTML = '';
    mainContent.appendChild(sessionContainer);

    setupSessionHandlers();
    renderSessionHistory();
}

/**
 * Starts a new session by clearing messages
 */
export function startNewSession() {
    // Create new session
    const session = createNewSession();
    
    const sessionMessages = document.getElementById('session-messages');
    if (sessionMessages) {
        sessionMessages.innerHTML = '';
    }
    
    const promptInput = document.getElementById('messageInput');
    if (promptInput) {
        promptInput.value = '';
        adjustTextareaHeight();
        promptInput.focus();
    }
    
    // Force render session history
    setTimeout(() => {
        renderSessionHistory();
    }, 100);
}

/**
 * Sets up session interface event handlers
 */
function setupSessionHandlers() {
    const promptInput = document.getElementById('messageInput');
    const form = document.getElementById('atlas-form');

    if (promptInput) {
        // ADD: Debounced input handling
        let adjustHeightTimeout;
        promptInput.addEventListener('input', () => {
            clearTimeout(adjustHeightTimeout);
            adjustHeightTimeout = setTimeout(adjustTextareaHeight, 10);
        });
        
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
            }
        });
        
        // ADD: Character counter
        promptInput.addEventListener('input', () => {
            const length = promptInput.value.length;
            const maxLength = 4000;
            if (length > maxLength * 0.9) {
                // Show warning when approaching limit
                console.warn(`Approaching character limit: ${length}/${maxLength}`);
            }
        });
        
        promptInput.focus();
    }

    // ADD: Debounced session switching
    let sessionSwitchTimeout = null;
    
    function debouncedLoadSession(sessionId) {
        if (sessionSwitchTimeout) {
            clearTimeout(sessionSwitchTimeout);
        }
        
        sessionSwitchTimeout = setTimeout(() => {
            loadSession(sessionId);
        }, 100); // 100ms debounce
    }

    // Setup new session button handler with proper event delegation
    document.addEventListener('click', (e) => {
        // Handle new session button clicks
        if (e.target.closest('.new-session-btn')) {
            e.preventDefault();
            e.stopPropagation();
            startNewSession();
            return;
        }
        
        // Handle session item clicks with debouncing
        const sessionItem = e.target.closest('.session-item');
        if (sessionItem) {
            e.preventDefault();
            e.stopPropagation();
            const sessionId = sessionItem.dataset.sessionId;
            if (sessionId) {
                debouncedLoadSession(sessionId);
            }
        }
    });
}

// Export legacy names for backward compatibility
export const showChatInterface = showSessionInterface;
export const startNewChat = startNewSession;