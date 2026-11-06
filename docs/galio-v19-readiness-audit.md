# V19 — Audit de stabilisation Galio (Wild Rift mobile)

Date de vérification : **7 novembre 2026**.

## État du patch
- Dernières notes Riot publiées : **7.3e**, le **4 novembre 2026**. Source : https://wildrift.leagueoflegends.com/fr-fr/news/game-updates/wild-rift-patch-notes-7-3e/
- Ces notes décrivent principalement des nouveautés d'optimisations **AAA ARAM**. Aucun rééquilibrage d'objets ou de runes de la Faille classique n'y est annoncé.
- Les **59 fiches d'objets** du moteur sont toujours des captures du client **7.3d**. Cela ne les transforme pas automatiquement en fiches vérifiées 7.3e.
- Les **runes** et **bottes** sont documentées par des captures, mais certains déclenchements restent non vérifiés en combat.

## Écarts relevés
1. `data/items-client-7.3d-v12.json` contient `do_not_automatically_load_into_build_recommendations: true`. Ce champ indique une validation d'intégration incomplète ; l'outil doit afficher un statut expérimental.
2. Le roster chargé contient **125 champions** et omet **Hwei** ; celui-ci est pourtant annoncé dans les notes Riot 7.3. Ne pas fabriquer d'identifiant ni masquer cette absence.
3. Les tests des trente drafts démontrent la **légalité** des objets et runes, la cohérence formelle des rôles et la protection des trois achats du core, **pas** la supériorité des builds contre d'autres recommandations.
4. Aucune statistique officielle comparable de winrate par build et draft n'est associée aux cinq objets proposés.
5. Le moteur ne connaît pas les objets achetés par les ennemis avant la partie ; la valeur d'anti-soin, anti-bouclier et pénétration reste conditionnelle.

## Mesure livrée
Le module `wrdi-galio-release-audit-v19.js` effectue un contrôle de provenance sur chaque analyse et produit un statut `experimental` ou `blocked`, sans masquer les recommandations et sans laisser croire que le patch est entièrement certifié.

## Critères de sortie pour qualifier le moteur de « ranked validé »
- Synchroniser et revérifier l'intégralité du catalogue d'objets, de runes, de bottes et des champions jouables sur le patch client utilisé.
- Documenter les interactions actives et passives par tests reproductibles.
- Confronter les propositions du moteur à des références indépendantes, et auditer les écarts par draft avant de mesurer la qualité des recommandations.
- Garder la distinction entre **tests de code verts**, **données à jour**, et **performance réelle**.
