"""P1 · Comhairle interop-export — emit the deliberation as a portable flat-file.

Tests the question: can CIE losslessly-enough speak a tool-agnostic deliberation
grammar (Metagov Interop-style), so another platform (e.g. Comhairle) could ingest
the raw material and re-run its own analysis?

Design choice: we export the RAW deliberation — statements + (anonymized)
participants + votes — NOT the computed bridging results. Exporting the evidence,
not our conclusions, is what makes the handoff lossless: any receiving tool derives
its own groups/consensus. Groups are included only as an OPTIONAL derived block.

Emits cie.interop.v0 -> web/public/interop.json.
"""
from __future__ import annotations
import json
from pathlib import Path


def build(ds: dict, art: dict | None = None) -> dict:
    letter = lambda g: chr(65 + g)
    doc = {
        "schema": "cie.interop.v0",
        "profile": "metagov-interop-style deliberation interchange (flat-file)",
        "conversation": {
            "id": "synthetic-nc12",
            "title": "Constituent listening (synthetic)",
            "scope": art["scope_banner"] if art else "synthetic demonstration data",
            "n_participants": ds["meta"]["n_participants"],
            "n_statements": ds["meta"]["n_statements"],
            "n_votes": ds["meta"]["n_votes"],
        },
        # --- the lossless core: statements, participants, votes ---
        "statements": [{"id": s["id"], "text": s["text"], "tag": s["tag"]} for s in ds["statements"]],
        # participants are anonymized — id only, no demographics ever
        "participants": [{"id": p["id"]} for p in ds["participants"]],
        "votes": [{"participant": v["participant_id"], "statement": v["statement_id"], "value": v["value"]}
                  for v in ds["votes"]],
        "value_codes": {"agree": 1, "disagree": -1, "pass": 0},
    }
    # optional derived block — a courtesy, not authoritative (receiver may recompute)
    if art is not None:
        doc["derived"] = {
            "note": "Derived by CIE; a receiving tool may recompute its own. Not part of the lossless core.",
            "groups": [{"id": letter(g["group"]), "size": g["size"]} for g in art["opinion_groups"]],
        }
    return doc


# CIE field -> portable interop field -> Comhairle-grammar term.
# `verified=False` marks a mapping still to be checked against crownshy/comhairle HEAD.
MAPPING = [
    {"cie": "statement.id", "interop": "statement.id", "comhairle": "Comment.id", "verified": True},
    {"cie": "statement.text", "interop": "statement.text", "comhairle": "Comment.body", "verified": True},
    {"cie": "vote.value (agree/disagree/pass)", "interop": "vote.value (+1/-1/0)", "comhairle": "Reaction.kind", "verified": True},
    {"cie": "vote.participant", "interop": "vote.participant", "comhairle": "Reaction.author", "verified": True},
    {"cie": "vote.statement", "interop": "vote.statement", "comhairle": "Reaction.target_id", "verified": False},
    {"cie": "participant.id", "interop": "participant.id", "comhairle": "Participant.id", "verified": True},
    {"cie": "opinion group (derived)", "interop": "derived.groups[]", "comhairle": "(recomputed by receiver)", "verified": True},
]


def build_and_write(ds: dict, art: dict | None = None) -> dict:
    doc = build(ds, art)
    out = Path(__file__).resolve().parent.parent / "web" / "public" / "interop.json"
    json.dump(doc, open(out, "w"), indent=2)
    # mapping ships alongside so the P1 view can render the field table
    json.dump({"mapping": MAPPING}, open(out.with_name("interop_mapping.json"), "w"), indent=2)
    print(f"✓ wrote {out}")
    print(f"  statements={len(doc['statements'])} participants={len(doc['participants'])} votes={len(doc['votes'])}")
    print(f"  mapping rows={len(MAPPING)} (unverified={sum(1 for m in MAPPING if not m['verified'])})")
    return doc


if __name__ == "__main__":
    import argparse
    from dataclasses import asdict
    import gen_synthetic, bridging

    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=320)
    ap.add_argument("--seed", type=int, default=7)
    a = ap.parse_args()
    ds = asdict(gen_synthetic.generate(n=a.n, seed=a.seed))
    art = bridging.analyze(ds)
    build_and_write(ds, art)
