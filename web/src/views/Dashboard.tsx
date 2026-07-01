// P0 · Core listening loop — the candidate dashboard. Reads the cie.results.v0
// artifact and shows bridging statements, opinion map, groups, and comments.
import { useMemo } from "react";
import { useArtifact, groupColor, Meter, OpinionMap, StatementCard } from "../shared";
import { Commentary } from "../commentary";

export default function Dashboard() {
  const { art, err } = useArtifact();
  const bridges = useMemo(() => art?.statements.filter((s) => s.badge === "representative-enough").length ?? 0, [art]);

  if (err) return <div className="p-10 text-rose-600">Failed to load artifact: {err}</div>;
  if (!art) return <div className="p-10 text-slate-400">Loading results…</div>;

  return (
    <div>
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Core listening loop</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P0 · POC #1</span>
        </div>
        <p className="text-sm text-slate-500">Candidate view — the spine every other prototype branches from (synthetic data)</p>
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

      <div className="mb-4">
        <Commentary kind="perspective" title="What you're looking at">
          This is the main dashboard — what a candidate would see after residents respond to a set of statements by
          agreeing, disagreeing, or passing. It's the heart of the whole project; every other demo in this lab is a
          variation on it. Read it top to bottom: the common ground first, then a map of where people stand, then the
          groups themselves and what they said in their own words.
        </Commentary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* statements (the headline) */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600">What constituents agree on, ranked by bridging</h2>
          <div className="space-y-2">
            <Commentary kind="methodology" title="“Bridging” means broad agreement">
              This list is ranked by how well each statement <em>bridges</em> — how well it holds up across
              <em> every</em> group, not just the biggest one. A plain poll would surface whatever 51% want; this
              deliberately promotes what people who disagree can <em>both</em> still accept, because that shared
              ground is what a real decision can stand on.
            </Commentary>
            <Commentary kind="design" title="The badge tells you how sure to be">
              <span className="font-semibold text-emerald-700">Bridges across groups</span> means the agreement is
              strong and statistically solid in every group. <span className="font-semibold text-sky-700">Directional</span>
              is a promising hint that isn't confirmed yet, and <span className="font-semibold text-slate-500">Below bar</span>
              means don't claim agreement. Small groups make percentages jumpy, so the tool only makes the strong claim
              when the math backs it — the fine print (group size, coverage) is the receipts.
            </Commentary>
          </div>
          {art.statements.map((s) => <StatementCard key={s.id} s={s} groups={art.opinion_groups} />)}
        </div>

        {/* right rail */}
        <div className="space-y-5">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Opinion map</h3>
            <OpinionMap art={art} />
            <p className="mt-2 text-[11px] text-slate-400">Each dot is a respondent, placed by how they voted.</p>
          </div>
          <Commentary kind="principle" title="What an 'opinion group' is">
            The tool watches how people vote and sorts them into a few clusters that vote alike — each cluster is an
            "opinion group." It's built from votes only: no names, no demographics, no profiling. The plain-English
            label (like "Essential Public Services") is just the AI's neutral description of what that cluster tends to
            support; the cluster itself is pure math.
          </Commentary>

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
          </div>
          <Commentary kind="methodology" title="“Feeling heard” — a light extra signal">
            Alongside voting, everyone also rates how heard they felt and how strongly they hold their view. It's shown
            here as an overlay but never used to form the groups — so the clusters stay purely about how people voted,
            while you still learn whether the process itself felt fair to people.
          </Commentary>

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
          </div>
          <Commentary kind="perspective" title="Comments stay in people's words">
            Beyond voting, about {(art.overall_self_codes.comment_rate * 100).toFixed(0)}% add an open comment. They're
            shown as-is here on sample data, but with real residents they'd be paraphrased for privacy — you'd get the
            gist, never a quote that could identify someone.
          </Commentary>
        </div>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        AI is a listening aid, never the measurement — every number here comes from human votes.
        Group labels by free TELUS Gemma · embeddings/LLM free &amp; local.
      </footer>
    </div>
  );
}
