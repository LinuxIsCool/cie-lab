"""Local API for the free-TELUS demos (P6 ask + P3 converse).

stdlib http.server + numpy only. The statement set is embedded ONCE at startup.
The Vite dev server proxies /api -> here (see vite.config.ts), same-origin.

Endpoints:
  POST /api/ask         {q}                 -> P6 grounded answer
  POST /api/facilitate  {history}           -> P3 facilitator's next message
  POST /api/extract     {transcript}        -> P3 positions, each with a verbatim quote

Run:  cd analysis && uv run python serve.py     (listens 127.0.0.1:5181)
"""
from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import ask as ask_mod
import converse

ART = json.load(open(Path(__file__).parent.parent / "web/public/artifact.json"))
RET = ask_mod.Retriever(ART)  # embeds all statements once, up front


class Handler(BaseHTTPRequestHandler):
    def _send(self, code: int, obj: dict) -> None:
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _body(self) -> dict:
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or "{}")

    def do_POST(self) -> None:
        path = self.path.rstrip("/")
        try:
            body = self._body()
        except Exception:
            return self._send(400, {"error": "bad json"})
        try:
            if path == "/api/ask":
                q = (body.get("q") or "").strip()
                if not q:
                    return self._send(400, {"error": "empty question"})
                return self._send(200, ask_mod.answer(q, ART, RET))
            if path == "/api/facilitate":
                return self._send(200, {"message": converse.facilitate(body.get("history") or [])})
            if path == "/api/extract":
                transcript = (body.get("transcript") or "").strip()
                if not transcript:
                    return self._send(400, {"error": "empty transcript"})
                return self._send(200, {"positions": converse.extract(transcript)})
            return self._send(404, {"error": "not found"})
        except Exception as e:  # surface TELUS errors to the UI, don't swallow
            self._send(500, {"error": f"{type(e).__name__}: {e}"})

    def log_message(self, *a) -> None:  # keep the console quiet
        pass


if __name__ == "__main__":
    print(f"ask+converse server on http://127.0.0.1:5181  ·  {len(ART['statements'])} statements embedded")
    ThreadingHTTPServer(("127.0.0.1", 5181), Handler).serve_forever()
