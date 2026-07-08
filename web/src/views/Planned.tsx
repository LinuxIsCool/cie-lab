// Placeholder for a not-yet-built proof of concept, reachable from the nav tree so
// planned prototypes are legible (question / why / cost / wave), never a dead link.
import type { Poc } from "../portfolio";
import { Commentary } from "../commentary";

const WAVE_REASON: Record<string, string> = {
  "Wave 1": "Cheap and independent, so it can run in parallel behind P0's stable core.",
  "Wave 2": "Built after the basics, once we know which pieces are worth combining.",
  "Wave 3": "A step toward a real product, saved for last because it's hard to undo.",
  Deferred: "Waiting on a real use before it's worth building.",
};

export default function Planned({ poc }: { poc: Poc }) {
  return (
    <div className="max-w-4xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">{poc.title}</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-600">{poc.id} · {poc.wave}</span>
        </div>
        <p className="text-sm text-slate-500">Planned prototype, not built yet</p>
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

      <div className="mt-4 space-y-2">
        <Commentary kind="choice" title={`Why it waits for ${poc.wave}`}>
          {WAVE_REASON[poc.wave] ?? "Sequenced by how much it teaches versus how hard it is to reverse."} Rough cost: {poc.cost}.
        </Commentary>
        <Commentary kind="principle" title="Some of these won't get built">
          Each prototype is a small experiment. The ones that don't prove out get dropped, narrowing toward what becomes the real product.
        </Commentary>
      </div>

      <a href="#/" className="inline-block mt-6 text-[13px] text-blue-600 hover:text-blue-800">← Back to portfolio</a>
    </div>
  );
}
