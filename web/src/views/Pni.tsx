// P4 · PNI depth — full Participatory Narrative Inquiry over synthetic stories.
// Renders the "narrative catalysis": a feeling × agency landscape of self-interpreted
// stories, the patterns that fall out, and representative stories. Reads /pni.json
// (see analysis/pni.py). Contrast with P0's *light* self-coding.
import { useEffect, useState } from "react";
import { GROUP_COLORS, groupColor } from "../shared";
import { Commentary } from "../commentary";

type Story = { id: string; group: number; text: string; feeling: number; agency: number; time: string; scope: string; quadrant?: string };
type Pni = {
  meta: { n_stories: number; pni_volume_target: string };
  self_codes: string[];
  stories: Story[];
  quadrants: Record<string, number>;
  patterns: { label: string; count: number; note: string }[];
  representative: Story[];
};

const W = 460, H = 380, PAD = 34;
const fx = (f: number) => PAD + f * (W - 2 * PAD);
const fy = (a: number) => PAD + (1 - a) * (H - 2 * PAD);

function Landscape({ stories }: { stories: Story[] }) {
  const [hi, setHi] = useState<Story | null>(null);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-lg bg-slate-50 ring-1 ring-slate-200" onMouseLeave={() => setHi(null)}>
        {/* quadrant dividers */}
        <line x1={fx(0.5)} y1={PAD} x2={fx(0.5)} y2={H - PAD} stroke="#e2e8f0" strokeWidth={1} />
        <line x1={PAD} y1={fy(0.5)} x2={W - PAD} y2={fy(0.5)} stroke="#e2e8f0" strokeWidth={1} />
        {/* quadrant labels */}
        <text x={PAD + 4} y={PAD + 12} className="fill-slate-300 text-[9px]">frustrated · willing</text>
        <text x={W - PAD - 4} y={PAD + 12} textAnchor="end" className="fill-slate-300 text-[9px]">empowered</text>
        <text x={PAD + 4} y={H - PAD - 4} className="fill-slate-300 text-[9px]">grievance</text>
        <text x={W - PAD - 4} y={H - PAD - 4} textAnchor="end" className="fill-slate-300 text-[9px]">grateful · passive</text>
        {/* axis hints */}
        <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-slate-400 text-[10px]">how it felt →</text>
        <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`} className="fill-slate-400 text-[10px]">sense of agency →</text>
        {/* stories */}
        {stories.map((s) => (
          <circle key={s.id} cx={fx(s.feeling)} cy={fy(s.agency)} r={hi?.id === s.id ? 6 : 4}
            fill={groupColor(s.group)} fillOpacity={0.75} stroke="#fff" strokeWidth={hi?.id === s.id ? 1.5 : 0.6}
            style={{ cursor: "pointer" }} onMouseEnter={() => setHi(s)}><title>{s.text}</title></circle>
        ))}
      </svg>
      <div className="mt-1 text-[12px] text-slate-500 min-h-[34px]">
        {hi ? <span className="italic">“{hi.text}” <span className="not-italic text-slate-400">· {hi.time} · {hi.scope}</span></span>
            : <span className="text-slate-400">Each dot is one story, placed by the teller's own self-interpretation. Hover to read one.</span>}
      </div>
    </div>
  );
}

export default function Pni() {
  const [doc, setDoc] = useState<Pni | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { fetch(import.meta.env.BASE_URL + "pni.json").then((r) => r.json()).then(setDoc).catch((e) => setErr(String(e))); }, []);

  if (err) return <div className="p-10 text-rose-600">Failed to load stories: {err} <span className="text-slate-400">— run <code>cd analysis &amp;&amp; uv run python pni.py</code></span></div>;
  if (!doc) return <div className="p-10 text-slate-400">Loading stories…</div>;

  return (
    <div className="max-w-5xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">PNI depth</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P4 · POC #8</span>
        </div>
        <p className="text-sm text-slate-500">Full Participatory Narrative Inquiry — stories people tell, interpreted by the people who told them</p>
      </header>

      <div className="mb-5 space-y-2">
        <Commentary kind="perspective" title="What PNI adds">
          The other demos ask people to react to statements. Participatory Narrative Inquiry starts a step earlier: it invites people to tell a short <em>story</em>, then asks them to interpret their own — how it felt, who held the power, whether it's about the past or the future. Reading those self-interpretations across many stories reveals an emotional landscape a vote alone leaves out.
        </Commentary>
        <Commentary kind="methodology" title="Reading the landscape">
          Each dot is one story, placed by the teller's own answers: how positive it felt (left to right) and how much agency they had (bottom to top). The corners tell a story of their own — grievance, empowerment, and the revealing in-between where people feel grateful yet powerless, or unhappy yet ready to act.
        </Commentary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-slate-600">Story landscape</h2>
            <div className="flex gap-3">
              {[0, 1, 2].map((g) => (
                <span key={g} className="flex items-center gap-1 text-[11px] text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: GROUP_COLORS[g] }} /> group {g + 1}
                </span>
              ))}
            </div>
          </div>
          <Landscape stories={doc.stories} />
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Patterns worth attention <span className="text-[11px] font-normal text-slate-400">— from {doc.meta.n_stories} stories</span></h3>
            <div className="space-y-2.5">
              {doc.patterns.map((p) => (
                <div key={p.label}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] font-medium text-slate-700">{p.label}</span>
                    <span className="text-[13px] tabular-nums text-slate-500">{p.count}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">{p.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* representative stories, one per corner */}
      <div className="mt-5">
        <h2 className="text-sm font-semibold text-slate-600 mb-2">In their own words <span className="text-[11px] font-normal text-slate-400">— one story from each corner of the landscape</span></h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {doc.representative.map((s) => (
            <div key={s.id} className="rounded-xl bg-white ring-1 ring-slate-200 p-3.5 shadow-sm">
              <p className="text-[14px] text-slate-800 italic leading-snug">“{s.text}”</p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{s.quadrant?.replace(/-/g, " ")}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">feeling {(s.feeling * 100).toFixed(0)}%</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">agency {(s.agency * 100).toFixed(0)}%</span>
                <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{s.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <Commentary kind="goal" title="The bet, and its price">
          This is the deepest listening in the portfolio, and the most demanding. A solid read wants {doc.meta.pni_volume_target}, each with the teller's own interpretation — real effort from residents and facilitators alike. P0's light self-coding (two quick ratings on the universal vote) is the pragmatic middle; P4 shows what the full method reaches for, so the trade can be weighed with eyes open.
        </Commentary>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Synthetic stories with self-interpretation · narrative catalysis computed offline · a candidate methodology, shown at full depth.
      </footer>
    </div>
  );
}
