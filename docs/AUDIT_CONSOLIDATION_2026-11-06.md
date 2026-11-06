# Audit de consolidation — Wild Rift Draft Intelligence
_Date : 6 novembre 2026. Branche auditée : `v14-development` (état V14.34)._

## État de consolidation réalisé

- **Les deux branches `main` et `v14-development` sont maintenant alignées** sur la version V14.34 après validation CI. `main` est l'entrée canonique de publication.
- **10 anciens instantanés HTML ont été supprimés du développement** : V14.10, V14.24, V14.25, V14.27, V14.28, V14.29, V14.30, V14.31, V14.32 et V14.33 ; ils restent tous récupérables dans la branche d'archive.
- **15 instantanés HTML restent présents**, notamment pour les tests qui lisent directement les anciennes versions. Ils ne constituent pas une seconde application officielle.
- **52 scripts externes** sont toujours référencés par l'entrée canonique. Le déchargement des laboratoires et du code hérité n'est **pas encore achevé** : il faut tracer toutes les dépendances avant de le faire.
- Le worker PWA et les tests de l'entrée canonique ont été mis à jour ; les tests Node sont verts. Une validation de l'affichage sur téléphone reste distincte.

## Décisions et état réel
- **Deux branches de travail identifiées :** `main` (ancienne interface V11/V12) et `v14-development` (toutes les évolutions récentes). Avant consolidation, `v14-development` avait 442 commits d'avance sur `main` et aucun commit de retard.
- **Sauvegarde immuable par branche :** `archive/pre-consolidation-v1434-2026-11-06` ; ne pas réécrire cette référence.
- **Entrée officielle corrigée sur la branche de développement :** `index.html` sert maintenant l'application compacte V14.34 ; `index-v1434.html` reste un instantané de référence.
- **Tests :** 63 fichiers `*.test.js` et une workflow de tests V14 ; contrôler le résultat des tests après tout nettoyage.
- **Volume initial :** 283 fichiers de travail sur la branche V14 à cette étape de l'audit (comptage des blobs Git). `main` en contenait 119 avant consolidation.
- **Chargement initial :** 52 scripts externes dans la page V14.34, sans référence de script dupliquée. Cela ne signifie pas que 52 scripts sont nécessaires à la recommandation Galio : beaucoup servent aux anciens laboratoires et à l'interface technique.

## À garder dans l'application fonctionnelle
1. **Sélection de draft et interface :** `assets/app.js`, `assets/styles.css`, `wrdi-compact-dashboard-v1423.js` ; la page principale doit rester simple et garder les résultats en un seul écran.
2. **Catalogue joueur :** `data/items-client-7.3d-v12.json` (59 objets, descriptions et statistiques), `data/item-restrictions-client-7.3d-v12.json`, `assets/item-icons/*.webp` (58 icônes existantes). Ces données ne doivent jamais être effacées comme « obsolètes » simplement à cause de leur nom V12.
3. **Moteur Galio :** `wrdi-core-v14.js`, `wrdi-galio-item-guard-v1424.js`, `wrdi-galio-team-context-v1431.js`, `wrdi-galio-kit-item-synergy-v1434.js`, `wrdi-galio-five-item-optimizer-v1429.js`, `wrdi-galio-purchase-order-v1432.js`, `wrdi-galio-contingencies-v1433.js`. Ce sont les modules qui produisent la recommandation actuelle.
4. **Moteur runes et données utilisateur :** `data/rune-catalog-client-v14.json`, `data/galio-rune-training-observations-v1415.json`, `wrdi-ten-kit-panel-v1414.js`, modules de runes V14 utilisés par ce panneau et les tests de légalité. Tracer les dépendances avant toute réduction.
5. **Données Galio historiques utiles :** `assets/galio-*.js` et scripts de scénarios V13 contiennent une partie des mécanismes déjà saisis ; ne pas les jeter avant extraction des règles utiles vers le nouveau moteur.
6. **Distribution :** `index.html`, `manifest.webmanifest`, `sw.js`, icônes d'application, tests GitHub Actions.

## À sortir de l'exécution de production APRÈS extraction / vérification
- Le moteur historique de **cores Mid populaires** dans `assets/app.js` reste disponible pour certains champions non-Galio. Il ne doit pas alimenter les builds Galio ; il faudrait isoler clairement ce comportement avant d'étendre l'optimiseur aux autres champions.
- Les anciens panneaux `wrdi-diagnostic-v14.js`, expériences de calcul V13, laboratoires `galio-lab-v12.html` et modules de démonstration doivent être regroupés dans une **zone développement** : ils ne sont pas l'interface de l'utilisateur.
- `wrdi-galio-item-context-v1427.js` et `wrdi-galio-item-comparator-v1428.js` sont des couches d'heuristiques antérieures à l'optimiseur cinq objets ; identifier toutes leurs références avant de les retirer.
- Les anciens modules `assets/unified-interface-v12.js` et `assets/unified-interface-v149.js` sont des générations différentes : la page courante charge V149, mais plusieurs tests historiques lisent V12.

## Pages d'archives : ne pas confondre « obsolète » et « supprimable »
- 25 instantanés `index-v*.html` subsistent sur `v14-development`, dont `index-v1434.html`.
- Plusieurs tests JavaScript inspectent **explicitement** des instantanés anciens (dont V14.11, 14.12, 14.13, 14.14, 14.15, 14.17–14.23 et 14.26).
- Suppression directe de ces fichiers = régression des tests. Migrer d'abord les assertions vers une entrée canonique ou un dossier de fixtures historiques.
- La branche d'archive permet de récupérer les versions et les données en cas de régression.

## Données à conserver comme preuves (hors calcul direct)
- Les 35 fichiers `data/stage-a-*` sont les preuves utilisateur et les contrôles de provenance de l'inventaire ; **archives vérifiables**, pas des dépendances des builds actifs.
- `data/items-7.2a-normalized.json` et autres catalogues antérieurs sont **historiques** ; ne pas les mélanger aux fiches vérifiées du client pour calculer le build.
- Les tests historiques `stage-a-*.test.js` doivent rester exécutables même si l'on déplace les preuves hors de l'application chargée par le navigateur.

## Risques prouvés et priorités
1. **Risque de livraison :** `main/index.html` affichait l'ancien site quand les nouvelles versions étaient ouvertes via des URLs `index-v14xx.html`. Corrigé sur `v14-development`; la publication sur `main` ne doit se faire qu'après CI verte.
2. **PWA/cache :** ancien `sw.js` stockait toute page HTML naviguée sous la clef `index.html`, même une URL d'essai. Corrigé avec cache nommé et reconnaissance stricte de l'entrée canonique.
3. **Dépendances cachées :** l'application courante utilise encore `assets/app.js` pour choisir les champions et charger des ressources externes ; retirer massivement des scripts casserait potentiellement la draft ou les runes.
4. **Précision :** les cinq objets de Galio utilisent le catalogue client, mais le score reste heuristique ; aucune suite de tests automatisés ne peut encore établir un taux de « builds corrects ».
5. **Règles :** Zhonya est un objet actif autonome dans les cinq emplacements et non un enchantement de bottes ; les bottes restent un travail de produit séparé.

## Cible architecturale à terme
```
index.html  →  interface de draft légère
             →  moteur de composition (champions/menaces)
             →  moteur Galio (kit + 59 fiches + restrictions)
             →  5 objets + ordre de priorité + 3 remplacements prévus
             →  page de 5 runes légales
/tests/      →  tests actuels de conformité et de régression
/archive/    →  preuves + anciens écrans + laboratoires, hors runtime
```

## Politique des branches
- `main` = publication canonique et URL d'accueil ;
- `v14-development` = branche de refonte/test tant que la migration n'est pas finalisée ;
- `archive/pre-consolidation-v1434-2026-11-06` = copie de sauvegarde.
- Une fois la CI verte et l'accueil vérifié, promouvoir la même révision sur `main` puis cesser de publier de nouveaux `index-vNNNN.html`. Pour un seul flux de travail, utiliser ensuite `main` avec branches temporaires/PR uniquement lorsqu'elles sont nécessaires.

## À ne pas faire
- Supprimer les données validées du client, les notes de tests de proc ou les restrictions.
- Supprimer des scripts sur le seul critère de leur suffixe V12/V13.
- Fusionner le moteur Galio avec la branche des builds populaires.
- Dire que la qualité du build est prouvée seulement parce que les tests Node réussissent.
