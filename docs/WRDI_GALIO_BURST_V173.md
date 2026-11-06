# WRDI V17.3 — Galio burst AP : Luden, Coiffe de Rabadon, Orbe d'infini

## Retour du joueur

La V17.2 détectait bien **Comète arcanique** et le rôle d'AP carry lorsque Mundo, Amumu et Leona constituent déjà la première ligne, mais donnait Désespoir infini et une logique d'engagement prolongé à un Galio censé **arriver, infliger de très gros dégâts, puis sortir ou finir les cibles**.

L'utilisateur a fourni un extrait de statistiques chinoises montrant le trio **Écho de Luden → Coiffe de Rabadon → Orbe d'infini**, 49,5 % WR et 11,88 % d'utilisation pour le groupe affiché. Cet échantillon partiel ne prouve **ni une supériorité statistique ni le winrate individuel de chaque objet**. Il sert de scénario de validation, pas de source de poids automatique.

## Décision codée

La distinction entre deux stratégies Galio est désormais **opérationnelle, dans les cinq objets et dans leur ordre** :
- **AP burst :** Galio est le carry magique principal, déjà entouré de deux ou trois frontliners. Les effets à paiement immédiat (Luden), multiplication de puissance (Rabadon) et exécution sur cible sous 40 % PV (Orbe d'infini) sont valorisés comme un **ensemble de trois synergies**. Chaque effet reste soumis à ses conditions de déclenchement.
- **Hybride tank/AP :** Galio est engagé dans un combat de proximité prolongé et doit produire dégâts/contrôle/sustain. Rayonnement, Désespoir, Créateur ou Cotte sont évalués selon les besoins, sans changer de stratégie automatiquement à cause d'un seul adversaire.

Le mode burst **réduit fortement les primes de survie productive et de passifs périodiques** : un soin après quatre secondes ne remplace pas du burst disponible au moment où Galio arrive. Une résistance de secours reste possible si une menace réelle le justifie, mais n'est plus l'investissement de base.

Les valeurs des objets sont lues dans le catalogue utilisateur Wild Rift 7.3d :
- Luden : 100 AP, 10 accélération, 500 mana ; effet blessant **75 + 8 % AP**, bonus conditionnels sur cibles secondaires, récupération 9 s.
- Rabadon : 130 AP, **+30 % AP total**.
- Orbe d'infini : 110 AP, 15 pénétration magique fixe, bonus dégâts sur compétences/attaques renforcées si cible **sous 40 % PV**.

### Test de bout en bout sur la draft de capture

Alliés : Dr. Mundo / Amumu / Galio / Ashe / Leona.
Ennemis : Camille / Jarvan IV / Akali / Kai'Sa / Janna.

La V17.3 retient désormais :
**Écho de Luden → Coiffe de Rabadon → Orbe d'infini → Créateur de failles → Trident des Océanides**, avec protection conditionnelle à part. Pas de Désespoir, pas d'Amaranth.

Le Trident est utile contre les boucliers de Janna sans remplacer les trois effets de burst ; Créateur complète l'AP et les dégâts, même si son amplification progressive ne constitue pas la priorité de l'engagement.

Le moteur garde les règles de sécurité : les builds restent à cinq objets légaux ; le core n'est pas forcé en Galio hybride. Les statistiques finales et les passifs sont calculés selon les fiches client, pas des dégâts réels sur cibles dont les résistances ne sont pas connues.

## Validation

`wrdi-galio-full-burst-v173.test.js` vérifie le choix des trois pièces en première, deuxième et troisième position, la distinction dégâts instantanés / sustain après quatre secondes, le maintien du Trident contre Janna et la possibilité du style hybride dans les drafts sans frontline préexistante. Suite CI complète.
