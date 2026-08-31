# TKT-012 — Activation ou suspension de comptes par l'administration

## Résultat

Un administrateur active ou suspend un compte demandeur d'emploi ou employeur ; un compte suspendu perd l'accès aux actions authentifiées.

## Couverture des spécifications

- SPEC-012

## Critères d'acceptation

- [ ] Un administrateur peut suspendre un compte actif ; son titulaire ne peut plus candidater (TKT-005) ni publier d'annonce (TKT-004).
- [ ] Un administrateur peut réactiver un compte suspendu ; son titulaire retrouve l'accès aux actions authentifiées.
- [ ] Une tentative de suspension d'un compte déjà suspendu est sans effet ou explicitement indiquée comme déjà appliquée.

## Bloqué par

- TKT-002 (comptes demandeurs d'emploi à gouverner)
- TKT-003 (comptes employeurs à gouverner)

## Hypothèses et exclusions

- L'application de la suspension à travers les autres tickets (TKT-004, TKT-005, TKT-008) est un critère transverse ; les tickets concernés peuvent être livrés avant TKT-012 avec cette vérification ajoutée à sa livraison.
