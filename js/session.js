const SESSION_KEY = 'atlas_session';

/**
 * Démarre une nouvelle session en stockant les données utilisateur dans localStorage.
 * @param {object} userData - Les données utilisateur à stocker.
 */
export function startSession(userData) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(userData));
    } catch (error) {
        console.error('Erreur lors du démarrage de la session:', error);
    }
}

/**
 * Met fin à la session en cours en supprimant les données utilisateur de localStorage.
 */
export function endSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error('Erreur lors de la fin de la session:', error);
    }
}

/**
 * Récupère les données de la session en cours depuis localStorage.
 * @returns {object|null} L'objet de données utilisateur ou null si aucune session n'existe.
 */
export function getSession() {
    try {
        const sessionData = localStorage.getItem(SESSION_KEY);
        return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
        console.error('Erreur lors de la récupération de la session:', error);
        return null;
    }
}

/**
 * Vérifie si un utilisateur est actuellement connecté.
 * @returns {boolean} True si une session existe, sinon false.
 */
export function isLoggedIn() {
    return getSession() !== null;
}
