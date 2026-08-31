# TKT-015 — Suppression de compte et des données personnelles

## Résultat

Un utilisateur authentifié fait supprimer son compte et les données personnelles associées ; il ne peut plus s'authentifier ensuite.

## Couverture des spécifications

- SPEC-015

## Critères d'acceptation

- [ ] Un demandeur d'emploi qui supprime son compte ne peut plus s'authentifier et son profil n'est plus consultable par les employeurs.
- [ ] Un employeur qui supprime son compte voit ses annonces publiées cesser d'être visibles sur la carte publique.
- [ ] Une demande de suppression sur un compte déjà supprimé est explicitement indiquée comme telle, sans erreur ambiguë.

## Bloqué par

- TKT-002 (comptes demandeurs d'emploi à supprimer)
- TKT-003 (comptes employeurs à supprimer)

## Hypothèses et exclusions

- OQ-001 (cadre légal et politique de rétention précise) n'est pas résolue : le comportement exact pour les candidatures liées à un compte supprimé (conservation minimale à des fins de preuve de recrutement vs suppression totale) reste à confirmer avec la conseillère juridique avant l'implémentation de ce ticket.
