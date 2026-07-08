// P10 · Comhairle Adapter-as-Tool / white-label: the deep-integration "join the
// crew" path. CIE's bridging living *inside* a Comhairle fork as a native tool,
// modeled on api/src/tools/polis.rs. A contribution plan shown at depth, not a
// live integration: Comhairle's interchange ingest is unwired, so export-first
// (P1) now, adapter-later. Deliberately deferred, like P9 is a shell.
import { Commentary } from "../commentary";

// The concrete build surface for a CIE ToolImpl, from CONTRIBUTION-PLAN / §10.3.
type BuildStep = { t: string; d: string; tag: string };

const BUILD: BuildStep[] = [
  {
    t: "A Civic Intelligence Engine ToolImpl, modeled on polis.rs",
    d: "Comhairle already carries a tool that wraps Pol.is. A Civic Intelligence Engine tool follows the same template (CieToolConfig, CieToolSetup, CieReport), so the Civic Intelligence Engine's bridging registers as a first-class Comhairle tool alongside the ones already there.",
    tag: "api/src/tools/cie.rs",
  },
  {
    t: "A cie_statement_aux table + migration",
    d: "Pol.is keeps its per-statement state in polis_statement_aux. The Civic Intelligence Engine gets its own parallel table for the statements, groups, and provenance it mirrors in, added through Comhairle's numbered Structured Query Language migration flow.",
    tag: "new migration",
  },
  {
    t: "The enum + match-arm + router surgery",
    d: "Comhairle names every tool in the ToolConfig, ToolSetup, and ReportConfig enums and routes each through router(). A Civic Intelligence Engine arm joins each one; the Rust compiler enforces exhaustiveness, so the tool is wired everywhere or the build stops.",
    tag: "compiler-enforced",
  },
  {
    t: "A real sync_data implementation",
    d: "The heart of the tool: sync_data mirrors a Civic Intelligence Engine export into cie_statement_aux, where open text becomes Statements and opinion groups become Groups with algorithm provenance, so a Comhairle workflow reads the Civic Intelligence Engine's results as native data.",
    tag: "the live seam",
  },
];

// The two schema holes this analysis found: the concrete "join the crew" offer.
const GIFTS = [
  {
    t: "A Reaction target-entity id",
    d: "Comhairle's Reaction records how someone responds to a Statement, and a target-entity id makes the thing responded-to explicit. Offering this field upstream lets a vote-to-statement link travel cleanly through the interchange grammar.",
  },
  {
    t: "A moderation / provenance entity",
    d: "The Civic Intelligence Engine's honesty layer distinguishes content hidden for tone from content excluded for integrity, and records which algorithm produced each result. A shared moderation-and-provenance entity gives that distinction a home in Comhairle's model, so the statistics stay trustworthy across the handoff.",
  },
];

export default function Adapter() {
  return (
    <div className="max-w-5xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Comhairle adapter: white-label</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P10 · Proof of concept #11</span>
        </div>
        <p className="text-sm text-slate-500">The Civic Intelligence Engine's bridging as a native Comhairle tool: the deep-integration "join the crew" path</p>
      </header>

      <div className="mb-5 space-y-2">
        <Commentary kind="perspective" title="What adapter-as-tool means">
          Comhairle is built to host <em>tools</em>: Pol.is is one of them, wrapped so its work shows up natively inside a
          Comhairle workflow. An adapter-as-tool makes the Civic Intelligence Engine another such tool: its bridging lives <em>inside</em> a
          Comhairle instance and speaks its language from within, rather than handing data across a boundary.
        </Commentary>
        <Commentary kind="choice" title="Inside, where P1 goes alongside">
          P1 keeps the two systems separate and passes a portable file between them: collaboration by exchange. This path
          places the Civic Intelligence Engine within Comhairle's own tool spine, so a Comhairle operator selects "the Civic Intelligence Engine" the way they select Pol.is.
          Both are contribution paths; this is the deeper one.
        </Commentary>
        <Commentary kind="goal" title="The white-label angle">
          Once the Civic Intelligence Engine is a Comhairle tool, it travels with every Comhairle instance. Anyone running Comhairle can offer its
          bridging under their own brand, letting the Civic Intelligence Engine's method reach communities through hosts it never has to run itself.
        </Commentary>
      </div>

      {/* what building the adapter takes */}
      <h2 className="text-sm font-semibold text-slate-600 mb-2">What building the adapter takes</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        {BUILD.map((b) => (
          <div key={b.t} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[13px] font-semibold text-slate-800">{b.t}</div>
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">{b.tag}</span>
            </div>
            <p className="text-[12px] text-slate-500 leading-snug mt-1">{b.d}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl bg-white ring-1 ring-slate-200 px-4 py-3 shadow-sm mb-5 flex items-center justify-between">
        <span className="text-[12px] text-slate-500">Modeled on Comhairle's existing Pol.is tool, the four pieces above are a discrete, fundable contribution.</span>
        <span className="text-sm font-bold tabular-nums text-slate-800 whitespace-nowrap">~7–12 engineer-days</span>
      </div>

      <div className="mb-5 space-y-2">
        <Commentary kind="methodology" title="Why it waits">
          A tool earns its keep when a workflow reads it. Comhairle's interchange ingest is unwired today, so a Civic Intelligence Engine tool
          would mirror data into cie_statement_aux with no live consumer yet. The value arrives once Comhairle wires that
          ingest and a Comhairle workflow has a reason to read the Civic Intelligence Engine from within.
        </Commentary>
        <Commentary kind="architecture" title="The license shapes the sequence">
          Comhairle is GNU Affero General Public License, version 3.0, and its §13 reaches network use: a hosted, modified Comhairle offers its complete source
          (the Civic Intelligence Engine tool and every change included) to everyone who uses it. That makes a fork a maintained, open commitment.
          So the reversible move leads: export-first through <strong>P1</strong> now, adapter-later here, with the Civic Intelligence Engine's own
          engine (see P9) staying the system of record throughout.
        </Commentary>
      </div>

      {/* two upstream gifts */}
      <h2 className="text-sm font-semibold text-slate-600 mb-2">Two upstream gifts: the contribution</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
        {GIFTS.map((g) => (
          <div key={g.t} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="text-[13px] font-semibold text-slate-800">{g.t}</div>
            <p className="text-[12px] text-slate-500 leading-snug mt-1">{g.d}</p>
          </div>
        ))}
      </div>
      <Commentary kind="principle" title="Turning compare into contribute">
        Both gifts are real gaps this analysis found in Comhairle's schema. Offering them upstream is the "join the crew"
        move, improving the shared grammar for every tool it carries, the Civic Intelligence Engine among them, and opening the door the adapter walks
        through later.
      </Commentary>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        A contribution plan shown at depth: the shape of the fork/adapter path and its upstream gifts, ready to fund once Comhairle has a live consumer.
      </footer>
    </div>
  );
}
