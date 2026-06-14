---
baseline_commit: e7af12594db895764cc34322940c02215d18036b
---

# Story 4.3 : Support RTL pour l'hébreu

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a utilisateur hébréophone,
I want que l'interface s'affiche correctement de droite à gauche lorsque je sélectionne l'hébreu, et que le coach me réponde en hébreu,
so that l'expérience reste lisible et naturelle dans ma langue (FR11, NFR5).

## Acceptance Criteria

1. **[AC1 — `dir` piloté par `i18n.dir()`]** Given la langue active passe à l'hébreu (`he`), When le changement de langue est appliqué, Then l'attribut `dir="rtl"` est appliqué sur `<html>` via `i18n.dir()`, And lorsque la langue passe à `fr` ou `en`, l'attribut redevient `dir="ltr"`. *(Le listener `i18n.on('languageChanged', applyDirection)` dans `client/src/i18n/index.ts` gère déjà ce mécanisme depuis la Story 1.6 et est déjà couvert par un test dans `App.test.tsx` — AC1 est donc déjà satisfait techniquement ; cette story doit simplement vérifier qu'aucune régression n'est introduite et peut ajouter un test complémentaire `fr`/`en` → `ltr` si jugé utile.)*

2. **[AC2 — Layout RTL correct sur sidebar, bulles de chat et formulaires]** Given l'interface affichée en mode RTL (`dir="rtl"`), When l'utilisateur consulte la sidebar, les bulles de chat et les formulaires (onboarding, profil), Then la mise en page (alignements, marges, icônes directionnelles) s'inverse correctement sans chevauchement ni élément mal positionné, sur mobile et desktop.

3. **[AC3 — Réponse du coach dans la langue du message, fallback anglais]** Given un utilisateur écrivant en hébreu dans `InputBar`, When le message est envoyé via `POST /api/chat`, Then le system prompt (`buildSystemPrompt`) instruit le coach de répondre dans la même langue que le message de l'utilisateur (FR11), And la bulle de réponse du coach affichée respecte également l'orientation RTL si la réponse est en hébreu (héritée de AC2 — pas de logique spécifique à la langue de la réponse côté client, le rendu RTL est piloté par `dir` sur `<html>`, pas par bulle). Given la détection de la langue d'un message utilisateur échoue ou est ambiguë côté coach, When le coach génère sa réponse, Then la réponse est produite en anglais par défaut (NFR4), conformément aux instructions du system prompt.

## Tasks / Subtasks

- [x] Task 1 : Bulles de chat — remplacer les classes Tailwind physiques par des classes logiques RTL-aware (AC2)
  - [x] 1.1 Dans `client/src/components/Message.tsx` :
    - Bulle utilisateur (`isUser === true`) : remplacer `ml-auto` par `ms-auto` (`margin-inline-start: auto` — pousse la bulle vers le côté "fin" de direction, donc à droite en LTR et à gauche en RTL, conservant l'alignement relatif actuel)
    - Bulle coach (`isUser === false`) : remplacer `mr-auto` par `me-auto`, et remplacer `border-l-2 border-accent` par `border-s-2 border-accent` (la barre d'accent doit rester du côté "début" de lecture, donc à gauche en LTR et à droite en RTL)
    - Indicateur de frappe (`<span className="ml-2 ...">`, ligne 21) : remplacer `ml-2` par `ms-2`
  - [x] 1.2 Dans `client/src/components/Message.test.tsx`, mettre à jour les assertions existantes pour suivre le renommage :
    - Ligne 9 : `expect(bubble?.className).toContain('ml-auto')` → `expect(bubble?.className).toContain('ms-auto')`
    - Ligne 16 : `expect(bubble?.className).toContain('mr-auto')` → `expect(bubble?.className).toContain('me-auto')`
    - Ne PAS ajouter de nouveaux tests de rendu RTL ici (jsdom ne calcule pas le rendu visuel — un test de classe logique suffit, déjà couvert par les assertions ci-dessus)

- [x] Task 2 : Sidebar — bordures et alignement de texte logiques RTL-aware (AC2)
  - [x] 2.1 Dans `client/src/components/Sidebar.tsx` :
    - Ligne 30 : remplacer `border-r border-navy-700` par `border-e border-navy-700` (la bordure séparant la sidebar du contenu principal doit rester du côté "fin", c.-à-d. à droite en LTR — adjacente au contenu — et à gauche en RTL)
    - Ligne 52 : remplacer `border-l-2` par `border-s-2` (l'indicateur de conversation active doit rester du côté "début" de la sidebar) et `text-left` par `text-start`
  - [x] 2.2 Aucun changement de test requis si aucun test existant n'assert sur ces classes (vérifié : `Sidebar.test.tsx` ne contient pas d'assertion sur `border-r`/`border-l-2`/`text-left`) — si une régression de test apparaît après modification, ajuster l'assertion vers la classe logique équivalente

- [x] Task 3 : Vérification des autres composants (onboarding, profil, header, sidebar) — pas de classes physiques restantes (AC2)
  - [x] 3.1 Confirmer (recherche déjà effectuée pendant l'analyse de cette story) qu'aucune autre classe Tailwind physique directionnelle (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `rounded-l`, `rounded-r`, `border-l-`, `border-r-`, `text-left`, `text-right`, `float-`) n'est présente dans `ProfileForm.tsx`, `Onboarding.tsx`, `App.tsx`, `InputBar.tsx`, `ErrorBanner.tsx`, `ConfirmDialog.tsx`, `DisclaimerModal.tsx`, `LanguageSelector.tsx` — ces fichiers utilisent uniquement des layouts flex/grid neutres (`flex`, `gap`, `justify-between`, `items-center`, `max-w-md`, `w-full`) qui s'inversent automatiquement avec `dir="rtl"` sans modification
  - [x] 3.2 Si une classe physique directionnelle est découverte pendant l'implémentation dans un de ces fichiers, la remplacer par son équivalent logique (`ml-*`→`ms-*`, `mr-*`→`me-*`, `pl-*`→`ps-*`, `pr-*`→`pe-*`, `border-l-*`→`border-s-*`, `border-r-*`→`border-e-*`, `text-left`→`text-start`, `text-right`→`text-end`, `rounded-l-*`→`rounded-s-*`, `rounded-r-*`→`rounded-e-*`)
  - [x] 3.3 Aucune modification de `client/src/i18n/index.ts`, `client/src/index.css`, ou de la configuration Tailwind n'est nécessaire — Tailwind v4 supporte nativement les propriétés logiques (`ms-`, `me-`, `ps-`, `pe-`, `border-s-`, `border-e-`, `text-start`, `text-end`, etc.) sans plugin additionnel

- [x] Task 4 : System prompt — réponse dans la langue de l'utilisateur avec repli anglais (AC3, FR11, NFR4)
  - [x] 4.1 Dans `server/src/lib/systemPrompt.ts`, étendre la chaîne de retour de `buildSystemPrompt` pour ajouter, après la phrase existante `"You respond in the same language the user writes in."`, une instruction explicite de repli : `"If the user's language is unclear or ambiguous, respond in English by default."` (NFR4 — repli automatique vers l'anglais en cas d'échec de détection)
  - [x] 4.2 Ne PAS modifier la structure du prompt (profil utilisateur, ton, persona) — ajout d'une seule phrase au paragraphe d'instructions existant
  - [x] 4.3 Dans `server/src/lib/systemPrompt.test.ts`, étendre le test existant `'includes the base persona description'` (ligne 5-10) avec une assertion supplémentaire : `expect(prompt).toContain("If the user's language is unclear or ambiguous, respond in English by default.")`
  - [x] 4.4 Aucune modification de `server/src/routes/chat.ts`, `server/src/lib/groqClient.ts`, ou des schémas — `buildSystemPrompt(profile)` est déjà appelé et le system prompt déjà transmis à Groq ; cette story modifie uniquement le contenu textuel du prompt

- [x] Task 5 : Validation finale (AC: tous)
  - [x] 5.1 `npm test -w client` — tous les tests passent (suite existante + `Message.test.tsx` mis à jour), sans régression (21 fichiers, 155 tests ✅)
  - [x] 5.2 `npm test -w server` — tous les tests passent (`systemPrompt.test.ts` mis à jour), sans régression (5 fichiers, 21 tests ✅)
  - [x] 5.3 `tsc -b` — aucune nouvelle erreur introduite par cette story (modifications purement CSS/string, aucun changement de typage). Note : des erreurs `tsc` pré-existantes et sans rapport (typage `Conversation.updatedAt` dans `ChatPage.test.tsx`, config `ignoreDeprecations`) existent déjà sur `master` avant cette story et ne sont pas dans son périmètre.
  - [ ] 5.4 Vérification manuelle (optionnelle) : `npm run dev`, sélectionner "עברית" via le `LanguageSelector`, confirmer `dir="rtl"` sur `<html>`, vérifier visuellement la sidebar (bordure et indicateur à droite), les bulles de chat (utilisateur à gauche, coach à droite avec accent à droite), et les formulaires (onboarding/profil) sans chevauchement

## Dev Notes

### Périmètre exact de la story

- Cette story est **principalement un changement de classes Tailwind** (propriétés physiques → logiques) côté `client`, plus **une seule phrase ajoutée** au system prompt côté `server`.
- AC1 (dir piloté par `i18n.dir()` sur changement de langue) est **déjà implémenté et testé** depuis la Story 1.6 (`client/src/i18n/index.ts`, listener `languageChanged` → `applyDirection`) et vérifié dans `App.test.tsx` (test `"restaure la langue 'he' depuis le profil au chargement (AC3/AC4)"`, ligne 75-84, qui vérifie `document.documentElement.dir === 'rtl'`). **Ne pas réimplémenter ce mécanisme.**
- Ne pas toucher à `client/src/i18n/index.ts`, à la configuration Tailwind (`vite.config.ts`, `index.css`), ni à `AppContext.tsx`.
- Ne pas modifier `server/src/routes/chat.ts`, `server/src/lib/groqClient.ts`, ni les schémas Zod — uniquement le texte retourné par `buildSystemPrompt`.
- Le rendu RTL des bulles de chat ne dépend QUE de `dir="rtl"` sur `<html>` (héritage CSS) combiné aux classes logiques (`ms-`/`me-`/`border-s-`/`border-e-`) — il n'y a **pas de logique conditionnelle par langue de message** à ajouter dans `Message.tsx` (la bulle coach en hébreu n'a pas de traitement différent d'une bulle coach en français : c'est le `dir` global qui inverse la mise en page).

### Fichiers à lire avant modification (état actuel)

- **`client/src/components/Message.tsx`** (29 lignes) : bulle utilisateur = `ml-auto ... bg-navy-800`, bulle coach = `mr-auto ... border-l-2 border-accent bg-navy-700`, indicateur de frappe = `ml-2 inline-flex gap-1`. Trois classes physiques à convertir.
- **`client/src/components/Sidebar.tsx`** (95 lignes) : conteneur racine = `flex w-64 flex-col border-r border-navy-700 bg-navy-900` (ligne 30) ; bouton de conversation = `flex flex-1 flex-col items-start gap-0.5 border-l-2 px-3 py-2 text-left ...` (ligne 52). Deux lignes à convertir.
- **`client/src/components/Message.test.tsx`** (29 lignes) : tests ligne 9 (`'ml-auto'`) et ligne 16 (`'mr-auto'`) à renommer en cohérence avec Task 1.
- **`server/src/lib/systemPrompt.ts`** (25 lignes) : `buildSystemPrompt` retourne un template literal se terminant par `User profile: ${profileSummary}` — la phrase de repli anglais doit être insérée dans le paragraphe d'instructions (avant `You always take the user's profile into account...` ou juste après `You respond in the same language the user writes in.`), pas après le profil.
- **`server/src/lib/systemPrompt.test.ts`** (45 lignes) : test ligne 5-10 à étendre avec la nouvelle assertion (Task 4.3).
- **`client/src/i18n/index.ts`** (33 lignes) : **NE PAS MODIFIER** — confirmé que `applyDirection` + listener `languageChanged` gèrent déjà AC1 entièrement (`document.documentElement.dir = i18n.dir(lng)`).

### Recherche exhaustive des classes Tailwind physiques directionnelles (effectuée pendant l'analyse)

Recherche de `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `rounded-l`, `rounded-r`, `border-l-`, `border-r-`, `text-left`, `text-right`, `float-` dans tous les `.tsx` de `client/src` (hors fichiers `.test.tsx`) :

- `client/src/components/Message.tsx` : `ml-auto`, `mr-auto`, `border-l-2`, `ml-2` → tous à convertir (Task 1)
- `client/src/components/Sidebar.tsx` : `border-r`, `border-l-2`, `text-left` → tous à convertir (Task 2)
- `client/src/components/ConfirmDialog.tsx`, `DisclaimerModal.tsx`, `Onboarding.tsx`, `ProfileForm.tsx` : uniquement `rounded-lg` (non directionnel — `rounded-lg` affecte les 4 coins, ne pas confondre avec `rounded-l-lg`/`rounded-r-lg`) → **aucune conversion nécessaire**
- `client/src/components/ErrorBanner.tsx`, `InputBar.tsx`, `App.tsx` : aucune classe physique directionnelle trouvée

Aucune icône directionnelle (flèches ←/→, chevrons) n'a été trouvée dans le code (recherche `←|→|⬅|➡|chevron|arrow` : aucun résultat dans les `.tsx`).

### Mapping Tailwind logique de référence (Tailwind v4, natif, aucun plugin requis)

| Physique (à éviter) | Logique (RTL-aware) | Effet en LTR | Effet en RTL |
|---|---|---|---|
| `ml-*` | `ms-*` (margin-inline-start) | marge à gauche | marge à droite |
| `mr-*` | `me-*` (margin-inline-end) | marge à droite | marge à gauche |
| `pl-*` | `ps-*` | padding gauche | padding droite |
| `pr-*` | `pe-*` | padding droite | padding gauche |
| `border-l-*` | `border-s-*` | bordure gauche | bordure droite |
| `border-r-*` | `border-e-*` | bordure droite | bordure gauche |
| `text-left` | `text-start` | texte aligné à gauche | texte aligné à droite |
| `text-right` | `text-end` | texte aligné à droite | texte aligné à gauche |
| `rounded-l-*` | `rounded-s-*` | coins arrondis gauche | coins arrondis droite |
| `rounded-r-*` | `rounded-e-*` | coins arrondis droite | coins arrondis gauche |

### Project Structure Notes

Fichiers à modifier :
```
client/src/components/Message.tsx        # ml-auto→ms-auto, mr-auto→me-auto, border-l-2→border-s-2, ml-2→ms-2
client/src/components/Message.test.tsx   # assertions 'ml-auto'→'ms-auto', 'mr-auto'→'me-auto'
client/src/components/Sidebar.tsx        # border-r→border-e, border-l-2→border-s-2, text-left→text-start
server/src/lib/systemPrompt.ts           # + phrase de repli anglais (NFR4)
server/src/lib/systemPrompt.test.ts      # + assertion sur la nouvelle phrase
```

Aucun fichier créé. Aucune modification de schémas, routes serveur, configuration i18n/Tailwind, ou traductions (`fr.json`/`en.json`/`he.json` — aucune nouvelle clé visible n'est introduite par cette story).

### Previous Story Intelligence

- Story 1.6 a déjà implémenté `i18n.dir()` + listener `languageChanged` appliquant `dir`/`lang` sur `<html>` (`client/src/i18n/index.ts`) — AC1 de cette story est une conséquence directe de ce mécanisme, déjà testé.
- Story 4.2 (en `review`) a confirmé que `i18n.language` (via `useTranslation()`) est la source de vérité pour la langue active (pas `AppContext.language`, jamais branché) — cohérent avec le fait que `dir` suit `i18n.language` automatiquement.
- Story 4.1 a établi `client/src/i18n/locales.test.ts` (parité stricte des clés `fr`/`en`/`he`) — cette story n'ajoute aucune clé de traduction, donc ce test n'est pas affecté.
- État non commité signalé en Story 4.2 : `client/src/i18n/locales/{fr,en,he}.json`, `client/src/types/index.ts`, hooks/`pages` Epic 2/3, plusieurs composants — prérequis déjà en place, ne pas re-modifier sauf les fichiers listés ci-dessus pour cette story.

### References

- Epics — Story 4.3 AC (FR11, NFR5, NFR4) : [Source: _bmad-output/planning-artifacts/epics.md#Story 4.3]
- Architecture — "RTL hébreu dès le MVP → `i18n.dir()` + classes Tailwind logiques (start/end)" : [Source: _bmad-output/planning-artifacts/architecture.md#Cohesion & Validation Check]
- Architecture — Internationalisation, `i18n.dir()` sur `<html>`, sélecteur manuel + détection navigateur : [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture]
- Story 1.6 — Infrastructure i18n, `applyDirection`, listener `languageChanged` : [Source: _bmad-output/implementation-artifacts/1-6-infrastructure-i18n-initialisation-et-traductions-epic-1.md]
- Story 4.2 — `i18n.language` comme source de vérité, persistance/restauration de la langue : [Source: _bmad-output/implementation-artifacts/4-2-selecteur-de-langue-et-persistance-du-choix.md]
- Code existant — `client/src/components/Message.tsx`, `client/src/components/Sidebar.tsx`, `client/src/i18n/index.ts`, `server/src/lib/systemPrompt.ts` (lus intégralement pendant l'analyse de cette story)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-create-story workflow)

### Debug Log References

### Completion Notes List

Implémentation réalisée le 2026-06-14 :
- `Message.tsx` : `ml-auto`→`ms-auto`, `mr-auto`/`border-l-2`→`me-auto`/`border-s-2`, `ml-2`→`ms-2` (indicateur de frappe). Assertions correspondantes mises à jour dans `Message.test.tsx`.
- `Sidebar.tsx` : `border-r`→`border-e` (conteneur racine), `border-l-2`→`border-s-2` et `text-left`→`text-start` (bouton de conversation).
- Recherche exhaustive confirmée : aucune classe Tailwind physique directionnelle restante dans `ProfileForm.tsx`, `Onboarding.tsx`, `App.tsx`, `InputBar.tsx`, `ErrorBanner.tsx`, `ConfirmDialog.tsx`, `DisclaimerModal.tsx`, `LanguageSelector.tsx` (seules occurrences restantes : `rounded-lg`, non directionnel).
- `systemPrompt.ts` : ajout de la phrase de repli "If the user's language is unclear or ambiguous, respond in English by default." après la phrase existante sur la langue de réponse. Assertion ajoutée dans `systemPrompt.test.ts`.
- Tests : `npm test -w client` → 21 fichiers / 155 tests ✅. `npm test -w server` → 5 fichiers / 21 tests ✅.
- `tsc -b` : pas de nouvelle erreur introduite par cette story (vérifié par comparaison avec l'état avant modification : les erreurs présentes — typage `Conversation.updatedAt` dans `ChatPage.test.tsx` et config `ignoreDeprecations` — sont pré-existantes sur `master` et hors périmètre de cette story, purement CSS/string).
- Subtask 5.4 (vérification visuelle manuelle via `npm run dev`) est explicitement optionnelle et non exécutée dans cette session.

Story 4.3 créée via bmad-create-story le 2026-06-14. Analyse complète : epics.md (Story 4.3 AC — FR11, NFR5, NFR4), architecture.md (RTL via `i18n.dir()` + classes Tailwind logiques start/end, déjà planifié dès la conception), Story 1.6 (mécanisme `applyDirection`/listener `languageChanged` déjà en place et testé — AC1 déjà satisfait), Story 4.2 (source de vérité `i18n.language`), recherche exhaustive de toutes les classes Tailwind physiques directionnelles dans `client/src/**/*.tsx` (uniquement `Message.tsx` et `Sidebar.tsx` concernés), lecture intégrale de `server/src/lib/systemPrompt.ts` et `systemPrompt.test.ts` pour l'instruction de repli anglais (AC3/NFR4).

Point d'attention principal pour le dev agent : cette story est volontairement de **petite taille** — 5 fichiers modifiés, aucune nouvelle abstraction, aucun nouveau composant. Le risque principal est de sur-implémenter (ex. ajouter une logique de détection de langue par bulle de message côté client, ou créer un hook RTL dédié) alors que `dir="rtl"` sur `<html>` + classes logiques Tailwind suffisent entièrement pour AC2, et qu'AC1 est déjà couvert par l'infrastructure existante.

### File List

- `client/src/components/Message.tsx` (modifié)
- `client/src/components/Message.test.tsx` (modifié)
- `client/src/components/Sidebar.tsx` (modifié)
- `server/src/lib/systemPrompt.ts` (modifié)
- `server/src/lib/systemPrompt.test.ts` (modifié)

## Change Log

- 2026-06-14 : Création de la story (bmad-create-story) — analyse complète des AC, recherche exhaustive des classes Tailwind directionnelles, plan de conversion vers propriétés logiques RTL-aware et instruction de repli anglais pour le system prompt.
- 2026-06-14 : Implémentation — conversion des classes Tailwind physiques en classes logiques RTL-aware (`Message.tsx`, `Sidebar.tsx` + tests associés) et ajout de l'instruction de repli anglais dans `buildSystemPrompt` (`systemPrompt.ts` + test). Tous les tests client (155) et serveur (21) passent. Statut passé à "review".
