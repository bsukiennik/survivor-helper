# Spécifications produit

- Créé le : 2026-08-31
- PRD source : `02-prd.md`

## Couverture

| PRD ID | Spécifications | Statut |
|---|---|---|
| US-001 | SPEC-001 | Couvert |
| US-002 | SPEC-002 | Couvert |
| US-003 | SPEC-003 | Couvert |
| US-004 | SPEC-004 | Couvert |
| US-005 | SPEC-005 | Couvert |
| US-006 | SPEC-006 | Couvert |
| US-007 | SPEC-007 | Couvert |
| US-008 | SPEC-008 | Couvert |
| US-009 | SPEC-009 | Couvert |
| US-010 | SPEC-010 | Couvert |
| US-011 | SPEC-011 | Couvert |
| US-012 | SPEC-012 | Couvert |
| US-013 | SPEC-013 | Couvert |
| US-014 | SPEC-014 | Couvert |
| US-015 | SPEC-015 | Couvert |

## Spécifications

### SPEC-001 — Navigation des annonces géolocalisées sur une carte sans compte

- Source : G-001, US-001
- Acteur ou système externe : visiteur, avec ou sans compte
- Préconditions : aucune — fonctionnalité accessible publiquement
- Déclencheur : le visiteur ouvre la carte des annonces
- Comportement observable : la carte affiche les annonces actives situées dans la zone géographique visible ; le visiteur peut déplacer et zoomer la carte pour explorer d'autres zones
- Résultat : le visiteur consulte les informations essentielles d'une annonce (intitulé, localisation approximative, employeur) sans être invité à se connecter
- Comportement en échec : si aucune annonce active n'existe dans la zone visible, un état vide explicite s'affiche plutôt qu'une erreur

#### Scénarios d'acceptation

- Given un visiteur non connecté sur la page carte, when la page se charge, then les annonces actives de la zone visible s'affichent sans invite de connexion.
- Given un visiteur consultant la carte, when il zoome ou déplace la carte vers une autre zone, then les annonces affichées se mettent à jour pour cette zone.
- Given une zone géographique sans annonce active, when le visiteur la consulte, then un état vide explicite est affiché.
- Given un visiteur non connecté, when il consulte le détail d'une annonce, then il n'est invité à créer un compte qu'au moment de vouloir postuler (SPEC-005), pas pour la consulter.

### SPEC-002 — Création d'un compte demandeur d'emploi avec profil professionnel

- Source : G-002, US-002
- Acteur ou système externe : demandeur d'emploi
- Préconditions : le visiteur n'a pas encore de compte demandeur d'emploi
- Déclencheur : le visiteur choisit de créer un compte demandeur d'emploi
- Comportement observable : le formulaire de création capture au minimum les compétences, l'expérience et la disponibilité
- Résultat : un compte authentifiable est créé, avec un profil réutilisable pour candidater
- Comportement en échec : une création avec des informations obligatoires manquantes, ou pour des identifiants déjà utilisés, est rejetée avec un message explicite

#### Scénarios d'acceptation

- Given un visiteur sans compte, when il complète le formulaire avec les champs requis, then un compte demandeur d'emploi est créé et il est authentifié.
- Given un visiteur tentant de créer un compte avec des identifiants déjà utilisés, when il soumet le formulaire, then la création est refusée avec un message explicite, sans écraser le compte existant.
- Given un demandeur d'emploi authentifié, when il modifie son profil, then les candidatures futures utilisent le profil à jour.

### SPEC-003 — Création d'un compte employeur

- Source : G-003, US-003
- Acteur ou système externe : employeur
- Préconditions : l'employeur n'a pas encore de compte
- Déclencheur : le représentant de l'employeur choisit de créer un compte
- Comportement observable : le formulaire capture les informations nécessaires à une vérification d'activité (mécanisme exact non tranché, voir OQ-002)
- Résultat : un compte employeur authentifiable est créé, avec un statut de vérification visible
- Comportement en échec : une création avec informations obligatoires manquantes est rejetée avec un message explicite

#### Scénarios d'acceptation

- Given un représentant employeur sans compte, when il complète le formulaire avec les champs requis, then un compte employeur est créé.
- Given un compte employeur nouvellement créé, when la vérification d'activité n'est pas encore confirmée, then le compte affiche un statut « en attente de vérification » plutôt qu'un échec silencieux.
- Given un compte employeur suspendu (SPEC-012), when son titulaire tente de publier une annonce, then l'action est refusée avec un message explicite.

### SPEC-004 — Publication d'une annonce géolocalisée

- Source : G-003, US-004
- Acteur ou système externe : employeur authentifié
- Préconditions : le compte employeur existe et n'est pas suspendu
- Déclencheur : l'employeur soumet une nouvelle annonce avec position, localisation et rayon de diffusion
- Comportement observable : l'annonce devient visible sur la carte (SPEC-001) dans son rayon de diffusion dès publication
- Résultat : l'annonce est associée à l'employeur, horodatée pour l'archivage automatique (SPEC-014), avec des compteurs de vues/candidatures initialisés à zéro
- Comportement en échec : une soumission sans position géographique valide ou sans rayon de diffusion est rejetée avec un message explicite

#### Scénarios d'acceptation

- Given un employeur authentifié et vérifié, when il publie une annonce avec position et rayon valides, then l'annonce apparaît sur la carte pour les visiteurs situés dans le rayon concerné.
- Given un employeur soumettant une annonce sans position géographique, when il valide le formulaire, then la publication est refusée avec un message explicite.
- Given une annonce venant d'être publiée, when l'employeur consulte son tableau de bord (SPEC-009), then elle apparaît avec 0 vue et 0 candidature.

### SPEC-005 — Candidature d'un demandeur d'emploi à une annonce

- Source : G-002, US-005
- Acteur ou système externe : demandeur d'emploi authentifié
- Préconditions : le demandeur d'emploi possède un compte et un profil ; l'annonce est active
- Déclencheur : le demandeur d'emploi choisit de postuler depuis une annonce
- Comportement observable : le profil du demandeur d'emploi est transmis à l'employeur sans ressaisie
- Résultat : une candidature est créée, visible dans le suivi du demandeur (SPEC-006) et dans la gestion des candidatures de l'employeur (SPEC-008), et déclenche une notification employeur (SPEC-007)
- Comportement en échec : une tentative par un visiteur non authentifié redirige vers la création de compte (SPEC-002) sans perdre l'intention de candidature ; une candidature en double à la même annonce est empêchée ou signalée comme déjà existante

#### Scénarios d'acceptation

- Given un demandeur d'emploi authentifié avec un profil complet, when il postule à une annonce active, then la candidature est enregistrée et son profil est transmis à l'employeur.
- Given un visiteur non authentifié consultant une annonce, when il tente de postuler, then il est dirigé vers la création de compte, et son intention de candidature n'est pas perdue une fois le compte créé.
- Given un demandeur d'emploi ayant déjà postulé à une annonce, when il tente de postuler à nouveau à la même annonce, then l'application évite la duplication et l'informe de sa candidature existante.
- Given une annonce archivée (SPEC-014) ou retirée par modération (SPEC-011), when un demandeur d'emploi tente d'y postuler, then la candidature est refusée avec un message explicite.

### SPEC-006 — Suivi des candidatures par le demandeur d'emploi

- Source : G-002, US-006
- Acteur ou système externe : demandeur d'emploi authentifié
- Préconditions : le demandeur d'emploi a soumis au moins une candidature (facultatif pour l'état vide)
- Déclencheur : le demandeur d'emploi consulte son suivi de candidatures
- Comportement observable : la liste des candidatures en cours s'affiche avec un statut par candidature
- Résultat : le demandeur d'emploi connaît l'état de chacune de ses candidatures
- Comportement en échec : un demandeur d'emploi sans candidature voit un état vide explicite

#### Scénarios d'acceptation

- Given un demandeur d'emploi ayant postulé à plusieurs annonces, when il consulte son suivi, then chaque candidature affiche un statut identifiable.
- Given un demandeur d'emploi sans aucune candidature, when il consulte son suivi, then un état vide explicite s'affiche.
- Given une candidature dont le statut est mis à jour par l'employeur (SPEC-008), when le demandeur d'emploi consulte à nouveau son suivi, then le nouveau statut est visible.

### SPEC-007 — Notification employeur à chaque nouvelle candidature

- Source : G-004, US-007
- Acteur ou système externe : employeur
- Préconditions : l'employeur a publié au moins une annonce active
- Déclencheur : une candidature est soumise à l'une de ses annonces (SPEC-005)
- Comportement observable : l'employeur reçoit une notification identifiant l'annonce et la candidature concernées
- Résultat : l'employeur peut réagir rapidement à la nouvelle candidature
- Comportement en échec : si l'envoi de la notification échoue, la candidature reste visible dans la gestion des candidatures (SPEC-008) — la notification ne conditionne pas la validité de la candidature

#### Scénarios d'acceptation

- Given une annonce active appartenant à un employeur, when un demandeur d'emploi y postule, then l'employeur reçoit une notification référençant l'annonce et la candidature.
- Given plusieurs candidatures reçues rapprochées dans le temps sur la même annonce, when elles sont soumises, then l'employeur reçoit une notification pour chacune, sans perte.

### SPEC-008 — Gestion des candidatures reçues par l'employeur

- Source : G-003, US-008
- Acteur ou système externe : employeur authentifié
- Préconditions : l'employeur a reçu au moins une candidature sur l'une de ses annonces
- Déclencheur : l'employeur consulte la liste des candidatures d'une annonce
- Comportement observable : l'employeur peut trier les candidatures, changer leur statut, et accéder aux informations de contact du candidat
- Résultat : le statut mis à jour est visible par le demandeur d'emploi dans son suivi (SPEC-006)
- Comportement en échec : un employeur ne peut consulter ou modifier que les candidatures reçues sur ses propres annonces

#### Scénarios d'acceptation

- Given un employeur avec des candidatures reçues, when il trie la liste, then l'ordre affiché reflète le tri choisi.
- Given un employeur consultant une candidature, when il change son statut, then le nouveau statut est immédiatement reflété côté demandeur d'emploi (SPEC-006).
- Given un employeur authentifié, when il tente de consulter les candidatures d'une annonce qui n'est pas la sienne, then l'accès est refusé.

### SPEC-009 — Tableau de bord de suivi des annonces pour l'employeur

- Source : G-003, US-009
- Acteur ou système externe : employeur authentifié
- Préconditions : l'employeur a publié au moins une annonce
- Déclencheur : l'employeur consulte son tableau de bord
- Comportement observable : le nombre de vues et de candidatures reçues est affiché par annonce
- Résultat : l'employeur peut évaluer l'attractivité de chacune de ses annonces
- Comportement en échec : une annonce sans vue ni candidature affiche des compteurs à zéro plutôt qu'un état manquant

#### Scénarios d'acceptation

- Given une annonce consultée plusieurs fois sur la carte, when l'employeur consulte son tableau de bord, then le compteur de vues reflète ces consultations.
- Given une annonce sans aucune interaction, when l'employeur consulte son tableau de bord, then elle affiche 0 vue et 0 candidature.

### SPEC-010 — Signalement d'une annonce frauduleuse ou non conforme

- Source : G-006, US-010
- Acteur ou système externe : tout utilisateur (visiteur ou authentifié)
- Préconditions : l'annonce ciblée est publiée et visible
- Déclencheur : l'utilisateur signale une annonce
- Comportement observable : le signalement est enregistré et associé à l'annonce concernée
- Résultat : le signalement apparaît dans la file de modération de l'administrateur (SPEC-011)
- Comportement en échec : un signalement sans annonce cible valide est rejeté

#### Scénarios d'acceptation

- Given une annonce publiée, when un utilisateur la signale, then le signalement apparaît dans la file de modération.
- Given une annonce déjà signalée par un autre utilisateur, when un second utilisateur la signale aussi, then les deux signalements sont conservés sans que le second écrase le premier.

### SPEC-011 — Modération des annonces publiées par l'administration

- Source : G-006, US-011
- Acteur ou système externe : administrateur
- Préconditions : au moins une annonce est publiée ou signalée
- Déclencheur : l'administrateur consulte la file de modération ou une annonce signalée
- Comportement observable : l'administrateur peut retirer une annonce ou la maintenir en ligne
- Résultat : une annonce retirée n'apparaît plus sur la carte (SPEC-001) ni dans les résultats de recherche
- Comportement en échec : une annonce retirée reste consultable par l'administrateur pour traçabilité, mais plus par les autres utilisateurs

#### Scénarios d'acceptation

- Given une annonce signalée (SPEC-010), when l'administrateur la retire, then elle disparaît immédiatement de la carte publique.
- Given une annonce signalée jugée conforme, when l'administrateur la maintient en ligne, then elle reste visible et le signalement est marqué comme traité.

Note — le volume et le workflow exact de modération attendus au lancement restent une question ouverte (OQ-003) ; ce SPEC couvre le comportement observable minimal (retirer / maintenir), pas le détail du processus interne.

### SPEC-012 — Activation ou suspension d'un compte utilisateur par l'administration

- Source : G-007, US-012
- Acteur ou système externe : administrateur
- Préconditions : le compte ciblé existe (demandeur d'emploi ou employeur)
- Déclencheur : l'administrateur active ou suspend un compte
- Comportement observable : le statut du compte change immédiatement
- Résultat : un compte suspendu perd l'accès aux actions nécessitant une authentification (candidater, publier une annonce, gérer des candidatures)
- Comportement en échec : un compte déjà suspendu ne peut pas être suspendu à nouveau (action sans effet ou explicitement indiquée comme déjà appliquée)

#### Scénarios d'acceptation

- Given un compte actif, when l'administrateur le suspend, then son titulaire ne peut plus candidater ni publier d'annonce.
- Given un compte suspendu, when l'administrateur le réactive, then son titulaire retrouve l'accès aux actions authentifiées.

### SPEC-013 — Tableau de bord de métriques nationales pour l'administration

- Source : G-008, US-013
- Acteur ou système externe : administrateur
- Préconditions : aucune — disponible dès qu'il existe des données d'usage
- Déclencheur : l'administrateur consulte le tableau de bord national
- Comportement observable : des métriques agrégées d'usage (comptes actifs, annonces publiées, candidatures) sont affichées
- Résultat : l'administrateur dispose d'une visibilité sur l'usage global de la plateforme
- Comportement en échec : en l'absence de données, le tableau de bord affiche des valeurs à zéro plutôt qu'une erreur

#### Scénarios d'acceptation

- Given une plateforme avec des comptes, annonces et candidatures existants, when l'administrateur consulte le tableau de bord, then les métriques agrégées reflètent l'état réel de la plateforme.
- Given une plateforme sans aucune donnée, when l'administrateur consulte le tableau de bord, then les métriques affichent zéro plutôt qu'une erreur.

### SPEC-014 — Archivage automatique des annonces après 30 jours

- Source : G-005, US-014
- Acteur ou système externe : système (déclenchement automatique)
- Préconditions : une annonce est publiée
- Déclencheur : 30 jours se sont écoulés depuis la publication de l'annonce
- Comportement observable : l'annonce n'apparaît plus dans les résultats de recherche ni sur la carte
- Résultat : le catalogue d'annonces visibles reste à jour
- Comportement en échec : une annonce archivée reste consultable par son employeur (SPEC-009) et par l'administration, mais plus par les demandeurs d'emploi

#### Scénarios d'acceptation

- Given une annonce publiée il y a exactement 30 jours, when la recherche est effectuée, then l'annonce n'apparaît plus dans les résultats.
- Given une annonce archivée automatiquement, when son employeur consulte son tableau de bord, then il peut toujours voir qu'elle a existé et ses statistiques finales.
- Given une candidature en cours sur une annonce qui vient d'être archivée, when le demandeur d'emploi consulte son suivi, then la candidature reste visible et son statut n'est pas perdu.

### SPEC-015 — Suppression de compte et des données personnelles associées

- Source : G-009, US-015
- Acteur ou système externe : utilisateur authentifié (demandeur d'emploi ou employeur)
- Préconditions : l'utilisateur possède un compte actif
- Déclencheur : l'utilisateur demande la suppression de son compte
- Comportement observable : le compte et les données personnelles associées sont effacés ou rendus définitivement inaccessibles
- Résultat : l'utilisateur ne peut plus s'authentifier avec ce compte ; ses données personnelles ne sont plus retenues au-delà de ce qui est strictement nécessaire
- Comportement en échec : une demande de suppression sur un compte déjà supprimé est explicitement indiquée comme telle plutôt que de générer une erreur ambiguë

#### Scénarios d'acceptation

- Given un demandeur d'emploi authentifié, when il demande la suppression de son compte, then il ne peut plus s'authentifier et son profil n'est plus consultable par les employeurs.
- Given un employeur qui supprime son compte, when la suppression est confirmée, then ses annonces publiées cessent d'être visibles sur la carte publique.
- Given une candidature existante liée à un compte demandeur d'emploi supprimé, when un employeur consulte cette candidature, then le comportement attendu (conservation minimale à des fins de preuve de recrutement vs suppression totale) reste une question ouverte (OQ-001).

## Règles produit transverses

- RULE-001 — La navigation et la consultation des annonces géolocalisées ne nécessitent aucun compte (brief §2.2, PRD contraintes).
- RULE-002 — Postuler à une annonce nécessite un compte demandeur d'emploi authentifié (brief §2.2).
- RULE-003 — Une annonce est automatiquement archivée 30 jours après sa publication et disparaît des résultats de recherche (brief §2.2, SPEC-014).
- RULE-004 — L'employeur est notifié à chaque nouvelle candidature reçue (brief §2.2, SPEC-007).
- RULE-005 — Le contenu des annonces relève de la responsabilité de l'employeur ; le prestataire n'est pas responsable du contenu publié, mais doit fournir un moyen de signalement (brief §5).
- RULE-006 — Les données personnelles ne sont pas conservées au-delà de la période d'usage actif du compte, et un mécanisme de suppression de compte est disponible à tout moment (brief §3.3).
- RULE-007 — Une information claire et accessible sur la collecte et le traitement des données de localisation doit être fournie aux utilisateurs (brief §3.3).

## Contraintes externes

- Application web responsive (mobile et desktop), pas d'application native (brief §3.1, PRD).
- Backend avec base de données relationnelle et API REST documentée (brief §3.1, PRD).
- Authentification sécurisée (JWT ou session serveur, au choix technique) (brief §3.1, PRD).
- Solution cartographique basée sur des données ouvertes (Leaflet.js recommandé, OpenStreetMap ou équivalent), précision minimale à l'échelle commune/arrondissement (brief §3.2, PRD).
- Chargement de la carte en moins de 3 secondes sur connexion standard ; montée en charge progressive attendue (brief §3.4, PRD).
- Livraison en deux jalons : socle P0 (SPEC-001 à SPEC-004) puis périmètre complet P1 (SPEC-005 à SPEC-015) (PRD, direction produit retenue).
- Les choix technologiques ci-dessus sont dictés par le brief client et ne seront remis en question qu'à l'étape `/tkr-architecture`, avec justification si une alternative plus appropriée est identifiée (décision enregistrée lors du challenge de la PRD).

## Questions ouvertes

- OQ-001 — Quel cadre légal de protection des données (RGPD ou autre) s'applique, et quelle politique de rétention précise ? Propriétaire : conseillère juridique. Affecte : SPEC-002, SPEC-005, SPEC-015. Bloque le ticketing détaillé de la rétention et de la suppression des données (SPEC-015) tant que non clarifié ; ne bloque pas le reste.
- OQ-002 — Quel mécanisme concret de vérification d'activité employeur (déclaratif, contrôle manuel, registre externe) ? Propriétaire : Ministère. Affecte : SPEC-003. Bloque le ticketing du détail du flux de vérification employeur tant que non clarifié ; un mode déclaratif par défaut peut être ticketé en attendant.
- OQ-003 — Quel workflow et quel volume de modération sont attendus dès le lancement (revue avant publication vs signalement a posteriori) ? Propriétaire : Ministère. Affecte : SPEC-011. Ne bloque pas SPEC-010, mais laisse la profondeur de SPEC-011 à confirmer avant ticketing détaillé.
- OQ-004 — Le calendrier des deux semaines est-il fixe, et quels éléments P1 peuvent glisser si nécessaire ? Propriétaire : Ministère (conseiller numérique). Affecte : SPEC-005 à SPEC-015. Ne bloque pas l'écriture des specs, mais conditionne leur priorisation lors du ticketing.

## Hors périmètre

- Application mobile native (non-objectif PRD).
- Intégration ou remplacement des comptes FranceTravail/Apec (non-objectif PRD).
- Détection automatisée de fraude — seule la modération humaine et le signalement (SPEC-010, SPEC-011) sont couverts (non-objectif PRD).
- Fonctionnalités de paiement ou de tarification (non-objectif PRD).
- Rédaction du texte légal et des mentions d'information sur la collecte de données — livrable juridique, pas fonctionnel (non-objectif PRD, lié à OQ-001).
- Choix technique précis d'implémentation (bibliothèque cartographique exacte, mécanisme d'authentification JWT vs session) — traité comme contrainte externe, pas comme comportement à spécifier ici.
