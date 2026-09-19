// =========================================================
// Netlify Function — Telegramga xabar/rasm/video yuborish
// Environment variables (Netlify dashboard yoki .env):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CHAT_ID
//   SUPABASE_URL              (video uchun)
//   SUPABASE_SERVICE_ROLE_KEY (video uchun, faqat server tomonda!)
// =========================================================

const Busboy = require("busboy");
const { createClient } = require("@supabase/supabase-js");

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_CHAT  = process.env.TELEGRAM_CHAT_ID || "";
const TG_API   = `https://api.telegram.org/bot${TG_TOKEN}`;
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_BUCKET = "couple-media";

function tokenPreview() {
  if (!TG_TOKEN) return "(bo'sh)";
  return TG_TOKEN.slice(0, 4) + "..." + TG_TOKEN.slice(-3);
}

function tashkentTime() {
  try {
    return new Date().toLocaleString("uz-UZ", {
      timeZone: "Asia/Tashkent",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  } catch (e) {
    return new Date().toISOString();
  }
}

function tgEscape(str) {
  return String(str == null ? "" : str);
}

function logTgResult(action, result) {
  if (!result || result.ok !== true) {
    console.error(`[telegram] ${action} FAILED (token=${tokenPreview()}, chat=${TG_CHAT || "(bo'sh)"}):`,
      result && (result.description || result.error) || "no response");
  } else {
    console.log(`[telegram] ${action} ok`);
  }
}

async function tgSendMessage(text) {
  if (!TG_TOKEN || !TG_CHAT) {
    const r = { ok: false, description: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID env o'zgaruvchisi yo'q" };
    logTgResult("sendMessage", r);
    return r;
  }
  try {
    const res = await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
    const j = await res.json();
    logTgResult("sendMessage", j);
    return j;
  } catch (err) {
    const r = { ok: false, description: String(err) };
    logTgResult("sendMessage", r);
    return r;
  }
}

async function tgSendMedia(kind, buffer, filename, caption, contentType) {
  if (!TG_TOKEN || !TG_CHAT) {
    const r = { ok: false, description: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID env o'zgaruvchisi yo'q" };
    logTgResult("sendMedia", r);
    return r;
  }
  const method = kind === "photo" ? "sendPhoto" : "sendVideo";
  const field  = kind === "photo" ? "photo" : "video";

  const boundary = "----couple" + Math.random().toString(16).slice(2);
  const CRLF = "\r\n";
  const chunks = [];

  function pushText(name, value) {
    chunks.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}` +
      `${value}${CRLF}`
    ));
  }
  function pushFile(name, buf, fname, ctype) {
    chunks.push(Buffer.from(
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="${name}"; filename="${fname}"${CRLF}` +
      `Content-Type: ${ctype || "application/octet-stream"}${CRLF}${CRLF}`
    ));
    chunks.push(buf);
    chunks.push(Buffer.from(CRLF));
  }
  pushText("chat_id", TG_CHAT);
  if (caption) pushText("caption", caption);
  pushText("parse_mode", "HTML");
  pushFile(field, buffer, filename || (kind === "photo" ? "photo.jpg" : "video.mp4"), contentType || (kind === "photo" ? "image/jpeg" : "video/mp4"));
  chunks.push(Buffer.from(`--${boundary}--${CRLF}`));

  const body = Buffer.concat(chunks);
  try {
    const res = await fetch(`${TG_API}/${method}`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length
      },
      body
    });
    const j = await res.json();
    logTgResult(method, j);
    return j;
  } catch (err) {
    const r = { ok: false, description: String(err) };
    logTgResult(method, r);
    return r;
  }
}

async function tgSendVideoUrl(url, caption) {
  if (!TG_TOKEN || !TG_CHAT) {
    return { ok: false, description: "TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHAT_ID env o'zgaruvchisi yo'q" };
  }
  try {
    const res = await fetch(`${TG_API}/sendVideo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT,
        video: url,
        caption: caption || "",
        parse_mode: "HTML",
        supports_streaming: true
      })
    });
    const j = await res.json();
    logTgResult("sendVideo(url)", j);
    return j;
  } catch (err) {
    return { ok: false, description: String(err) };
  }
}

// -----------------------
// Multipart parsing (rasm uchun)
// -----------------------
function parseMultipart(event) {
  return new Promise((resolve, reject) => {
    const headers = event.headers || {};
    const ct = headers["content-type"] || headers["Content-Type"];
    if (!ct || !ct.includes("multipart/form-data")) {
      return resolve(null);
    }
    let bb;
    try {
      bb = Busboy({ headers: { "content-type": ct } });
    } catch (e) {
      return reject(e);
    }
    const fields = {};
    let fileBuf = null;
    let fileName = "";
    let fileType = "";
    bb.on("field", (name, val) => { fields[name] = val; });
    bb.on("file", (name, stream, info) => {
      fileName = info.filename || "";
      fileType = info.mimeType || info.mime || "";
      const parts = [];
      stream.on("data", (d) => parts.push(d));
      stream.on("end", () => { fileBuf = Buffer.concat(parts); });
    });
    bb.on("error", reject);
    bb.on("finish", () => resolve({ fields, fileBuf, fileName, fileType }));
    const body = event.isBase64Encoded
      ? Buffer.from(event.body, "base64")
      : Buffer.from(event.body || "", "utf8");
    bb.end(body);
  });
}

// -----------------------
// Handler
// -----------------------
exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: cors, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ ok: false, error: "method not allowed" }) };
  }

  // env sanity log
  if (!TG_TOKEN || !TG_CHAT) {
    console.error(`[send] Env yo'q: TELEGRAM_BOT_TOKEN=${TG_TOKEN ? "bor" : "YO'Q"}, TELEGRAM_CHAT_ID=${TG_CHAT ? "bor" : "YO'Q"}`);
  }

  const ct = (event.headers && (event.headers["content-type"] || event.headers["Content-Type"])) || "";

  // ---- Multipart (rasm) ----
  if (ct.includes("multipart/form-data")) {
    try {
      const parsed = await parseMultipart(event);
      if (!parsed || !parsed.fileBuf) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: "no file" }) };
      }
      const kind = parsed.fields.kind === "video" ? "video" : "photo";
      const question = tgEscape(parsed.fields.question || "");
      const sid = tgEscape(parsed.fields.sessionId || "");
      const caption = `📨 <b>Media (${kind})</b>\n❓ ${question}\n🕒 ${tashkentTime()}\n🧾 ${sid}`;
      const result = await tgSendMedia(kind, parsed.fileBuf, parsed.fileName, caption, parsed.fileType);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: !!result.ok, tg: result }) };
    } catch (err) {
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, error: String(err) }) };
    }
  }

  // ---- JSON ----
  let payload = {};
  try { payload = JSON.parse(event.body || "{}"); } catch (e) {}

  const sid = tgEscape(payload.sessionId || "");
  const time = tashkentTime();

  try {
    if (payload.type === "visit") {
      const r = await tgSendMessage(`🔔 <b>Kimdir saytni ochdi</b>\n🕒 ${time}\n🧾 ${sid}`);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: !!r.ok, tg: r }) };
    }

    if (payload.type === "answer") {
      const q = tgEscape(payload.question || "");
      const a = tgEscape(payload.answer || "");
      const text =
        `❓ <b>${q}</b>\n` +
        `💬 ${a}\n` +
        `🕒 ${time}\n🧾 ${sid}`;
      const r = await tgSendMessage(text);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: !!r.ok, tg: r }) };
    }

    if (payload.type === "video_from_storage") {
      // Frontend Supabase'ga yukladi, endi bizga path yubordi.
      // Signed download URL yaratamiz va Telegramga uzatamiz.
      const filePath = String(payload.path || "");
      const question = tgEscape(payload.question || "");
      if (!filePath) {
        return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: "no path" }) };
      }
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("[send] SUPABASE_URL/SERVICE_ROLE_KEY env yo'q");
        return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: "supabase env missing" }) };
      }
      const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
      const yearSeconds = 60 * 60 * 24 * 365;
      const signed = await supabase.storage.from(SUPABASE_BUCKET).createSignedUrl(filePath, yearSeconds);
      if (signed.error || !signed.data || !signed.data.signedUrl) {
        console.error("[send] signed url xato:", signed.error && signed.error.message);
        return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: "signed url failed" }) };
      }
      const url = signed.data.signedUrl;
      const caption = `📨 <b>Media (video)</b>\n❓ ${question}\n🕒 ${time}\n🧾 ${sid}`;

      let r = await tgSendVideoUrl(url, caption);
      if (!r || !r.ok) {
        // Fallback: matn shaklida link
        const fallback = `🎥 <b>Video</b>\n❓ ${question}\n🕒 ${time}\n🧾 ${sid}\n\n<a href="${url}">Videoni ochish</a>`;
        r = await tgSendMessage(fallback);
      }
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: !!r.ok, tg: r }) };
    }

    if (payload.type === "summary") {
      const arr = Array.isArray(payload.answers) ? payload.answers : [];
      let text = `🌸 <b>YAKUNIY XULOSA</b>\n🕒 ${time}\n🧾 ${sid}\n\n`;
      arr.forEach((it, i) => {
        const q = tgEscape(it.q || "");
        const a = tgEscape(it.a || "");
        text += `<b>${i + 1}.</b> ${q}\n   ↳ ${a}\n\n`;
      });
      // Telegram xabar limiti ~4096 belgi
      if (text.length > 4000) {
        const chunks = [];
        let cur = "";
        text.split("\n").forEach((line) => {
          if ((cur + "\n" + line).length > 3800) {
            chunks.push(cur);
            cur = line;
          } else {
            cur = cur ? cur + "\n" + line : line;
          }
        });
        if (cur) chunks.push(cur);
        for (const c of chunks) { await tgSendMessage(c); }
      } else {
        await tgSendMessage(text);
      }
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 400, headers: cors, body: JSON.stringify({ ok: false, error: "unknown type" }) };
  } catch (err) {
    console.error("[send] handler error:", err);
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
