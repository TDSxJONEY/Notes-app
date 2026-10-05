import { useState } from "react";
import { login, register, setToken } from "./api";

export default function AuthForm({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === "login";

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const switchMode = () => {
    setMode(isLogin ? "register" : "login");
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const data = isLogin
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      setToken(data.token);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>{isLogin ? "Log in" : "Create account"}</h1>
        <p className="auth-sub">
          {isLogin ? "Log in to see your notes." : "Your notes are private to your account."}
        </p>

        {!isLogin && (
          <label>
            Name
            <input name="name" value={form.name} onChange={update} required autoComplete="name" />
          </label>
        )}

        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            required
            autoComplete="email"
          />
        </label>

        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            required
            minLength={6}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Please wait…" : isLogin ? "Log in" : "Create account"}
        </button>

        <p className="switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="link" onClick={switchMode}>
            {isLogin ? "Create one" : "Log in"}
          </button>
        </p>
      </form>
    </div>
  );
}