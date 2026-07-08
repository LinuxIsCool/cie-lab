// P7 · Hybrid quant+qual: reads two signals together, group by group. P0 keeps
// the votes (quantitative common ground) and the self-codes (how heard people feel)
// in separate panels; this view relates them per opinion group and adds each group's
// own comments, to test whether shared ground and feeling heard travel together.
import { useMemo } from "react";
import { useArtifact, groupColor, Meter } from "../shared";
import { Commentary } from "../commentary";

export default function Hybrid() {
  const { art, err } = useArtifact();

  const rows = useMemo(() => {
    if (!art) return [];
    const bridges = art.statements.filter((s) => s.badge === "representative-enough");
    return art.opinion_groups.map((g) => {
      // common-ground score = this group's average agreement across the shared (bridging) statements
      const rates = bridges
        .map((s) => s.per_group.find((pg) => pg.group === g.group)?.agree_rate)
        .filter((r): r is number => r != null);
      const commonGround = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
      const comments = art.comments.filter((c) => c.group === g.group).slice(0, 2);
      return { g, commonGround, comments };
    });
  }, [art]);

  if (err) return <div className="p-10 text-rose-600">Failed to load artifact: {err}</div>;
  if (!art) return <div className="p-10 text-slate-400">Loading results…</div>;

  return (
    <div className="max-w-4xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Hybrid quant + qual</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P7 · Proof of concept #7</span>
        </div>
        <p className="text-sm text-slate-500">Two signals read together: where people converge, and how the process felt</p>
      </header>

      <div className="mb-5 space-y-2">
        <Commentary kind="perspective" title="What this brings together">
          A listening tool produces two kinds of signal. The <em>quantitative</em> one comes from the votes: how much common ground a group shares with everyone else. The <em>qualitative</em> one comes from the people themselves: how heard they felt, and what they wrote in their own words. This page reads both, group by group.
        </Commentary>
        <Commentary kind="methodology" title="Why read them together">
          Each number answers half the question. A group can share plenty of common ground yet still feel unheard, or feel heard while holding views apart from the rest. Placing the measures side by side surfaces those patterns, and finding them is the case this prototype makes for keeping both.
        </Commentary>
      </div>

      <div className="space-y-3">
        {rows.map(({ g, commonGround, comments }) => (
          <div key={g.group} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between border-l-2 pl-3" style={{ borderColor: groupColor(g.group) }}>
              <span className="text-sm font-semibold text-slate-700">{g.ai_label ?? `Group ${g.group + 1}`}</span>
              <span className="text-xs text-slate-400 tabular-nums">{g.size} people</span>
            </div>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-2">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Quantitative</div>
                <Meter value={commonGround} label="Shares common ground" color={groupColor(g.group)} />
              </div>
              <div className="sm:col-span-2">
                <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Qualitative (self-reported)</div>
                <div className="space-y-1.5">
                  {g.self_codes ? (
                    <>
                      <Meter value={g.self_codes.feeling_heard_mean} label="Feeling heard" color={groupColor(g.group)} />
                      <Meter value={g.self_codes.view_intensity_mean} label="View intensity" color={groupColor(g.group)} />
                    </>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">too small to report</div>
                  )}
                </div>
              </div>
            </div>

            {comments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                {comments.map((c, i) => (
                  <p key={i} className="text-[13px] text-slate-600 italic">“{c.text}”</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <Commentary kind="goal" title="The picture only the pairing gives">
          Common ground tells a candidate where a mandate exists; feeling-heard and the comments tell them where the relationship is strong and where it needs repair. A group that shares the agenda and feels heard is a foundation to build on; one that shares it yet feels unheard is a warning worth acting on early.
        </Commentary>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Same cie.results.v0 artifact as P0, this view derives the common-ground score and pairs it with the self-codes and comments.
      </footer>
    </div>
  );
}
