"""P6 ask-server — tiny local API: POST /api/ask {q} -> grounded answer.

stdlib http.server + numpy only. Embeds the statement set ONCE at startup (free
TELUS), so each request is one query-embed + one Gemma call. The Vite dev server
proxies /api -> here (see vite.config.ts), so the browser sees a same-origin API.

Run:  cd analysis && uv run python serve.py     (listens 127.0.0.1:5181)
"""
from __future__ import annotations
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import ask as ask_mod

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

    def do_POST(self) -> None:
        if self.path.rstrip("/") != "/api/ask":
            return self._send(404, {"error": "not found"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            q = (json.loads(self.rfile.read(n) or "{}").get("q") or "").strip()
        except Exception:
            return self._send(400, {"error": "bad json"})
        if not q:
            return self._send(400, {"error": "empty question"})
        try:
            self._send(200, ask_mod.answer(q, ART, RET))
        except Exception as e:  # surface TELUS/embedding errors to the UI, don't swallow
            self._send(500, {"error": f"{type(e).__name__}: {e}"})

    def log_message(self, *a) -> None:  # keep the console quiet
        pass


if __name__ == "__main__":
    print(f"P6 ask-server on http://127.0.0.1:5181  ·  {len(ART['statements'])} statements embedded")
    ThreadingHTTPServer(("127.0.0.1", 5181), Handler).serve_forever()
