import { createNewConversation, renderConversationHistory, loadConversation } from './conversationHistory.js';

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
 * Shows the chat interface
 */
export function showChatInterface() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    // FIX: Use safer DOM creation instead of innerHTML
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-container';
    
    const chatMessages = document.createElement('div');
    chatMessages.className = 'chat-messages';
    chatMessages.id = 'chat-messages';
    // ADD: Accessibility attributes
    chatMessages.setAttribute('role', 'log');
    chatMessages.setAttribute('aria-live', 'polite');
    chatMessages.setAttribute('aria-label', 'Chat messages');
    
    const chatInputArea = document.createElement('div');
    chatInputArea.className = 'chat-input-area';
    
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
    chatInputArea.appendChild(form);
    
    chatContainer.appendChild(chatMessages);
    chatContainer.appendChild(chatInputArea);
    
    // Clear and append
    mainContent.innerHTML = '';
    mainContent.appendChild(chatContainer);

    setupChatHandlers();
    renderConversationHistory();
}

/**
 * Starts a new chat by clearing messages
 */
export function startNewChat() {
    // Create new conversation
    const conversation = createNewConversation();
    
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    const promptInput = document.getElementById('messageInput');
    if (promptInput) {
        promptInput.value = '';
        adjustTextareaHeight();
        promptInput.focus();
    }
    
    // Force render conversation history
    setTimeout(() => {
        renderConversationHistory();
    }, 100);
}

/**
 * Sets up chat interface event handlers
 */
function setupChatHandlers() {
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

    // ADD: Debounced conversation switching
    let conversationSwitchTimeout = null;
    
    function debouncedLoadConversation(conversationId) {
        if (conversationSwitchTimeout) {
            clearTimeout(conversationSwitchTimeout);
        }
        
        conversationSwitchTimeout = setTimeout(() => {
            loadConversation(conversationId);
        }, 100); // 100ms debounce
    }

    // Setup new chat button handler with proper event delegation
    document.addEventListener('click', (e) => {
        // Handle new chat button clicks
        if (e.target.closest('.new-chat-btn')) {
            e.preventDefault();
            e.stopPropagation();
            startNewChat();
            return;
        }
        
        // Handle conversation item clicks with debouncing
        const conversationItem = e.target.closest('.conversation-item');
        if (conversationItem) {
            e.preventDefault();
            e.stopPropagation();
            const conversationId = conversationItem.dataset.conversationId;
            if (conversationId) {
                debouncedLoadConversation(conversationId);
            }
        }
    });
}