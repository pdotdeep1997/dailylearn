// Shared helpers. Filename starts with "_" so Vercel doesn't route it.
// Schedule shape: { "YYYY-MM-DD": [ {slug,title,category,subtitle,slot,tg_quiz}, ... ] }

const SLOT_TIME = { 0: "9:00 AM", 1: "5:00 PM", 2: "8:00 PM" };

function todaySG(dateOverride) {
  if (dateOverride) return dateOverride;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
}

// Current hour in Asia/Singapore → best slot (0 before 5pm, 1 before 8pm, else 2)
function slotNow() {
  const h = parseInt(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Singapore", hour: "2-digit", hour12: false }).format(new Date()), 10);
  return h < 17 ? 0 : h < 20 ? 1 : 2;
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function siteFrom(req) {
  return (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, "");
}
async function fetchSchedule(siteUrl) {
  const r = await fetch(`${siteUrl}/schedule.json`, { cache: "no-store" });
  if (!r.ok) throw new Error(`schedule.json ${r.status}`);
  return r.json();
}
// normalize an entry: old shape was a single object; new shape is an array
function lessonsFor(schedule, day) {
  const v = schedule[day];
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}
function slugMap(schedule) {
  const m = {};
  for (const day of Object.keys(schedule)) for (const e of lessonsFor(schedule, day)) m[e.slug] = e;
  return m;
}

function weekDates(dayStr) {
  const d = new Date(dayStr + "T00:00:00Z");
  const offset = (d.getUTCDay() + 6) % 7;
  const mon = new Date(d); mon.setUTCDate(d.getUTCDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon); x.setUTCDate(mon.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}
// days (with lessons) for the current Mon–Sun window, else nearest upcoming/recent
function weekDaysWithLessons(schedule, dayStr) {
  const win = weekDates(dayStr).filter((d) => lessonsFor(schedule, d).length);
  if (win.length) return win;
  const all = Object.keys(schedule).sort();
  const up = all.filter((d) => d >= dayStr).slice(0, 7);
  return up.length ? up : all.slice(-7);
}

function dailyText(day, entry, siteUrl) {
  const link = `${siteUrl}/${entry.slug}`;
  return (
    `\u{1F9E0} <b>Time to learn something</b>\n\n` +
    `<b>${esc(entry.title)}</b>\n` +
    `<i>${esc(entry.subtitle || "")}</i>\n\n` +
    `\u{1F4C2} ${esc(entry.category || "")}  ·  ${day}\n` +
    `\u{1F517} <a href="${esc(link)}">Read it →</a>`
  );
}

// Inline keyboard for the answer-in-Telegram quiz (one quick question per lesson)
function quizKeyboard(entry) {
  const q = entry.tg_quiz;
  if (!q || !Array.isArray(q.options)) return null;
  return { inline_keyboard: q.options.map((o, i) => [{ text: o, callback_data: `Q|${entry.slug}|${i}` }]) };
}
function quizPrompt(entry) {
  const q = entry.tg_quiz;
  return q && q.q ? `\n\n\u{2753} <b>Quick one:</b> ${esc(q.q)}` : "";
}

function dow(d) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
}

function dayText(day, lessons, siteUrl, heading) {
  if (!lessons.length) return "Nothing scheduled.";
  const lines = lessons.map((e) =>
    `\u{1F551} <b>${SLOT_TIME[e.slot] || ""}</b> · ${esc(e.category || "")}\n` +
    `<a href="${esc(siteUrl + "/" + e.slug)}">${esc(e.title)}</a>`);
  return `${heading}\n\n` + lines.join("\n\n");
}

function weekText(schedule, dayStr, siteUrl) {
  const days = weekDaysWithLessons(schedule, dayStr);
  if (!days.length) return "No lessons scheduled yet.";
  const blocks = days.map((d) => {
    const ls = lessonsFor(schedule, d).map((e) =>
      `  · <a href="${esc(siteUrl + "/" + e.slug)}">${esc(e.title)}</a>`).join("\n");
    return `<b>${dow(d)} ${d}</b>\n${ls}`;
  });
  return `\u{1F5D3} <b>This week</b> — 3 lessons a day\n\n` + blocks.join("\n\n") +
    `\n\n\u{1F4DA} <a href="${esc(siteUrl)}/index.html">Browse everything →</a>`;
}

async function tg(token, method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload),
  });
  return r.json();
}

module.exports = {
  SLOT_TIME, todaySG, slotNow, esc, siteFrom, fetchSchedule, lessonsFor, slugMap,
  weekDates, weekDaysWithLessons, dailyText, quizKeyboard, quizPrompt, dow, dayText, weekText, tg,
};
