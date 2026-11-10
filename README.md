# Support-Pro (Postea)

Application de support professionnel multi-canaux (Gmail, Telegram…).

- `index.html` : l'application (publiée par GitHub Pages)
- `legal.html` : politique de confidentialité
- `supabase/` : scripts à exécuter dans Supabase (ils ne servent pas au site lui-même)
  - `supabase-handoff.sql` : passage de relais de la connexion Google (navigateur → application)
  - `supabase-telegram.sql` : tables de l'intégration Telegram
  - `telegram-function.ts` : fonction Edge `telegram` (Verify JWT désactivé)

Les fichiers `app.js`, `style.css` et `supabase.js` appartiennent à une ancienne version et ne sont plus utilisés.
