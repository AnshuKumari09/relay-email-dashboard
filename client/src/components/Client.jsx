import { api } from "../api";

export default function Client({ user, emails, setEmails, onOpen, toast }) {
  const mine = emails.filter((e) => e.cls === "client" && !e.archived && !e.done);
  const act = async (e, body, msg) => {
    try { const u = await api.patch(`/emails/${e._id}`, body); setEmails((es) => es.map((x) => (x._id === u._id ? u : x))); toast(msg); } catch (x) { toast(x.message); }
  };
  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <h1 style={{ letterSpacing: "-.02em", margin: "8px 0 2px" }}>Hi {user.clientName.split(" ")[0]}</h1>
      <p className="mu" style={{ fontSize: 14 }}>{mine.length ? `${mine.length} email${mine.length > 1 ? "s need" : " needs"} you personally.` : "You’re all caught up."}</p>
      {mine.length === 0 && <div className="card empty">Nothing needs your attention ✨</div>}
      {mine.map((e) => (
        <div className="card cc" key={e._id}>
          <div className="mu">{e.from} · {e.dateLabel}</div>
          <h3>{e.subject}</h3>
          <p style={{ margin: "6px 0" }}>{e.summary}</p>
          <p className="mu" style={{ margin: "0 0 12px" }}><b>Why you:</b> {e.why}</p>
          <div className="acts" style={{ margin: 0 }}>
            <button className="btn g" onClick={() => onOpen(e._id)}>Open conversation</button>
            <button className="btn" onClick={() => act(e, { done: true }, "Marked handled. Your assistant sees this.")}>Mark handled</button>
            <button className="btn g" onClick={() => act(e, { cls: "assistant" }, "Handed to your assistant")}>Assistant take over</button>
          </div>
        </div>
      ))}
    </div>
  );
}
