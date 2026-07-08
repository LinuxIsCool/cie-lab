// P8 · Config wizard: a non-technical campaign stands up an instance unaided.
// Each choice is one axis of the design space the prototypes explored; the review
// screen emits a cie.config.v0 and links to the demos that match the picks.
import { useMemo, useState } from "react";
import { Commentary } from "../commentary";

type Elicitation = "vote" | "vote_text" | "conversation";
type Depth = "none" | "light" | "full";
type Config = {
  campaign: { name: string; community: string };
  elicitation: Elicitation;
  depth: Depth;
  surfaces: { dashboard: boolean; ask: boolean; graph: boolean };
  governance: { anonymize: boolean; paraphrase: boolean; gate: boolean };
};

const STEPS = ["Campaign", "Taking part", "Depth", "What you show", "Privacy", "Review"];

function Choice({ active, onClick, title, children }: { active: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`text-left w-full rounded-xl ring-1 p-3.5 transition-colors ${active ? "bg-blue-50 ring-blue-300" : "bg-white ring-slate-200 hover:ring-slate-300"}`}>
      <div className="flex items-center gap-2">
        <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${active ? "border-blue-500 bg-blue-500" : "border-slate-300"}`} />
        <span className="text-sm font-semibold text-slate-800">{title}</span>
      </div>
      <p className="text-[12px] text-slate-500 mt-1 pl-[22px]">{children}</p>
    </button>
  );
}

function Toggle({ on, onClick, title, children }: { on: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-left w-full flex items-start gap-3 rounded-xl bg-white ring-1 ring-slate-200 p-3.5 hover:ring-slate-300">
      <span className={`mt-0.5 w-9 h-5 rounded-full p-0.5 shrink-0 transition-colors ${on ? "bg-blue-500" : "bg-slate-300"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
      </span>
      <div>
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <div className="text-[12px] text-slate-500">{children}</div>
      </div>
    </button>
  );
}

export default function Wizard() {
  const [step, setStep] = useState(0);
  const [cfg, setCfg] = useState<Config>({
    campaign: { name: "", community: "" },
    elicitation: "vote_text",
    depth: "light",
    surfaces: { dashboard: true, ask: true, graph: false },
    governance: { anonymize: true, paraphrase: true, gate: true },
  });

  const hasFreeText = cfg.elicitation !== "vote";
  const matches = useMemo(() => {
    const m: { label: string; route: string }[] = [];
    m.push(cfg.elicitation === "vote" ? { label: "P2 · vote-only", route: "/p2" }
      : cfg.elicitation === "conversation" ? { label: "P3 · conversation", route: "/p3" }
      : { label: "P0 · vote + comments", route: "/p0" });
    if (cfg.depth === "full") m.push({ label: "P4 · full Participatory Narrative Inquiry", route: "/p4" });
    if (cfg.surfaces.dashboard) m.push({ label: "P0 · dashboard", route: "/p0" });
    if (cfg.surfaces.ask) m.push({ label: "P6 · ask-your-constituency", route: "/p6" });
    if (cfg.surfaces.graph) m.push({ label: "P5 · knowledge graph", route: "/p5" });
    return m;
  }, [cfg]);

  const configDoc = { schema: "cie.config.v0", ...cfg, governance: { ...cfg.governance, gate: cfg.governance.gate && hasFreeText } };
  const download = "data:application/json," + encodeURIComponent(JSON.stringify(configDoc, null, 2));

  return (
    <div className="max-w-3xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Config wizard</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P8 · Proof of concept #9</span>
        </div>
        <p className="text-sm text-slate-500">Set up a listening instance in plain language: no engineer required</p>
      </header>

      <div className="mb-5 space-y-2">
        <Commentary kind="perspective" title="What this is">
          Standing up a listening instance should be something a campaign can do on its own. This wizard walks through the same choices the lab explored, in everyday terms, and hands back a ready configuration at the end.
        </Commentary>
        <Commentary kind="design" title="The design space, as knobs">
          Each question here is one of the axes the prototypes tested: how people take part, how deeply to listen, what to show. This is the point where the map of experiments becomes a product a person can actually set up.
        </Commentary>
      </div>

      {/* stepper */}
      <div className="mb-5 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1.5">
            <button onClick={() => setStep(i)} className={`text-[11px] px-2 py-1 rounded-full ${i === step ? "bg-slate-800 text-white" : i < step ? "bg-slate-200 text-slate-600" : "bg-slate-100 text-slate-400"}`}>{i + 1}. {s}</button>
            {i < STEPS.length - 1 && <span className="text-slate-300">›</span>}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-white ring-1 ring-slate-200 p-5 shadow-sm min-h-[240px]">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="text-[13px] font-medium text-slate-700">Campaign or office name</label>
              <input value={cfg.campaign.name} onChange={(e) => setCfg({ ...cfg, campaign: { ...cfg.campaign, name: e.target.value } })}
                placeholder="e.g. Riverside Ward 2026" className="mt-1 w-full rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            <div>
              <label className="text-[13px] font-medium text-slate-700">Who are you listening to?</label>
              <input value={cfg.campaign.community} onChange={(e) => setCfg({ ...cfg, campaign: { ...cfg.campaign, community: e.target.value } })}
                placeholder="e.g. residents of the Riverside district" className="mt-1 w-full rounded-lg ring-1 ring-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-2.5">
            <Choice active={cfg.elicitation === "vote"} onClick={() => setCfg({ ...cfg, elicitation: "vote" })} title="Voting only">
              People agree, disagree, or pass on short statements. Fastest and lowest-effort. (Demonstrated in P2.)
            </Choice>
            <Choice active={cfg.elicitation === "vote_text"} onClick={() => setCfg({ ...cfg, elicitation: "vote_text" })} title="Voting + comments">
              Voting, plus an optional comment. The balanced default most campaigns want. (Demonstrated in P0.)
            </Choice>
            <Choice active={cfg.elicitation === "conversation"} onClick={() => setCfg({ ...cfg, elicitation: "conversation" })} title="Guided conversation">
              A facilitator chats with each person and reflects back their views. Reaches people a form misses. (Demonstrated in P3.)
            </Choice>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-2.5">
            <Choice active={cfg.depth === "none"} onClick={() => setCfg({ ...cfg, depth: "none" })} title="Votes only">
              Measure agreement and nothing more. Simplest to run and read.
            </Choice>
            <Choice active={cfg.depth === "light"} onClick={() => setCfg({ ...cfg, depth: "light" })} title="Light: did people feel heard?">
              Two quick ratings ride the vote, so you learn how the process felt without extra burden. (Demonstrated in P0.)
            </Choice>
            <Choice active={cfg.depth === "full"} onClick={() => setCfg({ ...cfg, depth: "full" })} title="Full: people's stories">
              Collect and interpret stories for the richest picture. Deepest listening, and the most effort. (Demonstrated in P4.)
            </Choice>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2.5">
            <Toggle on={cfg.surfaces.dashboard} onClick={() => setCfg({ ...cfg, surfaces: { ...cfg.surfaces, dashboard: !cfg.surfaces.dashboard } })} title="Dashboard">
              The main view of common ground, opinion groups, and what people said. (P0)
            </Toggle>
            <Toggle on={cfg.surfaces.ask} onClick={() => setCfg({ ...cfg, surfaces: { ...cfg.surfaces, ask: !cfg.surfaces.ask } })} title="Ask your constituency">
              Ask questions in plain English and get answers grounded in the votes. (P6)
            </Toggle>
            <Toggle on={cfg.surfaces.graph} onClick={() => setCfg({ ...cfg, surfaces: { ...cfg.surfaces, graph: !cfg.surfaces.graph } })} title="Knowledge graph">
              A map of how positions and voices connect, for open-ended exploration. (P5)
            </Toggle>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-2.5">
            <Toggle on={cfg.governance.anonymize} onClick={() => setCfg({ ...cfg, governance: { ...cfg.governance, anonymize: !cfg.governance.anonymize } })} title="Anonymize participants">
              Store how people voted, never who they are. Recommended on.
            </Toggle>
            <Toggle on={cfg.governance.paraphrase} onClick={() => setCfg({ ...cfg, governance: { ...cfg.governance, paraphrase: !cfg.governance.paraphrase } })} title="Paraphrase comments">
              Show the sense of a comment without publishing it word-for-word. Recommended on.
            </Toggle>
            <Toggle on={cfg.governance.gate} onClick={() => setCfg({ ...cfg, governance: { ...cfg.governance, gate: !cfg.governance.gate } })} title="Governance gate for free text">
              {hasFreeText
                ? "Your setup collects free text, which an artificial intelligence reads. Route it through a consent and review gate first. Strongly recommended."
                : "Only needed when you collect free text; your current setup is votes-only, so this stays off."}
            </Toggle>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-slate-700">{cfg.campaign.name || "Your instance"}</div>
              <div className="text-[13px] text-slate-500">Listening to {cfg.campaign.community || "your community"}.</div>
            </div>
            <div className="text-[13px] text-slate-600 space-y-1">
              <div>• People take part by <strong>{cfg.elicitation === "vote" ? "voting" : cfg.elicitation === "conversation" ? "guided conversation" : "voting and optional comments"}</strong>.</div>
              <div>• Listening depth: <strong>{cfg.depth === "none" ? "votes only" : cfg.depth === "light" ? "light (feeling-heard)" : "full (stories)"}</strong>.</div>
              <div>• You'll show: <strong>{[cfg.surfaces.dashboard && "dashboard", cfg.surfaces.ask && "ask", cfg.surfaces.graph && "graph"].filter(Boolean).join(", ") || "nothing selected"}</strong>.</div>
              <div>• Privacy: <strong>{[cfg.governance.anonymize && "anonymized", cfg.governance.paraphrase && "paraphrased", (cfg.governance.gate && hasFreeText) && "gated free-text"].filter(Boolean).join(", ") || "none"}</strong>.</div>
            </div>

            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Preview the pieces you chose</div>
              <div className="flex flex-wrap gap-1.5">
                {matches.map((m, i) => (
                  <a key={i} href={`#${m.route}`} className="text-[11px] font-medium rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 px-2 py-0.5 hover:bg-blue-100">{m.label}</a>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a download="cie-config-v0.json" href={download} className="text-[12px] font-medium rounded-lg bg-slate-800 text-white px-3 py-1.5 hover:bg-slate-700">Download config</a>
              <span className="text-[11px] text-slate-400">cie.config.v0: the instance definition</span>
            </div>
          </div>
        )}
      </div>

      {/* nav */}
      <div className="mt-4 flex items-center justify-between">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
          className="text-[13px] rounded-lg px-3 py-1.5 text-slate-600 disabled:opacity-30 hover:bg-slate-100">← Back</button>
        {step < STEPS.length - 1
          ? <button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="text-[13px] font-medium rounded-lg bg-slate-800 text-white px-4 py-1.5 hover:bg-slate-700">Next →</button>
          : <span className="text-[12px] text-emerald-700 font-medium">Ready to launch ✓</span>}
      </div>

      <div className="mt-5">
        <Commentary kind="goal" title="A door you can walk back through">
          These are reversible choices: a campaign can start simple and add depth or surfaces later as trust grows. Keeping setup this light, and this changeable, is what makes the tool approachable before anyone commits to a bigger platform.
        </Commentary>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Every option maps to a working demo in this lab: the wizard configures real pieces, not a promise.
      </footer>
    </div>
  );
}
