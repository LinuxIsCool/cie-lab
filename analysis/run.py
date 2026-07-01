"""Orchestrate POC #1: synthetic -> bridging -> (optional free-TELUS group labels) -> artifact.

Usage:
  uv run python run.py            # generate + analyze + label groups via free TELUS, write web artifact
  uv run python run.py --no-llm   # skip the LLM group-labeling (pure-math, offline)
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
from dataclasses import asdict

import gen_synthetic
import bridging
import kg
import interop


def label_groups(art: dict) -> None:
    """Free TELUS Gemma: name each opinion group from its distinctive agreements.
    AI labels are descriptive only — they never touch the vote-derived numbers."""
    import telus
    stmt_text = {s["id"]: s["text"] for s in art["statements"]}
    for grp in art["opinion_groups"]:
        g = grp["group"]
        # statements this group agrees on most strongly
        ranked = sorted(
            art["statements"],
            key=lambda s: next((pg["agree_rate"] or 0 for pg in s["per_group"] if pg["group"] == g), 0),
            reverse=True,
        )[:4]
        bullets = "\n".join(f"- {s['text']}" for s in ranked)
        prompt = (
            "These are the statements one cluster of constituents most agreed with:\n"
            f"{bullets}\n\nGive a neutral 2-4 word label for this group's outlook. Label only."
        )
        try:
            grp["ai_label"] = telus.chat(prompt, max_tokens=16).strip().strip('".')
        except Exception as e:
            grp["ai_label"] = None
            grp["ai_label_error"] = str(e)[:80]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=320)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--no-llm", action="store_true")
    a = ap.parse_args()

    ds = asdict(gen_synthetic.generate(n=a.n, seed=a.seed))
    art = bridging.analyze(ds)
    if not a.no_llm:
        print("labeling opinion groups via free TELUS Gemma…")
        label_groups(art)

    out = Path(__file__).resolve().parent.parent / "web" / "public" / "artifact.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    json.dump(art, open(out, "w"), indent=2)
    bridges = sum(1 for s in art["statements"] if s["badge"] == "representative-enough")
    labels = [g.get("ai_label") for g in art["opinion_groups"]]
    print(f"✓ wrote {out}")
    print(f"  N={art['meta']['n_participants']} groups={art['meta']['k_groups_found']} "
          f"silhouette={art['meta']['silhouette']} bridges={bridges}")
    print(f"  group labels: {labels}")
    print(f"  feeling-heard avg={art['overall_self_codes']['feeling_heard_mean']} "
          f"comment-rate={art['overall_self_codes']['comment_rate']}")

    # P1 interop-export needs no LLM — always emit
    print("exporting P1 interop flat-file…")
    interop.build_and_write(ds, art)

    # P5 knowledge graph rides the same ds+artifact (needs embeddings, so skip under --no-llm)
    if not a.no_llm:
        print("building P5 knowledge graph via free TELUS…")
        kg.build_and_write(ds, art, use_llm=True)


if __name__ == "__main__":
    main()
