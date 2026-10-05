import { useEffect, useState } from "react";
import { getNotes, createNote, updateNote, deleteNote } from "./api";

const formatDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Notes({ user, onLogout }) {
  const [notes, setNotes] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const active = notes.find((n) => n._id === activeId) || null;

  // True when the editor has edits that aren't saved yet
  const isDirty =
    !!active && (draft.title !== active.title || draft.content !== active.content);

  // Load this user's notes once
  useEffect(() => {
    (async () => {
      try {
        setNotes(await getNotes());
      } catch (e) {
        setError(`Couldn't load notes: ${e.message}`);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // When switching notes, load its content into the editor
  useEffect(() => {
    if (active) setDraft({ title: active.title, content: active.content });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Warn before closing or refreshing the tab with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  // Ctrl+S / Cmd+S saves the note
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isDirty && !saving) handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const confirmDiscard = () =>
    !isDirty || window.confirm("You have unsaved changes. Discard them?");

  const replaceNote = (updated) =>
    setNotes((prev) => prev.map((n) => (n._id === updated._id ? updated : n)));

  const selectNote = (id) => {
    if (id === activeId || !confirmDiscard()) return;
    setActiveId(id);
  };

  const handleNew = async () => {
    if (!confirmDiscard()) return;
    try {
      const note = await createNote({ title: "Untitled", content: "" });
      setNotes((prev) => [note, ...prev]);
      setActiveId(note._id);
      setDraft({ title: note.title, content: note.content });
    } catch (e) {
      setError(`Couldn't create note: ${e.message}`);
    }
  };

  // Editing only changes local state; nothing is sent to the server
  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateNote(activeId, draft);
      setNotes((prev) =>
        prev
          .map((n) => (n._id === updated._id ? updated : n))
          .sort((a, b) => b.pinned - a.pinned || new Date(b.updatedAt) - new Date(a.updatedAt))
      );
      setError("");
    } catch (e) {
      setError(`Couldn't save: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePin = async () => {
    try {
      const updated = await updateNote(activeId, { pinned: !active.pinned });
      setNotes((prev) =>
        prev
          .map((n) => (n._id === updated._id ? updated : n))
          .sort((a, b) => b.pinned - a.pinned || new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    } catch (e) {
      setError(`Couldn't pin note: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    try {
      await deleteNote(activeId);
      setNotes((prev) => prev.filter((n) => n._id !== activeId));
      setActiveId(null);
    } catch (e) {
      setError(`Couldn't delete note: ${e.message}`);
    }
  };

  const handleLogout = () => {
    if (confirmDiscard()) onLogout();
  };

  const statusText = saving
    ? "Saving…"
    : isDirty
    ? "Unsaved changes"
    : active
    ? `Saved ${formatDate(active.updatedAt)}`
    : "";

  return (
    <div className={`app ${activeId ? "is-editing" : ""}`}>
      <aside className="sidebar">
        <header className="sidebar-head">
          <h1>Notes</h1>
          <button className="btn-primary" onClick={handleNew}>New note</button>
        </header>

        {error && <p className="error" role="alert">{error}</p>}

        <ul className="note-list">
          {loading && <li className="list-msg">Loading…</li>}
          {!loading && notes.length === 0 && (
            <li className="list-msg">No notes yet. Create one to get started.</li>
          )}
          {notes.map((n) => (
            <li key={n._id}>
              <button
                className={`note-item ${n._id === activeId ? "active" : ""}`}
                onClick={() => selectNote(n._id)}
              >
                <span className="note-title">
                  {n.pinned && <span className="pin" aria-label="Pinned">●</span>}
                  {n.title || "Untitled"}
                </span>
                <span className="note-preview">{n.content.slice(0, 80) || "Empty note"}</span>
                <span className="note-date">{formatDate(n.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>

        <footer className="sidebar-foot">
          <span>Signed in as {user.name}</span>
          <button className="btn-ghost" onClick={handleLogout}>Log out</button>
        </footer>
      </aside>

      <main className="editor">
        {active ? (
          <>
            <div className="editor-bar">
              <button
                className="btn-ghost back"
                onClick={() => confirmDiscard() && setActiveId(null)}
              >
                All notes
              </button>
              <span className={`status ${isDirty ? "unsaved" : ""}`}>{statusText}</span>
              <button className="btn-ghost" onClick={handlePin}>
                {active.pinned ? "Unpin" : "Pin"}
              </button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
              <button
                className="btn-primary"
                onClick={handleSave}
                disabled={!isDirty || saving}
                title="Save (Ctrl+S)"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
            <input
              className="title-input"
              value={draft.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Title"
              aria-label="Note title"
            />
            <textarea
              className="content-input"
              value={draft.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Start writing…"
              aria-label="Note content"
            />
          </>
        ) : (
          <div className="empty">
            <p>Pick a note from the list, or create a new one.</p>
            <button className="btn-primary" onClick={handleNew}>New note</button>
          </div>
        )}
      </main>
    </div>
  );
}