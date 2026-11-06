# V16.5 — moteur de synergies passives et chronologie des combats (Wild Rift uniquement)

## Pourquoi cette évolution

Le catalogue V16.4 contient les fiches chiffrées de 125 champions et 59 objets du client, mais le choix des objets favorisait encore trop facilement l'armure brute et les tags (« tank », « anti-soin ») sans valoriser les conditions réelles de leurs passifs. L'exemple de vérification demandé par l'utilisateur est :

- Alliés : **Fiora / Lillia / Galio / Samira / Alistar**.
- Adversaires : **Gnar / Vi / Lux / Lucian / Lulu**.
- Build de référence à comparer, jamais imposé : **Rayonnement du vide → Désespoir infini → Créateur de failles → Trident des Océanides → Gémeaux d'Amaranth**.

## Implémentation

Le nouveau module `wrdi-item-interactions-v165.js` lit directement `passives[].mechanics` et `stats` du catalogue client déjà intégré. Il ne possède pas de liste secrète des builds favoris.

- Scénarios **2,5 s** et **8 s**, avec hypothèses explicites de contact respectivement **35 %** et **65 %** ; ce ne sont pas des prévisions de durée ou de présence au contact.
- Conversion des PV bonus en AP avec Créateur de failles (**2 %** des PV bonus), et multiplicateur de Coiffe de Rabadon s'il est acheté.
- Calcul de l'immolation **20–30 + 1 % des PV bonus** par seconde lorsque Rayonnement est actif et Galio au contact ; le moteur affiche la plage **brute**, sans prétendre calculer des dégâts subis par une cible réelle.
- Désespoir : déclenchements temporels possibles à partir de **4 s** ; la fiche client actuelle encode **3 % des PV max propres du porteur** (et non les PV de la cible) ; on ne connaît pas les statistiques de base de Galio, ni les résistances adverses. L'outil chiffre seulement la contribution des PV bonus achetés et affiche le multiplicateur de soins. Ne pas projeter une valeur réelle de guérison.
- Amaranth : **5 charges à une par seconde**, et **+30 %** des résistances bonus au maximum, **20 % ténacité** ; les bonus de résistance affichés n'incluent pas les statistiques de base ni les autres interactions.
- Trident : taux de réduction des boucliers selon l'AP acquis, déclenchement seulement après dégâts de compétences.
- Cotte épineuse et Morellonomicon : passif Hémorragie explicitement dévalorisé quand aucun soin adverse significatif n'est identifié ; cela n'annule pas leurs statistiques, et une réévaluation est possible si les soins en partie deviennent importants.
- Randuin : protection contre dégâts **critiques physiques** uniquement ; Lucian à potentiel critique ne suffit pas à confirmer ses objets.
- Gantelet : déclenchement par **attaque de mêlée après un sort**, pas un simple sort ; ralentissement moins remarquable si Galio et ses alliés possèdent déjà plusieurs contrôles.
- Cœur gelé : valeur conditionnelle à la proximité et aux attaques ; résistances et densité AP/AD toujours évaluées par le module de couverture existant.
- Les bonus de combat prolongé et les statistiques de défense entrent tous deux dans le score, mais les scénarios ne représentent qu'une composante et ne prouvent jamais un optimum.

Le moteur d'achat évalue désormais **l'apport marginal de la combinaison après chaque achat**, et non seulement les cinq objets une fois complétés. L'interface expose les durées comparées, les chiffres vérifiables et les conditions. La chaîne de draft conserve sa vérification de la légalité des cinq objets et ses options situationnelles.

## Important — limites encore présentes

Le moteur n'a pas encore de simulation exacte des défenses, des statistiques de champion au niveau du combat, de la fréquence de contact réelle, des cibles touchées, de l'ordre de sorts ou de tous les procs. Les runes restent sélectionnées par logique de rôle plutôt que par optimisation chiffrée multi-cibles. Les builds et les résistances adverses ne sont pas connus avant la partie. Le modèle compare donc des opportunités **conditionnelles**, jamais des DPS réels, des soins garantis, des probabilités de victoire ou une méta mesurée.

## Régression obligatoire

`node --test wrdi-item-interactions-v165.test.js` vérifie la draft ci-dessus, l'absence de soin confirmé, les boucliers, la différence entre procs à 2,5 s et 8 s, la conversion 1 550 PV bonus → 31 AP additionnels, l'activation conditionnelle d'Amaranth, et la légalité du build sélectionné. La suite générale CI vérifie également le chargement dans l'application.

Le build de référence de l'utilisateur est comparé comme un candidat **à égalité** avec les autres combinaisons. Une différence de score doit être justifiable, pas effacée en imposant la préférence de l'utilisateur.
