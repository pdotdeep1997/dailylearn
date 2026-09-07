# Learn Something New — Vercel site + daily Telegram

A "learn one new thing a day" project. Each day's topic is a self-contained,
engaging page (embedded video, Mermaid diagram, callouts, takeaways) served at
its **own URL path** on Vercel — e.g. `https://you.vercel.app/consistent-hashing`.
Every morning at **8:30 AM (Asia/Singapore)** a Vercel Cron job pings a
serverless function that posts that day's link to your Telegram bot.

```
content/    one JSON spec per topic   (what you author each week)
public/     rendered site Vercel serves: <slug>.html, index.html, schedule.json
api/        send-daily.js  → the Telegram sender (Vercel Function)
scripts/    render.py  (JSON spec → public/*.html + index + schedule.json)
vercel.json cleanUrls + the daily cron
```

## How it works

```
 weekly (in Claude)           on git push            daily 08:30 SGT
┌───────────────────┐   ┌───────────────────┐   ┌──────────────────────────┐
│ author 7 JSON     │   │ Vercel serves     │   │ Vercel Cron → /api/send-  │
│ specs → render →  │──▶│ public/ ; each    │──▶│ daily reads schedule.json │
│ public/ ; commit  │   │ day = its own URL │   │ picks today, pings Telegram│
└───────────────────┘   └───────────────────┘   └──────────────────────────┘
```

Because pages are pre-rendered to static HTML and committed, **Vercel does no
build** — it just serves `public/` and runs the one function. `cleanUrls` makes
`public/consistent-hashing.html` live at `/consistent-hashing`.

## One-time setup

1. **Create a git repo** from this folder and push it to GitHub.
2. **Import it into Vercel** (vercel.com → Add New → Project → your repo).
   Framework preset: **Other**. Output/root: default (it serves `public/`).
3. **Add environment variables** in Vercel → Project → Settings → Environment
   Variables (see `.env.example`):
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`
   - `SITE_URL` — your deployed URL, e.g. `https://learn-you.vercel.app`
   - `CRON_SECRET` — any long random string (Vercel Cron sends it as a Bearer token)
4. **Deploy.** The cron in `vercel.json` (`30 0 * * *` = 08:30 SGT) is registered
   automatically. Test the send now:
   ```
   curl -H "Authorization: Bearer <CRON_SECRET>" "<SITE_URL>/api/send-daily?dry=1"
   curl -H "Authorization: Bearer <CRON_SECRET>" "<SITE_URL>/api/send-daily"   # real send
   ```

### About the 8:30 time
Vercel's **Hobby** plan runs cron jobs *within an hour* of the scheduled time,
not to the minute — so on Hobby the ping may land 08:30–09:30. If you need it
exactly at 08:30, upgrade the project to **Pro** (same `vercel.json`, no code
change). That's the only knob — one cron, one path.

## The weekly loop

1. In a Claude session (the **LearnNewThingsEveryday** project — see its saved
   authoring guide), ask Claude to author next week's 7 topics. It writes 7
   files into `content/` per `content/_schema.md`, spanning your mix (general
   knowledge, interests, news, politics, finance theory, systems design, programming).
2. Render + rebuild index and schedule:
   ```
   python3 scripts/render.py content/*.json --out public/     # needs: pip install markdown
   ```
3. Commit & push. Vercel redeploys; each new day is live at its own path and the
   cron sends it on its date.

## Local preview
`python3 -m http.server -d public 8000` → <http://localhost:8000/>.
(Note: local preview uses `.html` URLs; Vercel's `cleanUrls` serves them without.)

## Customising
- **Design / layout:** all CSS + HTML is in `scripts/render.py` (`render_page`).
- **Message wording:** `api/send-daily.js` (`text = …`).
- **Send time:** the `schedule` in `vercel.json` (UTC). Currently `30 0 * * *`
  = 08:30 Asia/Singapore.
