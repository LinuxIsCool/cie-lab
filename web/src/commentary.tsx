// Commentary = the "yellow card" look (same as P0's scope banner), reserved for
// design-space notes. A filled amber card with a bold lead + one concise sentence,
// placed next to whatever it explains. Amber is reserved for these cards only.
import type { ReactNode } from "react";

// kept for semantic authoring at call sites; styling is uniform (the yellow card).
export type Kind =
  | "principle" | "design" | "architecture" | "methodology"
  | "choice" | "perspective" | "goal" | "caveat";

export function Commentary({ title, children }: { kind?: Kind; title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-amber-50 ring-1 ring-amber-200 border-l-[3px] border-amber-400 px-3.5 py-2.5 text-[13px] leading-relaxed text-amber-900">
      <span className="font-semibold text-amber-950">{title}.</span>{" "}{children}
    </div>
  );
}

// A light titled group (no card of its own) so the amber cards stand on the page.
export function DesignNotes({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      {title && <h2 className="text-[13px] font-bold text-slate-700">{title}</h2>}
      {children}
    </section>
  );
}
