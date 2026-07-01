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
type CovItem = { id: string; area: string; name: string; status: string; note: string; sourced?: boolean; cie?: string; comhairle?: string; meaning?: string; component?: string };
type Assessment = {
  decision: string; agpl: string; verified: string;
  side_by_side: { dim: string; comhairle: string; cie: string }[];
  coverage: { satisfies: number; partial: number; gap: number; na: number; total: number; finding: string; items?: CovItem[] };
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
const AREA_SHORT: Record<string, string> = { Requirement: "Req", "Quality gate": "Gate", "Build core": "Build" };
const STATUS_RANK: Record<string, number> = { satisfies: 0, partial: 1, gap: 2, na: 3 };
const idKey = (id: string) => { const m = id.match(/^([A-Z]+)(\d+)$/); const g = ({ R: 0, T: 1, M: 2 } as Record<string, number>)[m?.[1] ?? "R"] ?? 9; return g * 100 + (m ? parseInt(m[2], 10) : 0); };

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
  const [sortKey, setSortKey] = useState<"id" | "component" | "name" | "status">("id");
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const clickSort = (k: "id" | "component" | "name" | "status") => { if (k === sortKey) setSortDir((d) => (d === 1 ? -1 : 1)); else { setSortKey(k); setSortDir(1); } };

  useEffect(() => {
    Promise.all([
      fetch(import.meta.env.BASE_URL + "interop.json").then((r) => r.json()),
      fetch(import.meta.env.BASE_URL + "interop_mapping.json").then((r) => r.json()),
    ]).then(([d, m]) => { setDoc(d); setMapping(m.mapping); setA(m.assessment); }).catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="p-10 text-rose-600">Failed to load export: {err} <span className="text-slate-400">— run <code>cd analysis &amp;&amp; uv run python interop.py</code></span></div>;
  if (!doc || !mapping || !a) return <div className="p-10 text-slate-400">Loading assessment…</div>;

  const cov = a.coverage;
  const sortedItems = [...(cov.items ?? [])].sort((x, y) => {
    let r = 0;
    if (sortKey === "id") r = idKey(x.id) - idKey(y.id);
    else if (sortKey === "status") r = (STATUS_RANK[x.status] ?? 9) - (STATUS_RANK[y.status] ?? 9);
    else r = String(x[sortKey] ?? "").localeCompare(String(y[sortKey] ?? ""));
    return r * sortDir || idKey(x.id) - idKey(y.id);
  });
  const Sarrow = (k: string) => (sortKey === k ? (sortDir === 1 ? " ▲" : " ▼") : "");
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

      {cov.items && cov.items.length > 0 && (
        <div className="mt-3 rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-slate-600">All 70 items <span className="font-normal text-slate-400">— sort by any header</span></span>
            <span className="text-[11px] text-slate-400">scroll ↓ · scroll → for full detail</span>
          </div>
          <div className="max-h-[600px] overflow-auto">
            <table className="text-left border-collapse" style={{ minWidth: 1180 }}>
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400 border-b border-slate-200">
                  {([["id", "ID", 44], ["component", "Component", 132], ["name", "Item", 150], ["status", "Coverage", 88]] as const).map(([k, label, w]) => (
                    <th key={k} style={{ width: w, minWidth: w }} className="px-2.5 py-2 align-bottom">
                      <button onClick={() => clickSort(k as "id" | "component" | "name" | "status")} className="font-semibold hover:text-slate-600">{label}{Sarrow(k)}</button>
                    </th>
                  ))}
                  <th style={{ minWidth: 240 }} className="px-2.5 py-2 font-semibold align-bottom text-blue-600">In CIE</th>
                  <th style={{ minWidth: 240 }} className="px-2.5 py-2 font-semibold align-bottom text-slate-500">In Comhairle</th>
                  <th style={{ minWidth: 240 }} className="px-2.5 py-2 font-semibold align-bottom text-emerald-600">What it means for integration</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((it) => (
                  <tr key={it.id} className="border-b border-slate-50 align-top hover:bg-slate-50/50">
                    <td className="px-2.5 py-2 font-mono text-[12px] text-slate-600 whitespace-nowrap">{it.id}</td>
                    <td className="px-2.5 py-2 text-[11px] text-slate-500">{it.component ?? "—"}</td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-700 font-medium">{it.name}</td>
                    <td className="px-2.5 py-2"><span className={`text-[10px] px-1.5 py-0.5 rounded-full ring-1 ${CS[it.status]?.cls ?? ""}`}>{CS[it.status]?.label ?? it.status}</span>{it.sourced === false && <span className="text-slate-300 text-[10px]"> ·inf</span>}</td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-600 leading-relaxed">{it.cie ?? it.note}</td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-600 leading-relaxed">{it.comhairle ?? "—"}</td>
                    <td className="px-2.5 py-2 text-[12px] text-slate-600 leading-relaxed">{it.meaning ?? it.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-1.5 border-t border-slate-100 text-[10px] text-slate-400">
            Statuses reconcile to the audited totals; “·inf” marks a status inferred to fit the per-area counts rather than stated in the source doc.
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
