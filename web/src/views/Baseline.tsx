// P2 · Classic Pol.is Baseline — the control. Same cie.results.v0 artifact as P0,
// rendered the plain vote-only way: opinion map + consensus/divisive statements,
// groups as "A/B/C" (no AI labels), NO self-codes, NO free-text, NO validity framing.
// The point is the diff with P0 — what do the extra layers actually add?
import { useMemo } from "react";
import { useArtifact, groupColor, OpinionMap, type Statement } from "../shared";
import { Commentary } from "../commentary";

const letter = (g: number) => String.fromCharCode(65 + g);

function spread(s: Statement): number {
  const rs = s.per_group.map((p) => p.agree_rate).filter((r): r is number => r != null);
  return rs.length ? Math.max(...rs) - Math.min(...rs) : 0;
}
function overallAgree(s: Statement): number {
  const a = s.per_group.reduce((n, p) => n + p.agrees, 0);
  const seen = s.per_group.reduce((n, p) => n + p.seen, 0);
  return seen ? a / seen : 0;
}

function Row({ s }: { s: Statement }) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] leading-snug text-slate-800 font-medium">{s.text}</p>
        <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{(overallAgree(s) * 100).toFixed(0)}% agree</span>
      </div>
      <div className="mt-2.5 space-y-1">
        {s.per_group.map((pg) => (
          <div key={pg.group} className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 w-4">{letter(pg.group)}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(pg.agree_rate ?? 0) * 100}%`, background: groupColor(pg.group), opacity: 0.85 }} />
            </div>
            <span className="text-[11px] tabular-nums text-slate-500 w-8 text-right">{pg.agree_rate != null ? `${(pg.agree_rate * 100).toFixed(0)}%` : "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Baseline() {
  const { art, err } = useArtifact();

  const { consensus, divisive } = useMemo(() => {
    if (!art) return { consensus: [] as Statement[], divisive: [] as Statement[] };
    const consensus = art.statements
      .filter((s) => s.badge === "representative-enough" || s.badge === "directional")
      .sort((a, b) => b.gic - a.gic);
    const divisive = [...art.statements].sort((a, b) => spread(b) - spread(a)).slice(0, 5);
    return { consensus, divisive };
  }, [art]);

  if (err) return <div className="p-10 text-rose-600">Failed to load artifact: {err}</div>;
  if (!art) return <div className="p-10 text-slate-400">Loading results…</div>;

  return (
    <div className="max-w-5xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Classic Pol.is baseline</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P2 · POC #4</span>
        </div>
        <p className="text-sm text-slate-500">Vote-only, opinion map — the control for what P0 adds (same data, fewer layers)</p>
      </header>

      <div className="mb-4 space-y-2">
        <Commentary kind="perspective" title="What 'Pol.is' is">
          Pol.is is a well-known open-source tool that pioneered this whole vote-and-cluster approach — it was used
          famously by Taiwan's government to find common ground on contentious laws. CIE builds on the same idea, and
          this page is the plain, no-frills Pol.is version of the data.
        </Commentary>
        <Commentary kind="design" title="Why show a stripped-down version?">
          This is the <strong>control</strong> in the experiment. It shows the exact same votes as P0 (the main
          dashboard) but deliberately withholds everything P0 adds — no "feeling heard", no comments, no AI group
          labels, no confidence badges. Flip between this and P0 and the difference <em>is</em> the answer to "are
          those extra layers worth building?"
        </Commentary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="space-y-3">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Opinion map</h3>
            <OpinionMap art={art} />
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
              {art.opinion_groups.map((g) => (
                <span key={g.group} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: groupColor(g.group) }} />
                  Group {letter(g.group)} · {g.size}
                </span>
              ))}
            </div>
          </div>
          <Commentary kind="perspective" title="Reading the map: groups are just A, B, C">
            Every dot is one person, positioned so that people who voted alike sit near each other — the clumps are the
            opinion groups. Classic Pol.is just numbers them by letter and leaves you to interpret them. Those
            plain-English names on P0 ("Essential Public Services"…) are a convenience the AI adds on top; here you read
            the groups straight off the map.
          </Commentary>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-600">Points of consensus <span className="text-[11px] font-normal text-slate-400">— agreed across every group</span></h2>
            {consensus.map((s) => <Row key={s.id} s={s} />)}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-600">What divides people <span className="text-[11px] font-normal text-slate-400">— groups split hardest here</span></h2>
            <Commentary kind="methodology" title="Why 'majority' can mislead">
              Pol.is's core insight, and the reason CIE exists: a statement can win an overall majority while one group
              flatly rejects it. These are ranked by how far apart the groups are — watch for a modest overall number
              hiding a big split (one group at 87%, another at 15%). That gap is exactly what a simple headline poll
              would paper over, and why "what does the majority want?" is the wrong question.
            </Commentary>
            {divisive.map((s) => <Row key={s.id} s={s} />)}
          </div>
        </div>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Same cie.results.v0 artifact as P0 — this view just withholds the extra layers, so the comparison is honest.
      </footer>
    </div>
  );
}
