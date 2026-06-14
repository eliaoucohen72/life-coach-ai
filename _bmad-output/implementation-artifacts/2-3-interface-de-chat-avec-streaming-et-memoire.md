---
baseline_commit: e7af12594db895764cc34322940c02215d18036b
---

# Story 2.3: Interface de chat avec streaming et mémoire

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur,
I want envoyer des messages au coach et voir sa réponse apparaître progressivement, le coach se souvenant de ce que j'ai dit plus tôt dans la conversation,
so that j'ai une expérience de conversation naturelle et fluide (FR3, FR4).

## Acceptance Criteria

1. **Given** la page `/chat` affichée avec `InputBar`
   **When** l'utilisateur saisit un message et l'envoie
   **Then** le message apparaît immédiatement dans `Chat` comme bulle utilisateur (alignée à droite, style atténué selon PRD §6)
   **And** `useChat` envoie `POST /api/chat` avec l'historique complet des messages de la conversation active + le profil utilisateur

2. **Given** une réponse en streaming reçue du serveur
   **When** des chunks `data: {"delta": "..."}` arrivent
   **Then** une bulle de réponse du coach (alignée à gauche, accentuée) se construit progressivement avec une animation de frappe (`isStreaming === true`)
   **And** à la réception de `data: [DONE]`, `isStreaming` repasse à `false`

3. **Given** une conversation déjà entamée avec plusieurs messages
   **When** l'utilisateur envoie un nouveau message faisant référence à un élément mentionné précédemment
   **Then** l'ensemble des messages précédents de la conversation active est inclus dans la requête `/api/chat`, permettant au coach d'y faire référence

4. **Given** une réponse d'erreur reçue via le flux SSE (`data: {"error": {...}}`)
   **When** `useChat` traite ce message
   **Then** `ErrorBanner` affiche un message convivial traduit, et `isStreaming` repasse à `false` sans bloquer l'envoi de futurs messages

5. **Given** l'utilisateur envoie un message alors qu'une réponse est en cours de streaming
   **When** il clique sur le bouton d'envoi
   **Then** l'envoi est désactivé/bloqué jusqu'à la fin du streaming en cours (pas d'envois concurrents sur la même conversation)

## Tasks / Subtasks

- [x] Task 1 — `useChat` : envoi de message + consommation du flux SSE (AC: #1, #2, #3, #4, #5)
  - [x] Dans `client/src/hooks/useChat.ts`, remplacer le stub actuel par une implémentation qui gère un état local `messages: Message[]` (initialisé à `[]`), `isStreaming: boolean` (initialisé à `false`), et un état d'erreur (ex. `error: string | null`)
  - [x] `sendMessage(content: string)` :
    - Si `isStreaming === true`, ne rien faire (no-op) — garantit AC#5 (pas d'envoi concurrent)
    - Ajoute immédiatement `{ role: 'user', content }` à `messages` (AC#1)
    - Passe `isStreaming = true` et `error = null`
    - Construit le payload `{ messages: [...messagesPrécédents, nouveauMessage], profile }` — `profile` récupéré via `useAppContext()` (déjà exposé par `AppContext`, cf. `client/src/context/AppContext.tsx`)
    - Appelle `fetch(`${apiBaseUrl}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })`
  - [x] Parsing du flux SSE :
    - Lire `response.body` via `response.body.getReader()` + `TextDecoder` (pattern fetch streaming standard, pas de lib SSE supplémentaire)
    - Découper le buffer reçu sur `\n\n` pour isoler chaque événement `data: {...}`
    - Pour chaque événement `data: {"delta": "..."}` : ajouter `delta` au `content` du dernier message `assistant` de `messages` (le créer s'il n'existe pas encore pour ce tour — bulle vide initiale dès le premier delta, AC#2)
    - Pour un événement `data: {"error": {"message": ..., "code": ...}}` : stocker l'erreur dans l'état `error` (AC#4) — ne pas l'ajouter à `messages`
    - À la réception de `data: [DONE]` : passer `isStreaming = false` (AC#2, AC#4) et arrêter la lecture du stream
  - [x] En cas d'échec réseau (`fetch` rejette, ex. serveur down) : traiter comme une erreur générique (même état `error`), `isStreaming = false`, sans bloquer les envois suivants (AC#4)
  - [x] Exposer depuis `useChat()` : `{ messages, sendMessage, isStreaming, error, clearError }` (`clearError` pour permettre à `ChatPage`/`ErrorBanner` de réinitialiser l'erreur affichée)

- [x] Task 2 — Composant `Message.tsx` : bulle de chat (AC: #1, #2)
  - [x] Créer `client/src/components/Message.tsx`, props `{ message: Message; isStreaming?: boolean }`
  - [x] Bulle utilisateur (`role === 'user'`) : alignée à droite, style atténué (ex. `bg-navy-800 text-warm-white`, `ml-auto`)
  - [x] Bulle coach (`role === 'assistant'`) : alignée à gauche, style accentué (ex. `bg-navy-700 border-l-2 border-accent text-warm-white`, `mr-auto`)
  - [x] Animation de frappe : quand `isStreaming === true` ET que c'est le dernier message assistant en cours de construction, afficher un indicateur visuel (ex. trois points animés via classes Tailwind `animate-pulse`/`animate-bounce`) à la suite du texte déjà reçu
  - [x] Respecter le support RTL existant (pas de classes `ml-`/`mr-` figées si l'app utilise déjà `dir="rtl"` globalement — vérifier comment `i18n/index.ts` gère `dir()` et utiliser les classes logiques Tailwind (`ms-`/`me-`) si déjà en usage dans le projet, sinon garder `ml-auto`/`mr-auto` pour cette story, cohérent avec le reste du code existant qui n'a pas encore migré vers RTL — RTL complet est traité en Story 4.3)

- [x] Task 3 — Composant `InputBar.tsx` (AC: #1, #5)
  - [x] Créer `client/src/components/InputBar.tsx`, props `{ onSend: (content: string) => void; disabled: boolean }`
  - [x] Champ de saisie texte (`<input>` ou `<textarea>` contrôlé) + bouton d'envoi
  - [x] Soumission (clic bouton ou touche Entrée) : si le contenu est non vide (`trim()`) ET `disabled === false`, appeler `onSend(content)` et vider le champ
  - [x] Le bouton d'envoi et le champ sont désactivés (`disabled` sur l'élément + style visuel atténué) quand la prop `disabled` est `true` (AC#5 — `ChatPage` passera `disabled={isStreaming}`)
  - [x] Textes traduits via `useTranslation()` (placeholder du champ, label du bouton) — ajouter les clés nécessaires dans `client/src/i18n/locales/{fr,en,he}.json` sous `chat.*` (ex. `chat.inputPlaceholder`, `chat.send`)

- [x] Task 4 — Composant `ErrorBanner.tsx` (AC: #4)
  - [x] Créer `client/src/components/ErrorBanner.tsx`, props `{ message: string; onDismiss?: () => void }`
  - [x] Bannière visible (ex. fond rouge/orange atténué cohérent avec la palette navy, texte `warm-white`), affichée seulement si un message d'erreur est présent
  - [x] Le message affiché doit être une chaîne traduite — `ChatPage` mappe le `code` d'erreur SSE (ex. `GROQ_UNAVAILABLE`) vers une clé i18n (ex. `chat.errors.groqUnavailable`) avant de le passer à `ErrorBanner`; prévoir une clé de fallback générique (ex. `chat.errors.generic`) pour un code inconnu ou une erreur réseau
  - [x] Ajouter les clés `chat.errors.groqUnavailable` et `chat.errors.generic` dans `client/src/i18n/locales/{fr,en,he}.json`

- [x] Task 5 — `Chat.tsx` + intégration dans `ChatPage.tsx` (AC: #1, #2, #3, #4, #5)
  - [x] Créer `client/src/components/Chat.tsx`, props `{ messages: Message[]; isStreaming: boolean }` — affiche la liste des `Message` (scroll vertical, conteneur `flex flex-col`), auto-scroll vers le bas à chaque nouveau message/delta (ex. `useRef` + `scrollIntoView` ou `scrollTop = scrollHeight` dans un `useEffect`)
  - [x] Réécrire `client/src/pages/ChatPage.tsx` (actuellement un placeholder statique avec `chat.title`/`chat.placeholder`) :
    - Utiliser `useChat()` pour récupérer `messages`, `sendMessage`, `isStreaming`, `error`, `clearError`
    - Layout : `Chat` (zone messages, prend l'espace disponible) en haut, `ErrorBanner` (si `error`) au-dessus de `InputBar`, `InputBar` (`onSend={sendMessage}`, `disabled={isStreaming}`) en bas
    - Mapper le code d'erreur retourné par `useChat` vers la clé i18n appropriée avant de le passer à `ErrorBanner`
  - [x] Mettre à jour/supprimer les clés `chat.title`/`chat.placeholder` si elles ne sont plus utilisées par le nouveau `ChatPage` (vérifier les autres usages avant suppression)

- [x] Task 6 — Configuration de l'URL API backend (AC: #1)
  - [x] Le client (Vite, port 5173 par défaut) et le serveur Express (port 3001) sont des process séparés sans proxy configuré (`client/vite.config.ts` ne définit pas de `server.proxy`) — `useChat` doit donc cibler une URL absolue
  - [x] Ajouter une constante `apiBaseUrl` lue via `import.meta.env.VITE_API_URL` avec fallback `'http://localhost:3001'` (ex. dans `client/src/hooks/useChat.ts` ou un petit module `client/src/lib/config.ts` si plusieurs hooks en ont besoin à terme — pour cette story, une constante locale dans `useChat.ts` suffit)
  - [x] Documenter `VITE_API_URL` (optionnel, avec son défaut) dans `.env.example` à la racine si pertinent — ne pas bloquer la story sur ce point si le défaut `http://localhost:3001` fonctionne en dev sans variable d'environnement définie

- [x] Task 7 — Tests Vitest (AC: #1 à #5)
  - [x] `client/src/hooks/useChat.test.ts` : remplacer les tests du stub. Mocker `global.fetch` pour retourner une `Response` dont `body` est un `ReadableStream` émettant des chunks `data: {"delta": "..."}\n\n` puis `data: [DONE]\n\n` (encoder en `Uint8Array` via `TextEncoder`). Vérifier :
    - `sendMessage('bonjour')` ajoute immédiatement un message `user` avec le bon contenu
    - le payload envoyé à `fetch` contient `messages` (avec l'historique complet) et `profile`
    - après réception complète du stream, un message `assistant` contient le texte concatené des deltas, et `isStreaming === false`
    - un appel à `sendMessage` pendant `isStreaming === true` est un no-op (le tableau `messages` ne change pas)
    - un événement `data: {"error": {"code": "GROQ_UNAVAILABLE", ...}}` peuple l'état `error` et repasse `isStreaming` à `false` sans ajouter de message `assistant` vide
  - [x] `client/src/components/Message.test.tsx` (NEW) : vérifie le rendu des classes d'alignement/style selon `role`, et l'affichage de l'indicateur de frappe quand `isStreaming` est vrai
  - [x] `client/src/components/InputBar.test.tsx` (NEW) : vérifie que `onSend` est appelé avec le contenu saisi, que le champ se vide après envoi, qu'un contenu vide/whitespace n'appelle pas `onSend`, et que `disabled={true}` désactive le champ/bouton
  - [x] `client/src/components/ErrorBanner.test.tsx` (NEW) : vérifie l'affichage conditionnel du message et l'appel de `onDismiss`
  - [x] `client/src/pages/ChatPage.test.tsx` (NEW, ou adapter un test existant si présent) : test d'intégration léger avec `useChat` mocké (`vi.mock`) vérifiant l'enchaînement saisie → envoi → affichage de la bulle utilisateur → désactivation de `InputBar` pendant `isStreaming`

## Dev Notes

- **Contexte issu des Stories 2.1/2.2 (déjà fait, ne pas refaire) :** le backend `/api/chat` est entièrement fonctionnel — SSE avec `data: {"delta": "..."}\n\n`, fin par `data: [DONE]\n\n`, erreur via `data: {"error": {"message": "...", "code": "GROQ_UNAVAILABLE"}}\n\n` suivi de `[DONE]`. `ChatRequestSchema` attend `{ messages: {role: 'user'|'assistant'|'system', content: string}[], profile: Profile }`. Cette story 2.3 est **purement frontend** : aucune modification de `server/`.
- **Pas de persistance dans cette story** : la persistance des conversations (`StorageRepository.saveConversation`, clé `coach_conversations`, navigation `/chat/:conversationId`) est traitée en **Story 3.1**, qui référence explicitement cette story 2.3 pour le moment de sauvegarde ("un message est envoyé et la réponse du coach est complétée"). Pour 2.3, `messages` peut rester un état local de `useChat` (ex. `useState`), réinitialisé au montage — ne pas implémenter de lecture/écriture `StorageRepository` ici, ni de génération d'`id`/`createdAt` de conversation. Ne pas câbler `useHistory` dans `ChatPage` pour cette story.
- **`profile`** : récupéré via `useAppContext()` (`client/src/context/AppContext.tsx`), qui expose déjà `profile: Profile | null`. `AppRoutes.tsx` garantit que `/chat` n'est accessible que si `profile !== null` (sinon redirection `/onboarding`) — `useChat` peut donc supposer `profile` non-null dans le payload envoyé à `/api/chat`, mais par robustesse ne pas planter si `profile` est `null` au montage (cas transitoire avant chargement) : ne pas envoyer la requête tant que `profile` n'est pas chargé.
- **Format SSE strict à respecter** (architecture §Format Patterns, déjà implémenté côté serveur en 2.2) : chaque événement est une ligne `data: <json>\n\n`. Le parsing côté client doit gérer le cas où un chunk du `ReadableStream` contient un événement partiel ou plusieurs événements concaténés — bufferiser le texte reçu et découper sur `\n\n`, ne traiter que les segments complets, garder le reste en buffer pour le prochain chunk.
- **`isStreaming` et bulle assistant progressive** (AC#2) : au premier `delta` reçu pour un tour de conversation, créer le message `assistant` dans `messages` avec ce premier `delta` comme contenu initial (pas de bulle vide affichée avant le premier delta — évite un flash visuel). Chaque `delta` suivant est concaténé au `content` de ce même message (dernier élément de `messages`).
- **Pas d'envoi concurrent (AC#5)** : `sendMessage` doit être un no-op si `isStreaming === true` — c'est la garde principale. `InputBar` reçoit aussi `disabled={isStreaming}` pour la UX (désactivation visuelle), mais la garde logique dans `useChat` reste la source de vérité (défense en profondeur).
- **Gestion d'erreur (AC#4)** : deux origines possibles — (1) événement SSE `data: {"error": {...}}` reçu pendant un stream par ailleurs valide (le serveur a déjà pu écrire des deltas avant l'erreur, cf. Story 2.2 Dev Notes — dans ce cas le message `assistant` partiel reste affiché avec son contenu reçu jusqu'ici, et l'erreur s'affiche en plus via `ErrorBanner`), et (2) échec de la requête `fetch` elle-même (réseau, serveur down — `fetch` rejette ou retourne un statut non-OK avant tout flux SSE). Dans les deux cas : `isStreaming = false`, `error` renseigné, aucun blocage des envois futurs.
- **Mapping code d'erreur → traduction** : le serveur renvoie `code: 'GROQ_UNAVAILABLE'` pour l'unique cas d'erreur SSE actuellement défini (Story 2.2). `useChat` expose ce `code` brut (ou l'erreur générique pour un échec réseau, ex. `code: 'NETWORK_ERROR'`) ; `ChatPage` (ou `ErrorBanner` lui-même) mappe ce code vers la clé i18n correspondante (`chat.errors.groqUnavailable` / `chat.errors.generic`).
- **URL backend** : pas de proxy Vite configuré (`client/vite.config.ts` actuel ne définit que `react()` et `tailwindcss()`). `server/.env.example` définit `CLIENT_URL=http://localhost:5173` côté CORS, et `PORT=3001` côté serveur — `useChat` doit donc appeler `http://localhost:3001/api/chat` en dev via `import.meta.env.VITE_API_URL` avec fallback à cette valeur.
- **Naming conventions** (architecture, section "Naming Patterns") : camelCase, hooks préfixés `use`, composants fonctionnels PascalCase, booléens d'état préfixés `is` (`isStreaming`, `isLoading` déjà utilisé dans `useProfile`).
- **Tests co-localisés** : `*.test.tsx`/`*.test.ts` à côté du fichier testé, Vitest + `@testing-library/react` (déjà utilisés dans `Onboarding.test.tsx`, `ProfileForm.test.tsx`, `AppContext.test.tsx`). Pas de nouvelle dépendance de test à ajouter — `ReadableStream`/`TextEncoder`/`TextDecoder` sont disponibles nativement dans l'environnement Vitest/jsdom moderne utilisé par ce projet (`jsdom ^26`).
- **i18n** : 3 langues à maintenir en parallèle (`fr.json`, `en.json`, `he.json`) — ajouter les mêmes clés dans les trois fichiers. Le support RTL complet (hébreu) est traité en Story 4.3 ; pour cette story, se contenter de ne pas casser la structure existante des bulles (éviter les classes qui empêcheraient une future bascule RTL si un pattern logique `ms-`/`me-` est déjà en usage ailleurs dans le projet — sinon garder la convention actuelle `ml-`/`mr-`).

### Project Structure Notes

Fichiers à créer (conformes à l'arborescence définie dans l'architecture, section "Complete Project Directory Structure") :
- `client/src/components/Chat.tsx` (NEW)
- `client/src/components/Chat.test.tsx` (NEW)
- `client/src/components/Message.tsx` (NEW)
- `client/src/components/Message.test.tsx` (NEW)
- `client/src/components/InputBar.tsx` (NEW)
- `client/src/components/InputBar.test.tsx` (NEW)
- `client/src/components/ErrorBanner.tsx` (NEW)
- `client/src/components/ErrorBanner.test.tsx` (NEW)

Fichiers à modifier :
- `client/src/hooks/useChat.ts` (UPDATE) — remplace le stub (`messages: []`, `sendMessage` no-op, `isStreaming: false`) par l'implémentation complète (fetch SSE, état local, gestion d'erreur)
- `client/src/hooks/useChat.test.ts` (UPDATE) — remplace les tests du stub
- `client/src/pages/ChatPage.tsx` (UPDATE) — remplace le placeholder statique (`chat.title`/`chat.placeholder`) par l'assemblage `Chat` + `ErrorBanner` + `InputBar` branché sur `useChat`
- `client/src/pages/ChatPage.test.tsx` (NEW si inexistant — vérifié absent actuellement)
- `client/src/i18n/locales/fr.json`, `en.json`, `he.json` (UPDATE) — ajout des clés `chat.inputPlaceholder`, `chat.send`, `chat.errors.groqUnavailable`, `chat.errors.generic` (et suppression de `chat.placeholder`/`chat.title` si plus utilisées, après vérification)

Aucun conflit avec la structure définie par l'architecture. `client/src/components/Chat.tsx`, `Message.tsx`, `InputBar.tsx`, `ErrorBanner.tsx` sont explicitement prévus dans l'arborescence cible et n'existent pas encore (vérifié — seuls `DisclaimerModal.tsx`, `Onboarding.tsx`, `ProfileForm.tsx` existent dans `client/src/components/`).

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3: Interface de chat avec streaming et mémoire] — AC sources
- [Source: docs/PRD-coach-ia.md#6. UX/UI Direction] — palette navy/accent/warm-white, bulles utilisateur (droite, atténué) / coach (gauche, accentué), animation de frappe pendant streaming
- [Source: _bmad-output/planning-artifacts/architecture.md#Format Patterns] — format SSE (`data: {"delta": "..."}`, `[DONE]`, `data: {"error": {...}}`) déjà implémenté côté serveur
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management Patterns] — `isStreaming` géré localement dans `useChat`, convention `is`-préfixée, `AppContext` pour l'état global (profil)
- [Source: _bmad-output/planning-artifacts/architecture.md#Complete Project Directory Structure] — emplacements `client/src/components/{Chat,Message,InputBar,ErrorBanner}.tsx`, `client/src/hooks/useChat.ts`
- [Source: _bmad-output/implementation-artifacts/2-2-integration-groq-avec-streaming-et-retry.md] — contrat SSE exact produit par `routes/chat.ts` (deltas, `[DONE]`, `GROQ_UNAVAILABLE`)
- [Source: client/src/context/AppContext.tsx] — `profile` exposé via `useAppContext()`
- [Source: client/src/routes/AppRoutes.tsx] — `/chat` accessible uniquement si `profile !== null`
- [Source: server/src/schemas/chat.schema.ts] — `ChatRequestSchema` (forme exacte du payload `/api/chat`)
- [Source: server/src/middleware/security.ts] — `corsMiddleware` basé sur `CLIENT_URL`, pas de proxy Vite configuré (`client/vite.config.ts`)
- [Source: .env.example] — `PORT=3001` (serveur), `CLIENT_URL=http://localhost:5173` (client)

## Git Intelligence Summary

Le dernier commit (`e7af125`, "feat: implement chat functionality with streaming and error handling") couvre en réalité les Stories 2.1 et 2.2 (backend `/api/chat` complet : validation, sécurité, SSE, retry Groq, system prompt, tests). Il a aussi mis à jour `Onboarding.tsx`/`ProfileForm.tsx`/`DisclaimerModal.tsx` (Stories 1.3-1.6). Aucun travail frontend sur le chat (`useChat`, `ChatPage`, composants `Chat`/`Message`/`InputBar`/`ErrorBanner`) n'a encore été fait — tous restent à l'état de stub ou n'existent pas. Cette story 2.3 doit suivre les mêmes conventions que le reste du client : composants fonctionnels TypeScript, `useTranslation()` pour tous les textes, Tailwind avec les tokens définis dans `client/src/index.css` (`navy-*`, `accent`, `warm-white`, `warm-gray`), tests co-localisés Vitest + Testing Library.

## Latest Tech Information

- **Fetch streaming SSE côté client** : pas de nouvelle dépendance nécessaire. Pattern standard avec `fetch` + `ReadableStream` (supporté nativement par les navigateurs cibles et par `jsdom ^26` utilisé en test) :
  ```ts
  const response = await fetch(url, { method: 'POST', headers: {...}, body: JSON.stringify(payload) });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      if (!part.startsWith('data: ')) continue;
      const json = part.slice('data: '.length);
      if (json === '[DONE]') { /* fin */ continue; }
      const parsed = JSON.parse(json); // { delta: string } | { error: { message, code } }
    }
  }
  ```
- **react ^19.2.6** : pas de nouvelle API requise pour cette story (hooks standards `useState`/`useEffect`/`useRef`).
- **Aucune librairie SSE tierce** (`eventsource`, `@microsoft/fetch-event-source`, etc.) n'est nécessaire — `EventSource` natif n'est pas utilisable ici car il ne supporte pas les requêtes `POST` avec corps JSON, d'où le choix `fetch` + `ReadableStream` (déjà la convention prévue par l'architecture, §"Streaming SSE bout-en-bout").

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (claude-sonnet-4-6)

### Debug Log References

N/A — pas de débogage hors-norme requis.

### Completion Notes List

- `useChat` implémenté avec gestion d'état locale (`messages`, `isStreaming`, `error`, `clearError`), envoi du payload `{ messages, profile }` (profil via `useAppContext`), parsing SSE bufferisé sur `\n\n` (deltas, `[DONE]`, erreurs), garde no-op si `isStreaming === true`, et gestion d'erreur réseau (`fetch` rejette ou réponse non-OK) via le code `NETWORK_ERROR`.
- Composants `Message`, `InputBar`, `ErrorBanner`, `Chat` créés conformément à l'architecture/PRD (palette navy/accent/warm-white, indicateur de frappe animé sur le dernier message assistant en streaming).
- `ChatPage` réécrit pour assembler `Chat` + `ErrorBanner` + `InputBar` autour de `useChat`, avec mapping `GROQ_UNAVAILABLE` → `chat.errors.groqUnavailable` et fallback générique `NETWORK_ERROR`/inconnu → `chat.errors.generic`.
- Nouvelles clés i18n `chat.inputPlaceholder`, `chat.send`, `chat.errors.groqUnavailable`, `chat.errors.generic` ajoutées dans `fr.json`, `en.json`, `he.json`. Les clés `chat.title`/`chat.placeholder` ont été conservées car utilisées par `i18n/index.test.ts` (test de fallback de langue), bien que plus utilisées par `ChatPage`.
- `apiBaseUrl` lu via `import.meta.env.VITE_API_URL` avec fallback `http://localhost:3001` (constante locale dans `useChat.ts`). `VITE_API_URL` documentée dans `.env.example` racine.
- `client/src/hooks/useChat.test.ts` (stub) supprimé et remplacé par `useChat.test.tsx` (JSX nécessaire pour le wrapper `AppContext.Provider`).
- `AppRoutes.test.tsx` ajusté : l'assertion `screen.getByText('Chat')` (titre supprimé de `ChatPage`) remplacée par `screen.getByText('Envoyer')` (bouton d'envoi de `InputBar`) pour vérifier l'absence de redirection vers `/onboarding`.
- Suite complète : `npx vitest run` → 17 fichiers, 66 tests, tous passants. `npx tsc -b` sans erreur. `npx eslint .` : 5 erreurs préexistantes hors du périmètre de cette story (ProfileForm.tsx, AppContext.tsx, useHistory.ts), aucune nouvelle erreur introduite.

### File List

- `client/src/hooks/useChat.ts` (UPDATE)
- `client/src/hooks/useChat.test.ts` (DELETED, remplacé par `useChat.test.tsx`)
- `client/src/hooks/useChat.test.tsx` (NEW)
- `client/src/components/Message.tsx` (NEW)
- `client/src/components/Message.test.tsx` (NEW)
- `client/src/components/InputBar.tsx` (NEW)
- `client/src/components/InputBar.test.tsx` (NEW)
- `client/src/components/ErrorBanner.tsx` (NEW)
- `client/src/components/ErrorBanner.test.tsx` (NEW)
- `client/src/components/Chat.tsx` (NEW)
- `client/src/components/Chat.test.tsx` (NEW)
- `client/src/pages/ChatPage.tsx` (UPDATE)
- `client/src/pages/ChatPage.test.tsx` (NEW)
- `client/src/routes/AppRoutes.test.tsx` (UPDATE)
- `client/src/i18n/locales/fr.json` (UPDATE)
- `client/src/i18n/locales/en.json` (UPDATE)
- `client/src/i18n/locales/he.json` (UPDATE)
- `.env.example` (UPDATE)

## Change Log

- 2026-06-14 — Implémentation complète de la Story 2.3 (useChat avec streaming SSE + mémoire conversationnelle, composants Chat/Message/InputBar/ErrorBanner, intégration ChatPage, i18n, tests). Statut → review.
