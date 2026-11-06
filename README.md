# Wild Rift Draft Intelligence

Assistant de **préparation de draft Wild Rift mobile**, en français. Galio mid est le premier champion équipé d'un moteur de cinq objets construit à partir des fiches du client du joueur (sans builds populaires).

## Ouvrir l'application

- **Page canonique : [index.html](./index.html)** — choisir la composition, analyser, puis consulter le build et les runes.
- [Dernière page d'essai V14.34](./index-v1434.html) — instantané de diagnostic ; ne pas choisir les versions anciennes pour le travail courant.
- [Audit de consolidation](./docs/AUDIT_CONSOLIDATION_2026-11-06.md) — état des branches, modules, données à conserver et travaux de nettoyage.

## Principes du moteur

1. Composer les dix champions avant la partie.
2. Galio mid : choisir cinq **objets principaux compatibles** à partir des descriptions et passifs de `data/items-client-7.3d-v12.json`.
3. Conseiller un ordre d'achat théorique fondé sur la lane et la draft initiale.
4. Prévoir jusqu'à trois **remplacements situationnels explicites** si certaines menaces deviennent prioritaires durant la partie ; aucun suivi en direct n'est requis.
5. Présenter une page de runes (sous réserve de la couverture de données), sans fabriquer de winrates.
6. Les bottes ne sont pas comptées parmi les cinq objets principaux ; le Sablier de Zhonya est bien un objet actif de ces cinq emplacements.

Les résultats sont **des estimations qualitatives, non une validation d'optimalité en match**. La justesse dépend notamment des profils de menaces et de l'adéquation des passifs au kit de Galio.

## Données de référence

- `data/items-client-7.3d-v12.json` : 59 fiches d'objets fournies/vérifiées dans le client.
- `data/item-restrictions-client-7.3d-v12.json` : combinaisons interdites.
- `data/rune-catalog-client-v14.json` : runes du client.
- `data/galio-rune-training-observations-v1415.json` : observations de déclenchement.
- `data/stage-a-*.json` : preuves de collecte à archiver, non à mélanger au moteur actif.

## Architecture

- `assets/app.js` : interface historique conservée pour compatibilité et déclenchement de l'analyse.
- `wrdi-galio-team-context-v1431.js` : lecture de la composition.
- `wrdi-galio-kit-item-synergy-v1434.js` : conditions de synergie Galio/objets.
- `wrdi-galio-five-item-optimizer-v1429.js` : choix des cinq objets.
- `wrdi-galio-purchase-order-v1432.js` : ordre d'achat.
- `wrdi-galio-contingencies-v1433.js` : remplacements conditionnels avant partie.
- `wrdi-compact-dashboard-v1423.js` : affichage épuré.
- `wrdi-ten-kit-panel-v1414.js` et dépendances V14 : runes.

L'application charge encore certains laboratoires et anciennes couches : une prochaine refonte doit séparer **runtime**, **preuves**, et **outillage de test**. Lire l'audit avant de supprimer des scripts.

## Branches

- `main` : publication.
- `v14-development` : développement et CI V14.
- `archive/pre-consolidation-v1434-2026-11-06` : sauvegarde des fichiers antérieurs à cette consolidation.

Les anciens instantanés HTML ne doivent pas être utilisés comme point d'entrée ; ils ne restent que pour les tests et la récupération historique.
