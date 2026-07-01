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
          The Civic Intelligence Engine (CIE) is a tool for helping a community be heard — and helping
          whoever represents it act on genuine common ground instead of a loud majority. This page is a working
          lab: a set of small prototypes, each testing one idea about how to build it. New here? The notes below
          explain the whole thing from scratch.
        </p>
      </header>

      {/* foundational orientation for a first-time visitor — the rest of the context lives on each demo */}
      <DesignNotes title="New here? Start with this">
        <Commentary kind="perspective" title="What this project is">
          Imagine someone running for local office, or a town government, that actually wants to hear its
          residents. A normal survey just counts heads and reports what the biggest group wants. CIE is built to
          answer a harder question — <em>what can this whole community, across its disagreements, actually
          agree on?</em> These demos are experiments in how to build that.
        </Commentary>
        <Commentary kind="goal" title="The problem it solves">
          Every community is divided — on housing, taxes, development, and more. If you only listen to the
          majority, you steamroll everyone else, and the decision has no real legitimacy. The useful thing to
          know isn't "what does 51% want?" but "what can people who disagree still live with?" That shared
          ground is what earns trust and holds up over time.
        </Commentary>
        <Commentary kind="methodology" title="The core idea — 'bridging'">
          People answer by agreeing, disagreeing, or passing on short statements. The tool then sorts them into a
          few <strong>opinion groups</strong> based purely on <em>how they voted</em> — never on who they are.
          A statement <strong>bridges</strong> when <em>every</em> group tends to agree with it, not just the
          biggest one. Those bridging statements are the real common ground, and finding them is the heart of
          the whole engine.
        </Commentary>
        <Commentary kind="principle" title="Why you can trust the numbers">
          The single rule everything obeys: every number you see comes from people's actual votes. The AI never
          decides what's popular — it only does the wordsmithing (naming the groups, paraphrasing comments,
          answering questions in plain English), and always points back to the votes. Take the AI away and the
          results are unchanged. That's what "a listening aid, never the measurement" means.
        </Commentary>
        <Commentary kind="design" title="What a 'prototype' here means">
          Each card below is a small, working experiment testing one idea — a different way to ask people, or a
          different way to show the results. We build the cheap ones, keep what works, and drop what doesn't.
          Several will be abandoned, and that's the method succeeding, not failing — it's how the real product
          gets found.
        </Commentary>
        <Commentary kind="architecture" title="Free, local, and private">
          Everything here runs on free AI models on this one machine ($0), using made-up sample data. No real
          person's information is involved, and nothing is sent to any company's cloud — which for a civic tool
          handling people's opinions isn't a nice-to-have, it's the point.
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
