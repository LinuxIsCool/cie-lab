// P6 · Ask-the-Constituency — grounded chat-to-query over the P0 artifact.
// The LLM only routes (semantic retrieval) and phrases; the numbers below the
// answer are the real StatementCards from the artifact, rendered by React.
import { useState } from "react";
import { useArtifact, StatementCard } from "../shared";

type AskResult = { question: string; answer: string; citations: string[]; evidence: { id: string; score: number }[] };

const EXAMPLES = [
  "What do people across all groups actually agree on?",
  "Where do the groups disagree most?",
  "Is there real support for prioritizing water infrastructure?",
  "Prove that everyone strongly opposes new taxes.",
];

export default function Ask() {
  const { art, err: artErr } = useArtifact();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<AskResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function ask(question: string) {
    const query = question.trim();
    if (!query || loading) return;
    setQ(query); setLoading(true); setErr(null); setRes(null);
    try {
      const r = await fetch("/api/ask", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: query }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? `HTTP ${r.status}`);
      setRes(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const citedStatements = res && art
    ? res.citations.map((id) => art.statements.find((s) => s.id === id)).filter(Boolean)
    : [];

  return (
    <div className="max-w-3xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Ask your constituency</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P6 · POC #2</span>
        </div>
        <p className="text-sm text-slate-500">Grounded chat-to-query — the AI routes &amp; phrases; every number comes from the votes</p>
      </header>

      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Ask what constituents think…"
            className="flex-1 rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button type="submit" disabled={loading || !q.trim()}
            className="rounded-lg bg-slate-800 text-white text-sm font-medium px-4 py-2 disabled:opacity-40 hover:bg-slate-700">
            {loading ? "Listening…" : "Ask"}
          </button>
        </form>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button key={ex} onClick={() => ask(ex)} disabled={loading}
              className="text-[11px] rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1 disabled:opacity-40">
              {ex}
            </button>
          ))}
        </div>

        {err && <div className="mt-3 text-[13px] text-rose-600">Ask failed: {err} <span className="text-slate-400">(is the ask-server running? <code>cd analysis &amp;&amp; uv run python serve.py</code>)</span></div>}

        {res && (
          <div className="mt-3 rounded-lg bg-slate-50 ring-1 ring-slate-200 p-3">
            <p className="text-[14px] leading-relaxed text-slate-800">{res.answer}</p>
            {res.citations.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400">Grounded in:</span>
                {res.citations.map((id) => (
                  <a key={id} href={`#stmt-${id}`}
                    className="text-[11px] font-semibold rounded bg-blue-50 text-blue-700 ring-1 ring-blue-200 px-1.5 py-0.5 hover:bg-blue-100">
                    {id}
                  </a>
                ))}
              </div>
            )}
            <p className="mt-2 text-[10px] text-slate-400">The AI selected and phrased — it never produced a number. The votes it drew from are shown below.</p>
          </div>
        )}
      </div>

      {/* the actual human votes behind the answer */}
      {citedStatements.length > 0 && art && (
        <div className="mt-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600">The votes behind the answer</h2>
          {citedStatements.map((s) => <StatementCard key={s!.id} s={s!} groups={art.opinion_groups} />)}
        </div>
      )}

      {artErr && <div className="mt-3 text-[13px] text-rose-600">Could not load the artifact for evidence cards: {artErr}</div>}

      <footer className="mt-8 text-[11px] text-slate-400">
        Retrieval + phrasing by free TELUS (e5 embeddings + Gemma) · $0 · grounded strictly in the P0 artifact.
      </footer>
    </div>
  );
}
