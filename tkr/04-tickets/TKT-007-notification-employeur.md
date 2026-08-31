# TKT-007 — Notification employeur à chaque candidature

## Résultat

Un employeur est notifié à chaque nouvelle candidature reçue sur l'une de ses annonces, référençant l'annonce et la candidature concernées.

## Couverture des spécifications

- SPEC-007

## Critères d'acceptation

- [ ] Une candidature soumise à une annonce déclenche une notification pour l'employeur propriétaire, référençant l'annonce et la candidature.
- [ ] Plusieurs candidatures rapprochées sur la même annonce déclenchent une notification pour chacune, sans perte.
- [ ] Un échec d'envoi de la notification ne remet pas en cause la validité de la candidature enregistrée (TKT-005).

## Bloqué par

- TKT-005 (une candidature doit être créée pour déclencher une notification)

## Hypothèses et exclusions

- Ne couvre pas le canal de notification (email, in-app, etc.), laissé ouvert pour `/tkr-architecture`.
