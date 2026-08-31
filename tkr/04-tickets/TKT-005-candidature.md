# TKT-005 — Candidature d'un demandeur d'emploi à une annonce

## Résultat

Un demandeur d'emploi authentifié postule à une annonce depuis l'application ; son profil est transmis à l'employeur sans ressaisie.

## Couverture des spécifications

- SPEC-005

## Critères d'acceptation

- [ ] Un demandeur d'emploi authentifié avec un profil complet peut postuler à une annonce active ; la candidature est enregistrée et le profil transmis.
- [ ] Un visiteur non authentifié tentant de postuler est dirigé vers la création de compte, sans perdre son intention de candidature.
- [ ] Une candidature en double à la même annonce par le même demandeur est empêchée ou signalée comme déjà existante.
- [ ] Une candidature à une annonce archivée ou retirée par modération est refusée avec un message explicite.

## Bloqué par

- TKT-002 (compte et profil demandeur d'emploi requis)
- TKT-004 (une annonce doit exister pour y postuler)

## Hypothèses et exclusions

- Ne couvre pas le suivi de la candidature côté demandeur (TKT-006), la notification employeur (TKT-007), ni la gestion des candidatures côté employeur (TKT-008) — ce ticket couvre uniquement la création de la candidature.
