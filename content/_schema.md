# Content spec schema

One JSON file per topic in `content/`, named `YYYY-MM-DD-slug.json`.

```jsonc
{
  "slug": "consistent-hashing",       // unique; becomes <slug>.html
  "date": "2026-09-07",               // YYYY-MM-DD; the day it gets sent
  "day_number": 1,                    // optional counter shown in the header
  "category": "Systems Design",       // drives the accent colour (see below)
  "read_minutes": 7,
  "title": "…",
  "subtitle": "…",                    // one engaging sentence
  "hook": "Markdown. The opening that makes them want to read on.",
  "sections": [ … ],                  // ordered; see section types below
  "takeaways": ["Markdown bullet", …],
  "go_deeper": [ {"label":"…","url":"…","note":"optional"} ]
}
```

## Section types (rendered in order)

- **prose** — `{ "type":"prose", "heading":"…", "body":"Markdown" }`
- **diagram** — `{ "type":"diagram", "mermaid":"flowchart LR…", "caption":"…" }`
  Use plain node labels (avoid `\n` inside labels; use `<br/>` if you must).
- **video** — `{ "type":"video", "youtube_id":"UF9Iqmg94tk", "caption":"…", "start":90 }`
  `start` (seconds) optional. Always confirm the ID resolves to a real video.
- **callout** — `{ "type":"callout", "style":"insight|warning|history|number", "label":"…", "body":"Markdown" }`
- **quote** — `{ "type":"quote", "body":"…", "attribution":"…" }`
- **steps** — `{ "type":"steps", "heading":"…", "items":["Markdown", …] }`

## Category → accent colour
Systems Design, Programming, Finance Theory, General Knowledge, News, Politics,
Science, Topic of Interest. Unknown categories fall back to blue. Edit
`CATEGORY_HUES` in `scripts/render.py` to add more.
