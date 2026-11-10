// Postea : fonction Edge "telegram"
// - reçoit les messages envoyés au robot Telegram de chaque utilisateur (webhook)
// - connecte / déconnecte un robot, et envoie les réponses
// À déployer dans Supabase : Edge Functions > Deploy a new function > nom : telegram
// IMPORTANT : désactivez "Verify JWT" pour cette fonction (Telegram n'envoie pas de JWT).
// La fonction vérifie elle-même : le secret du webhook pour Telegram, et le jeton de l'utilisateur pour l'application.

import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

async function tg(token, method, payload) {
  try {
    const r = await fetch("https://api.telegram.org/bot" + token + "/" + method, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    return await r.json();
  } catch (_e) {
    return { ok: false, description: "network" };
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^\d{6,14}:[A-Za-z0-9_-]{30,60}$/;

// ---------- Telegram -> Postea ----------
async function webhook(req, uid) {
  if (!UUID.test(uid)) return json({ ok: false }, 400);
  const { data: bot } = await admin
    .from("telegram_bots")
    .select("webhook_secret")
    .eq("user_id", uid)
    .maybeSingle();
  if (!bot || !safeEqual(req.headers.get("x-telegram-bot-api-secret-token"), bot.webhook_secret)) {
    return json({ ok: false }, 401);
  }
  let update;
  try {
    update = await req.json();
  } catch (_e) {
    return json({ ok: true });
  }
  const m = update.message || update.edited_message || update.channel_post;
  if (!m || !m.chat) return json({ ok: true });

  const chat = m.chat;
  const title =
    chat.title ||
    [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
    chat.username ||
    "Telegram";
  const from = m.from
    ? [m.from.first_name, m.from.last_name].filter(Boolean).join(" ") || m.from.username || title
    : title;
  let text = m.text || m.caption || "";
  if (!text) {
    if (m.photo) text = "📷 Photo";
    else if (m.voice) text = "🎤 Message vocal";
    else if (m.video) text = "🎬 Vidéo";
    else if (m.document) text = "📎 Fichier";
    else if (m.sticker) text = "Sticker " + (m.sticker.emoji || "");
    else text = "[Message non pris en charge]";
  }
  const edited = !!update.edited_message;
  const { error: saveErr } = await admin.from("telegram_messages").upsert(
    {
      user_id: uid,
      chat_id: chat.id,
      chat_title: title,
      sender: from,
      text: String(text).slice(0, 4096),
      direction: "in",
      tg_message_id: m.message_id,
      created_at: new Date((m.date || Date.now() / 1000) * 1000).toISOString(),
    },
    { onConflict: "user_id,chat_id,tg_message_id,direction", ignoreDuplicates: !edited },
  );
  // Si l'enregistrement échoue, on renvoie 500 : Telegram réessaiera plus tard
  // au lieu de perdre le message.
  if (saveErr) return json({ ok: false }, 500);
  return json({ ok: true });
}

// ---------- Application -> Postea ----------
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
    const token = String(body.token || "").trim();
    if (!TOKEN.test(token)) {
      return json({ ok: false, error: "Jeton invalide. Copiez-le de nouveau depuis @BotFather." });
    }
    const me = await tg(token, "getMe");
    if (!me.ok || !me.result) {
      return json({ ok: false, error: "Jeton invalide. Copiez-le de nouveau depuis @BotFather." });
    }
    // ancien robot éventuel : on coupe son webhook
    const { data: old } = await admin.from("telegram_bots").select("bot_token").eq("user_id", uid).maybeSingle();
    if (old && old.bot_token && old.bot_token !== token) await tg(old.bot_token, "deleteWebhook");

    const secret = randomHex(32);
    const hook = await tg(token, "setWebhook", {
      url: SUPABASE_URL + "/functions/v1/telegram?u=" + uid,
      secret_token: secret,
      allowed_updates: ["message", "edited_message", "channel_post"],
    });
    if (!hook.ok) return json({ ok: false, error: "Telegram a refusé la connexion. Réessayez." });

    const { error } = await admin.from("telegram_bots").upsert(
      { user_id: uid, bot_token: token, bot_username: me.result.username || null, webhook_secret: secret },
      { onConflict: "user_id" },
    );
    if (error) {
      // le webhook est posé mais le robot n'est pas enregistré : on annule pour rester cohérent
      await tg(token, "deleteWebhook");
      return json({ ok: false, error: "Une erreur est survenue." });
    }
    return json({ ok: true, username: me.result.username || "" });
  }

  const { data: bot } = await admin.from("telegram_bots").select("bot_token").eq("user_id", uid).maybeSingle();

  if (body.action === "disconnect") {
    if (bot && bot.bot_token) await tg(bot.bot_token, "deleteWebhook");
    await admin.from("telegram_bots").delete().eq("user_id", uid);
    return json({ ok: true });
  }

  if (body.action === "send") {
    if (!bot) return json({ ok: false, error: "Telegram n'est pas connecté." });
    const chatId = Number(body.chat_id);
    const text = String(body.text || "").trim();
    if (!Number.isSafeInteger(chatId)) return json({ ok: false, error: "Conversation inconnue." });
    if (!text) return json({ ok: false, error: "Message vide." });
    if (text.length > 4096) return json({ ok: false, error: "Message trop long." });
    // on ne répond qu'aux conversations qui ont déjà écrit à ce robot
    const { data: last } = await admin
      .from("telegram_messages")
      .select("chat_title")
      .eq("user_id", uid)
      .eq("chat_id", chatId)
      .eq("direction", "in")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!last) return json({ ok: false, error: "Conversation inconnue." });
    const sent = await tg(bot.bot_token, "sendMessage", { chat_id: chatId, text });
    if (!sent.ok) return json({ ok: false, error: "Envoi impossible : " + (sent.description || "erreur") });
    await admin.from("telegram_messages").upsert(
      {
        user_id: uid,
        chat_id: chatId,
        chat_title: last.chat_title,
        sender: "Vous",
        text,
        direction: "out",
        tg_message_id: sent.result.message_id,
        is_read: true,
      },
      { onConflict: "user_id,chat_id,tg_message_id,direction", ignoreDuplicates: true },
    );
    return json({ ok: true });
  }

  return json({ ok: false, error: "Action inconnue." }, 400);
}

const handler = async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false }, 405);
  try {
    const uid = new URL(req.url).searchParams.get("u");
    return uid ? await webhook(req, uid) : await app(req);
  } catch (_e) {
    return json({ ok: false, error: "Une erreur est survenue." }, 500);
  }
};

Deno.serve(handler);
