# TKT-011 — Modération des annonces par l'administration

## Résultat

Un administrateur consulte les annonces publiées et signalées, et peut retirer une annonce ou la maintenir en ligne.

## Couverture des spécifications

- SPEC-011

## Critères d'acceptation

- [ ] Une annonce signalée (TKT-010) et retirée par un administrateur disparaît immédiatement de la carte publique (TKT-001).
- [ ] Une annonce signalée jugée conforme peut être maintenue en ligne, et le signalement marqué comme traité.
- [ ] Une annonce retirée reste consultable par l'administrateur pour traçabilité, mais plus par les autres utilisateurs.

## Bloqué par

- TKT-004 (des annonces doivent exister pour être modérées)
- TKT-010 (les signalements alimentent la file de modération)

## Hypothèses et exclusions

- OQ-003 (workflow et volume de modération attendus au lancement) n'est pas résolue : ce ticket livre le comportement observable minimal (retirer/maintenir une annonce individuelle), pas un workflow de modération à grande échelle ni une revue systématique avant publication.
