# GéoEmploi — Module d'Inscription et Création de Comptes (Demandeur d'emploi & Employeur)

GéoEmploi est l'application web front-end officielle développée pour le Ministère du Job et Bonheur. Ce dépôt contient le module front-end dédié aux tâches TKT-002 (Inscription et profil demandeur d'emploi) et TKT-003 (Inscription et vérification employeur), conformément au Système de Design de l'État (DSFR).

---

## Table des Matières
1. Présentation & Périmètre du Projet
2. Conformité aux Directives Ministérielles
3. Explication Détaillée des Fichiers du Codebase
4. Guide d'Installation et d'Exécution
5. Spécification des API REST (Contrats JSON)
6. Fiche de Registre de Traitement des Données (RGPD Art. 30)

---

## 1. Présentation & Périmètre du Projet

Le présent projet constitue l'interface utilisateur (Front-end React 19 / TypeScript / Vite) de la plateforme nationale GéoEmploi.

Ce module implémente spécifiquement le parcours complet de création de comptes :
- Demandeur d'emploi (TKT-002 / SPEC-002) : Permet à un candidat de créer un profil professionnel réutilisable (nom, e-mail, mot de passe, compétences, expérience, disponibilité) pour postuler directement aux annonces.
- Employeur (TKT-003 / SPEC-003) : Permet à une entreprise de créer un compte avec les données légales nécessaires (nom d'entreprise, SIRET 14 chiffres, représentant légal, fonction, e-mail pro, mot de passe) et affiche explicitement le statut d'inactivité initiale "En attente de vérification".

Architecture Découplée : Ce dépôt contient l'application Front-end. Les services serveur (base de données relationnelle, contrôleurs d'authentification) sont développés en parallèle par l'équipe Back-end sur http://localhost:8080/api.

---

## 2. Conformité aux Directives Ministérielles

Le développement du module a été strictement ajusté pour répondre point par point aux exigences émises par les conseillers du Ministère :

### Pôle Juridique — Mme Florine Pontaillac
1. Consentement libre et éclairé (RGPD) :
   - Conformément aux exigences légales, les formulaires comportent une case de consentement explicite aux règles RGPD, non pré-cochée par défaut.
   - La soumission du formulaire exige la validation active de cette case par l'utilisateur.
2. Registre des Traitements (Article 30 du RGPD) :
   - Une fiche complète de registre décrivant exactement les données collectées par le code front-end, leur base légale, durée de conservation et récepteur est incluse dans cette documentation (Section 6).
3. Accessibilité (RGAA AA) :
   - Formulaires utilisables à 100 % au clavier (navigation via Tab, validation par Entrée).
   - Labels HTML explicites rattachés aux champs (htmlFor / id), contrastes de couleurs certifiés et bannières d'alerte sémantiques.

### Pôle Numérique — M. Thomas Vignal
1. Champs requis pour l'Employeur :
   - Ingestion et validation stricte du numéro SIRET à 14 chiffres.
   - Collecte de l'identité du représentant (Nom, Prénom, Statut/Fonction).
   - Adresse e-mail professionnelle.
2. Statut d'Activité :
   - Affichage immédiat du message institutionnel avertissant du statut "En attente de vérification" avant toute publication d'annonce.
3. Contrat API & Indépendance :
   - Application 100 % autonome localement, sans dépendance payante ni service propriétaire tiers.
   - Gestion gracieuse de l'absence de réseau (messages d'erreur explicites lorsque le serveur back-end est hors ligne).

### Pôle Communication — M. Benjamin Sellami
1. Charte Graphique DSFR (Système de Design de l'État) :
   - Utilisation du bleu institutionnel #1B3A6B pour les en-têtes et du bleu d'action #000091 pour les éléments d'interaction.
   - Typographies officielles : Marianne (titres, onglets, boutons) et Spectral (champs de saisie, textes de corps).
   - Bloc-marque institutionnel "MINISTÈRE DU JOB ET BONHEUR" positionné en haut à gauche.
2. Dénomination Unique :
   - Respect strict du nom officiel de l'application : GéoEmploi.

---

## 3. Explication Détaillée des Fichiers du Codebase

### Fichiers de Configuration Racine

- package.json
  Rôle : Fichier manifest principal du projet Node.js / NPM.
  Détails : Définit les métadonnées (geoemploi-app), les dépendances de production (react, react-dom, axios, leaflet, react-leaflet, lucide-react) et de développement (typescript, vite, @vitejs/plugin-react). Propose les scripts NPM (npm run dev, npm run build, npm run preview).

- vite.config.ts
  Rôle : Configuration du bundler ultra-rapide Vite.
  Détails : Intègre le plugin @vitejs/plugin-react pour le rechargement à chaud (HMR) et la compilation JSX/TSX.

- tsconfig.json
  Rôle : Configuration du compilateur TypeScript.
  Détails : Active le mode strict, la résolution des modules ESNext, et la transformation JSX propre à React 19.

- index.html
  Rôle : Point d'entrée HTML principal de l'application web.
  Détails : Charge les polices officielles de l'État (Marianne & Spectral) depuis le CDN gouvernemental, définit le titre de l'onglet (GéoEmploi — Plateforme Nationale de l'Emploi), injecte le conteneur div id="root" et monte /src/main.tsx.

- .gitignore
  Rôle : Liste des répertoires et fichiers ignorés par Git (dossier node_modules/, artefacts de build dist/, logs).

---

### Cœur de l'Application (src/)

- src/main.tsx
  Rôle : Point d'ancrage et d'initialisation de React.
  Détails : Utilise createRoot de React 19 pour instancier le composant racine App dans le DOM et importe le fichier de styles globaux src/index.css.

- src/App.tsx
  Rôle : Composant racine et conteneur de mise en page (Layout Master).
  Fonctionnalités :
  - En-tête Institutionnel : Affiche le bloc-marque officiel (MINISTÈRE DU JOB ET BONHEUR) et la marque GéoEmploi.
  - Gestion d'État des Onglets : Maintient l'onglet actif (seeker pour Demandeur d'emploi, employer pour Employeur).
  - Navigation par Onglets : Offre la bascule fluide entre les deux formulaires d'inscription.
  - Pied de page : Affiche le copyright institutionnel.

- src/index.css
  Rôle : Feuille de style globale respectant les règles graphiques du DSFR.
  Fonctionnalités :
  - Typographies : Marianne (sans-serif) pour les titres/onglets/boutons ; Spectral (serif) pour les champs de formulaire.
  - Couleurs : #000091 (Bleu d'action), #1B3A6B (Bleu institutionnel), #F6F6F6 (Fond gris clair).
  - Bannières d'Information : Formats d'alertes non expansifs (.error, .success, .info) adaptés aux retours utilisateurs.

---

### Composants Formulaires (src/components/)

- src/components/RegisterJobSeeker.tsx
  Rôle : Formulaire d'inscription et de création de profil pour le demandeur d'emploi (TKT-002).
  Champs capturés :
  1. fullName (Nom complet - obligatoire)
  2. email (Adresse e-mail - obligatoire)
  3. password (Mot de passe - min. 8 caractères)
  4. skills (Compétences principales - ex: React, TypeScript)
  5. experience (Expérience professionnelle)
  6. availability (Disponibilité : Immédiate, Sous 1 mois, Sous 3 mois)
  7. rgpdConsent (Case à cocher d'acceptation RGPD - non pré-cochée)
  Options de Test : Bouton "✨ Remplir exemple" permettant d'alimenter instantanément le formulaire avec des données valides pour la démonstration.
  Validation : Vérifie la longueur du mot de passe et l'acceptation explicite du RGPD avant soumission.

- src/components/RegisterEmployer.tsx
  Rôle : Formulaire d'inscription et de vérification d'entreprise pour l'employeur (TKT-003).
  Champs capturés :
  1. companyName (Nom de l'entreprise - obligatoire)
  2. siret (Numéro SIRET - exactement 14 chiffres)
  3. nom (Nom du représentant légal)
  4. prenom (Prénom du représentant légal)
  5. statut (Fonction / Rôle dans l'entreprise)
  6. email (Adresse e-mail professionnelle)
  7. password (Mot de passe)
  8. rgpdConsent (Case à cocher d'acceptation RGPD d'entreprise - non pré-cochée)
  Notice d'information : Bannière bleue explicative détaillant le statut "En attente de vérification" préalable à la publication d'annonces.
  Validation SIRET : Nettoie les espaces et contrôle via une expression régulière l'exactitude des 14 chiffres.

---

### Service d'Intégration API (src/services/)

- src/services/api.ts
  Rôle : Client HTTP centralisé (basé sur axios) assurant la liaison avec l'API back-end.
  URL de base configurée : http://localhost:8080/api
  Fonctions exportées :
  - registerJobSeeker(payload) : Transmet la requête HTTP POST /api/auth/register/jobseeker.
  - registerEmployer(payload) : Valide le SIRET puis transmet la requête POST /api/auth/register/employer.
  Résilience Réseau : Intercepte les erreurs réseau si le serveur back-end est indisponible et affiche un message clair en français ("Serveur backend indisponible (hors ligne)").

---

## 4. Guide d'Installation et d'Exécution

### Prérequis
- Node.js (v18.0.0 ou supérieur)
- NPM (v9.0.0 ou supérieur)

### Étapes d'installation

1. Cloner le dépôt :
   git clone <url-du-depot>
   cd survivor-helper

2. Installer les dépendances :
   npm install

3. Lancer le serveur de développement local :
   npm run dev
   L'application sera accessible sur http://localhost:5173 (ou le port indiqué par Vite).

4. Tester les formulaires d'inscription :
   - Cliquez sur l'onglet Demandeur d'emploi ou Employeur.
   - Utilisez le bouton "✨ Remplir exemple" pour pré-remplir les données de test.
   - Cochez la case RGPD et cliquez sur le bouton de création.

5. Compiler pour la production :
   npm run build
   Génère le bundle optimisé et vérifie les types TypeScript dans le dossier dist/.

---

## 5. Spécification des API REST (Contrats JSON)

Les contrats de données échangés entre ce front-end et le service back-end sont définis ci-dessous :

### 1. Inscription Demandeur d'emploi (TKT-002)
- Endpoint : POST /api/auth/register/jobseeker
- Payload d'entrée (JSON) :
```json
{
  "fullName": "Jean Dupont",
  "email": "jean.dupont@email.fr",
  "password": "Password123!",
  "skills": "React, TypeScript",
  "experience": "3 ans en développement web",
  "availability": "Immédiate",
  "rgpdConsent": true
}
```
- Réponse Succès (201 Created) :
```json
{
  "message": "Compte demandeur d'emploi créé avec succès",
  "userId": "usr_123456"
}
```

### 2. Inscription Employeur (TKT-003)
- Endpoint : POST /api/auth/register/employer
- Payload d'entrée (JSON) :
```json
{
  "companyName": "Tech Paris SAS",
  "siret": "12345678901234",
  "nom": "Martin",
  "prenom": "Alice",
  "statut": "Responsable Recrutement",
  "email": "recrutement@tech-paris.fr",
  "password": "EmployerPass123!",
  "rgpdConsent": true
}
```
- Réponse Succès (201 Created) :
```json
{
  "message": "Compte employeur créé, en attente de vérification",
  "companyId": "emp_987654",
  "status": "EN_ATTENTE_VERIFICATION"
}
```

---

## 6. Fiche de Registre de Traitement des Données (RGPD Art. 30)

Établie conformément aux exigences juridiques du Cabinet du Ministre (Mme Florine Pontaillac).

| Champ / Donnée | Catégorie de Donnée | Finalité du Traitement | Base Légale | Durée de Conservation | Destinataires |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Nom complet / Représentant | Donnée d'identité | Identification du compte | Exécution du service | Durée du compte actif + 1 an | Administrateurs & Employeurs |
| Adresse E-mail | Donnée de contact | Authentification & notifications | Consentement & Exécution | Durée du compte actif | Système d'authentification |
| Mot de passe | Donnée de sécurité | Authentification sécurisée (Hash) | Obligation de sécurité | Durée du compte actif | Interne (Serveur Auth) |
| Compétences & Expérience | Profil professionnel | Mise en relation & Candidatures | Consentement | Durée du compte actif | Employeurs des annonces |
| Disponibilité | Donnée professionnelle | Information de recrutement | Exécution du service | Durée du compte actif | Employeurs |
| SIRET (14 chiffres) | Donnée d'entreprise | Vérification légale d'activité | Obligation légale | Durée d'existence de l'entreprise | Direction du Ministère |
| Consentement RGPD | Preuve légale | Horodatage d'accord | Obligation légale (RGPD) | 5 ans | Service Juridique |

### Liste des Données NON Collectées dans ce Module
- Géolocalisation précise à la rue (non collectée lors de la création de compte).
- Historique de navigation externe ou cookies tiers de suivi publicitaire.
- Coordonnées bancaires / Données financières.
- Données sensibles (santé, opinions politiques, religieuses).

---
