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


# CIE record -> Comhairle interchange grammar (schema.json), with fidelity of the mapping.
# fidelity: clean | rekey | recast | lossy | dropped | gap   (grounded in compare/contrast §10.2)
MAPPING = [
    {"cie": "vote (agree / disagree / pass)", "comhairle": "SimpleVote (Positive / Negative / Neutral)", "fidelity": "clean", "note": "maps 1:1"},
    {"cie": "statement", "comhairle": "Statement", "fidelity": "clean", "note": "direct"},
    {"cie": "opinion group (cluster)", "comhairle": "Group { entity_type: Participant }", "fidelity": "clean", "note": "cohort → group"},
    {"cie": "analysis provenance", "comhairle": "Generator::Algorithm(AlgorithmDescriptor)", "fidelity": "clean", "note": "who / what computed it"},
    {"cie": "participant (ULID)", "comhairle": "Participant (UUID)", "fidelity": "rekey", "note": "ULID → UUIDv5; id scheme differs"},
    {"cie": "open text / comment", "comhairle": "Statement { role: Belief }", "fidelity": "recast", "note": "a comment becomes a statement, not a reaction"},
    {"cie": "scale / intensity", "comhairle": "Score(i32)", "fidelity": "lossy", "note": "range + unit-normalization lost"},
    {"cie": "vote → which statement", "comhairle": "Reaction.entity_type = Statement (no target id, no timestamp)", "fidelity": "gap",
     "note": "Reaction names a type but carries no target-entity id and no timestamp — 'P voted + on statement S at time T' can't be expressed. Verified against HEAD: byte-identical schema on staging + main. Proposed as an upstream fix."},
    {"cie": "choice (multi-select)", "comhairle": "— (no interchange type)", "fidelity": "gap", "note": "no analog; would need an invented mapping"},
    {"cie": "createdAt / submissionId / promptShown", "comhairle": "—", "fidelity": "dropped", "note": "Reaction carries no time / session / audit"},
    {"cie": "append-only + hash chain · consent events · moderation class", "comhairle": "—", "fidelity": "dropped",
     "note": "no analog — CIE's whole trust layer has no target in the grammar"},
]

# The integration assessment (grounded in artifacts/2026-06-29-comhairle-compare-contrast §2/§4/§10).
ASSESSMENT = {
    "decision": (
        "Ship CIE's own stack for Pilot 1; align with Comhairle at the protocol layer afterward. The stacks diverge "
        "(Rust/Svelte vs TS/Python), CIE is already validated and tuned to the campaign, and AGPL §13 rules out the "
        "fork-and-SaaS path. Interoperate — don't fork."
    ),
    "agpl": (
        "Running a modified Comhairle as a network service (AGPL-3.0 §13) obliges you to release the complete "
        "corresponding source — your adapter, branding, every change — to every user of the hosted instance. And a "
        "clean dual-license escape is unlikely: copyright is spread across the Crown Shy team with no contributor "
        "agreement pooling the rights, so a proprietary exception would need sign-off from every contributor. CIE's "
        "own clean-room stack carries none of this, which is why the engine stays the product core and Comhairle is "
        "an interop partner, not a base to hide inside a paid product."
    ),
    "verified": (
        "Comhairle findings re-verified against crownshy/comhairle HEAD (default branch 'staging') on 2026-07-01: "
        "AGPL-3.0, 91 SQLx migrations, Rust/Axum + SvelteKit, production on comhairle.scot. The interchange grammar "
        "is real but unpopulated — the data_model crate is a 3-line stub, no tool overrides sync_data, and no "
        "interchange tables exist (tools persist to per-tool aux tables like polis_statement_aux). Reaction carries "
        "neither a target-entity id nor a timestamp, byte-identical on staging + main."
    ),
    "side_by_side": [
        {"dim": "Philosophy", "comhairle": "Wrap & orchestrate existing OSS deliberation tools", "cie": "Same — clean-room Pol.is math + a thin custom app"},
        {"dim": "Maturity", "comhairle": "Production (comhairle.scot), ~92 migrations, active", "cie": "Validated pipeline + scaffold; not yet deployed"},
        {"dim": "Stack", "comhairle": "Rust (Axum, SQLx) + SvelteKit", "cie": "TypeScript (React Router 7) + Python pipeline"},
        {"dim": "Scope", "comhairle": "Broad — many tools, workflows, multi-org", "cie": "Narrow & sharp — one campaign-listening flow"},
        {"dim": "Analysis", "comhairle": "Orchestrates Pol.is; bridging needs hand-coding", "cie": "Bridging is the core — clean-room GIC, validated on 4 real datasets"},
        {"dim": "Trust / integrity", "comhairle": "Ordinary mutable Postgres; not surfaced", "cie": "Append-only DB, roles, guard triggers, hash-chain, two-tier consent"},
        {"dim": "Product surface", "comhairle": "Admin builder + public participation", "cie": "Candidate dashboard, validity cards, scope banner, bridging badges"},
        {"dim": "Extension", "comhairle": "ToolImpl Rust trait — compile-time, fork-level", "cie": "Own the whole stack"},
        {"dim": "Interop seam", "comhairle": "data_model/schema.json (Statement/Reaction/Group/Participant)", "cie": "Record contract is elicitation-agnostic; maps cleanly to theirs"},
        {"dim": "License", "comhairle": "AGPL-3.0", "cie": "Ours to license"},
    ],
    "coverage": {
        "satisfies": 4, "partial": 15, "gap": 35, "na": 16, "total": 70,
        "finding": (
            "The two systems agree on the Pol.is spine and diverge on everything CIE adds around it. The only items "
            "Comhairle fully satisfies (votes-only aggregation, demographic-blind clustering, the Pol.is tool, the "
            "PCA→k-means core) are the Pol.is-derived substrate CIE already re-implements clean-room."
        ),
    },
    # CIE-core capabilities Comhairle entirely lacks (each would be a custom build on top of a fork)
    "cie_gaps": [
        "Bridging as a gated claim — GIC ≥ 0.5 + per-group Wilson lower bound > 0.5 + a vote floor. Comhairle shows Pol.is's raw consensus float: a number, not a defensible claim.",
        "Database-enforced append-only trust + off-box hash chain. Comhairle uses ordinary mutable Postgres.",
        "Two-tier consent + PII quarantine. Comhairle has a single consent boolean and stores joinable demographics.",
        "The quality-gate ladder + validity cards. Comhairle renders Pol.is math live and ungated.",
        "Paraphrase-only quotes. Comhairle stores and serves verbatim statement text — the opposite policy.",
        "Claim discipline — scope banner, copy linter, badge vocabulary, methods note.",
        "Data-sovereignty egress — local embeddings + one batch-LLM call over scrubbed aggregates; Comhairle makes many per-record external AI calls.",
    ],
    # what a collaboration would GAIN CIE (Comhairle has, CIE deferred)
    "comhairle_has": (
        "Composable multi-tool workflows (quadratic-vote prioritization, ranking, ThinkingSpace), RAGFlow document "
        "Q&A, multi-org tenancy, i18n, ScotAccount OIDC + anonymous→account upgrade, audio transcription, and "
        "demographic / representativeness breakdowns. (That last one is exactly what CIE deliberately quarantines — a tension to flag.)"
    ),
    "paths": [
        {"name": "Path 1 · Interop-export", "effort": "~2–4 days", "fork": False, "recommended": True,
         "note": "A pipeline stage that serializes CIE data into Comhairle's schema.json shape. No Comhairle code, reversible, PII stays quarantined — the literal artifact to bring to the July call: 'CIE speaks Comhairle's grammar.'"},
        {"name": "Path 2 · Custom adapter (fork)", "effort": "~7–12 days", "fork": True, "recommended": False,
         "note": "A CIE ToolImpl inside a Comhairle fork. Buys little today — Comhairle's interchange ingest is unwired — and carries fork-maintenance + AGPL §13 exposure. Fund it once there's a live consumer."},
    ],
    "posture": (
        "Export-first, adapter-later. CIE stays the system of record in every scenario — the mapping is lossy in "
        "exactly the direction that matters: CIE's trust, consent, moderation, and bridging-badge guarantees have no "
        "target in Comhairle's model. So Comhairle is at best a downstream interop consumer, never a replacement store."
    ),
    "gifts": [
        {"t": "A Reaction target-entity id", "d": "So 'participant P voted + on statement S' can be expressed at all — a real hole this mapping surfaced."},
        {"t": "A moderation / provenance entity", "d": "So the two-class moderation policy (hide-but-count vs exclude-session) survives the handoff instead of silently corrupting the statistics."},
    ],
}


def build_and_write(ds: dict, art: dict | None = None) -> dict:
    doc = build(ds, art)
    out = Path(__file__).resolve().parent.parent / "web" / "public" / "interop.json"
    json.dump(doc, open(out, "w"), indent=2)
    # mapping + assessment ship alongside so the P1 view can render the full integration assessment
    json.dump({"mapping": MAPPING, "assessment": ASSESSMENT}, open(out.with_name("interop_mapping.json"), "w"), indent=2)
    gaps = sum(1 for m in MAPPING if m["fidelity"] in ("gap", "dropped"))
    print(f"✓ wrote {out}")
    print(f"  statements={len(doc['statements'])} participants={len(doc['participants'])} votes={len(doc['votes'])}")
    print(f"  mapping rows={len(MAPPING)} ({gaps} gap/dropped) · coverage {ASSESSMENT['coverage']['satisfies']}/{ASSESSMENT['coverage']['partial']}/{ASSESSMENT['coverage']['gap']}/{ASSESSMENT['coverage']['na']}")
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
