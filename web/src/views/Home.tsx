// The hub landing — the portfolio as a map. Built POCs link to live demos;
// planned ones link to their placeholder card. Grouped by wave.
import { POCS, WAVES, type Poc } from "../portfolio";

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

export default function Home() {
  return (
    <div className="max-w-4xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">CIE Lab — Prototype Portfolio</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">reserved · local-first</span>
        </div>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          A deliberately-chosen set of ~10 prototypes exploring the Civic Intelligence Engine design space.
          Each is a point through the morphological field, sequenced by information-per-build and irreversibility.
          We iterate here and <span className="font-medium text-slate-600">converge late</span> — only survivors graduate to the team repo.
          Free LLM/embeddings via TELUS ($0); synthetic + public data only.
        </p>
      </header>

      <div className="mb-5 rounded-lg bg-blue-50 ring-1 ring-blue-200 px-4 py-2.5 text-[13px] text-blue-900">
        <span className="font-semibold">P0 is the trunk.</span> Wave 1 sprays cheap two-way-door probes behind its stable
        record-contract; Wave 3 opens the productization one-way doors. Expect to kill several — that's the cheap learning, not failure.
      </div>

      {WAVES.map((wave) => {
        const items = POCS.filter((p) => p.wave === wave);
        if (!items.length) return null;
        return (
          <section key={wave} className="mb-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">{wave}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {items.map((p) => <PocCard key={p.id} p={p} />)}
            </div>
          </section>
        );
      })}
    </div>
  );
}
