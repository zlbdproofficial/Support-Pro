# Support-Pro (Postea)

Application de support professionnel multi-canaux : Gmail, WhatsApp Business, Telegram et chat web.

- `index.html` : l'application (publiée par GitHub Pages)
- `chat.html` : page de chat vue par vos visiteurs (lien à partager ou bulle sur votre site)
- `legal.html` : politique de confidentialité
- Scripts à exécuter dans Supabase (ils ne servent pas au site lui-même) :
  - `supabase-handoff.sql` : passage de relais de la connexion Google (navigateur → application)
  - `supabase-telegram.sql` + `telegram-function.ts` : intégration Telegram (fonction Edge `telegram`, Verify JWT désactivé)
  - `supabase-webchat.sql` : chat web (aucune fonction Edge nécessaire)
  - `supabase-whatsapp.sql` + `whatsapp-function.ts` : intégration WhatsApp Business via l'API Cloud de Meta (fonction Edge `whatsapp`, Verify JWT désactivé ; l'adresse du webhook et le jeton de vérification sont affichés dans Postea, à coller chez Meta)

Les fichiers `app.js`, `style.css` et `supabase.js` appartiennent à une ancienne version et ne sont plus utilisés.
