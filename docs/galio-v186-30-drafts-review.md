# Wild Rift Draft Intelligence — validation Galio V18.6

**Source :** analyse automatique des 30 drafts de `data/galio-draft-reference-v186.json`, exécutées le 6 novembre 2026 sur le catalogue de fiches client 7.3d. Tests GitHub : https://github.com/allangouard/Wild-rift-meta-test/actions/runs/42310808100

## Périmètre et limites

- Dix compositions conçues pour Galio AP burst, dix pour Galio hybride et dix pour Galio tank/contrôle.
- Les cinq objets sont comparés avec les règles d’équipement client, le rôle, les compétences et les besoins de la draft ; les objets 4 et 5 sont réévalués en paire en protégeant le core de trois objets.
- Les bottes et runes proposées utilisent les trois options retenues pour Galio.
- **Ces résultats ne sont pas des builds statistiquement optimaux, ni des winrates, ni des mesures de dégâts réels.** Ce sont les décisions du moteur, à examiner par des joueurs expérimentés et à revérifier après chaque patch.
- Chaque ligne est un **instantané de diagnostic**, pas un résultat attendu figé : un futur correctif peut légitimement changer les objets.

## Bilan

- **30/30** drafts analysées avec cinq objets légalement achetables et des runes valides.
- **10/10** rôles AP burst, **10/10** hybrides, **10/10** tank/contrôle reconnus comme attendus.
- **17/30** builds utilisent le Trident des Océanides ; ce taux provient de compositions choisies pour les tests, **pas de la méta Wild Rift**.
- Les scénarios B02, H02, H08 et T08 ne recommandent plus de Trident pour un bouclier ne provenant que de l’excédent de soins de Soraka : sa pertinence est conditionnelle.

## Résultats détaillés

| Scénario | Rôle | Situation | Ordre des cinq objets | Bottes | Rune fondamentale | Pression boucliers (relative) |
|---|---|---|---|---|---|---:|
| B01 | AP burst | Boucliers utilitaires | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Morellonomicon → Trident des Océanides | Bottes de mana | Électrocution | 2 |
| B02 | AP burst | Soins alliés et sustain conditionnel | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Créateur de failles → Morellonomicon | Bottes de mana | Électrocution | 0.35 |
| B03 | AP burst | Contrôles et frontlines | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Créateur de failles → Fleur de crypte | Bottes de mana | Électrocution | 0.25 |
| B04 | AP burst | Protection et poke | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Morellonomicon → Trident des Océanides | Bottes de mana | Électrocution | 2 |
| B05 | AP burst | Tanks et boucliers | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Morellonomicon → Trident des Océanides | Bottes de mana | Électrocution | 2 |
| B06 | AP burst | Engagement mixte | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Créateur de failles → Morellonomicon | Bottes de mana | Électrocution | 0.5 |
| B07 | AP burst | Soins personnels et protection | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Morellonomicon → Trident des Océanides | Bottes de mana | Électrocution | 2 |
| B08 | AP burst | Mid contrôle et tank | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Morellonomicon → Trident des Océanides | Bottes de mana | Électrocution | 2 |
| B09 | AP burst | Deux tanks et dégâts AP prioritaires | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Créateur de failles → Morellonomicon | Bottes de mana | Électrocution | 0 |
| B10 | AP burst | Assassins et dégâts magiques | Écho de Luden → Coiffe de Rabadon → Orbe d’infini → Morellonomicon → Trident des Océanides | Bottes de mana | Électrocution | 2 |
| H01 | Hybride | Sustain d'équipe et mage | Rayonnement du vide → Désespoir infini → Créateur de failles → Tourment de Liandry → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| H02 | Hybride | Bruisers et soins collectifs | Rayonnement du vide → Désespoir infini → Créateur de failles → Cotte épineuse → Tourment de Liandry | Sandales de Mercure | Souverain des glaces | 0.6 |
| H03 | Hybride | Menace physique mobile | Rayonnement du vide → Désespoir infini → Cotte épineuse → Tourment de Liandry → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| H04 | Hybride | Mid assassin physique | Égide solaire → Désespoir infini → Cotte épineuse → Tourment de Liandry → Trident des Océanides | Coques en acier | Souverain des glaces | 2 |
| H05 | Hybride | Résistance et assassins | Rayonnement du vide → Désespoir infini → Créateur de failles → Tourment de Liandry → Sablier de Zhonya | Sandales de Mercure | Souverain des glaces | 0.25 |
| H06 | Hybride | Mage burst et ADC | Rayonnement du vide → Désespoir infini → Créateur de failles → Morellonomicon → Tourment de Liandry | Sandales de Mercure | Souverain des glaces | 0 |
| H07 | Hybride | Sustain contre soin personnel | Rayonnement du vide → Désespoir infini → Créateur de failles → Cotte épineuse → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| H08 | Hybride | Assassin contre sustain | Rayonnement du vide → Désespoir infini → Morellonomicon → Créateur de failles → Tourment de Liandry | Sandales de Mercure | Souverain des glaces | 0.85 |
| H09 | Hybride | Mage et frontline tank | Rayonnement du vide → Désespoir infini → Créateur de failles → Tourment de Liandry → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| H10 | Hybride | Mid assassin AP | Rayonnement du vide → Désespoir infini → Créateur de failles → Trident des Océanides → Tourment de Liandry | Sandales de Mercure | Souverain des glaces | 2 |
| T01 | Tank / contrôle | Besoin de frontline et CC | Égide solaire → Désespoir infini → Créateur de failles → Tourment de Liandry → Malédiction du sanguinaire | Coques en acier | Souverain des glaces | 0.25 |
| T02 | Tank / contrôle | Cibles fragiles à protéger | Rayonnement du vide → Désespoir infini → Créateur de failles → Gémeaux d’Amaranth → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| T03 | Tank / contrôle | Dégâts mixtes et kite | Rayonnement du vide → Désespoir infini → Cotte épineuse → Tourment de Liandry → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| T04 | Tank / contrôle | Peel et contrôle | Rayonnement du vide → Désespoir infini → Cotte épineuse → Tourment de Liandry → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| T05 | Tank / contrôle | Double tank adverse | Rayonnement du vide → Désespoir infini → Créateur de failles → Tourment de Liandry → Gémeaux d’Amaranth | Sandales de Mercure | Souverain des glaces | 0.25 |
| T06 | Tank / contrôle | Menace crit potentielle | Rayonnement du vide → Désespoir infini → Créateur de failles → Gémeaux d’Amaranth → Trident des Océanides | Sandales de Mercure | Souverain des glaces | 2 |
| T07 | Tank / contrôle | Dégâts physiques et mage | Rayonnement du vide → Désespoir infini → Créateur de failles → Trident des Océanides → Plaque du mort | Sandales de Mercure | Souverain des glaces | 2 |
| T08 | Tank / contrôle | Ligne arrière vulnérable | Rayonnement du vide → Désespoir infini → Créateur de failles → Cotte épineuse → Tourment de Liandry | Sandales de Mercure | Souverain des glaces | 0.6 |
| T09 | Tank / contrôle | Mobilité et critique | Rayonnement du vide → Désespoir infini → Créateur de failles → Cotte épineuse → Tourment de Liandry | Sandales de Mercure | Souverain des glaces | 0.25 |
| T10 | Tank / contrôle | Dégâts de zone et anti-tank | Rayonnement du vide → Désespoir infini → Créateur de failles → Cotte épineuse → Tourment de Liandry | Sandales de Mercure | Souverain des glaces | 0.25 |

## Critères de relecture humaine

1. Vérifier si les trois premiers achats répondent au véritable rôle de Galio, et pas seulement à un score de stat.
2. Comparer les quatrième et cinquième achats à **tous les objets pertinents** et examiner les conditions de déclenchement de leurs passifs.
3. Refuser les contres aux soins, boucliers ou critiques lorsqu’un ennemi ne peut activer qu'un effet rare ou conditionnel.
4. Vérifier l’adaptation des bottes et de la page de runes au matchup mid et aux cinq ennemis.
5. Rejouer les tests avec les données du patch Wild Rift réellement en vigueur avant de présenter un résultat comme actuel.
