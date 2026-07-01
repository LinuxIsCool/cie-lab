// The prototype portfolio — single source of truth for the nav tree, the hub, and
// the "planned" placeholders. Mirrors the vision doc's 10-prototype table (§7), so
// the sidebar is a faithful map of the design space, not invented labels.

export type PocStatus = "built" | "planned";

export type Poc = {
  id: string; // "P0"
  route: string; // "/p0"
  short: string; // sidebar label
  title: string; // full name
  status: PocStatus;
  wave: string; // grouping key: "Built" | "Wave 1" | "Wave 2" | "Wave 3" | "Deferred"
  labPoc?: string; // "POC #1" — only for built ones
  question: string; // the research question it answers
  why: string; // why it's in the portfolio
  cost: string; // rough build cost
};

export const POCS: Poc[] = [
  {
    id: "P0", route: "/p0", short: "Core listening loop", title: "Spine / Record-Contract Reference",
    status: "built", wave: "Built", labPoc: "POC #1",
    question: "Does the elicitation-agnostic contract + append-only/consent/validity trust layer hold under a real pilot?",
    why: "The deep one-way door — the trunk everything else plugs into.", cost: "already built",
  },
  {
    id: "P6", route: "/p6", short: "Ask-the-Constituency", title: "Ask-the-Constituency (chat-to-query)",
    status: "built", wave: "Built", labPoc: "POC #2",
    question: "Is 'ask your results and get a sourced answer' the killer candidate surface?",
    why: "Tests a thin chat-query layer over P0/P5's gated data.", cost: "low-med",
  },
  {
    id: "P1", route: "/p1", short: "Comhairle interop-export", title: "Comhairle Interop-Export Adapter",
    status: "built", wave: "Built", labPoc: "POC #5",
    question: "Can CIE losslessly-enough speak the Metagov/Comhairle grammar?",
    why: "Retires the fork/adapter axis cheaply; the reversible interop option before any fork temptation.", cost: "~2–4 d",
  },
  {
    id: "P2", route: "/p2", short: "Classic Pol.is baseline", title: "Classic Pol.is Baseline",
    status: "built", wave: "Built", labPoc: "POC #4",
    question: "Does vote-only + opinion map give a compelling read at least friction?",
    why: "Control for vote-only elicitation / opinion-map surface.", cost: "low",
  },
  {
    id: "P3", route: "/p3", short: "Conversational elicitation", title: "Conversational Elicitation",
    status: "planned", wave: "Wave 1",
    question: "Does LLM-chat elicitation beat vote+text, and can LLM synthesis be made defensible?",
    why: "Tests chat elicitation + LLM synthesis; surfaces the egress/governance risk.", cost: "med",
  },
  {
    id: "P5", route: "/p5", short: "Knowledge-graph sensemaking", title: "Knowledge-Graph Sensemaking",
    status: "built", wave: "Built", labPoc: "POC #3",
    question: "Can a position/claim graph beat clustering for exploration?",
    why: "Tests a KG sensemaking substrate; the substrate P6 can also query.", cost: "med-high",
  },
  {
    id: "P7", route: "/p7", short: "Hybrid quant+qual", title: "Hybrid Quant+Qual",
    status: "planned", wave: "Wave 1",
    question: "Does bridging + light self-coding beat either alone?",
    why: "Likely the strongest product candidate.", cost: "med",
  },
  {
    id: "P4", route: "/p4", short: "PNI depth", title: "PNI Depth",
    status: "planned", wave: "Wave 2",
    question: "Is full Participatory Narrative Inquiry depth worth its methodology cost?",
    why: "Exercises the whole methodology axis (the OpenCivics bet).", cost: "high",
  },
  {
    id: "P8", route: "/p8", short: "Config wizard", title: "Config Wizard",
    status: "planned", wave: "Wave 3",
    question: "Can a non-technical campaign stand up an instance unaided?",
    why: "The two-way door before SaaS.", cost: "med",
  },
  {
    id: "P9", route: "/p9", short: "Multi-tenant SaaS shell", title: "Multi-Tenant SaaS Shell (own core)",
    status: "planned", wave: "Wave 3",
    question: "What does tenancy isolation demand of the record contract / trust model?",
    why: "The productization one-way door; surfaces tenancy assumptions early. AGPL-free.", cost: "high",
  },
  {
    id: "P10", route: "/p10", short: "Comhairle adapter / white-label", title: "Comhairle Adapter-as-Tool / white-label",
    status: "planned", wave: "Deferred",
    question: "The Phase-2 'join the crew' contribution.",
    why: "Only once Comhairle wires its ingest; else defer via ADR.", cost: "high",
  },
];

// Nav-tree grouping order.
export const WAVES = ["Built", "Wave 1", "Wave 2", "Wave 3", "Deferred"] as const;

export const pocByRoute = (route: string): Poc | undefined => POCS.find((p) => p.route === route);
