# Exigences produit

- Créé le : 2026-08-31
- Analyse source : `01-analysis.md`
- Problème retenu : P-001 + P-002

## Problème

Les demandeurs d'emploi n'ont pas de moyen efficace de découvrir des opportunités géographiquement pertinentes : les outils nationaux existants (FranceTravail, Apec) ne priorisent pas la découverte géolocalisée, ce qui leur fait perdre du temps à filtrer des offres non pertinentes par localisation (P-001, preuves E-001/E-002/E-003, hypothèse H-002 non validée). Symétriquement, les employeurs n'ont pas de moyen simple de publier une annonce ciblée géographiquement et de suivre l'intérêt qu'elle suscite (P-002, preuve E-004). GéoEmploi doit résoudre ces deux frictions côte à côte, en complément — pas en remplacement — des dispositifs existants.

Le problème P-003 (risque calendrier/périmètre), recommandé en priorité par l'analyse comme sujet d'approfondissement, n'a pas été retenu comme base de cette PRD : c'est un risque de delivery à arbitrer avec le client, pas un problème produit à résoudre par des fonctionnalités. Son contenu reste suivi dans la section « Décisions ouvertes » de cette PRD.

## Objectifs

- G-001 — Un visiteur peut découvrir des annonces géolocalisées pertinentes sans créer de compte.
- G-002 — Un demandeur d'emploi authentifié peut postuler à une annonce et suivre l'état de sa candidature.
- G-003 — Un employeur peut publier une annonce géolocalisée et mesurer son attractivité (vues, candidatures).
- G-004 — Un employeur est notifié rapidement de toute nouvelle candidature.
- G-005 — Le catalogue d'annonces visibles reste à jour (pas d'annonces obsolètes).
- G-006 — Les annonces frauduleuses ou non conformes peuvent être signalées et traitées.
- G-007 — Les comptes utilisateurs peuvent être activés ou suspendus par l'administration afin de faire respecter les règles d'usage de la plateforme. *(exigence client E-004, hors du problème approuvé P-001/P-002)*
- G-008 — L'administration dispose d'une visibilité sur l'usage national de la plateforme. *(exigence client E-004, hors du problème approuvé P-001/P-002)*
- G-009 — Un utilisateur peut faire supprimer son compte et les données personnelles associées. *(exigence client E-008, hors du problème approuvé P-001/P-002)*

## Non-objectifs

- Pas d'application mobile native — le brief exige une application web responsive uniquement.
- Pas d'intégration ou de remplacement des comptes FranceTravail/Apec — GéoEmploi reste un service autonome complémentaire.
- Pas de définition du texte légal ou du cadre de conformité applicable dans cette PRD — c'est un apport attendu de la conseillère juridique, suivi comme décision ouverte plutôt que tranché ici.
- Pas de détection automatisée de fraude — seul un flux de signalement et de modération humaine est couvert à ce stade.
- Pas de décision sur le mécanisme exact de vérification d'activité employeur (déclaratif, contrôle manuel, registre externe) — laissé en décision ouverte.
- Aucune fonctionnalité de paiement ou de tarification — service public gratuit pour les deux faces du marché.

## Utilisateurs et contextes

| Acteur | Contexte | Besoin |
|---|---|---|
| Demandeur d'emploi (visiteur, sans compte) | Explore la carte pour voir ce qui est disponible près de lui, sans engagement | Trouver des annonces géographiquement pertinentes instantanément, sans barrière d'inscription |
| Demandeur d'emploi (authentifié) | Prêt à postuler à une annonce précise | Postuler directement avec son profil, suivre l'état de sa candidature |
| Employeur (publication) | Veut toucher des candidats proches pour un poste ouvert | Créer un compte vérifié, publier une annonce géolocalisée avec un rayon de diffusion |
| Employeur (gestion) | A des annonces actives et veut du signal sur l'intérêt suscité | Voir vues/candidatures, être notifié, trier les candidats |
| Administrateur / modérateur | Garant de l'intégrité de la plateforme | Modérer les annonces, traiter les signalements, gérer les comptes, suivre l'usage national |

## Pistes envisagées

| Piste | Valeur attendue | Hypothèses clés | Risques | Décision |
|---|---|---|---|---|
| A — Map-first MVP (boucle centrale seule) | Colle exactement au livrable POC S1 (E-010) | H-002 : la géolocalisation est le différenciateur prioritaire | Ne traite pas la suite du périmètre S2 | Rejetée seule — insuffisante pour couvrir P-002 et le périmètre S2 attendu par le client ; sa boucle P0 est reprise telle quelle comme premier palier de la piste D retenue |
| B — Concierge manuel (sans carte interactive) | Coût de validation quasi nul pour tester H-002 avant tout développement | Le Ministère accepterait un POC non auto-service | Ne satisfait pas le livrable explicite « interface carte » de la S1 (E-010) | Rejeté — incompatible avec le jalon contractuel S1 |
| C — Marketplace complet livré d'un bloc | Couvre 100% du périmètre §2.1 du brief | Le calendrier de 2 semaines absorbe tout le périmètre sans arbitrage | Ignore le risque P-003 (calendrier vs périmètre) identifié dans l'analyse | Rejeté — ne rend pas les arbitrages de périmètre visibles avant l'échéance |
| D — Marketplace phasé (P0 S1 / P1 S2) | Même ambition finale que C, mais séquencée et arbitrable en continu | Le client accepte de prioriser des tranches de livraison (question ouverte, non confirmée) | Reste sous tension calendaire, mais pilotable | **Retenue** |

## Direction produit retenue

GéoEmploi est construit comme un marché biface géolocalisé, livré en deux tranches explicites correspondant aux deux revues du brief :

- **P0 (revue de fin de semaine 1)** : la boucle minimale démontrable — navigation libre sur une carte d'annonces géolocalisées sans compte, création de compte demandeur d'emploi et employeur, publication d'au moins une annonce géolocalisée. Cette tranche correspond littéralement au livrable POC attendu (E-010).
- **P1 (revue de fin de semaine 2)** : l'ensemble du périmètre fonctionnel décrit par le client — candidature en un geste avec transmission du profil, suivi des candidatures, notifications employeur, tableau de bord employeur (vues, candidatures), modération des annonces et signalement de fraude, gestion des comptes et tableau de bord de métriques nationales côté administration, archivage automatique des annonces après 30 jours, et suppression de compte.

Aucun élément du périmètre décrit dans le brief n'est abandonné : la différence avec une livraison « en bloc » est que chaque histoire utilisateur porte une étiquette de priorité (P0/P1), ce qui rend les arbitrages de dernière minute explicites plutôt qu'implicites si le risque calendrier (P-003) se matérialise.

## Histoires utilisateurs

**P0 — socle démontrable semaine 1**

- US-001 — En tant que visiteur non connecté, je veux parcourir les annonces d'emploi sur une carte interactive, afin de découvrir des opportunités proches de moi sans créer de compte.
- US-002 — En tant que demandeur d'emploi, je veux créer un compte avec mon profil professionnel (compétences, expérience, disponibilité), afin de pouvoir postuler aux annonces qui m'intéressent.
- US-003 — En tant qu'employeur, je veux créer un compte employeur, afin de pouvoir publier des offres d'emploi géolocalisées.
- US-004 — En tant qu'employeur, je veux publier une annonce avec sa localisation et un rayon de diffusion, afin de la rendre visible aux demandeurs d'emploi à proximité.

**P1 — périmètre complet semaine 2**

- US-005 — En tant que demandeur d'emploi authentifié, je veux postuler directement depuis l'application, afin que mon profil soit transmis à l'employeur sans démarche supplémentaire.
- US-006 — En tant que demandeur d'emploi, je veux suivre l'état de mes candidatures en cours, afin de savoir où j'en suis dans chaque processus.
- US-007 — En tant qu'employeur, je veux recevoir une notification à chaque nouvelle candidature, afin de pouvoir réagir rapidement.
- US-008 — En tant qu'employeur, je veux trier et gérer les candidatures reçues (statut, contact), afin d'organiser mon processus de recrutement.
- US-009 — En tant qu'employeur, je veux consulter un tableau de bord de suivi (vues, candidatures reçues), afin de mesurer l'attractivité de mes annonces.
- US-010 — En tant qu'utilisateur, je veux signaler une annonce frauduleuse ou non conforme, afin de protéger les autres utilisateurs de la plateforme.
- US-011 — En tant qu'administrateur, je veux modérer les annonces publiées, afin de retirer celles qui sont frauduleuses ou non conformes.
- US-012 — En tant qu'administrateur, je veux activer ou suspendre des comptes utilisateurs, afin de faire respecter les règles d'usage de la plateforme.
- US-013 — En tant qu'administrateur, je veux consulter un tableau de bord de métriques nationales, afin de suivre l'usage global de la plateforme.
- US-014 — En tant que demandeur d'emploi, je veux que les annonces publiées depuis plus de 30 jours disparaissent automatiquement de ma recherche, afin de ne voir que des offres encore d'actualité.
- US-015 — En tant qu'utilisateur, je veux pouvoir supprimer mon compte et les données associées, afin de garder le contrôle sur mes informations personnelles.

## Preuves de succès

| Objectif | Preuve qui montrerait une progression |
|---|---|
| G-001 | Un visiteur anonyme charge la carte et voit des annonces géolocalisées sans étape de connexion, démontré à la revue S1 |
| G-002 | Un demandeur d'emploi authentifié soumet une candidature de bout en bout et la retrouve dans son suivi |
| G-003 | Un employeur voit son compteur de vues/candidatures évoluer après publication d'une annonce |
| G-004 | Un employeur reçoit une notification mesurable dans un délai court après une nouvelle candidature |
| G-005 | Aucune annonce visible dans les résultats de recherche n'a une date de publication de plus de 30 jours |
| G-006 | Un signalement déposé par un utilisateur apparaît dans la file de modération admin et peut être traité |
| G-007 | Un compte suspendu par un administrateur perd effectivement l'accès à la plateforme |
| G-008 | Le tableau de bord admin affiche des métriques d'usage national (comptes actifs, annonces publiées, candidatures) |
| G-009 | Une demande de suppression de compte entraîne l'effacement vérifiable des données personnelles associées |

## Contraintes et hypothèses

- Contrainte — application web responsive (mobile et desktop), pas d'application native (brief §3.1).
- Contrainte — backend avec base de données relationnelle, API REST documentée, authentification sécurisée (brief §3.1).
- Contrainte — solution cartographique open-source (Leaflet.js recommandé), données OpenStreetMap ou équivalent, précision minimale au niveau commune/arrondissement (brief §3.2).
- Contrainte — données personnelles non conservées au-delà de l'usage actif du compte, mécanisme de suppression de compte disponible, information claire sur la collecte de localisation (brief §3.3).
- Contrainte — chargement de la carte en moins de 3 secondes sur connexion standard, montée en charge progressive attendue (brief §3.4).
- Contrainte — livraison en deux jalons fixés par le client : revue POC vendredi semaine 1, revue technique + keynote semaine 2 (brief §4).
- Hypothèse explicite (non validée) — la géolocalisation est perçue par les demandeurs d'emploi et les employeurs comme un différenciateur suffisant par rapport à FranceTravail/Apec (H-002, analyse P-001/P-002).
- Hypothèse explicite (non validée) — une vérification légère (déclarative + revue admin) de l'activité employeur est acceptable pour la tranche P0 (U-005, à confirmer).
- Note — les choix technologiques ci-dessus (Leaflet.js, OpenStreetMap, JWT/session, etc.) sont dictés tels quels par le brief client et conservés ici comme contraintes non négociables par défaut. Ils ne seront remis en question qu'à l'étape `/tkr-architecture`, et uniquement si une alternative plus appropriée au projet peut être démontrée et justifiée au client — pas retirés par principe de langage outcome-only.

## Décisions ouvertes

- Le calendrier des deux semaines est-il fixe, et quels éléments P1 peuvent glisser si nécessaire ? — Propriétaire : Ministère (conseiller numérique). Impact : arbitrage du périmètre S2 (lié à P-003).
- Quel cadre légal de protection des données s'applique aux données de localisation et personnelles ? — Propriétaire : conseillère juridique. Impact : conception du cycle de vie des données et des mentions d'information (lié à P-004).
- Quel mécanisme concret de vérification d'activité employeur est attendu ? — Propriétaire : Ministère. Impact : complexité du flux d'inscription employeur (lié à U-005).
- Quel workflow et quel volume de modération sont attendus dès le lancement ? — Propriétaire : Ministère. Impact : dimensionnement du panneau admin (lié à P-005).
