// Sends a lesson (or the whole day) to Telegram, with a tap-to-answer quiz.
//  - GitHub Action calls this 3x/day with ?slot=0|1|2 (9am / 5pm / 8pm SGT).
//  - Manual/browser trigger:  /api/send-daily?key=<CRON_SECRET>&slot=0
//
// Query params:
//   key=<CRON_SECRET>   auth for manual triggering (Bearer header also accepted)
//   slot=0|1|2          which of the day's 3 lessons (default: inferred from time)
//   date=YYYY-MM-DD      which day (default: today, Asia/Singapore)
//   all=1                send all of the day's lessons
//   dry=1                preview only, don't send
const L = require("./_lib");

module.exports = async (req, res) => {
  const url = new URL(req.url, "http://x");
  const q = url.searchParams;

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

  const lessons = L.lessonsFor(schedule, day);
  if (!lessons.length) return res.status(200).json({ ok: true, sent: false, reason: `no lessons for ${day}` });

  // pick which lessons to send
  let picks;
  if (q.get("all") === "1") picks = lessons;
  else {
    const slot = q.get("slot") != null ? parseInt(q.get("slot"), 10) : L.slotNow();
    const one = lessons.find((e) => (e.slot || 0) === slot) || lessons[slot] || lessons[0];
    picks = one ? [one] : [];
  }

  const results = [];
  for (const entry of picks) {
    const text = L.dailyText(day, entry, siteUrl) + L.quizPrompt(entry);
    const kb = L.quizKeyboard(entry);
    const link = `${siteUrl}/${entry.slug}`;
    if (dry || !token || !chat) { results.push({ day, slot: entry.slot, link, sent: false, preview: text, buttons: kb ? kb.inline_keyboard.map((r) => r[0].text) : null }); continue; }
    const payload = { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: false };
    if (kb) payload.reply_markup = kb;
    const r = await L.tg(token, "sendMessage", payload);
    results.push({ day, slot: entry.slot, link, sent: !!r.ok, telegram: r.ok ? undefined : r });
  }
  return res.status(200).json({ ok: true, dry, count: results.length, results });
};
