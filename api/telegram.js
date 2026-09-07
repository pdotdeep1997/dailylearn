// Telegram webhook. Register it once (see README):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SITE_URL>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
//
// Commands it answers (typed in your chat with the bot):
//   /week or /topics  → all 7 lessons of the current week, with links
//   /today            → today's lesson
//   /help or /start   → what the bot can do
//
// Env: TELEGRAM_BOT_TOKEN, SITE_URL, and (recommended) TELEGRAM_WEBHOOK_SECRET
const L = require("./_lib");

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let data = ""; for await (const c of req) data += c;
  try { return JSON.parse(data || "{}"); } catch { return {}; }
}

module.exports = async (req, res) => {
  // Health check / accidental browser visit
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, info: "Telegram webhook. POST only. Set it with setWebhook." });
  }
  // Verify Telegram's secret token (set at setWebhook time)
  const want = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (want && req.headers["x-telegram-bot-api-secret-token"] !== want) {
    return res.status(401).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const siteUrl = L.siteFrom(req);
  const update = await readJson(req);
  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return res.status(200).json({ ok: true });

  const chatId = msg.chat.id;
  // normalize "/week@YourBot arg" → "week"
  const cmd = msg.text.trim().split(/\s+/)[0].replace(/^\//, "").split("@")[0].toLowerCase();

  let text;
  try {
    const schedule = await L.fetchSchedule(siteUrl);
    const today = L.todaySG();
    if (cmd === "week" || cmd === "topics") {
      text = L.weekText(schedule, today, siteUrl);
    } else if (cmd === "today") {
      text = schedule[today]
        ? L.dailyText(today, schedule[today], siteUrl)
        : "No lesson scheduled for today yet — try /week to see what's coming.";
    } else {
      text = "\u{1F44B} <b>Learn Something New</b>\n\n" +
        "I send you one lesson a day at 08:30. Commands:\n\n" +
        "/week — all 7 topics this week\n" +
        "/today — today's lesson\n" +
        "/help — this message";
    }
  } catch (e) {
    text = "Couldn't reach the lesson schedule just now. Try again in a moment.";
  }

  if (token) {
    await L.tg(token, "sendMessage", {
      chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true,
    });
  }
  return res.status(200).json({ ok: true });
};
