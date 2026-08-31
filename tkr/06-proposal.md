# Proposition de prix

- Créé le : 2026-08-31
- Validité : 30 jours (confirmé par l'utilisateur pour ce brouillon — voir Validation commerciale et de domaine)
- Artefacts source : `CONFIG.md`, `01-analysis.md`, `02-prd.md`, `03-specs.md`, `04-tickets/README.md`, `05-architecture/Architecture.md`
- Base de tarification : JEH (jour-équivalent), taux approuvé de 400 € dans `tkr/CONFIG.md`

## Résultat proposé

GéoEmploi est une application web géolocalisée mettant en relation demandeurs d'emploi et employeurs, complémentaire aux dispositifs nationaux existants (FranceTravail, Apec). La mission livre, en deux paliers correspondant aux deux revues du brief, un socle démontrable (carte publique, création de compte des deux côtés, publication d'une première annonce géolocalisée), puis l'ensemble du périmètre fonctionnel demandé : candidature en un geste, suivi des candidatures, notifications, tableaux de bord employeur et national, modération et signalement, gouvernance des comptes, et suppression de compte conforme.

## Périmètre inclus et estimation

| Ligne | Références | Estimation (min–max) | Quantité facturée | Taux unitaire | Montant |
|---|---|---:|---:|---:|---:|
| 1 | TKT-001, SPEC-001 | 2–4 JEH | 3 JEH | 400 € | 1 200,00 € |
| 2 | TKT-002, SPEC-002 | 2–4 JEH | 3 JEH | 400 € | 1 200,00 € |
| 3 | TKT-003, SPEC-003 | 2–5 JEH | 3 JEH | 400 € | 1 200,00 € |
| 4 | TKT-004, SPEC-004 | 3–6 JEH | 4 JEH | 400 € | 1 600,00 € |
| 5 | TKT-005, SPEC-005 | 2–4 JEH | 3 JEH | 400 € | 1 200,00 € |
| 6 | TKT-006, SPEC-006 | 1–3 JEH | 2 JEH | 400 € | 800,00 € |
| 7 | TKT-007, SPEC-007 | 1–3 JEH | 2 JEH | 400 € | 800,00 € |
| 8 | TKT-008, SPEC-008 | 2–4 JEH | 3 JEH | 400 € | 1 200,00 € |
| 9 | TKT-009, SPEC-009 | 2–4 JEH | 3 JEH | 400 € | 1 200,00 € |
| 10 | TKT-010, SPEC-010 | 1–2 JEH | 1 JEH | 400 € | 400,00 € |
| 11 | TKT-011, SPEC-011 | 2–5 JEH | 3 JEH | 400 € | 1 200,00 € |
| 12 | TKT-012, SPEC-012 | 1–3 JEH | 2 JEH | 400 € | 800,00 € |
| 13 | TKT-013, SPEC-013 | 2–4 JEH | 3 JEH | 400 € | 1 200,00 € |
| 14 | TKT-014, SPEC-014 | 1–3 JEH | 2 JEH | 400 € | 800,00 € |
| 15 | TKT-015, SPEC-015 | 1–3 JEH | 2 JEH | 400 € | 800,00 € |
| 16 | Mise en place technique transverse (`Architecture.md` — répartition frontend/backend, contrat d'API, schéma de données, mécanisme d'authentification, orchestration de développement) | 3–8 JEH | 5 JEH | 400 € | 2 000,00 € |

Estimation globale : 28–65 JEH selon la résolution des décisions ouvertes ; quantité retenue pour le scénario de base : 44 JEH.

## Récapitulatif de prix

| Poste | Formule | Montant |
|---|---|---:|
| Sous-total delivery | Σ (quantité facturée × taux unitaire) | 17 600,00 € |
| Frais | Aucun frais identifié dans les artefacts de mission | 0,00 € |
| Contingence | 15 % × sous-total delivery | 2 640,00 € |
| Sous-total HT | sous-total delivery + frais + contingence | 20 240,00 € |
| TVA | 20 % × sous-total HT | 4 048,00 € |
| **Total TTC** | sous-total HT + TVA | **24 288,00 €** |

Vérification indépendante : 17 600,00 + 0,00 + 2 640,00 = 20 240,00 ; 20 240,00 × 1,20 = 24 288,00. ✓

## Scénarios

| Scénario | Changement de périmètre | Prix TTC | Compromis |
|---|---|---:|---|
| Base (retenu) | Périmètre complet P0+P1 (TKT-001 à TKT-015), estimation « vraisemblable » | 24 288,00 € | Couvre l'intégralité du périmètre demandé par le brief |
| Réduit — P0 seul | Uniquement TKT-001 à TKT-004 (livrable POC littéral de la semaine 1) | 9 936,00 € | Ne couvre pas le périmètre P1 attendu à la revue de semaine 2 ; nécessiterait un avenant pour compléter |
| Risque majoré — borne haute | Périmètre complet, estimation haute (65 JEH) | 35 880,00 € | Illustre l'exposition si OQ-001 à OQ-004 se résolvent de la façon la plus coûteuse (cadre légal contraignant, vérification employeur par registre externe, modération lourde, calendrier resserré) |

Calcul du scénario réduit : 18 JEH × 400 € = 7 200,00 € ; + 15 % contingence = 8 280,00 € ; + 20 % TVA = 9 936,00 €. ✓
Calcul du scénario risque majoré : 65 JEH × 400 € = 26 000,00 € ; + 15 % contingence = 29 900,00 € ; + 20 % TVA = 35 880,00 €. ✓

## Échéancier de paiement

Base : scénario retenu (24 288,00 € TTC), échéancier 30 % / 70 % conforme à `tkr/CONFIG.md`.

| Jalon | Déclencheur | Part | Montant |
|---|---|---:|---:|
| Démarrage de mission | Signature / lancement de la mission | 30 % | 7 286,40 € |
| Acceptation finale | Acceptation finale du périmètre livré | 70 % | 17 001,60 € |

Vérification : 7 286,40 + 17 001,60 = 24 288,00. ✓

## Hypothèses

- Le taux JEH de 400 € provient de `tkr/CONFIG.md` (valeur approuvée pour cette mission), distinct de la fourchette 80–500 € non vérifiée listée dans `references/je-vocabulary.md`.
- Une contingence de 15 % est appliquée du fait des décisions techniques ouvertes (ADR-001 à ADR-005) et des questions ouvertes (OQ-001 à OQ-004) ; elle absorbe l'incertitude mais ne remplace pas leur résolution — une variation significative de leur issue peut nécessiter un rechiffrage.
- L'estimation suppose, pour SPEC-003 (vérification employeur), l'hypothèse par défaut des specs — vérification déclarative avec revue admin (OQ-002 non résolue) ; une intégration à un registre externe ajouterait un effort au-delà de la fourchette indiquée.
- L'estimation suppose, pour SPEC-011 (modération), le comportement observable minimal — retirer ou maintenir une annonce (OQ-003 non résolue) ; un workflow de modération plus lourd (ex. revue avant publication) ajouterait un effort au-delà de la fourchette indiquée.
- La ligne « mise en place technique transverse » suppose la direction d'architecture retenue (frontend et backend séparés, `Architecture.md`) ; un changement de cette direction changerait cette estimation.
- Aucun frais n'a été identifié dans les artefacts de mission (pas de déplacement ni de coût d'outillage mentionné dans le brief) — à confirmer si le client exige une présence sur site ou des services tiers payants.

## Exclusions

- Documentation technique (installation, API) et rétrospective de projet, explicitement demandées par le brief §4 mais sans ticket associé — exclues de ce devis sur décision explicite de l'utilisateur ; à chiffrer séparément si retenues, idéalement après un passage par `/tkr-tickets` pour leur donner une couverture formelle.
- Les décisions techniques ouvertes ADR-001 à ADR-005 (mécanisme d'authentification, vérification employeur, canal de notification, stratégie de suppression des données, hébergement de production) ne sont pas chiffrées indépendamment ; leur incertitude est absorbée par la contingence de 15 %, pas par une ligne dédiée.
- Toute intégration avec FranceTravail, Apec, ou un registre externe de vérification employeur (hors périmètre PRD, non-objectif explicite).
- Hébergement de production, nom de domaine, certificats et autres coûts d'infrastructure — non mentionnés dans le brief, non chiffrés (ADR-005 ouvert).
- Maintenance et évolutions au-delà de la livraison du périmètre P1 décrit dans la PRD.

## Responsabilités du client

- Confirmer ou lever les questions ouvertes OQ-001 (cadre légal des données), OQ-002 (vérification employeur), OQ-003 (workflow de modération) et OQ-004 (calendrier fixe ou non) ; leur non-résolution est déjà couverte par la contingence, mais leur clarification rapide réduit le risque de dépassement.
- Mettre à disposition la conseillère juridique et le conseiller numérique pour les validations liées à OQ-001/ADR-004 et OQ-002/ADR-002.
- Confirmer le régime de TVA applicable et la durée de validité commerciale auprès du domain owner JE — ce document applique 20 % de TVA et 30 jours de validité sur confirmation ponctuelle de l'utilisateur, non encore validés comme règle organisationnelle.
- Fournir, si elles existent, des données de volumétrie attendue (U-003) pour valider le dimensionnement de la montée en charge.

## Validation commerciale et de domaine requise

- Le taux de TVA (20 %), la durée de validité (30 jours) et la règle d'arrondi (JEH entiers) proviennent d'une confirmation utilisateur ponctuelle pour ce brouillon, pas d'une règle JE validée : `references/je-vocabulary.md` marque explicitement ces valeurs comme non vérifiées dans l'ancien dépôt — à faire confirmer par le domain owner JE avant émission finale au client.
- Les frais administratifs forfaitaires mentionnés dans l'ancien dépôt (40 €) ne sont **pas** appliqués ici, faute de validation — à trancher si l'organisation en a besoin.
- Ce document ne constitue pas un engagement contractuel (CE/BC) et ne fait l'objet d'aucune conformité JE ou fiscale garantie ; ces statuts restent non vérifiés (`Devis`, `CE`, `BC` marqués « Unverified » dans `je-vocabulary.md`).
