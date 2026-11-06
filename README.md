# Wild Rift Draft Intelligence — V15.8

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
- `wrdi-champion-profiles-v15.js` (identité AD/AP et archétypes de base),
- `wrdi-official-kit-intelligence-v158.js` (reconnaissance sourcée des mécanismes des 625 compétences officielles Wild Rift),
- `wrdi-galio-team-context-v1431.js` (menaces et besoins d'équipe),
- `wrdi-galio-kit-item-synergy-v1434.js` (interactions théoriques Galio-passifs),
- `wrdi-galio-five-item-optimizer-v1429.js` (choix des cinq objets),
- `wrdi-galio-purchase-order-v1432.js` (priorisation),
- `wrdi-galio-contingencies-v1433.js` (changements possibles),
- `wrdi-core-v14.js`, `wrdi-galio-item-guard-v1424.js` (validité),
- `wrdi-rune-bridge-v14.js`, `wrdi-galio-rune-advisor-v1411.js` (runes).

La page de production charge **16 scripts**, sans `assets/app.js`, sans comparateurs V12/V13 et sans anciens panneaux de diagnostic.

## Sources : séparation stricte

- Objets : `data/items-client-7.3d-v12.json` — 59 fiches provenant du client.
- Restrictions : `data/item-restrictions-client-7.3d-v12.json`.
- Runes : `data/rune-catalog-client-v14.json`.
- Noms, IDs, lanes et classes des champions : `data/champions-picker-v151.json` (catalogue local de 125 entrées, à réactualiser pour les derniers champions).
- Compétences : `data/champion-ability-extract-official-v1.json`, 125 fiches, 625 compétences extraites des pages françaises Wild Rift de Riot ; les mécanismes sont détectés à partir des descriptions complètes et rattachés à chaque sort, mais les extraits affichés restent courts.
- Validations complémentaires de passifs : `data/champion-kits-official-fr-v1.json` (20 fiches initiales).
- Profils de champions : `wrdi-champion-profiles-v15.js` ; étiquettes qualitatives extraites de l'ancien registre statique, **pas des matchups validés**.

En cas d'indisponibilité d'une donnée indispensable, le moteur **refuse** la recommandation. Aucun repli sur un build observé.

## Limites restantes

- Un calcul « optimal » n'est **pas démontré** : les poids des menaces et des synergies restent heuristiques, et la recherche de cinq objets est une méthode de beam search.
- Le **catalogue joueur** porte la version enregistrée 7.3d ; aucun patch ultérieur n'est automatiquement appliqué.
- Les **bottes** ne sont pas encore optimisées.
- Les mécanismes des compétences sont reconnus par règles explicites à partir du texte officiel Riot ; leurs valeurs numériques, ratios, timings, conditions complexes et patch exact ne sont pas tous validés. La lecture du texte ne constitue pas une simulation de combat.
- Le catalogue des champions et les extraits des sorts sont des fichiers du dépôt ; l'application ne dépend plus d'un service tiers pour leurs noms ou leurs mécaniques.
- Les 52 runes sont validées structurellement ; la page tactique reste une hypothèse, sans winrates inventés.

## Historique et entretien

Les pages historiques, les anciens calculateurs, les laboratoires et les fichiers `data/stage-a-*` ne sont **pas chargés par la V15** ; ils restent dans le dépôt comme preuves ou fixtures de tests. Ne pas effacer les fiches validées ou leur provenance.

- `main` : branche de publication.
- `v14-development` : branche d'intégration provisoire.
- `archive/pre-consolidation-v1434-2026-11-06` : sauvegarde antérieure.
- [Audit initial de consolidation](./docs/AUDIT_CONSOLIDATION_2026-11-06.md).
- Exécuter `node --test wrdi-draft-engine-v15.test.js` pour le pipeline autonome ; GitHub Actions conserve également les tests de non-régression historiques.

**Objectif de la prochaine itération :** tester les choix du moteur sur des drafts variées et remplacer les poids heuristiques insuffisamment fondés par des règles de synergie et de menaces auditées, sans réintroduire les builds populaires.
