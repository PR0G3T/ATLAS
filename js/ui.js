const promptInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const loginForm = document.getElementById('login-form');
const mainContent = document.querySelector('.main-content');

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

export function showLoginForm() {
    if (loginForm) loginForm.style.display = 'flex';
    if (mainContent) mainContent.style.display = 'none';
}

export function showChatInterface() {
    if (loginForm) loginForm.style.display = 'none';
    if (mainContent) mainContent.style.display = 'flex';
}