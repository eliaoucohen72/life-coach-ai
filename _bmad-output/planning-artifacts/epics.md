---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - docs/PRD-coach-ia.md
  - _bmad-output/planning-artifacts/architecture.md
---

# salut-app - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for salut-app, decomposing the requirements from the PRD and Architecture into implementable stories.

> **Note sur les stories techniques :** Les Stories 1.1, 1.2 et 2.1 sont intentionnellement rédigées "As a développeur" car elles couvrent le scaffold et l'infrastructure backend — des prérequis sans lesquels aucune valeur utilisateur ne peut être livrée. C'est un écart délibéré et documenté aux best practices de la méthode (epics = valeur utilisateur), justifié par la nature greenfield du projet.

## Requirements Inventory

### Functional Requirements

FR1: As a new user, I want to fill in my profile (age, gender, weight, goals, dietary restrictions, activity level) through a conversational onboarding flow so the coach knows who I am
FR2: As a user, I want to skip onboarding and come back to it later
FR3: As a user, I want to send messages and receive coach responses in real time via streaming
FR4: As a user, I want the coach to remember what I told it earlier in the current conversation
FR5: As a user, I want to start a new conversation and keep past ones accessible
FR6: As a user, I want to view and edit my profile at any time
FR7: As a user, I want my profile to influence the coach's advice automatically (system prompt rebuilt from profile on every request)
FR8: As a user, I want to scroll through past conversations in a sidebar/history list
FR9: As a user, I want to delete a conversation
FR10: As a user, I want to use the app in French, Hebrew, or English
FR11: As a user, I want the coach to respond in the same language I write in
FR12: As a user, I want a mobile-responsive UI with dark mode by default and a light mode toggle
FR13: As a user, I want to see a medical disclaimer modal on my first visit, shown only once

### NonFunctional Requirements

NFR1: Coach response time should target < 2 seconds (Groq LPU target), enabled by streaming from the first token
NFR2: The system must implement retry logic (exponential backoff, ~3 attempts) for Groq API rate limits/transient errors, with a friendly user-facing error message on final failure
NFR3: Profile and conversation data must remain local-only (localStorage) in the MVP — no PII sent to third parties other than the LLM provider as required for inference
NFR4: Language detection failures must fall back to English, with a manual language override available to the user
NFR5: The UI must fully support RTL layout for Hebrew, including dynamic `dir` switching on language change

### Additional Requirements

- Project scaffold: monorepo via npm workspaces (`client/`, `server/`), client initialized with `npm create vite@latest client -- --template react-ts`, server as a TypeScript Express app — this is Epic 1 Story 1
- Storage abstraction: `StorageRepository` TypeScript interface with `LocalStorageRepository` implementation (Phase 1), designed so a future `ApiRepository` can be substituted without changing hooks/components
- Shared Zod (v4) schemas (`ProfileSchema`, `ChatRequestSchema`) used for validation on both client and server, with inferred TS types
- React Router routes: `/onboarding`, `/chat` (and `/chat/:conversationId`), `/profile`, with redirect to `/onboarding` if no profile exists (unless explicitly skipped)
- react-i18next for FR/HE/EN translations and `i18n.dir()`-driven `dir="rtl"|"ltr"` on `<html>`
- Backend security middleware: helmet (v8), cors, express-rate-limit (v8) on `/api/chat`
- `POST /api/chat` SSE streaming contract: `data: {"delta": "..."}` chunks, `data: [DONE]` terminator, `data: {"error": {"message","code"}}` on stream error
- Centralized Express error handler returning `{ error: { message, code } }` for non-SSE errors
- `groqClient.ts` encapsulates all Groq API calls (model `llama-3.3-70b-versatile`) including retry logic; `systemPrompt.ts` builds the system prompt from the profile
- Deployment: single-service deploy (Render/Railway) — Express serves `client/dist` static build plus `/api/chat`
- Testing: Vitest for both `client` and `server` workspaces
- No authentication and no CI pipeline in the MVP (explicitly out of scope for Phase 1)

### UX Design Requirements

No separate UX Design document was provided. UX direction (dark mode default, navy/electric green/warm white palette, chat bubble layout, typing animation, conversational onboarding) is captured in PRD §6 and will inform story-level acceptance criteria for UI stories.

### FR Coverage Map

FR1: Epic 1 - Création de profil via onboarding conversationnel
FR2: Epic 1 - Possibilité de différer l'onboarding
FR3: Epic 2 - Chat en streaming
FR4: Epic 2 - Mémoire de conversation
FR5: Epic 3 - Nouvelle conversation, accès aux précédentes
FR6: Epic 1 - Visualisation/édition du profil
FR7: Epic 1 - Profil influence automatiquement le coach (system prompt)
FR8: Epic 3 - Navigation dans l'historique
FR9: Epic 3 - Suppression de conversation
FR10: Epic 4 - Support FR/HE/EN
FR11: Epic 4 - Réponse du coach dans la langue de l'utilisateur
FR12: Epic 1 - UI responsive, dark/light mode
FR13: Epic 1 - Disclaimer médical (modale premier lancement)

NFR1: Epic 2 - Temps de réponse < 2s via streaming
NFR2: Epic 2 - Retry exponentiel sur erreurs Groq
NFR3: Epic 1 (transversal) - Stockage local uniquement, base pour tous les epics
NFR4: Epic 4 - Fallback langue → anglais
NFR5: Epic 4 - Support RTL hébreu

## Epic List

### Epic 1: Fondations, Onboarding & Profil
Un nouvel utilisateur peut ouvrir l'application (scaffold du projet), voir le disclaimer médical une seule fois, compléter ou ignorer un onboarding conversationnel pour créer son profil, et consulter/modifier son profil à tout moment. L'UI de base (responsive, dark mode par défaut, toggle light mode) est en place. L'infrastructure i18n (react-i18next, 3 langues, RTL de base) est initialisée en fin d'epic pour que les traductions soient opérationnelles dès l'Epic 2.
**FRs covered:** FR1, FR2, FR6, FR7, FR12, FR13
**Additional Requirements covered:** scaffold monorepo (Epic 1 Story 1), AppContext + stubs des hooks, StorageRepository/LocalStorageRepository, schémas Zod (Profile avec `onboardingSkipped`), React Router de base, react-i18next (init + traductions Epic 1)

### Epic 2: Conversations avec le Coach IA
Un utilisateur peut envoyer un message et recevoir une réponse en streaming du coach Flex, personnalisée selon son profil, avec gestion de la mémoire de conversation et résilience face aux limites de l'API Groq.
**FRs covered:** FR3, FR4
**NFRs covered:** NFR1, NFR2
**Additional Requirements covered:** route `/api/chat` SSE, `groqClient.ts` (retry), `systemPrompt.ts`, sécurité backend (helmet/cors/rate-limit), `ChatRequestSchema`

### Epic 3: Gestion de l'historique des conversations
Un utilisateur peut démarrer de nouvelles conversations, naviguer entre ses conversations passées via une barre latérale, et supprimer celles dont il n'a plus besoin.
**FRs covered:** FR5, FR8, FR9
**Additional Requirements covered:** `useHistory`, `Sidebar.tsx`, routes `/chat/:conversationId`

### Epic 4: Expérience multilingue et RTL
Un utilisateur peut utiliser l'application en français, hébreu ou anglais ; l'interface s'affiche correctement en RTL pour l'hébreu, et le coach répond dans la langue de l'utilisateur, avec repli automatique vers l'anglais en cas d'échec de détection.
**FRs covered:** FR10, FR11
**NFRs covered:** NFR4, NFR5
**Additional Requirements covered:** react-i18next, fichiers de traduction fr/he/en, `i18n.dir()` sur `<html>`

## Epic 1: Fondations, Onboarding & Profil

Un nouvel utilisateur peut ouvrir l'application (scaffold du projet), voir le disclaimer médical une seule fois, compléter ou ignorer un onboarding conversationnel pour créer son profil, et consulter/modifier son profil à tout moment. L'UI de base (responsive, dark mode par défaut, toggle light mode) est en place.

### Story 1.1: Scaffold du projet & shell applicatif

As a développeur,
I want un monorepo initialisé (client Vite/React/TS/Tailwind v4 + server Express/TS via npm workspaces) avec un shell applicatif responsive en dark mode par défaut,
So that toutes les fonctionnalités suivantes peuvent être développées sur une base technique cohérente et conforme à l'architecture.

**Acceptance Criteria:**

**Given** un répertoire de projet vide
**When** le scaffold est exécuté selon la commande d'initialisation de l'architecture (`npm init -y` racine avec workspaces `client`/`server`, `npm create vite@latest client -- --template react-ts`, init TS pour `server`)
**Then** le projet contient les workspaces `client/` et `server/` avec leurs `package.json`, `tsconfig.json` respectifs
**And** Tailwind CSS v4 est configuré dans `client` via le plugin `@tailwindcss/vite`

**Given** le projet scaffoldé
**When** l'utilisateur lance `npm run dev` à la racine
**Then** le client Vite (port 5173) et le serveur Express (port 3001, `tsx watch`) démarrent en parallèle via `concurrently`

**Given** l'application chargée dans le navigateur
**When** l'utilisateur n'a pas de préférence système ou de préférence sauvegardée
**Then** l'interface s'affiche en mode sombre par défaut (palette navy + accent vert électrique + texte blanc chaud, conforme au PRD §6)
**And** un bouton/toggle permet de basculer vers le mode clair, et la préférence est conservée

**Given** l'application affichée sur un écran mobile (largeur < 768px) et sur desktop
**When** l'utilisateur navigue dans l'interface
**Then** le layout s'adapte de manière responsive sans débordement ni élément coupé

**Given** le routing de base configuré avec React Router
**When** l'utilisateur accède à `/`, `/onboarding`, `/chat`, ou `/profile`
**Then** chaque route affiche une page placeholder distincte (le contenu réel sera implémenté dans les stories suivantes)

**Given** le projet scaffoldé
**When** `client/src/context/AppContext.tsx` est créé
**Then** `AppContext` expose via un Provider : `profile: Profile | null` (initialisé à `null`), `activeConversationId: string | null` (initialisé à `null`), `language: string` (initialisé à `'en'`), et leurs setters/actions correspondants
**And** `App.tsx` enveloppe les routes dans ce Provider

**Given** le scaffold terminé
**When** les fichiers `client/src/hooks/useProfile.ts`, `useHistory.ts` et `useChat.ts` sont créés
**Then** chaque hook exporte une fonction stub retournant des valeurs par défaut typées (ex. `useProfile` retourne `{ profile: null, saveProfile: async () => {} }`) — les implémentations réelles seront complétées dans les stories qui en ont besoin

### Story 1.2: Repository de stockage & schéma de profil

As a développeur,
I want une interface `StorageRepository` avec une implémentation `LocalStorageRepository`, ainsi qu'un schéma Zod `ProfileSchema` et son type inféré `Profile`,
So that toute donnée de profil (et plus tard de conversation) soit lue/écrite de manière cohérente, validée et facilement migrable vers une persistance distante en Phase 2.

**Acceptance Criteria:**

**Given** le code source du client
**When** un développeur consulte `client/src/repositories/StorageRepository.ts`
**Then** l'interface expose au minimum `getProfile()`, `saveProfile(profile)`, `listConversations()`, `getConversation(id)`, `saveConversation(conversation)`, `deleteConversation(id)`

**Given** `client/src/repositories/LocalStorageRepository.ts` implémentant `StorageRepository`
**When** `saveProfile(profile)` est appelé avec un profil valide
**Then** le profil est sérialisé en JSON et stocké sous la clé `coach_profile` dans `localStorage`
**And** `getProfile()` retourne ensuite le même profil désérialisé

**Given** `client/src/schemas/profile.schema.ts` définissant `ProfileSchema` (Zod) avec les champs `name`, `age`, `gender`, `weight`, `goal`, `activityLevel`, `dietaryRestrictions`, `language` (tous optionnels sauf validation sémantique) et `onboardingSkipped?: boolean`
**When** `LocalStorageRepository.saveProfile(profile)` est appelé
**Then** le profil est validé via `ProfileSchema.parse()` avant d'être persisté
**And** si la validation échoue, une erreur explicite est levée (pas d'écriture en `localStorage`)

**Given** aucun profil n'a encore été sauvegardé
**When** `getProfile()` est appelé
**Then** la méthode retourne `null` (ou `undefined`) sans lever d'erreur

### Story 1.3: Modale de disclaimer médical

As a utilisateur,
I want voir un disclaimer médical lors de ma toute première visite,
So that je comprenne que les conseils du coach ne remplacent pas un avis médical professionnel, sans que ce message ne réapparaisse à chaque visite.

**Acceptance Criteria:**

**Given** un utilisateur ouvre l'application pour la première fois (aucun flag de disclaimer dans le storage)
**When** l'application se charge
**Then** une modale `DisclaimerModal` s'affiche, expliquant que le coach ne fournit pas de diagnostic médical et recommandant de consulter un professionnel pour toute préoccupation médicale

**Given** la modale de disclaimer affichée
**When** l'utilisateur clique sur le bouton de confirmation/fermeture
**Then** la modale se ferme
**And** un indicateur (`coach_disclaimer_acknowledged: true`) est persisté via `StorageRepository`/`LocalStorageRepository`

**Given** un utilisateur ayant déjà acquitté le disclaimer (indicateur présent dans le storage)
**When** il recharge ou revisite l'application
**Then** la modale ne s'affiche pas

### Story 1.4: Flow d'onboarding conversationnel

As a nouvel utilisateur,
I want compléter mon profil (âge, genre, poids, objectifs, restrictions alimentaires, niveau d'activité) via un flow conversationnel convivial, ou choisir de le faire plus tard,
So that le coach dispose des informations nécessaires pour personnaliser ses conseils, sans que cela soit une contrainte bloquante.

**Acceptance Criteria:**

**Given** un utilisateur sans profil existant accède à l'application
**When** la navigation tente d'afficher `/chat` ou `/profile`
**Then** l'utilisateur est redirigé vers `/onboarding`

**Given** la page `/onboarding` affichée
**When** l'utilisateur progresse dans le flow conversationnel (questions successives sur âge, genre, poids, objectif, niveau d'activité, restrictions alimentaires)
**Then** chaque réponse est collectée et accumulée dans un état local de formulaire

**Given** toutes les questions de l'onboarding complétées
**When** l'utilisateur valide la dernière étape
**Then** le profil est validé via `ProfileSchema` et sauvegardé via `StorageRepository.saveProfile()`
**And** l'utilisateur est redirigé vers `/chat`

**Given** la page `/onboarding` affichée
**When** l'utilisateur choisit l'option "passer pour l'instant" / "skip"
**Then** un objet `{ onboardingSkipped: true }` est persisté via `StorageRepository.saveProfile()` (aucun champ de profil réel n'est renseigné)
**And** l'utilisateur est redirigé vers `/chat` sans être bloqué

**Given** un utilisateur ayant déjà un profil complet sauvegardé, ou ayant utilisé le skip (`onboardingSkipped: true`)
**When** il accède à l'application
**Then** il n'est plus redirigé automatiquement vers `/onboarding`

### Story 1.5: Visualisation & édition du profil

As a utilisateur,
I want consulter et modifier mon profil à tout moment depuis une page dédiée,
So that mes informations restent à jour et continuent d'influencer automatiquement les conseils du coach.

**Acceptance Criteria:**

**Given** un utilisateur ayant un profil existant
**When** il accède à `/profile`
**Then** `ProfileForm` affiche les valeurs actuelles du profil (nom, âge, genre, poids, objectif, niveau d'activité, restrictions alimentaires)

**Given** la page `/profile` affichée avec des champs modifiés
**When** l'utilisateur soumet le formulaire
**Then** les nouvelles valeurs sont validées via `ProfileSchema` et persistées via `StorageRepository.saveProfile()`
**And** un message de confirmation visuel est affiché

**Given** le profil mis à jour
**When** la sauvegarde réussit
**Then** `AppContext` est mis à jour avec le nouveau profil, le rendant immédiatement disponible pour toute consommation future (ex. construction du system prompt par Epic 2)

**Given** la page `/profile` affichée avec des données invalides (ex. poids négatif)
**When** l'utilisateur soumet le formulaire
**Then** des messages d'erreur de validation sont affichés, et la sauvegarde n'a pas lieu

### Story 1.6: Infrastructure i18n — initialisation et traductions Epic 1

As a utilisateur,
I want que l'application affiche tous ses textes dans ma langue dès le premier chargement, en détectant automatiquement la langue de mon navigateur,
So that l'expérience soit traduite et cohérente dès l'Epic 1, et que les stories suivantes (Epic 2+) puissent s'appuyer sur cette infrastructure.

**Acceptance Criteria:**

**Given** le client React configuré après le scaffold (Story 1.1)
**When** `client/src/i18n/index.ts` est initialisé avec `react-i18next`
**Then** les trois fichiers de ressources `client/src/i18n/locales/fr.json`, `he.json` et `en.json` existent, contenant toutes les clés de traduction pour les textes introduits dans les Stories 1.1 à 1.5 (messages d'erreur de validation, textes du disclaimer, libellés de l'onboarding, labels du formulaire de profil, boutons de navigation)

**Given** aucun choix de langue n'a encore été enregistré par l'utilisateur
**When** l'application se charge pour la première fois
**Then** la langue initiale est détectée depuis `navigator.language`
**And** si la langue détectée n'est ni `fr`, ni `he`, ni `en`, la langue `en` est utilisée par défaut (NFR4)

**Given** `react-i18next` initialisé dans `i18n/index.ts`
**When** la langue courante change (y compris au chargement initial)
**Then** `i18n.dir()` est appliqué sur l'attribut `dir` de `<html>` — `"rtl"` pour `he`, `"ltr"` pour `fr` et `en`

**Given** `react-i18next` initialisé
**When** un composant Epic 1 utilise le hook `useTranslation()`
**Then** les chaînes affichées correspondent aux clés du fichier de langue actif, sans clé brute visible à l'écran

**Given** une clé de traduction manquante dans un fichier de langue
**When** le composant tente de l'afficher
**Then** la valeur de la langue de repli `en` est utilisée, sans faire planter l'application

## Epic 2: Conversations avec le Coach IA

Un utilisateur peut envoyer un message et recevoir une réponse en streaming du coach Flex, personnalisée selon son profil, avec gestion de la mémoire de conversation et résilience face aux limites de l'API Groq.

### Story 2.1: Fondations backend de l'API chat

As a développeur,
I want une route `POST /api/chat` validée par Zod, protégée par des middlewares de sécurité (helmet, cors, rate-limit), et un gestionnaire d'erreurs centralisé,
So that l'infrastructure backend est sûre et cohérente avant d'y brancher l'appel réel à Groq.

**Acceptance Criteria:**

**Given** `server/src/schemas/chat.schema.ts` définissant `ChatRequestSchema` (champs `messages: {role, content}[]` et `profile`)
**When** une requête `POST /api/chat` est reçue
**Then** le payload est validé via `ChatRequestSchema.parse()` avant tout traitement

**Given** un payload invalide (ex. `messages` manquant ou mal typé)
**When** `POST /api/chat` est appelé
**Then** la réponse a le statut 400 et le corps `{ "error": { "message": "...", "code": "VALIDATION_ERROR" } }`

**Given** le serveur Express démarré
**When** n'importe quelle route est appelée
**Then** les en-têtes de sécurité `helmet` sont présents dans la réponse, `cors` est configuré pour l'origine du client, et `express-rate-limit` est actif sur `/api/chat` (ex. 20 req/15min par IP)

**Given** un nombre de requêtes dépassant la limite configurée sur `/api/chat`
**When** une requête supplémentaire est envoyée depuis la même IP
**Then** la réponse a le statut 429 avec le format d'erreur `{ "error": { "message": "...", "code": "RATE_LIMITED" } }`

**Given** une erreur levée dans n'importe quelle route (ex. via `next(err)`)
**When** la requête est traitée
**Then** le middleware `errorHandler` centralisé intercepte l'erreur et répond avec `{ error: { message, code } }` et le code HTTP approprié (400/429/500)

### Story 2.2: Intégration Groq avec streaming et retry

As a utilisateur,
I want que le coach me réponde en streaming, en tenant compte de mon profil, même en cas de limite de débit temporaire de l'API Groq,
So that j'obtiens des réponses rapides et personnalisées (NFR1) avec une expérience résiliente face aux erreurs transitoires (NFR2).

**Acceptance Criteria:**

**Given** `server/src/lib/systemPrompt.ts` exportant `buildSystemPrompt(profile)`
**When** un payload `/api/chat` valide contenant un `profile` est reçu
**Then** le system prompt généré inclut le nom, l'âge, le genre, le poids, l'objectif, le niveau d'activité et les restrictions alimentaires du profil (valeurs par défaut "unknown"/"none" si absentes), conformément au template du brief technique

**Given** `server/src/lib/groqClient.ts` encapsulant l'appel à l'API Groq (`llama-3.3-70b-versatile`, `stream: true`)
**When** `POST /api/chat` est appelé avec un payload valide
**Then** la réponse a `Content-Type: text/event-stream`
**And** chaque chunk reçu de Groq est renvoyé au format `data: {"delta": "..."}\n\n`
**And** le flux se termine par `data: [DONE]\n\n`

**Given** l'appel à Groq retourne une erreur transitoire (429 ou 5xx)
**When** `groqClient` traite cette erreur
**Then** jusqu'à 3 tentatives sont effectuées avec un backoff exponentiel (~500ms / 1s / 2s)

**Given** les 3 tentatives de retry échouent
**When** le flux SSE est en cours
**Then** un message `data: {"error": {"message": "...", "code": "GROQ_UNAVAILABLE"}}\n\n` est envoyé, suivi de `data: [DONE]\n\n`

**Given** la clé API Groq configurée via `server/.env` (`GROQ_API_KEY`)
**When** le serveur traite une requête `/api/chat`
**Then** la clé n'est jamais exposée dans la réponse au client ni dans les logs

### Story 2.3: Interface de chat avec streaming et mémoire

As a utilisateur,
I want envoyer des messages au coach et voir sa réponse apparaître progressivement, le coach se souvenant de ce que j'ai dit plus tôt dans la conversation,
So that j'ai une expérience de conversation naturelle et fluide (FR3, FR4).

**Acceptance Criteria:**

**Given** la page `/chat` affichée avec `InputBar`
**When** l'utilisateur saisit un message et l'envoie
**Then** le message apparaît immédiatement dans `Chat` comme bulle utilisateur (alignée à droite, style atténué selon PRD §6)
**And** `useChat` envoie `POST /api/chat` avec l'historique complet des messages de la conversation active + le profil utilisateur

**Given** une réponse en streaming reçue du serveur
**When** des chunks `data: {"delta": "..."}` arrivent
**Then** une bulle de réponse du coach (alignée à gauche, accentuée) se construit progressivement avec une animation de frappe (`isStreaming === true`)
**And** à la réception de `data: [DONE]`, `isStreaming` repasse à `false`

**Given** une conversation déjà entamée avec plusieurs messages
**When** l'utilisateur envoie un nouveau message faisant référence à un élément mentionné précédemment
**Then** l'ensemble des messages précédents de la conversation active est inclus dans la requête `/api/chat`, permettant au coach d'y faire référence

**Given** une réponse d'erreur reçue via le flux SSE (`data: {"error": {...}}`)
**When** `useChat` traite ce message
**Then** `ErrorBanner` affiche un message convivial traduit, et `isStreaming` repasse à `false` sans bloquer l'envoi de futurs messages

**Given** l'utilisateur envoie un message alors qu'une réponse est en cours de streaming
**When** il clique sur le bouton d'envoi
**Then** l'envoi est désactivé/bloqué jusqu'à la fin du streaming en cours (pas d'envois concurrents sur la même conversation)

## Epic 3: Gestion de l'historique des conversations

Un utilisateur peut démarrer de nouvelles conversations, naviguer entre ses conversations passées via une barre latérale, et supprimer celles dont il n'a plus besoin.

### Story 3.1: Création et persistance de conversations

As a utilisateur,
I want démarrer une nouvelle conversation avec le coach et que mes conversations passées restent accessibles,
So that je peux organiser mes échanges par sujet/session sans perdre l'historique (FR5).

**Acceptance Criteria:**

**Given** la page `/chat` affichée
**When** l'utilisateur clique sur "Nouvelle conversation"
**Then** une nouvelle conversation est créée avec un `id` généré via `crypto.randomUUID()`, un `title` par défaut (ex. "Nouvelle conversation" ou première phrase du premier message), et `createdAt` au format ISO 8601
**And** l'utilisateur est redirigé vers `/chat/:conversationId` avec cette nouvelle conversation comme conversation active

**Given** une conversation active avec au moins un échange de messages
**When** un message est envoyé et la réponse du coach est complétée (cf. Story 2.3)
**Then** la conversation (avec tous ses messages) est sauvegardée via `StorageRepository.saveConversation()` sous la clé `coach_conversations`

**Given** plusieurs conversations sauvegardées
**When** l'utilisateur recharge l'application et accède à `/chat/:conversationId` avec un ID existant
**Then** `useHistory`/`useChat` charge cette conversation depuis `StorageRepository.getConversation(id)` et affiche ses messages

**Given** l'utilisateur accède à `/chat/:conversationId` avec un ID qui n'existe pas dans le storage
**When** la page se charge
**Then** l'utilisateur est redirigé vers une nouvelle conversation (comportement équivalent à "Nouvelle conversation")

### Story 3.2: Navigation dans l'historique via la sidebar

As a utilisateur,
I want voir la liste de mes conversations passées dans une barre latérale et naviguer entre elles,
So that je peux reprendre une conversation précédente facilement (FR8).

**Acceptance Criteria:**

**Given** l'utilisateur a au moins une conversation sauvegardée
**When** la page `/chat` ou `/chat/:conversationId` est affichée
**Then** `Sidebar` liste toutes les conversations via `StorageRepository.listConversations()`, triées par date de dernière activité (plus récente en premier), affichant le `title` et une date formatée

**Given** la sidebar affichée avec plusieurs conversations
**When** l'utilisateur clique sur une conversation de la liste
**Then** la navigation se fait vers `/chat/:conversationId` correspondant, et cette conversation est chargée et affichée dans `Chat`

**Given** la conversation actuellement affichée correspond à un élément de la sidebar
**When** la sidebar est rendue
**Then** cet élément est visuellement mis en évidence comme "actif"

**Given** aucune conversation n'existe encore
**When** la sidebar est affichée
**Then** un état vide convivial est affiché (ex. message invitant à démarrer une conversation), sans erreur

### Story 3.3: Suppression de conversation

As a utilisateur,
I want supprimer une conversation dont je n'ai plus besoin,
So that mon historique reste pertinent et organisé (FR9).

**Acceptance Criteria:**

**Given** la sidebar affichée avec une conversation
**When** l'utilisateur déclenche l'action de suppression sur cette conversation (ex. icône poubelle)
**Then** une confirmation est demandée avant suppression définitive

**Given** la confirmation de suppression acceptée
**When** la suppression est exécutée
**Then** `StorageRepository.deleteConversation(id)` retire la conversation de `coach_conversations`
**And** la conversation disparaît immédiatement de la sidebar

**Given** l'utilisateur supprime la conversation actuellement active (`/chat/:conversationId`)
**When** la suppression est confirmée
**Then** l'utilisateur est redirigé vers une autre conversation existante (la plus récente) ou vers une nouvelle conversation si aucune n'existe

**Given** l'utilisateur annule la confirmation de suppression
**When** il ferme le dialogue de confirmation
**Then** la conversation reste inchangée dans la sidebar et le storage

## Epic 4: Expérience multilingue et RTL

Un utilisateur peut utiliser l'application en français, hébreu ou anglais ; l'interface s'affiche correctement en RTL pour l'hébreu, et le coach répond dans la langue de l'utilisateur, avec repli automatique vers l'anglais en cas d'échec de détection.

### Story 4.1: Complétion des traductions pour les Epics 2 et 3

As a développeur,
I want étendre les fichiers de traduction existants (`fr.json`, `he.json`, `en.json`) avec toutes les clés introduites par les Epics 2 et 3, et vérifier la cohérence complète des fichiers,
So that l'ensemble de l'UI de l'application (Epics 1 à 3) est entièrement traduite dans les trois langues, sans clé manquante ni incohérence entre fichiers.

> **Note :** L'infrastructure react-i18next (configuration, détection navigateur, fallback EN, `i18n.dir()`) a été mise en place dans la Story 1.6. Cette story se concentre uniquement sur la complétion du contenu des fichiers de traduction.

**Acceptance Criteria:**

**Given** les fichiers `fr.json`, `he.json`, `en.json` existants (créés en Story 1.6 avec les clés Epic 1)
**When** les Epics 2 et 3 sont implémentés
**Then** les trois fichiers sont mis à jour pour inclure toutes les clés de traduction introduites dans les Stories 2.1 à 2.3 et 3.1 à 3.3 (messages du chat, états de streaming, messages d'erreur Groq, labels de la sidebar, confirmation de suppression)

**Given** les trois fichiers de traduction complétés
**When** l'ensemble des composants de l'application est rendu dans chaque langue (`fr`, `he`, `en`)
**Then** aucune clé brute (ex. `"chat.error.unavailable"`) n'est visible à l'écran — toutes les clés ont une valeur dans les trois fichiers

**Given** `react-i18next` initialisé (Story 1.6)
**When** un composant des Epics 2 ou 3 utilise `useTranslation()`
**Then** les chaînes affichées correspondent aux clés du fichier de langue actif

**Given** une clé présente dans `fr.json` mais absente de `he.json` ou `en.json`
**When** le composant tente de l'afficher dans la langue manquante
**Then** la valeur de la langue de repli `en` est utilisée, sans erreur visible

### Story 4.2: Sélecteur de langue et persistance du choix

As a utilisateur,
I want choisir ma langue d'interface (français, hébreu ou anglais) depuis l'application et que ce choix soit conservé,
So that l'application reste affichée dans la langue de mon choix à chaque visite (FR10).

**Acceptance Criteria:**

**Given** l'application affichée
**When** l'utilisateur ouvre le sélecteur de langue (accessible depuis le shell applicatif, ex. header)
**Then** les trois options Français, עברית (Hébreu) et English sont proposées, avec la langue active mise en évidence

**Given** le sélecteur de langue affiché
**When** l'utilisateur sélectionne une nouvelle langue
**Then** l'interface entière se met à jour immédiatement dans la langue choisie, sans rechargement de page
**And** le choix est persisté (ex. champ `language` du profil via `StorageRepository.saveProfile()`, ou clé dédiée si aucun profil n'existe encore)

**Given** un utilisateur ayant déjà choisi une langue lors d'une visite précédente
**When** il revient sur l'application
**Then** l'interface s'affiche directement dans la langue précédemment choisie, sans dépendre à nouveau de `navigator.language`

**Given** un profil existant avec un champ `language` défini (ex. lors de l'onboarding)
**When** l'application se charge
**Then** la langue de l'interface correspond à `profile.language`

### Story 4.3: Support RTL pour l'hébreu

As a utilisateur hébréophone,
I want que l'interface s'affiche correctement de droite à gauche lorsque je sélectionne l'hébreu, et que le coach me réponde en hébreu,
So that l'expérience reste lisible et naturelle dans ma langue (FR11, NFR5).

**Acceptance Criteria:**

**Given** la langue active passe à l'hébreu (`he`)
**When** le changement de langue est appliqué
**Then** l'attribut `dir="rtl"` est appliqué sur `<html>` via `i18n.dir()`
**And** lorsque la langue passe à `fr` ou `en`, l'attribut redevient `dir="ltr"`

**Given** l'interface affichée en mode RTL (`dir="rtl"`)
**When** l'utilisateur consulte la sidebar, les bulles de chat et les formulaires (onboarding, profil)
**Then** la mise en page (alignements, marges, icônes directionnelles) s'inverse correctement sans chevauchement ni élément mal positionné, sur mobile et desktop

**Given** un utilisateur écrivant en hébreu dans `InputBar`
**When** le message est envoyé via `POST /api/chat`
**Then** le system prompt (cf. `buildSystemPrompt`) instruit le coach de répondre dans la même langue que le message de l'utilisateur (FR11)
**And** la bulle de réponse du coach affichée respecte également l'orientation RTL si la réponse est en hébreu

**Given** la détection de la langue d'un message utilisateur échoue ou est ambiguë côté coach
**When** le coach génère sa réponse
**Then** la réponse est produite en anglais par défaut (NFR4), conformément aux instructions du system prompt
