// Vercel Serverless Function — posts today's learning link to Telegram.
// Triggered by the daily cron in vercel.json (and/or the GitHub Action).
//
// Required environment variables (set in Vercel → Project → Settings → Env):
//   TELEGRAM_BOT_TOKEN   your bot token from @BotFather
//   TELEGRAM_CHAT_ID     your chat/channel id
//   SITE_URL             public base url, e.g. https://learn.yourname.vercel.app
//   CRON_SECRET          any random string; Vercel Cron sends it as a Bearer token
//
// Manual test after deploy:
//   curl -H "Authorization: Bearer $CRON_SECRET" "$SITE_URL/api/send-daily?dry=1"

function todaySG(dateOverride) {
  if (dateOverride) return dateOverride;
  // Format "now" in Asia/Singapore as YYYY-MM-DD
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

module.exports = async (req, res) => {
  // Auth: Vercel Cron sends "Authorization: Bearer <CRON_SECRET>".
  const secret = process.env.CRON_SECRET;
  const auth = req.headers["authorization"] || "";
  const isVercelCron = (req.headers["user-agent"] || "").includes("vercel-cron");
  if (secret && auth !== `Bearer ${secret}` && !isVercelCron) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const siteUrl = (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;

  const url = new URL(req.url, "http://x");
  const dry = url.searchParams.get("dry") === "1";
  const day = todaySG(url.searchParams.get("date"));

  let schedule;
  try {
    const r = await fetch(`${siteUrl}/schedule.json`, { cache: "no-store" });
    schedule = await r.json();
  } catch (e) {
    return res.status(500).json({ ok: false, error: "cannot read schedule.json", detail: String(e) });
  }

  const entry = schedule[day];
  if (!entry) {
    return res.status(200).json({ ok: true, sent: false, reason: `no topic for ${day}` });
  }

  const link = `${siteUrl}/${entry.slug}`;
  const text =
    `\u{1F9E0} <b>Today's thing to learn</b>\n\n` +
    `<b>${esc(entry.title)}</b>\n` +
    `<i>${esc(entry.subtitle || "")}</i>\n\n` +
    `\u{1F4C2} ${esc(entry.category || "")}  ·  ${day}\n` +
    `\u{1F517} <a href="${esc(link)}">Read it →</a>`;

  if (dry || !token || !chat) {
    return res.status(200).json({ ok: true, sent: false, dry: true, day, link, preview: text });
  }

  try {
    const tg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: false }),
    });
    const data = await tg.json();
    if (!data.ok) return res.status(502).json({ ok: false, telegram: data });
    return res.status(200).json({ ok: true, sent: true, day, link });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
};
