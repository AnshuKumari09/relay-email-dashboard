import { useEffect, useState } from "react";
import { api, setToken } from "./api";
import Onboarding from "./components/Onboarding.jsx";
import Assistant from "./components/Assistant.jsx";
import Client from "./components/Client.jsx";

export default function App() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [emails, setEmails] = useState([]);
  const [view, setView] = useState("assistant");
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);

  const toast = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2400); };

  useEffect(() => {
    (async () => {
      try {
        const u = await api.get("/auth/me");
        setUser(u);
        if (u.account) setEmails(await api.get("/emails"));
      } catch { setToken(null); }
      setReady(true);
    })();
  }, []);

  const logout = () => { setToken(null); setUser(null); setEmails([]); };
  const resync = async () => {
    setSyncing(true);
    try { setEmails(await api.post("/emails/sync", { provider: user.account.provider })); setUser({ ...user, account: { ...user.account, lastSync: new Date() } }); toast("Inbox synced"); } catch (x) { toast(x.message); }
    setSyncing(false);
  };

  if (!ready) return <div className="empty">Loading…</div>;
  if (!user || !user.account)
    return <Onboarding user={user} onAuth={setUser} onConnected={(list, provider) => { setEmails(list); setUser((u) => ({ ...u, account: { provider, lastSync: new Date() } })); }} />;

  return (
    <>
      <div className="top">
        <div className="logo">Re<b>lay</b></div>
        <span className="mu"><span className="dot" /> {user.account.provider} · {syncing ? "syncing…" : "synced"}</span>
        <div className="tog">
          <button className={view === "assistant" ? "on" : ""} onClick={() => setView("assistant")}>Assistant</button>
          <button className={view === "client" ? "on" : ""} onClick={() => setView("client")}>Client</button>
        </div>
        <button className="btn g" onClick={resync} disabled={syncing}>Sync</button>
        <button className="btn g" onClick={logout}>Log out</button>
      </div>
      {view === "assistant"
        ? <Assistant emails={emails} setEmails={setEmails} sel={sel} setSel={setSel} toast={toast} />
        : <Client user={user} emails={emails} setEmails={setEmails} toast={toast} onOpen={(id) => { setSel(id); setView("assistant"); }} />}
      {msg && <div className="toast">{msg}</div>}
    </>
  );
}
