import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';

document.getElementById('atlas-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const prompt = document.getElementById('prompt').value.trim();
    if (!prompt) {
        showToast('Veuillez entrer une question.', 'error');
        return;
    }
    addMessage(prompt, 'user');
    document.getElementById('prompt').value = '';
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
    });
});

const chatMessages = document.getElementById('chat-messages');
