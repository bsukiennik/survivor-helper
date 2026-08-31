# TKT-014 — Archivage automatique des annonces après 30 jours

## Résultat

Une annonce publiée depuis plus de 30 jours disparaît automatiquement de la carte et des résultats de recherche, gardant le catalogue à jour.

## Couverture des spécifications

- SPEC-014

## Critères d'acceptation

- [ ] Une annonce publiée depuis exactement 30 jours n'apparaît plus dans les résultats de recherche.
- [ ] Une annonce archivée reste consultable par son employeur (TKT-009) avec ses statistiques finales, et par l'administration.
- [ ] Une candidature en cours sur une annonce archivée reste visible et son statut n'est pas perdu (TKT-006).

## Bloqué par

- TKT-001 (la carte/recherche doit exister pour refléter la disparition)
- TKT-004 (des annonces doivent exister pour être archivées)

## Hypothèses et exclusions

- Ne couvre pas de mécanisme de republication ou de prolongation d'une annonce archivée, non demandé par le brief.
