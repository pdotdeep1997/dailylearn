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

Season 1 is ~12 lessons per track (48 total, ≈ 7 weeks). Each track can then run a
Season 2 that goes deeper. Existing good lessons are slotted into their natural
place (marked ✓ already written).

---

## Track A — Software & Systems  🟦
*Capstone: design a real-time distributed system and walk through its failure modes.*

1. **What a computer really does** — the fetch–execute loop; why we stack abstractions.
2. **The numbers every programmer should know** — memory hierarchy, latency, why locality wins.
3. **How data is laid out** — arrays, hashing, and why data structures are about tradeoffs.
4. **Concurrency** — race conditions, locks, and why parallelism is genuinely hard.
5. **The network** — packets, TCP/IP, and what actually happens when you load a URL.
6. **Caching** — the two hard problems; invalidation; builds on latency + hashing.
7. **Databases** — indexes, B-trees, and what ACID really guarantees.
8. **Distributed systems & the CAP theorem** — the tradeoff you can't escape.
9. **Consensus** — how machines agree (Raft/Paxos intuition).
10. **Consistent hashing & partitioning** — scaling without reshuffling. ✓ *(already written)*
11. **Queues, backpressure & idempotency** — designing for overload and retries.
12. **Capstone: design a system** — put every piece together on one real problem.

## Track B — Money & Markets  🟩
*Capstone: value a company from scratch and read a macro dashboard.*

1. **What money actually is** — medium of exchange, debt, and trust.
2. **The time value of money** — compounding; why a dollar today beats a dollar tomorrow.
3. **Present value & discounting** — the one idea behind valuing anything.
4. **Risk & return** — volatility, and why higher return demands higher risk.
5. **Diversification** — the only "free lunch"; portfolio thinking.
6. **Markets & price discovery** — supply, demand, and information in prices.
7. **Bonds & the yield curve** — and why inversion spooks everyone. ✓ *(already written)*
8. **Equities & valuation** — DCF and multiples.
9. **Inflation & central banks** — what they actually control.
10. **Leverage & credit cycles** — how booms and busts are built.
11. **Efficient markets vs. behavioral finance** — are prices right?
12. **Capstone: value a company** — a full back-of-envelope valuation.

## Track C — History & Civilization  🟧
*Capstone: explain the rise-and-fall pattern and apply it to the present.*

1. **The farming revolution** — why settling down changed everything.
2. **Writing** — the first information technology.
3. **Money & trade networks in the ancient world** — connects to Track B, Lesson 1.
4. **The rise of states & bureaucracy** — how large-scale cooperation was engineered.
5. **Institutions** — law, property rights, and why they decide prosperity.
6. **The printing press** — the first information explosion.
7. **The Scientific Revolution** — why it happened when and where it did.
8. **The Industrial Revolution** — energy, and the hockey-stick of growth.
9. **Empires** — how they expand and why they overreach.
10. **Money in history** — Rome's debasement to Weimar (connects to Track B, Lesson 9).
11. **Why civilizations collapse** — complexity, energy, and diminishing returns.
12. **Capstone: patterns of rise & fall** — applied to today.

## Track D — Ideas & Minds  🟪
*Capstone: a decision-making framework for thinking clearly under uncertainty.*

1. **Thinking in probabilities** — what "chance" really means.
2. **Bayes' theorem** — updating beliefs when new evidence arrives.
3. **Expected value** — the core of every good decision.
4. **Cognitive biases** — the predictable ways reasoning fails.
5. **Logic & argument** — validity, soundness, and common fallacies.
6. **Exponential intuition** — why humans underestimate compounding (ties to Track B, Lesson 2).
7. **Game theory** — incentives, equilibria, the prisoner's dilemma.
8. **Feedback loops & systems thinking** — stocks, flows, and why systems surprise us.
9. **Correlation vs. causation** — and how to tell them apart.
10. **The limits of systems** — Arrow's theorem & voting (connects ranked-choice ✓), Gödel in brief.
11. **Complexity & emergence** — how simple rules make complex worlds.
12. **Capstone: a thinking toolkit** — assembling the mental models.

---

## The interleave schedule (Season 1)

Seven lessons a week, rotating through the tracks so each advances steadily and no
day feels like the last. Pattern repeats, offset each week so every track gets its
turn early:

```
Week 1:  A1  B1  C1  D1  A2  B2  C2      ← the foundation week (written)
Week 2:  D2  A3  B3  C3  D3  A4  B4
Week 3:  C4  D4  A5  B5  C5  D5  A6
Week 4:  B6  C6  D6  A7  B7  C7  D7
Week 5:  A8  B8  C8  D8  A9  B9  C9
Week 6:  D9  A10 B10 C10 D10 A11 B11
Week 7:  C11 D11 A12 B12 C12 D12  +capstone review
```

Each Monday-of-the-week authoring run just pulls the next unplayed lesson from each
track in this order. `schedule.json` maps each date → the lesson that goes out that
day.

## Week 1 (live)
A1 What a computer really does · B1 What money actually is · C1 The farming
revolution · D1 Thinking in probabilities · A2 The numbers every programmer should
know · B2 The time value of money · C2 Writing, the first information technology.
