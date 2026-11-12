// Postea : fonction Edge "whatsapp"
// - reçoit les messages WhatsApp Business (API Cloud de Meta) de chaque utilisateur (webhook)
// - connecte / déconnecte un numéro, et envoie les réponses
// À déployer dans Supabase : Edge Functions > Deploy a new function > nom : whatsapp
// IMPORTANT : désactivez "Verify JWT" pour cette fonction (Meta n'envoie pas de JWT).
// La fonction vérifie elle-même : le jeton de vérification (GET) et la signature
// X-Hub-Signature-256 (POST) pour Meta, et le jeton de l'utilisateur pour l'application.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const GRAPH = "https://graph.facebook.com/v23.0";
const WINDOW_MS = 24 * 3600 * 1000; // fenêtre de service client WhatsApp : 24 h après le dernier message du client

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function safeEqual(a, b) {
  a = String(a || "");
  b = String(b || "");
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function randomHex(bytes) {
  const a = new Uint8Array(bytes);
  crypto.getRandomValues(a);
  return Array.from(a).map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, data) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PNID = /^\d{5,20}$/;
const WAID = /^\d{6,20}$/;
const ACCESS_TOKEN = /^[A-Za-z0-9_\-|.]{20,700}$/;
const APP_SECRET = /^[0-9a-f]{32}$/i;
const RANK = { sent: 1, delivered: 2, read: 3, failed: 4 };
// PostgreSQL refuse le caractère NUL : on le retire pour qu'un message piégé ne bloque pas le webhook
const clean = (s) => String(s == null ? "" : s).replace(/\u0000/g, "");

// Texte affiché dans la boîte de réception pour un message reçu (null = on l'ignore)
function describe(m) {
  switch (m.type) {
    case "text":
      return (m.text && m.text.body) || "";
    case "image":
      return "📷 Photo" + (m.image && m.image.caption ? " : " + m.image.caption : "");
    case "video":
      return "🎬 Vidéo" + (m.video && m.video.caption ? " : " + m.video.caption : "");
    case "audio":
      return m.audio && m.audio.voice ? "🎤 Message vocal" : "🎵 Audio";
    case "document":
      return "📎 Fichier" + (m.document && m.document.filename ? " : " + m.document.filename : "");
    case "sticker":
      return "Sticker";
    case "location":
      return "📍 Position" + (m.location && m.location.name ? " : " + m.location.name : "");
    case "contacts":
      return "👤 Contact";
    case "button":
      return (m.button && m.button.text) || "[Réponse à un bouton]";
    case "interactive": {
      const i = m.interactive || {};
      return (i.button_reply && i.button_reply.title) || (i.list_reply && i.list_reply.title) || "[Réponse interactive]";
    }
    case "reaction":
      return null; // une réaction n'est pas un message
    default:
      return "[Message non pris en charge]";
  }
}

// ---------- Meta -> Postea ----------
async function verify(url, uid) {
  if (!UUID.test(uid)) return new Response("Forbidden", { status: 403 });
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const { data: acc } = await admin.from("whatsapp_accounts").select("verify_token").eq("user_id", uid).maybeSingle();
  if (mode === "subscribe" && acc && challenge && safeEqual(token, acc.verify_token)) {
    return new Response(String(challenge), { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Forbidden", { status: 403 });
}

async function webhook(req, uid) {
  if (!UUID.test(uid)) return json({ ok: false }, 400);
  const { data: acc } = await admin
    .from("whatsapp_accounts")
    .select("phone_number_id,app_secret")
    .eq("user_id", uid)
    .maybeSingle();
  if (!acc) return json({ ok: false }, 401);

  // Signature de Meta : HMAC-SHA256 du corps brut, avec la clé secrète de l'application
  const raw = await req.text();
  const sig = (req.headers.get("x-hub-signature-256") || "").replace(/^sha256=/i, "");
  const expected = await hmacHex(acc.app_secret, raw);
  if (!safeEqual(sig.toLowerCase(), expected)) return json({ ok: false }, 401);

  let body;
  try {
    body = JSON.parse(raw);
  } catch (_e) {
    return json({ ok: true });
  }

  const rows = [];
  const statuses = [];
  for (const entry of body.entry || []) {
    for (const ch of entry.changes || []) {
      const v = ch.value || {};
      if (!v.metadata || String(v.metadata.phone_number_id) !== acc.phone_number_id) continue;
      const names = {};
      for (const c of v.contacts || []) names[String(c.wa_id)] = (c.profile && c.profile.name) || "";
      for (const m of v.messages || []) {
        const text = describe(m);
        if (text === null || !m.id || !m.from) continue;
        rows.push({
          user_id: uid,
          wa_id: String(m.from),
          contact_name: clean(names[String(m.from)]) || null,
          wa_message_id: String(m.id),
          direction: "in",
          text: clean(text).slice(0, 4096),
          created_at: new Date((Number(m.timestamp) || Date.now() / 1000) * 1000).toISOString(),
        });
      }
      for (const s of v.statuses || []) {
        if (s.id && RANK[s.status]) statuses.push({ id: String(s.id), status: String(s.status) });
      }
    }
  }

  if (rows.length) {
    const { error } = await admin
      .from("whatsapp_messages")
      .upsert(rows, { onConflict: "user_id,wa_message_id", ignoreDuplicates: true });
    // En cas d'échec on répond 500 : Meta réessaiera au lieu de perdre le message.
    if (error) return json({ ok: false }, 500);
  }

  for (const s of statuses) {
    const { data: cur } = await admin
      .from("whatsapp_messages")
      .select("status")
      .eq("user_id", uid)
      .eq("wa_message_id", s.id)
      .eq("direction", "out")
      .maybeSingle();
    if (cur && (RANK[cur.status] || 0) < RANK[s.status]) {
      await admin
        .from("whatsapp_messages")
        .update({ status: s.status })
        .eq("user_id", uid)
        .eq("wa_message_id", s.id)
        .eq("direction", "out");
    }
  }
  return json({ ok: true });
}

// ---------- Application -> Postea ----------
function graphError(j, fallback) {
  const c = j && j.error && j.error.code;
  if (c === 190) return "Jeton invalide ou expiré.";
  if (c === 100) return "Phone Number ID introuvable pour ce jeton.";
  if (c === 131047 || c === 131026) {
    return "Délai de 24 h dépassé : WhatsApp n\u2019autorise plus de réponse libre. Attendez que le client vous réécrive.";
  }
  if (c === 131030) return "Ce numéro n\u2019est pas autorisé : ajoutez-le comme destinataire de test chez Meta.";
  return fallback;
}

async function app(req) {
  const auth = req.headers.get("authorization") || "";
  const jwt = auth.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ ok: false, error: "Non autorisé." }, 401);
  const { data: u, error: ue } = await admin.auth.getUser(jwt);
  if (ue || !u || !u.user) return json({ ok: false, error: "Non autorisé." }, 401);
  const uid = u.user.id;

  let body;
  try {
    body = await req.json();
  } catch (_e) {
    return json({ ok: false, error: "Requête invalide." }, 400);
  }

  if (body.action === "connect") {
    const pnid = String(body.phone_number_id || "").trim();
    const token = String(body.token || "").trim();
    const secret = String(body.app_secret || "").trim();
    if (!PNID.test(pnid) || !ACCESS_TOKEN.test(token) || !APP_SECRET.test(secret)) {
      return json({ ok: false, error: "Identifiants invalides. Vérifiez-les dans Meta for Developers." });
    }
    // on vérifie auprès de Meta que le jeton donne bien accès à ce numéro
    let info;
    try {
      const r = await fetch(GRAPH + "/" + pnid + "?fields=display_phone_number,verified_name", {
        headers: { Authorization: "Bearer " + token },
      });
      info = await r.json();
      if (!r.ok || !info || info.error) {
        return json({ ok: false, error: graphError(info, "Meta a refusé la connexion. Vérifiez vos identifiants.") });
      }
    } catch (_e) {
      return json({ ok: false, error: "Connexion à Meta impossible. Réessayez." });
    }
    // on garde le même jeton de vérification si le compte existe déjà (pas de reconfiguration chez Meta)
    const { data: old } = await admin.from("whatsapp_accounts").select("verify_token").eq("user_id", uid).maybeSingle();
    const verifyToken = (old && old.verify_token) || randomHex(16);
    const { error } = await admin.from("whatsapp_accounts").upsert(
      {
        user_id: uid,
        phone_number_id: pnid,
        display_phone: info.display_phone_number || null,
        verified_name: info.verified_name || null,
        access_token: token,
        app_secret: secret,
        verify_token: verifyToken,
      },
      { onConflict: "user_id" },
    );
    if (error) return json({ ok: false, error: "Une erreur est survenue." });
    return json({
      ok: true,
      phone: info.display_phone_number || "",
      name: info.verified_name || "",
      verify_token: verifyToken,
    });
  }

  if (body.action === "disconnect") {
    await admin.from("whatsapp_accounts").delete().eq("user_id", uid);
    return json({ ok: true });
  }

  if (body.action === "send") {
    const { data: acc } = await admin
      .from("whatsapp_accounts")
      .select("phone_number_id,access_token")
      .eq("user_id", uid)
      .maybeSingle();
    if (!acc) return json({ ok: false, error: "WhatsApp n\u2019est pas connecté." });
    const waId = String(body.wa_id || "");
    const text = clean(body.text).trim();
    if (!WAID.test(waId)) return json({ ok: false, error: "Conversation inconnue." });
    if (!text) return json({ ok: false, error: "Message vide." });
    if (text.length > 4096) return json({ ok: false, error: "Message trop long." });

    // on ne répond qu'aux contacts qui ont écrit, et seulement dans les 24 h suivant leur dernier message
    const { data: last } = await admin
      .from("whatsapp_messages")
      .select("created_at")
      .eq("user_id", uid)
      .eq("wa_id", waId)
      .eq("direction", "in")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!last) return json({ ok: false, error: "Conversation inconnue." });
    if (Date.now() - Date.parse(last.created_at) > WINDOW_MS) {
      return json({
        ok: false,
        code: "window",
        error: "Délai de 24 h dépassé : WhatsApp n\u2019autorise plus de réponse libre. Attendez que le client vous réécrive.",
      });
    }

    let j;
    try {
      const r = await fetch(GRAPH + "/" + acc.phone_number_id + "/messages", {
        method: "POST",
        headers: { Authorization: "Bearer " + acc.access_token, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: waId,
          type: "text",
          text: { preview_url: false, body: text },
        }),
      });
      j = await r.json();
      if (!r.ok || !j || !j.messages || !j.messages[0]) {
        const detail = (j && j.error && j.error.message) || "erreur";
        return json({ ok: false, error: graphError(j, "Envoi impossible : " + detail) });
      }
    } catch (_e) {
      return json({ ok: false, error: "Envoi impossible : connexion à Meta." });
    }
    await admin.from("whatsapp_messages").upsert(
      {
        user_id: uid,
        wa_id: waId,
        wa_message_id: String(j.messages[0].id),
        direction: "out",
        text,
        status: "sent",
        is_read: true,
      },
      { onConflict: "user_id,wa_message_id", ignoreDuplicates: true },
    );
    return json({ ok: true });
  }

  return json({ ok: false, error: "Action inconnue." }, 400);
}

const handler = async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const url = new URL(req.url);
    const uid = url.searchParams.get("u");
    if (req.method === "GET") return uid ? await verify(url, uid) : json({ ok: false }, 405);
    if (req.method !== "POST") return json({ ok: false }, 405);
    return uid ? await webhook(req, uid) : await app(req);
  } catch (_e) {
    return json({ ok: false, error: "Une erreur est survenue." }, 500);
  }
};

Deno.serve(handler);
