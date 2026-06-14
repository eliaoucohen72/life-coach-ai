---
baseline_commit: e7af12594db895764cc34322940c02215d18036b
---

# Story 3.1: Création et persistance de conversations

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur,
I want démarrer une nouvelle conversation avec le coach et que mes conversations passées restent accessibles,
so that je peux organiser mes échanges par sujet/session sans perdre l'historique (FR5).

## Acceptance Criteria

1. **Given** la page `/chat` affichée
   **When** l'utilisateur clique sur "Nouvelle conversation"
   **Then** une nouvelle conversation est créée avec un `id` généré via `crypto.randomUUID()`, un `title` par défaut (ex. "Nouvelle conversation" ou première phrase du premier message), et `createdAt` au format ISO 8601
   **And** l'utilisateur est redirigé vers `/chat/:conversationId` avec cette nouvelle conversation comme conversation active

2. **Given** une conversation active avec au moins un échange de messages
   **When** un message est envoyé et la réponse du coach est complétée (cf. Story 2.3)
   **Then** la conversation (avec tous ses messages) est sauvegardée via `StorageRepository.saveConversation()` sous la clé `coach_conversations`

3. **Given** plusieurs conversations sauvegardées
   **When** l'utilisateur recharge l'application et accède à `/chat/:conversationId` avec un ID existant
   **Then** `useHistory`/`useChat` charge cette conversation depuis `StorageRepository.getConversation(id)` et affiche ses messages

4. **Given** l'utilisateur accède à `/chat/:conversationId` avec un ID qui n'existe pas dans le storage
   **When** la page se charge
   **Then** l'utilisateur est redirigé vers une nouvelle conversation (comportement équivalent à "Nouvelle conversation")

## Tasks / Subtasks

- [x] Task 1 — `useHistory.ts` : implémentation réelle (remplace le stub) (AC: #1, #2, #3, #4)
  - [x] Dans `client/src/hooks/useHistory.ts`, remplacer le stub par une implémentation utilisant `localStorageRepository` (import déjà existant pour `useProfile` : `import { localStorageRepository } from '../repositories/LocalStorageRepository'`)
  - [x] Exposer :
    - `conversations: Conversation[]` — état local chargé via `listConversations()` dans un `useEffect` au montage (utile dès cette story pour la cohérence, et réutilisé par la Story 3.2/Sidebar)
    - `isLoading: boolean` — `true` pendant le chargement initial de `conversations` (même convention que `useProfile`)
    - `getConversation(id: string): Promise<Conversation | null>` — délègue à `localStorageRepository.getConversation(id)`
    - `saveConversation(conversation: Conversation): Promise<void>` — délègue à `localStorageRepository.saveConversation(conversation)`, puis met à jour l'état local `conversations` (upsert immuable : remplace si `id` existe, sinon ajoute — cohérent avec la logique déjà présente dans `LocalStorageRepository.saveConversation`)
    - `deleteConversation(id: string): Promise<void>` — délègue à `localStorageRepository.deleteConversation(id)`, puis retire l'élément correspondant de l'état local `conversations` (implémentation complète dès cette story même si l'UI de suppression arrive en Story 3.3 — l'interface `StorageRepository` l'expose déjà et le coût d'implémentation est nul)
    - `createConversation(): Conversation` — fonction **synchrone**, ne persiste rien : retourne un nouvel objet `{ id: crypto.randomUUID(), title: t('chat.newConversation'), messages: [], createdAt: new Date().toISOString() }`. La persistance effective n'a lieu qu'au premier échange complet (AC#2, cf. Task 3). Utiliser `useTranslation()` à l'intérieur du hook pour `t('chat.newConversation')` (cf. Task 4 pour la clé i18n)
  - [x] Mettre à jour `client/src/hooks/useHistory.test.ts` (remplace les tests du stub) :
    - `createConversation()` retourne un objet avec `id` (format UUID), `title` non vide, `messages: []`, `createdAt` (chaîne ISO 8601 parseable par `new Date()`)
    - deux appels successifs à `createConversation()` retournent des `id` différents
    - `saveConversation(conv)` appelle `localStorageRepository.saveConversation` (mock du repository) et met à jour `conversations`
    - `getConversation(id)` délègue au repository et retourne `null` si absent
    - `deleteConversation(id)` retire la conversation de `conversations` après appel
    - Mocker `localStorageRepository` via `vi.mock('../repositories/LocalStorageRepository', ...)` (pattern déjà utilisé dans `useProfile.test.ts` si applicable — vérifier le pattern de mock existant avant d'écrire le test)

- [x] Task 2 — Génération du titre par défaut à partir du premier message (AC: #1, #2)
  - [x] Lors de la première sauvegarde d'une conversation (titre encore égal à `t('chat.newConversation')`, cf. Task 1) ET dès qu'au moins un message `user` existe, dériver le titre depuis le **contenu du premier message utilisateur** : tronquer à ~40 caractères, ajouter `…` si tronqué (ex. `content.length > 40 ? content.slice(0, 40).trimEnd() + '…' : content`)
  - [x] Cette dérivation peut être implémentée dans `useHistory.saveConversation` (si `conversation.title === t('chat.newConversation')` et `conversation.messages[0]?.role === 'user'`, recalculer `title` avant persistance) — alternative acceptable : la calculer dans `ChatPage`/`useChat` avant d'appeler `saveConversation`. Choisir l'option la plus simple à tester ; documenter le choix dans `Completion Notes List`
  - [x] Ajouter un test couvrant ce comportement (titre par défaut conservé pour une conversation vide, titre dérivé du premier message après le premier échange)

- [x] Task 3 — `useChat.ts` : chargement initial des messages + persistance après complétion (AC: #2, #3)
  - [x] `useChat` doit pouvoir être initialisé avec les messages d'une conversation existante (chargée par `ChatPage`, cf. Task 5) et notifier l'appelant lorsqu'un échange est terminé, pour permettre la persistance
  - [x] Modifier la signature de `useChat` pour accepter des paramètres optionnels, ex. :
    ```ts
    export function useChat(
      initialMessages: Message[] = [],
      onExchangeComplete?: (messages: Message[]) => void,
    ) { ... }
    ```
  - [x] Initialiser `messages` avec `initialMessages` (`useState<Message[]>(initialMessages)`). Si `ChatPage` change de conversation active (changement de `:conversationId` dans l'URL, même instance de composant — pas de remount), `useChat` doit réinitialiser `messages` avec les nouveaux `initialMessages` : utiliser un `useEffect` dépendant d'un identifiant stable (ex. passer `conversationId` en paramètre supplémentaire et déclencher `setMessages(initialMessages)` quand il change) — **attention** : ne pas réinitialiser `messages` à chaque re-render, seulement quand la conversation active change réellement
  - [x] À la réception de `data: [DONE]` (fin de stream, AC#2 de la Story 2.3) : après `setIsStreaming(false)`, appeler `onExchangeComplete?.(messagesFinaux)` avec le tableau `messages` complet (utilisateur + réponse assistant). Attention à la nature asynchrone de `setMessages` : utiliser une variable locale tenant l'état le plus récent des messages au fil du traitement du stream (déjà le cas dans l'implémentation actuelle via les variables locales `history`/mutations successives), plutôt que de lire `messages` (potentiellement périmé) depuis le closure
  - [x] En cas d'erreur (`data: {"error": ...}` ou erreur réseau) : **ne pas** appeler `onExchangeComplete` — pas de persistance d'un échange en erreur pour cette story (simplification ; le cas "persister les messages partiels malgré une erreur" n'est pas couvert par les AC de 3.1 et peut être traité dans une story future si besoin)
  - [x] Mettre à jour `client/src/hooks/useChat.test.tsx` :
    - `useChat([{role:'user', content:'salut'}, {role:'assistant', content:'bonjour'}])` initialise `messages` avec ces deux entrées
    - après réception complète d'un stream réussi (`[DONE]` sans erreur), `onExchangeComplete` est appelé une fois avec le tableau `messages` final (incluant le nouveau message user + la réponse assistant complète)
    - en cas d'erreur SSE ou réseau, `onExchangeComplete` n'est **pas** appelé

- [x] Task 4 — i18n : clé `chat.newConversation` (AC: #1)
  - [x] Ajouter la clé `chat.newConversation` dans `client/src/i18n/locales/fr.json` (ex. "Nouvelle conversation"), `en.json` (ex. "New conversation"), `he.json` (ex. "שיחה חדשה") — structure identique dans les trois fichiers (cf. Story 1.6, AC sur cohérence des clés)
  - [x] Cette clé est utilisée à deux endroits : (a) comme `title` par défaut d'une conversation créée via `createConversation()` (Task 1), et (b) comme libellé du bouton "Nouvelle conversation" dans `ChatPage` (Task 5)

- [x] Task 5 — `ChatPage.tsx` : navigation, création, chargement et redirection (AC: #1, #3, #4)
  - [x] Importer `useParams`, `useNavigate` depuis `react-router-dom` (route déjà définie dans `AppRoutes.tsx` : `/chat` et `/chat/:conversationId`, toutes deux rendent `ChatPage`)
  - [x] Importer `useHistory` et utiliser `setActiveConversationId` depuis `useAppContext()` (déjà exposé par `AppContext`, actuellement non utilisé)
  - [x] Logique de résolution de la conversation active, dans un `useEffect` dépendant de `conversationId` (paramètre d'URL) :
    - **Si `conversationId` est `undefined`** (route `/chat`) : appeler `createConversation()` (non persisté), `setActiveConversationId(nouvelleConv.id)`, puis `navigate(`/chat/${nouvelleConv.id}`, { replace: true })`. Conserver la conversation créée (ex. `useRef` ou state local) pour l'utiliser comme `initialMessages`/contexte de `useChat` une fois la navigation effectuée (la navigation `replace` re-déclenche l'effet avec le nouvel `id`, donc prévoir que `getConversation(nouvelId)` retournera `null` au second passage — gérer ce cas en réutilisant la conversation déjà créée localement plutôt que d'en créer une seconde, ex. via une `ref` ou en passant directement par l'état local sans round-trip storage)
    - **Si `conversationId` est défini** : appeler `getConversation(conversationId)`
      - Si trouvée : `setActiveConversationId(conversationId)`, charger `conversation.messages` comme `initialMessages` de `useChat`
      - Si non trouvée (AC#4) : appeler `createConversation()`, `setActiveConversationId(nouvelleConv.id)`, `navigate(`/chat/${nouvelleConv.id}`, { replace: true })` (même cas que ci-dessus)
  - [x] Bouton "Nouvelle conversation" : visible dans `ChatPage` (placement simple pour cette story — un bouton en haut de la zone de chat ; la Story 3.2 introduira la `Sidebar` qui pourra le déplacer/dupliquer). Au clic : `createConversation()`, `setActiveConversationId(nouvelleConv.id)`, `navigate(`/chat/${nouvelleConv.id}`)` (pas de `replace`, navigation utilisateur explicite). Libellé traduit via `t('chat.newConversation')`
  - [x] Câbler `useChat(initialMessages, onExchangeComplete)` où `onExchangeComplete` appelle `saveConversation({ ...conversationActive, messages: messagesFinaux })` (via `useHistory`) — `conversationActive` (objet `Conversation` complet avec `id`/`title`/`createdAt`) doit être conservé en state/ref dans `ChatPage` pour être accessible au callback
  - [x] Conserver l'assemblage existant `Chat` + `ErrorBanner` + `InputBar` (Story 2.3), inchangé sur ces points

- [x] Task 6 — Tests Vitest (AC: #1 à #4)
  - [x] `client/src/hooks/useHistory.test.ts` : cf. Task 1
  - [x] `client/src/hooks/useChat.test.tsx` : cf. Task 3
  - [x] `client/src/pages/ChatPage.test.tsx` (UPDATE) : ajouter/adapter les cas :
    - accès à `/chat` (sans id) → redirection vers `/chat/:nouvelId` (vérifier via mock de `useNavigate`/`MemoryRouter` que la navigation a lieu, ou vérifier l'URL résultante avec `MemoryRouter` + `Routes`)
    - accès à `/chat/:id` avec un id existant (mock `useHistory.getConversation` retournant une conversation) → les messages de cette conversation sont affichés
    - accès à `/chat/:id` avec un id inexistant (mock `getConversation` retournant `null`) → redirection vers une nouvelle conversation
    - clic sur le bouton "Nouvelle conversation" → `createConversation` + navigation appelés
    - après un échange complet (mock `useChat` simulant `onExchangeComplete`), `saveConversation` est appelé avec les messages à jour
  - [x] `client/src/routes/AppRoutes.test.tsx` : vérifier que les tests existants restent valides avec la nouvelle logique de redirection dans `ChatPage` (la redirection `/chat` → `/chat/:id` se fait désormais via `useNavigate` dans `ChatPage`, pas via `AppRoutes` — `AppRoutes.tsx` lui-même n'a pas besoin d'être modifié, mais ses tests montant `ChatPage` doivent mocker `useHistory`/`localStorageRepository` si nécessaire pour éviter les erreurs `crypto.randomUUID is not a function` en environnement de test (jsdom moderne le supporte nativement, mais vérifier))

## Dev Notes

- **Contexte issu de la Story 2.3 (déjà fait, ne pas refaire)** : `useChat` gère l'envoi de message, le streaming SSE, l'affichage progressif (`Chat`/`Message`/`InputBar`/`ErrorBanner`), et la gestion d'erreur. Cette story 3.1 **étend** `useChat` (chargement initial + callback de fin d'échange) sans modifier son comportement de streaming/erreur existant — tous les tests de 2.3 doivent continuer à passer (avec adaptation de signature si nécessaire : appeler `useChat()` sans argument doit conserver le comportement actuel, donc `initialMessages = []` et `onExchangeComplete` optionnel par défaut).
- **`Conversation` type déjà défini** (`client/src/types/index.ts`) : `{ id: string; title: string; messages: Message[]; createdAt: string }`. Aucune modification de ce type n'est nécessaire pour cette story (pas de champ `updatedAt` — le tri "par date de dernière activité" mentionné dans la Story 3.2 pourra être basé sur `createdAt` ou un futur champ, hors scope ici).
- **`StorageRepository`/`LocalStorageRepository` déjà complets** (`client/src/repositories/`) : `getConversation`, `saveConversation`, `listConversations`, `deleteConversation` sont déjà implémentés et testés (`LocalStorageRepository.test.ts`) — cette story les **consomme** via `useHistory`, sans les modifier.
- **Pas de double persistance lors de la création** : `createConversation()` (Task 1) est volontairement **synchrone et non-persistante** — une conversation "vide" n'est jamais écrite dans `localStorage`. Seule la première sauvegarde après un échange complet (AC#2, via `onExchangeComplete`) écrit dans `coach_conversations`. Conséquence : si l'utilisateur navigue vers `/chat/:nouvelId` puis quitte sans envoyer de message, rien n'est persisté, et un retour ultérieur sur cette URL déclenchera AC#4 (id inexistant → nouvelle conversation) — comportement attendu et acceptable pour le MVP.
- **`AppContext.activeConversationId`** : déjà exposé par `AppContext` (`client/src/context/AppContext.tsx`, initialisé à `null`) mais non consommé jusqu'ici. Cette story est la première à l'utiliser via `setActiveConversationId` — pas de modification de `AppContext` nécessaire.
- **Navigation et effets** : attention aux boucles infinies dans le `useEffect` de résolution de conversation (Task 5) — bien dépendre uniquement de `conversationId` (paramètre d'URL stable tant que l'URL ne change pas) et non de valeurs recréées à chaque render (ex. ne pas inclure un objet `conversation` recréé dans les dépendances). `navigate(..., { replace: true })` évite d'empiler des entrées d'historique lors des redirections automatiques (AC#1 initial, AC#4) ; navigation sans `replace` pour le clic explicite sur "Nouvelle conversation".
- **Naming conventions** (architecture, "Naming Patterns") : camelCase, hooks préfixés `use`, composants PascalCase, booléens d'état préfixés `is` (`isLoading` dans `useHistory`, cohérent avec `useProfile`).
- **IDs et dates** (architecture, "Data Formats") : `crypto.randomUUID()` pour les IDs de conversation (déjà utilisé nulle part côté client encore — disponible nativement dans les navigateurs cibles et `jsdom ^26`), `createdAt` en ISO 8601 via `new Date().toISOString()`.
- **i18n** : 3 langues à maintenir en parallèle (`fr.json`, `en.json`, `he.json`). Le support RTL complet est traité en Story 4.3 ; ne pas introduire de nouvelles classes Tailwind directionnelles non cohérentes avec l'existant (`ml-`/`mr-` pour l'instant, cf. Story 2.3).
- **Tests co-localisés** : Vitest + `@testing-library/react`, pattern déjà en place. Pour les tests impliquant React Router (`useParams`/`useNavigate`), utiliser `MemoryRouter` avec une `initialEntries` ciblée (cf. si `AppRoutes.test.tsx` utilise déjà ce pattern, le réutiliser pour `ChatPage.test.tsx`).
- **Limites volontaires de cette story** : pas de `Sidebar.tsx` (Story 3.2), pas de suppression UI (Story 3.3, bien que `useHistory.deleteConversation` soit implémenté par anticipation faible coût). Le bouton "Nouvelle conversation" introduit dans `ChatPage` est un placeholder fonctionnel minimal ; son emplacement/style définitif pourra être revu en Story 3.2 lors de l'introduction de la `Sidebar`.

### Project Structure Notes

Fichiers à modifier :
- `client/src/hooks/useHistory.ts` (UPDATE) — remplace le stub par l'implémentation réelle (Task 1)
- `client/src/hooks/useHistory.test.ts` (UPDATE) — remplace les tests du stub
- `client/src/hooks/useChat.ts` (UPDATE) — ajout `initialMessages`/`onExchangeComplete` (Task 3)
- `client/src/hooks/useChat.test.tsx` (UPDATE) — nouveaux cas de test (Task 3)
- `client/src/pages/ChatPage.tsx` (UPDATE) — navigation, création, chargement, bouton "Nouvelle conversation" (Task 5)
- `client/src/pages/ChatPage.test.tsx` (UPDATE) — nouveaux cas de test (Task 6)
- `client/src/routes/AppRoutes.test.tsx` (UPDATE si nécessaire — vérifier compatibilité)
- `client/src/i18n/locales/fr.json`, `en.json`, `he.json` (UPDATE) — clé `chat.newConversation`

Aucun nouveau fichier composant n'est requis par cette story (pas de `Sidebar.tsx` — Story 3.2). Le type `Conversation` (`client/src/types/index.ts`) et le `StorageRepository`/`LocalStorageRepository` existent déjà et ne nécessitent aucune modification.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1: Création et persistance de conversations] — AC sources
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Formats] — IDs `crypto.randomUUID()`, dates ISO 8601, camelCase
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — `AppContext` expose `activeConversationId`, hooks seuls points d'accès à `StorageRepository`
- [Source: _bmad-output/planning-artifacts/architecture.md#Requirements to Structure Mapping] — Historique : `Sidebar.tsx` (Story 3.2), `useHistory.ts`, `LocalStorageRepository` (clé `coach_conversations`)
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — emplacements `client/src/hooks/useHistory.ts`, `client/src/routes/AppRoutes.tsx` (`/chat/:id` déjà prévu)
- [Source: _bmad-output/implementation-artifacts/2-3-interface-de-chat-avec-streaming-et-memoire.md] — implémentation actuelle de `useChat` (streaming SSE, gestion d'erreur) à étendre sans régression
- [Source: client/src/repositories/StorageRepository.ts] — interface complète (`getConversation`, `saveConversation`, `listConversations`, `deleteConversation`)
- [Source: client/src/repositories/LocalStorageRepository.ts] — implémentation existante, clé `coach_conversations`, logique d'upsert dans `saveConversation`
- [Source: client/src/types/index.ts] — type `Conversation` (`id`, `title`, `messages`, `createdAt`)
- [Source: client/src/context/AppContext.tsx] — `activeConversationId`/`setActiveConversationId` déjà exposés, non encore utilisés
- [Source: client/src/routes/AppRoutes.tsx] — routes `/chat` et `/chat/:conversationId` déjà définies, toutes deux vers `ChatPage`
- [Source: client/src/hooks/useProfile.ts] — pattern `isLoading` + `useEffect` de chargement initial via `localStorageRepository`, à répliquer pour `useHistory`

## Git Intelligence Summary

Le dernier commit (`e7af125`, "feat: implement chat functionality with streaming and error handling") couvre les Stories 2.1 à 2.3 : backend `/api/chat` complet (SSE, retry Groq, system prompt) et frontend chat complet (`useChat`, `Chat`/`Message`/`InputBar`/`ErrorBanner`, `ChatPage`). Aucun travail sur `useHistory`, la persistance de conversations (`coach_conversations`) ou la navigation `/chat/:conversationId` n'a encore été fait — `useHistory.ts` est toujours au stade de stub (retourne `conversations: []`, `saveConversation`/`deleteConversation` no-op). `LocalStorageRepository` et `StorageRepository` exposent déjà toutes les méthodes nécessaires (`getConversation`, `saveConversation`, `listConversations`, `deleteConversation`), implémentées et testées depuis la Story 1.2. Le type `Conversation` existe déjà dans `client/src/types/index.ts`. La route `/chat/:conversationId` est déjà déclarée dans `AppRoutes.tsx` (rend `ChatPage`, comme `/chat`), mais `ChatPage` n'utilise actuellement ni `useParams` ni `useNavigate` ni `useHistory`.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

- `npx vitest run` : 17 fichiers, 77 tests, tous passés
- `npx eslint` (fichiers modifiés) : 0 erreur, 0 warning
- `npx tsc -b` : 0 erreur

### Completion Notes List

- Task 1 : `useHistory.ts` implémenté (remplace le stub) avec `conversations`, `isLoading`, `getConversation`, `saveConversation`, `deleteConversation`, `createConversation`, en consommant `localStorageRepository`.
- Task 2 : dérivation du titre par défaut implémentée dans `useHistory.saveConversation` (option choisie par rapport à `ChatPage`/`useChat` — plus simple à tester de manière isolée, cohérent avec le fait que `useHistory` est déjà responsable de la persistance).
- Task 3 : `useChat` accepte désormais `initialMessages`, `onExchangeComplete` et `conversationId`. Réinitialisation de `messages` via le pattern React "ajustement d'état pendant le rendu" (comparaison `conversationId`/`loadedConversationId`) plutôt qu'un `useEffect`, pour respecter la règle lint `react-hooks/set-state-in-effect`. `onExchangeComplete` n'est appelé qu'en l'absence d'erreur SSE/réseau, avec le tableau `messages` final calculé localement (`finalMessages`).
- Task 4 : clé i18n `chat.newConversation` ajoutée dans `fr.json`, `en.json`, `he.json`.
- Task 5 : `ChatPage.tsx` gère désormais la résolution de la conversation active via `useParams`/`useNavigate`/`useHistory`/`AppContext` (création, chargement, redirection AC#1/#3/#4) et expose le bouton "Nouvelle conversation". Un état `activeId` (distinct de la `ref` de conversation) est utilisé comme `conversationId` passé à `useChat`, afin que la résolution asynchrone (AC#3/#4) déclenche bien la réinitialisation des messages même quand le paramètre d'URL ne change pas.
- Task 6 : tests Vitest ajoutés/adaptés pour `useHistory`, `useChat` et `ChatPage` (mocks de `useHistory`/`useChat`/`AppContext` avec `MemoryRouter` + `Routes`). `AppRoutes.test.tsx` reste valide sans modification (vérifié par exécution).

### File List

- `client/src/hooks/useHistory.ts` (UPDATE)
- `client/src/hooks/useHistory.test.ts` (UPDATE)
- `client/src/hooks/useChat.ts` (UPDATE)
- `client/src/hooks/useChat.test.tsx` (UPDATE)
- `client/src/pages/ChatPage.tsx` (UPDATE)
- `client/src/pages/ChatPage.test.tsx` (UPDATE)
- `client/src/i18n/locales/fr.json` (UPDATE)
- `client/src/i18n/locales/en.json` (UPDATE)
- `client/src/i18n/locales/he.json` (UPDATE)

### Change Log

- Implémentation de la Story 3.1 : création/persistance de conversations, navigation `/chat/:conversationId`, dérivation du titre par défaut, et tests associés.
