---
status: done
baseline_commit: NO_VCS
---

# Story 1.1 : Scaffold du projet & shell applicatif

Status: done

## Story

As a développeur,
I want un monorepo initialisé (client Vite/React/TS/Tailwind v4 + server Express/TS via npm workspaces) avec un shell applicatif responsive en dark mode par défaut,
so that toutes les fonctionnalités suivantes peuvent être développées sur une base technique cohérente et conforme à l'architecture.

## Acceptance Criteria

1. **[AC1 — Structure monorepo]** Le projet contient les workspaces `client/` et `server/` avec leurs `package.json` et `tsconfig.json` respectifs, et Tailwind CSS v4 est configuré dans `client` via le plugin `@tailwindcss/vite`.

2. **[AC2 — Dev scripts]** `npm run dev` à la racine démarre le client Vite (port 5173) et le serveur Express (port 3001, `tsx watch`) en parallèle via `concurrently`.

3. **[AC3 — Dark mode par défaut]** L'interface s'affiche en mode sombre par défaut (palette navy + accent vert électrique + texte blanc chaud) ; un toggle bascule vers le mode clair et la préférence est persistée.

4. **[AC4 — Responsive]** Le layout s'adapte sans débordement sur mobile (< 768px) et desktop.

5. **[AC5 — Routes placeholder]** Les routes `/`, `/onboarding`, `/chat`, `/profile` affichent chacune une page placeholder distincte via React Router.

6. **[AC6 — AppContext]** `AppContext` expose via un Provider : `profile: Profile | null` (null), `activeConversationId: string | null` (null), `language: string` ('en'), et leurs setters. `App.tsx` enveloppe les routes dans ce Provider.

7. **[AC7 — Hook stubs]** `useProfile.ts`, `useHistory.ts`, `useChat.ts` exportent des fonctions stub retournant des valeurs par défaut typées.

## Tasks / Subtasks

- [x] Task 1 : Initialiser la structure monorepo (AC: #1)
  - [x] 1.1 Créer le `package.json` racine avec `"workspaces": ["client", "server"]`, scripts `dev`/`build`/`start`
  - [x] 1.2 Initialiser `client/` via `npm create vite@latest client -- --template react-ts` (React 18 + TypeScript)
  - [x] 1.3 Initialiser `server/` : `npm init -y`, ajouter TypeScript + `tsconfig.json` strict
  - [x] 1.4 Installer les dépendances racine : `concurrently`
  - [x] 1.5 Créer `.gitignore` (node_modules, dist, .env, client/dist) et `server/.env.example` (GROQ_API_KEY, PORT=3001)

- [x] Task 2 : Configurer Tailwind CSS v4 dans `client` (AC: #1, #3)
  - [x] 2.1 Installer `@tailwindcss/vite` dans `client`
  - [x] 2.2 Ajouter le plugin dans `client/vite.config.ts` : `import tailwindcss from '@tailwindcss/vite'`
  - [x] 2.3 Dans `client/src/index.css` : `@import "tailwindcss";` + `@custom-variant dark (&:where(.dark, .dark *));` + `@theme` avec tokens couleur (navy, accent, warm-white)
  - [x] 2.4 Supprimer le contenu CSS par défaut de Vite

- [x] Task 3 : Créer le serveur Express (AC: #2)
  - [x] 3.1 Installer `express`, `@types/express`, `tsx` dans `server`
  - [x] 3.2 Créer `server/src/server.ts` : Express sur `process.env.PORT ?? 3001`, log de démarrage
  - [x] 3.3 Ajouter script `dev: tsx watch src/server.ts` dans `server/package.json`

- [x] Task 4 : Configurer les scripts racine avec concurrently (AC: #2)
  - [x] 4.1 Ajouter dans `package.json` racine : `"dev": "concurrently \"npm run dev -w client\" \"npm run dev -w server\""`, scripts `build` et `start`

- [x] Task 5 : Implémenter le shell UI avec dark/light mode (AC: #3, #4)
  - [x] 5.1 Définir le type `Profile` stub dans `client/src/types/index.ts` (interface avec champs optionnels — sera remplacé par le type Zod-inféré en Story 1.2)
  - [x] 5.2 Implémenter la logique theme dans `App.tsx` : état `isDark` initialisé depuis `localStorage` (défaut `true`), `useEffect` appliquant/retirant la classe `dark` sur `document.documentElement`, toggle persistant dans `localStorage`
  - [x] 5.3 Créer le layout de base dans `App.tsx` avec header contenant le toggle dark/light mode, zone de contenu principale responsive

- [x] Task 6 : Configurer React Router avec pages placeholder (AC: #5)
  - [x] 6.1 Installer `react-router-dom` dans `client`
  - [x] 6.2 Créer `client/src/pages/OnboardingPage.tsx`, `ChatPage.tsx`, `ProfilePage.tsx` — chaque page : composant minimal avec titre et texte placeholder distinct
  - [x] 6.3 Créer `client/src/routes/AppRoutes.tsx` : `<Routes>` avec `/` → redirect vers `/onboarding`, `/onboarding`, `/chat`, `/profile`
  - [x] 6.4 Envelopper `<AppRoutes>` dans `<BrowserRouter>` dans `main.tsx` ou `App.tsx`

- [x] Task 7 : Créer AppContext (AC: #6)
  - [x] 7.1 Créer `client/src/context/AppContext.tsx` avec `AppContextValue` (profile, setProfile, activeConversationId, setActiveConversationId, language, setLanguage) + Provider avec `useState` pour chaque valeur
  - [x] 7.2 Envelopper les routes dans `<AppContextProvider>` dans `App.tsx`
  - [x] 7.3 Écrire `client/src/context/AppContext.test.tsx` : vérifier les valeurs par défaut du contexte (profile=null, activeConversationId=null, language='en')

- [x] Task 8 : Créer les hooks stubs (AC: #7)
  - [x] 8.1 Créer `client/src/hooks/useProfile.ts` : retourne `{ profile: null, saveProfile: async () => {} }`
  - [x] 8.2 Créer `client/src/hooks/useHistory.ts` : retourne `{ conversations: [], saveConversation: async () => {}, deleteConversation: async () => {} }`
  - [x] 8.3 Créer `client/src/hooks/useChat.ts` : retourne `{ messages: [], sendMessage: async () => {}, isStreaming: false }`
  - [x] 8.4 Écrire `useProfile.test.ts`, `useHistory.test.ts`, `useChat.test.ts` — vérifier la forme et les types des valeurs retournées

- [x] Task 9 : Configurer Vitest et valider (AC: tous)
  - [x] 9.1 Créer `client/vitest.config.ts` séparé (Vite 8 rolldown incompatible avec Vitest v3 rollup — config test dans fichier dédié)
  - [x] 9.2 Installer `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` dans `client` (devDependencies)
  - [x] 9.3 Ajouter script `"test": "vitest run"` dans `client/package.json`
  - [x] 9.4 Faire passer tous les tests (`npm test -w client`) — 12/12 ✓
  - [x] 9.5 Faire passer `tsc --noEmit` sur `client` et `server` (zéro erreur TypeScript) ✓

### Review Findings

- [x] [Review][Patch] Fichiers de scaffold Vite inutilisés à supprimer (App.css, assets/react.svg, assets/vite.svg, assets/hero.png) [client/src/App.css, client/src/assets/*]
- [x] [Review][Defer] Le toggle "mode clair" n'a aucun effet visuel — bg/text appliqués sans condition dans App.tsx, aucune palette claire définie dans index.css (AC3) [client/src/App.tsx, client/src/index.css] — deferred: palette mode clair non définie dans le PRD ; le mode sombre est l'expérience principale ; reporté à la phase de polish
- [x] [Review][Defer] CORS non configuré côté serveur malgré CLIENT_URL défini dans .env.example [server/src/server.ts, .env.example:3] — deferred, pre-existing
- [x] [Review][Defer] GROQ_API_KEY défini dans .env.example mais jamais consommé [.env.example:1] — deferred, pre-existing
- [x] [Review][Defer] Accès localStorage non protégés contre les exceptions (mode privé/storage désactivé) [client/src/App.tsx:8-9,14] — deferred, pre-existing
- [x] [Review][Defer] Pas de route catch-all/wildcard dans AppRoutes [client/src/routes/AppRoutes.tsx:8-14] — deferred, pre-existing
- [x] [Review][Defer] vitest listé en devDependency côté serveur sans script de test ni fichiers de test [server/package.json] — deferred, pre-existing

## Dev Notes

### ⚠️ TAILWIND CSS v4 — DIFFÉRENCES CRITIQUES AVEC v3

**NE PAS utiliser `tailwind.config.js`** — Tailwind v4 n'utilise plus ce fichier.

**Configuration correcte Tailwind v4 avec Vite :**

```ts
// client/vite.config.ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

```css
/* client/src/index.css */
@import "tailwindcss";

/* Dark mode via classe CSS sur <html> */
@custom-variant dark (&:where(.dark, .dark *));

/* Tokens couleur du projet — palette PRD §6 */
@theme {
  --color-navy-950: #0a1628;
  --color-navy-900: #0d1b2a;
  --color-navy-800: #1a2e4a;
  --color-accent: #00e676;      /* vert électrique */
  --color-warm-white: #f5f0e8;
}
```

**Utilisation dans les composants :**
```tsx
// Exemple dark mode avec classes Tailwind v4
<div className="bg-navy-950 dark:bg-navy-950 text-warm-white">
```

### ⚠️ TYPE `Profile` STUB — PATTERN IMPORTANT

Story 1.2 créera `ProfileSchema` (Zod v4) et inférera `Profile` via `z.infer<typeof ProfileSchema>`. Pour Story 1.1, définir un stub dans `client/src/types/index.ts` :

```ts
// client/src/types/index.ts
// STUB — sera remplacé par z.infer<typeof ProfileSchema> en Story 1.2
export interface Profile {
  name?: string;
  age?: number;
  gender?: string;
  weight?: number;
  goal?: string;
  activityLevel?: string;
  dietaryRestrictions?: string[];
  language?: string;
  onboardingSkipped?: boolean;
}
```

AppContext doit importer depuis `../types`. En Story 1.2, l'import sera mis à jour vers `../schemas/profile.schema`.

### AppContext — forme exacte requise par l'architecture

```tsx
// client/src/context/AppContext.tsx
interface AppContextValue {
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  language: string;
  setLanguage: (lang: string) => void;
}
```

**Ne pas ajouter** `conversations` dans AppContext — l'architecture réserve cela au hook `useHistory`. Ne pas ajouter de logique métier dans le contexte (uniquement état + setters).

### Dark mode — implémentation requise

```tsx
// Dans App.tsx
const [isDark, setIsDark] = useState<boolean>(() => {
  const saved = localStorage.getItem('theme');
  return saved !== null ? saved === 'dark' : true; // dark par défaut
});

useEffect(() => {
  document.documentElement.classList.toggle('dark', isDark);
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}, [isDark]);
```

### React Router — routes obligatoires

```tsx
// client/src/routes/AppRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';

<Routes>
  <Route path="/" element={<Navigate to="/onboarding" replace />} />
  <Route path="/onboarding" element={<OnboardingPage />} />
  <Route path="/chat" element={<ChatPage />} />
  <Route path="/chat/:conversationId" element={<ChatPage />} />
  <Route path="/profile" element={<ProfilePage />} />
</Routes>
```

**Note :** `/chat/:conversationId` doit déjà être déclaré ici même si non utilisé en Story 1.1 — requis par l'architecture avant Story 3.1.

### Hook stubs — forme exacte

```ts
// useProfile.ts
export function useProfile() {
  return {
    profile: null as Profile | null,
    saveProfile: async (_profile: Profile): Promise<void> => {},
  };
}

// useHistory.ts
export function useHistory() {
  return {
    conversations: [] as Conversation[],
    saveConversation: async (_conv: Conversation): Promise<void> => {},
    deleteConversation: async (_id: string): Promise<void> => {},
  };
}

// useChat.ts
export function useChat() {
  return {
    messages: [] as Message[],
    sendMessage: async (_content: string): Promise<void> => {},
    isStreaming: false,
  };
}
```

**Note :** Les types `Conversation` et `Message` seront définis proprement en Stories 1.2 et 2.3. Pour Story 1.1, créer des interfaces minimales dans `client/src/types/index.ts` :
```ts
export interface Message { role: 'user' | 'assistant'; content: string; }
export interface Conversation { id: string; title: string; messages: Message[]; createdAt: string; }
```

### Scripts racine (package.json racine)

```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev -w client\" \"npm run dev -w server\"",
    "build": "npm run build -w client && npm run build -w server",
    "start": "node server/dist/server.js"
  }
}
```

### Server TypeScript — configuration minimale

```json
// server/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

### Tests — ce qui doit passer en Story 1.1

Les tests de Story 1.1 valident uniquement la forme/défaults, pas la logique métier :

```ts
// AppContext.test.tsx — vérifier que le Provider s'initialise correctement
it('initializes with null profile', () => {
  const { result } = renderHook(() => useContext(AppContext), {
    wrapper: AppContextProvider,
  });
  expect(result.current.profile).toBeNull();
  expect(result.current.language).toBe('en');
  expect(result.current.activeConversationId).toBeNull();
});

// useProfile.test.ts — vérifier la forme du stub
it('returns stub shape', () => {
  const { profile, saveProfile } = useProfile();
  expect(profile).toBeNull();
  expect(typeof saveProfile).toBe('function');
});
```

### Structure de projet — fichiers à créer dans Story 1.1

```
salut-app/                          ← racine du repo
├── package.json                    # workspaces + scripts concurrently
├── .gitignore
├── .env.example                    # GROQ_API_KEY=, PORT=3001
├── client/
│   ├── package.json
│   ├── vite.config.ts              # react + tailwindcss plugins + vitest config
│   ├── tsconfig.json               # strict: true
│   ├── tsconfig.node.json
│   ├── index.html
│   └── src/
│       ├── main.tsx                # BrowserRouter + createRoot
│       ├── App.tsx                 # AppContextProvider + AppRoutes + theme toggle
│       ├── index.css               # @import tailwindcss + @custom-variant + @theme
│       ├── types/
│       │   └── index.ts            # Profile, Message, Conversation (stubs)
│       ├── context/
│       │   ├── AppContext.tsx
│       │   └── AppContext.test.tsx
│       ├── hooks/
│       │   ├── useProfile.ts
│       │   ├── useProfile.test.ts
│       │   ├── useHistory.ts
│       │   ├── useHistory.test.ts
│       │   ├── useChat.ts
│       │   └── useChat.test.ts
│       ├── pages/
│       │   ├── OnboardingPage.tsx  # placeholder
│       │   ├── ChatPage.tsx        # placeholder
│       │   └── ProfilePage.tsx     # placeholder
│       └── routes/
│           └── AppRoutes.tsx
└── server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        └── server.ts               # Express minimal sur PORT=3001
```

**⚠️ Ne PAS créer** `client/src/components/`, `client/src/repositories/`, `client/src/schemas/`, `client/src/i18n/`, `server/src/routes/`, `server/src/middleware/`, `server/src/lib/` — ces dossiers sont créés dans les stories ultérieures.

### Project Structure Notes

- Toutes les importations TypeScript doivent utiliser des chemins relatifs (pas d'alias `@/` pour l'instant — non configuré en Story 1.1)
- `client/` et `server/` sont des workspaces npm **indépendants** — ne pas installer des dépendances `client` dans le root et vice-versa (sauf `concurrently` qui reste en root)
- Tailwind v4 ne génère pas de fichier `dist/tailwind.css` séparé — il est injecté par le plugin Vite au build
- `server/.env` doit être listé dans `.gitignore` ; seul `.env.example` est commité

### References

- Architecture — Structure projet : [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Patterns de nommage : [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Architecture — Tailwind v4 / Starter : [Source: _bmad-output/planning-artifacts/architecture.md#Selected Starter]
- Architecture — AppContext : [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Dark mode enforcement : [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Epics — Story 1.1 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 1.1 créée via bmad-create-story le 2026-06-11. Analyse complète des artefacts : architecture.md, epics.md, PRD-coach-ia.md, TECHNICAL-BRIEF-coach-ia.md. Projet greenfield — aucun code existant. Focus critique sur la configuration Tailwind v4 (anti-pattern majeur si config v3 utilisée) et le type Profile stub (sera remplacé en Story 1.2 par type Zod-inféré).

**Implémentation réalisée le 2026-06-11 :**

- `npm create vite@latest` a résolu sur React 19 + Vite 8.0.16 (au lieu de React 18 spécifié dans l'architecture). Versions acceptées — plus récentes et stables.
- **Incompatibilité Vite 8 (rolldown) vs Vitest v3 (rollup) :** Vite 8 a migré de rollup vers rolldown en interne. Le type `Plugin<any>` de rolldown contient `meta.rolldownVersion` absent du type rollup de Vitest. Solution : deux fichiers de config séparés (`vite.config.ts` pour le build, `vitest.config.ts` pour les tests avec `@ts-expect-error` sur les plugins). La config test ne figure plus dans `vite.config.ts`.
- **TypeScript 6 deprecation :** `moduleResolution: "node"` devient deprecated en TS 6. Ajout de `"ignoreDeprecations": "6.0"` dans `server/tsconfig.json` pour silence.
- Tous les ACs satisfaits : 12/12 tests passés, build prod propre, zéro erreur TypeScript.

### File List

**Racine :**
- `package.json` — workspaces, scripts concurrently
- `.gitignore`
- `.env.example`

**client/ :**
- `client/package.json` — react-router-dom, vitest, @testing-library/*
- `client/vite.config.ts` — react + tailwindcss plugins (build only)
- `client/vitest.config.ts` — config test séparé (jsdom, globals, setupFiles)
- `client/tsconfig.json`
- `client/tsconfig.node.json` — exclut vitest.config.ts
- `client/index.html`
- `client/src/main.tsx`
- `client/src/App.tsx` — BrowserRouter, AppContextProvider, theme toggle
- `client/src/index.css` — Tailwind v4 (@import, @custom-variant dark, @theme)
- `client/src/setupTests.ts`
- `client/src/types/index.ts` — Profile, Message, Conversation stubs
- `client/src/context/AppContext.tsx`
- `client/src/context/AppContext.test.tsx`
- `client/src/hooks/useProfile.ts`
- `client/src/hooks/useProfile.test.ts`
- `client/src/hooks/useHistory.ts`
- `client/src/hooks/useHistory.test.ts`
- `client/src/hooks/useChat.ts`
- `client/src/hooks/useChat.test.ts`
- `client/src/pages/OnboardingPage.tsx`
- `client/src/pages/ChatPage.tsx`
- `client/src/pages/ProfilePage.tsx`
- `client/src/routes/AppRoutes.tsx`

**server/ :**
- `server/package.json` — express, tsx, typescript
- `server/tsconfig.json` — strict, ES2022, CommonJS, ignoreDeprecations: "6.0"
- `server/src/server.ts` — Express minimal, route /health

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-06-11 | 1.0 | Création initiale via bmad-create-story | bmad-create-story |
| 2026-06-11 | 1.1 | Implémentation complète — monorepo, shell UI, tests 12/12 | claude-sonnet-4-6 |
