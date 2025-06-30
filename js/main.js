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

    // Appel API réel
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
        responseDiv.textContent = data.response || 'Aucune réponse.';
    })
    .catch(err => {
        errorDiv.textContent = err.message || 'Erreur inconnue.';
    });
});
