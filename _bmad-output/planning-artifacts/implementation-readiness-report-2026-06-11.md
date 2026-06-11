---
stepsCompleted: ["step-01-document-discovery", "step-02-prd-analysis", "step-03-epic-coverage-validation", "step-04-ux-alignment", "step-05-epic-quality-review", "step-06-final-assessment"]
documentsInventory:
  prd: "docs/PRD-coach-ia.md"
  prd_ux_section: "§6"
  architecture: "_bmad-output/planning-artifacts/architecture.md"
  epics: "_bmad-output/planning-artifacts/epics.md"
  ux: "inclus dans PRD §6 (pas de document séparé)"
---

# Implementation Readiness Assessment Report

**Date:** 2026-06-11
**Project:** salut-app

---

## PRD Analysis

### Functional Requirements

FR1: L'utilisateur peut créer un profil incluant âge, genre, poids, objectifs, restrictions alimentaires et niveau d'activité physique.
FR2: L'utilisateur peut sauter l'onboarding et y revenir plus tard.
FR3: Interface de chat avec réponses en streaming en temps réel.
FR4: Le coach retient le contexte de l'utilisateur au fil de la conversation (mémoire intra-session).
FR5: L'utilisateur peut démarrer une nouvelle conversation et consulter les conversations passées.
FR6: L'utilisateur peut visualiser et modifier son profil à tout moment.
FR7: Le profil utilisateur influence automatiquement les conseils du coach.
FR8: L'utilisateur peut parcourir l'historique des conversations passées.
FR9: L'utilisateur peut supprimer une conversation.
FR10: L'application supporte le français, l'hébreu et l'anglais (multilingue).
FR11: Le coach répond dans la langue utilisée par l'utilisateur (détection automatique).
FR12: Persona du coach "Flex" — chaleureux, motivant, fondé sur des preuves, adapte son ton à l'humeur de l'utilisateur, ne juge jamais.
FR13: Le coach couvre 3 domaines : sport (entraînement, mouvement, récupération), nutrition (alimentation, hydratation, timing des repas), qualité de vie (sommeil, stress, habitudes, mindset).
FR14: Détection automatique de la langue avec correspondance dans les réponses.
FR15: Interface mobile-responsive.

**Total FRs : 15**

### Non-Functional Requirements

NFR1: Taux de complétion de l'onboarding > 70%.
NFR2: Plus de 50% des utilisateurs envoient 3+ messages lors de la première session.
NFR3: Plus de 30% des utilisateurs reviennent pour une deuxième session.
NFR4: Temps de réponse du coach < 2 secondes (cible : Groq LPU).
NFR5: Confidentialité des données — stockage local uniquement en MVP, aucune PII envoyée à des tiers.
NFR6: Disclaimer médical affiché lors de la première utilisation.
NFR7: Logique de retry pour les limites de taux Groq + message utilisateur explicite.
NFR8: Fallback vers l'anglais en cas d'échec de détection de langue, avec option de sélection manuelle.

**Total NFRs : 8**

### UX Requirements (extraits de §6)

UX1: Mode sombre par défaut avec bascule mode clair optionnelle.
UX2: Palette : bleu marine profond + accent vert électrique + texte blanc chaud.
UX3: Typographie : police display pour nom du coach/titres, sans-serif lisible pour le chat.
UX4: Bulles de chat : utilisateur à droite (atténué), coach à gauche (accentué).
UX5: Animation de frappe subtile pendant le streaming.
UX6: Onboarding sous forme de flux conversationnel (pas un formulaire).

**Total UX Requirements : 6**

### Additional Requirements / Contraintes

- **Scope MVP** : stockage local (localStorage), pas d'authentification, pas de base de données.
- **Hors scope** : intégrations wearables, suivi calorique avec base alimentaire, contenu vidéo.
- **Phase 2 (hors périmètre actuel)** : authentification JWT, stockage persistant (PostgreSQL/MongoDB), modes de coach multiples (strict/soutenant/neutre), résumés hebdomadaires, notifications push (PWA).

### PRD Completeness Assessment

Le PRD est bien structuré et couvre l'essentiel pour un MVP. Points forts : personas claires, user stories explicites, persona du coach détaillée, métriques de succès mesurables. 

Lacunes identifiées pour la phase d'analyse de couverture :
- Aucun système de numérotation explicite des FRs dans le PRD (extraits par déduction depuis §3 et §4)
- La persistance du contexte inter-sessions (David a besoin que l'app « se souvienne de son contexte ») n'est clairement adressée ni dans le MVP ni dans la Phase 2 — tension à vérifier
- Le §4 MVP mentionne "local storage" pour l'historique mais ne précise pas les limites de taille/rétention

---

## Epic Coverage Validation

### Matrice de couverture FR

| FR # | Exigence PRD | Couverture Epics | Statut |
|------|-------------|-----------------|--------|
| FR1 | Création de profil (âge, genre, poids, objectifs, restrictions, activité) | Epic 1 — Story 1.4 | ✅ Couvert |
| FR2 | Onboarding peut être ignoré et repris plus tard | Epic 1 — Story 1.4 | ✅ Couvert |
| FR3 | Chat en streaming temps réel | Epic 2 — Story 2.3 | ✅ Couvert |
| FR4 | Coach retient le contexte intra-session | Epic 2 — Story 2.3 | ✅ Couvert |
| FR5 | Nouvelle conversation + accès aux conversations passées | Epic 3 — Stories 3.1, 3.2 | ✅ Couvert |
| FR6 | Visualisation et édition du profil à tout moment | Epic 1 — Story 1.5 | ✅ Couvert |
| FR7 | Profil influence automatiquement le coach (system prompt) | Epic 2 — Story 2.2 | ✅ Couvert |
| FR8 | Navigation dans l'historique des conversations | Epic 3 — Story 3.2 | ✅ Couvert |
| FR9 | Suppression d'une conversation | Epic 3 — Story 3.3 | ✅ Couvert |
| FR10 | Support trilingue FR/HE/EN | Epic 4 — Stories 4.1, 4.2 | ✅ Couvert |
| FR11 | Coach répond dans la langue de l'utilisateur | Epic 4 — Story 4.3 | ✅ Couvert |
| FR12 | Persona Flex : chaleureux, adapte son ton à l'humeur, ne juge jamais | Epic 2 — Story 2.2 (partiel) | ⚠️ Partiel |
| FR13 | Trois domaines : sport, nutrition, qualité de vie | Epic 2 — Story 2.2 (partiel) | ⚠️ Partiel |
| FR14 | Détection automatique de la langue + correspondance réponse | Epic 4 — Stories 4.1, 4.3 | ✅ Couvert |
| FR15 | Interface mobile-responsive | Epic 1 — Story 1.1 | ✅ Couvert |

### Couverture NFR

| NFR # | Exigence PRD | Couverture Epics | Statut |
|-------|-------------|-----------------|--------|
| NFR1 | Taux onboarding > 70% | Métrique de succès — aucune story d'analytics | ℹ️ Non implémentable directement |
| NFR2 | 3+ messages/session > 50% | Métrique de succès — aucune story d'analytics | ℹ️ Non implémentable directement |
| NFR3 | Retour 2e session > 30% | Métrique de succès — aucune story d'analytics | ℹ️ Non implémentable directement |
| NFR4 | Réponse < 2s via Groq | Epic 2 — NFR1 / Story 2.2 | ✅ Couvert |
| NFR5 | Stockage local uniquement, aucune PII tierce | Epic 1 (transversal) — NFR3 | ✅ Couvert |
| NFR6 | Disclaimer médical premier lancement | Epic 1 — FR13 / Story 1.3 | ✅ Couvert |
| NFR7 | Retry logic + message utilisateur | Epic 2 — NFR2 / Story 2.2 | ✅ Couvert |
| NFR8 | Fallback anglais + sélection manuelle | Epic 4 — NFR4 / Story 4.2 | ✅ Couvert |

### Exigences manquantes ou partielles

#### ⚠️ GAP 1 — Persona Flex non validée dans les critères d'acceptance (FR12)

**Exigence PRD §5 :** Le coach Flex est chaleureux, direct, fondé sur des preuves, adapte son ton à l'humeur de l'utilisateur, ne juge jamais, ne fait jamais honte.
**Story concernée :** Story 2.2 — `buildSystemPrompt(profile)`
**Problème :** Les AC de Story 2.2 vérifient uniquement que les données du profil (nom, âge, genre, etc.) sont incluses dans le system prompt. Aucun AC ne valide que les instructions comportementales du persona Flex (ton chaleureux, adaptation à l'humeur, non-jugement) sont bien présentes dans le prompt.
**Impact :** Un développeur pourrait générer un system prompt conforme à tous les tests mais dépourvu de la personnalité de Flex.
**Recommandation :** Ajouter un AC à Story 2.2 : *"Et le system prompt contient les instructions comportementales du persona Flex (warmth, non-jugement, adaptation au ton, fondé sur des preuves)"*

#### ⚠️ GAP 2 — Domaines de coaching non validés dans les AC (FR13)

**Exigence PRD §5 :** Flex couvre trois domaines : sport (entraînement, mouvement, récupération), nutrition (alimentation équilibrée, hydratation, timing des repas), qualité de vie (sommeil, stress, habitudes, mindset).
**Story concernée :** Story 2.2
**Problème :** Même lacune que GAP 1 — les domaines de spécialisation ne font l'objet d'aucun AC dans `buildSystemPrompt`.
**Recommandation :** Inclure dans le même AC additionnel de Story 2.2 que le system prompt mentionne les trois domaines de spécialisation.

#### ⚠️ GAP 3 — Typographie non couverte (UX3)

**Exigence PRD §6 :** Police display forte pour le nom du coach et les titres, sans-serif lisible pour le chat.
**Statut :** Story 1.1 couvre la palette de couleurs et le dark mode mais aucun AC ne spécifie la typographie.
**Impact :** Faible — risque de dérive visuelle uniquement.
**Recommandation :** Ajouter un AC à Story 1.1 : *"La police display est appliquée aux titres/nom du coach, la police sans-serif est appliquée au corps du chat, conformément au PRD §6"*

#### ℹ️ OBSERVATION — Métriques de succès sans instrumentation

**Exigence PRD §7 :** Taux de complétion onboarding, messages/session, retour 2e session.
**Statut :** Ces métriques sont des KPIs produit, non des requirements techniques — l'absence de story d'analytics/télémétrie est cohérente pour un MVP sans backend. À prévoir en Phase 2.

#### ℹ️ OBSERVATION — Contexte inter-sessions (Persona C — David)

**Persona PRD :** David "a besoin que l'app se souvienne de son contexte".
**Couverture :** Story 3.1 permet de reprendre une conversation existante (contexte intra-conversation préservé). Mais en ouvrant une NOUVELLE conversation, le coach ne connaît pas les échanges passés.
**Tension :** L'intention de David semble vouloir de la continuité cross-conversation. L'architecture MVP (conversations isolées) ne répond qu'à moitié à ce besoin.
**Recommandation :** Confirmer avec le product owner si la continuité inter-conversations est dans le scope MVP ou reportée en Phase 2 (résumé hebdomadaire / notes de progression).

### Statistiques de couverture

- **FRs PRD total : 15**
- **FRs couverts complètement : 13** (87%)
- **FRs partiellement couverts : 2** (13%)
- **FRs non couverts : 0** (0%)
- **NFRs PRD total : 8** (hors 3 métriques de succès)
- **NFRs couverts : 5/5** (100% des requirements implémentables)

---

## UX Alignment Assessment

### Statut du document UX

**Pas de document UX séparé.** La direction UX est contenue dans le PRD §6. Les 6 exigences UX ont été extraites dans la section "Analyse PRD" ci-dessus (UX1–UX6).

### Alignement PRD §6 ↔ Architecture ↔ Stories

| UX # | Exigence PRD §6 | Support Architecture | Couverture Stories | Statut |
|------|----------------|---------------------|-------------------|--------|
| UX1 | Dark mode par défaut + toggle clair | Tailwind v4 mentionné, dark mode "à détailler en implémentation" | Story 1.1 AC (dark mode default, toggle) | ⚠️ Stratégie non définie |
| UX2 | Palette : navy + vert électrique + blanc chaud | Référencé sans tokens CSS définis | Story 1.1 AC (mentionne la palette) | ⚠️ Tokens non formalisés |
| UX3 | Police display (titres) + sans-serif (chat) | Absent de l'architecture | Absent des ACs | ❌ Non couvert |
| UX4 | Bulles chat : utilisateur droite, coach gauche | Non spécifié architecture | Story 2.3 AC | ✅ Couvert |
| UX5 | Animation de frappe (streaming) | Mentionné (Process Patterns) | Story 2.3 AC | ✅ Couvert |
| UX6 | Onboarding conversationnel (pas un formulaire) | Routing `/onboarding` défini | Story 1.4 (flow conversationnel) | ✅ Couvert |

### Problèmes d'alignement

#### ⚠️ GAP 4 — Stratégie dark mode Tailwind non définie (UX1)

**Problème :** L'architecture spécifie Tailwind v4 mais ne documente pas la stratégie dark mode (`class` vs `media`). Or, Tailwind v4 a modifié son API de dark mode par rapport à v3 — et le PRD impose "dark mode par défaut" indépendamment de la préférence OS, ce qui nécessite impérativement la stratégie `class` avec toggle JS.
**Impact :** Moyen — sans cette décision documentée, un agent IA pourrait implémenter la stratégie `media` (liée à l'OS), produisant un comportement non conforme au PRD pour les utilisateurs en mode clair système.
**Recommandation :** Ajouter dans l'architecture (section "Décisions UI/CSS") : *"Dark mode via stratégie `class` dans `vite.config.ts` / `tailwind.config.ts` — toggle JS applique/retire la classe `dark` sur `<html>`, préférence persistée en `localStorage`"*

#### ⚠️ GAP 5 — Tokens de couleur non formalisés (UX2)

**Problème :** La palette "deep navy + electric green + warm white" est citée dans le PRD et Story 1.1 mais aucune valeur hexadécimale ni token CSS n'est définie dans l'architecture. Chaque développeur/agent pourrait interpréter "navy" ou "vert électrique" différemment.
**Impact :** Faible à moyen — risque de cohérence visuelle (différentes nuances de bleu/vert selon les composants) et de difficulté à maintenir un thème cohérent.
**Recommandation :** Ajouter dans l'architecture (ou dans Story 1.1) : les valeurs Tailwind custom (ex. `'navy': '#0f172a'`, `'electric-green': '#00ff87'`, `'warm-white': '#f8f7f4'`).

#### ❌ GAP 3 (confirmé) — Typographie entièrement absente (UX3)

**Problème :** Ni l'architecture ni aucune story ne mentionnent le choix de police display ou sans-serif. Aucune décision sur l'importation de fonts (Google Fonts, Fontsource, système) n'est documentée.
**Impact :** Faible sur le fonctionnel, mais le PRD décrit une identité visuelle précise ("energetic design, not clinical") dont la typographie est un vecteur clé.
**Recommandation :** Ajouter dans l'architecture : décision de police (ex. `Inter` ou `Geist` pour le corps, `Poppins`/`Space Grotesk` pour les titres) avec la méthode d'import (Fontsource via npm ou Google Fonts CDN).

### Avertissements

> ⚠️ **Absence de document UX dédié** : Pour ce MVP à interface conversationnelle, le PRD §6 est suffisant. Cependant, si l'équipe prévoit des itérations UI fréquentes ou l'intégration d'un designer, un document UX/UI séparé (wireframes, design tokens, composants) deviendra nécessaire en Phase 2.

### Compatibilité Architecture ↔ PRD

L'architecture est globalement bien alignée avec les exigences fonctionnelles du PRD. Les décisions clés (SSE, react-i18next + RTL, repository pattern, route `/api/chat`) adressent toutes les exigences fonctionnelles. Les 3 gaps UX identifiés (dark mode strategy, color tokens, typography) sont des lacunes de spécification niveau implémentation plutôt que des problèmes architecturaux structurels.

---

## Epic Quality Review

### Checklist de conformité par epic

#### Epic 1: Fondations, Onboarding & Profil

| Critère | Résultat |
|---------|---------|
| Valeur utilisateur livrée | ✅ Oui (onboarding, profil, disclaimer) |
| Epic autonome | ✅ Oui |
| Stories correctement dimensionnées | ✅ Oui |
| Pas de dépendances forward | ⚠️ Story 1.5 réf. "les traductions" (Epic 4) |
| Critères d'acceptance au format BDD | ✅ Oui |
| Traçabilité FR maintenue | ✅ FR1, FR2, FR6, FR7, FR12, FR13 |

#### Epic 2: Conversations avec le Coach IA

| Critère | Résultat |
|---------|---------|
| Valeur utilisateur livrée | ✅ Oui (valeur cœur — chat fonctionnel) |
| Epic autonome | ✅ Requiert Epic 1 uniquement |
| Stories correctement dimensionnées | ✅ Oui |
| Pas de dépendances forward | ⚠️ Story 2.3 réf. "traduit" (Epic 4) |
| Critères d'acceptance au format BDD | ✅ Oui |
| Traçabilité FR maintenue | ✅ FR3, FR4, NFR1, NFR2 |

#### Epic 3: Gestion de l'historique des conversations

| Critère | Résultat |
|---------|---------|
| Valeur utilisateur livrée | ✅ Oui |
| Epic autonome | ✅ Requiert Epics 1 & 2 uniquement |
| Stories correctement dimensionnées | ✅ Oui |
| Pas de dépendances forward | ✅ Aucune |
| Critères d'acceptance au format BDD | ✅ Oui |
| Traçabilité FR maintenue | ✅ FR5, FR8, FR9 |

#### Epic 4: Expérience multilingue et RTL

| Critère | Résultat |
|---------|---------|
| Valeur utilisateur livrée | ✅ Oui |
| Epic autonome | ⚠️ Dépend des Epics 1-3 (ajoute les clés de leur UI) |
| Stories correctement dimensionnées | ✅ Oui |
| Pas de dépendances forward | ✅ Aucune (dernier epic) |
| Critères d'acceptance au format BDD | ✅ Oui |
| Traçabilité FR maintenue | ✅ FR10, FR11, NFR4, NFR5 |

---

### 🔴 Violations Critiques

#### CRITIQUE 1 — Dépendance forward : i18n utilisé avant d'être mis en place

**Stories concernées :** Story 1.5, Story 2.3
**Problème :** Story 1.5 (Epic 1) indique que les erreurs de validation "sont affichées via les traductions". Story 2.3 (Epic 2) indique que `ErrorBanner` affiche "un message convivial traduit". Or, l'infrastructure react-i18next (configuration, fichiers de traduction `fr.json`/`he.json`/`en.json`) est créée dans Story 4.1 (Epic 4).

**Conséquence concrète :** Un développeur implémentant la Story 1.5 ou 2.3 sans que l'Epic 4 soit terminé ne peut pas satisfaire les ACs relatifs aux traductions — soit il code en dur des strings, soit il attend Epic 4, soit il implémente partiellement une infrastructure i18n ad hoc.

**Contradiction avec l'architecture :** Le document d'architecture (Implementation Sequence) stipule que "react-i18next (étape 7) doit être en place AVANT l'UI finale (étape 8)". Les epics inversent cet ordre.

**Recommandations (deux options) :**
- **Option A (préférée)** : Déplacer Story 4.1 (init react-i18next + fichiers de traduction de base) en tant que Story 1.1b ou Story 1.2b dans Epic 1, juste après le scaffold. Epic 4 garderait les stories RTL (4.3) et le sélecteur de langue (4.2). Les fichiers de traduction seraient remplis progressivement (chaque story d'UI ajoute ses clés).
- **Option B** : Reformuler les ACs de Stories 1.5 et 2.3 pour ne PAS mentionner les traductions (utiliser strings en dur pour le moment), et marquer explicitement "TODO i18n" pour Epic 4.

---

### 🟠 Problèmes Majeurs

#### MAJEUR 1 — AppContext et hooks métier non couverts par une story explicite

**Problème :** `AppContext.tsx` et les hooks (`useProfile.ts`, `useHistory.ts`, `useChat.ts`) sont listés dans l'architecture mais aucune story ne dit explicitement "créer AppContext" ou "implémenter useProfile". Ces éléments sont présupposés existants dans Story 1.5 ("AppContext est mis à jour"), Story 2.3 ("useChat"), et Story 3.1 ("useHistory").

**Conséquence :** Lors d'une implémentation multi-agents ou séquentielle, un agent implémentant Story 1.5 trouvera que `AppContext` n'existe pas encore.

**Recommandation :** Story 1.1 devrait inclure, dans ses ACs, la création du shell `AppContext.tsx` (avec état vide) et les stubs des hooks (`useProfile`, `useHistory`, `useChat`). Ou créer une Story 1.1b dédiée : "Shell AppContext + stubs des hooks".

#### MAJEUR 2 — Stories techniques ("As a développeur") dans Epics 1 et 2

**Stories concernées :** Story 1.1 (scaffold), Story 1.2 (repository), Story 2.1 (backend fondations)
**Problème :** Ces stories ont une persona "As a développeur", sont de nature technique, et ne livrent aucune valeur utilisateur directe. C'est un écart aux best practices de la méthode (epics = valeur utilisateur).

**Nuance :** Pour un projet greenfield, les stories de scaffold sont conventionnellement acceptées. L'architecture les justifie (impl sequence #1-3). Il s'agit d'un écart contrôlé plutôt qu'une erreur.

**Recommandation :** Acceptable pour le MVP greenfield, mais mentionner explicitement dans le document d'epics que ces stories de "fondations techniques" sont des exceptions délibérées à la règle user-story.

#### MAJEUR 3 — Ambiguïté dans le comportement "Skip Onboarding" (Story 1.4)

**Problème :** L'AC de Story 1.4 indique : *"un profil minimal/par défaut (ou un flag `onboardingSkipped: true`) est persisté"* — l'utilisation de "ou" crée une ambiguïté d'implémentation. Un agent pourrait choisir l'un ou l'autre, créant une divergence.

**Impact :** Si un profil minimal est persisté, d'autres stories (ex. Story 2.2 — construction du system prompt) doivent gérer les champs vides/null. Si un flag est persisté sans profil, le check "aucun profil" doit être adapté.

**Recommandation :** Choisir une approche unique et la documenter. Suggestion : persister un profil avec valeurs par défaut (champs optionnels null) + flag `onboardingSkipped: true` dans le profil, pour rester compatible avec `ProfileSchema` et `buildSystemPrompt`.

---

### 🟡 Préoccupations Mineures

#### MINEUR 1 — Ambiguïté stockage du choix de langue sans profil (Story 4.2)

**Problème :** Story 4.2 indique que le choix de langue est persisté via "champ `language` du profil via `StorageRepository.saveProfile()`, ou clé dédiée si aucun profil n'existe encore". Ce "ou" crée une ambiguïté similaire à MAJEUR 3.

**Recommandation :** Standardiser sur une clé dédiée (`coach_language`) dans localStorage, indépendante du profil, lue au chargement.

#### MINEUR 2 — Titre de l'Epic 1 mélange langage technique et utilisateur

**Problème :** "Fondations" est un terme technique de développement, pas une expression de valeur utilisateur. Pour un produit aligné autour de l'utilisateur, le titre devrait refléter ce que l'utilisateur peut faire.

**Recommandation :** Renommer en "Découverte de l'application & Création de profil" ou "Onboarding & Gestion du Profil" (avec une note séparée sur les fondations techniques dans le corps de l'epic).

#### MINEUR 3 — `ErrorBanner.tsx` créé implicitement dans Story 2.3

**Problème :** Story 2.3 utilise `ErrorBanner` sans qu'aucune story antérieure ne le crée explicitement.

**Recommandation :** Ajouter dans les ACs de Story 2.3 ou Story 2.1 : *"Le composant `ErrorBanner.tsx` est créé et affiche les messages d'erreur reçus du flux SSE"*.

#### MINEUR 4 — Clé localStorage du mode sombre non spécifiée

**Problème :** Story 1.1 indique que "la préférence est conservée" sans nommer la clé localStorage. Chaque agent pourrait choisir une clé différente (`darkMode`, `theme`, `colorScheme`...).

**Recommandation :** Spécifier la clé dans les ACs de Story 1.1 : ex. `coach_theme` avec valeurs `'dark'` | `'light'`.

### Résumé de la revue qualité

| Sévérité | Nombre | Problèmes |
|----------|--------|-----------|
| 🔴 Critique | 1 | Dépendance forward i18n (Stories 1.5 + 2.3 → Epic 4) |
| 🟠 Majeur | 3 | AppContext implicite, stories techniques, ambiguïté skip onboarding |
| 🟡 Mineur | 4 | Ambiguïtés de stockage, titre epic 1, ErrorBanner implicite, clé dark mode |
| **Total** | **8** | |

---

## Synthèse et Recommandations

### Statut de Préparation Global

> ## ⚠️ NÉCESSITE DES CORRECTIONS CIBLÉES
> *Proches de la ligne de départ — 8 problèmes à traiter, tous résolubles sans refactoring de l'architecture*

La couverture des exigences est excellente (87% des FRs couverts complètement, 0 FR totalement absent) et l'architecture est solide. Les problèmes identifiés sont au niveau des epics/stories et peuvent être corrigés en éditant `epics.md` en moins d'une demi-journée.

### Récapitulatif de tous les problèmes identifiés

| ID | Sévérité | Origine | Problème | Document à modifier |
|----|----------|---------|---------|---------------------|
| CRITIQUE-1 | 🔴 | Qualité Epics | Dépendance forward i18n : Stories 1.5 et 2.3 référencent les traductions avant Epic 4 | `epics.md` |
| MAJEUR-1 | 🟠 | Qualité Epics | AppContext + hooks (`useProfile`, `useHistory`, `useChat`) non créés explicitement dans une story | `epics.md` |
| MAJEUR-2 | 🟠 | Qualité Epics | Stories techniques "As a développeur" dans Epics 1 et 2 (écart délibéré acceptable) | Aucun (documenter l'exception) |
| MAJEUR-3 | 🟠 | Qualité Epics | Ambiguïté "skip onboarding" : profil minimal OU flag — comportement non déterministe | `epics.md` |
| GAP-1 | ⚠️ | Couverture FR | AC Story 2.2 ne valide pas les instructions comportementales de la persona Flex | `epics.md` |
| GAP-2 | ⚠️ | Couverture FR | AC Story 2.2 ne valide pas les 3 domaines de coaching dans le system prompt | `epics.md` |
| GAP-3 | ❌ | UX | Typographie entièrement absente (police display + sans-serif) | `architecture.md` + `epics.md` |
| GAP-4 | ⚠️ | UX | Stratégie dark mode Tailwind v4 non définie (class vs media) | `architecture.md` |
| GAP-5 | ⚠️ | UX | Tokens de couleur non formalisés (valeurs hex non définies) | `architecture.md` |
| MINEUR-1 | 🟡 | Qualité Epics | Ambiguïté stockage langue sans profil (Story 4.2) | `epics.md` |
| MINEUR-2 | 🟡 | Qualité Epics | Titre Epic 1 mixte technique/utilisateur | `epics.md` |
| MINEUR-3 | 🟡 | Qualité Epics | `ErrorBanner.tsx` créé implicitement, non référencé dans les ACs | `epics.md` |
| MINEUR-4 | 🟡 | Qualité Epics | Clé localStorage dark mode non spécifiée dans Story 1.1 | `epics.md` |
| OBS-1 | ℹ️ | Couverture FR | Métriques de succès (§7) sans instrumentation — KPIs à prévoir en Phase 2 | Aucun |
| OBS-2 | ℹ️ | Couverture FR | Continuité inter-sessions Persona C (David) — scope à confirmer | Décision PO |

### Actions immédiates requises (avant implémentation)

**Priorité 1 — Obligatoire :**

1. **Résoudre CRITIQUE-1** : Décider si Story 4.1 (init react-i18next) est déplacée en Epic 1, ou reformuler les ACs de Stories 1.5 et 2.3 pour ne pas dépendre des traductions.

2. **Résoudre MAJEUR-1** : Ajouter la création d'`AppContext.tsx` et des stubs des 3 hooks dans les ACs de Story 1.1 (ou nouvelle Story 1.1b).

3. **Résoudre MAJEUR-3** : Choisir une seule approche pour le skip d'onboarding (recommandé : profil avec valeurs null + `onboardingSkipped: true`) et mettre à jour Story 1.4.

**Priorité 2 — Fortement recommandé :**

4. **GAP-1 + GAP-2** : Ajouter un AC dans Story 2.2 pour valider la présence des instructions persona Flex et des 3 domaines dans le system prompt.

5. **GAP-4 + GAP-5** : Ajouter une section "Stratégie CSS/Design Tokens" à l'architecture : stratégie dark mode Tailwind v4 (`class`), et valeurs hex des couleurs principales.

6. **MAJEUR-1 + MINEUR-3 + MINEUR-4** : Compléter les ACs de Story 1.1 (AppContext stub, hooks stubs, clé dark mode `coach_theme`).

**Priorité 3 — Utile mais non bloquant :**

7. **GAP-3** : Décider des polices et méthode d'import, ajouter à l'architecture et à Story 1.1.

8. **MINEUR-1** : Standardiser la persistance langue sur une clé dédiée `coach_language`.

9. **OBS-2** : Confirmer avec le product owner si la continuité inter-sessions (cross-conversation) est dans le scope MVP ou Phase 2.

### Note finale

Cette évaluation a identifié **15 points** sur 3 niveaux de criticité. Aucun FR n'est complètement absent — la couverture fonctionnelle de 87% est très proche de l'objectif. Les corrections nécessaires touchent exclusivement `epics.md` et partiellement `architecture.md`. L'architecture globale est valide et ne nécessite aucune révision structurelle.

**Le projet peut démarrer l'implémentation après correction des 3 points de Priorité 1.**

---
*Rapport généré le 2026-06-11 — Évaluateur : Claude (Expert PM, Traçabilité des Exigences)*
