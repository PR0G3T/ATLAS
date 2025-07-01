import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';

let isWaiting = false;

const promptInput = document.getElementById('messageInput'); // Renommé de messageInput à promptInput
const sendButton = document.getElementById('sendButton');
const form = document.getElementById('atlas-form');

function adjustTextareaHeight() {
    promptInput.style.height = 'auto';
    promptInput.style.height = (promptInput.scrollHeight) + 'px';
}

if (promptInput) {
    promptInput.addEventListener('input', adjustTextareaHeight);
}

function handlePromptSubmit(e) {
    if (e) e.preventDefault();
    if (isWaiting) {
        showToast('Veuillez attendre la réponse avant de poser une nouvelle question.', 'error');
        return;
    }
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showToast('Veuillez entrer une question.', 'error');
        return;
    }
    isWaiting = true;
    promptInput.disabled = true;
    sendButton.disabled = true;

    addMessage(prompt, 'user');

    promptInput.value = '';
    adjustTextareaHeight(); // Reset height

    fetch('https://rds.teamcardinalis.com/atlas/prompt', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
    })
    .then(response => {
        if (!response.ok) throw new Error('Erreur serveur');
        return response.json();
    })
    .then(data => {
        addMessage(data.response || 'Aucune réponse.', 'ai');
    })
    .catch(err => {
        showToast('Erreur : ' + (err.message || 'Erreur inconnue.'), 'error');
    })
    .finally(() => {
        isWaiting = false;
        promptInput.disabled = false;
        sendButton.disabled = false;
        promptInput.focus();
    });
}

if (form) {
    form.addEventListener('submit', handlePromptSubmit);
}

if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handlePromptSubmit();
        }
    });
}