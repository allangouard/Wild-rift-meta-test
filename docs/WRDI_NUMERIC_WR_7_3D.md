# Catalogue numérique Wild Rift — V16.2 (collecte et calcul)

## Périmètre vérifiable

- **Jeu : Wild Rift mobile seulement.** Les URLs des compétences sont systématiquement `/en-us/WR%3A...`. Aucune page League of Legends PC n’est autorisée.
- **125 champions actuellement présents dans l’application**, avec cinq compétences chacun (625 entrées).
- **2 104 champs de statistiques** et **1 109 formules quantitatives** extraites des tableaux du Wiki WR. Le collecteur conserve également les nombres présents dans les descriptions de passifs et autres effets qui ne possèdent pas de tableau propre.
- **Source originale immuable :** `data/champion-ability-numeric-wiki-wr-v1.json`, avec chaque URL, valeurs et détails extraits, marqués comme donnés par une source externe non vérifiée au patch exact.
- **Correctifs Riot distincts :** `data/wr-champion-numeric-patch-overrides-v1.json`. Une correction n’est appliquée que si la valeur « avant » est identique. Une divergence est consignée et son champ écarté des calculs jusqu’à vérification.
- **Journal de patchs :** `data/wr-riot-quantitative-patch-register-7.3d.json` conserve les modifications chiffrées signalées par Riot des patchs 7.2d, 7.3, 7.3a, 7.3b, 7.3c et 7.3d. L’association automatique à un champion et une compétence ne vaut pas validation; ces changements **ne sont pas tous appliqués**.

## Intégration réelle

`wrdi-numeric-kits-v162.js` charge la base WR, réconcilie le registre de correctifs, et calcule seulement les formules linéaires vérifiables : base au rang choisi, bonus AP et dégâts directs avant résistances. Les formules conditionnelles, cumulatives, les dégâts en % de PV, les soins/boucliers complexes et les déclenchements ne sont pas simulés sans variables ou règles appropriées.

L’analyse de draft lit les fiches numériques des dix champions. Pour Galio, le modèle A + Z + E (rangs d’exemple 4/1/4) calcule les dégâts directs et leur variation avec l’AP des objets. Cette variation devient un facteur **modéré** du score si Galio doit apporter des dégâts. Le profil de rangs est une convention de comparaison et non un ordre de compétences imposé. Le moteur ne déduit aucun chiffre d’une fiche PC.

## Points non terminés / à contrôler

1. Les premières sources donnent **125/125 fiches de notre ancien roster**, mais ce roster doit être comparé aux champions Wild Rift actuellement disponibles. On ne présente pas 125 comme le nombre universel de champions.
2. Certaines valeurs du Wiki sont antérieures aux modifications Riot : Syndra Q, Z, E étaient un exemple confirmé, et l’ultime de Lee Sin diffère aussi de la valeur « avant » des notes 7.3d.
3. Les modifications de patch 7.3 et intermédiaires doivent toutes être rapprochées des lignes précises, sans supposer que les anciennes valeurs du Wiki sont à jour.
4. Les valeurs de sorts ne suffisent pas à simuler toutes les conditions (touches multiples, cibles, portée, rang, HP, résistances, formes, buffs), ni à prouver mathématiquement un build optimal.
5. Une vérification chiffrée avec les captures client demeure la référence finale pour les conflits identifiés.

**Politique :** les valeurs sources ne sont jamais écrasées ; les ajustements officiels et leur résultat (appliqué / déjà à jour / divergence) sont conservés distinctement.

Actualisation complémentaire : extraction des valeurs numériques intégrées aux descriptions de passifs et index de modifications officielles, sans ajout de données PC.
