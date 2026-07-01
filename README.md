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

## Layout
- `analysis/` — Python (uv): `gen_synthetic.py`, `bridging.py`, `telus.py` (free TELUS client),
  `run.py` (POC #1 pipeline + KG), `ask.py` (POC #2 retrieval + grounding), `serve.py`
  (POC #2 local /api/ask), `kg.py` (POC #3 knowledge-graph builder)
- `web/` — Vite + React 19 + TS + Tailwind v4 hub: nav tree + per-demo views (`src/views/`)
  reading the `cie.results.v0` / `cie.kg.v0` artifacts

## Notes
- TELUS e5 embeddings are **asymmetric** — `input_type` ("query"/"passage") is **required** (else HTTP 400).
- Results artifact schema: `cie.results.v0` (the seam — any backend that emits it is swappable).
