// Shared helpers for the API functions. Filename starts with "_" so Vercel
// does NOT expose it as its own route — it's imported by the others.

function todaySG(dateOverride) {
  if (dateOverride) return dateOverride;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  return `${g("year")}-${g("month")}-${g("day")}`;
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

// Monday–Sunday window (as YYYY-MM-DD strings) containing dayStr.
function weekDates(dayStr) {
  const d = new Date(dayStr + "T00:00:00Z");
  const offset = (d.getUTCDay() + 6) % 7; // days since Monday
  const mon = new Date(d); mon.setUTCDate(d.getUTCDate() - offset);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(mon); x.setUTCDate(mon.getUTCDate() + i);
    return x.toISOString().slice(0, 10);
  });
}

// The lessons that make up "this week": entries in the current Mon–Sun window,
// else the 7 nearest upcoming, else the 7 most recent.
function weekEntries(schedule, dayStr) {
  const win = weekDates(dayStr);
  let picks = win.filter((d) => schedule[d]).map((d) => [d, schedule[d]]);
  if (picks.length) return picks;
  const all = Object.keys(schedule).sort();
  const upcoming = all.filter((d) => d >= dayStr).slice(0, 7);
  const chosen = upcoming.length ? upcoming : all.slice(-7);
  return chosen.map((d) => [d, schedule[d]]);
}

function dailyText(day, entry, siteUrl) {
  const link = `${siteUrl}/${entry.slug}`;
  return (
    `\u{1F9E0} <b>Today's thing to learn</b>\n\n` +
    `<b>${esc(entry.title)}</b>\n` +
    `<i>${esc(entry.subtitle || "")}</i>\n\n` +
    `\u{1F4C2} ${esc(entry.category || "")}  ·  ${day}\n` +
    `\u{1F517} <a href="${esc(link)}">Read it →</a>`
  );
}

function weekText(schedule, dayStr, siteUrl) {
  const picks = weekEntries(schedule, dayStr);
  if (!picks.length) return "No lessons scheduled yet.";
  const dow = (d) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const lines = picks.map(([d, e]) =>
    `${d >= dayStr ? "" : "✅ "}<b>${dow(d)}</b> · ${esc(e.category || "")}\n` +
    `<a href="${esc(siteUrl + "/" + e.slug)}">${esc(e.title)}</a>`
  );
  return `\u{1F5D3} <b>This week — 7 things to learn</b>\n\n` + lines.join("\n\n") +
    `\n\n\u{1F4DA} <a href="${esc(siteUrl)}/index.html">Browse all lessons →</a>`;
}

async function tg(token, method, payload) {
  const r = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return r.json();
}

module.exports = { todaySG, esc, siteFrom, fetchSchedule, weekDates, weekEntries, dailyText, weekText, tg };
