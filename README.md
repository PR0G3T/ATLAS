# ATLAS - Assistant IA

ATLAS est une interface web moderne et épurée pour interagir avec un assistant IA. L'application offre une expérience utilisateur fluide avec la gestion des sessions de conversation.

## Fonctionnalités

- 🤖 **Interface de chat moderne** - Design épuré et responsive
- 💬 **Gestion des sessions** - Sauvegarde automatique des conversations
- 🎨 **Thème adaptatif** - Support automatique des thèmes clair/sombre
- ⚡ **Performance optimisée** - Code JavaScript vanilla, pas de frameworks lourds
- 📱 **Responsive** - Fonctionne parfaitement sur mobile et desktop
- 🔒 **Stockage local** - Vos conversations restent privées

## Architecture

### Structure du projet
```
ATLAS/
├── index.html          # Page principale
├── favicon.svg         # Icône de l'application
├── css/
│   ├── style.css      # Styles principaux
│   └── variable.css   # Variables CSS (thèmes, couleurs)
└── js/
    └── app.js         # Application principale
```

### Technologies utilisées

- **HTML5** - Structure sémantique
- **CSS3** - Design moderne avec variables CSS et animations
- **JavaScript ES6+** - Logique d'application sans dépendances
- **API REST** - Communication avec le backend

## Installation

1. **Cloner le repository**
   ```bash
   git clone [URL_DU_REPO]
   cd ATLAS
   ```

2. **Servir les fichiers**
   - Avec Python : `python -m http.server 8000`
   - Avec Node.js : `npx serve .`
   - Ou utiliser n'importe quel serveur web statique

3. **Ouvrir dans le navigateur**
   ```
   http://localhost:8000
   ```

## Configuration

### API Backend

L'application communique avec un backend via l'endpoint configuré dans `js/app.js` :

```javascript
this.apiUrl = 'https://rds.teamcardinalis.com/atlas/prompt';
```

### Format de l'API

**Requête POST :**
```json
{
  "prompt": "Votre question ici"
}
```

**Réponse :**
```json
{
  "response": "Réponse de l'IA"
}
```

## Utilisation

1. **Démarrer une conversation** - Tapez votre message et appuyez sur Entrée
2. **Nouvelle session** - Cliquez sur "Nouvelle session" dans la barre latérale
3. **Naviguer entre sessions** - Cliquez sur une session dans l'historique
4. **Raccourcis clavier** - Ctrl+Entrée pour envoyer un message

## Personnalisation

### Thèmes

Modifiez les variables dans `css/variable.css` pour personnaliser l'apparence :

```css
:root {
    --bg-primary: #0f0f0f;
    --text-primary: #ffffff;
    --accent: #2563eb;
    /* ... autres variables */
}
```

### Stockage

Les sessions sont sauvegardées dans le localStorage du navigateur :
- `atlas_sessions` - Liste des sessions
- `atlas_current_session` - ID de la session active

## Compatibilité

- **Navigateurs modernes** - Chrome 60+, Firefox 60+, Safari 12+, Edge 79+
- **Mobile** - iOS Safari, Chrome Mobile, Firefox Mobile
- **Desktop** - Windows, macOS, Linux

## Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amelioration`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Créer une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Support

Pour le support technique ou les questions, ouvrez une issue sur le repository GitHub.
