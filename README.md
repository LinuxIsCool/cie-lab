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

## Layout
- `analysis/` — Python (uv): `gen_synthetic.py`, `bridging.py`, `telus.py` (free TELUS client), `run.py`
- `web/` — Vite + React 19 + TS + Tailwind v4 dashboard reading the results artifact

## Notes
- TELUS e5 embeddings are **asymmetric** — `input_type` ("query"/"passage") is **required** (else HTTP 400).
- Results artifact schema: `cie.results.v0` (the seam — any backend that emits it is swappable).
