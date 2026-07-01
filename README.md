# cie-lab

Reserved experimental sandbox for the **Civic Intelligence Engine** prototype portfolio.
Local-first; we iterate here and **converge late** — only graduating winners to the team repo.
Free LLM/embedding experimentation via **TELUS** (`claude-llms`, $0). POCs use **synthetic + public**
data only, so no production data-governance gate applies here.

## POC #1 — Core listening loop (the spine)

The trunk every other prototype branches from. Demonstrates: simultaneous vote + free-text +
**light self-coding** → clean-room **Pol.is bridging** (PCA → k-means → group-informed consensus,
gated badges, Wilson bounds, validity card) → self-code overlays → a candidate dashboard.
AI is a listening aid, never the measurement — every number comes from human votes.

### Run it

```bash
# 1. analysis: synthetic data → bridging → free-TELUS group labels → web/public/artifact.json
cd analysis && uv run python run.py            # add --no-llm for pure-offline math

# 2. web: the dashboard
cd ../web && pnpm install && pnpm dev          # http://127.0.0.1:5180
```

## POC #2 — Ask your constituency (grounded chat-to-query)

Natural-language questions over the POC #1 artifact. The LLM does two narrow jobs — **routing**
(semantic retrieval to find which statements bear on the question) and **phrasing** — while every
number shown is rendered from the artifact, not generated. The grounding prompt respects badges
(`representative-enough` vs `directional` vs `below-bar`) and **refuses** unsupported premises
(e.g. "prove everyone opposes new taxes" → "the evidence does not answer this"). One `embed` +
one `chat` per question, both free TELUS.

### Run it (adds a 2nd process to POC #1)

```bash
# 3. ask-server: embeds statements once, serves POST /api/ask {q}
cd analysis && uv run python serve.py          # http://127.0.0.1:5181 (Vite proxies /api → here)
```

Then use the **Ask your constituency** panel at the top of the dashboard.

## POC #3 — Knowledge-graph sensemaking (P5)

A position/claim graph over the same artifact — the exploration surface *next to* P0's
opinion map. Where P0 clusters **people** by vote pattern, P5 clusters **positions** by
**meaning** (statement embeddings → k-means themes, Gemma-named). Resident comments become
"voice" nodes, each distilled to a short claim (Gemma), linked to its nearest statement by
embedding, with **stance taken from that person's actual vote** (not the LLM). A numpy
force-directed layout is baked offline so the web view is pure SVG (hover to trace links,
click to pin). Honest caveat surfaced in-UI: civic statements embed close (silhouette ≈ 0.06),
so themes are *soft* and the **edge topology** carries the structure.

`run.py` builds `kg.json` too (skipped under `--no-llm`, which needs no network). Or standalone:

```bash
cd analysis && uv run python kg.py            # → web/public/kg.json (cie.kg.v0)
```

## POC #4 — Classic Pol.is baseline (P2)

The **control**. Renders the same `cie.results.v0` artifact the plain vote-only way —
opinion map + consensus/divisive statements, groups as "A/B/C" — and deliberately
withholds P0's additions (AI labels, self-codes, free-text, confidence badges). Flipping
between P2 and P0 in the hub *is* the experiment: what do the extra layers actually buy?
Pure subtraction over the existing artifact — no analysis changes. Lives at `#/p2`.

## POC #7 — Hybrid quant+qual (P7)

Reads two signals together, group by group. P0 keeps the votes (quantitative common
ground) and the self-codes (how heard people feel) in separate panels; P7 derives a
per-group **common-ground score** (average agreement across the bridging statements) and
pairs it with feeling-heard, view-intensity, and that group's own comments. Surfaces
patterns neither number shows alone (a group can share the agenda yet feel unheard). Pure
client-side derive over the existing artifact — no analysis changes. Lives at `#/p7`.

## POC #6 — Conversational elicitation (P3)

Talk instead of vote. A neutral AI facilitator asks open, non-leading questions, then a
**defensible synthesis** reflects your positions back — each one tied to a **verbatim quote**
the server validated is literally in your words (any position it can't ground is dropped),
and you confirm before it counts. Surfaces the governance/egress edge honestly (free-text →
LLM). Two endpoints on the same server (`analysis/converse.py`): `/api/facilitate`,
`/api/extract`. Lives at `#/p3` (needs the ask+converse server running).

## POC #5 — Comhairle interop-export (P1)

Makes "interoperate, don't fork" concrete. Exports the **raw** deliberation
(statements + anonymized participants + votes, not the computed results) as a portable
`cie.interop.v0` flat-file, so another platform could ingest it and re-run its own
analysis — lossless because it's the evidence, not the conclusions. Shows a candidate
field-mapping to Comhairle's grammar with one row honestly marked **pending** (unverified
against their source). No LLM needed; `run.py` emits it unconditionally. Lives at `#/p1`.

## Layout
- `analysis/` — Python (uv): `gen_synthetic.py`, `bridging.py`, `telus.py` (free TELUS client),
  `run.py` (P0 pipeline + KG + interop), `ask.py` (P6 retrieval + grounding),
  `converse.py` (P3 facilitator + defensible extraction), `serve.py` (local API:
  /api/ask, /api/facilitate, /api/extract), `kg.py` (P5 graph), `interop.py` (P1 export)
- `web/` — Vite + React 19 + TS + Tailwind v4 hub: nav tree + per-demo views (`src/views/`)
  reading the `cie.results.v0` / `cie.kg.v0` artifacts

## Notes
- TELUS e5 embeddings are **asymmetric** — `input_type` ("query"/"passage") is **required** (else HTTP 400).
- Results artifact schema: `cie.results.v0` (the seam — any backend that emits it is swappable).
