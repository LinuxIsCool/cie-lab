// App shell: a persistent left nav tree (the portfolio) + a hash-routed content
// area. Dependency-free routing (window.location.hash) — on-brand for a local-first
// lab and it gives every demo a shareable URL (#/p0, #/p6, …).
import { useEffect, useState } from "react";
import { POCS, WAVES, pocByRoute } from "./portfolio";
import Home from "./views/Home";
import Dashboard from "./views/Dashboard";
import Ask from "./views/Ask";
import Graph from "./views/Graph";
import Baseline from "./views/Baseline";
import Interop from "./views/Interop";
import Converse from "./views/Converse";
import Planned from "./views/Planned";

function useHashRoute() {
  const [route, setRoute] = useState(() => window.location.hash.slice(1) || "/");
  useEffect(() => {
    const on = () => setRoute(window.location.hash.slice(1) || "/");
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  // strip in-page anchors (#stmt-…) so they don't switch views
  return route.startsWith("/") ? route : "/";
}

function NavLink({ route, active, children }: { route: string; active: boolean; children: React.ReactNode }) {
  return (
    <a href={`#${route}`}
      className={`block rounded-md px-2 py-1.5 text-[13px] transition-colors ${
        active ? "bg-slate-800 text-white font-medium" : "text-slate-600 hover:bg-slate-100"
      }`}>
      {children}
    </a>
  );
}

function Sidebar({ route }: { route: string }) {
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-slate-50/60 h-screen sticky top-0 overflow-y-auto px-3 py-4">
      <a href="#/" className="flex items-center gap-2 px-2 mb-4">
        <span className="text-sm font-bold tracking-tight">CIE Lab</span>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-white">portfolio</span>
      </a>

      <NavLink route="/" active={route === "/"}>◆ Portfolio home</NavLink>

      <nav className="mt-3">
        {WAVES.map((wave) => {
          const items = POCS.filter((p) => p.wave === wave);
          if (!items.length) return null;
          return (
            <div key={wave} className="mb-3">
              <div className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{wave}</div>
              <div className="border-l border-slate-200 ml-2 pl-1.5 space-y-0.5">
                {items.map((p) => {
                  const active = route === p.route;
                  const built = p.status === "built";
                  return (
                    <NavLink key={p.id} route={p.route} active={active}>
                      <span className="flex items-center gap-1.5">
                        <span className={built ? "text-emerald-500" : "text-slate-300"}>{built ? "●" : "○"}</span>
                        <span className="tabular-nums text-[11px] opacity-70">{p.id}</span>
                        <span className="truncate">{p.short}</span>
                      </span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mt-4 px-2 text-[10px] text-slate-400 leading-relaxed">
        <span className="text-emerald-500">●</span> built · <span className="text-slate-300">○</span> planned<br />
        Free TELUS LLM/embeddings · $0
      </div>
    </aside>
  );
}

function Content({ route }: { route: string }) {
  if (route === "/") return <Home />;
  const poc = pocByRoute(route);
  if (!poc) return <Home />;
  if (poc.route === "/p0") return <Dashboard />;
  if (poc.route === "/p1") return <Interop />;
  if (poc.route === "/p2") return <Baseline />;
  if (poc.route === "/p3") return <Converse />;
  if (poc.route === "/p5") return <Graph />;
  if (poc.route === "/p6") return <Ask />;
  return <Planned poc={poc} />;
}

export default function App() {
  const route = useHashRoute();
  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <Sidebar route={route} />
      <main className="flex-1 min-w-0 px-6 py-6">
        <Content route={route} />
      </main>
    </div>
  );
}
