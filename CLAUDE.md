# CLAUDE.md — Postea (Support-Pro)

Ce fichier donne à Claude le contexte du projet. Le dépôt GitHub est **public** : n'y écrire **jamais** de jeton, de clé secrète, de mot de passe, de code de récupération ni d'identifiant privé.

## 1. Le projet
Postea est une application de support client multi-canaux (boîte de réception unique) : **Gmail, Telegram et chat web**. **WhatsApp Business est masqué** (décision de l'utilisateur : trop lourd, vérification d'entreprise Meta, règle des 24 h, second numéro) mais son code est conservé. Messenger et Instagram ont été retirés volontairement.

- Dépôt : `zlbdproofficial/Support-Pro` (branche `main`), publié par **GitHub Pages** sur `https://zlbdproofficial.github.io/Support-Pro/`.
- Backend : **Supabase** (projet `lyykydpgabevqtodlwoq`). Une application Android (APK) charge le site.
- Langues de l'interface : français, anglais, arabe (traduction automatique, voir §4).
- L'utilisateur écrit en français, travaille sur PC Windows (et téléphone), préfère avancer **doucement, étape par étape**, et vérifier chaque étape avant la suivante.

## 2. Fichiers du dépôt
| Fichier | Rôle |
|---|---|
| `index.html` | **Toute l'application** (≈ 745 Ko). Servie telle quelle par GitHub Pages. |
| `chat.html` | Page de chat vue par les visiteurs (lien ou bulle à intégrer sur un site). Appelle Supabase avec la clé publique seule. |
| `legal.html` | Politique de confidentialité (utilisée pour Google). À relire par l'utilisateur à chaque nouveau canal. |
| `supabase-handoff.sql` | Passage de relais de la connexion Google (navigateur → application). |
| `supabase-telegram.sql` + `telegram-function.ts` | Telegram : tables + fonction Edge `telegram`. |
| `supabase-webchat.sql` | Chat web : tables + fonctions RPC. **Aucune** fonction Edge. |
| `supabase-whatsapp.sql` + `whatsapp-function.ts` | WhatsApp Business : tables + fonction Edge `whatsapp`. |
| `app.js`, `style.css`, `supabase.js` | Ancienne version, **inutilisés**. Ne pas les modifier. |

Les fichiers `.sql` et `.ts` ne servent pas au site : ils s'exécutent / se déploient dans Supabase. Ils sont dans le dépôt comme sauvegarde.

## 3. Architecture de `index.html`
- Une page parente (scripts classiques) et une ligne `var S={...}` : un objet JSON qui contient **13 écrans** en HTML complet (`splash, login, inbox, read, compose, cal, team, settings, channels, account, security, look, about`), chargés chacun dans une `iframe`.
- Un écran parle au parent par `authReq(action, payload)` (défini dans chaque écran) → `postMessage` → le parent traite l'action et répond `{type:'authres', id, ...}`.
- Actions du parent : `gmail_*`, `tg_*` (status, connect, disconnect, list, thread, send), `wc_*` (status, enable, disable, list, thread, send), `wa_*` (status, connect, disconnect, list, thread, send), ainsi que l'authentification (`signin`, `signup`, `session`…).
- Données lues directement via Supabase (RLS) : `telegram_messages`, `webchat_messages`, `whatsapp_messages`, `user_data`. RPC : `telegram_status`, `webchat_*`, `whatsapp_status`, `store_handoff`, `claim_handoff`.
- L'écran **Lecture** (`read`) est **commun** aux conversations Telegram, chat web et WhatsApp (fonctions `tgOpen`, `tgFetch`, `tgDraw`, `tgSend`…, repérées par `m.tg`, `m.wc`, `m.wa`). L'**Accueil** (`inbox`) a un chargeur par canal (`loadTelegram`, `loadWebchat`, `loadWhatsapp`), qui remplace le message de démonstration du canal quand il est connecté. L'écran **Canaux de contact** (`channels`) contient les fenêtres de connexion (`tgSheet`, `waForm`, `waInfo`, `wcInfo`…).

## 4. Règles pour modifier `index.html`
1. **Ne jamais éditer la ligne `var S=` à la main.** La décoder (JSON), modifier les écrans, puis la réécrire avec `json.dumps(S).replace('</', '<\\/')` (même format). Vérifier d'abord que la réécriture à l'identique redonne exactement la même ligne.
2. Chaque remplacement de texte doit **échouer s'il ne trouve pas exactement une occurrence** (ancres uniques).
3. **Vérifier la syntaxe** de tous les scripts (page + 13 écrans) avec `node --check` après chaque modification.
4. **Traductions.** Chaque écran a sa table `T` de triplets `[français, anglais, arabe]` (correspondance exacte du texte) et une liste de motifs `P`. Tout nouveau texte visible doit y être ajouté (ancre `]],MO={` pour la table), sinon il reste en français. Mots composés dynamiques (« Vous · 12:30 ») : utiliser un motif dans `P`. Éviter les textes variables non traduisibles : préférer des symboles (↩, ✓, ✓✓).
5. **Lisibilité.** La carte de lecture `.mail` est **blanche** avec un texte foncé (`#1c2333`). Ne jamais forcer `color:var(--tx)` (blanc en thème sombre) sur son contenu, et **réinitialiser** le style de la zone `.in` à chaque ouverture de message (l'écran de lecture est réutilisé).
6. Les textes provenant des utilisateurs, visiteurs ou contacts doivent toujours être insérés avec `textContent` (jamais `innerHTML`) ou échappés avec `esc()`.
7. Les secrets (jetons Telegram/Meta, clés secrètes) ne transitent **jamais** vers l'interface au-delà de la saisie : ils sont stockés dans des tables fermées aux clients. Pas de `localStorage` pour un secret.
8. Dans les sorties d'outils, les barres obliques inverses s'affichent parfois doublées : se fier au contenu réel du fichier.
9. **Affichage des messages (écran `read`).**
   - Un e-mail Gmail est rendu de deux façons : **HTML** dans un `iframe` isolé (`sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"`, **jamais** `allow-scripts`), après nettoyage par `htmlClean` (scripts, formulaires, `iframe`, `svg`, `meta refresh`, attributs `on*`, URL `javascript:` supprimés) et avec une politique `Content-Security-Policy` qui bloque tout par défaut ; les **images distantes sont bloquées** tant que l'utilisateur n'a pas cliqué sur « Afficher les images » (alors HTTPS seulement). Ou **texte brut** propre (`textRender` : paragraphes, séparateurs à la place des lignes de `*****`, citations, liens cliquables). Ne jamais assouplir ces protections.
   - Le contenu écrit par des tiers (texte, noms, objets, pièces jointes, aperçus de la boîte de réception) porte l'attribut `data-notr` pour ne **jamais** être traduit automatiquement ; les libellés de l'application, eux, restent traduisibles. Le texte des messages a `dir="auto"` (un texte français reste de gauche à droite dans l'interface arabe).
   - Les bulles de discussion (`tgDraw`) ont les classes `.bb.rx` (reçu) et `.bb.tx` (envoyé), des séparateurs de jours (`.dsep`), des messages groupés (`.g`) et l'heure dans chaque bulle. Les fils renvoient `ts` (horodatage brut) et `mk` (coches) depuis la page principale.
   - Pour **voir** le rendu réel : Chromium est disponible dans le bac à sable (Playwright), avec un faux Supabase injecté ; ne pas se contenter des tests de structure pour juger l'apparence.

## 5. Supabase : principes de sécurité
- Toute table est en **RLS activé**, avec `revoke all` pour `anon` et `authenticated`, puis des `grant` ciblés. Les tables de secrets (`telegram_bots`, `whatsapp_accounts`) n'ont **aucune policy** : seule la fonction Edge (clé service) y accède.
- Les fonctions Edge `telegram` et `whatsapp` doivent avoir **Verify JWT désactivé** (Telegram et Meta n'envoient pas de JWT). Elles vérifient elles-mêmes : secret du webhook (Telegram), jeton de vérification + signature `X-Hub-Signature-256` (WhatsApp), jeton de l'utilisateur (application).
- Le chat web n'a pas de fonction Edge : les visiteurs appellent des fonctions RPC (`webchat_info`, `webchat_send`, `webchat_poll`) avec la clé publique ; anti-spam intégré (10 messages/minute par visiteur).
- Ne jamais mettre la clé `service_role` ni une clé `secret` dans le code du site. La clé `sb_publishable_…` de `index.html` est faite pour être publique.
- Tous les `.sql` doivent pouvoir être **relancés sans risque** (`if not exists`, `drop policy if exists`, `create or replace`).

## 6. Canaux : état et particularités
- **Gmail** : connexion Google via Supabase ; le message de démonstration est remplacé par les vrais messages.
- **Telegram** : fonctionne en production. Un robot ne peut avoir qu'**un seul** destinataire de messages : si l'ancien script Python (tableau de bord ZLBD PRO) tourne avec le même jeton, il coupe le webhook de Postea. Types non affichés : GIF, position, contact, sondage (« [Message non pris en charge] »), amélioration possible.
- **Chat web** : fonctionne en production (testé dans les deux sens). Le lien est `chat.html?w=<identifiant>`. Désactiver garde l'historique et le même lien.
- **WhatsApp Business (API Cloud de Meta)** : **MASQUÉ**. Le code, le SQL et la fonction `whatsapp` restent dans le dépôt, testés par simulation (fonction, base, interface), mais jamais validés de bout en bout chez Meta. **Pour le réactiver** : passer `var WA_ENABLED=false` à `true` dans les trois écrans `channels`, `inbox` et `settings` de `index.html` (méthode du §4), puis relancer les tests du §8. Avant de masquer, l'utilisateur doit déconnecter WhatsApp dans Postea pour effacer le jeton et la clé secrète stockés dans `whatsapp_accounts`.
  - Chaque utilisateur apporte **sa propre application Meta** : Phone Number ID, jeton permanent d'un *utilisateur système*, clé secrète de l'application (`App Secret`). Postea affiche l'URL de rappel (`…/functions/v1/whatsapp?u=<id>`) et le jeton de vérification à coller chez Meta (Configuration → Webhook, abonnement au champ `messages`).
  - **Règle des 24 h** : réponse libre uniquement dans les 24 h suivant le dernier message du client ; Postea l'affiche et refuse l'envoi sinon. Les modèles de message approuvés ne sont **pas** gérés.
  - Un numéro enregistré dans l'API ne peut plus servir dans l'application WhatsApp/Business. L'utilisateur garde son numéro personnel intact et prévoit un **second numéro neuf** pour Postea ; en attendant, numéro de test gratuit de Meta (destinataires de test uniquement).
  - Meta affichait « Compte restreint : faire vérifier l'entreprise » avant d'envoyer des messages : à traiter avant l'usage réel.

## 7. Déploiement (procédure de l'utilisateur)
1. **Supabase** : SQL Editor → coller le `.sql` → Run (« Success »). Edge Functions → créer la fonction (nom exact : `telegram` / `whatsapp`) → **remplacer tout le code d'exemple** par le fichier `.ts` → Deploy updates → Settings → désactiver *Verify JWT* → Save changes. Test : l'adresse de la fonction ouverte dans le navigateur doit répondre `{"ok":false}` (et non « Missing authorization header » ni l'exemple « Hello admin! »).
2. **GitHub** : Add file → Upload files → déposer le fichier (même nom = remplacement) → Commit changes. **Contrôler la taille** de `index.html` (≈ 745 Ko) : une mauvaise version de 163 Ko a déjà été déposée par erreur. Attendre la coche verte (1 à 2 min), puis Ctrl + F5.
3. Ne jamais demander ni accepter de jeton, clé secrète, mot de passe ou code de récupération dans la conversation. Une capture d'écran peut en contenir : prévenir l'utilisateur et lui faire révoquer ce qui a été exposé (cela est déjà arrivé avec un code 2FA).

## 8. Tests de non-régression à refaire après toute modification
- Syntaxe de tous les scripts (`node --check`).
- Simulation de l'application dans un navigateur sans interface (jsdom) en **français, anglais et arabe** : liste des canaux visibles (Gmail, Telegram, chat web ; WhatsApp masqué), connexion/déconnexion de chaque canal, boîte de réception, lecture, réponse, avertissement des 24 h, compteur « canaux connectés » des Paramètres, absence de mot français résiduel en anglais et en arabe, aucune erreur JavaScript au chargement.
- Les `.sql` sur une vraie base PostgreSQL : double exécution sans erreur, isolation entre deux utilisateurs, aucun accès direct pour `anon`, `update` limité à `is_read`.
- La fonction `whatsapp` avec un faux serveur Meta : signature valide/invalide, messages dupliqués, accusés (jamais de retour en arrière), fenêtre de 24 h, isolation entre utilisateurs.

## 9. Pièges déjà rencontrés
- L'éditeur Supabase crée la fonction avec un **code d'exemple** : si on ne colle pas le vrai fichier, on obtient « Missing authorization header ».
- Meta bloque les modifications sensibles depuis un **appareil inhabituel** : utiliser l'appareil habituel de l'utilisateur, ne pas insister, pas de VPN.
- Dans Meta Business, vérifier que le portefeuille sélectionné est **celui qui possède l'application** (sinon les actifs à attribuer à l'utilisateur système sont introuvables).
- Le jeton d'accès de la page *API Setup* est **temporaire** (24 h) : seul le jeton d'un utilisateur système, sans expiration, est utilisable.
- Telegram, WhatsApp : en cas d'échec d'enregistrement d'un message, la fonction répond 500 pour que la plateforme réessaie ; ne pas changer ce comportement.

## 10. À faire (idées)
- WhatsApp (si réactivé) : valider de bout en bout chez Meta, modèles de message, médias, second numéro réel.
- Application Android : voir la section 11.
- Telegram : GIF, position, contact, sondage ; fichiers et photos.
- Suppression de conversation (non disponible pour Telegram, chat web, WhatsApp) ; notifications push ou e-mail à l'arrivée d'un message.
- Supprimer les fichiers inutilisés (`app.js`, `style.css`, `supabase.js`) quand l'utilisateur le décide.

## 11. Application Android (APK)
L'application Android charge le site publié ; la connexion Google passe par le navigateur puis par le relais `store_handoff` / `claim_handoff`, car Google refuse la connexion dans une WebView. Pistes pour en faire une application plus complète : icône et écran de démarrage propres, plein écran, notifications push (Firebase Cloud Messaging, avec une fonction Supabase qui envoie une notification à l'arrivée d'un message), signature de version, puis publication sur Google Play (nécessite un compte développeur et la politique de confidentialité `legal.html`). État : le projet Android (Capacitor 8, construit par GitHub Actions dans un dépôt **privé** `Postea-Android`, clé de signature créée automatiquement au premier lancement, notifications Firebase) est **en cours** : la configuration, les icônes, le script `patch_android.py` et le workflow sont écrits et vérifiés (génération du projet, manifeste, `actionlint`), mais l'APK n'a jamais été construite ici. Reste à faire : fonction Edge `push` (FCM v1), enregistrement du jeton dans `index.html` (`pushInit`/`pushOff`), tests, `README` du dépôt Android, et la mise en place pas à pas avec l'utilisateur (Firebase, secret `FCM_SERVICE_ACCOUNT`, dépôt privé, premier lancement du workflow). `supabase-push.sql` est un brouillon non testé.
