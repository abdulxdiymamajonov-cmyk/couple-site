// =========================================================
// Netlify Function — Telegramga xabar/rasm/video yuborish
// Environment variables (Netlify dashboard yoki .env):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CHAT_ID
// =========================================================

const Busboy = require("busboy");

const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TG_CHAT  = process.env.TELEGRAM_CHAT_ID || "";
const TG_API   = `https://api.telegram.org/bot${TG_TOKEN}`;

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

async function tgSendMessage(text) {
  if (!TG_TOKEN || !TG_CHAT) return { ok: false, error: "missing token/chat" };
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
    return await res.json();
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

async function tgSendMedia(kind, buffer, filename, caption, contentType) {
  if (!TG_TOKEN || !TG_CHAT) return { ok: false, error: "missing token/chat" };
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
    return await res.json();
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// -----------------------
// Multipart parsing (rasm/video uchun)
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

  const ct = (event.headers && (event.headers["content-type"] || event.headers["Content-Type"])) || "";

  // ---- Multipart (media) ----
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
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: !!result.ok, result }) };
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
      await tgSendMessage(`🔔 <b>Kimdir saytni ochdi</b>\n🕒 ${time}\n🧾 ${sid}`);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
    }

    if (payload.type === "answer") {
      const q = tgEscape(payload.question || "");
      const a = tgEscape(payload.answer || "");
      const text =
        `❓ <b>${q}</b>\n` +
        `💬 ${a}\n` +
        `🕒 ${time}\n🧾 ${sid}`;
      await tgSendMessage(text);
      return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
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
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
