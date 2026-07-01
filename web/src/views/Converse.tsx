// P3 · Conversational elicitation — chat with a neutral AI facilitator, then a
// DEFENSIBLE synthesis: every position the AI extracts must quote your exact words
// (server-validated), and you confirm before anything counts. Talks to the
// /api/facilitate + /api/extract endpoints (see analysis/converse.py).
import { useEffect, useRef, useState } from "react";
import { Commentary } from "../commentary";

type Msg = { role: "facilitator" | "resident"; content: string };
type Pos = { position: string; quote: string; grounded: boolean };

async function post(path: string, payload: unknown) {
  const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
  return data;
}

export default function Converse() {
  const [history, setHistory] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [positions, setPositions] = useState<Pos[] | null>(null);
  const [synthing, setSynthing] = useState(false);
  const [synthErr, setSynthErr] = useState<string | null>(null);
  const [included, setIncluded] = useState<Record<number, boolean>>({});
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    setBusy(true);
    post("/api/facilitate", { history: [] })
      .then((r) => setHistory([{ role: "facilitator", content: r.message }]))
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setBusy(false));
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    const next: Msg[] = [...history, { role: "resident", content: text }];
    setHistory(next); setInput(""); setBusy(true); setErr(null);
    try {
      const r = await post("/api/facilitate", { history: next });
      setHistory((h) => [...h, { role: "facilitator", content: r.message }]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }

  async function synthesize() {
    const transcript = history.filter((m) => m.role === "resident").map((m) => m.content).join("\n");
    setSynthing(true); setSynthErr(null); setPositions(null);
    try {
      const r = await post("/api/extract", { transcript });
      const ps: Pos[] = r.positions;
      setPositions(ps);
      setIncluded(Object.fromEntries(ps.map((p, i) => [i, p.grounded])));
    } catch (e) {
      setSynthErr(e instanceof Error ? e.message : String(e));
    } finally { setSynthing(false); }
  }

  const residentTurns = history.filter((m) => m.role === "resident").length;
  const confirmedCount = positions ? positions.filter((_, i) => included[i]).length : 0;

  return (
    <div className="max-w-3xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Conversational elicitation</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P3 · POC #6</span>
        </div>
        <p className="text-sm text-slate-500">Talk instead of vote — then the AI reflects back what you said, in your own words</p>
      </header>

      <div className="mb-4 space-y-2">
        <Commentary kind="design" title="A different way in">
          Some people will never fill out a survey but will happily talk. Here a neutral facilitator asks open questions — no pre-written statements, no agree/disagree — and gathers your views in your own words.
        </Commentary>
        <Commentary kind="caveat" title="This is the governance edge">
          Free-text goes to a language model to run this. On synthetic data that's free and fine — but with real residents this is exactly the step that needs consent and a data-governance gate. The demo makes that cost visible on purpose.
        </Commentary>
      </div>

      {/* chat */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
        <div className="space-y-2.5 min-h-[120px]">
          {history.map((m, i) => (
            <div key={i} className={`flex ${m.role === "resident" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-snug ${
                m.role === "resident" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"}`}>
                {m.content}
              </div>
            </div>
          ))}
          {busy && <div className="text-[12px] text-slate-400 italic">facilitator is thinking…</div>}
          {err && <div className="text-[13px] text-rose-600">Chat failed: {err} <span className="text-slate-400">(is the server running?)</span></div>}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-3 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type what's on your mind…"
            className="flex-1 rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
          <button type="submit" disabled={busy || !input.trim()}
            className="rounded-lg bg-slate-800 text-white text-sm font-medium px-4 py-2 disabled:opacity-40 hover:bg-slate-700">Send</button>
        </form>
      </div>

      {residentTurns >= 2 && (
        <div className="mt-4 flex items-center gap-3">
          <button onClick={synthesize} disabled={synthing}
            className="rounded-lg bg-blue-600 text-white text-sm font-medium px-4 py-2 disabled:opacity-40 hover:bg-blue-700">
            {synthing ? "Reflecting back…" : "Reflect back what I shared →"}
          </button>
          <span className="text-[12px] text-slate-400">the AI extracts positions, each tied to your exact words</span>
        </div>
      )}

      {synthErr && <div className="mt-3 text-[13px] text-rose-600">Synthesis failed: {synthErr}</div>}

      {positions && (
        <div className="mt-5">
          <div className="space-y-2 mb-3">
            <Commentary kind="principle" title="Defensible synthesis — your words, not the AI's">
              Every position below quotes something you actually said, and the server checked that the quote really appears in your words. Anything the AI couldn't ground was dropped, not shown.
            </Commentary>
            <Commentary kind="goal" title="You stay in control">
              Nothing counts until you confirm it. Untick anything the AI got wrong — you decide what becomes part of your input, not the model.
            </Commentary>
          </div>

          <h2 className="text-sm font-semibold text-slate-600 mb-2">What the AI heard <span className="text-[11px] font-normal text-slate-400">— {confirmedCount} of {positions.length} confirmed</span></h2>
          <div className="space-y-2">
            {positions.map((p, i) => (
              p.grounded ? (
                <label key={i} className="flex items-start gap-3 rounded-xl bg-white ring-1 ring-slate-200 p-3.5 shadow-sm cursor-pointer">
                  <input type="checkbox" checked={!!included[i]} onChange={(e) => setIncluded((s) => ({ ...s, [i]: e.target.checked }))}
                    className="mt-0.5 accent-blue-600" />
                  <div>
                    <p className="text-[14px] text-slate-800 font-medium">{p.position}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">your words: <span className="text-slate-500 italic">“{p.quote}”</span></p>
                  </div>
                </label>
              ) : (
                <div key={i} className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-3.5">
                  <p className="text-[13px] text-slate-400 line-through">{p.position}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Dropped — the AI's quote couldn't be found in your words, so it wasn't recorded.</p>
                </div>
              )
            ))}
            {positions.length === 0 && <p className="text-[13px] text-slate-400">Nothing substantive to extract yet — say a bit more and try again.</p>}
          </div>
        </div>
      )}

      <footer className="mt-8 text-[11px] text-slate-400">
        Facilitator + extraction by free TELUS Gemma · $0 · quotes validated against your words server-side.
      </footer>
    </div>
  );
}
