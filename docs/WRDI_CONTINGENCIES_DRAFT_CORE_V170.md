# V17.0 — alternatives liées à la vraie draft et protection du core

## Signalement du joueur

Dans la draft Aatrox / Master Yi / Galio / Caitlyn / Brand contre Darius / Jarvan IV / Ahri / Jhin / Karma, le panneau proposait un remplacement de **Créateur de failles** par **Cœur gelé**, avec un libellé parlant de **Lucian ou Gnar** alors que ces champions sont absents.

## Origines des bugs

1. Une condition d'attaque rapide contenait les noms « Lucian ou Gnar » écrits en dur dans `wrdi-galio-contingencies-v1433.js`.
2. Le moteur de substitutions essayait chacun des cinq objets comme sacrifice possible, sans distinguer le **core de départ**, les achats déjà prévus ni les objets réellement situationnels.
3. Le moteur de build et l'ordre d'achat avaient des représentations distinctes. Pour protéger les trois premiers objets, il faut passer au module l'ordre réel recommandé par le planificateur, pas utiliser l'ordre du set retourné par l'optimiseur.

## Corrections V17.0

- L'analyse transmet les cinq **ennemis réellement sélectionnés** et leur profil Wild Rift au moteur de substitutions.
- Une condition « attaques rapides » n'est proposée que si un ennemi réel possède un profil de vitesse d'attaque / on-hit connu et pertinent. Le libellé cite **exclusivement ces ennemis**, jamais des adversaires issus d'une ancienne draft. Les tags restent des possibilités de kit, pas une affirmation sur leurs achats.
- Le moteur protège les trois premiers objets **dans l'ordre d'achat réel**. Si Créateur de failles figure dans le build, il est également protégé même si l'ordre heuristique le décale vers la quatrième place.
- Les alternatives respectent toujours la légalité des cinq objets et ne concernent que des remplacements tardifs. Un core est protégé comme un invariant, pas seulement par un malus heuristique dans le score.
- Actualisation des versions des scripts et du cache de l'application, pour ne pas continuer à montrer l'ancienne condition codée en dur.

## Test sur la draft de référence

Le test V17.0 renvoie :
- Cinq objets : Créateur de failles, Rayonnement, Désespoir, Trident, Gantelet givrant (ensemble non ordonné).
- Achat réel : **Rayonnement → Désespoir → Créateur de failles → Trident → Gantelet givrant**.
- Protection : **Rayonnement, Désespoir, Créateur de failles**.
- Alternatives : critiques confirmés : Gantelet → Randuin ; dégâts magiques réellement dominants : Gantelet → Amaranth ; tanks devenant prioritaires : Gantelet → Liandry.
- **Aucun texte « Lucian ou Gnar »**, aucune suggestion Cœur gelé non justifiée par la draft réelle, aucun retrait de Créateur de failles.

## Limites

- Il s'agit de scénarios de remplacement **avant la partie**, pas d'observations automatiques en cours de partie.
- Les noms des archétypes d'attaque rapide sont indicatifs : le build adverse réel doit être constaté.
- L'optimiseur principal peut encore choisir un set différent ; V17.0 corrige le **module de remplacement**, pas un préverrouillage universel et aveugle du build.
- La distinction entre les trois premiers et les deux derniers objets est actuellement une règle de stratégie Galio hybride et devra être réévaluée pour d'autres champions ou configurations extrêmes.
