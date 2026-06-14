---
status: review
baseline_commit: e7af125
---

# Story 4.2 : Sélecteur de langue et persistance du choix

Status: review

## Story

As a utilisateur,
I want choisir ma langue d'interface (français, hébreu ou anglais) depuis l'application et que ce choix soit conservé,
So that l'application reste affichée dans la langue de mon choix à chaque visite (FR10).

## Acceptance Criteria

1. **[AC1 — Sélecteur visible avec langue active mise en évidence]** Given l'application affichée, When l'utilisateur ouvre le sélecteur de langue (accessible depuis le shell applicatif, dans le header), Then les trois options Français, עברית (Hébreu) et English sont proposées, avec la langue active mise en évidence.

2. **[AC2 — Changement immédiat sans rechargement + persistance]** Given le sélecteur de langue affiché, When l'utilisateur sélectionne une nouvelle langue, Then l'interface entière se met à jour immédiatement dans la langue choisie (`i18n.changeLanguage`), sans rechargement de page, And le choix est persisté via `StorageRepository` — dans le champ `language` du profil (`saveProfile`) si un profil existe, sinon via une clé dédiée du repository si aucun profil n'existe encore.

3. **[AC3 — Restauration du choix précédent au chargement]** Given un utilisateur ayant déjà choisi une langue lors d'une visite précédente (persistée selon AC2), When il revient sur l'application (rechargement), Then l'interface s'affiche directement dans la langue précédemment choisie, sans dépendre à nouveau de `navigator.language`.

4. **[AC4 — Profil avec `language` défini prioritaire]** Given un profil existant avec un champ `language` défini (ex. lors de l'onboarding), When l'application se charge, Then la langue de l'interface correspond à `profile.language`.

## Tasks / Subtasks

- [x] Task 1 : Étendre `StorageRepository` pour la persistance de la langue sans profil (AC: #2, #3)
  - [x] 1.1 Dans `client/src/repositories/StorageRepository.ts`, ajouter à l'interface : `getLanguage(): Promise<string | null>` et `setLanguage(lang: string): Promise<void>`
  - [x] 1.2 Dans `client/src/repositories/LocalStorageRepository.ts`, implémenter ces deux méthodes avec une nouvelle clé dédiée `coach_language` (suivre la convention des constantes existantes `PROFILE_KEY`/`CONVERSATIONS_KEY`/`DISCLAIMER_KEY`, ex. `LANGUAGE_KEY = 'coach_language'`)
  - [x] 1.3 `getLanguage()` retourne `null` si la clé n'existe pas (pas d'erreur), `setLanguage(lang)` écrit la chaîne brute (pas de JSON.stringify nécessaire pour une simple string, mais rester cohérent — utiliser `localStorage.setItem(LANGUAGE_KEY, lang)` / `localStorage.getItem(LANGUAGE_KEY)`)
  - [x] 1.4 Ajouter les tests correspondants dans `client/src/repositories/LocalStorageRepository.test.ts` (suivre le style des tests existants pour `getDisclaimerAcknowledged`/`setDisclaimerAcknowledged`) : `getLanguage()` retourne `null` par défaut, `setLanguage('he')` puis `getLanguage()` retourne `'he'`

- [x] Task 2 : Créer le composant `LanguageSelector` (AC: #1, #2)
  - [x] 2.1 Créer `client/src/components/LanguageSelector.tsx` — composant fonctionnel utilisant `useTranslation()` pour obtenir l'instance `i18n` et la fonction `t`
  - [x] 2.2 Afficher un élément `<select>` (HTML natif, accessible, cohérent avec le reste de l'UI — pas de librairie de dropdown externe) avec 3 `<option>` : `fr` → "Français", `he` → "עברית", `en` → "English" — utiliser des libellés en dur pour les noms de langues eux-mêmes (ce ne sont pas des textes à traduire, ce sont des noms de langues natives), mais le `aria-label`/label du sélecteur doit passer par `t('language.selectorLabel')` (nouvelle clé i18n, cf. Task 4)
  - [x] 2.3 La valeur sélectionnée (`value`) du `<select>` doit refléter `i18n.language` (langue active mise en évidence — AC1)
  - [x] 2.4 Au changement (`onChange`), appeler une fonction `onChangeLanguage(lang: string)` reçue en prop (le composant `LanguageSelector` est purement présentationnel — il ne connaît pas le repository ni le profil, conformément au pattern `ConfirmDialog`/`ErrorBanner`/`Message` qui reçoivent des callbacks/props et ne font pas d'accès direct au storage)
  - [x] 2.5 Styles Tailwind cohérents avec le header existant (`bg-navy-900`/`border-navy-700`/`text-warm-white`, classes `rounded`, `border`, `focus:outline-none focus:border-accent` — cf. `App.tsx` bouton de thème et `ProfileForm.tsx` champs)

- [x] Task 3 : Brancher `LanguageSelector` dans `App.tsx` — changement + persistance (AC: #2, #4)
  - [x] 3.1 Importer et utiliser `useProfile()` dans `App.tsx` (déjà disponible via `client/src/hooks/useProfile.ts`) pour accéder à `profile`, `isLoading` et `saveProfile`
  - [x] 3.2 Ajouter une fonction `handleChangeLanguage(lang: string)` dans `App.tsx` :
    - Appeler `i18n.changeLanguage(lang)` (déclenche immédiatement la mise à jour de l'UI et de `dir` via le listener déjà configuré dans `client/src/i18n/index.ts`)
    - Si `profile` existe (non `null`), appeler `saveProfile({ ...profile, language: lang })`
    - Sinon, appeler `localStorageRepository.setLanguage(lang)` (import direct de `localStorageRepository`, cohérent avec l'usage existant de `setDisclaimerAcknowledged` dans `App.tsx`)
  - [x] 3.3 Ajouter `<LanguageSelector onChangeLanguage={handleChangeLanguage} />` dans le `<header>` de `App.tsx`, à côté du bouton de bascule de thème (ordre : titre — sélecteur de langue — bouton thème, ou tout ordre cohérent avec le layout responsive existant ; vérifier absence de débordement sur mobile comme dans Story 1.1)

- [x] Task 4 : Restauration du choix de langue au chargement (AC: #3, #4)
  - [x] 4.1 Dans `App.tsx`, ajouter un `useEffect` exécuté une seule fois au montage (après le chargement du profil via `useProfile`, donc dépendant de `isLoading` et `profile`) :
    - Si `profile?.language` est défini (non vide) → `i18n.changeLanguage(profile.language)` (priorité au profil — AC4)
    - Sinon, si `localStorageRepository.getLanguage()` retourne une valeur non nulle → `i18n.changeLanguage(savedLang)` (AC3)
    - Sinon → ne rien faire (laisser la détection `navigator` de `i18next-browser-languagedetector`, déjà active depuis Story 1.6, gérer la langue initiale)
  - [x] 4.2 Ne pas déclencher cet effet avant que `isLoading` (de `useProfile`) soit `false`, pour éviter une course entre la détection initiale `navigator` et la restauration du profil
  - [x] 4.3 Vérifier qu'aucune boucle infinie ne se produit : l'effet de restauration ne doit s'exécuter qu'une fois (dépendances `[isLoading]` ou équivalent avec garde, pas `[profile, language]` qui ré-déclencherait à chaque `changeLanguage`)

- [x] Task 5 : Traductions — nouvelle clé `language.selectorLabel` (AC: #1)
  - [x] 5.1 Ajouter une nouvelle section `"language": { "selectorLabel": "..." }` dans `client/src/i18n/locales/fr.json`, `en.json` et `he.json` (camelCase, structure identique dans les 3 fichiers — cf. convention Story 4.1)
    - `fr.json` : `"selectorLabel": "Langue de l'interface"`
    - `en.json` : `"selectorLabel": "Interface language"`
    - `he.json` : `"selectorLabel": "שפת המנשק"`
  - [x] 5.2 Vérifier que `client/src/i18n/locales.test.ts` (créé en Story 4.1) passe toujours — il vérifie la parité stricte des clés entre les 3 fichiers, donc la nouvelle section doit être ajoutée de façon identique dans les 3 fichiers

- [x] Task 6 : Tests du composant `LanguageSelector` et de l'intégration dans `App` (AC: tous)
  - [x] 6.1 Créer `client/src/components/LanguageSelector.test.tsx` (co-localisé, suit la convention des autres tests de composants présentationnels comme `ConfirmDialog.test.tsx`) :
    - Le `<select>` affiche les 3 options (Français/עברית/English)
    - La valeur sélectionnée correspond à `i18n.language` courant (mettre `i18n.changeLanguage('fr')` dans un `beforeEach`/via `setupTests.ts` déjà en place)
    - La sélection d'une nouvelle option appelle `onChangeLanguage` avec le code de langue correspondant (`fireEvent.change` + `vi.fn()`)
  - [x] 6.2 Étendre `client/src/App.test.tsx` :
    - Le sélecteur de langue est rendu dans le header (`screen.getByRole('combobox', ...)` ou équivalent)
    - Sélectionner "English" met à jour l'affichage des textes traduits (ex. vérifier qu'un texte du header passe en anglais) sans rechargement
    - Sélectionner une langue persiste le choix : vérifier via `localStorageRepository.getLanguage()` (cas sans profil) que la valeur est bien enregistrée après le changement
    - **Important** : chaque test doit se terminer ou commencer par `i18n.changeLanguage('fr')` (cf. pattern existant dans `i18n/index.test.ts` avec `afterEach`) pour ne pas polluer les autres suites de tests qui supposent le français par défaut (`setupTests.ts`)
  - [x] 6.3 Test de restauration (AC3/AC4) — dans `App.test.tsx` ou un test dédié : avec un profil ayant `language: 'he'` déjà sauvegardé via `localStorageRepository.saveProfile(...)` avant le `render(<App />)`, vérifier qu'après chargement `i18n.language === 'he'` et `document.documentElement.dir === 'rtl'` ; idem avec `localStorageRepository.setLanguage('en')` sans profil

- [x] Task 7 : Validation finale (AC: tous)
  - [x] 7.1 `npm test -w client` — tous les tests passent (suite existante + nouveaux tests `LanguageSelector.test.tsx`, `App.test.tsx` étendu, `LocalStorageRepository.test.ts` étendu), sans régression
  - [x] 7.2 `tsc -b` sur `client` — zéro erreur
  - [x] 7.3 Vérification manuelle (optionnelle) : `npm run dev`, changer la langue via le sélecteur dans le header, recharger la page, confirmer que la langue choisie persiste

## Dev Notes

### Périmètre exact de la story

- 100% côté `client`. Aucune modification de `server/`.
- Ne pas implémenter le support RTL spécifique aux bulles de chat / formulaires / sidebar — c'est la **Story 4.3**, hors scope ici. Cette story se limite au sélecteur, au déclenchement de `i18n.changeLanguage` (qui applique déjà `dir` sur `<html>` via le mécanisme de Story 1.6) et à la persistance/restauration du choix.
- Ne pas modifier la logique de détection de langue côté serveur (`buildSystemPrompt`) — hors scope (Epic 4 / Story 4.3).
- Ne pas modifier `client/src/i18n/index.ts` (config de base déjà finalisée en Story 1.6 — la détection `navigator` + fallback `en` + `i18n.dir()` restent inchangés ; cette story ajoute une **restauration explicite** par-dessus, dans `App.tsx`, qui s'exécute après l'init i18n).
- `AppContext` expose déjà `language`/`setLanguage` (Story 1.1, jamais branchés) — **ne pas** les utiliser pour cette story : `i18n.language` (via `useTranslation()`) est la source de vérité pour la langue active, c'est ce que consomment déjà `Sidebar.tsx` (`i18n.language` pour `Intl.DateTimeFormat`) et `index.test.ts`. Introduire une deuxième source de vérité (`AppContext.language`) créerait une désynchronisation. Si une story future veut nettoyer `AppContext.language`/`setLanguage` (code mort), ce sera hors scope ici — ne pas y toucher non plus (pas de suppression non sollicitée).

### Fichiers à lire avant modification (état actuel)

- **`client/src/repositories/StorageRepository.ts`** (8 méthodes actuelles : `getProfile`, `saveProfile`, `listConversations`, `getConversation`, `saveConversation`, `deleteConversation`, `getDisclaimerAcknowledged`, `setDisclaimerAcknowledged`) → ajouter `getLanguage`/`setLanguage` en suivant exactement le même style (Promise, pas de paramètres superflus).
- **`client/src/repositories/LocalStorageRepository.ts`** → ajouter la constante `LANGUAGE_KEY = 'coach_language'` au même endroit que `PROFILE_KEY`/`CONVERSATIONS_KEY`/`DISCLAIMER_KEY`, et les deux méthodes juste après `setDisclaimerAcknowledged`.
- **`client/src/App.tsx`** (état actuel, 64 lignes) : contient déjà la gestion du thème (`isDark`, `useEffect` + `localStorage` direct pour le thème — **ce pattern `localStorage` direct pour le thème est une exception pré-existante, ne pas le reproduire pour la langue** : utiliser `StorageRepository`/`localStorageRepository` comme demandé par l'architecture) et la gestion du disclaimer (`useEffect` + `localStorageRepository`). Le header actuel contient un `<span>` titre et un `<button>` de bascule de thème — y insérer `LanguageSelector`.
- **`client/src/hooks/useProfile.ts`** : expose `{ profile, isLoading, saveProfile }` — `saveProfile` fait déjà `ProfileSchema.parse` via `LocalStorageRepository.saveProfile` et met à jour `AppContext`. Réutiliser directement, pas de nouveau hook nécessaire.
- **`client/src/schemas/profile.schema.ts`** : `language: z.string().optional()` existe déjà — aucune modification de schéma nécessaire.
- **`client/src/i18n/index.ts`** : `i18n.on('languageChanged', applyDirection)` est déjà branché — tout appel à `i18n.changeLanguage(lang)` met à jour `dir`/`lang` sur `<html>` automatiquement, aucune action supplémentaire requise pour AC2/AC3 côté `dir`.

### Conventions à respecter

- `useTranslation` (react-i18next) pour tout texte affiché (les noms des langues eux-mêmes — "Français"/"עברית"/"English" — ne sont PAS des clés de traduction car ce sont les noms natifs des langues, identiques dans toutes les locales ; seul le label/aria-label du sélecteur passe par `t()`).
- Accéder au stockage uniquement via `StorageRepository`/`localStorageRepository`, jamais `localStorage` direct dans les composants (exception pré-existante : le thème dans `App.tsx`, ne pas étendre ce pattern).
- camelCase pour les clés de traduction et les méthodes du repository.
- Composants présentationnels (`LanguageSelector`) reçoivent des callbacks en props et ne font pas d'accès direct au storage — cf. `ConfirmDialog.tsx`/`ErrorBanner.tsx`/`Message.tsx`.
- Tests co-localisés (`LanguageSelector.test.tsx` à côté de `LanguageSelector.tsx`).
- Tests de composants s'exécutent en français par défaut (`setupTests.ts` force `i18n.changeLanguage('fr')`) — tout test qui change la langue doit la restaurer en `fr` (via `afterEach`) pour ne pas casser les suites suivantes.

### Previous Story Intelligence

- Story 1.6 a établi la config i18n (`client/src/i18n/index.ts`), la détection `navigator`, le fallback `en`, et `i18n.dir()` appliqué sur `<html>` via un listener `languageChanged` — réutilisé tel quel ici, aucune modification.
- Story 4.1 (en `review`) a ajouté `client/src/i18n/locales.test.ts`, un test de parité stricte des clés entre `fr.json`/`en.json`/`he.json` — toute nouvelle clé (`language.selectorLabel`) doit être ajoutée dans les 3 fichiers simultanément, avec une valeur `string` non vide, sous peine de faire échouer ce test.
- `git status` montre que `client/src/i18n/locales/{fr,en,he}.json`, `client/src/types/index.ts`, `client/src/hooks/useChat.ts`/`useHistory.ts`, `client/src/pages/ChatPage.tsx` et plusieurs composants Epic 2/3 sont non commités (Epics 2/3, en `review`) — ce sont des prérequis déjà en place (pas des changements à faire ici), mais signifie que cette story s'appuie sur un état de travail non encore figé. Ne pas re-modifier ces fichiers sauf les ajouts de traduction `language.*` dans les 3 `locales/*.json` (Task 5).

### Project Structure Notes

Fichiers à créer :
```
client/src/components/LanguageSelector.tsx
client/src/components/LanguageSelector.test.tsx
```

Fichiers à modifier :
```
client/src/repositories/StorageRepository.ts        # + getLanguage/setLanguage
client/src/repositories/LocalStorageRepository.ts   # + LANGUAGE_KEY, implémentations
client/src/repositories/LocalStorageRepository.test.ts  # + tests getLanguage/setLanguage
client/src/App.tsx                                   # + LanguageSelector dans le header, handlers, restauration
client/src/App.test.tsx                              # + tests sélection/persistance/restauration
client/src/i18n/locales/{fr,en,he}.json              # + section "language": { "selectorLabel": "..." }
```

Aucun autre fichier ne devrait être modifié par cette story (pas de changement serveur, pas de nouvelle route, pas de modification de `client/src/i18n/index.ts`, `AppContext.tsx`, `AppRoutes.tsx`, ou des schémas Zod).

### References

- Epics — Story 4.2 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 4.2]
- Architecture — Frontend Architecture (i18n, sélecteur manuel + détection initiale du navigateur, `i18n.dir()`) : [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Enforcement Guidelines ("Accéder au stockage uniquement via `StorageRepository`", "Utiliser `useTranslation` pour tout texte affiché") : [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules]
- Story 1.6 — Infrastructure i18n (config, détection, fallback, `i18n.dir()`) : [Source: _bmad-output/implementation-artifacts/1-6-infrastructure-i18n-initialisation-et-traductions-epic-1.md]
- Story 4.1 — Conventions de traduction et test de parité de clés `locales.test.ts` : [Source: _bmad-output/implementation-artifacts/4-1-completion-des-traductions-pour-les-epics-2-et-3.md#Dev Notes]
- Code existant — `client/src/App.tsx`, `client/src/hooks/useProfile.ts`, `client/src/repositories/LocalStorageRepository.ts`, `client/src/schemas/profile.schema.ts` (lus intégralement pendant l'analyse de cette story)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 4.2 créée via bmad-create-story le 2026-06-14. Analyse complète : epics.md (Story 4.2 AC), Story 1.6 (infra i18n existante — détection navigator, fallback en, `i18n.dir()` via listener déjà branché, donc AC2/AC3 côté `dir` ne demandent aucun code supplémentaire), Story 4.1 (test de parité de clés `locales.test.ts` — toute nouvelle clé `language.*` doit être ajoutée dans `fr`/`en`/`he` simultanément), code source actuel : `App.tsx` (header avec titre + toggle thème, pattern `localStorage` direct pour le thème identifié comme exception pré-existante à ne pas reproduire), `AppContext.tsx` (champs `language`/`setLanguage` jamais branchés — identifiés comme source de vérité concurrente à éviter, `i18n.language` reste la source de vérité comme déjà utilisé par `Sidebar.tsx`), `useProfile.ts`/`LocalStorageRepository.ts`/`StorageRepository.ts`/`profile.schema.ts` (schéma `language` déjà présent, repository à étendre avec `getLanguage`/`setLanguage` et clé dédiée `coach_language` pour le cas sans profil), `ProfileForm.tsx` (conventions de style Tailwind pour les contrôles de formulaire).

Point d'attention principal pour le dev agent : la restauration du choix de langue (AC3/AC4) doit se faire dans un `useEffect` de `App.tsx` qui s'exécute **après** le chargement du profil (`isLoading === false`) et **une seule fois**, sinon risque de boucle ou de course avec la détection `navigator` initiale de `i18next-browser-languagedetector`. Le composant `LanguageSelector` doit rester purement présentationnel (callback `onChangeLanguage`, pas d'accès direct au storage), conformément au pattern déjà établi par `ConfirmDialog`/`ErrorBanner`/`Message`.

Implémentation (2026-06-14) :
- `StorageRepository`/`LocalStorageRepository` étendus avec `getLanguage`/`setLanguage` (clé `coach_language`), avec tests dédiés.
- `LanguageSelector` créé : `<select>` présentationnel, options FR/HE/EN, valeur reflétant `i18n.language`, callback `onChangeLanguage`, `aria-label` via `language.selectorLabel`.
- Clé `language.selectorLabel` ajoutée dans `fr.json`/`en.json`/`he.json` (parité vérifiée par `locales.test.ts`).
- `App.tsx` restructuré : extraction d'un composant `AppShell` rendu à l'intérieur de `AppContextProvider` (le composant `App` d'origine appelait `useProfile()`/`useAppContext()` en dehors de son propre provider, ce qui empêchait `profile` d'être synchronisé — correction nécessaire pour que AC3/AC4 fonctionnent). `AppShell` branche `LanguageSelector` dans le header, gère `handleChangeLanguage` (persistance via profil ou `localStorageRepository.setLanguage`) et un `useEffect` de restauration unique dépendant de `isLoading`.
- Tests ajoutés : `LanguageSelector.test.tsx` (3 tests), extensions de `App.test.tsx` (sélecteur affiché, changement de langue sans rechargement, persistance sans profil, restauration depuis profil `he` et depuis repository `en`), extensions de `LocalStorageRepository.test.ts` (getLanguage/setLanguage).
- `npm test -w client` : 155/155 tests passent. `tsc -b` : 0 erreur.

### File List

- `client/src/repositories/StorageRepository.ts` (modifié)
- `client/src/repositories/LocalStorageRepository.ts` (modifié)
- `client/src/repositories/LocalStorageRepository.test.ts` (modifié)
- `client/src/components/LanguageSelector.tsx` (créé)
- `client/src/components/LanguageSelector.test.tsx` (créé)
- `client/src/App.tsx` (modifié)
- `client/src/App.test.tsx` (modifié)
- `client/src/i18n/locales/fr.json` (modifié)
- `client/src/i18n/locales/en.json` (modifié)
- `client/src/i18n/locales/he.json` (modifié)

## Change Log

- 2026-06-14 : Implémentation complète de la story (Tasks 1-7) — sélecteur de langue, persistance/restauration via `StorageRepository`, traductions, tests.
