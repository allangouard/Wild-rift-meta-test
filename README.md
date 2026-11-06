# Wild Rift Draft Intelligence — V15

Application de **préparation de draft Wild Rift mobile**, centrée pour l'instant sur **Galio mid**. Une seule page et un seul pipeline de décision.

## Utilisation

Ouvrir `index.html` sur la branche de publication. Choisir les dix champions, puis « Analyser ma draft ».

L'application affiche :
- **cinq objets** choisis ensemble à partir des fiches vérifiées du client ;
- un **ordre d'achat théorique** ;
- jusqu'à **trois remplacements situationnels**, exprimés sous la forme « si ... remplacer X par Y » ;
- une **page de cinq runes** validée par les règles du client (lorsque disponible).

Elle **n'est pas utilisée pendant la partie** et n'effectue aucune surveillance en temps réel.

## Architecture de production

`index.html` → `wrdi-app-v15.js` → `wrdi-draft-engine-v15.js` → moteurs :
- `wrdi-champion-profiles-v15.js` (profils par archétypes, approximatifs),
- `wrdi-galio-team-context-v1431.js` (menaces et besoins d'équipe),
- `wrdi-galio-kit-item-synergy-v1434.js` (interactions théoriques Galio-passifs),
- `wrdi-galio-five-item-optimizer-v1429.js` (choix des cinq objets),
- `wrdi-galio-purchase-order-v1432.js` (priorisation),
- `wrdi-galio-contingencies-v1433.js` (changements possibles),
- `wrdi-core-v14.js`, `wrdi-galio-item-guard-v1424.js` (validité),
- `wrdi-rune-bridge-v14.js`, `wrdi-galio-rune-advisor-v1411.js` (runes).

La page de production charge **12 scripts**, sans `assets/app.js`, sans comparateurs V12/V13 et sans anciens panneaux de diagnostic.

## Sources : séparation stricte

- Objets : `data/items-client-7.3d-v12.json` — 59 fiches provenant du client.
- Restrictions : `data/item-restrictions-client-7.3d-v12.json`.
- Runes : `data/rune-catalog-client-v14.json`.
- **Noms/IDs des champions uniquement** : `wrchina.gg/api/data.json`. Cette ressource ne fournit **aucun build**, aucune rune, aucun winrate et aucun score d'objet.
- Profils de champions : `wrdi-champion-profiles-v15.js` ; étiquettes qualitatives extraites de l'ancien registre statique, **pas des matchups validés**.

En cas d'indisponibilité d'une donnée indispensable, le moteur **refuse** la recommandation. Aucun repli sur un build observé.

## Limites restantes

- Un calcul « optimal » n'est **pas démontré** : les poids des menaces et des synergies restent heuristiques, et la recherche de cinq objets est une méthode de beam search.
- Le **catalogue joueur** porte la version enregistrée 7.3d ; aucun patch ultérieur n'est automatiquement appliqué.
- Les **bottes** ne sont pas encore optimisées.
- Les catégories de menace ne sont pas encore des fiches complètes et toutes les interactions Galio-item n'ont pas été testées en client.
- Les données des **noms de champions nécessitent un accès réseau** au premier lancement.
- Les 52 runes sont validées structurellement ; la page tactique reste une hypothèse, sans winrates inventés.

## Historique et entretien

Les pages historiques, les anciens calculateurs, les laboratoires et les fichiers `data/stage-a-*` ne sont **pas chargés par la V15** ; ils restent dans le dépôt comme preuves ou fixtures de tests. Ne pas effacer les fiches validées ou leur provenance.

- `main` : branche de publication.
- `v14-development` : branche d'intégration provisoire.
- `archive/pre-consolidation-v1434-2026-11-06` : sauvegarde antérieure.
- [Audit initial de consolidation](./docs/AUDIT_CONSOLIDATION_2026-11-06.md).
- Exécuter `node --test wrdi-draft-engine-v15.test.js` pour le pipeline autonome ; GitHub Actions conserve également les tests de non-régression historiques.

**Objectif de la prochaine itération :** tester les choix du moteur sur des drafts variées et remplacer les poids heuristiques insuffisamment fondés par des règles de synergie et de menaces auditées, sans réintroduire les builds populaires.
