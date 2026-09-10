// Telegram webhook. Register once (see README):
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SITE_URL>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
//
// Handles:
//   /week /topics  → the week's lessons (3/day)
//   /today         → today's 3 lessons
//   /help /start   → command list
//   quiz button taps (callback_query) from the daily message → instant right/wrong
//
// Env: TELEGRAM_BOT_TOKEN, SITE_URL, (recommended) TELEGRAM_WEBHOOK_SECRET
const L = require("./_lib");

async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  let data = ""; for await (const c of req) data += c;
  try { return JSON.parse(data || "{}"); } catch { return {}; }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, info: "Telegram webhook. POST only." });
  }
  const want = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (want && req.headers["x-telegram-bot-api-secret-token"] !== want) {
    return res.status(401).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const siteUrl = L.siteFrom(req);
  const update = await readJson(req);

  // --- quiz button tap ---
  if (update.callback_query) {
    const cq = update.callback_query;
    const [tag, slug, idxRaw] = String(cq.data || "").split("|");
    let alert = "Hmm, couldn't score that one.";
    try {
      if (tag === "Q") {
        const schedule = await L.fetchSchedule(siteUrl);
        const entry = L.slugMap(schedule)[slug];
        const quiz = entry && entry.tg_quiz;
        if (quiz) {
          const ok = parseInt(idxRaw, 10) === quiz.answer;
          const react = ok ? (quiz.correct || "Correct!") : (quiz.wrong || "Not quite.");
          alert = `${ok ? "✅" : "❌"} ${react}${quiz.explain ? "\n\n" + quiz.explain : ""}`;
        }
      }
    } catch (e) { /* fall through with default alert */ }
    if (token) {
      await L.tg(token, "answerCallbackQuery", { callback_query_id: cq.id, text: alert.slice(0, 195), show_alert: true });
      // remove the buttons so it can't be re-answered
      if (cq.message) await L.tg(token, "editMessageReplyMarkup", { chat_id: cq.message.chat.id, message_id: cq.message.message_id, reply_markup: { inline_keyboard: [] } });
    }
    return res.status(200).json({ ok: true });
  }

  // --- text commands ---
  const msg = update.message || update.edited_message;
  if (!msg || !msg.text) return res.status(200).json({ ok: true });
  const chatId = msg.chat.id;
  const cmd = msg.text.trim().split(/\s+/)[0].replace(/^\//, "").split("@")[0].toLowerCase();

  let text;
  try {
    const schedule = await L.fetchSchedule(siteUrl);
    const today = L.todaySG();
    if (cmd === "week" || cmd === "topics") {
      text = L.weekText(schedule, today, siteUrl);
    } else if (cmd === "today") {
      const ls = L.lessonsFor(schedule, today);
      text = ls.length ? L.dayText(today, ls, siteUrl, "\u{1F4C5} <b>Today — your 3 lessons</b>")
                       : "Nothing scheduled for today yet — try /week.";
    } else {
      text = "\u{1F44B} <b>Learn Something New</b>\n\n" +
        "Three quick lessons a day at 9am, 5pm & 8pm — with a tap-to-answer quiz.\n\n" +
        "/today — today's 3 lessons\n/week — the whole week\n/help — this message";
    }
  } catch (e) {
    text = "Couldn't reach the schedule just now — try again in a moment.";
  }
  if (token) await L.tg(token, "sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true });
  return res.status(200).json({ ok: true });
};
