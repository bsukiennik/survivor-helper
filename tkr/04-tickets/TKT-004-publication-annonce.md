# TKT-004 — Publication d'une annonce géolocalisée

## Résultat

Un employeur authentifié publie une annonce avec position, localisation et rayon de diffusion ; elle devient visible sur la carte publique dans ce rayon.

## Couverture des spécifications

- SPEC-004

## Critères d'acceptation

- [ ] Un employeur authentifié et vérifié peut publier une annonce avec position et rayon valides.
- [ ] L'annonce publiée apparaît sur la carte pour les visiteurs situés dans le rayon de diffusion.
- [ ] Une soumission sans position géographique valide est refusée avec un message explicite.
- [ ] Une annonce nouvellement publiée démarre avec des compteurs de vues et candidatures à zéro, visibles dans le tableau de bord employeur (TKT-009).
- [ ] L'annonce est horodatée pour permettre son archivage automatique après 30 jours (TKT-014).

## Bloqué par

- TKT-001 (la carte doit exister pour que l'annonce y soit visible)
- TKT-003 (un compte employeur doit exister pour publier)

## Hypothèses et exclusions

- Ne couvre pas la modification ou le retrait d'une annonce par l'employeur lui-même, non mentionnés dans le brief ou les specs.
