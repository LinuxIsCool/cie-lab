// Compact, plain-language notes. One accent dot + a bold lead + a single sentence.
// No tinted cards, no chips, no jargon — the goal is "understand at a glance."
// `kind` only tints the dot (hover shows the label); it never adds visual noise.
import type { ReactNode } from "react";

export type Kind =
  | "principle" | "design" | "architecture" | "methodology"
  | "choice" | "perspective" | "goal" | "caveat";

const ACCENT: Record<Kind, { label: string; color: string }> = {
  principle:    { label: "Principle",    color: "#6366f1" },
  design:       { label: "Design",       color: "#3b82f6" },
  architecture: { label: "Architecture", color: "#06b6d4" },
  methodology:  { label: "Methodology",  color: "#8b5cf6" },
  choice:       { label: "Choice",       color: "#f59e0b" },
  perspective:  { label: "Perspective",  color: "#f43f5e" },
  goal:         { label: "Goal",         color: "#10b981" },
  caveat:       { label: "Caveat",       color: "#94a3b8" },
};

export function Commentary({ kind, title, children }: { kind: Kind; title: string; children: ReactNode }) {
  const a = ACCENT[kind];
  return (
    <div className="flex gap-2.5">
      <span className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0" style={{ background: a.color }} title={a.label} />
      <p className="text-[13px] leading-relaxed text-slate-600">
        <span className="font-semibold text-slate-800">{title}.</span>{" "}{children}
      </p>
    </div>
  );
}

// A quiet, contained "how to read this" panel. Single column, tight.
export function DesignNotes({ title = "How to read this", children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
      <h2 className="text-[13px] font-bold text-slate-700 mb-2.5">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
