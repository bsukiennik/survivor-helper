# Architecture de solution

- Créé le : 2026-08-31
- PRD/specs/tickets source : `02-prd.md`, `03-specs.md`, `04-tickets/README.md`

## Facteurs architecturaux

| Facteur | Source | Impact | Confiance |
|---|---|---|---|
| Application web responsive, pas d'app native | Brief §3.1, PRD | Une seule interface web à concevoir | Haute |
| Backend avec BDD relationnelle et API REST documentée | Brief §3.1, PRD | L'API est une frontière d'intégration réelle, pas un détail interne | Haute |
| Authentification sécurisée (JWT ou session serveur) | Brief §3.1 | Choix explicitement laissé ouvert par le client | Haute |
| Cartographie open-source (Leaflet.js recommandé/OpenStreetMap) | Brief §3.2, PRD | Dépendance à un fournisseur cartographique externe | Haute |
| Chargement carte < 3s, montée en charge progressive | Brief §3.4 | Contrainte de performance déclarée, sans chiffre de volumétrie | Haute (exigence) / Basse (dimensionnement, U-003 inconnu) |
| Complémentaire à FranceTravail/Apec, pas d'intégration | Brief §1, PRD non-objectifs | Aucune intégration externe requise avec ces dispositifs | Haute |
| Vérification d'activité employeur non tranchée | OQ-002 | Intégration externe potentielle (registre), non confirmée | Basse |
| Cadre légal de rétention des données non confirmé | OQ-001 | Cycle de vie exact des données pas figeable totalement | Basse |
| Livraison en deux paliers (P0 puis P1) | PRD, tickets | L'architecture doit supporter un socle minimal démontrable avant extension | Haute |
| Calendrier fixe ou non | OQ-004 / P-003 | Pousse vers la solution la plus simple pour tenir le P0 | Moyenne |

## Pistes envisagées

| Direction | Forces | Compromis | Charge opérationnelle | Décision |
|---|---|---|---|---|
| A — Déploiement unique (même origine) | Le plus simple à tenir pour le P0 ; un seul déployable, une seule frontière d'authentification | Couple le rythme de release front/back | Faible | Écartée — le client a explicitement demandé une séparation |
| B — Déploiement séparé (frontend et backend indépendants) | Respecte littéralement l'API REST comme frontière réutilisable ; permet de faire évoluer/scaler le frontend et le backend indépendamment, ce qui sert la « montée en charge progressive » | Complexité supplémentaire dès le P0 (frontière réseau entre les deux services, gestion de l'authentification entre origines) dans un contexte de calendrier déjà sous tension (P-003) | Moyenne, réduite par une orchestration conjointe en développement | **Retenue** |

## Direction retenue

Les deux services — **frontend web responsive** et **backend exposant l'API REST documentée** — sont conçus comme des unités indépendantes, chacune déployable séparément, communiquant exclusivement via l'API REST. Pour l'environnement de développement et de démonstration (les revues P0/P1), les deux services sont orchestrés conjointement à la racine du dépôt (par exemple via un outil d'orchestration multi-conteneurs type Docker Compose), ce qui réduit la friction de mise en route sans pour autant figer une topologie d'hébergement de production — ce choix d'infrastructure de production reste ouvert (ADR-005).

## Diagrammes

- [Contexte système](system-context.mmd)
- [Flux d'information](information-flow.mmd)
- [Cycle de vie des données](data-lifecycle.mmd)

## Contexte système

Le frontend est le seul point de contact des acteurs humains (visiteur, demandeur d'emploi, employeur, administrateur) ; il consomme l'API REST exposée par le backend, seul composant à accéder à la base de données relationnelle. Le frontend charge directement les tuiles cartographiques auprès du fournisseur externe (OpenStreetMap ou équivalent) ; le backend n'intervient pas dans ce flux. FranceTravail et Apec sont explicitement hors périmètre d'intégration (brief §1, PRD non-objectifs) — ils apparaissent comme contexte, pas comme système intégré. Voir [system-context.mmd](system-context.mmd).

## Responsabilités principales

| Bloc | Responsabilité | Possède | Interagit avec |
|---|---|---|---|
| Frontend web responsive | Rendu de l'interface, appels à l'API REST, aucune logique métier propre | État d'affichage local | Backend (API REST), fournisseur cartographique |
| Backend (API REST) | Expose l'API REST documentée, applique les règles métier, orchestre les blocs ci-dessous | Logique métier | Frontend, base de données relationnelle |
| Comptes & authentification | Création, authentification, suspension et suppression des comptes demandeur d'emploi et employeur | Identités et profils | Catalogue d'annonces, Candidatures, Confiance et modération |
| Catalogue d'annonces | Publication, géolocalisation, archivage automatique des annonces | Annonces et leur cycle de vie | Comptes, Candidatures, Suivi et mesure, Confiance et modération |
| Candidatures | Création, suivi, gestion des candidatures | Candidatures | Comptes, Catalogue, Notification, Suivi et mesure |
| Notification | Alerte l'employeur à chaque nouvelle candidature | — (service transverse) | Candidatures, Frontend |
| Suivi et mesure | Tableau de bord employeur, métriques nationales | Statistiques agrégées | Catalogue, Candidatures |
| Confiance et modération | Réception des signalements, décisions de modération | Signalements | Catalogue, Comptes |

## Flux d'information et de contrôle

1. Un visiteur consulte la carte : Frontend interroge le Catalogue d'annonces via l'API (SPEC-001, TKT-001).
2. Un employeur publie une annonce : Frontend → Comptes (vérifie l'authentification) → Catalogue (SPEC-004, TKT-004) → visible ensuite via le flux 1.
3. Un demandeur d'emploi postule : Frontend → Comptes (vérifie l'authentification) → Candidatures, qui lit l'annonce dans le Catalogue et transmet le profil (SPEC-005, TKT-005) → déclenche Notification vers l'employeur (SPEC-007, TKT-007).
4. Un employeur gère ses candidatures : Frontend → Candidatures (SPEC-008, TKT-008), dont les changements de statut redeviennent visibles au demandeur via le flux de suivi (SPEC-006, TKT-006).
5. Un utilisateur signale une annonce : Frontend → Confiance et modération (SPEC-010, TKT-010) → un administrateur retire ou maintient l'annonce, ce qui modifie le Catalogue (SPEC-011, TKT-011).
6. Le système archive automatiquement une annonce 30 jours après publication : Catalogue (SPEC-014, TKT-014), sans intervention du Frontend.

Voir [information-flow.mmd](information-flow.mmd).

## Propriété et cycle de vie des données

- **Profil demandeur d'emploi** : propriété du demandeur d'emploi ; créé à l'inscription (TKT-002), utilisé pour chaque candidature (SPEC-005), effacé à la suppression du compte (TKT-015).
- **Compte employeur** : propriété de l'employeur ; créé avec un statut de vérification (TKT-003), peut être suspendu par l'administration (TKT-012, révocation immédiate de l'accès), effacé à la suppression du compte (TKT-015).
- **Annonce** : propriété de l'employeur qui l'a publiée ; visible jusqu'à archivage automatique à 30 jours (TKT-014) ou retrait par modération (TKT-011) — dans les deux cas, elle reste consultable par son propriétaire et par l'administration, mais plus par les autres utilisateurs.
- **Candidature** : donnée dérivée du profil et de l'annonce ; visible par le demandeur d'emploi (TKT-006) et l'employeur concerné (TKT-008). Son devenir lorsque le compte demandeur ou employeur lié est supprimé (TKT-015) **reste une question ouverte (OQ-001)** — conservation minimale à des fins de preuve de recrutement vs suppression totale, à trancher avec la conseillère juridique.
- **Signalement** : créé par tout utilisateur, traité par l'administration (TKT-011) ; pas de propriétaire individuel après création.
- **Métriques nationales** : données agrégées dérivées des données ci-dessus, sans propriétaire individuel.

Voir [data-lifecycle.mmd](data-lifecycle.mmd).

## Sécurité et exploitation

- L'authentification est requise pour toute action au-delà de la navigation libre (RULE-002, brief §3.1) — fait.
- La suspension d'un compte révoque immédiatement l'accès aux actions authentifiées (SPEC-012) — fait.
- Les données personnelles ne sont pas conservées au-delà de l'usage actif du compte, et un mécanisme de suppression est disponible (brief §3.3) — fait ; le détail exact du délai et du cadre légal applicable reste ouvert (OQ-001).
- Le découplage frontend/backend introduit une frontière réseau entre les deux services : la sécurisation de cette frontière (contrôle des origines autorisées, protection du canal d'authentification entre les deux) est une exigence à couvrir, indépendamment du mécanisme d'authentification exact retenu (ADR-001) — assumption explicite, pas encore validée par un choix technique.
- L'orchestration conjointe (type Docker Compose) mentionnée en direction retenue concerne l'environnement de développement/démonstration ; elle ne préjuge pas de la topologie d'hébergement de production (ADR-005, hors périmètre de cet artefact).

## Traçabilité

| Bloc ou décision | SPEC | TKT |
|---|---|---|
| Frontend web responsive | SPEC-001 | TKT-001 |
| Comptes & authentification | SPEC-002, SPEC-003, SPEC-012, SPEC-015 | TKT-002, TKT-003, TKT-012, TKT-015 |
| Catalogue d'annonces | SPEC-004, SPEC-014 | TKT-004, TKT-014 |
| Candidatures | SPEC-005, SPEC-006, SPEC-008 | TKT-005, TKT-006, TKT-008 |
| Notification | SPEC-007 | TKT-007 |
| Suivi et mesure | SPEC-009, SPEC-013 | TKT-009, TKT-013 |
| Confiance et modération | SPEC-010, SPEC-011 | TKT-010, TKT-011 |

## Risques et travaux de validation

- RISK-001 — Un compte employeur non vérifié pourrait publier une annonce avant confirmation (hypothèse de vérification déclarative, OQ-002). Impact : annonces potentiellement frauduleuses visibles publiquement avant contrôle. Validation : confirmer avec le Ministère le mécanisme et le délai de vérification attendus. Propriétaire : Ministère.
- RISK-002 — Aucune donnée de volumétrie cible (U-003) ; le dimensionnement de la « montée en charge progressive » ne peut pas être validé avant un premier trafic réel. Impact : risque de sur- ou sous-dimensionnement. Validation : demander un ordre de grandeur d'utilisateurs/annonces attendu. Propriétaire : Ministère.
- RISK-003 — Le calendrier de deux semaines (P-003/OQ-004) contraint fortement la faisabilité du P0 avec la direction retenue. Impact : réévaluation possible si le périmètre P1 doit être livré plus vite que prévu. Validation : réponse du Ministère à la question ouverte du calendrier. Propriétaire : Ministère (conseiller numérique).
- RISK-004 — Absence de cadre légal confirmé pour les données personnelles/localisation (OQ-001) ; le cycle de vie des candidatures liées à un compte supprimé ne peut être finalisé. Impact : reprise potentielle de TKT-015. Validation : confirmation de la conseillère juridique. Propriétaire : conseillère juridique.
- RISK-005 — La direction retenue (frontend/backend séparés) ajoute de la complexité de mise en route (frontière réseau, authentification inter-origines) par rapport à un déploiement unique, dans un calendrier déjà sous tension. Impact : risque accru de retard sur le socle P0. Mitigation : l'orchestration conjointe en développement (type Docker Compose) réduit la friction de mise en route. Propriétaire : équipe technique.

## Décisions techniques ouvertes

- ADR-001 — Mécanisme d'authentification sécurisée : JWT (sans état, adapté si d'autres clients consomment l'API à l'avenir) vs session serveur (révocation immédiate plus directe, utile pour TKT-012). Les deux sont explicitement acceptés par le brief. Propriétaire : équipe technique ; à trancher avant `/tkr-devis` si cela affecte l'effort estimé.
- ADR-002 — Mécanisme de vérification d'activité employeur (OQ-002) : déclaratif + revue admin (hypothèse par défaut des specs) vs appel à un registre externe. Propriétaire : Ministère. Impact prix : un appel à un registre externe ajoute une intégration et donc un effort supplémentaire.
- ADR-003 — Canal de notification employeur (TKT-007) : email vs notification in-app vs les deux. Propriétaire : équipe technique / Ministère. Impact prix : l'email seul est le plus simple ; l'in-app ajoute un mécanisme de mise à jour en temps réel.
- ADR-004 — Stratégie de suppression des données (TKT-015, OQ-001) : suppression physique immédiate vs anonymisation avec conservation minimale des candidatures déjà transmises. Propriétaire : conseillère juridique. Impact prix : faible, mais conditionne la conception du modèle de données.
- ADR-005 — Topologie d'hébergement de production (au-delà de l'orchestration de développement) : non tranchée dans cet artefact. Propriétaire : équipe technique / Ministère (selon que l'hébergement est fourni par le client, U-002 inconnu).
