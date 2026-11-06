# WRDI V17.1 — Galio : core hybride adaptable, alternatives tardives

## Problème

La V17.0 protégeait les trois premiers achats et verrouillait **Créateur de failles par son nom**, même lorsqu'une draft pouvait préférer **Cotte épineuse** en troisième. En parallèle, l'optimiseur proposait encore **Gantelet givrant** dans des builds hybrides de Galio, alors que son déclenchement implique une attaque de base après un sort et que son ralentissement peut se recouper avec les contrôles de Galio.

## Nouvelle décision

Les cinq objets principaux sont **toujours sélectionnés librement à partir des fiches client**. Une préférence qualitative pour **Rayonnement du vide + Désespoir infini** demeure possible quand le match l'exige, et le troisième achat peut être :

- **Créateur de failles** : AP, dégâts amplifiés en combat prolongé, conversion des PV bonus en AP, sustain ;
- **Cotte épineuse** : armure, dégâts renvoyés uniquement si Galio est attaqué, anti-soin applicable sur les champions blessés ; peut passer en troisième si les soins observés sont déterminants, ou si mid AD + pression physique/soins justifient ce passif ;
- **autre objet nécessaire au matchup**, par exemple face à un adversaire AD mid : ni Rayonnement ni Créateur ne sont imposés.

Les observations de builds chinois motivent l'analyse, mais **ne constituent pas une probabilité de sélection de 80 % prouvée**. Les coefficients de la V17.1 sont des préférences heuristiques révisables, non des taux de victoire.

### Alternatives

Le système de substitutions protège **uniquement les trois achats réellement recommandés dans cette draft**, identifiés après optimisation de l'ordre. Il n'ajoute plus de verrou global sur Créateur de failles. Seuls les quatrième et cinquième achats sont remplaçables dans les panneaux d'alternatives, quelle que soit l'identité des objets trois premiers.

### Gantelet givrant

Le moteur valorise moins Gantelet dans les constructions hybrides d'engagement : son passif exige une attaque de base après un sort et applique un ralentissement potentiellement redondant avec les contrôles de Galio. Ce n'est **pas une interdiction générale** : une situation prouvant une bonne fréquence de déclenchement pourrait le justifier, mais sans preuve il est désavantagé.

Les contre-objets de fin de build restent comparés selon les menaces :
- **Présage de Randuin** contre critiques effectivement présents ;
- **Force de la nature** contre dégâts magiques répétés ;
- **Rookern kaénique** contre burst magique / besoin de bouclier magique ;
- **Gémeaux d'Amaranth** en combat prolongé après constitution des résistances ;
- **Cotte, Trident, Liandry ou autres** si leur effet répond mieux aux soins, boucliers ou cibles résistantes.

## Tests

`wrdi-galio-flexible-core-v171.test.js` vérifie (a) que Cotte et Créateur restent deux choix légaux ; (b) que Gantelet est défavorisé en hybride par rapport à un vrai contre ; (c) la draft utilisateur contre Darius / Jarvan IV / Ahri / Jhin / Karma ; (d) une draft avec **Yasuo mid** pour tester le changement d'ouverture ; (e) le passage de Cotte en troisième quand des soins décisifs sont constatés. Les tests V17.0 ont été adaptés pour ne plus prétendre que Créateur est verrouillé même lorsqu'il serait acheté quatrième.

## Limites

Le moteur ne voit pas les achats adverses ni les soins effectivement constatés pendant la partie. Les scénarios alternatifs restent des hypothèses de joueur, pas un suivi live. Les fiches client Wild Rift 7.3d restent la source des statistiques.
