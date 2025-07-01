import { endSession } from './session.js';

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

    mainContent.innerHTML = `
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
                <!-- Messages will be added here by JavaScript -->
            </div>
            <div class="chat-input-area">
                <form id="atlas-form" autocomplete="off">
                    <div class="messageBox">
                        <div class="fileUploadWrapper">
                            <label for="file">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 337 337">
                                    <circle stroke-width="20" stroke="#6c6c6c" fill="none" r="158.5" cy="168.5" cx="168.5"></circle>
                                    <path stroke-linecap="round" stroke-width="25" stroke="#6c6c6c" d="M167.759 79V259"></path>
                                    <path stroke-linecap="round" stroke-width="25" stroke="#6c6c6c" d="M79 167.138H259"></path>
                                </svg>
                                <span class="tooltip">Add an image</span>
                            </label>
                            <input type="file" id="file" name="file" />
                        </div>
                        <textarea placeholder="Message..." id="messageInput" name="prompt" rows="1"></textarea>
                        <button id="sendButton" type="submit">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 664 663">
                            <path fill="none" d="M646.293 331.888L17.7538 17.6187L155.245 331.888M646.293 331.888L17.753 646.157L155.245 331.888M646.293 331.888L318.735 330.228L155.245 331.888"></path>
                            <path stroke-linejoin="round" stroke-linecap="round" stroke-width="33.67" stroke="#6c6c6c" d="M646.293 331.888L17.7538 17.6187L155.245 331.888M646.293 331.888L17.753 646.157L155.245 331.888M646.293 331.888L318.735 330.228L155.245 331.888"></path>
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Re-initialize form handlers
    setupChatHandlers();
}

/**
 * Sets up chat interface event handlers
 */
function setupChatHandlers() {
    const promptInput = document.getElementById('messageInput');
    const form = document.getElementById('atlas-form');
    const newChatBtn = document.querySelector('.new-chat-btn');

    if (promptInput) {
        promptInput.addEventListener('input', adjustTextareaHeight);
        promptInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                // Trigger form submit
                if (form) {
                    form.dispatchEvent(new Event('submit'));
                }
            }
        });
    }

    if (newChatBtn) {
        newChatBtn.addEventListener('click', startNewChat);
    }
}

/**
 * Starts a new chat by clearing messages
 */
export function startNewChat() {
    const chatMessages = document.getElementById('chat-messages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    const promptInput = document.getElementById('messageInput');
    if (promptInput) {
        promptInput.focus();
    }
}