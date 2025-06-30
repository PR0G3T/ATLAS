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
    // Ajout d'un log pour diagnostiquer la valeur lue
    const prompt = promptInput ? promptInput.value.trim() : '';
    console.log('Valeur du promptInput:', promptInput ? promptInput.value : '(input non trouvé)');
    if (!prompt) {
        showToast('Veuillez entrer une question.', 'error');
        return;
    }
    isWaiting = true;
    if (promptInput) promptInput.disabled = true;
    if (sendButton) sendButton.disabled = true;
    //lol

    addMessage(prompt, 'user');

    if (promptInput) promptInput.value = '';
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
        if (promptInput) promptInput.disabled = false;
        if (sendButton) sendButton.disabled = false;
        if (promptInput) promptInput.focus();
    });
}

// Ajout d'un écouteur sur le formulaire pour la soumission
if (form) {
    form.addEventListener('submit', handlePromptSubmit);
    console.log('Form submit listener added'); // Debug
}

// Ajout d'un écouteur sur le bouton d'envoi si ce n'est pas un bouton de type submit
if (sendButton && form) {
    sendButton.addEventListener('click', (e) => {
        // Si le bouton n'est pas de type submit, on déclenche la soumission du formulaire
        if (sendButton.type !== 'submit') {
            e.preventDefault();
            form.requestSubmit ? form.requestSubmit() : handlePromptSubmit(e);
        }
    });
}

// Optionnel : Entrée clavier sur l'input (Enter)
if (promptInput) {
    promptInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            // Le submit du formulaire gère déjà l'envoi, donc rien à faire ici
        }
    });
}