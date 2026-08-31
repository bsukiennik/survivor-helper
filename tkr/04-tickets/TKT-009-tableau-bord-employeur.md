# TKT-009 — Tableau de bord de suivi des annonces pour l'employeur

## Résultat

Un employeur consulte, pour chacune de ses annonces, le nombre de vues et de candidatures reçues.

## Couverture des spécifications

- SPEC-009

## Critères d'acceptation

- [ ] Le compteur de vues d'une annonce reflète ses consultations sur la carte (TKT-001).
- [ ] Le compteur de candidatures d'une annonce reflète les candidatures reçues (TKT-005).
- [ ] Une annonce sans interaction affiche des compteurs à zéro, pas un état manquant.

## Bloqué par

- TKT-004 (des annonces doivent exister pour être suivies)

## Hypothèses et exclusions

- Le compteur de candidatures affiche 0 tant que TKT-005 n'est pas livré ; ce n'est pas considéré comme un blocage dur puisque le tableau de bord reste utile avec les seules vues.
