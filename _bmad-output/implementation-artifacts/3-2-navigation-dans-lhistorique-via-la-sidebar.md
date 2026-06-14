---
baseline_commit: e7af12594db895764cc34322940c02215d18036b
---

# Story 3.2: Navigation dans l'historique via la sidebar

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur,
I want voir la liste de mes conversations passées dans une barre latérale et naviguer entre elles,
so that je peux reprendre une conversation précédente facilement (FR8).

## Acceptance Criteria

1. **Given** l'utilisateur a au moins une conversation sauvegardée
   **When** la page `/chat` ou `/chat/:conversationId` est affichée
   **Then** `Sidebar` liste toutes les conversations via `StorageRepository.listConversations()` (exposées par `useHistory().conversations`), triées par date de dernière activité (plus récente en premier), affichant le `title` et une date formatée

2. **Given** la sidebar affichée avec plusieurs conversations
   **When** l'utilisateur clique sur une conversation de la liste
   **Then** la navigation se fait vers `/chat/:conversationId` correspondant, et cette conversation est chargée et affichée dans `Chat`

3. **Given** la conversation actuellement affichée correspond à un élément de la sidebar
   **When** la sidebar est rendue
   **Then** cet élément est visuellement mis en évidence comme "actif"

4. **Given** aucune conversation n'existe encore
   **When** la sidebar est affichée
   **Then** un état vide convivial est affiché (ex. message invitant à démarrer une conversation), sans erreur

## Tasks / Subtasks

- [x] Task 1 — Ajout du champ `updatedAt` à `Conversation` pour le tri "dernière activité" (AC: #1)
  - [x] Dans `client/src/types/index.ts`, ajouter `updatedAt: string` (ISO 8601) à l'interface `Conversation` : `{ id: string; title: string; messages: Message[]; createdAt: string; updatedAt: string }`
  - [x] Dans `client/src/hooks/useHistory.ts`, fonction `createConversation()` : initialiser `updatedAt: new Date().toISOString()` égal à `createdAt` (même valeur au moment de la création)
  - [x] Dans `client/src/hooks/useHistory.ts`, fonction `saveConversation(conversation)` : avant persistance, fixer `updatedAt = new Date().toISOString()` sur l'objet sauvegardé (`toSave = { ...toSave, updatedAt: new Date().toISOString() }`), de sorte que chaque sauvegarde (= chaque échange complété, cf. Story 3.1 AC#2) mette à jour la date de dernière activité
  - [x] Mettre à jour `client/src/hooks/useHistory.test.ts` : vérifier que `createConversation()` retourne un `updatedAt` (ISO 8601, identique à `createdAt`), et que `saveConversation(conv)` persiste un `updatedAt` mis à jour (différent de l'`updatedAt` initial — utiliser `vi.useFakeTimers()`/avancer l'horloge si nécessaire pour garantir une différence mesurable)

- [x] Task 2 — Créer `Sidebar.tsx` (AC: #1, #3, #4)
  - [x] Créer `client/src/components/Sidebar.tsx`, composant fonctionnel recevant en props : `conversations: Conversation[]`, `activeConversationId: string | null`, `onSelectConversation: (id: string) => void`, `onNewConversation: () => void`
  - [x] Trier `conversations` par `updatedAt` décroissant (plus récente en premier) — `[...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))` (tri immuable, ne pas muter le tableau reçu en prop, cf. "Communication Patterns" architecture : état immuable uniquement)
  - [x] Pour chaque conversation : afficher `title` et une date formatée à partir de `updatedAt` via `new Intl.DateTimeFormat(i18n.language, { dateStyle: 'short', timeStyle: 'short' })` (récupérer `i18n` via `useTranslation()`, déjà utilisé partout dans le projet pour la locale courante)
  - [x] Élément actif (AC#3) : si `conversation.id === activeConversationId`, appliquer une classe distincte (ex. `bg-navy-800` ou `border-l-2 border-accent`) — comparer avec les classes déjà utilisées dans `App.tsx`/`ChatPage.tsx` (`bg-navy-800`, `text-accent`, `border-navy-700`) pour rester cohérent visuellement
  - [x] Clic sur un élément (AC#2) : appeler `onSelectConversation(conversation.id)`
  - [x] Bouton "Nouvelle conversation" en haut de la sidebar (déplacé depuis `ChatPage`, cf. Dev Notes Story 3.1 : "la Story 3.2 introduira la Sidebar qui pourra le déplacer") : `onClick={onNewConversation}`, libellé `t('chat.newConversation')`
  - [x] État vide (AC#4) : si `conversations.length === 0`, afficher un message convivial traduit (nouvelle clé i18n, cf. Task 4) à la place de la liste — pas d'erreur, le bouton "Nouvelle conversation" reste visible
  - [x] Tous les textes via `t()` (react-i18next) — aucune chaîne en dur (règle architecture "Enforcement Guidelines")
  - [x] Styling Tailwind cohérent avec le thème existant (`bg-navy-900`/`bg-navy-950`, `text-warm-white`, `border-navy-700`) — largeur fixe raisonnable (ex. `w-64`), `flex flex-col`, liste scrollable (`overflow-y-auto`) si elle dépasse la hauteur disponible

- [x] Task 3 — Intégrer `Sidebar` dans `ChatPage.tsx` (AC: #1, #2, #3)
  - [x] Dans `client/src/pages/ChatPage.tsx`, englober le contenu existant dans un conteneur `flex h-full min-h-0` (ligne) avec `Sidebar` à gauche (largeur fixe) et la zone de chat existante (`Chat` + `ErrorBanner` + `InputBar`) dans un conteneur `flex-1 flex flex-col min-h-0` à droite
  - [x] Retirer le bouton "Nouvelle conversation" actuellement rendu en haut de `ChatPage` (lignes ~92-100 de la version actuelle) — sa logique (`handleNewConversation`) est conservée dans `ChatPage` et passée en prop `onNewConversation` à `Sidebar`
  - [x] Passer à `Sidebar` : `conversations` et `isLoading` (depuis `useHistory()`, déjà disponibles — `useHistory()` charge `conversations` via `listConversations()` au montage, cf. Story 3.1), `activeConversationId` (= `activeId` état local déjà présent dans `ChatPage`, ou `conversationId` des `useParams`), `onSelectConversation={(id) => navigate(\`/chat/${id}\`)}`, `onNewConversation={handleNewConversation}`
  - [x] Pendant `isLoading` (chargement initial de `conversations`), `Sidebar` peut afficher la liste vide (pas de spinner requis pour cette story — simplification acceptable, à documenter dans Completion Notes)
  - [x] Vérifier qu'aucune régression n'est introduite sur le flux de résolution de conversation existant (création, chargement, redirection AC#1/#3/#4 de la Story 3.1) — la logique de `useEffect` de résolution de `ChatPage` n'est PAS modifiée par cette story, seul le rendu (layout + Sidebar) change

- [x] Task 4 — i18n : nouvelles clés pour la sidebar (AC: #1, #4)
  - [x] Ajouter une section `sidebar` dans `client/src/i18n/locales/fr.json`, `en.json`, `he.json` avec au minimum : `sidebar.title` (ex. "Conversations" / "Conversations" / "שיחות"), `sidebar.empty` (message invitant à démarrer une conversation, ex. fr: "Aucune conversation pour l'instant. Démarre une nouvelle conversation pour commencer.", en: "No conversations yet. Start a new conversation to get going.", he: "אין שיחות עדיין. התחל שיחה חדשה כדי להתחיל.")
  - [x] Structure de clés identique entre les trois fichiers (cf. Story 1.6, vérifié par les tests existants de cohérence i18n s'ils existent — chercher un test de cohérence i18n dans `client/src` avant d'ajouter les clés, et s'assurer qu'il reste vert)
  - [x] La clé `chat.newConversation` existe déjà dans les trois fichiers (Story 3.1) — réutilisée telle quelle pour le bouton de la sidebar, pas de nouvelle clé nécessaire pour ce bouton

- [x] Task 5 — Tests Vitest (AC: #1 à #4)
  - [x] Créer `client/src/components/Sidebar.test.tsx` (co-localisé, pattern existant) :
    - rend la liste de `conversations` triées par `updatedAt` décroissant (titres affichés dans le bon ordre)
    - affiche une date formatée pour chaque conversation
    - l'élément correspondant à `activeConversationId` porte la classe/marqueur "actif" (vérifier via `className` ou `aria-current`)
    - clic sur un élément appelle `onSelectConversation` avec l'`id` correspondant
    - clic sur le bouton "Nouvelle conversation" appelle `onNewConversation`
    - `conversations: []` → affiche le message d'état vide (`t('sidebar.empty')`), pas d'erreur
  - [x] Mettre à jour `client/src/pages/ChatPage.test.tsx` : adapter les mocks/rendus existants pour le nouveau layout avec `Sidebar` (vérifier que `useHistory().conversations` est bien mocké et transmis à `Sidebar` ; les cas de navigation existants — clic "Nouvelle conversation" déplacé dans `Sidebar` — doivent être adaptés en conséquence)
  - [x] Mettre à jour `client/src/hooks/useHistory.test.ts` : cf. Task 1 (vérifications `updatedAt`)
  - [x] Vérifier `client/src/routes/AppRoutes.test.tsx` reste valide (probable mock de `useHistory` à enrichir avec `conversations: []` si non déjà présent, pour éviter un crash de `Sidebar` lors du montage de `ChatPage`)

## Dev Notes

- **Contexte issu de la Story 3.1 (déjà fait, ne pas refaire)** : `useHistory` expose déjà `conversations: Conversation[]`, `isLoading`, `getConversation`, `saveConversation`, `deleteConversation`, `createConversation`. `ChatPage` gère déjà toute la logique de résolution de conversation active (création, chargement, redirection `/chat` ↔ `/chat/:conversationId`, AC#1/#3/#4 de 3.1) via `useEffect` + `useParams`/`useNavigate`/`AppContext.setActiveConversationId`. **Cette story 3.2 ne modifie PAS cette logique** — elle ajoute uniquement un nouveau composant `Sidebar` et l'intègre au layout de `ChatPage`.
- **Tri "dernière activité" (AC#1)** : le type `Conversation` n'a actuellement pas de champ `updatedAt` (seulement `createdAt`, fixé une fois à la création — cf. Story 3.1 Dev Notes : "le tri par date de dernière activité... pourra être basé sur `createdAt` ou un futur champ, hors scope ici"). Cette story **introduit** `updatedAt` (Task 1) : initialisé égal à `createdAt` lors de `createConversation()`, puis remis à jour à chaque `saveConversation()` (= à chaque échange complété, Story 3.1 AC#2). Le tri de la `Sidebar` se base sur `updatedAt`.
- **Bouton "Nouvelle conversation"** : actuellement rendu en haut de `ChatPage` (Story 3.1, placeholder explicitement temporaire — cf. Dev Notes 3.1 : "son emplacement/style définitif pourra être revu en Story 3.2 lors de l'introduction de la Sidebar"). Cette story le **déplace** dans `Sidebar` (Task 2/3) ; la fonction `handleNewConversation` existante dans `ChatPage` est conservée et passée en prop.
- **`AppContext.activeConversationId`** : déjà mis à jour par `ChatPage` via `setActiveConversationId` (Story 3.1). Pour la mise en évidence de l'élément actif (AC#3), utiliser soit `activeConversationId` du contexte, soit l'état local `activeId`/`conversationId` (`useParams`) déjà présents dans `ChatPage` — choisir la source la plus simple et déjà synchronisée avec l'URL (`activeId` est mis à jour de façon fiable dans l'effet de résolution).
- **Navigation depuis la sidebar (AC#2)** : `navigate(\`/chat/${id}\`)` (sans `replace` — navigation utilisateur explicite, cohérent avec le clic "Nouvelle conversation" de la Story 3.1). Cela déclenche le `useEffect` de résolution existant dans `ChatPage` (dépendant de `conversationId` via `useParams`), qui chargera la conversation cible via `getConversation(id)` — aucune logique de chargement supplémentaire à écrire dans `Sidebar`.
- **Formatage de date** : utiliser `Intl.DateTimeFormat` avec la locale courante (`i18n.language` depuis `useTranslation()`) — pas de nouvelle dépendance (pas de `date-fns`/`dayjs`), cohérent avec l'absence de telles libs dans le projet actuel.
- **Naming conventions** (architecture, "Naming Patterns") : composant `Sidebar.tsx` (PascalCase, déjà prévu dans la structure de répertoires architecture, `client/src/components/Sidebar.tsx`), props camelCase, booléens préfixés `is` (`isLoading`).
- **Accès au storage** : `Sidebar` ne doit PAS accéder à `localStorage`/`StorageRepository` directement — elle reçoit `conversations` en props depuis `ChatPage` (qui les obtient via `useHistory()`), conformément à "les hooks sont les seuls points d'accès au `StorageRepository`" (architecture, "Communication Patterns").
- **i18n** : 3 langues à maintenir en parallèle (`fr.json`, `en.json`, `he.json`). Le support RTL complet est traité en Story 4.3 — ne pas introduire de classes directionnelles incohérentes (`ml-`/`mr-`/`pl-`/`pr-` comme dans le code existant pour l'instant).
- **Limites volontaires de cette story** : pas d'action de suppression dans la `Sidebar` (Story 3.3) ; pas de comportement responsive/mobile spécifique (sidebar toujours visible, pas de toggle/burger menu — hors scope MVP sauf indication contraire) ; pas de spinner de chargement pour `conversations` (simplification, cf. Task 3).

### Project Structure Notes

Fichiers à modifier :
- `client/src/types/index.ts` (UPDATE) — ajout `updatedAt` à `Conversation` (Task 1)
- `client/src/hooks/useHistory.ts` (UPDATE) — `createConversation`/`saveConversation` gèrent `updatedAt` (Task 1)
- `client/src/hooks/useHistory.test.ts` (UPDATE) — tests `updatedAt` (Task 1)
- `client/src/pages/ChatPage.tsx` (UPDATE) — nouveau layout avec `Sidebar`, suppression du bouton inline (Task 3)
- `client/src/pages/ChatPage.test.tsx` (UPDATE) — adaptation des tests au nouveau layout (Task 5)
- `client/src/routes/AppRoutes.test.tsx` (UPDATE si nécessaire — mock `useHistory().conversations`)
- `client/src/i18n/locales/fr.json`, `en.json`, `he.json` (UPDATE) — section `sidebar` (Task 4)

Nouveaux fichiers :
- `client/src/components/Sidebar.tsx` (NEW, Task 2)
- `client/src/components/Sidebar.test.tsx` (NEW, Task 5)

Aucune modification de `StorageRepository`/`LocalStorageRepository` n'est nécessaire (le champ `updatedAt` est un champ supplémentaire de l'objet `Conversation` sérialisé tel quel — `JSON.stringify`/`JSON.parse` le gèrent sans changement de code dans le repository).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2: Navigation dans l'historique via la sidebar] — AC sources
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `Sidebar.tsx` (PascalCase), hooks `use*`, `isLoading`
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — hooks seuls points d'accès au `StorageRepository`, état immuable
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — `client/src/components/Sidebar.tsx` déjà prévu
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — `useTranslation` obligatoire, pas de chaîne en dur
- [Source: _bmad-output/implementation-artifacts/3-1-creation-et-persistance-de-conversations.md] — `useHistory`, `ChatPage` (résolution de conversation active, bouton "Nouvelle conversation" temporaire à déplacer)
- [Source: client/src/hooks/useHistory.ts] — implémentation actuelle (`conversations`, `isLoading`, `createConversation`, `saveConversation`)
- [Source: client/src/pages/ChatPage.tsx] — layout et logique actuels à étendre
- [Source: client/src/types/index.ts] — type `Conversation` actuel (sans `updatedAt`)
- [Source: client/src/context/AppContext.tsx] — `activeConversationId`/`setActiveConversationId`
- [Source: client/src/App.tsx] — classes Tailwind du thème (`bg-navy-900`, `bg-navy-950`, `text-warm-white`, `border-navy-700`, `text-accent`) à réutiliser dans `Sidebar`
- [Source: client/src/i18n/locales/fr.json, en.json, he.json] — structure de clés existante (`chat.newConversation` réutilisée)

## Git Intelligence Summary

Le dernier commit (`e7af125`) couvre les Stories 2.1-2.3 (chat backend/frontend). Le commit attendu pour la Story 3.1 (création/persistance de conversations, `useHistory` réel, navigation `/chat/:conversationId`, bouton "Nouvelle conversation" dans `ChatPage`) doit être présent dans l'arbre de travail courant (statut `review`) mais n'apparaît pas encore dans `git log` au moment de la création de cette story — vérifier son contenu directement dans les fichiers (`useHistory.ts`, `ChatPage.tsx`, `types/index.ts`) plutôt que via l'historique git, qui peut être en retard sur l'état réel du répertoire de travail. Aucun composant `Sidebar.tsx` n'existe encore.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npx vitest run` → 18 fichiers de test, 83 tests, tous verts
- `npx tsc --noEmit` → aucune erreur
- `npx eslint` sur les fichiers modifiés/créés → aucune erreur

### Completion Notes List

- Ajout du champ `updatedAt` à `Conversation` ; `createConversation()` l'initialise égal à `createdAt`, `saveConversation()` le met à jour à chaque sauvegarde.
- Nouveau composant `Sidebar` : liste les conversations triées par `updatedAt` décroissant, affiche titre + date formatée (`Intl.DateTimeFormat`), met en évidence l'élément actif (`aria-current="true"`), affiche un état vide traduit, et porte le bouton "Nouvelle conversation" (déplacé depuis `ChatPage`).
- `ChatPage` réorganisé en layout `flex` avec `Sidebar` à gauche et la zone de chat (`Chat` + `ErrorBanner` + `InputBar`) à droite ; logique de résolution de conversation (`useEffect`) inchangée.
- Conformément à la simplification documentée dans la story, `Sidebar` ne gère pas d'état de chargement dédié pendant `isLoading` (affiche simplement la liste — vide ou non — telle que fournie par `useHistory()`).
- Nouvelles clés i18n `sidebar.title` / `sidebar.empty` ajoutées dans `fr.json`, `en.json`, `he.json`.
- Tests mis à jour/ajoutés : `useHistory.test.ts` (updatedAt), `Sidebar.test.tsx` (nouveau), `ChatPage.test.tsx` (mock `conversations`).

### File List

- `client/src/types/index.ts` (UPDATE)
- `client/src/hooks/useHistory.ts` (UPDATE)
- `client/src/hooks/useHistory.test.ts` (UPDATE)
- `client/src/components/Sidebar.tsx` (NEW)
- `client/src/components/Sidebar.test.tsx` (NEW)
- `client/src/pages/ChatPage.tsx` (UPDATE)
- `client/src/pages/ChatPage.test.tsx` (UPDATE)
- `client/src/i18n/locales/fr.json` (UPDATE)
- `client/src/i18n/locales/en.json` (UPDATE)
- `client/src/i18n/locales/he.json` (UPDATE)

## Change Log

- 2026-06-14 : Implémentation complète de la Story 3.2 (Sidebar de navigation, champ `updatedAt`, intégration `ChatPage`, i18n, tests).
