# TKT-008 — Gestion des candidatures par l'employeur

## Résultat

Un employeur trie et gère les candidatures reçues sur ses annonces : changement de statut et accès aux informations de contact.

## Couverture des spécifications

- SPEC-008

## Critères d'acceptation

- [ ] Un employeur peut trier la liste de ses candidatures reçues, l'ordre affiché reflétant le tri choisi.
- [ ] Un employeur peut changer le statut d'une candidature ; le nouveau statut est reflété côté demandeur d'emploi (TKT-006).
- [ ] Un employeur ne peut consulter ou modifier que les candidatures reçues sur ses propres annonces.

## Bloqué par

- TKT-005 (des candidatures doivent exister pour être gérées)

## Hypothèses et exclusions

- Aucun ensemble de statuts n'est imposé par le brief ; la liste précise des statuts possibles reste à définir lors de la conception, pas dans ce ticket.
