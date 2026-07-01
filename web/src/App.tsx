import { useEffect, useMemo, useState } from "react";

// ---- types (loose mirror of the cie.results.v0 artifact) -------------------
type PerGroup = { group: number; agrees: number; disagrees: number; passes: number; seen: number; agree_rate: number | null; wilson_lower: number };
type Statement = { id: string; text: string; tag: string; gic: number; badge: string; per_group: PerGroup[]; validity: { smallest_group_seen: number; coverage: number; groups_meeting_vote_floor: number } };
type Group = { group: number; size: number; centroid: [number, number]; self_codes: { feeling_heard_mean: number; view_intensity_mean: number } | null; suppressed: boolean; ai_label?: string | null };
type Artifact = {
  meta: { n_participants: number; k_groups_found: number; silhouette: number };
  scope_banner: string;
  overall_self_codes: { feeling_heard_mean: number; view_intensity_mean: number; comment_rate: number };
  opinion_map: { points: { id: string; x: number; y: number; group: number }[] };
  opinion_groups: Group[];
  statements: Statement[];
  comments: { participant_id: string; group: number; text: string }[];
};

const GROUP_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777"];
const groupColor = (g: number) => GROUP_COLORS[g % GROUP_COLORS.length];

const BADGE: Record<string, { label: string; cls: string }> = {
  "representative-enough": { label: "Bridges across groups", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  directional: { label: "Directional", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
  "below-bar": { label: "Below bar", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function Meter({ value, label, color = "#2563eb" }: { value: number; label: string; color?: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span><span className="tabular-nums font-medium text-slate-700">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

function OpinionMap({ art }: { art: Artifact }) {
  const pts = art.opinion_map.points;
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = 320, H = 240, pad = 18;
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad);
  const sy = (y: number) => pad + ((maxY - y) / (maxY - minY || 1)) * (H - 2 * pad);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-slate-50 ring-1 ring-slate-200">
      {pts.map((p) => (
        <circle key={p.id} cx={sx(p.x)} cy={sy(p.y)} r={2.6} fill={groupColor(p.group)} fillOpacity={0.5} />
      ))}
      {art.opinion_groups.map((g) => (
        <g key={g.group}>
          <circle cx={sx(g.centroid[0])} cy={sy(g.centroid[1])} r={6} fill={groupColor(g.group)} stroke="#fff" strokeWidth={2} />
        </g>
      ))}
    </svg>
  );
}

// ---- P6: ask your constituency (grounded query over the artifact) ----------
type AskResult = { question: string; answer: string; citations: string[]; evidence: { id: string; score: number }[] };

const EXAMPLES = [
  "What do people across all groups actually agree on?",
  "Where do the groups disagree most?",
  "Is there real support for prioritizing water infrastructure?",
];

function highlightCard(id: string) {
  const el = document.getElementById(`stmt-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("ring-2", "ring-blue-400");
  setTimeout(() => el.classList.remove("ring-2", "ring-blue-400"), 1600);
}

function AskPanel() {
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

  return (
    <div className="mb-5 rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-sm font-semibold text-slate-700">Ask your constituency</h2>
        <span className="text-[11px] font-normal text-slate-400">— grounded in the votes, answered by free local AI</span>
      </div>
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
                <button key={id} onClick={() => highlightCard(id)}
                  className="text-[11px] font-semibold rounded bg-blue-50 text-blue-700 ring-1 ring-blue-200 px-1.5 py-0.5 hover:bg-blue-100">
                  {id}
                </button>
              ))}
            </div>
          )}
          <p className="mt-2 text-[10px] text-slate-400">The AI selected and phrased — it never produced a number. Click a citation to see the human votes behind it.</p>
        </div>
      )}
    </div>
  );
}

function StatementCard({ s, groups }: { s: Statement; groups: Group[] }) {
  const b = BADGE[s.badge] ?? BADGE["below-bar"];
  return (
    <div id={`stmt-${s.id}`} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm scroll-mt-4 transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] leading-snug text-slate-800 font-medium">{s.text}</p>
        <span className={`shrink-0 text-[11px] font-semibold px-2 py-1 rounded-full ring-1 ${b.cls}`}>{b.label}</span>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-1.5">
        {s.per_group.map((pg) => (
          <div key={pg.group} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: groupColor(pg.group) }} />
            <span className="text-xs text-slate-500 w-28 truncate">{groups.find((g) => g.group === pg.group)?.ai_label ?? `Group ${pg.group + 1}`}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(pg.agree_rate ?? 0) * 100}%`, background: groupColor(pg.group), opacity: 0.85 }} />
            </div>
            <span className="text-xs tabular-nums text-slate-600 w-9 text-right">{pg.agree_rate != null ? `${(pg.agree_rate * 100).toFixed(0)}%` : "—"}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
        <span>GIC <span className="tabular-nums text-slate-600 font-medium">{s.gic.toFixed(2)}</span></span>
        <span>·</span>
        <span>smallest group n={s.validity.smallest_group_seen}</span>
        <span>·</span>
        <span>coverage {(s.validity.coverage * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function App() {
  const [art, setArt] = useState<Artifact | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch("/artifact.json").then((r) => r.json()).then(setArt).catch((e) => setErr(String(e)));
  }, []);

  const bridges = useMemo(() => art?.statements.filter((s) => s.badge === "representative-enough").length ?? 0, [art]);

  if (err) return <div className="p-10 text-rose-600">Failed to load artifact: {err}</div>;
  if (!art) return <div className="p-10 text-slate-400">Loading results…</div>;

  return (
    <div className="max-w-6xl mx-auto px-5 py-6">
      {/* header */}
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Civic Intelligence Engine</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">LAB · POC #1</span>
        </div>
        <p className="text-sm text-slate-500">Core listening loop — candidate view (synthetic data)</p>
      </header>

      {/* scope banner — legitimacy statement, not a disclaimer */}
      <div className="mb-5 rounded-lg bg-amber-50 ring-1 ring-amber-200 px-4 py-2.5 text-[13px] text-amber-900">
        <span className="font-semibold">Scope:</span> {art.scope_banner}
      </div>

      {/* summary strip */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          ["Respondents", art.meta.n_participants],
          ["Opinion groups", art.meta.k_groups_found],
          ["Bridging statements", bridges],
          ["Feeling heard", `${(art.overall_self_codes.feeling_heard_mean * 100).toFixed(0)}%`],
          ["Left a comment", `${(art.overall_self_codes.comment_rate * 100).toFixed(0)}%`],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl bg-white ring-1 ring-slate-200 px-3.5 py-3 shadow-sm">
            <div className="text-2xl font-bold tabular-nums">{v}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{k}</div>
          </div>
        ))}
      </div>

      {/* P6 — ask your constituency (chat-to-query, free local AI) */}
      <AskPanel />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* statements (the headline) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 flex items-center gap-2">
            What constituents agree on, ranked by bridging
            <span className="text-[11px] font-normal text-slate-400">— statements every group can accept rank highest</span>
          </h2>
          {art.statements.map((s) => <StatementCard key={s.id} s={s} groups={art.opinion_groups} />)}
        </div>

        {/* right rail */}
        <div className="space-y-5">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Opinion map</h3>
            <OpinionMap art={art} />
            <p className="mt-2 text-[11px] text-slate-400">Each dot is a respondent, placed by how they voted. Clusters = opinion groups (vote patterns only — no demographics).</p>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 mb-3">Opinion groups</h3>
            <div className="space-y-3">
              {art.opinion_groups.map((g) => (
                <div key={g.group} className="border-l-2 pl-3" style={{ borderColor: groupColor(g.group) }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{g.ai_label ?? `Group ${g.group + 1}`}</span>
                    <span className="text-xs text-slate-400 tabular-nums">{g.size} people</span>
                  </div>
                  {g.ai_label && <div className="text-[10px] text-slate-400 mb-1.5">AI-labeled · descriptive only</div>}
                  {g.self_codes ? (
                    <div className="space-y-1.5 mt-1.5">
                      <Meter value={g.self_codes.feeling_heard_mean} label="Feeling heard" color={groupColor(g.group)} />
                      <Meter value={g.self_codes.view_intensity_mean} label="View intensity" color={groupColor(g.group)} />
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">suppressed (group too small to report)</div>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">"Feeling heard" &amp; "intensity" are <span className="font-medium">light self-codes</span> — answered by every respondent, shown as overlays. They never enter the clustering.</p>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">In their words</h3>
            <div className="space-y-2">
              {art.comments.slice(0, 5).map((c, i) => (
                <div key={i} className="text-[13px] text-slate-600 italic flex gap-2">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: groupColor(c.group) }} />
                  <span>"{c.text}"</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">~{(art.overall_self_codes.comment_rate * 100).toFixed(0)}% leave a comment. In production these are paraphrased, never verbatim.</p>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        AI is a listening aid, never the measurement — every number here comes from human votes.
        Group labels by free TELUS Gemma · embeddings/LLM free &amp; local.
      </footer>
    </div>
  );
}
