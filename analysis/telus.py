"""Tiny free-TELUS client (sovereign, $0) — OpenAI-compatible REST.

Reads ~/.claude/local/secrets/telus-api.env. Two capabilities used by the lab:
  - embed(texts, input_type)  -> list[list[float]]   (nvidia/nv-embedqa-e5-v5, 1024-dim)
  - chat(prompt|messages)     -> str                  (TELUS Gemma, free)

Gotcha worth remembering: the e5 embedding model is *asymmetric* (NVIDIA NIM) and
REQUIRES an `input_type` of "query" or "passage" — omitting it returns HTTP 400.
"""
from __future__ import annotations
import json, os, re, urllib.request, urllib.error
from pathlib import Path

_ENV_CACHE: dict[str, str] | None = None


def _env() -> dict[str, str]:
    global _ENV_CACHE
    if _ENV_CACHE is None:
        out: dict[str, str] = {}
        p = Path.home() / ".claude/local/secrets/telus-api.env"
        for line in p.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
        _ENV_CACHE = out
    return _ENV_CACHE


def _base_v1(url: str) -> str:
    url = url.rstrip("/")
    m = re.search(r"/v1(?=/|$)", url)
    return url[: m.start() + 3] if m else url + "/v1"


def _post(url: str, key: str, payload: dict, timeout: int = 60) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def embed(texts: list[str], input_type: str = "passage") -> list[list[float]]:
    """Free TELUS embeddings. input_type must be 'query' or 'passage'."""
    e = _env()
    url = _base_v1(e["TELUS_EMBED_URL"]) + "/embeddings"
    out = _post(url, e["TELUS_EMBED_KEY"], {
        "model": e.get("TELUS_EMBED_MODEL", "nvidia/nv-embedqa-e5-v5"),
        "input": texts,
        "input_type": input_type,
    })
    return [d["embedding"] for d in out["data"]]


def chat(prompt: str | list[dict], max_tokens: int = 256, temperature: float = 0.2) -> str:
    """Free TELUS Gemma chat completion."""
    e = _env()
    msgs = [{"role": "user", "content": prompt}] if isinstance(prompt, str) else prompt
    url = _base_v1(e["TELUS_GEMMA_URL"]) + "/chat/completions"
    out = _post(url, e["TELUS_GEMMA_KEY"], {
        "model": e.get("TELUS_GEMMA_MODEL", "gemma"),
        "messages": msgs,
        "max_tokens": max_tokens,
        "temperature": temperature,
    })
    return out["choices"][0]["message"]["content"].strip()


if __name__ == "__main__":
    print("embed dim:", len(embed(["traffic and new development"])[0]))
    print("chat:", chat("In 5 words: what is bridging?"))
