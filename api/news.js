// Relay endpoint for the daily news brief.
// The scheduled Claude task generates the brief (fresh web search) and POSTs it
// here; this forwards it to Telegram so the bot token stays server-side.
//
//   POST /api/news?key=<CRON_SECRET>   body: {"text":"<HTML brief>"}
//   GET  /api/news?key=...&text=...&dry=1   → preview, don't send
//
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, CRON_SECRET
const L = require("./_lib");

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let d = ""; for await (const c of req) d += c;
  try { return JSON.parse(d || "{}"); } catch { return {}; }
}

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  const q = url.searchParams;
  // Auth: prefer a dedicated NEWS_KEY; fall back to CRON_SECRET if you'd rather reuse it.
  const secret = process.env.NEWS_KEY || process.env.CRON_SECRET;
  const bearer = (req.headers["authorization"] || "") === `Bearer ${secret}`;
  const keyOk = secret && q.get("key") === secret;
  if (secret && !bearer && !keyOk) {
    return res.status(401).json({ ok: false, error: "unauthorized (pass ?key=NEWS_KEY)" });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  const body = await readJson(req);
  const text = String(body.text || q.get("text") || "").trim();
  if (!text) return res.status(400).json({ ok: false, error: "no 'text' provided" });

  if (q.get("dry") === "1" || !token || !chat) {
    return res.status(200).json({ ok: true, sent: false, dry: true, chars: text.length, preview: text.slice(0, 600) });
  }
  const r = await L.tg(token, "sendMessage", {
    chat_id: chat, text: text.slice(0, 4096), parse_mode: "HTML", disable_web_page_preview: true,
  });
  if (!r.ok) return res.status(502).json({ ok: false, telegram: r });
  return res.status(200).json({ ok: true, sent: true });
};
