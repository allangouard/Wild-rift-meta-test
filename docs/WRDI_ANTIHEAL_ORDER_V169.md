# Wild Rift Draft Intelligence V16.9 — ordre d'achat anti-soin dynamique

## Problème

Après **Rayonnement du vide → Désespoir infini** sur Galio mid, le troisième objet ne doit pas être fixé par la présence de Darius, Gwen ou Séraphine dans la draft : avoir du soin dans le kit ne prouve pas que ce soin empêchera notre équipe d'éliminer les cibles.

Le moteur compare désormais au troisième achat :
- **Créateur de failles** : 350 PV, 70 AP, 15 accélération, +2 % AP des PV bonus, montée en amplification jusqu'à +8 %, omnivampirisme conditionnel, aucun anti-soin.
- **Cotte épineuse** : 200 PV, 75 armure, Hémorragie 50 % pendant trois secondes, en blessant ou lorsqu'un champion attaque Galio ; les dégâts magiques renvoyés nécessitent réellement que Galio subisse des attaques.
- **Morellonomicon** : 300 PV, 75 AP, 15 accélération, Hémorragie 50 % sur dégâts magiques, pas d'armure.

Les valeurs et conditions proviennent de **data/items-client-7.3d-v12.json** et des captures client, pas de League of Legends PC.

## Décision

Le nouveau module `wrdi-antiheal-order-v169.js` note séparément les quatre composantes :
- Présence de soins **dans les compétences des adversaires** : simple exposition possible, sans supposer un combat observé.
- Gravité des soins **vraiment constatés en partie** (0 à 5) : à 2 et au-delà, le passif Hémorragie prend de la valeur et un item anti-soin peut être avancé en troisième.
- Armure pertinente face à des ennemis physiques et dégâts renvoyés si Galio est réellement attaqué.
- Besoin d'AP, de dégâts directs, de contrôles disponibles et d'amplification pour préserver sa « survie productive ».

Le module produit des comparaisons chiffrées de scénarios d'achats 3–4, avec plusieurs fins de route : Créateur → Trident, Créateur → Amaranth, Créateur → Liandry, Créateur → Cotte, Cotte → Créateur, Morello → Créateur, Créateur → Morello. Il vérifie les restrictions d'équipement pour chaque séquence. **Les cinq objets principaux sont toujours choisis librement par l'optimiseur existant**, aucune composition n'est imposée.

La phase de commande `wrdi-galio-purchase-order-v1432.js` prend aussi en compte les conditions de déclenchement et l'urgence observée pour départager les achats aux emplacements 3 et 4. Elle ne déduit pas la gravité des soins d'une simple fiche de champion.

L'application montre **un scénario de base** (soins non observés) et **un scénario conditionnel** (soins véritablement décisifs). Le second n'est pas une observation automatique de la partie et ne doit jamais être présenté comme tel.

## Limites

- Le moteur ne surveille pas encore les parties ni les objets réellement achetés par les adversaires ; le scénario « soins constatés » est une hypothèse à appliquer si le joueur rencontre ce problème.
- Aucune statistique de victoire de joueurs chinois n'est présentée comme une preuve. Le moteur ne modifie **pas** les choix de runes Impact soudain, Coup bas et Transcendance : leur comparaison empirique est une étape distincte.
- Les objets de base anti-soin de faible coût ne sont pas encore modélisés : le catalogue utilisé contient les objets légendaires vérifiés. Ne pas prétendre recommander un composant inexistant dans notre catalogue.
- Les scores restent des comparaisons heuristiques et non des dégâts calculés sur une cible réelle.

## Validation

`node --test wrdi-antiheal-order-v169.test.js`, suite V14 à V16.8 et validation de la légalité des chemins.
