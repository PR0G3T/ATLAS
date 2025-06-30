document.getElementById('atlas-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const prompt = document.getElementById('prompt').value.trim();
    const responseDiv = document.getElementById('response');
    const errorDiv = document.getElementById('error');
    responseDiv.textContent = '';
    errorDiv.textContent = '';

    if (!prompt) {
        errorDiv.textContent = 'Veuillez entrer une question.';
        return;
    }

    // Simuler une réponse (à remplacer par un appel API réel)
    setTimeout(() => {
        responseDiv.textContent = `Réponse simulée pour : "${prompt}"`;
    }, 700);
});
