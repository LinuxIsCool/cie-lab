// The hub landing — the portfolio as a map. Built POCs link to live demos;
// planned ones link to their placeholder card. Grouped by wave.
import { POCS, WAVES, type Poc } from "../portfolio";
import { Commentary, DesignNotes } from "../commentary";

function PocCard({ p }: { p: Poc }) {
  const built = p.status === "built";
  return (
    <a href={`#${p.route}`}
      className={`block rounded-xl ring-1 p-4 shadow-sm transition-colors ${
        built ? "bg-white ring-slate-200 hover:ring-blue-300" : "bg-slate-50 ring-slate-200 hover:ring-slate-300"
      }`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{p.id} · {p.short}</span>
        {built ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200">{p.labPoc} · live</span>
        ) : (
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ring-1 ring-slate-200">{p.cost}</span>
        )}
      </div>
      <p className="mt-1.5 text-[12px] leading-snug text-slate-500">{p.question}</p>
    </a>
  );
}

const WAVE_BLURB: Record<string, string> = {
  Built: "Live demos — click any card to open it.",
  "Wave 1": "Cheap, independent experiments, run in parallel behind P0's stable core.",
  "Wave 2": "Built after the basics, once we know which pieces are worth combining.",
  "Wave 3": "Turning it into a product — saved for last because these are hard to undo.",
  Deferred: "Waiting on a real use before it's worth building.",
};

export default function Home() {
  return (
    <div className="max-w-4xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">CIE Lab — Prototype Portfolio</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">reserved · local-first</span>
        </div>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          A set of small prototypes exploring how the Civic Intelligence Engine could work. We build cheap
          experiments, keep what works, and drop what doesn't — the product is whatever survives.
        </p>
      </header>

      {/* the few ground rules that apply everywhere — the rest live on each demo, next to what they explain */}
      <DesignNotes title="The ground rules">
        <Commentary kind="principle" title="AI is a listening aid, never the measurement">
          Every number comes from real votes. The AI only labels groups, paraphrases comments, and routes questions — remove it and the numbers are unchanged.
        </Commentary>
        <Commentary kind="architecture" title="One data contract, many views">
          Every demo reads the same results file, so the engine underneath can be swapped without touching the screens.
        </Commentary>
        <Commentary kind="choice" title="Interoperate, don't fork">
          Comhairle's license blocks a hosted fork, so CIE builds its own core and connects to it at the data-exchange layer instead.
        </Commentary>
        <Commentary kind="architecture" title="Free and local">
          Runs on free TELUS models ($0) with synthetic/public data only — real constituent data stays behind a governance gate.
        </Commentary>
      </DesignNotes>

      <div className="mt-6">
        {WAVES.map((wave) => {
          const items = POCS.filter((p) => p.wave === wave);
          if (!items.length) return null;
          return (
            <section key={wave} className="mb-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{wave}</h2>
              <p className="text-[12px] text-slate-400 mb-2">{WAVE_BLURB[wave]}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map((p) => <PocCard key={p.id} p={p} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
