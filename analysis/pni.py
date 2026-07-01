"""P4 · PNI depth — full Participatory Narrative Inquiry over synthetic stories.

Where P0 uses *light* self-coding (two ratings on the universal vote), full PNI
collects actual short stories and has each storyteller self-interpret theirs:
  feeling  (0 negative … 1 positive)
  agency   (0 "the system decides" … 1 "we can shape it")
  time     (past | present | future)
  scope    (personal | community)

"Narrative catalysis" then reads patterns across the self-codes — the emotional
landscape a vote can't reach. This module fabricates a plausible story set
(deterministic) and computes that landscape. Emits cie.pni.v0 -> web/public/pni.json.
"""
from __future__ import annotations
import json, random
from pathlib import Path

# (text, feeling, time, agency, scope) — curated civic micro-stories
STORIES = [
    ("When the bus route was cut, I lost my way to work for a month.", 0.20, "past", 0.20, "personal"),
    ("Neighbors organized a cleanup and the park finally feels ours again.", 0.85, "past", 0.85, "community"),
    ("Nobody told us why the water tasted strange; we just had to guess.", 0.20, "past", 0.15, "community"),
    ("I spoke at the council meeting and they actually changed the plan.", 0.80, "past", 0.90, "personal"),
    ("Every winter the same road floods and nothing ever gets done.", 0.20, "present", 0.20, "community"),
    ("My kid's school added a teacher after parents kept showing up.", 0.80, "past", 0.80, "community"),
    ("I worry the new development will price my family out of here.", 0.25, "future", 0.30, "personal"),
    ("We started a community garden on the empty lot and it's thriving.", 0.90, "present", 0.85, "community"),
    ("The clinic hours got cut and now my mother can't be seen nearby.", 0.15, "present", 0.20, "personal"),
    ("If we invest in transit now, my grandkids will have a real choice.", 0.70, "future", 0.75, "community"),
    ("They rezoned our street overnight and we found out from a sign.", 0.20, "past", 0.15, "community"),
    ("Volunteers keep the food bank running when the county won't.", 0.55, "present", 0.70, "community"),
    ("I've stopped going to meetings; it never changes anything.", 0.20, "present", 0.10, "personal"),
    ("A small grant let us fix the playground ourselves.", 0.80, "past", 0.85, "community"),
    ("The stadium plan feels like it's for someone else, not us.", 0.30, "future", 0.25, "community"),
    ("Our street planted trees together and strangers became neighbors.", 0.85, "past", 0.80, "community"),
    # off-diagonal cases — feeling and agency pulling apart (the interesting ones)
    ("We keep petitioning about the flooding, and I know we'll win eventually.", 0.40, "present", 0.75, "community"),
    ("Losing the library hurt, but neighbors are already organizing to bring it back.", 0.38, "present", 0.72, "community"),
    ("The county fixed our sidewalk; I had nothing to do with it but I'm glad.", 0.70, "past", 0.28, "personal"),
    ("I'm thankful for the new clinic, even though decisions happen without us.", 0.65, "present", 0.30, "community"),
]

# per-group nudges (recovered groups mirror P0's three): grievance / mixed / empowered-future
GROUP_BIAS = {0: (0.00, 0.00), 1: (-0.12, -0.10), 2: (0.08, 0.12)}  # (feeling, agency) shift
GROUP_FUTURE = {0: 0.0, 1: 0.05, 2: 0.18}  # extra chance a story is reframed toward the future


def _clamp(x: float) -> float:
    return round(min(1.0, max(0.0, x)), 3)


def generate(n: int = 52, seed: int = 7) -> list[dict]:
    rng = random.Random(seed)
    out = []
    for i in range(n):
        g = rng.choices([0, 1, 2], weights=[0.36, 0.38, 0.26])[0]
        text, f0, time, a0, scope = rng.choice(STORIES)
        df, da = GROUP_BIAS[g]
        feeling = _clamp(f0 + df + rng.gauss(0, 0.08))
        agency = _clamp(a0 + da + rng.gauss(0, 0.08))
        if time != "future" and rng.random() < GROUP_FUTURE[g]:
            time = "future"
        out.append({"id": f"N{i:03d}", "group": g, "text": text,
                    "feeling": feeling, "agency": agency, "time": time, "scope": scope})
    return out


def catalysis(stories: list[dict]) -> dict:
    n = len(stories)
    def frac(pred) -> int:
        return sum(1 for s in stories if pred(s))

    # quadrants of the feeling × agency landscape
    quadrants = {
        "grievance": frac(lambda s: s["feeling"] < 0.45 and s["agency"] < 0.45),
        "frustrated-but-willing": frac(lambda s: s["feeling"] < 0.45 and s["agency"] >= 0.55),
        "grateful-but-passive": frac(lambda s: s["feeling"] >= 0.55 and s["agency"] < 0.45),
        "empowered": frac(lambda s: s["feeling"] >= 0.55 and s["agency"] >= 0.55),
    }
    # notable cross-cutting patterns (narrative catalysis) — only surface if they carry weight
    candidates = [
        ("Worry about what's coming", frac(lambda s: s["feeling"] < 0.5 and s["time"] == "future"),
         "stories that are negative and about the future — anxiety a yes/no vote would miss"),
        ("Powerlessness", frac(lambda s: s["feeling"] < 0.4 and s["agency"] < 0.35),
         "stories of grievance with little sense that anything can change"),
        ("Pride in community", frac(lambda s: s["feeling"] >= 0.6 and s["scope"] == "community"),
         "positive stories about the community acting together"),
        ("Frustrated, still willing", frac(lambda s: s["feeling"] < 0.45 and s["agency"] >= 0.55),
         "unhappy stories that still carry a sense of agency — people ready to act"),
    ]
    patterns = [{"label": l, "count": c, "note": note} for l, c, note in candidates if c >= 3]
    patterns.sort(key=lambda p: -p["count"])

    # a representative story nearest each quadrant centre (distinct texts)
    centres = {"grievance": (0.2, 0.2), "frustrated-but-willing": (0.2, 0.8),
               "grateful-but-passive": (0.8, 0.2), "empowered": (0.85, 0.85)}
    reps, used = [], set()
    for q, (cx, cy) in centres.items():
        best = min((s for s in stories if s["text"] not in used),
                   key=lambda s: (s["feeling"] - cx) ** 2 + (s["agency"] - cy) ** 2, default=None)
        if best:
            used.add(best["text"])
            reps.append({**best, "quadrant": q})

    return {
        "schema": "cie.pni.v0",
        "meta": {"n_stories": n, "pni_volume_target": "50–100 stories for full PNI"},
        "self_codes": ["feeling", "agency", "time", "scope"],
        "stories": stories,
        "quadrants": quadrants,
        "patterns": patterns,
        "representative": reps,
    }


def build_and_write(seed: int = 7, n: int = 52) -> dict:
    doc = catalysis(generate(n=n, seed=seed))
    out = Path(__file__).resolve().parent.parent / "web" / "public" / "pni.json"
    json.dump(doc, open(out, "w"), indent=2)
    print(f"✓ wrote {out}")
    print(f"  stories={doc['meta']['n_stories']} quadrants={doc['quadrants']} "
          f"patterns={[p['label'] + ':' + str(p['count']) for p in doc['patterns']]}")
    return doc


if __name__ == "__main__":
    build_and_write()
