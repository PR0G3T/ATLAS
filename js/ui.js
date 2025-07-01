import { endSession } from './session.js';
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
    
    // ADD: File upload wrapper with proper accessibility
    const fileWrapper = document.createElement('div');
    fileWrapper.className = 'fileUploadWrapper';
    
    const fileLabel = document.createElement('label');
    fileLabel.setAttribute('for', 'file');
    fileLabel.setAttribute('aria-label', 'Upload image file');
    
    // ADD: SVG creation (safer than innerHTML)
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 337 337');
    svg.setAttribute('fill', 'none');
    // ... create SVG elements programmatically ...
    
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = 'Add an image';
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'file';
    fileInput.name = 'file';
    fileInput.accept = 'image/*'; // ADD: Restrict to images
    
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
    fileLabel.appendChild(svg);
    fileLabel.appendChild(tooltip);
    fileWrapper.appendChild(fileLabel);
    fileWrapper.appendChild(fileInput);
    
    messageBox.appendChild(fileWrapper);
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
    console.log('Starting new chat...');
    
    // End current session and start fresh
    endSession();
    
    // Create new conversation FIRST
    const conversation = createNewConversation();
    console.log('Created new conversation:', conversation.id);
    
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
    
    // Create new session for the new chat
    import('./auth.js').then(({ createLocalSession }) => {
        createLocalSession();
        // Force render conversation history after session is created
        setTimeout(() => {
            renderConversationHistory();
        }, 100);
    });
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

    // Remove existing handlers to prevent duplicates - IMPROVED
    const existingNewChatBtns = document.querySelectorAll('.new-chat-btn[data-listener="true"]');
    existingNewChatBtns.forEach(btn => {
        btn.replaceWith(btn.cloneNode(true));
    });

    // Setup new chat button handler - IMPROVED
    const newChatBtn = document.querySelector('.new-chat-btn');
    if (newChatBtn && !newChatBtn.dataset.listener) {
        newChatBtn.dataset.listener = 'true';
        newChatBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('New chat button clicked');
            startNewChat();
        });
    }

    // Setup conversation item click handlers
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('conversation-item')) {
            e.preventDefault();
            const conversationId = e.target.dataset.conversationId;
            if (conversationId) {
                console.log('Loading conversation:', conversationId);
                loadConversation(conversationId);
            }
        }
    });
}