import { useEffect, useState } from "react";
import { api } from "../api";
import Chip, { CLASSES, SOURCE } from "./Chip";

export default function Detail({ e, onPatch, onNewMsg, onBack, toast }) {
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => setDraft(null), [e._id]);

  const gen = async () => {
    setBusy(true);
    try { setDraft((await api.post(`/emails/${e._id}/draft`)).draft); } catch (x) { toast(x.message); }
    setBusy(false);
  };
  const send = async () => {
    await onPatch({ reply: draft, done: true, waiting: true });
    toast("Reply approved and sent (simulated)");
  };

  return (
    <>
      <button className="btn g x" onClick={onBack}>← Back</button>
      <div className="mu">{e.from} · {e.dateLabel}</div>
      <h2>{e.subject}</h2>
      <div><Chip e={e} /> <span className="mu">{Math.round((e.conf || 0) * 100)}% confident · {SOURCE[e.source]}</span></div>

      <div className="ai">
        <h4>AI summary</h4>{e.summary}
        {e.meeting && <><br /><b>Key date:</b> {e.meeting}</>}
        <h4 style={{ marginTop: 10 }}>Why {CLASSES[e.cls]?.[0].toLowerCase()}</h4>{e.why}
      </div>

      {e.thread.map((m, i) => <div className="msg" key={i}><b>{m.from}</b><div>{m.text}</div></div>)}

      <div className="acts">
        <label className="mu">Reclassify{" "}
          <select value={e.cls} onChange={(ev) => { onPatch({ cls: ev.target.value }); toast("Classification updated"); }}>
            {Object.entries(CLASSES).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <button className="btn g" onClick={() => onPatch({ important: !e.important })}>{e.important ? "★ Important" : "☆ Mark important"}</button>
        <button className="btn g" onClick={() => onPatch({ unread: !e.unread })}>Mark unread</button>
        <button className="btn g" onClick={() => { onPatch({ archived: true }); toast("Archived"); }}>Archive</button>
        <button className="btn g" onClick={() => { onPatch({ done: true }); toast("Marked done"); }}>Mark done</button>
        <button className="btn g" onClick={onNewMsg}>Simulate new reply</button>
      </div>

      {draft === null
        ? <button className="btn" disabled={busy} onClick={gen}>{busy ? "Drafting…" : "✨ Draft reply"}</button>
        : <>
            <p className="mu">AI draft. Review and edit before sending.</p>
            <textarea value={draft} onChange={(ev) => setDraft(ev.target.value)} />
            <div className="acts"><button className="btn" onClick={send}>Approve &amp; send</button><button className="btn g" onClick={() => setDraft(null)}>Discard</button></div>
          </>}
    </>
  );
}
