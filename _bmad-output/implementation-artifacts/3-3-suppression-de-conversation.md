---
baseline_commit: e7af12594db895764cc34322940c02215d18036b
---

# Story 3.3: Suppression de conversation

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur,
I want supprimer une conversation dont je n'ai plus besoin,
so that mon historique reste pertinent et organisé (FR9).

## Acceptance Criteria

1. **Given** la sidebar affichée avec une conversation
   **When** l'utilisateur déclenche l'action de suppression sur cette conversation (ex. icône poubelle)
   **Then** une confirmation est demandée avant suppression définitive

2. **Given** la confirmation de suppression acceptée
   **When** la suppression est exécutée
   **Then** `StorageRepository.deleteConversation(id)` retire la conversation de `coach_conversations`
   **And** la conversation disparaît immédiatement de la sidebar

3. **Given** l'utilisateur supprime la conversation actuellement active (`/chat/:conversationId`)
   **When** la suppression est confirmée
   **Then** l'utilisateur est redirigé vers une autre conversation existante (la plus récente) ou vers une nouvelle conversation si aucune n'existe

4. **Given** l'utilisateur annule la confirmation de suppression
   **When** il ferme le dialogue de confirmation
   **Then** la conversation reste inchangée dans la sidebar et le storage

## Tasks / Subtasks

- [x] Task 1 — Créer `ConfirmDialog.tsx`, composant de confirmation générique réutilisable (AC: #1, #4)
  - [x] Créer `client/src/components/ConfirmDialog.tsx`, composant fonctionnel recevant en props : `title: string`, `message: string`, `confirmLabel: string`, `cancelLabel: string`, `onConfirm: () => void`, `onCancel: () => void`
  - [x] Reprendre le pattern visuel de `client/src/components/DisclaimerModal.tsx` (overlay `fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4`, carte `max-w-md w-full bg-navy-900 border border-navy-700 rounded-lg p-6 text-warm-white`) pour rester cohérent avec la modale existante
  - [x] Afficher `title` (`<h2>`, classe `text-lg font-semibold text-accent mb-3`) et `message` (`<p>`, classe `text-sm mb-4`)
  - [x] Deux boutons : un bouton de confirmation (`onClick={onConfirm}`, libellé `confirmLabel`, style accent — ex. `bg-accent text-navy-950`) et un bouton d'annulation (`onClick={onCancel}`, libellé `cancelLabel`, style neutre — ex. `bg-navy-800 text-warm-white border border-navy-700`), disposés côte à côte (`flex gap-2` ou équivalent)
  - [x] Ce composant est générique (pas de référence à "conversation" en dur dans le composant) — tous les textes affichés (`title`, `message`, labels) sont passés en props par l'appelant, qui les traduit via `t()`
  - [x] Naming conventions : composant `ConfirmDialog.tsx` (PascalCase), props camelCase

- [x] Task 2 — Ajouter l'action de suppression dans `Sidebar` (AC: #1, #2, #4)
  - [x] Dans `client/src/components/Sidebar.tsx`, ajouter une nouvelle prop `onDeleteConversation: (id: string) => void`
  - [x] Pour chaque élément de la liste de conversations, ajouter un bouton "supprimer" (icône poubelle — texte simple ou emoji acceptable, ex. `🗑`, avec `aria-label={t('sidebar.deleteConversation')}` pour l'accessibilité ; pas de nouvelle dépendance d'icônes) à côté du bouton de sélection existant — utiliser `type="button"`, `onClick` qui appelle `event.stopPropagation()` (pour ne pas déclencher `onSelectConversation` du parent `<li>`/bouton englobant) puis ouvre la confirmation pour cet `id`
  - [x] Gérer un état local `confirmDeleteId: string | null` (via `useState`) dans `Sidebar` : au clic sur l'icône poubelle, `setConfirmDeleteId(conversation.id)` (AC#1)
  - [x] Si `confirmDeleteId !== null`, rendre `ConfirmDialog` (Task 1) avec :
    - `title={t('sidebar.confirmDelete.title')}`
    - `message={t('sidebar.confirmDelete.message')}`
    - `confirmLabel={t('sidebar.confirmDelete.confirm')}`
    - `cancelLabel={t('sidebar.confirmDelete.cancel')}`
    - `onConfirm={() => { onDeleteConversation(confirmDeleteId); setConfirmDeleteId(null); }}` (AC#2)
    - `onCancel={() => setConfirmDeleteId(null)}` (AC#4 — fermeture du dialogue sans modification de la conversation, ni du storage ni de la sidebar)
  - [x] Styling Tailwind cohérent avec le thème existant (`bg-navy-900`/`bg-navy-950`, `text-warm-white`, `border-navy-700`, `text-accent`)
  - [x] Tous les textes via `t()` (react-i18next) — aucune chaîne en dur

- [x] Task 3 — Brancher la suppression et gérer la redirection si la conversation active est supprimée (AC: #2, #3)
  - [x] Dans `client/src/pages/ChatPage.tsx`, créer `handleDeleteConversation(id: string)` :
    - Calculer la liste des conversations restantes après suppression : `const remaining = conversations.filter((c) => c.id !== id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))` (même critère de tri que `Sidebar`, "plus récente en premier")
    - Appeler `await deleteConversation(id)` (déjà exposé par `useHistory()`, cf. `client/src/hooks/useHistory.ts` — aucune modification requise côté hook/repository, `deleteConversation` existe déjà et appelle `StorageRepository.deleteConversation(id)` puis met à jour l'état `conversations`, satisfaisant AC#2)
    - Si `id === activeId` (conversation active supprimée, AC#3) :
      - Si `remaining.length > 0` : `navigate(\`/chat/${remaining[0].id}\`)` (la plus récente restante)
      - Sinon (`remaining.length === 0`) : appeler `handleNewConversation()` (logique déjà présente, crée une nouvelle conversation et navigue vers `/chat/:nouvelId`)
    - Si `id !== activeId` : aucune navigation nécessaire, la suppression de l'état `conversations` (via `deleteConversation`) suffit à faire disparaître l'élément de la `Sidebar` (AC#2)
  - [x] Passer `onDeleteConversation={handleDeleteConversation}` à `<Sidebar />` dans `ChatPage`
  - [x] Attention à l'ordre des opérations : calculer `remaining` et décider de la navigation **avant** ou en parallèle de `deleteConversation(id)` (qui met à jour l'état `conversations` de façon asynchrone) — ne pas dépendre de `conversations` post-suppression dans le même rendu, utiliser la valeur de `conversations` capturée au moment de l'appel de `handleDeleteConversation` (filtrée localement comme décrit ci-dessus) pour éviter une race condition avec le re-render

- [x] Task 4 — i18n : nouvelles clés pour la suppression (AC: #1, #2, #4)
  - [x] Ajouter dans la section `sidebar` de `client/src/i18n/locales/fr.json`, `en.json`, `he.json` :
    - `sidebar.deleteConversation` (libellé/aria-label de l'icône poubelle, ex. fr: "Supprimer la conversation", en: "Delete conversation", he: "מחק שיחה")
    - `sidebar.confirmDelete.title` (ex. fr: "Supprimer la conversation ?", en: "Delete conversation?", he: "למחוק את השיחה?")
    - `sidebar.confirmDelete.message` (ex. fr: "Cette action est définitive et ne peut pas être annulée.", en: "This action is permanent and cannot be undone.", he: "פעולה זו היא סופית ולא ניתן לבטל אותה.")
    - `sidebar.confirmDelete.confirm` (ex. fr: "Supprimer", en: "Delete", he: "מחק")
    - `sidebar.confirmDelete.cancel` (ex. fr: "Annuler", en: "Cancel", he: "ביטול")
  - [x] Structure de clés identique entre les trois fichiers (cf. test de cohérence i18n existant s'il y en a un dans `client/src` — vérifier qu'il reste vert)

- [x] Task 5 — Tests Vitest (AC: #1 à #4)
  - [x] Créer `client/src/components/ConfirmDialog.test.tsx` (co-localisé, pattern existant comme `DisclaimerModal.test.tsx`) :
    - rend `title` et `message` passés en props
    - clic sur le bouton de confirmation appelle `onConfirm`
    - clic sur le bouton d'annulation appelle `onCancel`
  - [x] Mettre à jour `client/src/components/Sidebar.test.tsx` (ajouter une prop `onDeleteConversation={vi.fn()}` à tous les rendus existants de `<Sidebar />` pour éviter une erreur de prop manquante, puis ajouter de nouveaux cas) :
    - clic sur l'icône poubelle d'une conversation ouvre `ConfirmDialog` (vérifier la présence du `title`/`message` traduits) sans appeler `onSelectConversation` ni `onDeleteConversation` immédiatement (AC#1)
    - dans le `ConfirmDialog` ouvert, clic sur le bouton de confirmation appelle `onDeleteConversation` avec l'`id` de la conversation correspondante, et ferme le dialogue (AC#2)
    - dans le `ConfirmDialog` ouvert, clic sur le bouton d'annulation ferme le dialogue sans appeler `onDeleteConversation` (AC#4)
  - [x] Mettre à jour `client/src/pages/ChatPage.test.tsx` :
    - adapter le mock de `useHistory` (déjà présent : `deleteConversation: vi.fn()`) pour exposer un mock nommé réutilisable (`deleteConversation`) si besoin de vérifier les appels
    - nouveau cas : suppression de la conversation active avec d'autres conversations existantes → `deleteConversation` appelé avec l'`id` actif, puis `navigate` vers `/chat/:id` de la conversation la plus récente restante (vérifier via `lastUseChatArgs[2]` après l'action, ou via les changements de route observés)
    - nouveau cas : suppression de la conversation active sans autre conversation existante → `createConversation` appelé (équivalent "Nouvelle conversation", AC#3) et redirection vers `/chat/:nouvelId`
    - nouveau cas : suppression d'une conversation non active → `deleteConversation` appelé, pas de navigation (`setActiveConversationId`/`lastUseChatArgs[2]` inchangés)
  - [x] Vérifier `client/src/routes/AppRoutes.test.tsx` reste valide (pas de changement de prop attendu côté `AppRoutes`, mais relancer la suite complète pour confirmer l'absence de régression)

## Dev Notes

- **Contexte issu des Stories 3.1/3.2 (déjà fait, ne pas refaire)** : `useHistory()` expose déjà `deleteConversation(id): Promise<void>` qui appelle `localStorageRepository.deleteConversation(id)` (donc `StorageRepository.deleteConversation`, cf. `client/src/repositories/StorageRepository.ts` et `LocalStorageRepository.ts` — interface et implémentation déjà complètes, **aucune modification requise sur le repository**) et met à jour l'état local `conversations` via `setConversations((prev) => prev.filter((c) => c.id !== id))`. Cette story 3.3 **branche uniquement l'UI** (icône de suppression + confirmation dans `Sidebar`, gestion de la redirection dans `ChatPage`) sur cette fonction déjà existante — AC#2 est donc déjà satisfait côté storage/état, le travail de cette story porte sur le déclenchement (confirmation, AC#1/#4) et la conséquence UX (redirection, AC#3).
- **Confirmation (AC#1/#4)** : ne pas utiliser `window.confirm()` (non testable facilement, pas cohérent visuellement avec le thème). Créer un composant `ConfirmDialog` générique réutilisable (Task 1), repris du pattern visuel de `DisclaimerModal.tsx` (`client/src/components/DisclaimerModal.tsx`, overlay `fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4`, carte `max-w-md w-full bg-navy-900 border border-navy-700 rounded-lg p-6 text-warm-white`). `ConfirmDialog` est générique (titre/message/labels en props) pour pouvoir être réutilisé par d'autres confirmations futures hors scope de cette story.
- **État de confirmation dans `Sidebar`** : `confirmDeleteId: string | null` géré localement dans `Sidebar` via `useState` — pas besoin de remonter cet état dans `ChatPage` ou `AppContext` (l'architecture précise : "pas de logique métier dans le contexte", et cet état est purement UI/local au composant qui l'affiche).
- **Empêcher la propagation de clic** : le bouton de suppression est imbriqué dans (ou à côté de) le bouton de sélection de conversation existant (`onSelectConversation`). Utiliser `event.stopPropagation()` sur le clic de l'icône poubelle pour ne pas déclencher la sélection/navigation de la conversation en même temps que l'ouverture de la confirmation.
- **Redirection après suppression de la conversation active (AC#3)** : le tri "plus récente en premier" est basé sur `updatedAt` décroissant — même critère que le tri déjà utilisé dans `Sidebar` (`[...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))`, introduit Story 3.2). Calculer la liste `remaining` (conversations restantes triées) **dans `ChatPage.handleDeleteConversation`** à partir de l'état `conversations` capturé au moment de l'appel (avant l'effet asynchrone de `deleteConversation`), pour éviter toute race condition avec la mise à jour d'état de `useHistory`.
- **Cas "aucune conversation restante" (AC#3)** : réutiliser `handleNewConversation()` déjà présent dans `ChatPage` (Story 3.1/3.2) — crée une nouvelle conversation via `createConversation()` et navigue vers `/chat/:nouvelId`, comportement identique à celui déjà testé pour le bouton "Nouvelle conversation".
- **Icône de suppression** : pas de nouvelle dépendance d'icônes (le projet n'utilise actuellement aucune lib d'icônes, cf. `Sidebar.tsx`/`ChatPage.tsx` existants — uniquement Tailwind + texte/emoji). Utiliser un caractère simple (ex. `🗑` ou `×`) avec `aria-label` traduit pour l'accessibilité.
- **Naming conventions** (architecture, "Naming Patterns") : composant `ConfirmDialog.tsx` (PascalCase), props camelCase, fichier `client/src/components/ConfirmDialog.tsx` (déjà dans le pattern "un fichier par composant" de `client/src/components/`).
- **i18n** : 3 langues à maintenir en parallèle (`fr.json`, `en.json`, `he.json`), structure de clés identique (cf. test de cohérence i18n existant). Pas de classes directionnelles incohérentes (`ml-`/`mr-`/`pl-`/`pr-`) — le support RTL complet est traité en Story 4.3.
- **Accès au storage** : ni `Sidebar` ni `ConfirmDialog` n'accèdent à `localStorage`/`StorageRepository` directement — la suppression passe par `onDeleteConversation` (prop) → `handleDeleteConversation` (ChatPage) → `deleteConversation` (useHistory) → `StorageRepository.deleteConversation` (architecture, "hooks seuls points d'accès au `StorageRepository`").
- **Limites volontaires de cette story** : pas de suppression multiple/en masse ; pas d'action "annuler la suppression" (undo) après confirmation — la suppression confirmée est définitive (cf. message `sidebar.confirmDelete.message`).

### Project Structure Notes

Fichiers à modifier :
- `client/src/components/Sidebar.tsx` (UPDATE) — icône de suppression, état `confirmDeleteId`, intégration `ConfirmDialog`, nouvelle prop `onDeleteConversation` (Task 2)
- `client/src/components/Sidebar.test.tsx` (UPDATE) — nouveaux cas de suppression/confirmation (Task 5)
- `client/src/pages/ChatPage.tsx` (UPDATE) — `handleDeleteConversation`, redirection si conversation active supprimée, prop `onDeleteConversation` vers `Sidebar` (Task 3)
- `client/src/pages/ChatPage.test.tsx` (UPDATE) — nouveaux cas de suppression (Task 5)
- `client/src/i18n/locales/fr.json`, `en.json`, `he.json` (UPDATE) — nouvelles clés `sidebar.deleteConversation`, `sidebar.confirmDelete.*` (Task 4)

Nouveaux fichiers :
- `client/src/components/ConfirmDialog.tsx` (NEW, Task 1)
- `client/src/components/ConfirmDialog.test.tsx` (NEW, Task 5)

Aucune modification de `StorageRepository`/`LocalStorageRepository`/`useHistory` n'est nécessaire — `deleteConversation(id)` existe déjà et est entièrement fonctionnel (Stories 3.1/3.2).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.3: Suppression de conversation] — AC sources
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming Patterns] — `ConfirmDialog.tsx` (PascalCase), props camelCase
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — hooks seuls points d'accès au `StorageRepository`, état immuable
- [Source: _bmad-output/planning-artifacts/architecture.md#Enforcement Guidelines] — `useTranslation` obligatoire, pas de chaîne en dur
- [Source: _bmad-output/implementation-artifacts/3-2-navigation-dans-lhistorique-via-la-sidebar.md] — `Sidebar`, tri par `updatedAt`, layout `ChatPage`
- [Source: client/src/hooks/useHistory.ts] — `deleteConversation(id)` déjà implémenté
- [Source: client/src/repositories/StorageRepository.ts, LocalStorageRepository.ts] — `deleteConversation(id)` déjà implémenté
- [Source: client/src/components/Sidebar.tsx] — composant actuel à étendre (liste, tri, élément actif)
- [Source: client/src/components/DisclaimerModal.tsx, DisclaimerModal.test.tsx] — pattern visuel et pattern de test pour `ConfirmDialog`
- [Source: client/src/pages/ChatPage.tsx] — `handleNewConversation`, logique de résolution de conversation active à étendre
- [Source: client/src/pages/ChatPage.test.tsx] — mocks `useHistory`/`useChat`/`useAppContext` existants (dont `deleteConversation: vi.fn()` déjà présent dans le mock)
- [Source: client/src/i18n/locales/fr.json, en.json, he.json] — structure de clés existante, section `sidebar`

## Git Intelligence Summary

Le dernier commit (`e7af125`) couvre les Stories 2.1-2.3 (chat backend/frontend). Les modifications des Stories 3.1 et 3.2 (statut `review`) sont présentes dans l'arbre de travail courant mais non encore commitées : `useHistory.ts` (avec `deleteConversation` déjà implémenté et `updatedAt`), `Sidebar.tsx` (liste triée, élément actif, bouton "Nouvelle conversation"), `ChatPage.tsx` (layout avec `Sidebar`, résolution de conversation active, `handleNewConversation`). Vérifier le contenu directement dans ces fichiers plutôt que via `git log`. Aucun composant `ConfirmDialog.tsx` n'existe encore ; `DisclaimerModal.tsx` (Story 1.3) est le seul exemple de modale existant et sert de référence visuelle.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (bmad-dev-story)

### Debug Log References

### Completion Notes List

- Créé `ConfirmDialog.tsx`, composant générique de confirmation reprenant le pattern visuel de `DisclaimerModal.tsx` (overlay, carte, titre/message en props, boutons confirm/cancel).
- Ajouté dans `Sidebar.tsx` un bouton poubelle (aria-label traduit) par conversation, état local `confirmDeleteId`, et intégration de `ConfirmDialog` avec `stopPropagation` pour ne pas déclencher la sélection.
- Ajouté `handleDeleteConversation` dans `ChatPage.tsx` : calcule `remaining` à partir de l'état `conversations` capturé avant l'appel asynchrone `deleteConversation`, redirige vers la conversation la plus récente restante ou crée une nouvelle conversation via `handleNewConversation` si plus aucune conversation n'existe.
- Ajouté les clés i18n `sidebar.deleteConversation` et `sidebar.confirmDelete.*` dans `fr.json`, `en.json`, `he.json`.
- Ajouté `ConfirmDialog.test.tsx` (3 tests), nouveaux cas dans `Sidebar.test.tsx` (3 nouveaux tests + prop `onDeleteConversation` ajoutée aux rendus existants) et `ChatPage.test.tsx` (3 nouveaux cas pour AC#2/#3).
- Suite complète : 19 fichiers de tests, 92 tests passent. `tsc --noEmit` et `eslint` sans erreur sur les fichiers modifiés.

### File List

- `client/src/components/ConfirmDialog.tsx` (NEW)
- `client/src/components/ConfirmDialog.test.tsx` (NEW)
- `client/src/components/Sidebar.tsx` (UPDATE)
- `client/src/components/Sidebar.test.tsx` (UPDATE)
- `client/src/pages/ChatPage.tsx` (UPDATE)
- `client/src/pages/ChatPage.test.tsx` (UPDATE)
- `client/src/i18n/locales/fr.json` (UPDATE)
- `client/src/i18n/locales/en.json` (UPDATE)
- `client/src/i18n/locales/he.json` (UPDATE)

## Change Log

- 2026-06-14: Implémentation de la suppression de conversation (ConfirmDialog, action poubelle dans Sidebar, redirection ChatPage, i18n, tests) — Story 3.3 passée à "review".
</content>
