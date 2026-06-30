"""Synthetic constituent-listening dataset for POC #1 (the core listening loop).

Models the CIE instrument honestly:
  - N respondents, drawn from K latent opinion groups (the ground truth we recover).
  - Each respondent votes agree/disagree/pass on a set of curated statements; their
    vote probabilities depend on their latent group (so opinion structure is real).
  - A *bridging* subset of statements is constructed to be broadly agreeable across
    groups (the signal the candidate wants), alongside polarizing and niche ones.
  - Light self-coding (PNI): every respondent answers two universal session-level
    self-codes — `feeling_heard` (0-1) and `view_intensity` (0-1) — that ride the
    universal vote (full N), NOT the rare free-text. ~12% leave an optional comment.

Deterministic given a seed (reproducible across machines/CI).
"""
from __future__ import annotations
import argparse, json, random
from dataclasses import dataclass, field, asdict

# ---- The civic content (NC-12-flavored, synthetic) -------------------------
# tag: 'bridge' (broadly agreeable), 'wedge' (polarizing), 'niche' (small group)
STATEMENTS = [
    ("Traffic impact should be weighed before approving new developments.", "bridge"),
    ("Public school funding should keep pace with enrollment growth.", "bridge"),
    ("Residents deserve clear, plain-language notice before zoning changes.", "bridge"),
    ("Local emergency services need reliable funding regardless of the budget cycle.", "bridge"),
    ("Clean drinking water infrastructure should be a top spending priority.", "bridge"),
    ("Property taxes should be cut even if it reduces public services.", "wedge"),
    ("New apartment density downtown is good for the community.", "wedge"),
    ("The county should expand bus service even if ridership starts low.", "wedge"),
    ("Short-term rentals should be tightly restricted in residential areas.", "wedge"),
    ("A new sports stadium is worth public subsidy.", "wedge"),
    ("Backyard chickens should be allowed in all neighborhoods.", "niche"),
    ("The old mill site should become an arts district, not retail.", "niche"),
    ("Speed bumps should be added on Elm Street specifically.", "niche"),
]

COMMENTS = [
    "I just want my kids' school to have enough teachers.",
    "Traffic on the main road is already unbearable at rush hour.",
    "Please don't raise my taxes, I'm on a fixed income.",
    "We need more housing people can actually afford.",
    "The water tasted off last summer and nobody told us why.",
    "Buses would help my mom who can't drive anymore.",
    "I love the idea of an arts district downtown.",
]


@dataclass
class Dataset:
    meta: dict
    statements: list[dict]
    participants: list[dict]
    votes: list[dict] = field(default_factory=list)


def generate(n: int = 320, k_groups: int = 3, seed: int = 7) -> Dataset:
    rng = random.Random(seed)
    statements = [{"id": f"S{i:02d}", "text": t, "tag": tag} for i, (t, tag) in enumerate(STATEMENTS)]

    # Per-group base agreement probability for each statement.
    # bridge: high across all groups; wedge: split by group; niche: high for one group only.
    def probs(tag: str, gi: int) -> float:
        if tag == "bridge":
            return rng.uniform(0.72, 0.9)
        if tag == "wedge":
            return [0.78, 0.22, 0.5][gi % 3] + rng.uniform(-0.08, 0.08)
        # niche: group 2 cares, others don't
        return (0.8 if gi == k_groups - 1 else 0.2) + rng.uniform(-0.06, 0.06)

    participants, votes = [], []
    for p in range(n):
        gi = rng.choices(range(k_groups), weights=[0.4, 0.38, 0.22][:k_groups])[0]
        pid = f"P{p:03d}"
        # light self-coding (universal): feeling_heard + view_intensity
        feeling_heard = round(min(1.0, max(0.0, rng.gauss(0.62, 0.18))), 3)
        view_intensity = round(min(1.0, max(0.0, rng.gauss([0.7, 0.55, 0.5][gi], 0.18))), 3)
        comment = rng.choice(COMMENTS) if rng.random() < 0.12 else None
        participants.append({
            "id": pid, "latent_group": gi,
            "feeling_heard": feeling_heard, "view_intensity": view_intensity,
            "comment": comment,
        })
        for s in statements:
            r = rng.random()
            if r < 0.12:  # genuine pass/not-sure on ~12% of items
                val = "pass"
            else:
                pa = max(0.02, min(0.98, probs(s["tag"], gi)))
                val = "agree" if rng.random() < pa else "disagree"
            votes.append({"participant_id": pid, "statement_id": s["id"], "value": val})

    meta = {"n_participants": n, "k_groups_true": k_groups, "seed": seed,
            "n_statements": len(statements), "n_votes": len(votes)}
    return Dataset(meta=meta, statements=statements, participants=participants, votes=votes)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=320)
    ap.add_argument("--seed", type=int, default=7)
    ap.add_argument("--out", default="data.json")
    a = ap.parse_args()
    ds = generate(n=a.n, seed=a.seed)
    json.dump(asdict(ds), open(a.out, "w"), indent=2)
    print(f"wrote {a.out}: {ds.meta}")
