// Typed commentary blocks — the "Insight block" voice, made into a first-class UI
// primitive. Each kind carries its own accent + chip so a reader can scan by the
// *kind of thinking*: Principle (ethical commitments), Design/Architecture (how it's
// built), Methodology (the research stance), Choice (a trade-off taken), Perspective
// (framing/context), Goal (what success is), Caveat (an honest limit).
import type { ReactNode } from "react";

export type Kind =
  | "principle" | "design" | "architecture" | "methodology"
  | "choice" | "perspective" | "goal" | "caveat";

const KINDS: Record<Kind, { label: string; bg: string; ring: string; text: string; chip: string; accent: string }> = {
  principle:    { label: "Principle",    bg: "bg-indigo-50",  ring: "ring-indigo-200",  text: "text-indigo-950",  chip: "bg-indigo-100 text-indigo-700",   accent: "#6366f1" },
  design:       { label: "Design",       bg: "bg-blue-50",    ring: "ring-blue-200",    text: "text-blue-950",    chip: "bg-blue-100 text-blue-700",       accent: "#3b82f6" },
  architecture: { label: "Architecture", bg: "bg-cyan-50",    ring: "ring-cyan-200",    text: "text-cyan-950",    chip: "bg-cyan-100 text-cyan-700",       accent: "#06b6d4" },
  methodology:  { label: "Methodology",  bg: "bg-violet-50",  ring: "ring-violet-200",  text: "text-violet-950",  chip: "bg-violet-100 text-violet-700",   accent: "#8b5cf6" },
  choice:       { label: "Choice",       bg: "bg-amber-50",   ring: "ring-amber-200",   text: "text-amber-950",   chip: "bg-amber-100 text-amber-800",     accent: "#f59e0b" },
  perspective:  { label: "Perspective",  bg: "bg-rose-50",    ring: "ring-rose-200",    text: "text-rose-950",    chip: "bg-rose-100 text-rose-700",       accent: "#f43f5e" },
  goal:         { label: "Goal",         bg: "bg-emerald-50", ring: "ring-emerald-200", text: "text-emerald-950", chip: "bg-emerald-100 text-emerald-700", accent: "#10b981" },
  caveat:       { label: "Caveat",       bg: "bg-slate-50",   ring: "ring-slate-200",   text: "text-slate-700",   chip: "bg-slate-200 text-slate-600",     accent: "#94a3b8" },
};

export function Commentary({ kind, title, children }: { kind: Kind; title: string; children: ReactNode }) {
  const k = KINDS[kind];
  return (
    <div className={`rounded-lg ${k.bg} ring-1 ${k.ring} pl-3.5 pr-4 py-3 border-l-[3px]`} style={{ borderLeftColor: k.accent }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: k.accent }} />
        <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${k.chip}`}>{k.label}</span>
        <span className={`text-[13px] font-semibold ${k.text}`}>{title}</span>
      </div>
      <div className={`text-[13px] leading-relaxed ${k.text} opacity-90 space-y-2 [&_strong]:font-semibold`}>{children}</div>
    </div>
  );
}

// A titled section that lays commentary blocks out in a responsive two-column grid.
export function DesignNotes({ title = "Design notes", subtitle, children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
        {title}
        <span className="h-px flex-1 bg-slate-200" />
      </h2>
      {subtitle && <p className="text-[12px] text-slate-400 mt-1 mb-3">{subtitle}</p>}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${subtitle ? "" : "mt-3"}`}>{children}</div>
    </section>
  );
}
