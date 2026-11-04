# Wild Rift Draft Intelligence V11.0 — architecture modulaire

## Installation
Décompresser **tous les fichiers et dossiers** à la racine du dépôt GitHub Pages (remplacer les fichiers existants). Ne pas téléverser le ZIP comme un fichier unique.

## Architecture
- `index.html` : interface de draft (les anciens composants restent dans le DOM mais sont masqués pour compatibilité avec les fonctions existantes).
- `assets/styles.css` : apparence mobile.
- `assets/app.js` : logique historique de sélection, catalogues, cores Mid, suggestions heuristiques.
- `assets/knowledge.js` : registre de règles validées, contrôles de patch, fonctions mathématiques testables.
- `assets/quality.js` : audit des données visibles dans « Données et fiabilité ».
- `assets/pwa.js`, `sw.js`, `manifest.webmanifest`, `icon-*.png` : installation et cache PWA.

## Limites honnêtes
Cette livraison constitue une **refonte de l'architecture**, pas une base exhaustive des passifs et compétences. Les données d'objets, runes et cores restent récupérées en direct de WR China. La base de règles validées est initialement vide, pour éviter de simuler des interactions non confirmées. Les suggestions de cores et d'objets situationnels restent heuristiques. L'accès réseau est nécessaire pour les catalogues et les builds. La cohérence des patchs est contrôlée au lancement de l'analyse.

## Validation
La syntaxe JavaScript a été contrôlée avec Node. Les interactions en jeu et l'exécution sur Samsung doivent être validées séparément.
Mise à jour de publication V12
