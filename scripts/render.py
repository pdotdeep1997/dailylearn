#!/usr/bin/env python3
"""
render.py — turn a daily-learning content spec (JSON) into a finished, engaging HTML page.

Usage:
    python3 render.py content/2026-09-07-consistent-hashing.json --out site/
    python3 render.py content/*.json --out site/        # batch render + rebuild index

A spec is a JSON object. See content/_schema.md for the full shape. The renderer
supports these section types: prose, diagram (mermaid), video (youtube), callout,
quote, and steps. Body text is Markdown.
"""
import argparse, json, sys, html, datetime, pathlib, re
import markdown as md

MD = md.Markdown(extensions=["extra", "sane_lists", "smarty"])

def mdconv(text: str) -> str:
    MD.reset()
    return MD.convert(text.strip()) if text else ""

# ---------- section renderers ----------

def r_prose(s):
    h = f'<h2 id="{slug(s.get("heading",""))}">{html.escape(s["heading"])}</h2>' if s.get("heading") else ""
    return f'<section class="prose">{h}{mdconv(s.get("body",""))}</section>'

def r_diagram(s):
    cap = f'<figcaption>{mdconv(s["caption"])}</figcaption>' if s.get("caption") else ""
    # Authors write in-label line breaks as \n; Mermaid wants <br/>. Statement
    # separators are real newlines and are left untouched. html.escape keeps the
    # <br/> as text so Mermaid (reading textContent) turns it into a line break.
    code = s.get("mermaid", "").strip().replace("\\n", "<br/>")
    return (f'<figure class="diagram"><div class="mermaid">{html.escape(code)}</div>{cap}</figure>')

def r_video(s):
    yid = s.get("youtube_id", "")
    cap = f'<figcaption>{mdconv(s["caption"])}</figcaption>' if s.get("caption") else ""
    # start param optional
    start = f'?start={int(s["start"])}' if s.get("start") else ""
    return (f'<figure class="video"><div class="video-frame">'
            f'<iframe src="https://www.youtube-nocookie.com/embed/{html.escape(yid)}{start}" '
            f'title="Video" loading="lazy" frameborder="0" '
            f'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
            f'allowfullscreen></iframe></div>{cap}</figure>')

def r_callout(s):
    style = s.get("style", "insight")  # insight | warning | history | number
    icon = {"insight":"&#128161;","warning":"&#9888;&#65039;","history":"&#128220;",
            "number":"&#128202;","quote":"&#10077;"}.get(style, "&#128161;")
    label = s.get("label", style.capitalize())
    return (f'<aside class="callout callout--{html.escape(style)}">'
            f'<div class="callout__icon">{icon}</div>'
            f'<div class="callout__body"><span class="callout__label">{html.escape(label)}</span>'
            f'{mdconv(s.get("body",""))}</div></aside>')

def r_quote(s):
    who = f'<cite>&mdash; {html.escape(s["attribution"])}</cite>' if s.get("attribution") else ""
    return f'<blockquote class="pullquote">{mdconv(s.get("body",""))}{who}</blockquote>'

def r_steps(s):
    items = "".join(f'<li><span class="step-n">{i+1}</span><div>{mdconv(st)}</div></li>'
                    for i, st in enumerate(s.get("items", [])))
    h = f'<h2 id="{slug(s.get("heading",""))}">{html.escape(s["heading"])}</h2>' if s.get("heading") else ""
    return f'{h}<ol class="steps">{items}</ol>'

RENDERERS = {"prose": r_prose, "diagram": r_diagram, "video": r_video,
             "callout": r_callout, "quote": r_quote, "steps": r_steps}

def slug(t):
    return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-") or "s"

# ---------- page shell ----------

CATEGORY_HUES = {
    # Curriculum tracks
    "Software & Systems": 205, "Money & Markets": 150,
    "History & Civilization": 28, "Ideas & Minds": 265,
    # Legacy / misc categories
    "Systems Design": 205, "Programming": 265, "Finance Theory": 150,
    "General Knowledge": 25, "News": 0, "Politics": 340, "Science": 180,
    "Topic of Interest": 45,
}

def r_quiz(quiz):
    """Interactive end-of-lesson quiz. Pure inline JS, no storage."""
    if not quiz:
        return ""
    qs = ""
    for i, q in enumerate(quiz):
        opts = "".join(
            f'<button class="opt" data-correct="{"1" if j==q.get("answer") else "0"}" '
            f'onclick="answer(this,{i})">{html.escape(o)}</button>'
            for j, o in enumerate(q.get("options", [])))
        qs += (f'<div class="q" data-i="{i}">'
               f'<p class="q-text"><span class="q-n">Q{i+1}</span>{mdconv(q.get("q",""))}</p>'
               f'<div class="opts">{opts}</div>'
               f'<div class="explain" hidden>{mdconv(q.get("explain",""))}</div>'
               f'</div>')
    n = len(quiz)
    return (f'<section class="quiz"><h2>Check yourself</h2>'
            f'<p class="quiz-sub">No pressure — tap an answer to see if you\'ve got it.</p>'
            f'{qs}<div class="score" id="score" hidden></div>'
            f'<script>(function(){{var total={n},done=0,right=0;'
            f'window.answer=function(btn,qi){{var q=btn.closest(".q");'
            f'if(q.dataset.done)return;q.dataset.done="1";done++;'
            f'var ok=btn.dataset.correct==="1";if(ok)right++;'
            f'q.querySelectorAll(".opt").forEach(function(b){{b.classList.add("locked");'
            f'if(b.dataset.correct==="1")b.classList.add("correct");}});'
            f'if(!ok)btn.classList.add("wrong");'
            f'var ex=q.querySelector(".explain");if(ex)ex.hidden=false;'
            f'if(done===total){{var s=document.getElementById("score");'
            f's.hidden=false;s.textContent="You got "+right+" / "+total+"."+'
            f'(right===total?" \\u{{1F3AF}} Nailed it.":right>=total/2?" \\u{{1F44D}} Solid.":" \\u{{1F4DA}} Worth a re-read.");}}'
            f'}};}})();</script></section>')

def render_page(spec: dict) -> str:
    hue = CATEGORY_HUES.get(spec.get("track") or spec.get("category", ""), 210)
    body = "".join(RENDERERS[s["type"]](s) for s in spec.get("sections", []))

    takeaways = ""
    if spec.get("takeaways"):
        lis = "".join(f"<li>{mdconv(t)}</li>" for t in spec["takeaways"])
        takeaways = f'<section class="takeaways"><h2>The gist</h2><ul>{lis}</ul></section>'

    deeper = ""
    if spec.get("go_deeper"):
        lis = "".join(
            f'<li><a href="{html.escape(l["url"])}" target="_blank" rel="noopener">'
            f'{html.escape(l["label"])}<span class="arr">&#8599;</span></a>'
            f'{("<p>"+html.escape(l["note"])+"</p>") if l.get("note") else ""}</li>'
            for l in spec["go_deeper"])
        deeper = f'<section class="deeper"><h2>Go deeper</h2><ul>{lis}</ul></section>'

    quiz_html = r_quiz(spec.get("quiz"))

    # "Builds on" chips linking prior lessons in the same track
    builds = ""
    if spec.get("builds_on"):
        chips = "".join(
            f'<a class="prereq" href="./{html.escape(b["slug"])}">&#8617; {html.escape(b["label"])}</a>'
            for b in spec["builds_on"])
        builds = f'<div class="builds"><span class="builds-label">Builds on</span>{chips}</div>'

    # Track / lesson context line
    track = spec.get("track", spec.get("category", ""))
    track_line = ""
    if spec.get("track"):
        ln = f' &middot; Lesson {spec["track_lesson"]}' if spec.get("track_lesson") else ""
        track_line = f'<span class="tracktag">{html.escape(track)}{ln}</span>'

    has_mermaid = any(s["type"] == "diagram" for s in spec.get("sections", []))
    mermaid_js = ("""
<script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.9.1/mermaid.min.js"></script>
<script>
  const dark = matchMedia('(prefers-color-scheme: dark)').matches;
  mermaid.initialize({startOnLoad:true, theme: dark ? 'dark':'neutral',
    themeVariables:{fontFamily:'ui-sans-serif, system-ui, sans-serif', fontSize:'15px'},
    flowchart:{curve:'basis', padding:14}});
</script>""" if has_mermaid else "")

    date_str = spec.get("date", "")
    try:
        pretty_date = datetime.date.fromisoformat(date_str).strftime("%A, %B %-d, %Y")
    except Exception:
        pretty_date = date_str
    daynum = f'Day {spec["day_number"]}' if spec.get("day_number") else "Daily brief"

    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(spec.get("title",""))}</title>
<meta name="description" content="{html.escape(spec.get("subtitle",""))}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{{
  --hue:{hue};
  --accent:hsl(var(--hue) 72% 45%);
  --accent-soft:hsl(var(--hue) 72% 45% / .10);
  --bg:#fbfaf8; --card:#ffffff; --ink:#1c1b1a; --muted:#6b6a67;
  --line:hsl(var(--hue) 20% 88%); --hair:#eceae6;
  --serif:'Fraunces', Georgia, serif; --sans:'Inter', system-ui, sans-serif;
}}
@media (prefers-color-scheme: dark){{
  :root{{ --bg:#141414; --card:#1c1c1d; --ink:#eceae6; --muted:#9d9c98;
    --accent:hsl(var(--hue) 70% 66%); --accent-soft:hsl(var(--hue) 70% 66% / .13);
    --line:hsl(var(--hue) 15% 26%); --hair:#2a2a2b; }}
}}
*{{box-sizing:border-box}}
html{{scroll-behavior:smooth}}
body{{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
  font-size:18px;line-height:1.7;-webkit-font-smoothing:antialiased}}
.progress{{position:fixed;top:0;left:0;height:3px;width:0;background:var(--accent);z-index:50;transition:width .1s linear}}
.wrap{{max-width:720px;margin:0 auto;padding:0 22px}}
header.top{{padding:34px 0 10px}}
.kicker{{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-family:var(--sans);
  font-size:13px;letter-spacing:.02em;color:var(--muted)}}
.pill{{display:inline-block;padding:4px 12px;border-radius:999px;background:var(--accent-soft);
  color:var(--accent);font-weight:600;letter-spacing:.03em;text-transform:uppercase;font-size:12px}}
h1{{font-family:var(--serif);font-weight:600;font-size:clamp(30px,5.5vw,44px);line-height:1.12;
  margin:.5em 0 .2em;letter-spacing:-.01em}}
.subtitle{{font-family:var(--serif);font-size:clamp(18px,2.6vw,22px);color:var(--muted);
  font-weight:400;line-height:1.4;margin:0 0 18px}}
.hook{{font-size:20px;line-height:1.6;border-left:3px solid var(--accent);padding:2px 0 2px 20px;
  margin:26px 0 8px;color:var(--ink)}}
.hook p{{margin:.4em 0}}
hr.rule{{border:0;border-top:1px solid var(--hair);margin:34px 0}}
section.prose h2, .takeaways h2, .deeper h2, .steps + *, h2{{font-family:var(--serif);font-weight:600;
  font-size:26px;letter-spacing:-.01em;margin:1.8em 0 .5em}}
.prose p, .callout__body p{{margin:.9em 0}}
.prose a, .deeper a{{color:var(--accent);text-decoration:none;border-bottom:1px solid var(--accent-soft)}}
.prose a:hover{{border-bottom-color:var(--accent)}}
.prose code, code{{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em;
  background:var(--accent-soft);padding:2px 6px;border-radius:6px}}
.prose pre{{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px;
  overflow:auto;font-size:15px;line-height:1.5}}
.prose pre code{{background:none;padding:0}}
.prose ul,.prose ol{{padding-left:1.3em}}
.prose li{{margin:.35em 0}}
.prose strong{{font-weight:600}}
figure{{margin:30px 0}}
figcaption{{font-size:14.5px;color:var(--muted);margin-top:10px;text-align:center;line-height:1.5}}
.video-frame{{position:relative;padding-top:56.25%;border-radius:14px;overflow:hidden;
  box-shadow:0 4px 24px rgba(0,0,0,.10);background:#000}}
.video-frame iframe{{position:absolute;inset:0;width:100%;height:100%;border:0}}
.diagram{{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px 18px}}
.diagram .mermaid{{display:flex;justify-content:center}}
.callout{{display:flex;gap:14px;background:var(--card);border:1px solid var(--line);
  border-left:3px solid var(--accent);border-radius:12px;padding:18px 20px;margin:26px 0}}
.callout__icon{{font-size:22px;line-height:1.4;flex:none}}
.callout__label{{display:block;font-family:var(--sans);font-size:12px;font-weight:600;
  text-transform:uppercase;letter-spacing:.05em;color:var(--accent);margin-bottom:3px}}
.callout__body p{{margin:.35em 0}}
.pullquote{{font-family:var(--serif);font-size:24px;line-height:1.4;color:var(--ink);
  border:0;margin:32px 0;padding:0 0 0 4px}}
.pullquote cite{{display:block;font-family:var(--sans);font-size:15px;color:var(--muted);
  font-style:normal;margin-top:10px}}
ol.steps{{list-style:none;counter-reset:s;padding:0;margin:24px 0}}
ol.steps li{{display:flex;gap:16px;padding:14px 0;border-top:1px solid var(--hair)}}
ol.steps li:first-child{{border-top:0}}
.step-n{{flex:none;width:30px;height:30px;border-radius:50%;background:var(--accent-soft);
  color:var(--accent);font-weight:600;display:flex;align-items:center;justify-content:center;font-size:15px}}
.takeaways{{background:var(--accent-soft);border-radius:16px;padding:6px 26px 22px;margin:40px 0 10px}}
.takeaways ul{{list-style:none;padding:0;margin:0}}
.takeaways li{{padding:10px 0 10px 30px;position:relative;border-top:1px solid var(--line)}}
.takeaways li:first-child{{border-top:0}}
.takeaways li::before{{content:"\\2713";position:absolute;left:0;color:var(--accent);font-weight:700}}
.deeper ul{{list-style:none;padding:0;margin:0}}
.deeper li{{padding:14px 0;border-top:1px solid var(--hair)}}
.deeper a{{font-weight:600;font-size:17px;display:inline-flex;align-items:center;gap:6px;border:0}}
.deeper .arr{{color:var(--muted);font-size:14px}}
.deeper p{{margin:4px 0 0;font-size:15px;color:var(--muted)}}
footer.foot{{border-top:1px solid var(--hair);margin-top:48px;padding:26px 0 60px;
  font-size:14px;color:var(--muted);display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}}
footer.foot a{{color:var(--accent);text-decoration:none}}
.reading-time::before{{content:"\\23F1  "}}
.tracktag{{color:var(--accent);font-weight:600}}
.builds{{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:14px}}
.builds-label{{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}}
.prereq{{font-size:13.5px;text-decoration:none;color:var(--accent);background:var(--accent-soft);
  padding:4px 11px;border-radius:999px;border:1px solid transparent;transition:border-color .15s}}
.prereq:hover{{border-color:var(--accent)}}
.quiz{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:8px 26px 26px;margin:40px 0 10px}}
.quiz-sub{{color:var(--muted);font-size:15px;margin:-2px 0 18px}}
.q{{margin:20px 0;padding-top:18px;border-top:1px solid var(--hair)}}
.q:first-of-type{{border-top:0}}
.q-text{{font-weight:500;margin:0 0 12px;display:flex;gap:10px;align-items:baseline}}
.q-text p{{margin:0;display:inline}}
.q-n{{flex:none;font-family:var(--sans);font-size:12px;font-weight:700;color:var(--accent);
  background:var(--accent-soft);padding:3px 8px;border-radius:6px}}
.opts{{display:flex;flex-direction:column;gap:8px}}
.opt{{text-align:left;font:inherit;font-size:16px;color:var(--ink);background:var(--bg);
  border:1px solid var(--line);border-radius:10px;padding:11px 15px;cursor:pointer;transition:all .12s}}
.opt:hover:not(.locked){{border-color:var(--accent);transform:translateX(2px)}}
.opt.locked{{cursor:default}}
.opt.correct{{border-color:#1e9e5a;background:hsl(145 60% 45% / .13);font-weight:600}}
.opt.correct::after{{content:"  \\2713";color:#1e9e5a;font-weight:700}}
.opt.wrong{{border-color:#d0463b;background:hsl(6 70% 50% / .12)}}
.opt.wrong::after{{content:"  \\2717";color:#d0463b;font-weight:700}}
.explain{{margin-top:10px;font-size:15px;color:var(--muted);background:var(--accent-soft);
  border-radius:10px;padding:11px 15px;line-height:1.55}}
.explain p{{margin:0}}
.score{{margin-top:22px;padding-top:16px;border-top:2px solid var(--accent);
  font-family:var(--serif);font-size:20px;font-weight:600}}
</style>
</head>
<body>
<div class="progress" id="progress"></div>
<div class="wrap">
  <header class="top">
    <div class="kicker">
      <span class="pill">{html.escape(track)}</span>
      {track_line}
      <span>{html.escape(pretty_date)}</span><span>&middot;</span>
      <span class="reading-time">{spec.get("read_minutes","6")} min read</span>
    </div>
    <h1>{html.escape(spec.get("title",""))}</h1>
    <p class="subtitle">{html.escape(spec.get("subtitle",""))}</p>
    {builds}
  </header>
  <div class="hook">{mdconv(spec.get("hook",""))}</div>
  <hr class="rule">
  <main>
    {body}
    {takeaways}
    {quiz_html}
    {deeper}
  </main>
  <footer class="foot">
    <span>Learn something new &middot; every day</span>
    <a href="./index.html">&#8592; All topics</a>
  </footer>
</div>
<script>
const p=document.getElementById('progress');
addEventListener('scroll',()=>{{const h=document.documentElement;
  const s=h.scrollTop/(h.scrollHeight-h.clientHeight);p.style.width=(s*100)+'%';}},{{passive:true}});
</script>
{mermaid_js}
</body>
</html>"""

# ---------- index / archive ----------

def render_index(specs):
    cards = ""
    for s in sorted(specs, key=lambda x: x.get("date",""), reverse=True):
        cat = s.get("track") or s.get("category","Learn")
        hue = CATEGORY_HUES.get(cat,210)
        cards += (f'<a class="card" href="./{s["slug"]}.html" style="--hue:{hue}">'
                  f'<span class="c-pill">{html.escape(cat)}</span>'
                  f'<h3>{html.escape(s.get("title",""))}</h3>'
                  f'<p>{html.escape(s.get("subtitle",""))}</p>'
                  f'<span class="c-date">{html.escape(s.get("date",""))} &middot; {s.get("read_minutes","6")} min</span>'
                  f'</a>')
    return f"""<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Learn Something New &middot; Archive</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{{--bg:#fbfaf8;--card:#fff;--ink:#1c1b1a;--muted:#6b6a67;--hair:#eceae6}}
@media(prefers-color-scheme:dark){{:root{{--bg:#141414;--card:#1c1c1d;--ink:#eceae6;--muted:#9d9c98;--hair:#2a2a2b}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font-family:'Inter',system-ui,sans-serif}}
.wrap{{max-width:860px;margin:0 auto;padding:48px 22px 80px}}
h1{{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(30px,6vw,46px);margin:0 0 6px}}
.lede{{color:var(--muted);font-size:18px;margin:0 0 36px}}
.grid{{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}}
.card{{display:block;text-decoration:none;color:inherit;background:var(--card);border:1px solid var(--hair);
  border-radius:16px;padding:20px;transition:transform .15s,box-shadow .15s;--accent:hsl(var(--hue) 72% 47%)}}
@media(prefers-color-scheme:dark){{.card{{--accent:hsl(var(--hue) 70% 66%)}}}}
.card:hover{{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.10)}}
.c-pill{{display:inline-block;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;
  color:var(--accent);background:hsl(var(--hue) 72% 47% / .12);padding:3px 10px;border-radius:999px}}
.card h3{{font-family:'Fraunces',serif;font-weight:600;font-size:20px;line-height:1.2;margin:12px 0 6px}}
.card p{{color:var(--muted);font-size:14.5px;line-height:1.5;margin:0 0 14px}}
.c-date{{font-size:12.5px;color:var(--muted)}}
</style></head><body><div class="wrap">
<h1>Learn something new</h1><p class="lede">A growing archive &middot; one idea a day.</p>
<div class="grid">{cards}</div></div></body></html>"""

# ---------- cli ----------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("specs", nargs="+")
    ap.add_argument("--out", default="site")
    ap.add_argument("--no-index", action="store_true")
    a = ap.parse_args()
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    loaded = []
    for path in a.specs:
        spec = json.loads(pathlib.Path(path).read_text())
        (out / f'{spec["slug"]}.html').write_text(render_page(spec))
        loaded.append(spec)
        print(f'  rendered {spec["slug"]}.html')
    # merge with any specs already on disk for a complete index
    if not a.no_index:
        seen = {s["slug"] for s in loaded}
        cdir = pathlib.Path("content")
        if cdir.exists():
            for f in cdir.glob("*.json"):
                s = json.loads(f.read_text())
                if s["slug"] not in seen:
                    loaded.append(s); seen.add(s["slug"])
        (out / "index.html").write_text(render_index(loaded))
        # schedule.json: date -> slug/title, used by the Telegram sender
        sched = {s["date"]: {"slug": s["slug"], "title": s["title"],
                             "category": s.get("category",""),
                             "subtitle": s.get("subtitle","")}
                 for s in loaded if s.get("date")}
        (out / "schedule.json").write_text(json.dumps(sched, indent=2))
        print(f'  rebuilt index.html + schedule.json ({len(loaded)} topics)')

if __name__ == "__main__":
    main()
