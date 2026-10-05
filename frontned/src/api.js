const BASE = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "notes_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// App.jsx sets this so an expired token logs the user out automatically
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && token) {
    clearToken();
    onUnauthorized();
  }
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// Auth
export const register = (name, email, password) =>
  request("/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) });
export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const getMe = () => request("/auth/me");

// Notes
export const getNotes = () => request("/notes");
export const createNote = (note) =>
  request("/notes", { method: "POST", body: JSON.stringify(note) });
export const updateNote = (id, note) =>
  request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(note) });
export const deleteNote = (id) => request(`/notes/${id}`, { method: "DELETE" });