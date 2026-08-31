# TKT-010 — Signalement d'une annonce frauduleuse ou non conforme

## Résultat

Tout utilisateur, avec ou sans compte, peut signaler une annonce publiée ; le signalement alimente la file de modération de l'administration.

## Couverture des spécifications

- SPEC-010

## Critères d'acceptation

- [ ] Un utilisateur peut signaler une annonce publiée ; le signalement apparaît dans la file de modération (TKT-011).
- [ ] Une annonce déjà signalée par un autre utilisateur peut recevoir un second signalement sans que le premier soit écrasé.
- [ ] Un signalement sans annonce cible valide est rejeté.

## Bloqué par

- TKT-004 (une annonce doit exister pour être signalée)

## Hypothèses et exclusions

- Ne couvre pas le traitement du signalement (TKT-011), uniquement sa création.
