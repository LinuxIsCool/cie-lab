// Shared artifact types, palette, and presentational components used across views.
// Extracted from the original single-page App so P0 (dashboard) and P6 (ask) can
// both consume the same cie.results.v0 artifact and render identical statement cards.
import { useEffect, useState } from "react";

// ---- types (loose mirror of the cie.results.v0 artifact) -------------------
export type PerGroup = { group: number; agrees: number; disagrees: number; passes: number; seen: number; agree_rate: number | null; wilson_lower: number };
export type Statement = { id: string; text: string; tag: string; gic: number; badge: string; per_group: PerGroup[]; validity: { smallest_group_seen: number; coverage: number; groups_meeting_vote_floor: number } };
export type Group = { group: number; size: number; centroid: [number, number]; self_codes: { feeling_heard_mean: number; view_intensity_mean: number } | null; suppressed: boolean; ai_label?: string | null };
export type Artifact = {
  meta: { n_participants: number; k_groups_found: number; silhouette: number };
  scope_banner: string;
  overall_self_codes: { feeling_heard_mean: number; view_intensity_mean: number; comment_rate: number };
  opinion_map: { points: { id: string; x: number; y: number; group: number }[] };
  opinion_groups: Group[];
  statements: Statement[];
  comments: { participant_id: string; group: number; text: string }[];
};

export const GROUP_COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777"];
export const groupColor = (g: number) => GROUP_COLORS[g % GROUP_COLORS.length];

export const BADGE: Record<string, { label: string; cls: string }> = {
  "representative-enough": { label: "Bridges across groups", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  directional: { label: "Directional", cls: "bg-sky-100 text-sky-800 ring-sky-200" },
  "below-bar": { label: "Below bar", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

// One shared loader so every view reads the same artifact the same way.
export function useArtifact() {
  const [art, setArt] = useState<Artifact | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "artifact.json").then((r) => r.json()).then(setArt).catch((e) => setErr(String(e)));
  }, []);
  return { art, err };
}

export function Meter({ value, label, color = "#2563eb" }: { value: number; label: string; color?: string }) {
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

export function OpinionMap({ art }: { art: Artifact }) {
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

export function StatementCard({ s, groups }: { s: Statement; groups: Group[] }) {
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
            <span className="text-xs tabular-nums text-slate-600 w-9 text-right">{pg.agree_rate != null ? `${(pg.agree_rate * 100).toFixed(0)}%` : "N/A"}</span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400">
        <span>Group-informed consensus <span className="tabular-nums text-slate-600 font-medium">{s.gic.toFixed(2)}</span></span>
        <span>·</span>
        <span>smallest group n={s.validity.smallest_group_seen}</span>
        <span>·</span>
        <span>coverage {(s.validity.coverage * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
