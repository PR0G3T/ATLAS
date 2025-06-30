import { addMessage } from './addMessage.js';
import { showToast } from './showToast.js';

let isWaiting = false;

const promptInput = document.getElementById('messageInput'); // Utiliser uniquement 'messageInput'
const sendButton = document.getElementById('sendButton');
const form = document.getElementById('atlas-form'); // Récupérer le formulaire

console.log('promptInput:', promptInput); // Debug
console.log('form:', form); // Debug

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
    if (sendButton) sendButton.disabled = true;

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
        if (sendButton) sendButton.disabled = false;
        promptInput.focus();
    });
}

// Ajout d'un écouteur sur le formulaire pour la soumission
if (form) {
    form.addEventListener('submit', handlePromptSubmit);
    console.log('Form submit listener added'); // Debug
}

// Optionnel : Entrée clavier sur l'input (Enter)
if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Le submit du formulaire gère déjà l'envoi, donc rien à faire ici
        }
    });
}