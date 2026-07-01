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

# Per-item coverage — CIE's 70 spec items (R1–R48 requirements, T1–T10 quality gates,
# M1–M12 build core) vs the Comhairle codebase. Names from the requirements catalog +
# build-core table; statuses reconcile to the §10.1 audited totals (overall 4/15/35/16;
# R 2/11/21/14 · T 0/0/10/0 · M 2/4/4/2). sourced=True where the doc states/derives the
# status (the 4 satisfies, all-T-gap, the seven critical-gap groups); False where inferred
# to reconcile the per-area totals.
_COV = [
    # id, area, status, sourced, name, note
    ("R1", "Requirement", "gap", True, "Scope banner on every surface", "CIE stamps an un-removable scope banner on every result and export; Comhairle has no claim-framing layer."),
    ("R2", "Requirement", "gap", True, "Copy linter bans polling language", "A linter fails the build on margin-of-error language absent a polling frame; Comhairle has no such guard."),
    ("R3", "Requirement", "gap", True, "Single badge, fixed vocabulary", "Every result carries one badge from a three-value taxonomy; Comhairle surfaces raw Pol.is numbers with no badge."),
    ("R4", "Requirement", "gap", True, "Validity card on every result", "Per-group counts, smallest-group margin, coverage, and knife-edge flags — no analog in Comhairle."),
    ("R5", "Requirement", "gap", True, "Plain-language methods note", "A methods note reachable from every surface; Comhairle ships none."),
    ("R6", "Requirement", "na", False, "Candidate claim-language briefing", "A pre-launch briefing and usage agreement with the candidate — a program step, not a platform feature."),
    ("R7", "Requirement", "satisfies", True, "Aggregates from real votes only", "Comhairle aggregates real Pol.is votes; simulated agreement never enters — the measurement-integrity floor CIE requires."),
    ("R8", "Requirement", "gap", True, "Gated bridging badge", "CIE's badge needs GIC≥0.5 + each group's Wilson>0.5 + 25 votes; Comhairle exposes Pol.is's raw consensus float."),
    ("R9", "Requirement", "satisfies", True, "Groups from response patterns only", "Comhairle's Pol.is clusters on vote patterns with no demographic input — exactly CIE's rule."),
    ("R10", "Requirement", "partial", False, "Bounded, re-derived cluster search", "Comhairle runs Pol.is clustering but doesn't pin a re-derived k-range as a versioned thresholds commit."),
    ("R11", "Requirement", "gap", True, "Stability gate fails loudly", "CIE blocks artifacts on a failed stability gate; Comhairle renders results live and ungated."),
    ("R12", "Requirement", "gap", True, "Per-cluster stability → directional", "Marking unstable sub-clusters directional has no counterpart in Comhairle's output."),
    ("R13", "Requirement", "gap", True, "Local embeddings, no network", "CIE embeds locally with no egress; Comhairle makes external per-record AI calls."),
    ("R14", "Requirement", "partial", False, "Divisive shown beside bridging", "Comhairle can display divisive Pol.is results, but without CIE's guarantee they sit un-subordinated and unsuppressible."),
    ("R15", "Requirement", "partial", False, "Genuine pass / not-sure option", "Pol.is offers a pass, though not recorded as CIE's distinct, non-gating value on every item."),
    ("R16", "Requirement", "na", False, "Instrument under seven minutes", "A completion-time timing study with a test posse — a field-research step, not a codebase capability."),
    ("R17", "Requirement", "na", False, "Validated item banks + neutral audit", "Wording sourced from validated banks and neutral-audited — a content/process gate."),
    ("R18", "Requirement", "na", False, "Named instrument owner", "A named, resourced instrument owner confirmed before collection — a staffing gate."),
    ("R19", "Requirement", "partial", False, "Curator identity + timestamp", "Comhairle stores statement authorship, but not CIE's enforced curator-identity-before-display check."),
    ("R20", "Requirement", "na", False, "Seed cites research source", "Each seed statement citing swing-theme research — a content-provenance step."),
    ("R21", "Requirement", "na", False, "Dial decision recorded", "Recording the elicitation-dial decision before launch — a process artifact."),
    ("R22", "Requirement", "na", False, "Config empty until owner sign-off", "Gating the instrument config on the owner's deliverable — a process control."),
    ("R23", "Requirement", "gap", True, "Two-tier unbundled consent", "Comhairle has a single consent boolean; CIE's two independent tiers with contact-off-by-default have no analog."),
    ("R24", "Requirement", "partial", False, "AI disclosure at start", "Comhairle uses AI services and can disclose them, but without CIE's red-teamed standalone-screenshot standard."),
    ("R25", "Requirement", "gap", True, "Consent event pins copy version", "Versioning every consent event to the exact copy shown is absent from Comhairle's model."),
    ("R26", "Requirement", "na", False, "Consent compliance review", "A privacy and electoral-compliance sign-off before go/no-go — a governance step."),
    ("R27", "Requirement", "gap", True, "11-participant suppression floor", "Server-side cell suppression below 11, with complementary suppression, is not in Comhairle's ungated render."),
    ("R28", "Requirement", "gap", True, "Paraphrase-only quotes", "Comhairle stores and serves verbatim statement text — the opposite of CIE's paraphrase-only egress rule."),
    ("R29", "Requirement", "gap", True, "Recontact tier live at launch", "A live recontact consent tier has no counterpart in Comhairle."),
    ("R30", "Requirement", "partial", False, "Post-results comms to completers", "Comhairle has notifications, but not CIE's session-state rule of 'completed submitters only, after analysis'."),
    ("R31", "Requirement", "gap", True, "Contract in schema + validator", "CIE implements one record contract in both app schema and pipeline validator; Comhairle has no dual-checked contract."),
    ("R32", "Requirement", "gap", True, "No update/delete of raw rows", "Append-only enforced in DB roles; Comhairle uses ordinary mutable Postgres."),
    ("R33", "Requirement", "gap", True, "Analysis can't read contacts", "A permission-audited wall between analysis and the contact store; Comhairle stores joinable data without it."),
    ("R34", "Requirement", "gap", True, "Nightly off-box hash chain", "A tamper-evident hash chain that blocks reads on mismatch — absent from Comhairle."),
    ("R35", "Requirement", "partial", True, "Two-class moderation", "Comhairle has a moderation status, but not CIE's two semantics — toxicity hides yet counts, integrity excludes the session."),
    ("R36", "Requirement", "gap", True, "Hash-registered run artifacts", "CIE renders immutable per-run artifacts under a versioned run id; Comhairle renders live data."),
    ("R37", "Requirement", "partial", False, "Theme labels LLM + human-confirmed", "Comhairle auto-categorizes with AI, but without CIE's recorded human confirmation and 20-contributor floor."),
    ("R38", "Requirement", "gap", False, "Label/publish held for provider", "A deliberate hold on the label/publish stage until the provider decision lands — a CIE build-discipline choice."),
    ("R39", "Requirement", "gap", True, "Single batch LLM over aggregates", "CIE makes one batch pass over PII-scrubbed aggregates; Comhairle makes many per-record external calls."),
    ("R40", "Requirement", "partial", False, "Thresholds single source of truth", "Comhairle has config, but not CIE's linted single-source thresholds file with generated constants."),
    ("R41", "Requirement", "partial", False, "Unique codes + redemption log", "Comhairle issues participation codes, though not to CIE's 45-bit-entropy + append-only-redemption spec."),
    ("R42", "Requirement", "partial", False, "Funnel report by channel/batch", "Comhairle has participation analytics, but not CIE's delivered/redeemed/consented/completed funnel."),
    ("R43", "Requirement", "na", False, "Contact-list provenance documented", "Documenting contact-list provenance before print — an operations step."),
    ("R44", "Requirement", "na", False, "QR domain warmed + fast landing", "Warming the QR domain and latency-testing the landing page — a deployment step."),
    ("R45", "Requirement", "na", False, "Staging walkthrough", "A production-identical staging walkthrough — a launch-readiness step."),
    ("R46", "Requirement", "na", False, "Load test at 5–10k", "A concurrency load test confirming zero loss — a testing step."),
    ("R47", "Requirement", "na", False, "Milestone gates signed", "Funder-signed milestone gates and go/no-go — a governance step."),
    ("R48", "Requirement", "na", False, "Replication playbook", "A playbook authored alongside the build — a deliverable, not a platform feature."),
    ("T1", "Quality gate", "gap", True, "Participation gate", "A minimum-participation floor before any result renders; Comhairle shows Pol.is math live."),
    ("T2", "Quality gate", "gap", True, "Cell suppression floor", "The 11-participant server-side suppression floor is absent from Comhairle's ungated display."),
    ("T3", "Quality gate", "gap", False, "Coverage / representativeness gate", "A coverage threshold before results — Comhairle applies no such gate."),
    ("T4", "Quality gate", "gap", True, "≥25 votes per group", "The 25-votes-per-group floor for a group-level claim has no analog in Comhairle."),
    ("T5", "Quality gate", "gap", True, "Opinion-map stability gate", "CIE blocks an unstable opinion map; Comhairle renders whatever Pol.is returns."),
    ("T6", "Quality gate", "gap", True, "Per-cluster stability gate", "Per-cluster stability gating (sub-headline → directional) is absent from Comhairle."),
    ("T7", "Quality gate", "gap", True, "Per-group Wilson lower bound", "Requiring each group's Wilson 95% lower bound above 0.5 is not enforced by Comhairle."),
    ("T8", "Quality gate", "gap", True, "Bridging / representativeness badge", "The gated badge itself — the claim, not the number — has no Comhairle equivalent."),
    ("T9", "Quality gate", "gap", True, "Claim-type gate", "CIE's pipeline claim-type gate plus scope banner; Comhairle has no claim-discipline gate."),
    ("T10", "Quality gate", "gap", True, "Paraphrase / verbatim-egress gate", "The export-layer block on verbatim text (substituting a paraphrase) is the opposite of Comhairle's verbatim serving."),
    ("M1", "Build core", "partial", False, "Low-friction web entry", "Comhairle offers web entry and codes, but not CIE's proportionate astroturf-integrity layer as specified."),
    ("M2", "Build core", "partial", False, "Consent + AI disclosure", "Comhairle has a consent boolean and AI services; CIE's two unbundled tiers with contact-off default are a stronger form."),
    ("M3", "Build core", "satisfies", True, "Vote elicitation floor", "Vote agree/disagree/pass on seeded + emergent statements — Comhairle's wrapped Pol.is is exactly this spine."),
    ("M4", "Build core", "partial", False, "Instrument as a budget", "Comhairle's HeyForm covers surveys, but not CIE's under-seven-minute ascending-load neutral-wording budget."),
    ("M5", "Build core", "na", False, "Named instrument owner", "Resourcing a named instrument owner — a staffing commitment, not a platform capability."),
    ("M6", "Build core", "gap", True, "Frozen v0 record contract", "CIE's normalized append-only record contract is the seam Comhairle's stub data_model never implements."),
    ("M7", "Build core", "satisfies", True, "Proven analysis core", "PCA→k-means with silhouette-bounded k on response patterns — Comhairle's Pol.is core matches, validated on blind data."),
    ("M8", "Build core", "gap", True, "Validity card with every result", "The validity card has no counterpart in Comhairle's ungated output."),
    ("M9", "Build core", "gap", True, "Local embeddings + one batch call", "Sovereign local embeddings and one scrubbed batch call; Comhairle's per-record external AI is the opposite posture."),
    ("M10", "Build core", "partial", False, "Candidate bridging dashboard", "Comhairle has participation/admin UIs, but not CIE's bridging-ranked candidate dashboard with per-group support beside every label."),
    ("M11", "Build core", "gap", True, "Scope banner + methods note", "The scope-banner claim-discipline surface is absent from Comhairle."),
    ("M12", "Build core", "na", False, "Contract deltas vs signed agreement", "Checking the build against the signed agreement's contract deltas — a governance gate."),
]
COVERAGE_ITEMS = [{"id": i, "area": a, "status": s, "sourced": src, "name": n, "note": note} for (i, a, s, src, n, note) in _COV]

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
        "items": COVERAGE_ITEMS,
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
