// Placeholder for a not-yet-built POC — reachable from the nav tree so planned
// prototypes are legible (question / why / cost / wave), never a dead link.
import type { Poc } from "../portfolio";

export default function Planned({ poc }: { poc: Poc }) {
  return (
    <div className="max-w-2xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">{poc.title}</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">{poc.id} · {poc.wave}</span>
        </div>
        <p className="text-sm text-slate-500">Planned prototype — not built yet</p>
      </header>

      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Research question</div>
          <p className="text-[15px] text-slate-800 mt-1">{poc.question}</p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Why it's in the portfolio</div>
          <p className="text-[14px] text-slate-600 mt-1">{poc.why}</p>
        </div>
        <div className="flex gap-6 pt-1">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Rough cost</div>
            <p className="text-[14px] text-slate-700 mt-1">{poc.cost}</p>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Wave</div>
            <p className="text-[14px] text-slate-700 mt-1">{poc.wave}</p>
          </div>
        </div>
      </div>

      <a href="#/" className="inline-block mt-5 text-[13px] text-blue-600 hover:text-blue-800">← Back to portfolio</a>
    </div>
  );
}
