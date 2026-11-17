import { useState } from "react";
import { api, setToken } from "../api";

export default function Onboarding({ user, onAuth, onConnected }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [sync, setSync] = useState(null); // { provider, step, pct }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const auth = async (path, body) => {
    setBusy(true); setErr("");
    try {
      const { token, user } = await api.post(path, body);
      setToken(token);
      onAuth(user);
    } catch (x) { setErr(x.message); }
    setBusy(false);
  };

  const connect = async (provider) => {
    const steps = ["Authorizing", "Syncing conversations", "AI is classifying reply responsibility"];
    setSync({ provider, step: steps[0], pct: 10 });
    steps.slice(1).forEach((s, i) => setTimeout(() => setSync((v) => v && { ...v, step: s, pct: 40 + i * 30 }), 700 * (i + 1)));
    try {
      const emails = await api.post("/emails/sync", { provider });
      setSync((v) => ({ ...v, pct: 100 }));
      setTimeout(() => onConnected(emails, provider), 300);
    } catch (x) { setSync(null); setErr(x.message); }
  };

  if (sync) return (
    <div className="card ob">
      <h1>Connecting {sync.provider}…</h1>
      <p className="mu" style={{ fontSize: 14 }}>{sync.step}</p>
      <div className="bar"><i style={{ width: sync.pct + "%", transition: "width .6s" }} /></div>
    </div>
  );

  if (user) return (
    <div className="card ob">
      <h1>Connect an account</h1>
      <p className="mu" style={{ fontSize: 14 }}>Read-only access. Drafts are never sent without your approval.</p>
      <div className="prov">
        <button onClick={() => connect("Gmail")}>Gmail</button>
        <button onClick={() => connect("Outlook")}>Outlook</button>
      </div>
      {err && <p className="err">{err}</p>}
      <p className="mu">OAuth is simulated with realistic sample emails; classification is real AI.</p>
    </div>
  );

  return (
    <div className="card ob">
      <div className="logo" style={{ fontSize: 24 }}>Re<b>lay</b></div>
      <h1>Your clients’ inboxes, finally calm.</h1>
      <p className="mu" style={{ fontSize: 14 }}>AI works out who should reply, so you don’t have to read everything.</p>
      {mode === "signup" && <input placeholder="Your name" value={f.name} onChange={set("name")} />}
      <input placeholder="Email" type="email" value={f.email} onChange={set("email")} />
      <input placeholder="Password (6+ characters)" type="password" value={f.password} onChange={set("password")} />
      {err && <p className="err">{err}</p>}
      <button className="btn" style={{ width: "100%", marginTop: 6 }} disabled={busy} onClick={() => auth("/auth/" + mode, f)}>
        {mode === "login" ? "Log in" : "Create account"}
      </button>
      <button className="btn g" style={{ width: "100%", marginTop: 8 }} disabled={busy} onClick={() => auth("/auth/demo")}>Try the demo account</button>
      <p className="mu">
        {mode === "login" ? "New here?" : "Have an account?"}{" "}
        <button className="lnk" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }}>
          {mode === "login" ? "Sign up" : "Log in"}
        </button>
      </p>
    </div>
  );
}
