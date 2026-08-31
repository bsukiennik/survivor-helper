# Tickets de mission

- Créé le : 2026-08-31
- Specs source : `../03-specs.md`

| Ticket | Résultat livré | Couvre | Bloqué par |
|---|---|---|---|
| TKT-001 | Découverte publique des annonces sur la carte, sans compte | SPEC-001 | Aucun |
| TKT-002 | Inscription et profil du demandeur d'emploi | SPEC-002 | Aucun |
| TKT-003 | Inscription et vérification employeur | SPEC-003 | Aucun |
| TKT-004 | Publication d'une annonce géolocalisée visible sur la carte | SPEC-004 | TKT-001, TKT-003 |
| TKT-005 | Candidature d'un demandeur d'emploi à une annonce | SPEC-005 | TKT-002, TKT-004 |
| TKT-006 | Suivi des candidatures par le demandeur d'emploi | SPEC-006 | TKT-005 |
| TKT-007 | Notification employeur à chaque candidature | SPEC-007 | TKT-005 |
| TKT-008 | Gestion des candidatures par l'employeur (tri, statut, contact) | SPEC-008 | TKT-005 |
| TKT-009 | Tableau de bord employeur (vues, candidatures) | SPEC-009 | TKT-004 |
| TKT-010 | Signalement d'une annonce frauduleuse/non conforme | SPEC-010 | TKT-004 |
| TKT-011 | Modération des annonces par l'administration | SPEC-011 | TKT-004, TKT-010 |
| TKT-012 | Activation/suspension de comptes par l'administration | SPEC-012 | TKT-002, TKT-003 |
| TKT-013 | Tableau de bord de métriques nationales | SPEC-013 | Aucun |
| TKT-014 | Archivage automatique des annonces après 30 jours | SPEC-014 | TKT-001, TKT-004 |
| TKT-015 | Suppression de compte et des données personnelles | SPEC-015 | TKT-002, TKT-003 |

Coverage: 15/15 spécifications.

TKT-001 à TKT-004 forment le socle P0 (livrable POC semaine 1). TKT-005 à TKT-015 forment le périmètre P1 (livraison semaine 2).

Questions ouvertes affectant certains tickets (voir `../03-specs.md`) :
- OQ-001 (cadre légal/rétention des données) affecte TKT-015.
- OQ-002 (mécanisme de vérification employeur) affecte TKT-003 — ticketé avec l'hypothèse par défaut « déclaratif + revue admin ».
- OQ-003 (workflow/volume de modération) affecte TKT-011 — ticketé pour le comportement observable minimal (retirer/maintenir).
- OQ-004 (calendrier fixe ou non) conditionne la priorisation P0/P1 ci-dessus, pas un ticket en particulier.
