import { useMemo, useState } from "react";
import { api } from "../api";
import Chip from "./Chip";
import Detail from "./Detail";

const SEGS = [["all", "All"], ["assistant", "Assistant"], ["client", "Client"], ["none", "No reply"], ["review", "Needs review"], ["meet", "Meetings"], ["important", "Important"], ["wait", "Waiting"], ["done", "Done"]];
const match = { all: () => true, assistant: (e) => e.cls === "assistant", client: (e) => e.cls === "client", none: (e) => e.cls === "none", review: (e) => e.cls === "review", meet: (e) => !!e.meeting, important: (e) => e.important, wait: (e) => e.waiting };

export default function Assistant({ emails, setEmails, sel, setSel, toast }) {
  const [seg, setSeg] = useState("all");
  const [q, setQ] = useState("");
  const [question, setQuestion] = useState("");
  const [ans, setAns] = useState(null);
  const [asking, setAsking] = useState(false);

  const open = emails.filter((e) => !e.archived && !e.done);
  const count = (k) => open.filter((e) => e.cls === k).length;
  const rows = useMemo(() => {
    const base = seg === "done" ? emails.filter((e) => e.done && !e.archived) : open.filter(match[seg]);
    const t = q.toLowerCase();
    return base.filter((e) => (e.subject + e.from + e.thread[0].text).toLowerCase().includes(t));
  }, [emails, seg, q]);
  const current = emails.find((e) => e._id === sel);

  const replace = (u) => setEmails((es) => es.map((x) => (x._id === u._id ? u : x)));
  const patch = async (id, body) => {
    try { const u = await api.patch(`/emails/${id}`, body); replace(u); if (u.archived || u.done) setSel(null); } catch (x) { toast(x.message); }
  };
  const openEmail = async (e) => { setSel(e._id); if (e.unread) patch(e._id, { unread: false }).then(() => setSel(e._id)); };
  const newMsg = async (id) => {
    try { replace(await api.post(`/emails/${id}/messages`)); toast("New message arrived. AI re-evaluated this thread."); } catch (x) { toast(x.message); }
  };
  const ask = async (text = question) => {
    if (!text.trim()) return;
    setQuestion(text); setAsking(true);
    try { setAns(await api.post("/ai/ask", { question: text, selectedId: sel })); } catch (x) { setAns({ answer: x.message, emailIds: [] }); }
    setAsking(false);
  };

  const stats = [[open.length, "Open emails", "all"], [open.filter((e) => e.unread).length, "Unread", "all"], [count("client"), "Need client", "client"], [count("assistant"), "Assistant to-do", "assistant"], [open.filter((e) => e.waiting).length, "Waiting", "wait"]];

  return (
    <div className="wrap">
      <div className="stats">{stats.map(([n, label, s]) => <div key={label} className="card stat" onClick={() => setSeg(s)}><b>{n}</b><span>{label}</span></div>)}</div>
      <div className="segs">{SEGS.map(([k, label]) => <button key={k} className={"seg" + (seg === k ? " on" : "")} onClick={() => setSeg(k)}>{label}</button>)}</div>

      <div className="main">
        <div>
          <input className="search" placeholder="Search conversations" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="card" style={{ overflow: "hidden" }}>
            {rows.length === 0 && <div className="empty">Nothing here. Inbox zero for this segment 🎉</div>}
            {rows.map((e) => (
              <button key={e._id} className={"row" + (e.unread ? " un" : "") + (sel === e._id ? " on" : "")} onClick={() => openEmail(e)}>
                <div className="fr"><span className="sj">{e.important ? "★ " : ""}{e.from}</span><span className="mu">{e.dateLabel}</span></div>
                <div className="sj">{e.subject}</div>
                <div style={{ marginTop: 4 }}><Chip e={e} />{e.meeting && <span className="mu"> 📅 {e.meeting}</span>}</div>
              </button>
            ))}
          </div>

          <div className="ask">
            <input placeholder="Ask AI: “Which emails need the client?”" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === "Enter" && ask()} />
            <button className="btn" disabled={asking} onClick={() => ask()}>{asking ? "…" : "Ask"}</button>
          </div>
          <div className="mu" style={{ marginTop: 6 }}>
            Try: <button className="lnk" onClick={() => ask("Which emails require the client’s attention?")}>client attention</button>·
            <button className="lnk" onClick={() => ask("What am I waiting for a response on?")}>waiting</button>·
            <button className="lnk" onClick={() => ask("Summarize this conversation.")}>summarize selected</button>
          </div>
          {ans && (
            <div className="card ans">
              {ans.answer}
              {ans.emailIds.length > 0 && <ul>{ans.emailIds.map((id) => { const e = emails.find((x) => x._id === id); return e && <li key={id}><a onClick={() => setSel(id)}>{e.subject}</a> <span className="mu">{e.from}</span></li>; })}</ul>}
            </div>
          )}
        </div>

        {current && (
          <div className="card det">
            <Detail e={current} onPatch={(b) => patch(current._id, b)} onNewMsg={() => newMsg(current._id)} onBack={() => setSel(null)} toast={toast} />
          </div>
        )}
      </div>
    </div>
  );
}
