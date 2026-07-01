// P0 · Core listening loop — the candidate dashboard. Reads the cie.results.v0
// artifact and shows bridging statements, opinion map, groups, and comments.
import { useMemo } from "react";
import { useArtifact, groupColor, Meter, OpinionMap, StatementCard } from "../shared";
import { Commentary, DesignNotes } from "../commentary";

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

      <DesignNotes
        title="Inside the listening loop"
        subtitle="P0 is the trunk — the elicitation-agnostic record contract plus the trust layer everything else plugs into. Here's what each piece is doing and why.">
        <Commentary kind="architecture" title="Clean-room bridging, faithful to Pol.is">
          <p>The spine reimplements Pol.is's insight from first principles: a <strong>vote matrix</strong> (agree +1 / disagree −1 / pass 0) is reduced to a 2-D <strong>opinion map</strong> by PCA, then <strong>k-means</strong> (with <em>k</em> chosen by silhouette) recovers opinion groups from <em>response patterns alone</em>. "Clean-room" means we own the math end-to-end — no black box between the votes and the result — which is exactly what lets us gate, validate, and provenance every number.</p>
        </Commentary>
        <Commentary kind="methodology" title="Group-informed consensus (GIC), not a raw average">
          <p>The headline ranking is a <strong>product across groups</strong> of each group's (Laplace-smoothed) agree probability. Why a product and not a mean? Because a statement should only rank as <em>bridging</em> if <strong>every</strong> group tends to agree — one dissenting cluster drags the product down hard. This is the anti-majoritarian core: it surfaces what unites a divided community, not what a plurality wants imposed on the rest.</p>
        </Commentary>
        <Commentary kind="design" title="Wilson bounds + gated badges = small-sample honesty">
          <p>Agreement rates from small groups are noisy, so a raw percentage would overclaim. Each group's support is wrapped in a <strong>Wilson lower bound</strong>, and a statement only earns <span className="font-semibold text-emerald-700">representative-enough</span> when GIC clears the bar <em>and</em> every group's lower bound clears 50% <em>and</em> each group met a vote floor. Otherwise it's <span className="font-semibold text-sky-700">directional</span> (suggestive) or <span className="font-semibold text-slate-500">below bar</span>. The badge is a promise about <em>confidence</em>, not just magnitude.</p>
        </Commentary>
        <Commentary kind="choice" title="The validity card is the trust layer">
          <p>Every statement carries its own receipts — <strong>coverage</strong>, <strong>smallest-group-seen</strong>, and how many groups met the vote floor — and any cell below the suppression threshold is hidden rather than shown thin. For a civic instrument this is the difference between a tool an opponent can attack and one that survives scrutiny. We chose to make the limits <em>visible</em> instead of hoping no one asks.</p>
        </Commentary>
        <Commentary kind="perspective" title="Scope is a legitimacy statement, not a disclaimer">
          <p>The banner up top says plainly: this is <strong>opinion measurement among self-selected respondents</strong>, not a representative poll. Framing that honestly <em>strengthens</em> the read — it tells the audience exactly what claim is and isn't being made, so the claims that <em>are</em> made land harder. Overclaiming representativeness is the classic way civic-tech loses trust; naming the scope is how you keep it.</p>
        </Commentary>
        <Commentary kind="methodology" title="Light self-coding — PNI depth without PNI cost">
          <p>Two universal self-codes — <strong>feeling-heard</strong> and <strong>view-intensity</strong> — ride the full-N vote as <em>overlays</em>. Full Participatory Narrative Inquiry (Kurtz) wants 50–100 stories to code; a campaign pilot yields far fewer, so we take the <strong>light</strong> path: a whole-population signal that never depends on the rare free-text. Crucially, self-codes <em>never enter the clustering</em> — groups stay purely vote-derived, preserving the clean-room read while still capturing "did people feel heard?"</p>
        </Commentary>
        <Commentary kind="goal" title="Close the loop: 'you were heard'">
          <p>The highest-leverage addition on the roadmap is the <strong>participant return</strong> — showing a respondent that their input landed in the shared picture. Listening that never reports back isn't listening. Promoting this toward a MUST is what turns a measurement tool into a genuine <em>civic relationship</em>, and it's why "feeling heard" is measured at all.</p>
        </Commentary>
        <Commentary kind="principle" title="Groups from votes only — no demographics, AI only labels">
          <p>Opinion groups are discovered from <strong>how people voted</strong>, never from who they are — no demographic inputs, no profiling. The AI's <em>only</em> job here is to read each group's strongest agreements and offer a neutral, descriptive <strong>label</strong>. Those labels are cosmetic; delete them and the groups, sizes, and every number are unchanged. That's the listening-aid principle made concrete on this page.</p>
        </Commentary>
      </DesignNotes>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        AI is a listening aid, never the measurement — every number here comes from human votes.
        Group labels by free TELUS Gemma · embeddings/LLM free &amp; local.
      </footer>
    </div>
  );
}
