# TKT-003 — Inscription et vérification employeur

## Résultat

Un employeur peut créer un compte, condition préalable pour publier une annonce, avec un statut de vérification d'activité visible.

## Couverture des spécifications

- SPEC-003

## Critères d'acceptation

- [ ] Le formulaire d'inscription capture les informations nécessaires à une vérification d'activité.
- [ ] Une inscription complète crée un compte employeur.
- [ ] Un compte nouvellement créé affiche un statut « en attente de vérification » tant que la vérification n'est pas confirmée, plutôt qu'un échec silencieux.
- [ ] Un compte suspendu (TKT-012) ne peut pas publier d'annonce ; la tentative est refusée avec un message explicite.

## Bloqué par

- Aucun

## Hypothèses et exclusions

- OQ-002 (mécanisme exact de vérification d'activité) n'est pas résolue : ce ticket implémente l'hypothèse par défaut retenue dans les specs — vérification déclarative avec revue admin — à raffiner si le Ministère précise un autre mécanisme (ex. registre externe).
- Ne couvre pas la publication d'annonce elle-même (TKT-004).
