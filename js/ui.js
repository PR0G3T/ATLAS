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
    
    // Force render session history immediately
    renderSessionHistory();
}

/**
 * Sets up session interface event handlers with optimized debouncing
 */
function setupSessionHandlers() {
    const promptInput = document.getElementById('messageInput');
    const form = document.getElementById('atlas-form');

    if (promptInput) {
        // Optimized input handling with RAF
        let adjustHeightFrame;
        promptInput.addEventListener('input', () => {
            if (adjustHeightFrame) {
                cancelAnimationFrame(adjustHeightFrame);
            }
            adjustHeightFrame = requestAnimationFrame(adjustTextareaHeight);
        });
        
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (form) {
                    form.dispatchEvent(new Event('submit', { bubbles: true }));
                }
            }
        });
        
        // Optimized character counter
        let characterCountFrame;
        promptInput.addEventListener('input', () => {
            if (characterCountFrame) {
                cancelAnimationFrame(characterCountFrame);
            }
            characterCountFrame = requestAnimationFrame(() => {
                const length = promptInput.value.length;
                const maxLength = 4000;
                if (length > maxLength * 0.9) {
                    console.warn(`Approaching character limit: ${length}/${maxLength}`);
                }
            });
        });
        
        promptInput.focus();
    }

    // Improved session switching with loading feedback
    let sessionSwitchTimeout = null;
    
    function debouncedLoadSession(sessionId) {
        if (sessionSwitchTimeout) {
            clearTimeout(sessionSwitchTimeout);
        }
        
        // Show immediate feedback
        const sessionItem = document.querySelector(`[data-session-id="${sessionId}"]`);
        if (sessionItem) {
            sessionItem.classList.add('loading');
        }
        
        sessionSwitchTimeout = setTimeout(() => {
            loadSession(sessionId);
            // Remove loading state after a short delay
            setTimeout(() => {
                if (sessionItem) {
                    sessionItem.classList.remove('loading');
                }
            }, 200);
        }, 50); // Reduced debounce for faster response
    }

    // Optimized event delegation with passive listeners
    document.addEventListener('click', (e) => {
        if (e.target.closest('.new-session-btn')) {
            e.preventDefault();
            e.stopPropagation();
            startNewSession();
            return;
        }
        
        const sessionItem = e.target.closest('.session-item');
        if (sessionItem) {
            e.preventDefault();
            e.stopPropagation();
            const sessionId = sessionItem.dataset.sessionId;
            if (sessionId) {
                debouncedLoadSession(sessionId);
            }
        }
    }, { passive: false });
}

// Export legacy names for backward compatibility
export const showChatInterface = showSessionInterface;
export const startNewChat = startNewSession;