# Analyse de mission

- Créé le : 2026-08-31
- Prospect : Ministère du Job et Bonheur — Direction du Numérique et de l'Innovation (« client » GéoEmploi)
- Sources : `brief_geoemploi_en.pdf` (cahier des charges fonctionnel fourni par le client, réf. JEB/DNI/2026-001, v1.0). Aucune source publique citée : l'institution n'a pas pu être vérifiée par une recherche externe indépendante (voir non-affirmations explicites).

## Contexte du prospect

Le document fourni est un cahier des charges fonctionnel adressé à des « prestataires techniques sélectionnés » pour développer **GéoEmploi**, une application web de mise en relation géolocalisée entre demandeurs d'emploi et employeurs, portée par le Ministère du Job et Bonheur dans le cadre de sa politique nationale de l'emploi 2026-2028. L'application doit compléter — sans les remplacer — les dispositifs existants (FranceTravail, Apec), en ciblant une population active mobile et connectée. Trois contacts sont nommés côté cabinet ministériel : une conseillère juridique, un conseiller numérique, un conseiller communication. La livraison est cadencée sur deux semaines avec une revue de projet le vendredi de la semaine 1 (POC) et une revue technique + keynote la semaine 2 (version finale).

## Cartographie des preuves

| ID | Classe | Observation | Source | Confiance |
|---|---|---|---|---|
| E-001 | Fait | Le Ministère souhaite une solution numérique pour améliorer la mise en relation demandeurs d'emploi / employeurs sur le territoire national | Brief §1 | haute |
| E-002 | Fait | GéoEmploi doit compléter, sans les remplacer, FranceTravail et Apec | Brief §1 | haute |
| E-003 | Fait | Cible déclarée : population active mobile et connectée | Brief §1 | haute |
| E-004 | Fait | Périmètre fonctionnel détaillé pour demandeurs d'emploi, employeurs et administration | Brief §2.1 | haute |
| E-005 | Fait | Exigences prioritaires : géolocalisation sans compte, candidature réservée aux comptes authentifiés, archivage auto à 30 jours, notification employeur à chaque candidature | Brief §2.2 | haute |
| E-006 | Fait | Contraintes techniques : web responsive, backend + BDD relationnelle, API REST documentée (Swagger ou équivalent), authentification sécurisée (JWT ou session serveur) | Brief §3.1 | haute |
| E-007 | Fait | Cartographie : solution open-source (Leaflet.js recommandé), données OSM ou équivalent, précision minimale au niveau commune/arrondissement | Brief §3.2 | haute |
| E-008 | Fait | Données personnelles : information claire requise, non-conservation au-delà de l'usage actif du compte, mécanisme de suppression de compte obligatoire | Brief §3.3 | haute |
| E-009 | Fait | Performance : chargement carte < 3 s sur connexion standard ; montée en charge progressive attendue | Brief §3.4 | haute |
| E-010 | Fait | Livrables scindés en deux semaines avec jalons précis (POC S1, version complète S2) | Brief §4 | haute |
| E-011 | Fait | L'employeur est responsable du contenu des annonces ; un système de signalement des annonces frauduleuses/non conformes est exigé | Brief §5 | haute |
| E-012 | Signal | Le document est marqué « version en attente de validation avant diffusion finale » | Brief, pied de page | moyenne |
| E-013 | Fait | Document adressé à des « prestataires techniques sélectionnés », avec 3 contacts institutionnels nommés (juridique, numérique, communication) | Brief, page de garde | haute |
| S-001 | Signal | Calendrier de deux semaines pour livrer un produit multi-acteurs complet (carto, double type de compte, notifications, modération, tableau de bord admin, conformité données) — délai serré au regard du périmètre annoncé | Déduit de E-004 à E-010 | moyenne |
| S-002 | Signal | Trois profils de contacts distincts (juridique, numérique, communication) suggèrent une gouvernance multi-parties, potentiellement avec des priorités divergentes (conformité vs delivery vs image) | Brief, page de garde | faible |
| S-003 | Signal | Aucun indicateur de succès (taux de mise en relation, volume d'utilisateurs cible) ni budget n'est formulé dans le document | Absence dans le brief | moyenne |
| H-001 | Hypothèse | L'enjeu réel pour le Ministère pourrait être autant démonstratif (capacité d'innovation numérique publique avant le keynote) que fonctionnel | Interprétation du calendrier et du format « keynote » | — |
| H-002 | Hypothèse | Le manque perçu sur FranceTravail/Apec porterait spécifiquement sur une découverte d'offres géolocalisée en priorité | Interprétation de E-001/E-002 | — |
| H-003 | Hypothèse | Une mission de maintenance/évolution pourrait suivre ce cycle de deux semaines, au-delà du périmètre strict du brief | Interprétation de E-009 (« montée en charge progressive ») | — |
| U-001 | Inconnu | Aucun budget ni fourchette de prix indiqués | — | — |
| U-002 | Inconnu | Aucun système d'information existant à intégrer n'est mentionné (SSO gouvernemental, registre d'entreprises pour la vérification employeur) | — | — |
| U-003 | Inconnu | Aucun volume d'utilisateurs ou de trafic cible malgré l'exigence de montée en charge | — | — |
| U-004 | Inconnu | Aucun cadre légal nommé explicitement (RGPD ou équivalent) ni autorité de contrôle référencée | — | — |
| U-005 | Inconnu | Le contenu concret de la « vérification d'activité » employeur n'est pas défini (déclaratif, vérification manuelle, appel à un registre type SIRENE) | — | — |

## Problèmes candidats

### P-001 — Les demandeurs d'emploi peinent à découvrir des offres pertinentes géographiquement via les outils nationaux existants

- Acteur affecté : demandeurs d'emploi (population mobile et connectée)
- Friction : FranceTravail et Apec ne seraient pas optimisés pour une découverte d'offres géolocalisée en priorité
- Conséquence : opportunités locales manquées, temps perdu à filtrer des offres non pertinentes géographiquement
- Preuves à l'appui : E-001, E-002, E-003, H-002
- Contre-preuves : aucune donnée d'usage, enquête ou verbatim utilisateur fournis pour étayer H-002 ; c'est l'angle du Ministère, non une preuve indépendante
- Question de validation la moins coûteuse : quelle preuve concrète (enquête, données de support, retours terrain) montre que les demandeurs d'emploi sont mal servis par la géolocalisation de FranceTravail/Apec ?

### P-002 — Les employeurs manquent d'un moyen simple de publier des annonces géolocalisées et d'en suivre l'engagement

- Acteur affecté : employeurs
- Friction : besoin de créer un compte vérifié, publier une annonce avec rayon de diffusion, suivre vues/candidatures — sans que cette capacité soit dite disponible ailleurs
- Conséquence : employeurs potentiellement inefficaces pour toucher des candidats proches, ou dispersion sur plusieurs plateformes
- Preuves à l'appui : E-004, E-002
- Contre-preuves : aucun témoignage employeur ni donnée sur les outils actuellement utilisés
- Question de validation la moins coûteuse : quel segment d'employeurs est visé (PME, secteur public, autres) et que font-ils aujourd'hui à la place ?

### P-003 — Le calendrier de deux semaines pourrait ne pas correspondre au périmètre fonctionnel, technique et réglementaire annoncé

- Acteur affecté : équipe de delivery / Ministère (risque d'image lors du keynote S2)
- Friction : périmètre complet (carte, double type de compte, notifications, modération, tableau de bord admin, cycle de vie des données conforme) attendu « pleinement opérationnel » en fin de semaine 2
- Conséquence : risque de réduction de périmètre en urgence, dette technique, ou lacunes de conformité (rétention des données, suppression de compte) reléguées au second plan
- Preuves à l'appui : E-010, S-001
- Contre-preuves : aucune à ce stade — la pression calendaire est un fait déclaré dans le brief lui-même
- Question de validation la moins coûteuse : le calendrier des deux semaines est-il fixe et non négociable, et si oui, quels éléments fonctionnels le Ministère accepterait-il de reporter après le keynote de la semaine 2 ?

### P-004 — Les exigences de traitement des données personnelles/géolocalisées sont sensibles sur le plan réglementaire mais sous-spécifiées

- Acteur affecté : Ministère (exposition juridique) / utilisateurs finaux (vie privée)
- Friction : le brief impose une information claire, une non-conservation au-delà de l'usage actif et un mécanisme de suppression de compte, sans référencer le cadre légal applicable ni un propriétaire de la politique de rétention
- Conséquence : risque de construire une implémentation de gestion des données qui ne satisfait pas les attentes réelles de la conseillère juridique, entraînant une reprise
- Preuves à l'appui : E-008, U-004
- Contre-preuves : une conseillère juridique nommée existe comme contact, ce qui suggère qu'une revue de conformité est prévue avant diffusion finale
- Question de validation la moins coûteuse : la conseillère juridique peut-elle confirmer le cadre de protection des données applicable et les spécificités de rétention avant que la conception technique ne soit figée ?

### P-005 — Les attentes de modération de contenu et de signalement de fraude sont nommées mais non cadrées

- Acteur affecté : administration (modérateurs) / demandeurs d'emploi exposés à des annonces frauduleuses
- Friction : le brief exige une « modération des annonces publiées » et « un système de signalement » sans définir de workflow, d'effectifs ni de SLA
- Conséquence : soit une fonctionnalité de modération sous-dimensionnée est livrée, soit le périmètre gonfle fortement une fois les attentes clarifiées
- Preuves à l'appui : E-004, E-011
- Contre-preuves : le brief précise explicitement que le prestataire n'est pas responsable du contenu des annonces, ce qui pourrait réduire la profondeur de modération réellement attendue
- Question de validation la moins coûteuse : quel workflow de modération et quel volume d'annonces le Ministère attend-il du panneau admin dès le lancement (revue avant publication vs signalement a posteriori uniquement) ?

## Problème recommandé pour approfondissement

**P-003 (calendrier vs périmètre)** est recommandé en priorité : c'est le problème le mieux étayé (preuves de type Fait, pas Hypothèse), et c'est celui qui bloque le cadrage de tous les autres livrables en aval (PRD, specs, tickets, architecture, devis) tant qu'il n'est pas résolu — inutile de dimensionner une PRD complète si le périmètre réel accepté pour chaque jalon n'est pas clarifié en amont.

C'est une recommandation réversible : une seule question au client (« le calendrier est-il fixe, et quels éléments peuvent être reportés après le keynote S2 ? ») suffit à la confirmer ou l'infirmer. Ce qui la réfuterait : si le Ministère confirme que le calendrier et le périmètre affiché sont indicatifs plutôt que des contraintes strictes, ou que des livraisons partielles sont explicitement acceptées à chaque revue — auquel cas P-003 cesse d'être un problème et devient une contrainte de planification ordinaire.

En parallèle, **P-001** (le problème produit sous-jacent : découverte d'emploi géolocalisée) doit rester le fil conducteur pour la PRD une fois le périmètre par jalon clarifié, car c'est lui qui justifie la valeur du produit au-delà de la simple conformité au cahier des charges.

## Questions pour le client

- Le calendrier POC (S1) / version finale (S2) est-il fixe, ou certaines fonctionnalités peuvent-elles être reportées après le keynote de la semaine 2 ? (→ P-003, S-001)
- Quel cadre de protection des données (et quelle autorité de contrôle) doit régir le traitement des données de localisation et des données personnelles ? La conseillère juridique peut-elle le confirmer avant que la conception technique ne soit figée ? (→ P-004, U-004)
- Que recouvre concrètement la « vérification d'activité » d'un compte employeur : déclaratif, contrôle manuel, ou appel à un registre externe ? (→ U-005)
- Quelle preuve (enquête, données de support, entretiens) montre que demandeurs d'emploi et employeurs sont mal servis par FranceTravail/Apec sur la géolocalisation ? (→ P-001/P-002, H-002)
- Quel workflow de modération et quel volume d'annonces attendus dès le lancement pour le panneau admin ? (→ P-005)
- Existe-t-il un budget ou une fourchette de prix indicative, et une mission de suite (maintenance, évolution) au-delà de ces deux semaines ? (→ U-001, H-003)

## Non-affirmations explicites

- Non affirmé : que les demandeurs d'emploi ou les employeurs ont exprimé une insatisfaction vis-à-vis de FranceTravail ou Apec — aucun témoignage ni donnée fournis ; ce n'est qu'une hypothèse sous-jacente au discours du Ministère (H-002).
- Non affirmé : que le calendrier des deux semaines est négociable ou reflète une véritable pression de mise en production plutôt qu'une contrainte institutionnelle/académique fixe.
- Non affirmé : qu'un cadre légal précis (RGPD ou autre) est confirmé comme régime applicable — le brief implique une sensibilité réglementaire sans jamais nommer le cadre ni une autorité de contrôle.
- Non affirmé : tout dimensionnement d'usage (nombre de demandeurs d'emploi ou d'employeurs, trafic attendu) — l'exigence de « montée en charge progressive » n'est associée à aucun chiffre de référence.
- Non affirmé : que le « Ministère du Job et Bonheur » est une institution publique vérifiable — aucune source publique indépendante n'a été utilisée pour confirmer ce cabinet, ses conseillers nommés ou la référence JEB/DNI/2026-001 ; le brief est l'unique source, non vérifiée par ailleurs.
