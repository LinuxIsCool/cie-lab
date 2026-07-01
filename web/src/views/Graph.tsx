// P5 · Knowledge-Graph Sensemaking — a position/claim graph over the P0 artifact.
// Layout is baked (numpy FR in analysis/kg.py); this view is a pure-SVG renderer
// with hover-to-highlight-neighbors + a detail panel. Contrast with P0's opinion
// map: that clusters people by vote; this clusters positions by meaning.
import { useEffect, useMemo, useState } from "react";
import { GROUP_COLORS, groupColor } from "../shared";
import { Commentary } from "../commentary";

type Node = {
  id: string; type: "theme" | "position" | "voice"; label: string; x: number; y: number; size: number;
  text?: string; tag?: string; badge?: string; gic?: number; theme?: number;
  group?: number; linked_to?: string; stance?: string;
  per_group?: { group: number; agree_rate: number | null; seen: number }[];
};
type Edge = { source: string; target: string; kind: string; weight?: number; stance?: string };
type KG = {
  meta: { n_nodes: number; n_edges: number; n_themes: number; n_positions: number; n_voices: number; rel_edge_min: number };
  themes: { id: string; label: string; members: string[] }[];
  group_labels: (string | null)[];
  nodes: Node[]; edges: Edge[];
};

const BADGE_COLOR: Record<string, string> = {
  "representative-enough": "#059669", directional: "#0ea5e9", "below-bar": "#94a3b8",
};
const STANCE_COLOR: Record<string, string> = { supports: "#059669", challenges: "#e11d48", neutral: "#94a3b8" };
const THEME_COLOR = "#334155";

const W = 720, H = 560, PAD = 34;

function nodeFill(n: Node): string {
  if (n.type === "theme") return THEME_COLOR;
  if (n.type === "position") return BADGE_COLOR[n.badge ?? "below-bar"] ?? "#94a3b8";
  return groupColor(n.group ?? 0);
}

export default function Graph() {
  const [kg, setKg] = useState<KG | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [pin, setPin] = useState<string | null>(null);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "kg.json").then((r) => r.json()).then(setKg).catch((e) => setErr(String(e)));
  }, []);

  const focus = pin ?? hover;

  const { posOf, neighbors } = useMemo(() => {
    const posOf: Record<string, { x: number; y: number }> = {};
    const neighbors: Record<string, Set<string>> = {};
    if (kg) {
      for (const n of kg.nodes) posOf[n.id] = { x: PAD + n.x * (W - 2 * PAD), y: PAD + n.y * (H - 2 * PAD) };
      for (const n of kg.nodes) neighbors[n.id] = new Set([n.id]);
      for (const e of kg.edges) { neighbors[e.source]?.add(e.target); neighbors[e.target]?.add(e.source); }
    }
    return { posOf, neighbors };
  }, [kg]);

  if (err) return <div className="p-10 text-rose-600">Failed to load graph: {err} <span className="text-slate-400">— run <code>cd analysis &amp;&amp; uv run python kg.py</code></span></div>;
  if (!kg) return <div className="p-10 text-slate-400">Loading graph…</div>;

  const active = (id: string) => !focus || neighbors[focus]?.has(id);
  const focusNode = focus ? kg.nodes.find((n) => n.id === focus) : null;

  return (
    <div className="max-w-5xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Knowledge-graph sensemaking</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P5 · POC #3</span>
        </div>
        <p className="text-sm text-slate-500">Positions clustered by <em>meaning</em>, not people by vote — the exploration surface next to P0's opinion map</p>
      </header>

      <div className="mb-4 max-w-3xl space-y-2">
        <Commentary kind="perspective" title="What a 'knowledge graph' is">
          A knowledge graph shows ideas as a web of connected dots instead of a list. Here every dot is a statement or a
          resident's comment, and a line connects two that relate. It's a way to <em>wander</em> the landscape of
          opinion rather than read a ranked table — good for spotting how themes and voices hang together.
        </Commentary>
        <Commentary kind="design" title="A different lens than the dashboard">
          The main dashboard (P0) groups <em>people</em> by how they voted. This groups <em>statements</em> by what they
          <em> mean</em> — same data, flipped on its side — and hangs each resident's comment next to the position it
          relates to. Two different ways to make sense of one conversation, side by side.
        </Commentary>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* the graph */}
        <div className="lg:col-span-2 space-y-3">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-2 shadow-sm">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setHover(null)}>
            {/* edges */}
            {kg.edges.map((e, i) => {
              const a = posOf[e.source], b = posOf[e.target];
              if (!a || !b) return null;
              const on = !focus || (neighbors[focus]?.has(e.source) && neighbors[focus]?.has(e.target) && (e.source === focus || e.target === focus));
              const stroke = e.kind === "voice" ? (STANCE_COLOR[e.stance ?? "neutral"]) : e.kind === "theme-member" ? "#cbd5e1" : "#e2e8f0";
              return (
                <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={stroke}
                  strokeWidth={e.kind === "related" ? 1 : 1.4}
                  strokeOpacity={focus ? (on ? 0.75 : 0.06) : e.kind === "related" ? 0.4 : 0.5} />
              );
            })}
            {/* nodes */}
            {kg.nodes.map((n) => {
              const p = posOf[n.id]; if (!p) return null;
              const on = active(n.id);
              return (
                <g key={n.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "pointer" }}
                  opacity={on ? 1 : 0.15}
                  onMouseEnter={() => setHover(n.id)} onClick={() => setPin(pin === n.id ? null : n.id)}>
                  <circle r={n.size} fill={nodeFill(n)} stroke="#fff" strokeWidth={n.type === "theme" ? 2 : 1.2}
                    fillOpacity={n.type === "voice" ? 0.85 : 1} />
                  {n.type === "theme" && <text textAnchor="middle" y={-n.size - 5} className="fill-slate-700 text-[11px] font-semibold">{n.label}</text>}
                  {n.type === "position" && <text textAnchor="middle" dy="0.32em" className="fill-white text-[9px] font-bold pointer-events-none">{n.label.replace("S", "")}</text>}
                </g>
              );
            })}
          </svg>
          </div>
          <Commentary kind="caveat" title="Being honest: the themes here are loose">
            The big dark hubs are AI-named "themes" it grouped statements into. But these statements are short and
            similar, so the grouping is weak — and we show that rather than hide it. The useful signal is the <em>links</em>
            between dots, not the theme bubbles. Hover any dot to trace what it connects to; click to pin it.
          </Commentary>
        </div>

        {/* right rail: detail + legend */}
        <div className="space-y-4">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm min-h-[140px]">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">{focusNode ? "Selected" : "Inspect"}</h3>
            {!focusNode && <p className="text-[13px] text-slate-400">Hover or click any node — position, theme, or resident voice — to see what grounds it.</p>}
            {focusNode?.type === "position" && (
              <div>
                <p className="text-[14px] text-slate-800 font-medium leading-snug">{focusNode.text}</p>
                <div className="mt-1 flex items-center gap-2 text-[11px]">
                  <span className="px-1.5 py-0.5 rounded-full ring-1" style={{ color: BADGE_COLOR[focusNode.badge ?? ""], borderColor: "currentColor" }}>{focusNode.badge}</span>
                  <span className="text-slate-400">GIC {focusNode.gic?.toFixed(2)}</span>
                </div>
                <div className="mt-2.5 space-y-1">
                  {focusNode.per_group?.map((pg) => (
                    <div key={pg.group} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: groupColor(pg.group) }} />
                      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(pg.agree_rate ?? 0) * 100}%`, background: groupColor(pg.group) }} />
                      </div>
                      <span className="text-[11px] tabular-nums text-slate-500 w-8 text-right">{pg.agree_rate != null ? `${(pg.agree_rate * 100).toFixed(0)}%` : "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {focusNode?.type === "voice" && (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: groupColor(focusNode.group ?? 0) }} />
                  <span className="text-[11px] font-medium" style={{ color: STANCE_COLOR[focusNode.stance ?? "neutral"] }}>{focusNode.stance}</span>
                  <span className="text-[11px] text-slate-400">· {kg.group_labels[focusNode.group ?? 0] ?? `Group ${(focusNode.group ?? 0) + 1}`}</span>
                </div>
                <p className="text-[14px] text-slate-800 font-medium">"{focusNode.label}"</p>
                <p className="mt-1 text-[12px] text-slate-400 italic">from: "{focusNode.text}"</p>
                <p className="mt-1 text-[11px] text-slate-400">stance = this resident's actual vote on the linked position (not the AI's guess)</p>
              </div>
            )}
            {focusNode?.type === "theme" && (
              <div>
                <p className="text-[14px] text-slate-800 font-semibold">{focusNode.label}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">AI-named theme · {kg.themes.find((t) => t.id === focusNode.id)?.members.length} positions</p>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm text-[12px]">
            <h3 className="text-sm font-semibold text-slate-600 mb-2">Legend</h3>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: THEME_COLOR }} /> Theme (AI-named cluster)</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: BADGE_COLOR["representative-enough"] }} /> Position — bridges across groups</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: BADGE_COLOR.directional }} /> Position — directional</div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: BADGE_COLOR["below-bar"] }} /> Position — below bar</div>
              <div className="pt-1 mt-1 border-t border-slate-100" />
              <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: GROUP_COLORS[0] }} /> Resident voice (by opinion group)</div>
              <div className="flex items-center gap-3 pt-0.5">
                <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5" style={{ background: STANCE_COLOR.supports }} /> supports</span>
                <span className="flex items-center gap-1"><span className="inline-block w-4 h-0.5" style={{ background: STANCE_COLOR.challenges }} /> challenges</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm text-[12px] text-slate-500">
            <div className="grid grid-cols-3 gap-2 text-center">
              {[["themes", kg.meta.n_themes], ["positions", kg.meta.n_positions], ["voices", kg.meta.n_voices]].map(([k, v]) => (
                <div key={k as string}><div className="text-lg font-bold text-slate-800 tabular-nums">{v}</div><div className="text-[10px] uppercase tracking-wide text-slate-400">{k}</div></div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Commentary kind="methodology" title="A 'voice' is a real comment, and its side comes from a real vote">
              The small colored dots are residents' comments. Whether a voice <span className="font-semibold text-emerald-700">supports</span>
              or <span className="font-semibold text-rose-600">challenges</span> a statement is read from how that person
              actually voted on it — not the AI's guess. The AI only shortens their comment into a short claim; the
              stance is still theirs.
            </Commentary>
            <Commentary kind="architecture" title="Why it loads instantly">
              Working out where every dot should sit is real computation, so it's done once ahead of time and saved. The
              page just draws the finished picture — which is also why exploring it feels immediate.
            </Commentary>
          </div>
        </div>
      </div>

      <footer className="mt-8 text-[11px] text-slate-400">
        Structure by free TELUS e5 embeddings · theme names + claim paraphrases by Gemma · stance from votes · $0.
        The AI groups and phrases; it never decides agreement.
      </footer>
    </div>
  );
}
