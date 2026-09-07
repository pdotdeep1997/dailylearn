// Sends learning links to Telegram.
//  - Vercel Cron calls this daily (Bearer CRON_SECRET, auto-added by Vercel).
//  - You can also trigger it manually in a browser:  /api/send-daily?key=<CRON_SECRET>
//
// Query params:
//   key=<CRON_SECRET>   auth for manual/browser triggering (alt to the Bearer header)
//   date=YYYY-MM-DD      send a specific day (default: today, Asia/Singapore)
//   all=1                send every lesson in the current week (Mon–Sun)
//   dry=1                build the message(s) but don't send — returns a preview
//
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, SITE_URL, CRON_SECRET
const L = require("./_lib");

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  const q = url.searchParams;

  // --- auth: Vercel cron (Bearer) OR ?key= for manual triggering ---
  const secret = process.env.CRON_SECRET;
  const bearer = (req.headers["authorization"] || "") === `Bearer ${secret}`;
  const keyOk = secret && q.get("key") === secret;
  const isVercelCron = (req.headers["user-agent"] || "").includes("vercel-cron");
  if (secret && !bearer && !keyOk && !isVercelCron) {
    return res.status(401).json({ ok: false, error: "unauthorized (pass ?key=CRON_SECRET or Bearer)" });
  }

  const siteUrl = L.siteFrom(req);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  const dry = q.get("dry") === "1";
  const day = L.todaySG(q.get("date"));

  let schedule;
  try { schedule = await L.fetchSchedule(siteUrl); }
  catch (e) { return res.status(500).json({ ok: false, error: "cannot read schedule.json", detail: String(e) }); }

  // which days to send
  let days;
  if (q.get("all") === "1") {
    days = L.weekEntries(schedule, day).map(([d]) => d);
  } else {
    days = schedule[day] ? [day] : [];
  }
  if (!days.length) return res.status(200).json({ ok: true, sent: false, reason: `no lesson for ${day}` });

  const results = [];
  for (const d of days) {
    const entry = schedule[d];
    const text = L.dailyText(d, entry, siteUrl);
    const link = `${siteUrl}/${entry.slug}`;
    if (dry || !token || !chat) { results.push({ day: d, link, sent: false, preview: text }); continue; }
    const r = await L.tg(token, "sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: false });
    results.push({ day: d, link, sent: !!r.ok, telegram: r.ok ? undefined : r });
  }
  return res.status(200).json({ ok: true, dry, count: results.length, results });
};
