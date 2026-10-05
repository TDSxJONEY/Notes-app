import { useEffect, useState } from "react";
import AuthForm from "./AuthForm";
import Notes from "./Notes";
import { getMe, getToken, clearToken, setUnauthorizedHandler } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(!!getToken());

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));

    // If a token is saved, check it's still valid
    if (!getToken()) return;
    getMe()
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  if (checking) return <div className="loading-screen">Loading…</div>;
  if (!user) return <AuthForm onAuth={setUser} />;
  return <Notes key={user._id} user={user} onLogout={handleLogout} />;
}