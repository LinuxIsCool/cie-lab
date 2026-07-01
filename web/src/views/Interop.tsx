// P1 · Comhairle interop-export & integration assessment. The compare-and-contrast
// (build-vs-fork decision, AGPL read, 70-item coverage, data-model mapping, two paths,
// upstream gifts) made shareable — plus the working flat-file export. Reads the prebuilt
// /interop.json + /interop_mapping.json (analysis/interop.py), grounded in the 06-29 doc
// and re-verified against crownshy/comhairle HEAD (2026-07-01).
import { useEffect, useState } from "react";
import { Commentary } from "../commentary";

type Interop = {
  schema: string;
  conversation: { id: string; title: string; scope: string; n_participants: number; n_statements: number; n_votes: number };
  statements: { id: string; text: string; tag: string }[];
  participants: { id: string }[];
  votes: { participant: string; statement: string; value: string }[];
  value_codes: Record<string, number>;
};
type MapRow = { cie: string; comhairle: string; fidelity: string; note: string };
type CovItem = { id: string; area: string; name: string; status: string; note: string; sourced?: boolean; cie?: string; comhairle?: string; meaning?: string; cie_s?: string; comhairle_s?: string; meaning_s?: string; component?: string };
// "reverse view" — features Comhairle has that CIE doesn't (mirror of the coverage table)
type RevItem = { id: string; component: string; name: string; status: string; comhairle: string; cie: string; meaning: string; comhairle_s?: string; cie_s?: string; meaning_s?: string; paths?: string[] };
type Assessment = {
  decision: string; agpl: string; verified: string;
  side_by_side: { dim: string; comhairle: string; cie: string }[];
  coverage: { satisfies: number; partial: number; gap: number; na: number; total: number; finding: string; items?: CovItem[] };
  reverse?: { gain: number; watch: number; diverges: number; total: number; finding: string; items: RevItem[] };
  cie_gaps: string[];
  comhairle_has: string;
  paths: { name: string; effort: string; fork: boolean; recommended: boolean; note: string }[];
  posture: string;
  gifts: { t: string; d: string }[];
};

const CS: Record<string, { label: string; cls: string }> = {
  satisfies: { label: "satisfies", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  partial: { label: "partial", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  gap: { label: "gap", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  na: { label: "n/a", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};
// reverse-view status vocabulary (kept off amber — amber is reserved for commentary cards)
const RS: Record<string, { label: string; cls: string }> = {
  gain: { label: "gain", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  watch: { label: "watch", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  diverges: { label: "diverges", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
};
const RS_ORDER = ["gain", "watch", "diverges"];
const REV_RANK: Record<string, number> = { gain: 0, watch: 1, diverges: 2 };
const AREA_SHORT: Record<string, string> = { Requirement: "Req", "Quality gate": "Gate", "Build core": "Build" };
const STATUS_RANK: Record<string, number> = { satisfies: 0, partial: 1, gap: 2, na: 3 };
// Type (R/T/M + the Comhairle side) — soft outline chips, distinct from the Coverage palette.
const TYPE_CLS: Record<string, string> = {
  Requirement: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Quality gate": "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200",
  "Build core": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "Comhairle feature": "bg-stone-100 text-stone-600 ring-stone-300",
};
// Component — 20 labels, so map each name deterministically into a fixed palette (stable per name).
const COMP_PALETTE = [
  "bg-rose-50 text-rose-700 ring-rose-200", "bg-orange-50 text-orange-700 ring-orange-200",
  "bg-lime-50 text-lime-700 ring-lime-200", "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "bg-teal-50 text-teal-700 ring-teal-200", "bg-cyan-50 text-cyan-700 ring-cyan-200",
  "bg-sky-50 text-sky-700 ring-sky-200", "bg-blue-50 text-blue-700 ring-blue-200",
  "bg-indigo-50 text-indigo-700 ring-indigo-200", "bg-violet-50 text-violet-700 ring-violet-200",
  "bg-purple-50 text-purple-700 ring-purple-200", "bg-pink-50 text-pink-700 ring-pink-200",
];
const COMP_HUES = ["rose", "orange", "lime", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "pink"];
const compIdx = (name: string) => { let h = 0; for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0; return h % COMP_PALETTE.length; };
const compCls = (name: string) => COMP_PALETTE[compIdx(name)];
// hex equivalents [bg, fg] so the <select>/<option> dropdowns can match the in-table chip colors
const HEX: Record<string, [string, string]> = {
  indigo: ["#eef2ff", "#4338ca"], fuchsia: ["#fdf4ff", "#a21caf"], cyan: ["#ecfeff", "#0e7490"], stone: ["#f5f5f4", "#57534e"],
  rose: ["#fff1f2", "#be123c"], orange: ["#fff7ed", "#c2410c"], lime: ["#f7fee7", "#4d7c0f"], emerald: ["#ecfdf5", "#047857"],
  teal: ["#f0fdfa", "#0f766e"], sky: ["#f0f9ff", "#0369a1"], blue: ["#eff6ff", "#1d4ed8"], violet: ["#f5f3ff", "#6d28d9"],
  purple: ["#faf5ff", "#7e22ce"], pink: ["#fdf2f8", "#be185d"], slate: ["#f1f5f9", "#475569"],
};
const TYPE_HUE: Record<string, string> = { Requirement: "indigo", "Quality gate": "fuchsia", "Build core": "cyan", "Comhairle feature": "stone" };
const SRC_HUE: Record<string, string> = { CIE: "blue", Comhairle: "slate" };
const STATUS_HUE: Record<string, string> = { satisfies: "emerald", partial: "sky", gap: "rose", na: "slate", gain: "emerald", watch: "sky", diverges: "violet" };
const oStyle = (hue?: string): React.CSSProperties | undefined => (hue && HEX[hue] ? { background: HEX[hue][0], color: HEX[hue][1] } : undefined);
// id ordering: CIE spec ids (R < T < M) first, then Comhairle-sourced ids (CT/CI/CS/CD/CF, and legacy I/F).
const ID_RANK: Record<string, number> = { R: 0, T: 1, M: 2, CT: 10, CI: 11, CS: 12, CD: 13, CF: 14, I: 11, F: 14 };
const idKey = (id: string) => { const m = id.match(/^([A-Z]+)(\d+)$/); const g = ID_RANK[m?.[1] ?? "R"] ?? 99; return g * 1000 + (m ? parseInt(m[2], 10) : 0); };

const FID: Record<string, { label: string; cls: string; def: string }> = {
  clean: { label: "clean", cls: "bg-emerald-50 text-emerald-700 ring-emerald-200", def: "A direct one-to-one match — the value carries over as-is." },
  rekey: { label: "re-key", cls: "bg-sky-50 text-sky-700 ring-sky-200", def: "Same meaning, different id scheme — CIE's ULIDs become UUIDs." },
  recast: { label: "recast", cls: "bg-violet-50 text-violet-700 ring-violet-200", def: "The information survives in a different shape — a comment lands as a Statement." },
  lossy: { label: "lossy", cls: "bg-orange-50 text-orange-700 ring-orange-200", def: "It fits, though some detail (a numeric range) is simplified on the way." },
  gap: { label: "gap", cls: "bg-rose-50 text-rose-700 ring-rose-200", def: "Their grammar has no field for it yet — the spots the upstream gifts would fill." },
  dropped: { label: "dropped", cls: "bg-slate-100 text-slate-500 ring-slate-200", def: "Carried by CIE's trust layer, with no counterpart in the interchange schema." },
};
const FID_ORDER = ["clean", "rekey", "recast", "lossy", "gap", "dropped"];
const COV = [
  { k: "satisfies", c: "#059669" }, { k: "partial", c: "#0ea5e9" }, { k: "gap", c: "#f43f5e" }, { k: "na", c: "#94a3b8" },
] as const;

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-slate-700 mt-7 mb-2 flex items-center gap-2">{children}<span className="h-px flex-1 bg-slate-200" /></h2>;
}

export default function Interop() {
  const [doc, setDoc] = useState<Interop | null>(null);
  const [mapping, setMapping] = useState<MapRow[] | null>(null);
  const [a, setA] = useState<Assessment | null>(null);
  const [err, setErr] = useState<string | null>(null);
  type SortKey = "id" | "source" | "type" | "component" | "name" | "status";
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const clickSort = (k: SortKey) => { if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(k); setSortDir(1); } };
  const [q, setQ] = useState("");                 // real-time search over the comparison table
  const [fSource, setFSource] = useState("");      // filter by Source (CIE / Comhairle)
  const [fType, setFType] = useState("");          // filter by Type (Requirement / Quality gate / Build core / Comhairle feature)
  const [fComp, setFComp] = useState("");          // filter by Component ("" = all)
  const [fStatus, setFStatus] = useState("");      // filter by Coverage / stance ("" = all)

  useEffect(() => {
    Promise.all([
      fetch(import.meta.env.BASE_URL + "interop.json").then((r) => r.json()),
      fetch(import.meta.env.BASE_URL + "interop_mapping.json").then((r) => r.json()),
    ]).then(([d, m]) => { setDoc(d); setMapping(m.mapping); setA(m.assessment); }).catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="p-10 text-rose-600">Failed to load export: {err} <span className="text-slate-400">— run <code>cd analysis &amp;&amp; uv run python interop.py</code></span></div>;
  if (!doc || !mapping || !a) return <div className="p-10 text-slate-400">Loading assessment…</div>;

  const cov = a.coverage;
  const rev = a.reverse;
  // one comparison set: CIE spec items (source CIE) + Comhairle-only features (source Comhairle)
  type Row = {
    id: string; source: "CIE" | "Comhairle"; type: string; component: string; name: string;
    status: string; sm: Record<string, { label: string; cls: string }>; sourced?: boolean;
    cie: string; comhairle: string; meaning: string; cie_s?: string; comhairle_s?: string; meaning_s?: string;
  };
  const cieRows: Row[] = (cov.items ?? []).map((it) => ({
    id: it.id, source: "CIE", type: it.area, component: it.component ?? "—", name: it.name,
    status: it.status, sm: CS, sourced: it.sourced,
    cie: it.cie ?? it.note, comhairle: it.comhairle ?? "—", meaning: it.meaning ?? it.note,
    cie_s: it.cie_s, comhairle_s: it.comhairle_s, meaning_s: it.meaning_s,
  }));
  const revRows: Row[] = (rev?.items ?? []).map((it) => ({
    id: it.id, source: "Comhairle", type: "Comhairle feature", component: it.component, name: it.name,
    status: it.status, sm: RS,
    cie: it.cie, comhairle: it.comhairle, meaning: it.meaning,
    cie_s: it.cie_s, comhairle_s: it.comhairle_s, meaning_s: it.meaning_s,
  }));
  const allRows = [...cieRows, ...revRows];
  const components = Array.from(new Set(allRows.map((r) => r.component))).filter((c) => c && c !== "—").sort();
  const types = ["Requirement", "Quality gate", "Build core", "Comhairle feature"].filter((t) => allRows.some((r) => r.type === t));
  const statusOpts = [
    ...(["satisfies", "partial", "gap", "na"] as const).filter((s) => cieRows.some((r) => r.status === s)),
    ...(["gain", "watch", "diverges"] as const).filter((s) => revRows.some((r) => r.status === s)),
  ];
  const den = (r: Row, f: "cie" | "comhairle" | "meaning") => (r[`${f}_s` as keyof Row] as string | undefined) || r[f];
  const statusRank = (r: Row) => (r.source === "CIE" ? (STATUS_RANK[r.status] ?? 9) : 4 + (REV_RANK[r.status] ?? 9));
  const term = q.trim().toLowerCase();
  const visible = allRows.filter((r) =>
    (!fSource || r.source === fSource) && (!fType || r.type === fType) &&
    (!fComp || r.component === fComp) && (!fStatus || r.status === fStatus) &&
    (!term || [r.id, r.name, r.component, r.type, r.source, r.cie, r.comhairle, r.meaning, r.cie_s, r.comhairle_s, r.meaning_s]
      .some((v) => (v ?? "").toLowerCase().includes(term))));
  const rows = [...visible].sort((x, y) => {
    let r = 0;
    if (sortKey === "id") r = idKey(x.id) - idKey(y.id);
    else if (sortKey === "status") r = statusRank(x) - statusRank(y);
    else r = String((x as Record<string, unknown>)[sortKey] ?? "").localeCompare(String((y as Record<string, unknown>)[sortKey] ?? ""));
    return r * sortDir || idKey(x.id) - idKey(y.id);
  });
  const Sarrow = (k: string) => (sortKey === k ? (sortDir === 1 ? " ▲" : " ▼") : "");
  const selCls = "text-[11px] rounded-md border border-slate-200 bg-white px-1.5 py-1 text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300";
  return (
    <div className="max-w-5xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Comhairle interop &amp; integration assessment</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P1 · POC #5</span>
        </div>
        <p className="text-sm text-slate-500">Should CIE build on Comhairle, or build its own and interoperate? The full compare-and-contrast — plus a working export.</p>
      </header>

      <div className="mb-2 space-y-2">
        <Commentary kind="perspective" title="What this page is even about">
          There's another civic tool called <strong>Comhairle</strong> — a Scottish-Government participatory-democracy platform — that does work close to ours. This page is the assessment of how the two relate: what each is strong at, whether to build on theirs or build our own, and how our data could travel between them. It doubles as the technical brief to share with their team.
        </Commentary>
        <Commentary kind="choice" title="The decision">
          {a.decision}
        </Commentary>
      </div>

      <H>How the two systems compare</H>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 px-3 py-2 border-b border-slate-100 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          <div className="col-span-3">Dimension</div><div className="col-span-5">Comhairle</div><div className="col-span-4">CIE (ours)</div>
        </div>
        {a.side_by_side.map((r) => (
          <div key={r.dim} className="grid grid-cols-12 px-3 py-2 border-b border-slate-50 last:border-0 text-[12px]">
            <div className="col-span-3 font-medium text-slate-600">{r.dim}</div>
            <div className="col-span-5 text-slate-500 pr-2">{r.comhairle}</div>
            <div className="col-span-4 text-slate-700">{r.cie}</div>
          </div>
        ))}
      </div>

      <H>Requirement coverage <span className="text-[11px] font-normal text-slate-400">— CIE's 70 spec items vs Comhairle</span></H>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
        <div className="flex h-6 rounded-md overflow-hidden ring-1 ring-slate-200">
          {COV.map(({ k, c }) => (
            <div key={k} style={{ width: `${(cov[k as keyof typeof cov] as number / cov.total) * 100}%`, background: c }}
              className="flex items-center justify-center text-[10px] font-semibold text-white" title={`${k}: ${cov[k as keyof typeof cov]}`}>
              {cov[k as keyof typeof cov] as number}
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-slate-600 leading-relaxed">{cov.finding}</p>
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 mb-2">Every item falls into one of four buckets — how much of it Comhairle already covers:</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2">
            {[
              ["satisfies", "Comhairle already delivers this — almost always the shared Pol.is spine (voting, demographic-blind clustering) that CIE also builds on."],
              ["partial", "Comhairle has a weaker or related form — the mechanism exists, but not to CIE's full standard or guarantee."],
              ["gap", "A CIE capability Comhairle lacks entirely — the trust, claim-discipline, and validity layer where the two systems most diverge."],
              ["na", "A CIE program or process step (staffing, sign-offs, field ops), not a platform feature — outside a code-to-code comparison."],
            ].map(([k, def]) => (
              <div key={k} className="flex items-start gap-2">
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ring-1 ${CS[k].cls}`}>{CS[k].label}</span>
                <span className="text-[12px] text-slate-500 leading-snug"><span className="tabular-nums font-semibold text-slate-700">{cov[k as keyof typeof cov] as number}</span> of {cov.total} — {def}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {rev && rev.items.length > 0 && (
        <div className="mt-3 rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
          <div className="text-[13px] font-semibold text-slate-700">The reverse view <span className="font-normal text-slate-400">— {rev.total} features Comhairle ships that CIE has no answer for</span></div>
          <p className="mt-1.5 text-[13px] text-slate-600 leading-relaxed">{rev.finding}</p>
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-x-5 gap-y-2">
            {([
              ["gain", "CIE would genuinely benefit from adopting or borrowing this."],
              ["watch", "Real and useful, situational — worth tracking, not urgent for the pilot."],
              ["diverges", "Comhairle has it, and CIE deliberately does without — a principled choice."],
            ] as const).map(([k, def]) => (
              <div key={k} className="flex items-start gap-2">
                <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ring-1 ${RS[k].cls}`}>{RS[k].label}</span>
                <span className="text-[12px] text-slate-500 leading-snug"><span className="tabular-nums font-semibold text-slate-700">{rev[k]}</span> — {def}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {allRows.length > 0 && (
        <div className="mt-3 rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100">
            <div className="text-[12px] font-semibold text-slate-600">
              All {allRows.length} items <span className="font-normal text-slate-400">— sort by any header</span>
              {visible.length !== allRows.length && <span className="ml-1 text-slate-400">· {visible.length} shown</span>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
                className="text-[12px] rounded-md border border-slate-200 bg-white px-2 py-1 w-40 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300" />
              <select value={fSource} onChange={(e) => setFSource(e.target.value)} className={selCls} style={oStyle(SRC_HUE[fSource])} title="Filter by source">
                <option value="">All sources</option>
                {["CIE", "Comhairle"].map((s) => <option key={s} value={s} style={oStyle(SRC_HUE[s])}>{s}</option>)}
              </select>
              <select value={fType} onChange={(e) => setFType(e.target.value)} className={selCls} style={oStyle(TYPE_HUE[fType])} title="Filter by type">
                <option value="">All types</option>
                {types.map((t) => <option key={t} value={t} style={oStyle(TYPE_HUE[t])}>{t}</option>)}
              </select>
              <select value={fComp} onChange={(e) => setFComp(e.target.value)} className={selCls} style={fComp ? oStyle(COMP_HUES[compIdx(fComp)]) : undefined} title="Filter by component">
                <option value="">All components</option>
                {components.map((c) => <option key={c} value={c} style={oStyle(COMP_HUES[compIdx(c)])}>{c}</option>)}
              </select>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className={selCls} style={oStyle(STATUS_HUE[fStatus])} title="Filter by coverage / stance">
                <option value="">All coverage</option>
                {statusOpts.map((s) => <option key={s} value={s} style={oStyle(STATUS_HUE[s])}>{(CS[s] ?? RS[s]).label}</option>)}
              </select>
              {(q || fSource || fType || fComp || fStatus) && (
                <button onClick={() => { setQ(""); setFSource(""); setFType(""); setFComp(""); setFStatus(""); }}
                  className="text-[11px] text-slate-400 hover:text-slate-600 underline">clear</button>
              )}
            </div>
          </div>
          <div className="max-h-[600px] overflow-auto">
            <table className="text-left border-collapse" style={{ minWidth: 1400 }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                  {([["id", "ID", 52], ["source", "Source", 84], ["type", "Type", 120], ["component", "Component", 184], ["name", "Item", 150], ["status", "Coverage", 88]] as const).map(([k, label, w]) => (
                    <th key={k} style={{ width: w, minWidth: w }} className="px-2.5 py-2 align-bottom">
                      <button onClick={() => clickSort(k)} className="font-semibold hover:text-slate-600">{label}{Sarrow(k)}</button>
                    </th>
                  ))}
                  <th style={{ minWidth: 230 }} className="px-2.5 py-2 font-semibold align-bottom text-blue-600">In CIE</th>
                  <th style={{ minWidth: 230 }} className="px-2.5 py-2 font-semibold align-bottom text-slate-500">In Comhairle</th>
                  <th style={{ minWidth: 230 }} className="px-2.5 py-2 font-semibold align-bottom text-emerald-600">What it means for integration</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((it) => (
                  <tr key={it.id} className="border-b border-slate-50 align-top hover:bg-slate-50/50">
                    <td className="px-2.5 py-2 font-mono text-[12px] text-slate-600 whitespace-nowrap">{it.id}</td>
                    <td className="px-2.5 py-2"><span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${it.source === "CIE" ? "bg-blue-600 text-white" : "bg-slate-600 text-white"}`}>{it.source}</span></td>
                    <td className="px-2.5 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ring-1 whitespace-nowrap ${TYPE_CLS[it.type] ?? "bg-slate-100 text-slate-500 ring-slate-200"}`}>{it.type}</span></td>
                    <td className="px-2.5 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ring-1 whitespace-nowrap ${compCls(it.component)}`}>{it.component}</span></td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-700 font-medium">{it.name}</td>
                    <td className="px-2.5 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ring-1 ${it.sm[it.status]?.cls ?? ""}`}>{it.sm[it.status]?.label ?? it.status}</span>{it.sourced === false && <span className="text-slate-300 text-[10px]"> ·inf</span>}</td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-600 leading-relaxed">{den(it, "cie")}</td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-600 leading-relaxed">{den(it, "comhairle")}</td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-600 leading-relaxed">{den(it, "meaning")}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={9} className="px-3 py-6 text-center text-[12px] text-slate-400">No items match — adjust search or filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-1.5 border-t border-slate-100 text-[10px] text-slate-400">
            <span className="text-blue-600 font-medium">CIE</span> rows are spec items surfaced from studying CIE (satisfies / partial / gap / n·a); <span className="text-slate-600 font-medium">Comhairle</span> rows are features surfaced from studying Comhairle (gain / watch / diverges). “·inf” marks a CIE status inferred to fit the per-area counts.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
          <div className="text-[13px] font-semibold text-slate-700 mb-2">What CIE adds that Comhairle lacks</div>
          <ul className="space-y-1.5">
            {a.cie_gaps.map((g, i) => (
              <li key={i} className="text-[12px] text-slate-500 leading-snug flex gap-2"><span className="text-rose-400 mt-0.5">•</span><span>{g}</span></li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
          <div className="text-[13px] font-semibold text-slate-700 mb-2">What a collaboration would gain CIE</div>
          <p className="text-[12px] text-slate-500 leading-relaxed">{a.comhairle_has}</p>
        </div>
      </div>

      <div className="mt-3">
        <Commentary kind="choice" title="Why a fork-and-sell path is closed">
          {a.agpl}
        </Commentary>
      </div>

      <H>Field mapping → Comhairle grammar</H>
      <div className="mb-3">
        <Commentary kind="design" title="How to read this mapping">
          Handing data to another tool means lining up each of your fields with one of theirs. This table walks every CIE record onto Comhairle's <em>interchange grammar</em> — its Statement / Reaction / Group / Participant vocabulary — and labels how cleanly each one lands, from an exact match down to the few spots where their grammar would need a small addition to hold what CIE carries.
        </Commentary>
      </div>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-3.5 shadow-sm mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2">What the labels mean</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-1.5">
          {FID_ORDER.map((k) => (
            <div key={k} className="flex items-start gap-2">
              <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ring-1 ${FID[k].cls}`}>{FID[k].label}</span>
              <span className="text-[12px] text-slate-500 leading-snug">{FID[k].def}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
        {mapping.map((m, i) => (
          <div key={i} className="px-3 py-2.5 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-[12px] text-slate-700">{m.cie}</code>
              <span className="text-slate-300">→</span>
              <code className="text-[12px] text-slate-500">{m.comhairle}</code>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ring-1 ${FID[m.fidelity]?.cls ?? ""}`}>{FID[m.fidelity]?.label ?? m.fidelity}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{m.note}</p>
          </div>
        ))}
      </div>

      <H>Two ways to integrate</H>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {a.paths.map((p) => (
          <div key={p.name} className={`rounded-xl p-4 shadow-sm ring-1 ${p.recommended ? "bg-emerald-50/40 ring-emerald-200" : "bg-white ring-slate-200"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-800">{p.name}</span>
              {p.recommended && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">recommended now</span>}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
              <span>{p.effort}</span><span>·</span><span>{p.fork ? "requires a fork" : "no fork"}</span>
            </div>
            <p className="mt-2 text-[12px] text-slate-500 leading-snug">{p.note}</p>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <Commentary kind="goal" title="Export-first, adapter-later">
          {a.posture}
        </Commentary>
      </div>

      <H>Two gifts to bring upstream <span className="text-[11px] font-normal text-slate-400">— turning "compare" into "contribute"</span></H>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {a.gifts.map((g) => (
          <div key={g.t} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="text-[13px] font-semibold text-slate-700">{g.t}</div>
            <p className="text-[12px] text-slate-500 leading-snug mt-1">{g.d}</p>
          </div>
        ))}
      </div>

      <H>The working export <span className="text-[11px] font-normal text-slate-400">— {doc.conversation.n_statements} statements · {doc.conversation.n_participants} participants · {doc.conversation.n_votes} votes</span></H>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-600">The flat-file <span className="font-mono text-[11px] text-slate-400">{doc.schema}</span></span>
          <a download="cie-interop-v0.json" href={"data:application/json," + encodeURIComponent(JSON.stringify(doc, null, 2))}
            className="text-[12px] font-medium rounded-lg bg-slate-800 text-white px-3 py-1.5 hover:bg-slate-700">Download .json</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">statements[0..2]</div>
            <pre className="text-[11px] leading-relaxed bg-slate-50 rounded-lg p-2.5 overflow-x-auto text-slate-600 ring-1 ring-slate-100">{JSON.stringify(doc.statements.slice(0, 3), null, 1)}</pre>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">votes[0..3] · codes {JSON.stringify(doc.value_codes)}</div>
            <pre className="text-[11px] leading-relaxed bg-slate-50 rounded-lg p-2.5 overflow-x-auto text-slate-600 ring-1 ring-slate-100">{JSON.stringify(doc.votes.slice(0, 4), null, 1)}</pre>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <Commentary kind="principle" title="No identities leave the building">
          Participants export as an opaque id and nothing else — no names, no demographics. The portable file carries how people voted, never who they are, so a handoff keeps every privacy promise intact.
        </Commentary>
      </div>

      <footer className="mt-8 text-[11px] text-slate-400 leading-relaxed">
        {a.verified}
      </footer>
    </div>
  );
}
