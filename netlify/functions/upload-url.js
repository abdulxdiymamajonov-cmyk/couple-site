// =========================================================
// Netlify Function — Supabase Storage'ga bir martalik upload URL beradi
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (faqat server tomonda!)
// =========================================================

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const BUCKET = "couple-media";

function safeExt(name, mime) {
  const raw = String(name || "").split(".").pop() || "";
  let ext = raw.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 6);
  if (!ext) {
    if (mime && mime.includes("webm")) ext = "webm";
    else if (mime && mime.includes("quicktime")) ext = "mov";
    else ext = "mp4";
  }
  return ext;
}

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
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("[upload-url] SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY yo'q");
    return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: "supabase env missing" }) };
  }

  let payload = {};
  try { payload = JSON.parse(event.body || "{}"); } catch (e) {}

  const ext = safeExt(payload.filename, payload.mime);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `videos/${Date.now()}-${rand}.${ext}`;

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !data) {
      console.error("[upload-url] createSignedUploadUrl error:", error && error.message);
      return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: (error && error.message) || "signed upload url failed" }) };
    }
    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({
        ok: true,
        path,
        token: data.token,
        signedUrl: data.signedUrl,
        bucket: BUCKET
      })
    };
  } catch (err) {
    console.error("[upload-url] exception:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ ok: false, error: String(err) }) };
  }
};
