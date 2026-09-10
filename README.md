# Learn Something New — Vercel site + daily Telegram

A "learn something new" project. **Three** self-contained, playful lessons a day
(embedded video, Mermaid diagram, callouts, a game-ified quiz), each served at its
**own URL path** on Vercel. A **GitHub Action** pings a serverless function at
**9:00 AM, 5:00 PM, and 8:00 PM (Asia/Singapore)** — one lesson per send — and the
Telegram message carries a **tap-to-answer quiz**. A `/week` bot command lists
everything.

Scheduling lives in GitHub Actions (not Vercel Cron) because Vercel's Hobby cron
only fires once a day and imprecisely; the Action does three exact times for free.

```
content/    one JSON spec per topic   (what you author each week)
public/     rendered site Vercel serves: <slug>.html, index.html, schedule.json
api/        send-daily.js  → the Telegram sender (Vercel Function)
scripts/    render.py  (JSON spec → public/*.html + index + schedule.json)
vercel.json cleanUrls + the daily cron
```

## How it works

```
 weekly (in Claude)           on git push          3x/day: 9am · 5pm · 8pm SGT
┌───────────────────┐   ┌───────────────────┐   ┌──────────────────────────┐
│ author lessons →  │   │ Vercel serves     │   │ GitHub Action → send-daily│
│ render → public/  │──▶│ public/ ; each    │──▶│ ?slot=N → that lesson +   │
│ ; commit + push   │   │ lesson = its URL  │   │ tap-quiz → Telegram       │
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
   - `CRON_SECRET` — any long random string (the sender's Bearer token)
   - `TELEGRAM_WEBHOOK_SECRET` — any long random string (protects the bot webhook)
4. **Deploy.**
5. **Set up the 3x/day scheduler (GitHub Actions).** In your repo → Settings →
   Secrets and variables → Actions, add `SITE_URL` and `CRON_SECRET` (same values).
   `.github/workflows/daily-lessons.yml` then fires at 01:00 / 09:00 / 12:00 UTC
   (= 9 AM / 5 PM / 8 PM SGT), sending slot 0 / 1 / 2. You can also run it by hand
   from the repo's **Actions** tab ("Run workflow"), choosing a slot.

## Triggering a send manually

The send endpoint is browser-friendly — just paste a URL (fill in your secret):

```
<SITE_URL>/api/send-daily?key=<CRON_SECRET>&slot=0        # send a specific slot (0=9am,1=5pm,2=8pm)
<SITE_URL>/api/send-daily?key=<CRON_SECRET>               # slot inferred from current time
<SITE_URL>/api/send-daily?key=<CRON_SECRET>&all=1         # send all 3 of today at once
<SITE_URL>/api/send-daily?key=<CRON_SECRET>&date=2026-09-08&slot=1&dry=1   # preview a specific one
```

Each message includes a **tap-to-answer quiz** (inline buttons); the webhook scores
the tap instantly. (The GitHub Action calls this same endpoint with a Bearer header.)

## Telegram commands (the `/week` bot)

`api/telegram.js` is a bot webhook. Register it **once** after deploying (paste in a
browser, filling in your token + the SITE_URL + the same webhook secret):

```
https://api.telegram.org/bot<TOKEN>/setWebhook?url=<SITE_URL>/api/telegram&secret_token=<TELEGRAM_WEBHOOK_SECRET>
```

Optional — make the commands show in Telegram's menu:

```
https://api.telegram.org/bot<TOKEN>/setMyCommands?commands=[{"command":"week","description":"This week's lessons"},{"command":"today","description":"Today's 3 lessons"},{"command":"help","description":"What I can do"}]
```

Then in your chat with the bot:
- **/week** (or /topics) → the week's lessons (3/day), with links
- **/today** → today's 3 lessons with their send times
- **/help** → the command list

To confirm the webhook registered: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo`.

### About the send times
GitHub Actions cron is in UTC and can drift a few minutes under load — fine for
9/5/8. To change the times, edit the three `cron:` lines in
`.github/workflows/daily-lessons.yml` (and the slot mapping if you add/remove one).

## The weekly loop

1. In a Claude session (the **LearnNewThingsEveryday** project — see the saved
   `curriculum.md` + authoring guide), ask Claude to author the next batch of
   lessons (3/day). Each JSON spec carries a `slot` (0/1/2), a `tg_quiz`, and an
   on-page `quiz` (mark one question `"boss": true`).
2. Render + rebuild index and schedule:
   ```
   python3 scripts/render.py content/*.json --out public/     # needs: pip install markdown
   ```
3. Commit & push. Vercel redeploys; each lesson is live at its own path and the
   Action sends the right slot at 9 AM / 5 PM / 8 PM.

## Local preview
`python3 -m http.server -d public 8000` → <http://localhost:8000/>.
(Note: local preview uses `.html` URLs; Vercel's `cleanUrls` serves them without.)

## Customising
- **Design / layout:** all CSS + HTML is in `scripts/render.py` (`render_page`).
- **Message wording:** `api/_lib.js` (`dailyText`, `weekText`).
- **Quiz game feel:** `scripts/render.py` (`r_quiz`) — combo/XP/boss logic + CSS.
- **Send times:** the `cron:` lines in `.github/workflows/daily-lessons.yml` (UTC).
