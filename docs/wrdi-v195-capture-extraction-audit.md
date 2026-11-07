# V19.5 — Audit de transcription numérique des captures Wild Rift

## Réception et méthode

Archive utilisateur **Champ.zip** : 122 JPEG du client Wild Rift FR, empreinte SHA-256 `57d87f830d7955c9155d1bc00e8a43d66a375be55d9c78cb9b859222c7c7a505` (178 369 883 octets).

Les **tableaux par rang visibles** ont été examinés directement et retranscrits manuellement. Le rang 1 seul est conservé quand les captures ne montrent pas les autres rangs. Le **passif, les ratios visibles, les déclenchements actifs et les conditions** ont été relevés séparément.

Fichiers à consulter :
- `data/wild-rift-client-rank-tables-v195.json` — **149 lignes / 561 valeurs numériques** ; chaque ligne possède son index de capture.
- `data/wild-rift-client-tooltip-facts-v195.json` — **70 emplacements de compétences** et **70 ratios AP/AD/PV observés**, indexés sur les captures.
- `wrdi-client-numeric-evidence-v195.js` — contrôle des indices, rangs et coefficients ; restitue la couverture dans la draft et l’interface.

### Inventaire par champion

| Champion | Emplacements avec tableaux | Lignes | Valeurs par rang | Coefficients visibles | Captures consultées (indices du ZIP) |
|---|---:|---:|---:|---:|---|
| Cho'Gath | 4/4 actifs | 13 | 48 | 5 | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| K'Sante | 4/4 actifs | 12 | 44 | 4 | 10, 11, 12, 13, 14, 15, 16, 17, 18 |
| Kog'Maw | 4/4 actifs | 12 | 44 | 4 | 19, 20, 21, 22, 23, 24, 25, 26, 27 |
| Mel | 4/4 actifs | 18 | 67 | 7 | 28, 29, 30, 31, 32, 33, 34, 35, 36 |
| Nidalee | 1/4 actifs | 3 | 12 | 5 | 37, 39, 40, 41, 42, 43 |
| Nocturne | 3/4 actifs | 10 | 38 | 4 | 44, 45, 46, 47, 48, 49, 50, 51 |
| Norra | 4/4 actifs | 10 | 38 | 4 | 52, 53, 54, 55, 56, 57, 58, 59 |
| Rell | 4/4 actifs | 8 | 30 | 4 | 60, 61, 62, 63, 64, 65, 66, 67, 68 |
| Skarner | 4/4 actifs | 12 | 46 | 5 | 69, 70, 71, 72, 73, 96, 97, 98, 99 |
| Smolder | 4/4 actifs | 12 | 44 | 10 | 74, 75, 76, 100, 101, 102, 103, 104, 105 |
| Taliyah | 3/4 actifs | 7 | 28 | 4 | 77, 78, 79, 106, 108, 109, 110 |
| Vel'Koz | 4/4 actifs | 13 | 50 | 6 | 80, 81, 82, 83, 84, 112, 113, 114, 115 |
| Yunara | 4/4 actifs | 8 | 31 | 5 | 85, 86, 87, 88, 89, 116, 117, 118, 119 |
| Zilean | 4/4 actifs | 11 | 41 | 3 | 90, 91, 92, 93, 94, 95, 120, 121, 122 |

Total : **149 lignes**, **561 cellules de rang** et **70 coefficients sourcés**.

## Exemples d'informations capturées

- Cho'Gath A/Q **Rupture** : base **80 / 135 / 190 / 245**, ratio **100 % AP** relevé dans l'infobulle du rang 1.
- Kog'Maw Z/W **Barrage bio-arcanique** : **1,5 / 2,5 / 3,5 / 4,5 % des PV max** de la cible, bonus de portée **90 / 120 / 150 / 180**.
- Mel Z/W **Réfutation** : **40 / 45 / 50 / 55 %** de dégâts renvoyés par projectile ; l'invulnérabilité n'est pas confondue avec un bouclier ordinaire.
- Rell A/Q **Frappe dislocatrice** : dégâts magiques **70 / 130 / 190 / 250** et destruction des boucliers.
- Smolder R **Mamaaan !** : dégâts de base **200 / 300 / 400**, dégâts au centre **300 / 450 / 600**, soins de base **100 / 135 / 170**.
- Zilean R **Retour temporel** : soin de réanimation **600 / 850 / 1 100** ; fonction de résurrection conditionnelle.
- Nidalee : **forme humaine** relevée ; les niveaux manquants et les variantes de couguar ne sont pas reconstitués par analogie avec League of Legends PC.

## Niveaux de confiance distincts

1. **Capture identifiée, valeur lue** : lignes de tableau et ratios tels qu’affichés à la date de capture.
2. **Formule applicable à tous les rangs** : non prouvée lorsque seul le ratio du rang 1 est visible ; les coefficients ne sont **pas extrapolés**.
3. **Patch exact et compatibilité aujourd'hui** : non établis par les captures ; le numéro de patch n'apparaît pas sur ces écrans.
4. **Déclenchement réel, résistance, dégâts finaux** : nécessitent un moteur de combat vérifié indépendamment ; **aucune de ces 70 formules n'est promue automatiquement à la simulation**.

Les tests portent sur la correspondance des 14 fiches, l'intégrité de leurs valeurs et leur utilisation **documentaire** dans les drafts Galio. Ils ne prouvent pas un build optimal.

## Correctif technique associé

Avant V19.5, l’application exigeait incorrectement que le catalogue numérique Wiki WR (125 champions) ait **exactement** le même nombre de champions que le sélecteur (142), ce qui pouvait bloquer le chargement. Elle accepte désormais un catalogue numérique partiel dès lors qu’il est valide et garde les données absentes explicitement inconnues.
