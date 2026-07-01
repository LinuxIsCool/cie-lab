"""P3 · Conversational elicitation — a neutral AI facilitator + DEFENSIBLE synthesis.

Two jobs, both on free TELUS Gemma:
  facilitate(history) -> the facilitator's next short, open, non-leading question.
  extract(transcript) -> positions the resident expressed, each with a VERBATIM quote.

The defensibility guardrail: extract() keeps a position only if its supporting quote
literally appears in the resident's words (substring check). The LLM may paraphrase and
organize, but it cannot attribute a view the resident didn't actually say. The resident
then confirms before anything counts — AI phrases, the human is the measurement.
"""
from __future__ import annotations
import json, re
import telus

FACILITATOR = (
    "You are a neutral community facilitator gathering one resident's views for a local "
    "listening project. Ask ONE short, open, non-leading question at a time (one sentence) "
    "to understand what they care about in their community and why. Never suggest opinions, "
    "never agree or disagree, never propose answers. If they've shared a few substantive "
    "things, warmly invite anything else and hint they can wrap up."
)


def _render(history: list[dict]) -> str:
    return "\n".join(
        f"{'Facilitator' if m.get('role') == 'facilitator' else 'Resident'}: {m.get('content', '')}"
        for m in history
    )


def facilitate(history: list[dict]) -> str:
    if not history:
        prompt = (FACILITATOR + "\n\nWrite a warm one-sentence opening question to begin.")
    else:
        prompt = (
            FACILITATOR + "\n\nConversation so far:\n" + _render(history) +
            "\n\nWrite the facilitator's next message (one short question, or a brief warm wrap-up):"
        )
    return telus.chat(prompt, max_tokens=80, temperature=0.5).strip()


def _parse_array(raw: str) -> list[dict]:
    i, j = raw.find("["), raw.rfind("]")
    if i == -1 or j == -1 or j < i:
        return []
    try:
        val = json.loads(raw[i:j + 1])
        return val if isinstance(val, list) else []
    except Exception:
        return []


_norm = lambda s: re.sub(r"\s+", " ", (s or "")).strip().lower()


def extract(transcript: str) -> list[dict]:
    prompt = (
        "A resident shared these words in a community listening chat:\n\n"
        f'"""\n{transcript}\n"""\n\n'
        "Extract up to 4 distinct positions the resident expressed. For EACH position give:\n"
        '  "position": a short neutral paraphrase (<= 12 words)\n'
        '  "quote": the EXACT verbatim words from the resident that support it (copy them; do not reword)\n'
        "Only include a position if a real quote from the text supports it. "
        "If they said nothing substantive, return an empty array.\n"
        "Return ONLY a JSON array of objects."
    )
    raw = telus.chat(prompt, max_tokens=400, temperature=0.1)
    tnorm = _norm(transcript)
    out = []
    for it in _parse_array(raw):
        if not isinstance(it, dict):
            continue
        quote = str(it.get("quote", ""))
        # defensibility: the quote must literally be in the resident's words
        grounded = bool(_norm(quote)) and _norm(quote) in tnorm
        out.append({"position": str(it.get("position", "")).strip(), "quote": quote.strip(), "grounded": grounded})
    return out
