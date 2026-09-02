# GéoEmploi — Account Creation Module (Job-seeker & Employer)

GéoEmploi is the official web frontend application built for the Ministry of Job & Happiness (Ministère du Job et Bonheur). This repository contains the frontend module dedicated to tasks TKT-002 (Job-seeker registration and profile) and TKT-003 (Employer registration and verification), built according to the French State Design System (DSFR).

---

## Table of Contents
1. Overview & Project Scope
2. Compliance with Ministry Cabinet Directives
3. Exhaustive Breakdown of Codebase Files
4. Installation & Execution Guide
5. REST API Specifications (JSON Contracts)
6. GDPR Article 30 Data Processing Registry Card

---

## 1. Overview & Project Scope

This repository provides the user interface (React 19 / TypeScript / Vite Frontend) for the GéoEmploi national job platform.

This specific module implements the complete account creation workflow:
- Job Seeker (TKT-002 / SPEC-002) : Allows candidate registration with a reusable professional profile (full name, email, password, skills, experience, availability) to apply for job listings.
- Employer (TKT-003 / SPEC-003) : Allows business registration with required legal data (company name, 14-digit SIRET number, representative name, role/title, pro email, password) and explicitly displays the initial inactive status "Pending verification".

Decoupled Architecture : This repository contains the Frontend application. Backend server services (relational database, authentication controllers) are developed concurrently by the Backend team on http://localhost:8080/api.

---

## 2. Compliance with Ministry Cabinet Directives

The module development has been strictly aligned with every requirement outlined in the official cabinet emails:

### Legal Department — Ms. Florine Pontaillac
1. Explicit & Freely Given Consent (GDPR) :
   - Registration forms feature an explicit GDPR consent checkbox that is unchecked by default.
   - Form submission requires active checking of this consent checkbox.
2. Data Processing Registry (Article 30 GDPR) :
   - A complete processing card detailing exact frontend-collected data, legal basis, retention period, and recipients is included in this documentation (Section 6).
3. Accessibility (RGAA AA) :
   - Form controls are 100% accessible via keyboard navigation (Tab, submit with Enter).
   - Explicit HTML labels (htmlFor / id), high-contrast colors, and semantic alert banners.

### Digital Department — Mr. Thomas Vignal
1. Required Employer Fields :
   - Ingestion and strict regex validation for the 14-digit SIRET number.
   - Representative identity collection (Last Name, First Name, Function/Role).
   - Professional email address.
2. Activity Verification Status :
   - Instant display of an institutional alert banner informing the employer of the "Pending verification" account status prior to publishing job postings.
3. API Contract & Sovereignty :
   - 100% locally runnable application with zero third-party paid service or proprietary cloud dependencies.
   - Graceful network fallback handling (human-readable error banners when the backend server is offline).

### Communications Department — Mr. Benjamin Sellami
1. DSFR Guidelines (French State Design System) :
   - Institutional Primary Blue #1B3A6B for headers and Action Blue #000091 for buttons/interactive controls.
   - Official typography: Marianne for headers/buttons/tabs and Spectral for body text and input fields.
   - Top-left institutional brand block "MINISTÈRE DU JOB ET BONHEUR".
2. Strict App Naming :
   - Explicit use of the official application name: GéoEmploi.

---

## 3. Exhaustive Breakdown of Codebase Files

### Root Configuration & Tooling Files

- package.json
  Role : Main project manifest file for Node.js / NPM.
  Details : Defines project metadata (geoemploi-app), production dependencies (react, react-dom, axios, leaflet, react-leaflet, lucide-react), devDependencies (typescript, vite, @vitejs/plugin-react), and NPM scripts (npm run dev, npm run build, npm run preview).

- vite.config.ts
  Role : Configuration file for the Vite bundler.
  Details : Configured with @vitejs/plugin-react for Fast Refresh and React JSX/TSX compilation.

- tsconfig.json
  Role : TypeScript compiler configuration file.
  Details : Enables strict type checking, ESNext module resolution, and React 19 JSX options.

- index.html
  Role : Primary HTML entry point template.
  Details : Loads official French State web fonts (Marianne & Spectral) from government CDNs, sets tab title (GéoEmploi — Plateforme Nationale de l'Emploi), embeds div id="root", and imports /src/main.tsx.

- .gitignore
  Role : Git exclusion file for build outputs (dist/), dependencies (node_modules/), and log files.

---

### Application Core (src/)

- src/main.tsx
  Role : Application bootstrap and React mounting point.
  Details : Uses createRoot from react-dom/client to render App into the #root DOM element and imports global styles from src/index.css.

- src/App.tsx
  Role : Master layout component and main tab navigation.
  Features :
  - Institutional Header : Displays brand block (MINISTÈRE DU JOB ET BONHEUR) and GéoEmploi logo.
  - Tab State : Manages active tab state (seeker for Job Seeker, employer for Employer).
  - Tab Navigation : Renders buttons to toggle between registration forms.
  - Footer : Institutional copyright notice.

- src/index.css
  Role : Global CSS styling based on DSFR design rules.
  Features :
  - Typography : Marianne (sans-serif) for titles/tabs/buttons; Spectral (serif) for form inputs and prose.
  - Palette : #000091 (Action Blue), #1B3A6B (Institutional Navy), #F6F6F6 (Light Grey Background).
  - Alert Banners : Styled feedback boxes (.error, .success, .info).

---

### Form Components (src/components/)

- src/components/RegisterJobSeeker.tsx
  Role : Job seeker registration form component (TKT-002).
  Captured Fields :
  1. fullName (Full Name - required)
  2. email (Email Address - required)
  3. password (Password - minimum 8 characters)
  4. skills (Primary Skills - e.g., React, TypeScript)
  5. experience (Work Experience summary)
  6. availability (Availability: Immediate, Within 1 month, Within 3 months)
  7. rgpdConsent (GDPR Consent checkbox - unchecked by default)
  Demo Helper : "✨ Remplir exemple" button pre-fills valid sample data for rapid demonstration.
  Validation : Enforces password length and GDPR consent check before submission.

- src/components/RegisterEmployer.tsx
  Role : Employer registration and business verification form component (TKT-003).
  Captured Fields :
  1. companyName (Company Name - required)
  2. siret (SIRET Number - exactly 14 numeric digits)
  3. nom (Representative Last Name)
  4. prenom (Representative First Name)
  5. statut (Position / Role in Company)
  6. email (Professional Email Address)
  7. password (Password)
  8. rgpdConsent (Business GDPR Consent checkbox - unchecked by default)
  Status Notice : Blue information banner explaining mandatory "Pending verification" account status.
  SIRET Validation : Strips whitespace and verifies exact 14 numeric digits.

---

### API Integration Service (src/services/)

- src/services/api.ts
  Role : Centralized axios HTTP client connecting frontend forms to the backend REST API.
  Configured Base URL : http://localhost:8080/api
  Exported Methods :
  - registerJobSeeker(payload) : Executes POST /api/auth/register/jobseeker.
  - registerEmployer(payload) : Validates SIRET, then executes POST /api/auth/register/employer.
  Network Error Handling : Gracefully catches offline server errors and returns human-readable feedback ("Serveur backend indisponible (hors ligne)").

---

## 4. Installation & Execution Guide

### Prerequisites
- Node.js (v18.0.0 or higher)
- NPM (v9.0.0 or higher)

### Setup Steps

1. Clone the repository :
   git clone <repository-url>
   cd survivor-helper

2. Install dependencies :
   npm install

3. Start local development server :
   npm run dev
   The application will run at http://localhost:5173 (or Vite's assigned port).

4. Test the registration forms :
   - Select either Demandeur d'emploi or Employeur tab.
   - Click "✨ Remplir exemple" to auto-fill sample test data.
   - Check the GDPR consent box and click submit.

5. Build for production :
   npm run build
   Generates optimized production assets in dist/ after TypeScript verification.

---

## 5. REST API Specifications (JSON Contracts)

Below are the JSON contracts expected by the backend service:

### 1. Job Seeker Registration (TKT-002)
- Endpoint : POST /api/auth/register/jobseeker
- Request Body (JSON) :
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
- Success Response (201 Created) :
```json
{
  "message": "Compte demandeur d'emploi créé avec succès",
  "userId": "usr_123456"
}
```

### 2. Employer Registration (TKT-003)
- Endpoint : POST /api/auth/register/employer
- Request Body (JSON) :
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
- Success Response (201 Created) :
```json
{
  "message": "Compte employeur créé, en attente de vérification",
  "companyId": "emp_987654",
  "status": "EN_ATTENTE_VERIFICATION"
}
```

---

## 6. GDPR Article 30 Data Processing Registry Card

Prepared in compliance with Ministry Cabinet legal directives (Ms. Florine Pontaillac).

| Field / Data | Data Category | Processing Purpose | Legal Basis | Retention Period | Recipients |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Full Name / Representative | Identity Data | Account identification | Service Execution | Active account + 1 year | Admins & Employers |
| Email Address | Contact Data | Auth & notifications | Consent & Execution | Duration of active account | Auth System |
| Password | Security Data | Secure Authentication (Hashed) | Security Obligation | Duration of active account | Internal (Auth Server) |
| Skills & Experience | Professional Profile | Matching & Job Applications | Consent | Duration of active account | Job Listing Employers |
| Availability | Professional Data | Recruitment Information | Service Execution | Duration of active account | Employers |
| SIRET (14 digits) | Company Data | Legal business verification | Legal Obligation | Duration of company existence | Ministry Directorate |
| GDPR Consent | Legal Proof | Agreement timestamp | Legal Obligation (GDPR) | 5 years | Legal Department |

### List of Data NOT Collected in this Module
- Street-level location data (not collected during account creation).
- External browsing history or third-party ad tracking cookies.
- Banking / Financial details.
- Sensitive data (health, political/religious beliefs).

---
