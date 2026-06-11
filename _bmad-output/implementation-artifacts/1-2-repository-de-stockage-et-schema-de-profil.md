---
status: review
baseline_commit: NO_VCS
---

# Story 1.2 : Repository de stockage & schéma de profil

Status: review

## Story

As a développeur,
I want une interface `StorageRepository` avec une implémentation `LocalStorageRepository`, ainsi qu'un schéma Zod `ProfileSchema` et son type inféré `Profile`,
so that toute donnée de profil (et plus tard de conversation) soit lue/écrite de manière cohérente, validée et facilement migrable vers une persistance distante en Phase 2.

## Acceptance Criteria

1. **[AC1 — Interface StorageRepository]** `client/src/repositories/StorageRepository.ts` expose au minimum les méthodes : `getProfile()`, `saveProfile(profile)`, `listConversations()`, `getConversation(id)`, `saveConversation(conversation)`, `deleteConversation(id)`.

2. **[AC2 — saveProfile / getProfile via localStorage]** `client/src/repositories/LocalStorageRepository.ts` implémente `StorageRepository`. `saveProfile(profile)` sérialise le profil en JSON et le stocke sous la clé `coach_profile` dans `localStorage` ; `getProfile()` retourne ensuite le même profil désérialisé.

3. **[AC3 — ProfileSchema Zod + validation à l'écriture]** `client/src/schemas/profile.schema.ts` définit `ProfileSchema` (Zod v4) avec les champs `name`, `age`, `gender`, `weight`, `goal`, `activityLevel`, `dietaryRestrictions`, `language` (tous optionnels) et `onboardingSkipped?: boolean`. `LocalStorageRepository.saveProfile(profile)` valide via `ProfileSchema.parse()` avant persistance ; si la validation échoue, une erreur explicite est levée et rien n'est écrit dans `localStorage`.

4. **[AC4 — getProfile sans profil existant]** Si aucun profil n'a encore été sauvegardé, `getProfile()` retourne `null` (ou `undefined`) sans lever d'erreur.

## Tasks / Subtasks

- [x] Task 1 : Installer Zod v4 dans `client` (AC: #3)
  - [x] 1.1 Ajouter `zod` (v4, dernière version stable) aux dépendances de `client/package.json`
  - [x] 1.2 Vérifier `tsc --noEmit` reste propre après l'installation

- [x] Task 2 : Créer `ProfileSchema` et le type `Profile` inféré (AC: #3)
  - [x] 2.1 Créer `client/src/schemas/profile.schema.ts` exportant `ProfileSchema` (`z.object({...}).partial()` ou champs `.optional()` individuels) avec les champs : `name?: string`, `age?: number`, `gender?: string`, `weight?: number`, `goal?: string`, `activityLevel?: string`, `dietaryRestrictions?: string[]`, `language?: string`, `onboardingSkipped?: boolean`
  - [x] 2.2 Exporter `export type Profile = z.infer<typeof ProfileSchema>;`
  - [x] 2.3 Mettre à jour `client/src/types/index.ts` : retirer l'interface `Profile` stub et ré-exporter (ou faire pointer les imports vers) `client/src/schemas/profile.schema.ts` — voir Dev Notes pour le pattern exact
  - [x] 2.4 Mettre à jour les imports existants de `Profile` (`AppContext.tsx`, `useProfile.ts`, `App.tsx` si applicable) pour utiliser le nouveau type sans rien casser

- [x] Task 3 : Définir l'interface `StorageRepository` (AC: #1)
  - [x] 3.1 Créer `client/src/repositories/StorageRepository.ts` exportant l'interface TypeScript `StorageRepository` avec les signatures : `getProfile(): Promise<Profile | null>`, `saveProfile(profile: Profile): Promise<void>`, `listConversations(): Promise<Conversation[]>`, `getConversation(id: string): Promise<Conversation | null>`, `saveConversation(conversation: Conversation): Promise<void>`, `deleteConversation(id: string): Promise<void>`
  - [x] 3.2 Importer `Profile` depuis `../schemas/profile.schema` et `Conversation` depuis `../types`

- [x] Task 4 : Implémenter `LocalStorageRepository` (AC: #2, #3, #4)
  - [x] 4.1 Créer `client/src/repositories/LocalStorageRepository.ts` implémentant `StorageRepository`
  - [x] 4.2 `saveProfile(profile)` : valider via `ProfileSchema.parse(profile)` (lève si invalide, *avant* tout accès à `localStorage`), puis `localStorage.setItem('coach_profile', JSON.stringify(parsed))`
  - [x] 4.3 `getProfile()` : lire `localStorage.getItem('coach_profile')` ; si absent → retourner `null` ; sinon `JSON.parse` puis retourner le résultat (le schéma a déjà validé à l'écriture, pas de re-validation obligatoire en lecture)
  - [x] 4.4 Implémenter `listConversations()`, `getConversation(id)`, `saveConversation(conversation)`, `deleteConversation(id)` sous la clé `coach_conversations` (tableau JSON de `Conversation`) — comportement minimal cohérent avec l'interface, l'usage réel de ces méthodes arrive en Epic 3 mais elles doivent être fonctionnelles et testées dès maintenant
  - [x] 4.5 Exporter une instance prête à l'emploi (ex. `export const localStorageRepository = new LocalStorageRepository();`) ou la classe seule — voir Dev Notes pour le choix retenu

- [x] Task 5 : Tests unitaires (AC: #2, #3, #4)
  - [x] 5.1 Créer `client/src/repositories/LocalStorageRepository.test.ts` (co-localisé)
  - [x] 5.2 Test : `saveProfile` puis `getProfile` retourne le même profil (round-trip JSON sous la clé `coach_profile`)
  - [x] 5.3 Test : `getProfile()` retourne `null` quand `localStorage` est vide
  - [x] 5.4 Test : `saveProfile` avec un profil invalide (ex. `age: "trente"` ou type incorrect) lève une erreur et n'écrit rien dans `localStorage`
  - [x] 5.5 Test : `saveConversation` / `getConversation` / `listConversations` / `deleteConversation` — round-trip basique sous `coach_conversations`
  - [x] 5.6 Créer/compléter `client/src/schemas/profile.schema.test.ts` : `ProfileSchema.parse({})` ne lève pas (tous champs optionnels) ; `ProfileSchema.parse({ age: 'invalid' })` lève une `ZodError`
  - [x] 5.7 S'assurer que `localStorage` est nettoyé entre chaque test (`beforeEach(() => localStorage.clear())`) — `jsdom` fournit déjà un `localStorage` global via `vitest.config.ts` (Story 1.1)

- [x] Task 6 : Validation finale (AC: tous)
  - [x] 6.1 `npm test -w client` — tous les tests passent (anciens + nouveaux)
  - [x] 6.2 `tsc --noEmit` sur `client` — zéro erreur

## Dev Notes

### Pattern `Profile` — remplacement du stub (Story 1.1 → 1.2)

Story 1.1 a créé un stub `Profile` dans `client/src/types/index.ts` avec un commentaire explicite indiquant qu'il serait remplacé en Story 1.2. Le pattern attendu par l'architecture :

```ts
// client/src/schemas/profile.schema.ts
import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  weight: z.number().optional(),
  goal: z.string().optional(),
  activityLevel: z.string().optional(),
  dietaryRestrictions: z.array(z.string()).optional(),
  language: z.string().optional(),
  onboardingSkipped: z.boolean().optional(),
});

export type Profile = z.infer<typeof ProfileSchema>;
```

Dans `client/src/types/index.ts` : **retirer** l'interface `Profile` stub. Garder `Message` et `Conversation` (toujours définis ici, pas de schéma Zod requis pour eux dans cette story — `ChatRequestSchema` arrive en Story 2.1).

Mettre à jour les imports :
```ts
// AppContext.tsx, useProfile.ts, etc.
import type { Profile } from '../schemas/profile.schema'; // au lieu de '../types'
```

Vérifier `client/src/context/AppContext.tsx`, `client/src/context/AppContext.test.tsx`, `client/src/hooks/useProfile.ts`, `client/src/hooks/useProfile.test.ts` (et tout autre fichier important `Profile` depuis `../types`) — adapter chaque import sans changer le comportement testé. Les tests de Story 1.1 (`profile === null`, etc.) doivent continuer à passer tels quels.

### Zod v4 — installation

Zod v4 est sorti et stable. Installer la dernière version 4.x (`npm install zod -w client`). Aucune configuration spéciale requise (contrairement à Tailwind v4) — l'API `z.object()`, `.optional()`, `.parse()`, `.infer` est stable depuis Zod 3 et reste disponible en v4. Vérifier dans `package.json` après installation que la version majeure est bien `^4.x`.

### `StorageRepository` — interface exacte

```ts
// client/src/repositories/StorageRepository.ts
import type { Profile } from '../schemas/profile.schema';
import type { Conversation } from '../types';

export interface StorageRepository {
  getProfile(): Promise<Profile | null>;
  saveProfile(profile: Profile): Promise<void>;
  listConversations(): Promise<Conversation[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
}
```

Toutes les méthodes sont `async`/`Promise` même si l'implémentation `localStorage` est synchrone — c'est requis pour que `ApiRepository` (Phase 2) respecte la même interface sans changer les hooks/composants appelants (architecture §Data Architecture).

### `LocalStorageRepository` — implémentation attendue

```ts
// client/src/repositories/LocalStorageRepository.ts
import type { StorageRepository } from './StorageRepository';
import type { Profile } from '../schemas/profile.schema';
import { ProfileSchema } from '../schemas/profile.schema';
import type { Conversation } from '../types';

const PROFILE_KEY = 'coach_profile';
const CONVERSATIONS_KEY = 'coach_conversations';

export class LocalStorageRepository implements StorageRepository {
  async getProfile(): Promise<Profile | null> {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Profile;
  }

  async saveProfile(profile: Profile): Promise<void> {
    const parsed = ProfileSchema.parse(profile); // throws ZodError if invalid
    localStorage.setItem(PROFILE_KEY, JSON.stringify(parsed));
  }

  async listConversations(): Promise<Conversation[]> {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  }

  async getConversation(id: string): Promise<Conversation | null> {
    const conversations = await this.listConversations();
    return conversations.find((c) => c.id === id) ?? null;
  }

  async saveConversation(conversation: Conversation): Promise<void> {
    const conversations = await this.listConversations();
    const index = conversations.findIndex((c) => c.id === conversation.id);
    const updated = index >= 0
      ? conversations.map((c) => (c.id === conversation.id ? conversation : c))
      : [...conversations, conversation];
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  }

  async deleteConversation(id: string): Promise<void> {
    const conversations = await this.listConversations();
    const updated = conversations.filter((c) => c.id !== id);
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(updated));
  }
}
```

**Choix d'export (Task 4.5)** : exporter à la fois la classe (`export class LocalStorageRepository`) et une instance par défaut prête à l'emploi pour les hooks futurs (Story 1.2 ne câble pas encore les hooks dessus — cela arrive en Stories 1.4/1.5/Epic 3) :
```ts
export const localStorageRepository = new LocalStorageRepository();
```

### `ProfileSchema.parse()` et erreurs

`ProfileSchema.parse(profile)` lève une `ZodError` (sous-classe de `Error`) si la validation échoue — c'est "l'erreur explicite" demandée par l'AC3. Ne pas attraper cette erreur dans `saveProfile` ; la laisser remonter à l'appelant (les hooks/composants gèreront l'affichage traduit dans les stories UI ultérieures, cf. architecture §Error Handling).

### Validation à l'écriture uniquement (pas en lecture)

L'AC3 demande la validation **à l'écriture** (`saveProfile`). `getProfile()` ne doit **pas** appeler `ProfileSchema.parse()` sur la donnée lue — les données stockées ont déjà été validées lors de l'écriture, et une re-validation stricte en lecture pourrait casser la rétrocompatibilité si le schéma évolue. Ne pas sur-ingiérer : retour direct du `JSON.parse()`.

### ⚠️ Accès localStorage non protégé (item déféré de Story 1.1)

`_bmad-output/implementation-artifacts/deferred-work.md` note que les accès `localStorage` ne sont pas protégés contre les exceptions (mode privé/storage désactivé). **Ne pas corriger ce point dans cette story** — hors scope des ACs 1.2, et le pattern de gestion d'erreur centralisé pour le storage sera traité plus tard si besoin. Ne pas ajouter de `try/catch` superflu autour de `localStorage` dans `LocalStorageRepository`.

### Tests — environnement localStorage

`client/vitest.config.ts` (créé en Story 1.1) utilise `environment: 'jsdom'`, qui fournit un `localStorage` global fonctionnel dans les tests. Pas de mock nécessaire — utiliser le vrai `localStorage` de jsdom et le nettoyer avec `localStorage.clear()` dans `beforeEach`.

### ⚠️ Ne PAS faire dans cette story

- Ne pas créer `ChatRequestSchema` ni `server/src/schemas/` — c'est Story 2.1
- Ne pas câbler `useProfile`/`useHistory` sur `LocalStorageRepository` — les hooks restent des stubs jusqu'aux stories qui en ont besoin (1.4, 1.5, Epic 3). Cette story crée uniquement la fondation (schéma + repository + tests)
- Ne pas créer de composants UI (`ProfileForm`, etc.)
- Ne pas modifier `server/` — cette story est 100% côté `client`

### Project Structure Notes

Fichiers à créer :
```
client/src/
├── schemas/
│   ├── profile.schema.ts
│   └── profile.schema.test.ts
├── repositories/
│   ├── StorageRepository.ts
│   ├── LocalStorageRepository.ts
│   └── LocalStorageRepository.test.ts
└── types/
    └── index.ts            # MODIFIÉ : retrait du stub Profile
```

Fichiers à modifier (imports `Profile`) :
- `client/src/context/AppContext.tsx`
- `client/src/context/AppContext.test.tsx` (si import direct de `Profile`)
- `client/src/hooks/useProfile.ts`
- `client/src/hooks/useProfile.test.ts` (si import direct de `Profile`)

Conventions à respecter (architecture §Naming Patterns) :
- Schéma Zod : `ProfileSchema` (PascalCase + suffixe `Schema`), type inféré `Profile` (PascalCase, sans suffixe)
- Repository : interface `StorageRepository`, implémentation `LocalStorageRepository`
- Tests co-localisés (`LocalStorageRepository.test.ts` à côté de `LocalStorageRepository.ts`)
- camelCase partout (`dietaryRestrictions`, `activityLevel`)

### Previous Story Intelligence (Story 1.1)

- Le stub `Profile` dans `client/src/types/index.ts` contient déjà exactement les champs requis par `ProfileSchema` — la migration est une simple traduction interface → schéma Zod, pas de redesign de champs.
- `Message` et `Conversation` restent dans `client/src/types/index.ts` (pas de schéma Zod requis pour eux en 1.2).
- Vitest est déjà configuré (`client/vitest.config.ts`, `environment: 'jsdom'`, `globals: true`) — pas de configuration supplémentaire nécessaire pour les nouveaux tests.
- `tsc --noEmit` doit rester à zéro erreur sur `client` (et `server`, non touché ici).
- Pas d'alias `@/` configuré — utiliser des imports relatifs (`../schemas/profile.schema`, `./StorageRepository`).

### References

- Architecture — Repository pattern & Data Architecture : [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture]
- Architecture — Naming Conventions : [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns]
- Architecture — Project Directory Structure : [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure]
- Architecture — Enforcement Guidelines (StorageRepository, Zod) : [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]
- Epics — Story 1.2 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2]
- Story 1.1 — Dev Notes (stub Profile, structure, vitest) : [Source: _bmad-output/implementation-artifacts/1-1-scaffold-du-projet-et-shell-applicatif.md#Dev Notes]
- Deferred work (localStorage non protégé — hors scope 1.2) : [Source: _bmad-output/implementation-artifacts/deferred-work.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 1.2 créée via bmad-create-story le 2026-06-11. Analyse complète : epics.md (Story 1.2 AC), architecture.md (Data Architecture, Naming/Structure Patterns, Project Directory Structure), TECHNICAL-BRIEF-coach-ia.md (forme du profil), Story 1.1 (stub Profile à remplacer, configuration Vitest/jsdom déjà en place). Aucune story précédente avec File List utile au-delà de 1.1. Pas de dépôt git — pas d'analyse de commits.

Point d'attention principal pour le dev agent : la migration du type `Profile` (stub interface → `z.infer<ProfileSchema>`) doit se faire sans casser les tests existants de Story 1.1 (`AppContext.test.tsx`, `useProfile.test.ts`).

Implémentation terminée le 2026-06-11 :
- Zod v4.4.3 installé dans `client`.
- `ProfileSchema` créé dans `client/src/schemas/profile.schema.ts` avec tous les champs optionnels (conforme AC3) ; `Profile` est désormais `z.infer<typeof ProfileSchema>`.
- Stub `Profile` retiré de `client/src/types/index.ts` ; `Message` et `Conversation` conservés.
- Imports de `Profile` mis à jour dans `AppContext.tsx` et `useProfile.ts` vers `../schemas/profile.schema` (aucun import direct dans les fichiers `.test.ts`/`.test.tsx`, donc aucune modification nécessaire).
- `StorageRepository` (interface) et `LocalStorageRepository` (implémentation) créés conformément aux Dev Notes, avec export de la classe et d'une instance `localStorageRepository`.
- Tests unitaires ajoutés : `profile.schema.test.ts` (2 tests) et `LocalStorageRepository.test.ts` (7 tests : profil round-trip, profil absent, profil invalide, conversations CRUD).
- `npm test -w client` : 6 fichiers / 21 tests, tous passent. `tsc --noEmit` sur `client` : zéro erreur.
- Note : `npm run lint -w client` rapporte 6 erreurs `no-unused-vars` préexistantes dans `useChat.ts`, `useHistory.ts` et `useProfile.ts` (paramètres de stubs créés en Story 1.1, hors scope de cette story).

### File List

- `client/package.json` (modifié — ajout dépendance `zod`)
- `client/package-lock.json` (modifié — installation `zod`)
- `client/src/schemas/profile.schema.ts` (nouveau)
- `client/src/schemas/profile.schema.test.ts` (nouveau)
- `client/src/repositories/StorageRepository.ts` (nouveau)
- `client/src/repositories/LocalStorageRepository.ts` (nouveau)
- `client/src/repositories/LocalStorageRepository.test.ts` (nouveau)
- `client/src/types/index.ts` (modifié — retrait du stub `Profile`)
- `client/src/context/AppContext.tsx` (modifié — import `Profile` depuis `../schemas/profile.schema`)
- `client/src/hooks/useProfile.ts` (modifié — import `Profile` depuis `../schemas/profile.schema`)

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-06-11 | 1.0 | Création initiale via bmad-create-story | bmad-create-story |
| 2026-06-11 | 1.1 | Implémentation complète : ProfileSchema, StorageRepository, LocalStorageRepository, tests | bmad-dev-story |
