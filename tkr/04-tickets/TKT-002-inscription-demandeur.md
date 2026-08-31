# TKT-002 — Inscription et profil du demandeur d'emploi

## Résultat

Un demandeur d'emploi peut créer un compte avec un profil professionnel réutilisable (compétences, expérience, disponibilité), condition préalable pour postuler à une annonce.

## Couverture des spécifications

- SPEC-002

## Critères d'acceptation

- [ ] Le formulaire d'inscription capture au minimum les compétences, l'expérience et la disponibilité.
- [ ] Une inscription complète crée un compte authentifié.
- [ ] Une tentative avec des identifiants déjà utilisés est refusée avec un message explicite, sans écraser le compte existant.
- [ ] Un demandeur d'emploi authentifié peut modifier son profil, et les candidatures futures utilisent la version à jour.

## Bloqué par

- Aucun

## Hypothèses et exclusions

- Ne couvre pas la candidature elle-même (TKT-005) ni la suppression de compte (TKT-015).
