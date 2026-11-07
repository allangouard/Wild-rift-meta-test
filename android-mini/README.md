# WR Draft Mini — prototype Android flottant (0.1)

Ce dossier est **séparé du moteur Wild Rift Draft Intelligence**. Aucun script de calcul ni aucune fiche champion/objet/rune du site n'est modifié.

## Fonctionnalités du prototype
- Démarrage **manuel** depuis l'application Android
- Permission Android « Afficher par-dessus les autres applications »
- Bulle déplaçable par glissement
- Appui sur la bulle : fenêtre flottante
- Bouton **−** : réduction en bulle
- Bouton **×** : fermeture complète, suppression de la superposition et arrêt du service
- Action **Fermer** depuis la notification du service
- Site Wild Rift Draft Intelligence **actuel** chargé en WebView HTTPS
- Présentation CSS compacte **5 alliés / 5 adversaires** ; résultat repris tel quel depuis le site
- Aucune lecture du jeu, aucune reconnaissance d'écran, aucune automatisation

## Lancer
1. Ouvrir le dossier `android-mini/` dans Android Studio avec Android SDK 35 et JDK 17.
2. Utiliser Gradle 8.11.1+ compatible avec Android Gradle Plugin 8.9.2.
3. Lancer l'application sur un **véritable téléphone Android**.
4. Accorder l'autorisation de superposition dans les paramètres système.
5. Appuyer sur « Ouvrir WR Draft Mini », puis ouvrir Wild Rift.
6. Réduire avec **−**, déplacer la bulle, rouvrir d'un appui, fermer avec **×**.

## Points à valider avant une version publique
- Test de compilation et d'installation Android (aucun APK généré ici)
- Contrôle réel de l'overlay sur Samsung / Android 17 et interaction avec Wild Rift
- Comportement du clavier en fenêtre flottante, perte éventuelle de focus du jeu
- Optimiser la taille/position par appareil, orientation et éventuelles zones de sécurité
- Ne pas supposer que le système ou Wild Rift autorise toujours une superposition
- Mise en cache stable/fiable du site actuel et gestion de perte réseau
- Sécuriser le chargement WebView (navigation restreinte, contrôle des ressources et domaine de confiance)
- Examiner conditions d'utilisation Riot et règles éventuelles de distribution Play Store, notamment `foregroundServiceType="specialUse"`
- Ajouter des tests instrumentés et une CI Android

## Important
Ce projet est une **base technique**, pas un APK prêt à utiliser, ni une garantie de compatibilité en jeu. Le moteur calcule uniquement si la page web chargée fonctionne. Les recommandations et données proviennent de cette page. La fenêtre flottante ne détecte pas automatiquement le début d'une draft.

L'overlay permet de fermer entièrement la fenêtre : le bouton **×** appelle `stopSelf()`, et le service retire toutes les vues dans `onDestroy()`.

## Lien avec le site actuel
`OverlayService.APP_URL` pointe sur la branche `main` du projet, qui doit rester publiée en HTTPS. La surcouche CSS injectée ne change pas les données ou le raisonnement du moteur.
