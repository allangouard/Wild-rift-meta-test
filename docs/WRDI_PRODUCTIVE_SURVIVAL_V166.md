# Wild Rift Draft Intelligence V16.6 — survivre pour rester dangereux

Cette version ajuste l'optimiseur Galio pour son rôle d'**engageur offensif au contact** : protéger ses PV est utile si cela lui permet de provoquer, contrôler, infliger des dégâts en zone et maintenir des effets actifs, pas simplement parce qu'un objet donne beaucoup d'armure.

## Faits conservés du catalogue client 7.3d

- **Désespoir infini :** 300 PV, 40 armure, 40 RM, 10 accélération. Passif chiffré : déclenchement toutes les quatre secondes de combat, dégâts et soin selon les conditions de la fiche. La formule numérique dans la fiche client existante indique `0.03 * own_max_hp`. Nous ne remplaçons ni ne présumons des PV de base absents ; les dégâts et soins réels restent inconnus.
- **Cœur gelé :** 80 armure, 400 mana, 20 accélération ; aura de réduction de vitesse d'attaque de 25 %. Pas de passif infligeant directement des dégâts.
- **Rayonnement du vide, Créateur de failles, Trident, Amaranth** : mécanismes chiffrés déjà extraits, toujours utilisés.
- L'effet de Cœur gelé est **défensif indirect**, pas inutile ; son intérêt augmente lorsque les attaques rapides deviennent réellement menaçantes.

## Nouveau module

`wrdi-productive-survival-v166.js` identifie dans chaque fiche client :

1. Une défense exploitable : PV, résistances, accélération.
2. Des dégâts au contact, des dégâts périodiques, une source de soin conditionnelle aux dégâts ou une amplification des dégâts.
3. Le besoin réel de rester engagé assez longtemps : scénario court (2,5 secondes), prolongé (8 secondes).
4. Une utilité de contre-mesure spécifique : aura anti-vitesse d'attaque et résistance aux critiques, qui ne sont pleinement valorisées que lorsque la menace est confirmée.

Le score de **survie productive** est ajouté au classement des cinq objets ; il n'est pas présenté comme des dégâts par seconde. Il ne prédit ni les cibles touchées, ni le nombre de sorts lancés ni les PV effectivement rendus. Les résistances conservent une valeur propre : lorsque les dommages physiques deviennent véritablement extrêmes, les achats défensifs spécifiques peuvent surpasser la pression offensive.

La chronologie d'achat valorise surtout la synergie défensive/offensive au deuxième et troisième achat, mais garde un premier achat de lane adapté au mid adverse. Un nouveau scénario de remplacement prépare Cœur gelé si l'**attaque rapide adverse est confirmée**.

## Cas de référence utilisateur

Alliés : Fiora, Lillia, Galio, Samira, Alistar. Adversaires : Gnar, Vi, Lux, Lucian, Lulu.

La combinaison Rayonnement → Désespoir → Créateur de failles → Trident → Amaranth est une référence à comparer, **pas** une réponse imposée. Les premiers tests font ressortir Désespoir dans le classement principal, même si le moteur conserve le droit de préférer un cinquième objet offensif comme Liandry. Pour cet ensemble fixe, l'ordre d'achat évalué commence par **Rayonnement → Désespoir → Créateur de failles**.

Les protections contre les attaques rapides de Lucian et Gnar sont des **conditions à observer en partie** ; ni les compétences de ces champions ni un potentiel de critique ne prouvent leur build effectif.

## Validation

`node --test wrdi-productive-survival-v166.test.js` vérifie les profils d'objets, la différence entre combats courts/prolongés, les arbitrages Désespoir vs Cœur gelé, les contres conditionnels, la validité des cinq objets et l'ordre d'achat. La suite CI conserve les tests précédents V14 à V16.5.

## Limite

Le moteur améliore le **raisonnement mécaniste**, mais n'est toujours pas un simulateur de dégâts réels. Les statistiques de base aux niveaux précis, armure/RM des ennemis, résistances des cibles, durées garanties d'immobilisation, rythmes de procs, nombre de cibles touchées, santé récupérée et équipement réel des adversaires restent à connecter.
