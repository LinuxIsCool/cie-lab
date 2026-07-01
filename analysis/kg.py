"""P5 · Knowledge-Graph Sensemaking — a position/claim graph over the P0 artifact.

Where P0 clusters *people* by vote pattern, P5 clusters *positions* by meaning:
  statement embeddings (free TELUS e5) -> k-means themes -> Gemma names each theme
  statement<->statement edges by embedding cosine (thematic adjacency)
  voice nodes: each real comment distilled to a short claim (Gemma), linked to its
    nearest statement by embedding, with STANCE taken from that person's actual vote.
A small Fruchterman-Reingold layout (numpy) bakes x/y so the web view is pure SVG.

Listening-aid contract (same as P0/P6): embeddings decide structure, votes decide
stance, and the LLM only labels themes + paraphrases comments — never a number.
Emits cie.kg.v0 -> web/public/kg.json.
"""
from __future__ import annotations
import json, math
from pathlib import Path

import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

import telus

REL_EDGE_MIN = 0.55  # cosine floor for a statement<->statement "related" edge


def _cos_matrix(M: np.ndarray) -> np.ndarray:
    Mn = M / (np.linalg.norm(M, axis=1, keepdims=True) + 1e-9)
    return Mn @ Mn.T


def _pick_k(X: np.ndarray, lo: int = 3, hi: int = 5) -> tuple[int, np.ndarray]:
    hi = min(hi, len(X) - 1)
    best_k, best_s, best_labels = lo, -1.0, None
    for k in range(lo, hi + 1):
        labels = KMeans(n_clusters=k, n_init=10, random_state=0).fit_predict(X)
        s = silhouette_score(X, labels)
        if s > best_s:
            best_k, best_s, best_labels = k, s, labels
    return best_k, best_labels


def _fr_layout(n: int, edges: list[tuple[int, int, float]], iters: int = 320) -> np.ndarray:
    """Deterministic Fruchterman-Reingold. edges = (i, j, attractive_weight)."""
    ang = 2 * math.pi * np.arange(n) / max(n, 1)
    pos = np.stack([np.cos(ang), np.sin(ang)], axis=1) * 0.5
    k = math.sqrt(1.0 / max(n, 1))
    t = 0.1
    for _ in range(iters):
        delta = pos[:, None, :] - pos[None, :, :]          # (n,n,2)
        dist = np.sqrt((delta ** 2).sum(-1)) + 1e-9
        rep = (k * k / dist)[..., None] * (delta / dist[..., None])
        np.einsum("iij->ij", rep)[...] = 0.0               # zero self-repulsion
        disp = rep.sum(axis=1)
        for a, b, w in edges:
            d = pos[a] - pos[b]
            dd = float(np.linalg.norm(d)) + 1e-9
            f = (dd * dd / k) * w
            disp[a] -= d / dd * f
            disp[b] += d / dd * f
        length = np.linalg.norm(disp, axis=1) + 1e-9
        pos += (disp / length[:, None]) * np.minimum(length, t)[:, None]
        t = max(t * 0.97, 0.004)
    mn, mx = pos.min(0), pos.max(0)
    return (pos - mn) / (mx - mn + 1e-9)


def build(ds: dict, art: dict, use_llm: bool = True) -> dict:
    stmts = art["statements"]
    groups = art["opinion_groups"]
    n_groups = len(groups)

    # vote lookup for grounded stance: (pid, sid) -> value
    vote = {(v["participant_id"], v["statement_id"]): v["value"] for v in ds["votes"]}

    # --- embed statements, cluster into themes by MEANING ---
    stmt_texts = [s["text"] for s in stmts]
    S = np.array(telus.embed(stmt_texts, input_type="passage"))
    # civic statements form one diffuse embedding cloud (silhouette stays ~0.05-0.11),
    # so raw silhouette over-rewards singleton themes (k=3 -> [1,11,1]). Constrain to
    # 4-5 for a legible, balanced partition; the honest signal is the edge topology.
    k_themes, theme_labels = _pick_k(S, 4, 5)
    cos = _cos_matrix(S)

    # --- name each theme (Gemma, descriptive only) ---
    theme_names: dict[int, str] = {}
    for t in range(k_themes):
        members = [stmts[i]["text"] for i in range(len(stmts)) if theme_labels[i] == t]
        if use_llm:
            bullets = "\n".join(f"- {m}" for m in members)
            try:
                theme_names[t] = telus.chat(
                    "These civic statements form one theme:\n" + bullets +
                    "\n\nGive a neutral 2-4 word theme name. Name only.",
                    max_tokens=16,
                ).strip().strip('".')
            except Exception:
                theme_names[t] = f"Theme {t + 1}"
        else:
            theme_names[t] = f"Theme {t + 1}"

    # --- nodes ---
    nodes: list[dict] = []
    idx: dict[str, int] = {}

    def add(node: dict) -> int:
        i = len(nodes)
        idx[node["id"]] = i
        nodes.append(node)
        return i

    for t in range(k_themes):
        add({"id": f"T{t}", "type": "theme", "label": theme_names[t], "size": 22})
    for si, s in enumerate(stmts):
        seen = sum(pg["seen"] for pg in s["per_group"])
        add({
            "id": s["id"], "type": "position", "label": s["id"], "text": s["text"],
            "tag": s["tag"], "badge": s["badge"], "gic": s["gic"],
            "theme": int(theme_labels[si]),
            "size": 9 + 7 * (seen / (len(ds["participants"]) or 1)),
            "per_group": s["per_group"],
        })

    # --- voice nodes: distill each unique comment once, link + ground stance ---
    STANCE = {"agree": "supports", "disagree": "challenges", "pass": "neutral"}
    claim_cache: dict[str, str] = {}
    for ci, c in enumerate(art["comments"]):
        text = c["text"]
        if use_llm and text not in claim_cache:
            try:
                claim_cache[text] = telus.chat(
                    f'Paraphrase this resident comment as a neutral claim in <=8 words: "{text}"',
                    max_tokens=24,
                ).strip().strip('".')
            except Exception:
                claim_cache[text] = text
        claim = claim_cache.get(text, text)
        qv = np.array(telus.embed([text], input_type="query")[0])
        sims = (S / (np.linalg.norm(S, axis=1, keepdims=True) + 1e-9)) @ (qv / (np.linalg.norm(qv) + 1e-9))
        near = int(np.argmax(sims))
        near_sid = stmts[near]["id"]
        stance = STANCE.get(vote.get((c["participant_id"], near_sid), "pass"), "neutral")
        add({
            "id": f"V{ci}", "type": "voice", "label": claim, "text": text,
            "group": c["group"], "linked_to": near_sid, "stance": stance, "size": 6,
        })

    # --- edges ---
    edges: list[dict] = []
    lay: list[tuple[int, int, float]] = []

    def edge(a: str, b: str, kind: str, pull: float, **extra) -> None:
        edges.append({"source": a, "target": b, "kind": kind, **extra})
        lay.append((idx[a], idx[b], pull))

    for si, s in enumerate(stmts):                    # theme membership (strong pull)
        edge(f"T{int(theme_labels[si])}", s["id"], "theme-member", 2.4)
    for i in range(len(stmts)):                        # position adjacency (thematic)
        for j in range(i + 1, len(stmts)):
            if cos[i, j] >= REL_EDGE_MIN:
                edge(stmts[i]["id"], stmts[j]["id"], "related", 0.6 * float(cos[i, j]),
                     weight=round(float(cos[i, j]), 3))
    for node in [n for n in nodes if n["type"] == "voice"]:   # voice -> position
        edge(node["id"], node["linked_to"], "voice", 1.2, stance=node["stance"])

    # --- layout (bake x/y) ---
    pos = _fr_layout(len(nodes), lay)
    for i, node in enumerate(nodes):
        node["x"] = round(float(pos[i, 0]), 4)
        node["y"] = round(float(pos[i, 1]), 4)

    return {
        "schema": "cie.kg.v0",
        "meta": {
            "generated_from": "cie.results.v0", "n_nodes": len(nodes), "n_edges": len(edges),
            "n_themes": k_themes, "n_positions": len(stmts),
            "n_voices": sum(1 for n in nodes if n["type"] == "voice"), "n_groups": n_groups,
            "rel_edge_min": REL_EDGE_MIN,
        },
        "themes": [{"id": f"T{t}", "label": theme_names[t],
                    "members": [stmts[i]["id"] for i in range(len(stmts)) if theme_labels[i] == t]}
                   for t in range(k_themes)],
        "group_labels": [g.get("ai_label") for g in groups],
        "nodes": nodes,
        "edges": edges,
    }


def build_and_write(ds: dict, art: dict, use_llm: bool = True) -> dict:
    kg = build(ds, art, use_llm=use_llm)
    out = Path(__file__).resolve().parent.parent / "web" / "public" / "kg.json"
    json.dump(kg, open(out, "w"), indent=2)
    m = kg["meta"]
    print(f"✓ wrote {out}")
    print(f"  themes={m['n_themes']} positions={m['n_positions']} voices={m['n_voices']} "
          f"nodes={m['n_nodes']} edges={m['n_edges']}")
    print(f"  theme names: {[t['label'] for t in kg['themes']]}")
    return kg


if __name__ == "__main__":
    import argparse
    from dataclasses import asdict
    import gen_synthetic, bridging

    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=320)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--no-llm", action="store_true")
    a = ap.parse_args()

    ds = asdict(gen_synthetic.generate(n=a.n, seed=a.seed))
    art = bridging.analyze(ds)
    build_and_write(ds, art, use_llm=not a.no_llm)
