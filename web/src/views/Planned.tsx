// Placeholder for a not-yet-built POC — reachable from the nav tree so planned
// prototypes are legible (question / why / cost / wave), never a dead link.
import type { Poc } from "../portfolio";
import { Commentary, DesignNotes } from "../commentary";

export default function Planned({ poc }: { poc: Poc }) {
  return (
    <div className="max-w-4xl">
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

      <DesignNotes
        title="Where this prototype sits in the method"
        subtitle="Nothing is built until its turn — and its turn is chosen deliberately. Here's the thinking that governs when and why this one gets built.">
        <Commentary kind="methodology" title="A deliberately-chosen probe, not a backlog item">
          <p>The portfolio is a <strong>fractional-factorial screening design</strong>: every axis-value appears at least once, so the whole space gets covered without building every combination. <strong>{poc.id}</strong> is one such point — selected for the specific question it answers (<em>{poc.question}</em>), not because it's next on a list. Each prototype earns its slot by the information it buys.</p>
        </Commentary>
        <Commentary kind="choice" title={`Sequenced into ${poc.wave}`}>
          <p>Its place in the schedule follows <strong>irreversibility × information-per-build</strong>. {poc.wave === "Wave 1" ? "Wave 1 is cheap two-way-door probes behind P0's stable contract — sprayed in parallel because they're reversible and independent." : poc.wave === "Wave 2" ? "Wave 2 is surfaces and the heavier methodology bet — built once the trunk and cheap probes have taught us what to compose." : poc.wave === "Wave 3" ? "Wave 3 opens the productization one-way doors (config, tenancy) — deliberately last, because they bake assumptions that are expensive to reverse." : "It's deferred until a real consumer exists — building it earlier would be speculative work against an interface that isn't wired yet."} Estimated cost: <strong>{poc.cost}</strong>.</p>
        </Commentary>
        <Commentary kind="perspective" title="Why it's in the portfolio">
          <p>{poc.why} Holding it as an <em>option</em> — mapped, costed, and sequenced — is itself valuable: it keeps the design space honest and makes the eventual convergence a choice among known alternatives rather than a leap.</p>
        </Commentary>
        <Commentary kind="principle" title="Expect to kill several — that's the point">
          <p>Set-based design means several of these planned probes will be <strong>retired by evidence</strong>, and that's a success, not a shortfall. Each one that dies cheaply narrows the field toward the surviving intersection that becomes the product. A placeholder here isn't a promise to build — it's a live option in an explicit, reproducible search.</p>
        </Commentary>
      </DesignNotes>

      <a href="#/" className="inline-block mt-6 text-[13px] text-blue-600 hover:text-blue-800">← Back to portfolio</a>
    </div>
  );
}
