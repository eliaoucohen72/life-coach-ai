---
status: review
baseline_commit: e7af125
---

# Story 4.1 : Complétion des traductions pour les Epics 2 et 3

Status: review

## Story

As a développeur,
I want étendre les fichiers de traduction existants (`fr.json`, `he.json`, `en.json`) avec toutes les clés introduites par les Epics 2 et 3, et vérifier la cohérence complète des fichiers,
So that l'ensemble de l'UI de l'application (Epics 1 à 3) est entièrement traduite dans les trois langues, sans clé manquante ni incohérence entre fichiers.

> **Note :** L'infrastructure react-i18next (configuration, détection navigateur, fallback EN, `i18n.dir()`) a été mise en place dans la Story 1.6. Cette story se concentre uniquement sur la complétion/vérification du **contenu** des fichiers de traduction et l'ajout d'un garde-fou de régression (test de parité de clés).

## Acceptance Criteria

1. **[AC1 — Complétude des clés Epics 2/3]** Given les fichiers `fr.json`, `he.json`, `en.json` existants (créés en Story 1.6 avec les clés Epic 1), When les Epics 2 et 3 sont implémentés, Then les trois fichiers sont mis à jour pour inclure toutes les clés de traduction introduites dans les Stories 2.1 à 2.3 et 3.1 à 3.3 (messages du chat, états de streaming, messages d'erreur Groq, labels de la sidebar, confirmation de suppression).

2. **[AC2 — Aucune clé brute affichée]** Given les trois fichiers de traduction complétés, When l'ensemble des composants de l'application est rendu dans chaque langue (`fr`, `he`, `en`), Then aucune clé brute (ex. `"chat.errors.unavailable"`) n'est visible à l'écran — toutes les clés ont une valeur dans les trois fichiers.

3. **[AC3 — Usage de `useTranslation()`]** Given `react-i18next` initialisé (Story 1.6), When un composant des Epics 2 ou 3 utilise `useTranslation()`, Then les chaînes affichées correspondent aux clés du fichier de langue actif.

4. **[AC4 — Fallback de clé manquante]** Given une clé présente dans `fr.json` mais absente de `he.json` ou `en.json`, When le composant tente de l'afficher dans la langue manquante, Then la valeur de la langue de repli `en` est utilisée, sans erreur visible.

## Tasks / Subtasks

- [x] Task 1 : Auditer l'état actuel des fichiers de traduction (AC: #1)
  - [x] 1.1 Lister, via une recherche `t('...')` / `t(\`...\`)` / accès dynamiques (`t(\`profile.fields.${key}\`)`, `t(ERROR_CODE_TO_KEY[error] ?? 'chat.errors.generic')`, `t(\`onboarding.steps.${key}.label\`)`, etc.), **toutes** les clés de traduction utilisées dans `client/src/**/*.{ts,tsx}` (hors fichiers de test)
  - [x] 1.2 Pour chaque clé trouvée, vérifier qu'elle existe dans `client/src/i18n/locales/fr.json`, `en.json` ET `he.json`, avec une valeur non vide
  - [x] 1.3 **Constat de départ (déjà vérifié lors de la création de cette story)** : l'état actuel (non commité) des 3 fichiers contient déjà 50 clés chacun, avec une structure de clés **strictement identique** entre `fr.json`/`en.json`/`he.json` (sections `common`, `theme`, `disclaimer`, `onboarding`, `profile`, `sidebar`, `chat`), et toutes les clés utilisées par les composants Epic 2/3 (`chat.inputPlaceholder`, `chat.send`, `chat.newConversation`, `chat.errors.groqUnavailable`, `chat.errors.generic`, `sidebar.title`, `sidebar.empty`, `sidebar.deleteConversation`, `sidebar.confirmDelete.title/message/confirm/cancel`) sont déjà présentes et traduites dans les 3 langues. **Ne pas dupliquer ce travail** — l'objectif principal de cette story est de **vérifier** cet état et d'ajouter le garde-fou de régression (Task 2), pas de recréer les traductions.
  - [x] 1.4 Si l'audit (1.1-1.2) révèle malgré tout une clé manquante ou une valeur vide dans un des 3 fichiers, l'ajouter en respectant la structure de clés identique entre les 3 fichiers (camelCase, cf. conventions Story 1.6) et en traduisant correctement dans la langue concernée (pas de copie de la valeur `fr` dans `en`/`he`)

- [x] Task 2 : Ajouter un test de parité de clés entre `fr.json`, `en.json`, `he.json` (AC: #1, #4 — garde-fou de régression)
  - [x] 2.1 Créer `client/src/i18n/locales.test.ts` (co-localisé, suit la convention de `index.test.ts`)
  - [x] 2.2 Importer les 3 fichiers JSON (`import fr from './locales/fr.json'`, etc. — `resolveJsonModule` déjà actif depuis Story 1.6)
  - [x] 2.3 Écrire une fonction utilitaire récursive (locale au fichier de test) qui aplatit un objet de traduction en liste de clés en notation pointée (ex. `onboarding.steps.age.label`)
  - [x] 2.4 Test : la liste de clés aplaties de `fr.json` est strictement égale (même éléments, peu importe l'ordre — utiliser un tri + comparaison de tableaux) à celle de `en.json` et à celle de `he.json` — détecte toute clé manquante/en trop dans un fichier
  - [x] 2.5 Test : pour chaque clé aplatie de `fr.json`, la valeur correspondante dans `fr.json`, `en.json` et `he.json` est une chaîne non vide (`typeof value === 'string' && value.trim().length > 0`) — détecte les valeurs vides/placeholder oubliées
  - [x] 2.6 Ce test doit être **indépendant de l'instance i18n** (pas besoin de `changeLanguage`) — il compare uniquement les fichiers JSON bruts

- [x] Task 3 : Vérification de rendu — aucune clé brute visible (AC: #2, #3)
  - [x] 3.1 Dans les suites de tests existantes des composants Epic 2/3 (`Chat.test.tsx`, `Sidebar.test.tsx`, `InputBar.test.tsx`, `ErrorBanner.test.tsx`, `ConfirmDialog.test.tsx`, `Message.test.tsx`, `ChatPage.test.tsx`, `useHistory.test.ts`), vérifier que les assertions de texte correspondent aux valeurs `fr.json` (langue de test par défaut, `setupTests.ts` force `i18n.changeLanguage('fr')` depuis la Story 1.6) — ne pas modifier ces tests s'ils passent déjà
  - [x] 3.2 Si un test échoue avec une clé brute affichée (ex. `"sidebar.title"` au lieu de `"Conversations"`), corriger la valeur manquante dans `fr.json`/`en.json`/`he.json` (pas le test) — sauf si le test lui-même contient une erreur évidente
  - [x] 3.3 Ne PAS écrire de nouveaux tests de rendu en `en`/`he` pour chaque composant (hors scope, coût élevé pour peu de valeur ajoutée) — le test de parité de clés (Task 2) couvre la complétude/cohérence `en`/`he`, et `i18n/index.test.ts` (Story 1.6) couvre déjà le fallback EN et `dir()`

- [x] Task 4 : Validation finale (AC: tous)
  - [x] 4.1 `npm test -w client` — tous les tests passent (suite existante + nouveau `locales.test.ts`), sans régression
  - [x] 4.2 `tsc -b` sur `client` — zéro erreur
  - [x] 4.3 Vérification manuelle (optionnelle) : `npm run dev`, changer `i18n.language` via la console DevTools (`window.i18n` non exposé par défaut — utiliser `i18next` devtools ou changer `navigator.language`/forcer via `localStorage` n'est pas applicable ici car la détection n'a pas de cache ; alternative : modifier temporairement `i18n.changeLanguage('en')`/`('he')` dans la console React DevTools si disponible) pour confirmer visuellement l'absence de clé brute dans le chat et la sidebar

## Dev Notes

### Périmètre exact de la story

- 100% côté `client`. Aucune modification de `server/`.
- Ne pas toucher à `client/src/i18n/index.ts` (config déjà finalisée en Story 1.6) — sauf si Task 1.4 révèle un besoin réel (peu probable).
- Ne pas créer de sélecteur de langue UI ni de persistance du choix de langue (`profile.language`) — c'est la **Story 4.2**, hors scope ici.
- Ne pas implémenter le support RTL spécifique aux bulles de chat / formulaires — c'est la **Story 4.3**, hors scope ici.
- Ne pas modifier la logique de détection de langue côté serveur (`buildSystemPrompt`) — hors scope (Story 4.3 / Epic 4).

### État actuel des fichiers de traduction (constat à la création de cette story)

Les fichiers `client/src/i18n/locales/{fr,en,he}.json` sont dans un état **non commité** (modifiés par rapport au dernier commit `e7af125`) et contiennent déjà, en plus des clés Epic 1 (Story 1.6) :

```json
"sidebar": {
  "title": "...",
  "empty": "...",
  "deleteConversation": "...",
  "confirmDelete": { "title": "...", "message": "...", "confirm": "...", "cancel": "..." }
},
"chat": {
  "title": "...",
  "placeholder": "...",
  "inputPlaceholder": "...",
  "send": "...",
  "newConversation": "...",
  "errors": { "groqUnavailable": "...", "generic": "..." }
}
```

Vérification effectuée (Node, comparaison structurelle) : les 3 fichiers ont **exactement 50 clés chacun**, avec une structure de clés (chemins pointés) strictement identique entre `fr`/`en`/`he` — **aucune différence détectée**. Toutes les clés utilisées par le code (`grep -rn "t("` sur `client/src`) correspondent à des clés existantes dans les 3 fichiers.

**Implication pour le dev agent** : le travail de "complétion" au sens littéral est déjà fait. La valeur ajoutée de cette story est :
1. Vérifier (re-confirmer) cet état après tout changement éventuel de code depuis la création de cette story.
2. Ajouter le test de parité (Task 2) comme garde-fou permanent contre toute régression future (un dev qui ajoute une clé dans `fr.json` sans l'ajouter dans `en.json`/`he.json` fera échouer ce test).

### Clés `chat.title` / `chat.placeholder` (héritage Story 1.6)

`chat.title` et `chat.placeholder` ne sont plus rendues dans l'UI (le placeholder "Chat interface — to be implemented in Story 2.3" a été remplacé par le vrai composant `Chat` en Story 2.3), mais restent utilisées par `client/src/i18n/index.test.ts` (test de fallback EN, Story 1.6, AC5). **Ne pas supprimer ces clés** — leur suppression casserait `index.test.ts`. Elles sont hors scope de cette story.

### Conventions à respecter

- `useTranslation` (react-i18next) pour tout texte affiché — déjà respecté dans tous les composants Epic 2/3 existants (`Sidebar.tsx`, `InputBar.tsx`, `useHistory.ts`, `ChatPage.tsx` via `ERROR_CODE_TO_KEY`).
- `ConfirmDialog.tsx`, `ErrorBanner.tsx`, `Message.tsx`, `Chat.tsx` ne contiennent **aucun appel `t()`** — c'est intentionnel (composants purement présentationnels recevant des chaînes déjà traduites via props). Ne pas y ajouter `useTranslation()`.
- camelCase pour les clés de traduction.
- Tests co-localisés (`locales.test.ts` à côté de `index.ts`/`index.test.ts` dans `client/src/i18n/`).
- `resolveJsonModule: true` déjà actif dans `client/tsconfig.app.json` (Story 1.6) — les imports `import fr from './locales/fr.json'` fonctionnent directement en TS et en test.

### Previous Story Intelligence

- Story 1.6 a établi la structure complète des 3 fichiers de traduction (Epic 1) et la convention de test `i18n.changeLanguage('fr')` dans `setupTests.ts` — tous les tests de composants s'exécutent en français par défaut.
- Stories 2.1-2.3 et 3.1-3.3 (en `review`, non commitées) ont déjà ajouté les sections `chat.*` (étendue) et `sidebar.*` aux 3 fichiers de traduction en parallèle de l'implémentation des composants — cf. constat ci-dessus.
- `git status` montre des fichiers non commités issus de ces stories (`Chat.tsx`, `Sidebar.tsx`, `InputBar.tsx`, `Message.tsx`, `ErrorBanner.tsx`, `ConfirmDialog.tsx`, `useChat.ts`, `useHistory.ts`, `ChatPage.tsx`, et les 3 `locales/*.json`) — ce sont des prérequis déjà en place, pas des changements à faire dans cette story.

### Project Structure Notes

Fichier à créer :
```
client/src/i18n/
└── locales.test.ts   # test de parité de clés fr/en/he
```

Fichiers potentiellement modifiés (seulement si Task 1.4 révèle un écart réel) :
```
client/src/i18n/locales/{fr,en,he}.json
```

Aucun autre fichier ne devrait être modifié par cette story.

### References

- Epics — Story 4.1 AC : [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- Epics — Note de découpage infra (1.6) / contenu (4.1) : [Source: _bmad-output/planning-artifacts/epics.md#Story 4.1]
- Story 1.6 — Structure des fichiers de traduction, conventions de test i18n : [Source: _bmad-output/implementation-artifacts/1-6-infrastructure-i18n-initialisation-et-traductions-epic-1.md#Dev Notes]
- Architecture — Frontend Architecture (`react-i18next`, structure `client/src/i18n/`) : [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Architecture — Enforcement Guidelines ("Utiliser `useTranslation` pour tout texte affiché") : [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Story 4.1 créée via bmad-create-story le 2026-06-14. Analyse complète : epics.md (Story 4.1 AC + note de découpage avec Story 1.6), Story 1.6 (structure des fichiers de traduction, conventions), état actuel non commité des fichiers `client/src/i18n/locales/{fr,en,he}.json` (vérification structurelle Node : 50 clés identiques dans les 3 fichiers, toutes les clés Epic 2/3 déjà présentes et traduites), grep exhaustif des appels `t('...')` dans `client/src` (tous résolus dans les 3 fichiers), `client/src/i18n/index.test.ts` (test de fallback existant, dépendance sur `chat.title`/`chat.placeholder` à préserver).

Point d'attention principal pour le dev agent : le contenu des traductions Epic 2/3 est **déjà présent et cohérent** dans l'état actuel (non commité) des 3 fichiers — cette story porte donc principalement sur la **vérification** (audit, Task 1) et l'ajout d'un **test de parité de clés** (`locales.test.ts`, Task 2) comme garde-fou de régression, plus une vérification ciblée que les suites de tests Epic 2/3 existantes passent bien en `fr` sans clé brute (Task 3). Ne pas recréer de traductions déjà présentes, et ne pas supprimer `chat.title`/`chat.placeholder` (utilisées par `index.test.ts`).

---

**Implémentation (2026-06-14)**

- **Task 1 (audit)** : grep exhaustif de tous les appels `t('...')`, `t(\`...\`)` et accès dynamiques dans `client/src/**/*.{ts,tsx}` (hors fichiers de test). Toutes les clés résolues (`common.*`, `theme.*`, `disclaimer.*`, `onboarding.*`, `profile.*`, `sidebar.*`, `chat.*` y compris `chat.title`/`chat.placeholder` utilisées par `index.test.ts`) sont présentes avec une valeur non vide dans `fr.json`, `en.json` et `he.json`. Confirmation de l'état décrit dans les Dev Notes (50 clés identiques par fichier) — aucune clé manquante détectée, donc aucune modification des fichiers de locales n'a été nécessaire (Task 1.4 sans objet).
- **Task 2** : création de `client/src/i18n/locales.test.ts` — fonction récursive `flattenKeys` qui aplatit `fr.json`/`en.json`/`he.json` en listes de clés pointées triées, test de parité stricte `en`↔`fr` et `he`↔`fr`, et un test `it.each` sur chacune des 50 clés vérifiant une valeur `string` non vide dans les 3 fichiers (52 tests au total). Le test n'utilise pas l'instance i18n (import direct des JSON).
- **Task 3** : exécution de la suite complète (`npm test -w client -- --run`) — les suites Epic 2/3 (`Chat.test.tsx`, `Sidebar.test.tsx`, `InputBar.test.tsx`, `ErrorBanner.test.tsx`, `ConfirmDialog.test.tsx`, `Message.test.tsx`, `ChatPage.test.tsx`, `useHistory.test.ts`) passent toutes en `fr` sans aucune clé brute affichée — aucune correction nécessaire.
- **Task 4** :
  - 4.1 `npm test -w client -- --run` → 20 fichiers de test, 144 tests, tous au vert (incluant les 52 nouveaux tests de `locales.test.ts`).
  - 4.2 `tsc -b` sur `client` → une erreur pré-existante hors-scope a été détectée et corrigée : `client/src/types/index.ts` (modification non commitée issue de l'Epic 3) ajoute le champ obligatoire `updatedAt` à `Conversation`, ce qui faisait échouer la compilation de `client/src/repositories/LocalStorageRepository.test.ts` (fixture de test Epic 1 non mise à jour). Correction minimale : ajout de `updatedAt: '2026-01-01T00:00:00.000Z'` à la fixture `conversation` de ce test. Après correction, `tsc -b` passe avec zéro erreur.
  - 4.3 (optionnelle) non exécutée manuellement via DevTools — couverte fonctionnellement par le test de parité (Task 2) et `i18n/index.test.ts` (fallback EN, `dir()`), qui garantissent l'absence de clé brute pour `en`/`he`.

### File List

- `client/src/i18n/locales.test.ts` (créé) — test de parité de clés et de valeurs non vides entre `fr.json`/`en.json`/`he.json`
- `client/src/repositories/LocalStorageRepository.test.ts` (modifié) — ajout du champ `updatedAt` à la fixture `conversation` pour corriger une erreur `tsc -b` pré-existante (hors-scope, liée à l'ajout du champ obligatoire `Conversation.updatedAt` en Epic 3)

## Change Log

| Date | Description |
| --- | --- |
| 2026-06-14 | Audit des traductions Epics 2/3 (aucune clé manquante) ; ajout du test de parité de clés `locales.test.ts` (52 tests) ; correction d'une erreur `tsc -b` pré-existante dans `LocalStorageRepository.test.ts` (fixture `Conversation.updatedAt`) |
