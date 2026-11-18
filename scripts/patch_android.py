#!/usr/bin/env python3
"""Adapte le projet Android généré par Capacitor (dossier android/) pour Postea.
Chaque modification vérifie que son point d'ancrage existe exactement une fois :
si Capacitor change son modèle, le script s'arrête avec un message clair au lieu de produire une APK cassée."""
import pathlib, sys

ROOT = pathlib.Path("android")


def die(msg):
    print("ECHEC patch_android :", msg)
    sys.exit(1)


def replace_once(text, old, new, label):
    n = text.count(old)
    if n != 1:
        die("%s : %d occurrence(s) au lieu de 1" % (label, n))
    return text.replace(old, new)


# ---------------------------------------------------------------- AndroidManifest.xml
manifest = ROOT / "app/src/main/AndroidManifest.xml"
s = manifest.read_text(encoding="utf-8")

# a) le navigateur rouvre l'application sur le lien de Postea après la connexion Google
INTENT_FILTER = """
            <!-- Retour de la connexion Google : le navigateur rouvre l'application sur ce lien -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="zlbdproofficial.github.io" android:pathPrefix="/Support-Pro" />
            </intent-filter>

        </activity>"""
s = replace_once(s, "\n        </activity>", INTENT_FILTER, "manifeste : intent-filter")

# b) notifications : permission d'Android 13+ et réglages par défaut de Firebase
s = replace_once(
    s,
    '    <uses-permission android:name="android.permission.INTERNET" />',
    '    <uses-permission android:name="android.permission.INTERNET" />\n'
    '    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    "manifeste : permission notifications",
)
META = """        <!-- Notifications : canal, petite icône et couleur par défaut -->
        <meta-data android:name="com.google.firebase.messaging.default_notification_channel_id" android:value="messages" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_notify" />
        <meta-data android:name="com.google.firebase.messaging.default_notification_color" android:resource="@color/postea_notification" />

        <provider"""
s = replace_once(s, "        <provider", META, "manifeste : métadonnées Firebase")

# c) pas de sauvegarde automatique de la session dans le cloud de l'utilisateur
s = replace_once(s, 'android:allowBackup="true"', 'android:allowBackup="false"', "manifeste : allowBackup")
manifest.write_text(s, encoding="utf-8")

# ---------------------------------------------------------------- ressources
res = ROOT / "app/src/main/res"
(res / "drawable").mkdir(parents=True, exist_ok=True)
(res / "values").mkdir(parents=True, exist_ok=True)
(res / "drawable/ic_stat_notify.xml").write_text(
    """<?xml version="1.0" encoding="utf-8"?>
<!-- Petite icône des notifications : une bulle de discussion, blanche (Android la teinte lui-même) -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24">
    <path android:fillColor="#FFFFFFFF"
        android:pathData="M6,3h12a3,3 0 0 1 3,3v8a3,3 0 0 1 -3,3H11l-5,4v-4H6a3,3 0 0 1 -3,-3V6a3,3 0 0 1 3,-3z"/>
</vector>
""",
    encoding="utf-8",
)
(res / "values/postea_colors.xml").write_text(
    """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="postea_notification">#0A62FF</color>
</resources>
""",
    encoding="utf-8",
)

# ---------------------------------------------------------------- app/build.gradle
gradle = ROOT / "app/build.gradle"
g = gradle.read_text(encoding="utf-8")
g = replace_once(g, "versionCode 1\n", 'versionCode Integer.parseInt(System.getenv("VERSION_CODE") ?: "1")\n', "gradle : versionCode")
g = replace_once(g, 'versionName "1.0"\n', 'versionName System.getenv("VERSION_NAME") ?: "1.0"\n', "gradle : versionName")
SIGNING = """    signingConfigs {
        release {
            if (System.getenv("KEYSTORE_PATH")) {
                storeFile file(System.getenv("KEYSTORE_PATH"))
                storePassword System.getenv("KEYSTORE_PASSWORD")
                keyAlias "postea"
                keyPassword System.getenv("KEYSTORE_PASSWORD")
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
"""
g = replace_once(g, "    buildTypes {\n        release {\n", SIGNING, "gradle : signature")
gradle.write_text(g, encoding="utf-8")

# ---------------------------------------------------------------- icône de l'application (logo P avec avion)
# capacitor-assets génère des icônes à partir de assets/ ; on les remplace ensuite par les fichiers
# exacts du logo (dossier android-res/), et le fond de l'icône adaptative devient une couleur unie.
import shutil

ICON_SRC = pathlib.Path("android-res")
for dens in ("mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"):
    dst = res / ("mipmap-" + dens)
    dst.mkdir(parents=True, exist_ok=True)
    for name in ("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"):
        src = ICON_SRC / ("mipmap-" + dens) / name
        if not src.is_file():
            die("icône : fichier manquant %s" % src)
        shutil.copyfile(src, dst / name)

# Couleur de fond : un seul endroit doit définir ic_launcher_background (sinon erreur de compilation)
BG_FILE = res / "values/ic_launcher_background.xml"
for f in res.glob("values*/*.xml"):
    if f != BG_FILE and 'name="ic_launcher_background"' in f.read_text(encoding="utf-8"):
        die("icône : la couleur ic_launcher_background est déjà définie dans %s" % f)
BG_FILE.write_text(
    """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#030A1F</color>
</resources>
""",
    encoding="utf-8",
)

ADAPTIVE = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"""
(res / "mipmap-anydpi-v26").mkdir(parents=True, exist_ok=True)
for name in ("ic_launcher.xml", "ic_launcher_round.xml"):
    (res / "mipmap-anydpi-v26" / name).write_text(ADAPTIVE, encoding="utf-8")

print("patch_android : OK (manifeste, ressources, signature, version, icône)")
