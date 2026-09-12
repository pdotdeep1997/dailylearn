# The Curriculum — a designed path, not random lessons

**Model:** four tracks, each a strictly-sequenced arc that builds to a **capstone**.
Lessons are **interleaved** — each week samples several tracks for daily variety,
but within a track every lesson assumes the ones before it. Later lessons open with
a "Builds on →" link back to their prerequisites. Nothing is random; every lesson
is a deliberate rung.

The four tracks:

| Track | Color | Capstone — what you can do at the end |
|---|---|---|
| **Software & Systems** | blue | Design a scalable, fault-tolerant system and reason about how it fails |
| **Money & Markets** | green | Value any asset from first principles and read the macro picture |
| **History & Civilization** | amber | Explain why civilizations rise and fall — and spot the patterns today |
| **Ideas & Minds** | purple | A working toolkit for thinking clearly and deciding under uncertainty |

Season 1 is ~12 lessons per track (48 total, ≈ 7 weeks). Each track then runs a
Season 2 that goes deeper.

---

## Track A — Software & Systems  🟦 (Season 1)
1. What a computer really does · 2. The numbers every programmer should know ·
3. How data is laid out (Big-O) · 4. Concurrency · 5. The network · 6. Caching ·
7. Databases & indexes · 8. CAP theorem · 9. Consensus (Raft) ·
10. Consistent hashing & partitioning (backlog) · 11. Queues & backpressure · 12. Capstone.

## Track B — Money & Markets  🟩 (Season 1)
1. What money is · 2. Time value of money · 3. Present value & discounting ·
4. Risk & return · 5. Diversification · 6. Price discovery · 7. Bonds & yield curve ·
8. Equities & valuation · 9. Inflation & central banks · 10. Leverage & credit cycles ·
11. EMH vs behavioral · 12. Capstone.

## Track C — History & Civilization  🟧 (Season 1)
1. Farming revolution · 2. Writing · 3. Ancient trade networks · 4. Rise of states ·
5. Institutions · 6. Printing press · 7. Scientific Revolution · 8. Industrial Revolution ·
9. Empires & overreach · 10. Money in history · 11. Why civilizations collapse · 12. Capstone.

## Track D — Ideas & Minds  🟪 (Season 1)
1. Probability · 2. Bayes · 3. Expected value · 4. Cognitive biases · 5. Logic & fallacies ·
6. Exponential intuition · 7. Game theory · 8. Feedback loops · 9. Correlation vs causation ·
10. Limits of systems (Arrow/Gödel) · 11. Complexity & emergence · 12. Capstone.

---

# Track A — SEASON 2: System Design & Software-Engineering Principles  🟦🟦

*An ongoing, deepening strand analyzing **software-engineering principles** and
working through **system-design breakdowns over time**. Modeled on **Hello Interview**
(hellointerview.com) — its delivery framework, core concepts, key technologies,
patterns, and problem breakdowns.*

**Season-2 capstone:** run a complete system-design interview end-to-end — take any
"Design X" prompt through requirements → API → high-level design → deep dives, and
defend the tradeoffs.

Three interleaving threads inside the Software track. The Software slot alternates
between them — **roughly every third Software lesson is a "Design X" breakdown**,
getting harder as toolkit lessons unlock. Several Hello Interview *core concepts* are
already covered in Season 1 (caching, databases & indexing, CAP, consensus, consistent
hashing, networking, concurrency, queues); Season 2 deepens them and adds the rest.

### Thread 1 — Engineering Principles
P1 Abstraction & modularity · P2 Coupling & cohesion · P3 SOLID & DRY (and when they mislead) ·
P4 API design (REST, pagination, versioning, idempotency keys) · P5 Idempotency, retries & the
"exactly-once" myth · P6 Failure modes (timeouts, backoff, circuit breakers, graceful degradation) ·
P7 Observability (logs, metrics, traces) · P8 Testing strategy (the pyramid) ·
P9 Back-of-the-envelope estimation ("numbers to know") · P10 Simplicity & tradeoffs (YAGNI).

### Thread 2 — System Design Toolkit (core concepts · key technologies · patterns)
T0 The delivery framework (Requirements → Core Entities → API → [Data Flow] → High-Level Design → Deep Dives) ·
T1 Scaling axes (vertical vs horizontal, stateless) · T2 Load balancing (L4/L7) ·
T3 SQL vs NoSQL & data modeling · T4 Indexing deep dive (B-tree/inverted/geospatial) ·
T5 Sharding & partitioning · T6 Replication & read replicas · T7 Caching strategies (Redis, cache-aside, stampede) ·
T8 Message queues (Kafka/SQS) · T9 Streams & event processing (Flink/Kinesis, event sourcing) ·
T10 Blob storage & CDNs (S3, presigned URLs) · T11 Search (Elasticsearch, inverted index) ·
T12 Distributed locks & coordination (Redis/ZooKeeper) · T13 Rate limiting (token bucket, sliding window).
**Patterns (HI's 8):** realtime updates · long-running tasks · contention · scaling reads ·
scaling writes · large blobs · multi-step processes · proximity/geospatial.

### Thread 3 — System Design Breakdowns ("Design X", easy → hard)
Author each using the **delivery framework as the section layout** (Requirements →
Core Entities → API → High-Level Design *(the diagram)* → 1–2 Deep Dives), boss quiz
on the key tradeoff, callback to the toolkit lesson it exercises.
- **Easy:** Bitly · Dropbox · Yelp · Local Delivery.
- **Medium:** Rate Limiter · Ticketmaster · Instagram/News Feed · WhatsApp · Distributed Cache ·
  YouTube · Notification System · Tinder · LeetCode · Strava · Online Auction · Job Scheduler ·
  FB Live Comments · News Aggregator · Price Tracker.
- **Hard:** Uber · Web Crawler · Ad Click Aggregator · Google Docs · Payment System ·
  ChatGPT / LLM-inference serving *(reuse AI-inference backlog)* · Metrics Monitoring ·
  YouTube Top-K · Robinhood · Online Chess · FB Post Search · Flash Sale.

**Suggested ordering:** `T0 → Bitly → P1 → T1 → Dropbox → P2 → T3 → Rate Limiter →
P4 → T6 → News Feed → T8 → P5 → WhatsApp → T7 → YouTube → P6 → T9 → Ad Click Aggregator →
P9 → Uber → T11 → Google Docs → P7 → Payment System → …` — equip, then exercise.

**Reference:** mirror Hello Interview's scope (hellointerview.com). Keep the playful
voice, a real architecture diagram for breakdowns, the boss quiz on the central
tradeoff, and callbacks to Season-1 fundamentals. HI pages make great go_deeper links.

---

## Live so far
Days 1–11 (2026-09-08 → 09-18): 33 lessons, 3/day interleaved. Software reached S1 L9
(consensus) — near the end of Season 1 and about to enter this Season-2 strand.
