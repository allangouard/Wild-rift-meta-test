# Collecte des fiches champions — Wild Rift uniquement

Date de départ : 6 novembre 2026. La version du client de référence pour les objets est 7.3d, **pas** une preuve que les fiches de champions externes sont toutes au patch 7.3d.

## Sources admissibles

- Riot, fiches françaises Wild Rift : https://wildrift.leagueoflegends.com/fr-fr/champions/
- Riot, structure JSON officielle intégrée aux pages web (utilisée par la bibliothèque open source `iArmanKarimi/wildrift-champions-api`), comprenant en principe le passif, Q, W, E, R et leurs descriptions.
- Le wiki `WR:` uniquement pour vérifier les détails numériques, en signalant toute version non confirmée.
- Le **client Wild Rift de l'utilisateur** est la référence finale pour les conflits et chiffres sensibles aux patchs.

**Interdit pour les données de gameplay :** Data Dragon League of Legends PC, compétences/ratios PC, builds populaires, chiffres non datés présentés comme garantis.

## Mise à jour V16 — 6 novembre 2026

La collecte a été relancée depuis les pages officielles Riot Wild Rift : **125 champions et 625 descriptions complètes** sont désormais conservés sous `skills[passive|q|w|e|r].description_fr` dans `data/champion-ability-extract-official-v1.json`. Les 24 premiers mots restent dans `excerpt_fr` pour compatibilité d’affichage. `wrdi-official-kit-intelligence-v158.js` lit d’abord la description complète ; pour un catalogue de 125 fiches, l’absence d’une seule description complète bloque l’analyse afin d’éviter une fausse couverture.

La présence du texte complet ne prouve pas que Riot fournit toutes les valeurs de niveaux, ratios, portées, durées, cooldowns et conditions du client. Ces détails restent **non vérifiés**, et ne sont jamais déduits de League of Legends PC. Le client Wild Rift fourni par l’utilisateur reste nécessaire pour les chiffres manquants. Les lignes historiques ci-dessous retracent l’état antérieur de la collecte.

## État de la base

1. `data/champions-picker-v151.json` — 125 identités et voies historiques provenant d'un index de 2025. Ce n'est pas une garantie de catalogue Wild Rift complet en 2026.
2. `data/champion-kits-official-fr-v1.json` — premier lot de 20 fiches Riot vérifiées manuellement : noms des 5 compétences et mécanique du passif reformulée. **Descriptions complètes Q/W/E/R et chiffres manquants**.
3. `data/champion-kit-coverage-v1.json` — bilan par champion, avec 105 fiches à rechercher.
4. **Collecte automatique exécutée avec succès : 125/125 champions, 625 compétences extraites, aucune erreur** (noms et extraits français de chacune des 5 compétences). Ces extraits sont plafonnés à 24 mots par compétence et ne constituent pas des fiches numériques entièrement validées.
5. `data/champion-kit-coverage-v2.json` : couverture automatique vérifiée sur 125 champions, mais **0 ratio/délai confirmé et 0 fiche intégralement validée**.
6. `scripts/collect-official-wr-kits.mjs` et `scripts/wr-official-page-parser.mjs` — import contrôlé des données publiques **Wild Rift seulement**; les extraits conservés sont limités, mais les règles interprètent désormais la totalité de la description Riot avant réduction; seuls les mécanismes textuels reconnus contribuent aux menaces, jamais les chiffres non vérifiés.
7. `data/champion-ability-extract-official-v1.json` — sortie brute vérifiable de l'extraction automatisée, si la page Riot répond. Chaque fiche brute conserve `allowedForScoring: false` : les valeurs et descriptions non structurées ne deviennent pas des scores. La couche `wrdi-official-kit-intelligence-v158.js` extrait séparément des indices textuels sourcés (soins, dégâts magiques/physiques, CC dur, ralentissement, bouclier, brûlure, etc.) pour l’analyse de draft.

## Exploitation active dans le moteur V15.8

Le chemin officiel est : `data/champion-ability-extract-official-v1.json` → `wrdi-official-kit-intelligence-v158.js` → `wrdi-draft-engine-v15.js` → `wrdi-galio-team-context-v1431.js` → build, achat situationnel et runes. Pour les descriptions de plus de 24 mots, le collecteur teste les mécanismes sur **l'intégralité du texte officiel**, puis ne conserve qu'un extrait court et les indicateurs structurés. Les règles séparent ralentissement, contrôle dur et mots ambigus comme « provoquer une explosion ». Chaque indice affiché est rattaché au sort source. Aucun gameplay League PC, valeur numérique simulée ni build populaire.

Les observations des 20 passifs déjà révisés complètent les textes tronqués, notamment la forme Darkin de Kayn. Les décisions restent qualitatives et dépendantes de la précision des règles linguistiques.

## Ce qui manque pour une fiche de combat réellement complète

Pour chaque champion : conditions de déclenchement du passif; les quatre compétences et leurs modes; rang, ratio, dégâts, conversion, récupération, coût, portée, durée, type de contrôle; interactions de soin/bouclier; immunités, invulnérabilités, esquives; dégâts sur PV max, dégâts à l'impact et coups critiques intrinsèques; transformations/fomes; timings de fenêtre d'engagement; particularités spécifiques Wild Rift.

Chaque détail doit porter `source_url`, `date_lecture`, `patch_confirme`, `validite` et statut `client_verifie` ou `externe_non_confirme`. Un élément manquant reste **null**, jamais remplacé par une valeur PC.

## Ordre de progression

1. Compléter et vérifier les descriptions détaillées des 625 compétences ; les données courtes déjà collectées ne suffisent pas à confirmer tous les déclencheurs, ratios, types de dégâts et temps de récupération.
2. **Accompli :** importer les 105 autres identités, plus les 20 du lot initial, depuis Riot. Restent la validation des mécanismes, les valeurs et le traitement des patchs.
3. Corriger l'écart entre l'ancien catalogue local de 125 champions et la liste actuelle du site Riot (ne pas supposer que le chiffre du site restera stable).
4. Vérifier les ratios / délais les plus utiles à Galio mid et aux menaces de chaque draft.
5. Alimenter le moteur avec les **seuls** mécanismes qualifiés, au lieu de libérer des champs bruts sans vérification; ajouter des tests de non-régression par matchup.

## Invariants

- Seuls les mécanismes explicitement reconnus et sourcés du texte officiel changent désormais les signaux de la draft; les valeurs absentes et déductions numériques restent exclues.
- Un champion non documenté ne gagne pas de mécanique inventée.
- Kayn : le soin dépend de sa forme (Darkin), pas une guérison assurée sur toutes les parties.
- Jhin : quatrième tir critique intrinsèque, sans déduire qu'il achète nécessairement des objets de critique.
- Les données externes sont les preuves; la qualité de la décision nécessite encore des tests stratégiques.
