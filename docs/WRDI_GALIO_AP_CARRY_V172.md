# Wild Rift Draft Intelligence V17.2 — Galio AP carry avec alliés tanks

## Problème reproduit

Alliés : Dr. Mundo, Amumu, Galio mid, Ashe, Leona.
Ennemis : Camille, Jarvan IV, Akali mid, Kai'Sa, Janna.

L'ancienne application choisissait Comète (car trois tanks alliés et aucun autre carry AP), **mais** proposait Rayonnement du vide → Désespoir infini → Créateur de failles → Trident → Liandry, sans Coiffe de Rabadon : le profil de rune et le profil des cinq objets n'obéissaient pas à la même stratégie.

## Correction de rôle

`wrdi-galio-five-item-optimizer-v1429.js` inclut désormais un calcul `offensiveDutyFit()` qui s'active lorsque les statistiques de draft indiquent :
- au moins deux premières lignes alliées ;
- responsabilité de dégâts magiques importante de Galio (`damageDuty >= 2`).

Ce calcul est une préférence **qualitative, pas un taux de victoire**. Il :
1. Utilise la **puissance effective** du catalogue client Wild Rift, avec multiplicateur de la Coiffe de Rabadon et conversion des PV bonus du Créateur de failles, plutôt que la puissance brute des objets seuls.
2. Récompense les objets AP et les passifs apportant de la pression offensive immédiate (Écho de Luden, Orbe d'infini), quand l'équipe possède déjà beaucoup de tanks.
3. Pénalise l'empilement inutile de deux résistances lourdes et le déficit de dégâts du seul carry magique ; il conserve les protections réellement nécessaires face à Akali ou d'autres menaces.
4. Réduit le bonus de synergie du core Rayonnement + Désespoir + Créateur **uniquement lorsque Galio doit assumer le rôle de carry AP**.
5. Traite le passif de Liandry en % des PV max comme potentiellement utile, mais n'en fait plus un achat supérieur par défaut à un multiplicateur de dégâts / burst quand il n'y a pas plusieurs tanks ennemis.

Ce rôle est déterminé par les dix champions, **pas par une présélection figée de Rabadon**. Les builds hybrides demeurent disponibles si l'équipe a besoin de l'engagement de Galio.

## Test sur la draft signalée

Après correction, la sélection de cinq objets est :
- Désespoir infini ;
- Créateur de failles ;
- Trident des Océanides ;
- Orbe d'infini ;
- Coiffe de Rabadon.

Ordre proposé : **Désespoir → Trident → Créateur → Orbe → Rabadon**. Le Trident répond potentiellement aux boucliers de Janna ; une résistance mixte (Désespoir) contribue à la sécurité contre Akali et Jarvan. Les objectifs de burst sont satisfaits sans les deux premiers objets tank défensifs précédemment retenus.

Statistiques **des objets et passifs seulement**, sans AP de base / niveaux / cible : 390 AP bruts et 529,1 AP après conversion PV → AP du Créateur puis multiplication ×1,30 de Rabadon.

Cette comparaison ne prédit pas les dégâts effectivement infligés : les résistances, touches réelles, timings de sorts et autres passifs ne sont pas tous simulés.

## Vérifications

`wrdi-galio-ap-carry-v172.test.js` vérifie :
- les trois tanks alliés et l'absence de carry AP secondaire ;
- la prise en compte du multiplicateur Rabadon ;
- la sélection d'au moins un objet de burst, de Rabadon, et au plus une pièce défensive lourde dans cette draft ;
- un Rabadon choisi comme puissance de fin de build et non comme premier achat aveugle ;
- la supériorité relative de Rabadon sur Liandry pour des configurations de burst contre des compositions sans deux vrais tanks ;
- la disponibilité permanente de Galio hybride quand l'équipe n'a pas déjà la première ligne.

Le moteur de draft reporte désormais les choix de rôle dans les notes visibles et utilise la puissance effective pour les calculs de runes.
