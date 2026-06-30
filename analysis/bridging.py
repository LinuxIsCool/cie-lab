"""Clean-room Pol.is bridging + light-self-coding overlays → the results artifact.

Pipeline (faithful to CIE's spine, scaled for a POC):
  vote matrix (agree=+1 / disagree=-1 / pass=0)
    -> PCA to 2D (the opinion map)
    -> k-means with k chosen by silhouette over [2..5]  (opinion groups, vote-pattern only)
    -> group-informed consensus (GIC) = product over groups of Laplace-smoothed agree prob
    -> Wilson lower bounds + gated bridging badge (T7/T8)
    -> validity card per statement (counts, smallest group, coverage)
    -> self-code overlays (feeling_heard, view_intensity) cross-tabbed by group, T2-suppressed

The headline metric is bridging; AI never produces these numbers — votes do.
Self-codes ride the universal vote as OVERLAYS and never enter the clustering (preserves
clean-room bridging + "groups from response patterns only").
"""
from __future__ import annotations
import json, math
import numpy as np
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

# Thresholds (single source of truth — scaled for POC N).
T = {
    "min_cell": 11,            # T2 suppression floor
    "min_votes_per_group": 15, # T4 (scaled from 25 for POC)
    "gic_headline": 0.5,       # T7
    "wilson_z": 1.96,
    "k_min": 2, "k_max": 5,
}


def wilson_lower(agrees: int, n: int, z: float = 1.96) -> float:
    if n == 0:
        return 0.0
    p = agrees / n
    denom = 1 + z * z / n
    centre = p + z * z / (2 * n)
    margin = z * math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)
    return max(0.0, (centre - margin) / denom)


def analyze(ds: dict) -> dict:
    parts = ds["participants"]
    stmts = ds["statements"]
    pid_idx = {p["id"]: i for i, p in enumerate(parts)}
    sid_idx = {s["id"]: j for j, s in enumerate(stmts)}
    M = np.zeros((len(parts), len(stmts)), dtype=float)
    VAL = {"agree": 1.0, "disagree": -1.0, "pass": 0.0}
    for v in ds["votes"]:
        M[pid_idx[v["participant_id"]], sid_idx[v["statement_id"]]] = VAL[v["value"]]

    # --- opinion map (PCA 2D) ---
    coords = PCA(n_components=2, random_state=0).fit_transform(M)

    # --- opinion groups (k by silhouette, deterministic seed) ---
    best_k, best_s, best_labels = 2, -1.0, None
    for k in range(T["k_min"], T["k_max"] + 1):
        labels = KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(coords)
        s = silhouette_score(coords, labels)
        if s > best_s:
            best_k, best_s, best_labels = k, s, labels
    labels = best_labels
    groups = sorted(set(labels.tolist()))

    # --- per-statement, per-group agreement + GIC ---
    statements_out = []
    for s in stmts:
        j = sid_idx[s["id"]]
        per_group, gic_factors, group_wilsons, total_seen = [], [], [], 0
        for g in groups:
            rows = np.where(labels == g)[0]
            col = M[rows, j]
            agrees = int((col > 0).sum())
            disagrees = int((col < 0).sum())
            passes = int((col == 0).sum())
            seen = agrees + disagrees
            total_seen += seen
            # Laplace-smoothed agree probability (Pol.is GIC factor)
            p = (agrees + 1) / (seen + 2)
            wl = wilson_lower(agrees, seen, T["wilson_z"])
            gic_factors.append(p)
            group_wilsons.append(wl)
            per_group.append({
                "group": int(g), "agrees": agrees, "disagrees": disagrees,
                "passes": passes, "seen": seen, "agree_rate": round(agrees / seen, 3) if seen else None,
                "wilson_lower": round(wl, 3),
            })
        gic = float(np.prod(gic_factors))
        enough_votes = all(pg["seen"] >= T["min_votes_per_group"] for pg in per_group)
        all_wilson_pass = all(w > 0.5 for w in group_wilsons)
        if gic >= T["gic_headline"] and all_wilson_pass and enough_votes:
            badge = "representative-enough"   # a real, gated bridge
        elif gic >= 0.4 and enough_votes:
            badge = "directional"
        else:
            badge = "below-bar"
        statements_out.append({
            "id": s["id"], "text": s["text"], "tag": s["tag"],
            "gic": round(gic, 4), "badge": badge,
            "per_group": per_group, "total_seen": total_seen,
            "validity": {
                "smallest_group_seen": min(pg["seen"] for pg in per_group),
                "coverage": round(total_seen / (len(parts) * 1.0), 3),
                "groups_meeting_vote_floor": int(sum(pg["seen"] >= T["min_votes_per_group"] for pg in per_group)),
            },
        })
    statements_out.sort(key=lambda x: (x["badge"] != "representative-enough", -x["gic"]))

    # --- opinion groups summary + self-code overlays (T2-suppressed) ---
    groups_out = []
    for g in groups:
        rows = [i for i, l in enumerate(labels) if l == g]
        n = len(rows)
        fh = [parts[i]["feeling_heard"] for i in rows]
        vi = [parts[i]["view_intensity"] for i in rows]
        suppressed = n < T["min_cell"]
        groups_out.append({
            "group": int(g), "size": n,
            "centroid": [round(float(coords[rows, 0].mean()), 3), round(float(coords[rows, 1].mean()), 3)],
            "self_codes": None if suppressed else {
                "feeling_heard_mean": round(float(np.mean(fh)), 3),
                "view_intensity_mean": round(float(np.mean(vi)), 3),
            },
            "suppressed": suppressed,
        })

    points = [{"id": parts[i]["id"], "x": round(float(coords[i, 0]), 3),
               "y": round(float(coords[i, 1]), 3), "group": int(labels[i])} for i in range(len(parts))]

    overall = {
        "feeling_heard_mean": round(float(np.mean([p["feeling_heard"] for p in parts])), 3),
        "view_intensity_mean": round(float(np.mean([p["view_intensity"] for p in parts])), 3),
        "comment_rate": round(sum(1 for p in parts if p["comment"]) / len(parts), 3),
    }

    return {
        "schema": "cie.results.v0",
        "meta": {**ds["meta"], "k_groups_found": best_k, "silhouette": round(float(best_s), 3)},
        "thresholds": T,
        "scope_banner": (
            "Opinion measurement among respondents — not a representative poll. "
            f"{ds['meta']['n_participants']} self-selected participants."
        ),
        "overall_self_codes": overall,
        "opinion_map": {"points": points},
        "opinion_groups": groups_out,
        "statements": statements_out,
        "comments": [{"participant_id": p["id"], "group": int(labels[pid_idx[p["id"]]]),
                      "text": p["comment"]} for p in parts if p["comment"]],
    }


if __name__ == "__main__":
    import sys
    ds = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "data.json"))
    art = analyze(ds)
    json.dump(art, open("artifact.json", "w"), indent=2)
    print(f"k={art['meta']['k_groups_found']} silhouette={art['meta']['silhouette']} "
          f"bridges={sum(1 for s in art['statements'] if s['badge']=='representative-enough')}")
