# TKT-006 — Suivi des candidatures par le demandeur d'emploi

## Résultat

Un demandeur d'emploi consulte la liste de ses candidatures en cours avec leur statut.

## Couverture des spécifications

- SPEC-006

## Critères d'acceptation

- [ ] Un demandeur d'emploi ayant postulé à plusieurs annonces voit chaque candidature avec un statut identifiable.
- [ ] Un demandeur d'emploi sans candidature voit un état vide explicite, pas une erreur.
- [ ] Un changement de statut effectué côté employeur (TKT-008) est visible ici lors de la prochaine consultation.

## Bloqué par

- TKT-005 (des candidatures doivent exister pour être suivies)

## Hypothèses et exclusions

- L'éventail complet des statuts affichables dépend de TKT-008 (gestion des candidatures par l'employeur) ; ce ticket peut être livré avec un statut initial unique (« soumise ») avant que TKT-008 n'introduise des statuts supplémentaires.
