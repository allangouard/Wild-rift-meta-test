# V19.3 — Traitement du ZIP client Wild Rift (7 novembre 2026)

## Contenu confirmé de l'archive utilisateur

- Archive reçue dans la conversation : `Champ.zip` (environ 178 Mo compressés).
- **122 images JPEG originales, 3120 × 1440 px**, datées du 7 novembre 2026.
- Les écrans concernent quatorze champions qui manquaient au sélecteur : **Cho'Gath, K'Santé, Kog'Maw, Mel, Nidalee, Nocturne, Norra, Rell, Skarner, Smolder, Taliyah, Vel'Koz, Yunara et Zilean**.
- **Bard n'apparaît pas dans le ZIP.** La liste officielle Riot compte 142 champions selon le relevé précédent : 141 figurent désormais au catalogue local, Bard reste exclu.
- Les captures d'écran brutes ne sont **pas publiées sur GitHub**. Le fichier `data/wild-rift-screenshot-batch-v193.json` conserve les résumés et les plages d'indices des captures dans le ZIP.

## Méthode de traitement

Les descriptions ont été paraphrasées à partir des captures du **client Wild Rift mobile en français**, sans transposer les statistiques de League of Legends PC. Les cinq emplacements du moteur sont documentés (passif, A/Q, Z/W, E, R) pour chacun des 14 champions.

Les quatorze fiches apportent des **mécaniques identifiables et exploitables dans l'analyse qualitative** (soins personnels ou alliés, dégâts selon les PV max, dégâts bruts, boucliers, renvoi de projectiles, contrôle, transformation, etc.) et des descriptions source qualifiées dans `data/champion-ability-extract-official-v1.json`.

**Attention : les 70 descriptions de V19.3 sont des résumés structurés, pas des transcriptions intégrales des bulles client.** Seules les deux fiches précédentes (Hwei et Aurora) restent comptées comme « compétences actives intégralement validées par captures » dans le registre de couverture. Les 13 fiches résumées et la fiche de Nidalee avec variantes manquantes sont suivies séparément.

Les **valeurs numériques** de cette série ne sont ni certifiées pour le patch en cours ni autorisées pour une simulation de combat (`numericRatiosVerified:false`, `allowedForScoring:false`). Aucune affirmation sur les winrates n'est tirée des captures.

## Attention particulière

- **Nidalee** : les captures montrent son passif, Javelot, Guérilla, Charge primale et la transformation. Les détails en **forme couguar** ne sont pas présents dans la série. Seules les familles des variantes sont complétées à l'aide de la page officielle Wild Rift (https://wildrift.leagueoflegends.com/en-gb/champions/nidalee/), sans valeurs inventées.
- **Mel** : le renvoi de projectiles est une mécanique défensive spécifique, pas un bouclier absorbant des dégâts automatiquement classé comme anti-bouclier.
- **Rell** : son A/Q détruit les boucliers, ce qui n'équivaut pas à un bouclier qu'elle confère à ses alliés.
- **K'Santé / Zilean** : le bouclier octroyable à un allié figure dans les descriptions, à distinguer du bouclier personnel de Skarner.
- **Vel'Koz / Cho'Gath** : sources de dégâts bruts vérifiées qualitativement, sans dégâts calculés artificiellement.
- **Norra** : personnage exclusif Wild Rift ; aucune clé d'image issue de League PC n'est fabriquée, le sélecteur affiche son initiale en attendant une image de source sûre.

## Statut et suite

La validité technique des builds, runes et bottes est couverte par les tests automatiques, y compris un scénario Galio contre chacun des 14 champions. Elle ne prouve pas que le choix final d'objet est statistiquement optimal.

Prochain travail de précision : relever les tableaux numériques rang par rang, compléter les transformations de Nidalee, vérifier les patchs et fournir la fiche de **Bard** avec ses propres données Wild Rift.
