# TKT-001 — Découverte publique des annonces sur la carte

## Résultat

Un visiteur, avec ou sans compte, peut parcourir les annonces géolocalisées actives sur une carte interactive et consulter leurs informations essentielles, sans aucune barrière d'inscription.

## Couverture des spécifications

- SPEC-001

## Critères d'acceptation

- [ ] La carte affiche les annonces actives de la zone géographique visible dès son chargement, sans invite de connexion.
- [ ] Déplacer ou zoomer la carte met à jour les annonces affichées pour la nouvelle zone.
- [ ] Une zone sans annonce active affiche un état vide explicite, pas une erreur.
- [ ] Le détail d'une annonce (intitulé, localisation approximative, employeur) est consultable sans connexion.

## Bloqué par

- Aucun

## Hypothèses et exclusions

- Peut être livré et démontré avec des annonces de test avant que TKT-004 (publication réelle par un employeur) ne soit livré.
- Ne couvre pas la publication d'annonces (TKT-004) ni le filtrage/tri avancé, non demandés par le brief.
