// P9 · Multi-tenant software-as-a-service shell: the productization one-way door.
// Not a full software-as-a-service; its job is to surface what tenancy demands of
// the data contract before those assumptions bake in. A console of isolated
// instances plus the contract implications.
import { Commentary } from "../commentary";

type Tenant = {
  id: string; name: string; community: string; participants: number;
  elicitation: string; depth: string; surfaces: string[]; status: "live" | "collecting" | "draft";
};

const TENANTS: Tenant[] = [
  { id: "t_riverside", name: "Riverside Ward 2026", community: "Riverside district", participants: 812, elicitation: "vote + comments", depth: "light", surfaces: ["dashboard", "ask"], status: "live" },
  { id: "t_hillcrest", name: "Hillcrest Council", community: "Hillcrest township", participants: 1340, elicitation: "voting", depth: "none", surfaces: ["dashboard"], status: "live" },
  { id: "t_delta", name: "Delta Transit Consult", community: "Delta county riders", participants: 460, elicitation: "conversation", depth: "full", surfaces: ["dashboard", "graph"], status: "collecting" },
  { id: "t_oakmont", name: "Oakmont Budget 2027", community: "Oakmont residents", participants: 0, elicitation: "vote + comments", depth: "light", surfaces: ["dashboard", "ask"], status: "draft" },
];

const STATUS: Record<Tenant["status"], string> = {
  live: "bg-emerald-100 text-emerald-700", collecting: "bg-sky-100 text-sky-700", draft: "bg-slate-100 text-slate-500",
};

const DEMANDS = [
  { t: "A tenant id on every record", d: "Every vote, statement, story, and result carries which instance it belongs to: nothing can be read or written without it. This reaches down into cie.results.v0 and the interop file themselves." },
  { t: "Config and governance are per-tenant", d: "Each instance keeps its own elicitation mode, depth, and privacy gate. One campaign's settings can never touch another's, and the gate is enforced separately for each." },
  { t: "Export and deletion are tenant-scoped", d: "A campaign can take or erase all of its own data, and only its own, on request. Clean boundaries make privacy promises and data-rights requests keepable." },
  { t: "No shared analysis state", d: "Bridging and clustering run strictly inside one instance's data. Opinion groups never form across campaigns; results are computed and cached per tenant." },
];

export default function Tenancy() {
  return (
    <div className="max-w-5xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Multi-tenant software-as-a-service shell</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P9 · Proof of concept #10</span>
        </div>
        <p className="text-sm text-slate-500">Many campaigns on shared infrastructure, and what that asks of the data contract</p>
      </header>

      <div className="mb-5 space-y-2">
        <Commentary kind="perspective" title="What a platform adds">
          Running one campaign is a project; hosting many campaigns on shared infrastructure is a product. This console shows several instances side by side, each sealed off from the others: the shape a productized Civic Intelligence Engine would take.
        </Commentary>
        <Commentary kind="choice" title="Why settle this early">
          Tenancy is a one-way door. The moment several campaigns share a system, every record needs to know which instance it belongs to, and that assumption reaches into the data contract itself. Seeing these demands now, on a shell, keeps them from being an expensive retrofit later.
        </Commentary>
      </div>

      {/* tenant console */}
      <div className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm overflow-hidden mb-5">
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-600">Instances</h2>
          <span className="text-[11px] text-slate-400">{TENANTS.length} tenants · fully isolated</span>
        </div>
        {TENANTS.map((t) => (
          <div key={t.id} className="px-4 py-3 border-b border-slate-50 last:border-0 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 truncate">{t.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${STATUS[t.status]}`}>{t.status}</span>
              </div>
              <div className="text-[12px] text-slate-400 truncate">{t.community} · <code className="text-slate-400">{t.id}</code></div>
            </div>
            <div className="hidden sm:block text-[12px] text-slate-500 w-40 truncate">{t.elicitation} · {t.depth}</div>
            <div className="hidden md:flex gap-1">
              {t.surfaces.map((s) => <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{s}</span>)}
            </div>
            <div className="text-right w-24">
              <div className="text-sm font-bold tabular-nums text-slate-800">{t.participants.toLocaleString()}</div>
              <div className="text-[10px] uppercase tracking-wide text-slate-400">participants</div>
            </div>
          </div>
        ))}
      </div>

      {/* what tenancy demands of the contract */}
      <h2 className="text-sm font-semibold text-slate-600 mb-2">What isolation demands of the data</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DEMANDS.map((d) => (
          <div key={d.t} className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="text-[13px] font-semibold text-slate-800">{d.t}</div>
            <p className="text-[12px] text-slate-500 leading-snug mt-1">{d.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        <Commentary kind="architecture" title="Built on our own core">
          Because the Civic Intelligence Engine is built on its own engine rather than a fork of someone else's, it can be offered as a hosted product at all. The licensing dead-end that ruled out copying another platform (see P1) is exactly what this depends on.
        </Commentary>
        <Commentary kind="goal" title="The real question this forces">
          The demands above are the price of scale. Whether the Civic Intelligence Engine ever becomes a product, or stays a single-campaign recipe run fresh each time, is the choice this shell puts in front of you. It's worth making deliberately, since the data model follows from it.
        </Commentary>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        A shell, not a live software-as-a-service product. Its value is making tenancy's demands on the contract visible before they're committed to.
      </footer>
    </div>
  );
}
