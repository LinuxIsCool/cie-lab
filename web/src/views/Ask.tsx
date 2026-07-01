// P6 · Ask-the-Constituency — grounded chat-to-query over the P0 artifact.
// The LLM only routes (semantic retrieval) and phrases; the numbers below the
// answer are the real StatementCards from the artifact, rendered by React.
import { useState } from "react";
import { useArtifact, StatementCard } from "../shared";
import { Commentary, DesignNotes } from "../commentary";

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

      <DesignNotes
        title="How a chat surface stays trustworthy"
        subtitle="P6 is a Wave-2 surface: a thin, grounded layer over P0's gated data. The design question is whether 'ask your results and get a sourced answer' is the candidate's killer surface — without letting the model become the measurement.">
        <Commentary kind="architecture" title="RAG, inverted">
          <p>Ordinary retrieval-augmented generation retrieves <em>text</em> and lets the model synthesize freely. Here the retrieval index is embeddings, but the <strong>payload is verified statistics</strong> — Wilson bounds, GIC, badges. The model's job is narrowed to two things it's genuinely good at: <strong>routing</strong> (which statements bear on this question) and <strong>phrasing</strong>. Everything quantitative is rendered from the artifact by the deterministic layer.</p>
        </Commentary>
        <Commentary kind="principle" title="The guardrail makes it architectural, not aspirational">
          <p>A strict grounding prompt forbids inventing statements or numbers and forces the model to respect each statement's badge. But the deeper protection is structural: the percentages on screen are drawn by the UI from the artifact, so the model <em>literally cannot</em> emit a number that isn't in the evidence. "AI is a listening aid, never the measurement" stops being a promise and becomes a property of the wiring.</p>
        </Commentary>
        <Commentary kind="methodology" title="It respects confidence — and refuses">
          <p>Ask "what do all groups agree on?" and it separates a <em>confirmed</em> bridge from a merely <em>directional</em> one, in words. Ask it to "prove everyone opposes new taxes" and it answers "the evidence does not answer this" — because the votes never said so. A civic answer engine that <strong>declines to manufacture a mandate</strong> is doing the most important thing it can do.</p>
        </Commentary>
        <Commentary kind="design" title="Two free calls, the whole lever">
          <p>Each question is one <strong>embedding</strong> (the query, matched against the statements) plus one <strong>chat</strong> completion (the grounded phrasing) — both on free, local TELUS, $0. The sovereign-LLM lever at full extension: unlimited iteration on the exact interaction a campaign would use, with no per-question cost and no data leaving the machine.</p>
        </Commentary>
        <Commentary kind="perspective" title="Why this might be the killer surface">
          <p>A dashboard asks the candidate to read; a chat surface lets them <em>ask</em>. For a busy campaign, "where do my constituents actually converge on housing?" answered in a sentence, <strong>with the votes attached</strong>, may be the single most compelling way to consume the whole pipeline. P6 tests that hypothesis as a <em>thin</em> layer, so if it wins, it wins cheaply — and if it doesn't, little was spent.</p>
        </Commentary>
        <Commentary kind="goal" title="Every answer is sourced">
          <p>The answer always cites the statements it drew from, and those statements render right below as their real vote cards. That's provenance at the point of use: the reader can go from a sentence of prose to the <strong>human votes behind it</strong> in one glance. Sourced-by-default is what separates a civic answer engine from a chatbot.</p>
        </Commentary>
      </DesignNotes>

      <footer className="mt-8 text-[11px] text-slate-400">
        Retrieval + phrasing by free TELUS (e5 embeddings + Gemma) · $0 · grounded strictly in the P0 artifact.
      </footer>
    </div>
  );
}
