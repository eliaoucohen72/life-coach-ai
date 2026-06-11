## Deferred from: code review of 1-1-scaffold-du-projet-et-shell-applicatif (2026-06-11)

- Le toggle "mode clair" n'a aucun effet visuel — bg/text appliqués sans condition dans `App.tsx`, aucune palette claire définie dans `index.css` (AC3). Raison du report : palette mode clair non définie dans le PRD ; le mode sombre est l'expérience principale ; reporté à la phase de polish.
- CORS non configuré côté serveur malgré `CLIENT_URL` défini dans `.env.example` — sera nécessaire dès que le client appellera le serveur en cross-origin.
- `GROQ_API_KEY` défini dans `.env.example` mais jamais consommé — sera câblé dans la story du chat IA.
- Accès `localStorage` non protégés contre les exceptions (mode privé/storage désactivé) dans `client/src/App.tsx` — robustesse à ajouter ultérieurement.
- Pas de route catch-all/wildcard dans `client/src/routes/AppRoutes.tsx` — à ajouter quand davantage de routes existeront.
- `vitest` listé en devDependency côté serveur sans script de test ni fichiers de test — préparation pour des tests serveur dans une story future.
