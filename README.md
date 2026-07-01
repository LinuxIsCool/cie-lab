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

## Layout
- `analysis/` — Python (uv): `gen_synthetic.py`, `bridging.py`, `telus.py` (free TELUS client),
  `run.py` (POC #1 pipeline), `ask.py` (POC #2 retrieval + grounding), `serve.py` (local /api/ask)
- `web/` — Vite + React 19 + TS + Tailwind v4 dashboard reading the results artifact

## Notes
- TELUS e5 embeddings are **asymmetric** — `input_type` ("query"/"passage") is **required** (else HTTP 400).
- Results artifact schema: `cie.results.v0` (the seam — any backend that emits it is swappable).
