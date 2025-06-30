import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';

let isWaiting = false;

document.getElementById('atlas-form').addEventListener('submit', function(e) {
    e.preventDefault();
    if (isWaiting) {
        showToast('Veuillez attendre la réponse avant de poser une nouvelle question.', 'error');
        return;
    }
    const promptInput = document.getElementById('prompt');
    const prompt = promptInput.value.trim();
    if (!prompt) {
        showToast('Veuillez entrer une question.', 'error');
        return;
    }
    isWaiting = true;
    promptInput.disabled = true;
    const submitBtn = this.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    addMessage(prompt, 'user');
    promptInput.value = '';
    fetch('https://rds.teamcardinalis.com/atlas/ask', {
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
        if (submitBtn) submitBtn.disabled = false;
        promptInput.focus();
    });
});

const chatMessages = document.getElementById('chat-messages');
