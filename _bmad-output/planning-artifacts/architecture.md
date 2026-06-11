---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - docs/PRD-coach-ia.md
  - docs/TECHNICAL-BRIEF-coach-ia.md
workflowType: 'architecture'
project_name: 'salut-app'
user_name: 'Eliyahu'
date: '2026-06-11'
lastStep: 8
status: 'complete'
completedAt: '2026-06-11'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- Onboarding conversationnel pour créer un profil utilisateur (âge, genre, poids, objectifs, restrictions alimentaires, niveau d'activité), avec possibilité de le différer
- Interface de chat avec réponses en streaming, mémoire de conversation
- Gestion de plusieurs conversations (création, historique, suppression)
- Édition du profil à tout moment, avec impact direct sur les réponses du coach (system prompt dynamique)
- Détection automatique de la langue (FR/HE/EN) et réponse dans la même langue, avec support RTL complet pour l'hébreu (MVP)
- UI responsive mobile/desktop, mode sombre par défaut avec bascule mode clair
- Disclaimer médical affiché sous forme de modale au premier lancement uniquement

**Non-Functional Requirements:**
- Temps de réponse du coach < 2s (cible LPU Groq)
- Confidentialité : aucune PII envoyée à des tiers hors LLM ; stockage local uniquement en MVP, via une couche d'abstraction de stockage
- Résilience face aux limites de débit du free tier Groq : logique de retry requise dès le MVP
- Fallback de langue vers l'anglais en cas d'échec de détection
- Support RTL (hébreu) sur l'ensemble de l'UI dès le MVP

**Scale & Complexity:**
- Primary domain: Full-stack web (React + Express)
- Complexity level: Faible à moyen (MVP simple mais avec abstraction de stockage et i18n/RTL dès le départ ; Phase 2 plus complexe avec auth/DB/PWA)
- Estimated architectural components: ~6-8 (UI chat, gestion profil, historique, couche stockage abstraite, route API LLM avec retry, gestion streaming, i18n/RTL, modale disclaimer)

### Technical Constraints & Dependencies

- Dépendance unique à l'API Groq (free tier) pour l'inférence LLM — risque de rate limiting, mitigé par retry logic dès le MVP
- Stockage MVP via localStorage, mais derrière une couche d'abstraction conçue dès la Phase 1 pour faciliter la migration vers une DB persistante en Phase 2
- Pas d'authentification en Phase 1 (explicitement exclu)
- Stack imposée par le brief technique : React 18 + Vite, Tailwind CSS, Node.js + Express
- Modèle LLM fixé : llama-3.3-70b-versatile

### Cross-Cutting Concerns Identified

- Streaming SSE bout-en-bout (backend Express → frontend fetch/reader)
- Internationalisation et support RTL (hébreu) sur l'ensemble de l'UI dès le MVP
- Couche d'abstraction de stockage implémentée dès la Phase 1 (localStorage) pour permettre une migration sans refonte vers une DB persistante en Phase 2
- Construction dynamique du system prompt à partir du profil utilisateur, à chaque appel
- Gestion centralisée des erreurs / retry pour les appels Groq, dès le MVP
- Modale de disclaimer médical au premier lancement (état persisté localement)

## Starter Template Evaluation

### Primary Technology Domain

Application full-stack web : frontend React + Vite, backend Node.js/Express, en TypeScript, organisés en monorepo npm workspaces, déployés en tout-en-un (Express sert le build statique de Vite).

### Starter Options Considered

- **T3 Stack / RedwoodJS / Next.js full-stack starters** : écartés — ils imposent leur propre framework full-stack (routing serveur intégré, ORM, etc.) qui entre en conflit avec l'architecture imposée par le brief (Express explicite avec route SSE `/api/chat`, pas de SSR).
- **Boilerplates "Vite + Express monorepo" tiers** (ex. `monorepo-typescript-vite-express`, `vite-react-express-api-monorepo-bp`) : structure proche de ce qu'on veut, mais peu maintenus — risque de dépendances obsolètes.
- **Scaffold manuel composé (retenu)** : combiner `npm create vite@latest` (template `react-ts`) pour le client et une init TypeScript standard pour le serveur Express, assemblés sous npm workspaces.

### Selected Starter: Scaffold composé Vite (react-ts) + Express (TypeScript) en npm workspaces

**Rationale for Selection:**
Le brief impose une stack précise (React+Vite, Express, Tailwind, SSE custom) qu'aucun starter full-stack standard ne respecte sans adaptations majeures. Un assemblage manuel à partir des outils officiels reste léger, 100% maintenu, et permet le déploiement tout-en-un retenu (Express sert le build statique du client).

**Initialization Command:**

```bash
mkdir coach-app && cd coach-app
npm init -y
npm pkg set workspaces[0]="client" workspaces[1]="server"

# Frontend
npm create vite@latest client -- --template react-ts

# Backend
mkdir server && cd server && npm init -y && cd ..
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:**
- Client : React 18 + TypeScript via Vite (template `react-ts`), Node.js 20+ requis
- Server : Node.js + TypeScript (compilé via `tsc`, exécuté via `tsx` en dev)

**Styling Solution:**
- Tailwind CSS v4 via le plugin officiel `@tailwindcss/vite`, intégré directement dans `vite.config.ts`

**Build Tooling:**
- Client : Vite (dev server + build statique optimisé)
- Server : `tsc` pour le build de production, `tsx watch` pour le hot-reload en dev
- Orchestration des deux processus en dev via `concurrently`

**Testing Framework:**
- Vitest pour le client (intégration native avec Vite)
- Vitest ou node:test pour le serveur (à confirmer en Step 4)

**Code Organization:**
- `client/` (frontend Vite/React/Tailwind) et `server/` (Express/TS) comme deux workspaces npm distincts
- `server/` sert les fichiers statiques buildés de `client/dist` en production (déploiement tout-en-un)

**Development Experience:**
- Hot Module Replacement natif via Vite
- TypeScript strict activé sur les deux workspaces
- Variables d'environnement via `.env` (server) et `import.meta.env` (client)

**Note:** L'initialisation du projet via cette commande devra être la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Repository pattern pour la couche de stockage (interface TS + implémentation localStorage)
- Validation des données avec Zod (v4)
- Routing avec React Router
- Internationalisation avec react-i18next (RTL pour l'hébreu)
- Sécurité backend de base (helmet, cors, rate limiting)
- Stratégie de retry pour Groq

**Important Decisions (Shape Architecture):**
- Logging backend (console.log en MVP)
- CI/CD (différé)

**Deferred Decisions (Post-MVP):**
- CI (GitHub Actions) — ajouté quand le besoin de fiabilité de déploiement augmente
- Logging structuré (pino) — à introduire si l'observabilité devient un besoin (Phase 2, avec auth/DB)
- Authentification (JWT) — explicitement Phase 2
- Base de données persistante (PostgreSQL/MongoDB) — Phase 2, facilitée par le repository pattern

### Data Architecture

**Storage Abstraction — Repository Pattern:**
- Interface TypeScript `StorageRepository` définissant les opérations : `getProfile()`, `saveProfile(profile)`, `listConversations()`, `getConversation(id)`, `saveConversation(conversation)`, `deleteConversation(id)`
- Implémentation Phase 1 : `LocalStorageRepository` (clés `coach_profile`, `coach_conversations`)
- Phase 2 : `ApiRepository` implémentant la même interface, branchée sans modifier les hooks/composants consommateurs
- Affecte : `useProfile`, `useHistory`, `AppContext`

**Data Validation — Zod v4:**
- Schémas Zod partagés (package `shared` ou dossier `client/src/schemas` dupliqué/synchronisé côté serveur) pour : `ProfileSchema`, `ChatRequestSchema` (messages + profile)
- Types TypeScript inférés via `z.infer<typeof Schema>` — source unique de vérité pour les types de données
- Validation côté serveur du payload `/api/chat` avant tout appel à Groq
- Validation côté client du formulaire de profil avant sauvegarde

**Caching Strategy:**
- Aucun cache applicatif en MVP (pas de backend de données, volumes faibles)

### Authentication & Security

- Pas d'authentification en Phase 1 (confirmé)
- **helmet (v8)** : headers de sécurité HTTP par défaut sur toutes les routes Express
- **cors** : restreint à l'origine du client (même origine en déploiement tout-en-un, donc configuration permissive mais explicite)
- **express-rate-limit (v8)** : limite de requêtes sur `/api/chat` (ex. 20 req/15min par IP) pour protéger le quota Groq free tier et limiter les abus
- Clé API Groq strictement côté serveur (`.env`), jamais exposée au client

### API & Communication Patterns

- **Pattern** : REST + SSE pour le streaming (`POST /api/chat`, `Content-Type: text/event-stream`)
- **Validation** : Zod sur le body de chaque requête, erreur 400 si invalide
- **Error handling** :
  - Middleware `errorHandler` centralisé (déjà prévu dans la structure du brief)
  - Erreurs Groq transitoires (429/5xx) : retry exponentiel (3 tentatives, backoff ~500ms/1s/2s) avant d'écrire sur le flux SSE
  - Si échec final après retries : message d'erreur convivial envoyé via `data: {"error": "..."}` sur le flux SSE, traduit côté client selon la langue active
- **Rate limiting** : `express-rate-limit` sur `/api/chat` (cf. section sécurité)
- Pas de versioning d'API en MVP (`/api/chat` simple)

### Frontend Architecture

- **State management** : React Context (`AppContext`) pour l'état global (profil, conversation active, langue) + hooks dédiés (`useChat`, `useProfile`, `useHistory`) — cohérent avec le brief
- **Routing — React Router** :
  - `/onboarding` — flow conversationnel de création de profil
  - `/chat` (et `/chat/:conversationId`) — interface de chat principale + sidebar historique
  - `/profile` — édition du profil
  - Redirection vers `/onboarding` si aucun profil trouvé (sauf si l'utilisateur a explicitement "skip")
- **Component architecture** : composants fonctionnels, hooks-based, conformes à la structure du brief (`Chat`, `Message`, `InputBar`, `Sidebar`, `ProfileForm`, `Onboarding`)
- **Internationalisation — react-i18next** :
  - Fichiers de traduction JSON par langue (`fr`, `he`, `en`)
  - `i18n.dir()` pilote l'attribut `dir` sur `<html>` (rtl pour `he`, ltr sinon) — gère le layout RTL global
  - Détection de la langue de réponse du coach gérée côté LLM (system prompt), langue de l'UI gérée séparément par react-i18next (sélecteur manuel + détection initiale du navigateur)
- **Disclaimer médical** : modale affichée au premier lancement (état persisté via le repository de stockage), implémentée comme composant overlay simple

### Infrastructure & Deployment

- **Hosting** : déploiement tout-en-un sur Render/Railway — Express sert les assets statiques buildés par Vite (`client/dist`) en plus de l'API `/api/chat`
- **Environment configuration** : `.env` côté serveur (`GROQ_API_KEY`, `PORT`), variables `import.meta.env` côté client si nécessaire (ex. désactivées en mode tout-en-un car même origine)
- **Logging** : `console.log`/`console.error` en MVP, suffisant pour la collecte stdout de Render/Railway
- **CI/CD** : aucun en MVP — vérifications locales (lint, type-check, build) avant push ; déploiement déclenché manuellement ou via auto-deploy Render sur push `main`
- **Scaling** : non applicable en MVP (mono-instance suffisante pour le trafic attendu)

### Decision Impact Analysis

**Implementation Sequence:**
1. Scaffold du monorepo (npm workspaces, client Vite react-ts + Tailwind v4, server Express TS)
2. Schémas Zod partagés (Profile, ChatRequest) + types inférés
3. Repository pattern + `LocalStorageRepository`
4. Backend : middleware sécurité (helmet, cors, rate-limit), route `/api/chat` avec retry + SSE + errorHandler
5. Frontend : `AppContext` + hooks (`useProfile`, `useHistory`, `useChat`) branchés sur le repository
6. React Router : routes `/onboarding`, `/chat`, `/profile`
7. react-i18next : configuration FR/HE/EN + gestion `dir` RTL
8. UI : Onboarding → Chat → Sidebar → ProfileForm → modale disclaimer médical

**Cross-Component Dependencies:**
- Le repository pattern (étape 3) doit précéder les hooks frontend (étape 5), car ces derniers en dépendent directement
- Les schémas Zod (étape 2) sont utilisés à la fois par le repository (validation des données stockées) et par la route `/api/chat` (validation du payload)
- react-i18next (étape 7) doit être en place avant l'UI finale (étape 8) car les composants consomment `useTranslation` dès leur création
- React Router (étape 6) doit précéder l'implémentation des composants de navigation (Sidebar, redirections onboarding)

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 8 zones où des agents IA pourraient diverger

### Naming Patterns

**API Naming Conventions:**
- Endpoints REST en kebab-case/singulier d'action : `/api/chat` (un seul endpoint en MVP, pas de ressources CRUD)
- Champs JSON en camelCase partout (requêtes et réponses), cohérent avec TypeScript : `dietaryRestrictions`, `activityLevel`
- Pas de préfixe de version d'API en MVP (`/api/chat`, pas `/api/v1/chat`)

**Code Naming Conventions:**
- Composants React : PascalCase pour le nom ET le fichier (`Chat.tsx`, `ProfileForm.tsx`, `Onboarding.tsx`)
- Hooks : camelCase préfixé `use` (`useChat.ts`, `useProfile.ts`, `useHistory.ts`)
- Fonctions/variables : camelCase (`buildSystemPrompt`, `sendMessage`)
- Schémas Zod : PascalCase suffixé `Schema` (`ProfileSchema`, `ChatRequestSchema`), types inférés en PascalCase sans suffixe (`Profile`, `ChatRequest`)
- Repository : interface `StorageRepository`, implémentations suffixées (`LocalStorageRepository`, `ApiRepository`)

### Structure Patterns

**Project Organization:**
- `client/src/components/` — composants UI (un fichier par composant)
- `client/src/hooks/` — hooks personnalisés
- `client/src/context/` — `AppContext.tsx`
- `client/src/repositories/` — `StorageRepository` (interface) + `LocalStorageRepository`
- `client/src/schemas/` — schémas Zod partagés (copiés/synchronisés vers `server/src/schemas/`)
- `client/src/i18n/` — configuration react-i18next + fichiers de traduction (`fr.json`, `he.json`, `en.json`)
- `client/src/routes/` ou directement dans `App.tsx` — configuration React Router
- `server/src/routes/` — `chat.ts`
- `server/src/middleware/` — `errorHandler.ts`, sécurité (helmet/cors/rate-limit configurés dans `server.ts` ou `middleware/security.ts`)
- `server/src/lib/` — client Groq + logique de retry (`groqClient.ts`)

**File Structure:**
- Tests co-localisés : `Chat.test.tsx` à côté de `Chat.tsx` (pas de dossier `__tests__` séparé)
- Variables d'environnement : `server/.env` (jamais commité, `.env.example` fourni)
- Fichiers de traduction : un fichier JSON par langue, structure de clés identique entre langues

### Format Patterns

**API Formats:**
- Réponses d'erreur (hors SSE) : `{ "error": { "message": string, "code": string } }` — ex. `{ "error": { "message": "Invalid profile data", "code": "VALIDATION_ERROR" } }`
- Codes HTTP standards : 400 (validation), 429 (rate limit), 500 (erreur serveur/Groq)
- Streaming SSE : chaque chunk `data: {"delta": "..."}\n\n`, fin de flux `data: [DONE]\n\n`, erreur en cours de stream `data: {"error": {"message": "...", "code": "..."}}\n\n` suivi de `[DONE]`
- Dates : ISO 8601 strings (`createdAt: "2026-06-11T10:00:00.000Z"`)

**Data Formats:**
- camelCase partout (JSON, TS, localStorage) — pas de snake_case
- Listes vides représentées par `[]`, jamais `null`
- IDs de conversation : `crypto.randomUUID()` généré côté client

### Communication Patterns

**State Management:**
- Mises à jour d'état immuables uniquement (spread/`map`/`filter`, jamais de mutation directe d'un tableau/objet d'état)
- `AppContext` expose : `profile`, `conversations`, `activeConversationId`, `language`, et leurs setters/actions — pas de logique métier dans le contexte lui-même (déléguée aux hooks)
- Les hooks (`useChat`, `useProfile`, `useHistory`) sont les seuls points d'accès au `StorageRepository`

### Process Patterns

**Error Handling:**
- Backend : toutes les routes passent les erreurs à `next(err)`, traitées par `errorHandler` centralisé qui formate selon `{ error: { message, code } }`
- Erreurs Groq : retry exponentiel (3 tentatives, ~500ms/1s/2s) géré dans `groqClient.ts`, transparent pour la route
- Frontend : erreurs API affichées via un composant de notification simple (toast ou bannière), jamais via `alert()`
- Erreurs de validation Zod : message traduit côté client via react-i18next (codes d'erreur, pas de texte brut renvoyé par le serveur affiché directement)

**Loading States:**
- Convention de nommage : `isLoading`, `isStreaming` (booléens, préfixe `is`)
- État de streaming géré localement dans `useChat` (`isStreaming` true pendant la réception du flux SSE)
- Indicateur visuel : animation de frappe (typing animation) pendant `isStreaming`, conforme à la direction UX du PRD

### Enforcement Guidelines

**All AI Agents MUST:**
- Utiliser camelCase pour tous les champs JSON, noms de variables et fonctions
- Passer toutes les entrées utilisateur (profil, payload `/api/chat`) par les schémas Zod avant traitement
- Accéder au stockage uniquement via `StorageRepository`, jamais directement via `localStorage` dans les composants/hooks métier
- Utiliser `useTranslation` (react-i18next) pour tout texte affiché à l'utilisateur — aucune chaîne en dur dans les composants
- Respecter le format d'erreur `{ error: { message, code } }` pour toute réponse d'erreur non-SSE

**Pattern Enforcement:**
- Vérification via lint (ESLint + règles TypeScript strictes) et type-check (`tsc --noEmit`) avant chaque commit/push
- Toute déviation des patterns doit être documentée dans ce document (section mise à jour collaborative)

### Pattern Examples

**Good Examples:**
```ts
// Bon : accès via repository, schéma Zod, camelCase
const profile = ProfileSchema.parse(await repository.getProfile());
```

**Anti-Patterns:**
```ts
// À éviter : accès direct à localStorage dans un composant, snake_case
const profile = JSON.parse(localStorage.getItem('coach_profile'));
const { dietary_restrictions } = profile;
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
coach-app/
├── README.md
├── package.json                       # racine, npm workspaces ["client", "server"]
├── .gitignore
├── .env.example                       # template pour server/.env
│
├── client/
│   ├── package.json
│   ├── vite.config.ts                 # plugins react + tailwindcss
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/
│   │   └── assets/
│   └── src/
│       ├── main.tsx
│       ├── App.tsx                    # configuration React Router
│       ├── index.css                  # @import tailwind
│       ├── components/
│       │   ├── Chat.tsx
│       │   ├── Chat.test.tsx
│       │   ├── Message.tsx
│       │   ├── InputBar.tsx
│       │   ├── Sidebar.tsx
│       │   ├── ProfileForm.tsx
│       │   ├── Onboarding.tsx
│       │   ├── DisclaimerModal.tsx
│       │   └── ErrorBanner.tsx
│       ├── hooks/
│       │   ├── useChat.ts
│       │   ├── useProfile.ts
│       │   └── useHistory.ts
│       ├── context/
│       │   └── AppContext.tsx
│       ├── repositories/
│       │   ├── StorageRepository.ts   # interface
│       │   └── LocalStorageRepository.ts
│       ├── schemas/
│       │   ├── profile.schema.ts      # ProfileSchema
│       │   └── chat.schema.ts         # ChatRequestSchema
│       ├── i18n/
│       │   ├── index.ts               # config react-i18next + i18n.dir()
│       │   ├── fr.json
│       │   ├── he.json
│       │   └── en.json
│       └── routes/
│           └── AppRoutes.tsx          # /onboarding, /chat, /chat/:id, /profile
│
└── server/
    ├── package.json
    ├── tsconfig.json
    ├── .env                           # GROQ_API_KEY, PORT (gitignored)
    └── src/
        ├── server.ts                  # entry point, sert client/dist en prod
        ├── routes/
        │   └── chat.ts                # POST /api/chat (SSE)
        ├── middleware/
        │   ├── errorHandler.ts
        │   └── security.ts            # helmet, cors, rate-limit
        ├── lib/
        │   ├── groqClient.ts          # client Groq + retry exponentiel
        │   └── systemPrompt.ts        # buildSystemPrompt(profile)
        └── schemas/
            ├── profile.schema.ts      # synchronisé avec client/src/schemas
            └── chat.schema.ts
```

### Architectural Boundaries

**API Boundaries:**
- Unique endpoint externe : `POST /api/chat` (SSE), validé par `ChatRequestSchema`
- En production, `server.ts` sert aussi les fichiers statiques de `client/dist` (catch-all vers `index.html` pour le routing React Router côté client)
- Aucune authentification/autorisation (Phase 1) — toutes les routes sont publiques mais protégées par `express-rate-limit`

**Component Boundaries:**
- Les composants UI ne contiennent aucune logique d'accès aux données — toute lecture/écriture passe par les hooks (`useChat`, `useProfile`, `useHistory`)
- `AppContext` est le seul point de partage d'état global ; les composants enfants reçoivent données et callbacks via le contexte ou les props
- `routes/AppRoutes.tsx` est la seule source de vérité pour la navigation — pas de navigation impérative en dehors de React Router

**Service Boundaries:**
- `groqClient.ts` est le seul point d'appel à l'API Groq — `routes/chat.ts` ne fait jamais d'appel HTTP direct à Groq
- `systemPrompt.ts` est le seul endroit où le profil utilisateur est transformé en prompt système

**Data Boundaries:**
- `StorageRepository` (interface) est la seule frontière entre la logique applicative et la persistance — `LocalStorageRepository` est la seule implémentation en MVP
- Les schémas Zod (`schemas/`) sont la frontière de validation : aucune donnée ne traverse cette frontière (storage ↔ hooks, client ↔ serveur) sans passer par `.parse()`

### Requirements to Structure Mapping

**Onboarding & Profil (PRD §3 Onboarding, Profile) :**
- Composants : `client/src/components/Onboarding.tsx`, `ProfileForm.tsx`
- Hook : `client/src/hooks/useProfile.ts`
- Schéma : `client/src/schemas/profile.schema.ts`
- Stockage : `LocalStorageRepository` (clé `coach_profile`)

**Chat & Streaming (PRD §3 Chat) :**
- Composants : `Chat.tsx`, `Message.tsx`, `InputBar.tsx`
- Hook : `useChat.ts`
- Backend : `server/src/routes/chat.ts`, `lib/groqClient.ts`, `lib/systemPrompt.ts`
- Schéma : `chat.schema.ts` (client + serveur)

**Historique des conversations (PRD §3 History) :**
- Composant : `Sidebar.tsx`
- Hook : `useHistory.ts`
- Stockage : `LocalStorageRepository` (clé `coach_conversations`)

**Multilingue / RTL (PRD §3 Multilingual) :**
- `client/src/i18n/` (config + `fr.json`, `he.json`, `en.json`)
- `i18n.dir()` appliqué dans `App.tsx` ou `main.tsx` sur `<html dir="...">`

**Disclaimer médical (PRD §8 Risks) :**
- `DisclaimerModal.tsx`, état persisté via `StorageRepository`

### Cross-Cutting Concerns

**Sécurité & Rate Limiting :**
- `server/src/middleware/security.ts` (helmet, cors, express-rate-limit) appliqué globalement dans `server.ts`

**Gestion d'erreurs :**
- `server/src/middleware/errorHandler.ts` (format `{ error: { message, code } }`)
- `client/src/components/ErrorBanner.tsx` pour l'affichage frontend

**Validation :**
- `schemas/` côté client ET serveur — synchronisés manuellement (même structure de fichiers, dupliqués jusqu'à éventuelle extraction en package partagé en Phase 2)

### Integration Points

**Internal Communication:**
- Composants ↔ Hooks ↔ `StorageRepository` (stockage local)
- Composants ↔ Hooks ↔ Backend via `fetch('/api/chat')` (SSE)

**External Integrations:**
- `server/src/lib/groqClient.ts` ↔ Groq API (`llama-3.3-70b-versatile`), seule dépendance externe

**Data Flow:**
1. Utilisateur saisit un message → `InputBar` → `useChat.sendMessage`
2. `useChat` valide via `ChatRequestSchema`, envoie `POST /api/chat` avec `messages` + `profile`
3. `server/routes/chat.ts` valide via `ChatRequestSchema`, construit le system prompt (`systemPrompt.ts`), appelle `groqClient` (avec retry)
4. Réponse streamée en SSE → `useChat` met à jour l'état → `Chat`/`Message` se re-rendent
5. Conversation finale sauvegardée via `useHistory` → `StorageRepository` → `localStorage`

### File Organization Patterns

**Configuration Files:**
- `vite.config.ts` (client), `tsconfig.json` (un par workspace), `.env`/`​.env.example` (server uniquement, pas de secrets côté client)

**Source Organization:**
- Conforme aux patterns du Step 5 : composants en PascalCase, hooks préfixés `use`, schémas suffixés `.schema.ts`

**Test Organization:**
- Tests co-localisés (`*.test.tsx` / `*.test.ts`) à côté du fichier testé, sur les deux workspaces

**Asset Organization:**
- `client/public/assets/` pour les assets statiques (logo, icônes)

### Development Workflow Integration

**Development Server Structure:**
- `npm run dev` à la racine lance en parallèle (via `concurrently`) le dev server Vite (`client`, port 5173) et le serveur Express en mode `tsx watch` (`server`, port 3001)

**Build Process Structure:**
- `npm run build` : build `client` (Vite → `client/dist`) puis build `server` (`tsc` → `server/dist`)

**Deployment Structure:**
- Render/Railway exécute `npm run build` puis `npm start` (lance `server/dist/server.js`), qui sert `client/dist` en statique et expose `/api/chat`

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
- React 18 + Vite (TS) + Tailwind v4 (`@tailwindcss/vite`) + Express (TS) + npm workspaces forment une stack cohérente, toutes les pièces communiquent via des standards (fetch/SSE, JSON)
- Zod v4 est utilisable côté client et serveur sans conflit (mêmes schémas dupliqués/synchronisés)
- react-i18next + React Router + AppContext n'ont pas de chevauchement de responsabilités (i18n = traduction/direction, Router = navigation, Context = état métier global)
- helmet + cors + express-rate-limit (v8) sont compatibles entre eux et avec Express, sans configuration contradictoire
- **Résolution de gap** : framework de test serveur fixé à **Vitest** (cohérent avec le client, natif Vite, pas de dépendance supplémentaire)

**Pattern Consistency:**
- Conventions camelCase (Step 5) cohérentes avec Zod/TS (types inférés en camelCase) et avec le format SSE/erreurs défini
- Nommage PascalCase des composants/fichiers cohérent avec la structure de projet (Step 6)
- Le pattern "StorageRepository" est référencé de façon identique dans les Steps 4, 5 et 6 (interface + LocalStorageRepository)

**Structure Alignment:**
- La structure de projet (Step 6) reflète exactement les composants/hooks/schémas/repositories décidés au Step 4 et nommés selon le Step 5
- Les frontières (API, composants, services, données) correspondent aux dossiers définis (`routes/`, `lib/`, `repositories/`, `schemas/`)

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**
- Onboarding & profil → `Onboarding.tsx`, `ProfileForm.tsx`, `useProfile`, `ProfileSchema`, `LocalStorageRepository`
- Chat streaming + mémoire de conversation → `Chat.tsx`, `useChat`, route `/api/chat` SSE, `groqClient`
- Historique (création/suppression de conversations) → `Sidebar.tsx`, `useHistory`, `LocalStorageRepository`
- Édition du profil avec impact sur le coach → `systemPrompt.ts` reconstruit dynamiquement à chaque appel à partir du profil
- Multilingue (FR/HE/EN) + RTL → `i18n/` (react-i18next) + `i18n.dir()` sur `<html>`
- UI responsive + dark mode → Tailwind v4 (couvert par le starter, à détailler en implémentation UI)

**Non-Functional Requirements Coverage:**
- Temps de réponse < 2s → dépend du modèle Groq (`llama-3.3-70b-versatile`), architecture ne l'entrave pas (streaming dès le premier token)
- Confidentialité / pas de PII à des tiers → stockage 100% local (`LocalStorageRepository`), seule donnée envoyée à un tiers = payload Groq (nécessaire au fonctionnement)
- Résilience rate limit Groq → retry exponentiel dans `groqClient.ts`, message d'erreur traduit côté client
- Fallback de langue → géré par le system prompt + react-i18next (langue UI par défaut anglais si détection échoue)
- Disclaimer médical → `DisclaimerModal.tsx`, affiché une fois, état dans `StorageRepository`
- RTL hébreu dès le MVP → `i18n.dir()` + classes Tailwind logiques (start/end)
- Migration future vers DB persistante → `StorageRepository` conçu dès la Phase 1 pour cet usage

### Implementation Readiness Validation ✅

**Decision Completeness:**
- Toutes les décisions critiques (Step 4) sont documentées avec rationale ; versions vérifiées via recherche web pour Tailwind v4, Zod v4, helmet v8, express-rate-limit v8
- Gap test serveur résolu (Vitest)

**Structure Completeness:**
- Arbre de projet complet, tous les fichiers clés nommés explicitement, aucun placeholder générique

**Pattern Completeness:**
- Naming, structure, format, communication et process patterns définis avec exemples concrets et anti-patterns

### Gap Analysis Results

**Critical Gaps:** Aucun

**Important Gaps:** Aucun restant (test serveur résolu ci-dessus)

**Nice-to-Have Gaps:**
- Choix précis du composant de notification frontend (toast vs bannière) laissé à l'implémentation — `ErrorBanner.tsx` sert de point d'entrée mais le style visuel exact n'est pas spécifié
- Seuils précis du rate limiting (`express-rate-limit`) à ajuster empiriquement après mise en production

### Validation Issues Addressed

- Framework de test serveur (laissé ouvert au Step 4) → résolu : Vitest pour `client` et `server`

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** high

**Key Strengths:**
- Repository pattern dès la Phase 1 sécurise la migration future vers une DB sans refonte
- i18n/RTL intégré dès la conception, évitant un retrofit coûteux sur l'hébreu
- Patterns de nommage et de format clairs et exemplifiés, réduisant le risque de divergence entre agents IA
- Stack légère et entièrement basée sur des outils officiels/maintenus (Vite, React, Express, Zod, react-i18next)

**Areas for Future Enhancement:**
- Phase 2 : authentification JWT, `ApiRepository` + base de données persistante, modes de coach multiples, résumés hebdomadaires, notifications push (PWA)
- CI (GitHub Actions) et logging structuré (pino) à introduire quand le projet grandit

### Implementation Handoff

**AI Agent Guidelines:**

- Suivre toutes les décisions architecturales exactement comme documentées
- Appliquer les patterns d'implémentation de manière cohérente sur tous les composants
- Respecter la structure de projet et les frontières définies
- Se référer à ce document pour toute question architecturale

**First Implementation Priority:**

```bash
mkdir coach-app && cd coach-app
npm init -y
npm pkg set workspaces[0]="client" workspaces[1]="server"
npm create vite@latest client -- --template react-ts
mkdir server && cd server && npm init -y && cd ..
```
