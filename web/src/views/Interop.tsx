// P1 · Comhairle Interop-Export — makes "interoperate, don't fork" concrete.
// Shows the raw deliberation exported as a portable flat-file (cie.interop.v0),
// the candidate field-mapping to Comhairle's grammar, and a download. Reads the
// prebuilt /interop.json + /interop_mapping.json (see analysis/interop.py).
import { useEffect, useState } from "react";
import { Commentary } from "../commentary";

type Interop = {
  schema: string; profile: string;
  conversation: { id: string; title: string; scope: string; n_participants: number; n_statements: number; n_votes: number };
  statements: { id: string; text: string; tag: string }[];
  participants: { id: string }[];
  votes: { participant: string; statement: string; value: string }[];
  value_codes: Record<string, number>;
  derived?: { note: string; groups: { id: string; size: number }[] };
};
type MapRow = { cie: string; interop: string; comhairle: string; verified: boolean };

export default function Interop() {
  const [doc, setDoc] = useState<Interop | null>(null);
  const [mapping, setMapping] = useState<MapRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/interop.json").then((r) => r.json()),
      fetch("/interop_mapping.json").then((r) => r.json()),
    ]).then(([d, m]) => { setDoc(d); setMapping(m.mapping); }).catch((e) => setErr(String(e)));
  }, []);

  if (err) return <div className="p-10 text-rose-600">Failed to load export: {err} <span className="text-slate-400">— run <code>cd analysis &amp;&amp; uv run python interop.py</code></span></div>;
  if (!doc || !mapping) return <div className="p-10 text-slate-400">Loading export…</div>;

  const unverified = mapping.filter((m) => !m.verified).length;

  return (
    <div className="max-w-5xl">
      <header className="mb-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight">Comhairle interop-export</h1>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white">P1 · POC #5</span>
        </div>
        <p className="text-sm text-slate-500">Hand the raw deliberation to another platform in a portable, tool-agnostic format</p>
      </header>

      <div className="mb-4 space-y-2">
        <Commentary kind="perspective" title="What this page is even about">
          There's another civic tool out there called <strong>Comhairle</strong> that does similar work. A natural
          temptation is to "fork" it — copy its open-source code and build your own version on top. But its license
          would then force CIE to give away any hosted product built from it. This page shows the smarter path:
          instead of copying code, make the two tools able to <em>exchange data</em>.
        </Commentary>
        <Commentary kind="choice" title="Interoperate, don't fork">
          So CIE builds its own core and, when it wants to collaborate, simply hands Comhairle the <em>data</em> in a
          shared, tool-neutral format — like emailing a spreadsheet anyone can open. Collaboration without copying code,
          and without inheriting a license CIE can't build a product under.
        </Commentary>
        <Commentary kind="methodology" title="'Lossless' means handing over the evidence, not the conclusions">
          The file carries the raw material — the statements, the (anonymous) participants, and every vote — <em>not</em>
          CIE's computed groups or consensus. That way the receiving tool re-runs its <em>own</em> analysis and draws
          its own conclusions; nothing is lost or pre-decided in the handoff.
        </Commentary>
      </div>

      {/* summary */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Statements", doc.conversation.n_statements],
          ["Participants", doc.conversation.n_participants],
          ["Votes", doc.conversation.n_votes],
          ["Schema", doc.schema],
        ].map(([k, v]) => (
          <div key={k as string} className="rounded-xl bg-white ring-1 ring-slate-200 px-3.5 py-3 shadow-sm">
            <div className="text-lg font-bold tabular-nums truncate">{v}</div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">{k}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* field mapping */}
        <div className="space-y-3">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-600 mb-3">Field mapping → Comhairle grammar</h2>
            <div className="space-y-2">
              {mapping.map((m, i) => (
                <div key={i} className="text-[12px] border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex items-center gap-1.5">
                    <code className="text-slate-700">{m.cie}</code>
                    {m.verified
                      ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">verified</span>
                      : <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">pending</span>}
                  </div>
                  <div className="text-slate-400 mt-0.5">→ <code>{m.interop}</code> → <code className="text-slate-500">{m.comhairle}</code></div>
                </div>
              ))}
            </div>
          </div>
          <Commentary kind="caveat" title={`${unverified} mapping still to verify`}>
            The vote→statement link maps to Comhairle's <code>Reaction.target_id</code>, but that field hasn't been checked against their current source yet. Marked <strong>pending</strong> rather than quietly assumed — an interop claim is only as good as its least-verified field.
          </Commentary>
        </div>

        {/* raw preview + download */}
        <div className="space-y-3">
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-600">The flat-file <span className="font-mono text-[11px] text-slate-400">{doc.schema}</span></h2>
              <a download="cie-interop-v0.json" href="/interop.json"
                className="text-[12px] font-medium rounded-lg bg-slate-800 text-white px-3 py-1.5 hover:bg-slate-700">Download .json</a>
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1">statements[0..2]</div>
            <pre className="text-[11px] leading-relaxed bg-slate-50 rounded-lg p-2.5 overflow-x-auto text-slate-600 ring-1 ring-slate-100">{JSON.stringify(doc.statements.slice(0, 3), null, 1)}</pre>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1 mt-3">votes[0..3] · codes {JSON.stringify(doc.value_codes)}</div>
            <pre className="text-[11px] leading-relaxed bg-slate-50 rounded-lg p-2.5 overflow-x-auto text-slate-600 ring-1 ring-slate-100">{JSON.stringify(doc.votes.slice(0, 4), null, 1)}</pre>
          </div>
          <Commentary kind="principle" title="No identities leave the building">
            Participants export as an opaque id and nothing else — no names, no demographics. The portable file carries how people voted, never who they are.
          </Commentary>
        </div>
      </div>

      <footer className="mt-8 text-center text-[11px] text-slate-400">
        Built from the same synthetic deliberation as P0 · a candidate mapping, published honestly with its open questions.
      </footer>
    </div>
  );
}
