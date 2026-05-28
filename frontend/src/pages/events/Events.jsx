import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { startEvent, endEvent, pickEvent } from "../../api/events";
import { createEvent } from "../../api/misc";
import { Badge, Button, Card, Modal, Input, Alert, Spinner, EmptyState } from "../../components/ui/UI";
import styles from "./Events.module.css";

const STATUS_ORDER = { active: 0, preparation: 1, ended: 2 };

export function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pickedIds, setPickedIds] = useState(new Set());
  const [selectionsLoading, setSelectionsLoading] = useState(false);

  const [confirm, setConfirm] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "", description: "", location: "", start_time: "", end_time: "",
  });
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [actionMsg, setActionMsg] = useState({});
  const [actionLoading, setActionLoading] = useState(null);

  const setMsg = (id, type, text) => {
    setActionMsg((prev) => ({ ...prev, [id]: { type, text } }));
    setTimeout(() => setActionMsg((prev) => { const n = { ...prev }; delete n[id]; return n; }), 3500);
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await API.get("/events/");
      const sorted = [...res.data].sort(
        (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
      );
      setEvents(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSelections = async () => {
    if (!isStudent) return;
    setSelectionsLoading(true);
    try {
      const res = await API.get("/events/my-selections/");
      setPickedIds(new Set(res.data));
    } catch (err) {
      console.error("Selections fetch failed:", err);
    } finally {
      setSelectionsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchSelections();
  }, []);

  const handleConfirmedAction = async () => {
    if (!confirm) return;
    const { id, action } = confirm;
    setActionLoading(id + action);
    try {
      if (action === "start") await startEvent(id);
      if (action === "end")   await endEvent(id);
      fetchEvents();
      setMsg(id, "success", action === "start" ? "Event started." : "Event ended.");
    } catch (err) {
      setMsg(id, "error", err.response?.data?.detail || `Failed to ${action} event.`);
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const handlePick = async (id) => {
    setActionLoading(id + "pick");
    try {
      await pickEvent(id);
      setPickedIds((prev) => new Set([...prev, id]));
      setMsg(id, "success", "Event picked! You can now submit attendance.");
    } catch (err) {
      setMsg(id, "error", err.response?.data?.detail || "Failed to pick event.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async () => {
    setCreateError("");
    if (!createForm.name.trim()) { setCreateError("Event name is required."); return; }
    setCreateLoading(true);
    try {
      await createEvent(createForm);
      setCreateOpen(false);
      setCreateForm({ name: "", description: "", location: "", start_time: "", end_time: "" });
      fetchEvents();
    } catch (err) {
      const data = err.response?.data;
      setCreateError(
        typeof data === "string" ? data :
        data?.detail ||
        Object.entries(data || {}).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`).join(", ") ||
        "Failed to create event."
      );
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Events</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>
            {isStudent ? "Pick events to participate in" : "Manage all events"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setCreateOpen(true)}>+ Create Event</Button>
        )}
      </div>

      {loading && <Spinner />}
      {!loading && events.length === 0 && <EmptyState message="No events yet." />}

      <div className={styles.cardGrid}>
        {events.map((event) => {
          const msg = actionMsg[event.id];
          const picked = pickedIds.has(event.id);
          const isPickLoading = actionLoading === event.id + "pick";

          return (
            <Card key={event.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <h3
                  onClick={() => navigate(`/events/${event.id}`)}
                  className={styles.eventName}
                >
                  {event.name}
                </h3>
                <Badge label={event.status} />
              </div>

              {event.location && (
                <p className={styles.eventLocation}>📍 {event.location}</p>
              )}
              {event.description && (
                <p className={styles.eventDesc}>
                  {event.description.length > 100
                    ? event.description.slice(0, 100) + "…"
                    : event.description}
                </p>
              )}

              <div className={styles.metaRow}>
                <span>👥 <span className={styles.metaNum}>{event.attendance_count ?? 0}</span></span>
                <span>✅ <span className={styles.metaNum}>{event.approved_attendance_count ?? 0}</span> approved</span>
                <span>🤝 <span className={styles.metaNum}>{event.committee_count ?? 0}</span> committee</span>
              </div>

              <p className={event.attendance_open ? styles.statusOpen : styles.statusClosed}>
                {event.attendance_open ? "🟢 Attendance open" : "⚫ Attendance closed"}
              </p>

              {msg && (
                <div style={{
                  marginBottom: 10, padding: "6px 10px", borderRadius: "6px",
                  fontSize: "12px", fontWeight: 600,
                  background: msg.type === "success" ? "rgba(34,216,122,0.1)" : "rgba(255,77,106,0.1)",
                  color: msg.type === "success" ? "var(--green)" : "var(--red)",
                }}>
                  {msg.text}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={() => navigate(`/events/${event.id}`)}>
                  View
                </Button>

                {isStudent && event.status === "active" && !selectionsLoading && (
                  <Button
                    variant={picked ? "ghost" : "primary"}
                    disabled={picked || isPickLoading}
                    onClick={() => handlePick(event.id)}
                  >
                    {isPickLoading ? "Picking…" : picked ? "✓ Picked" : "Pick Event"}
                  </Button>
                )}

                {isAdmin && (
                  <>
                    <Button
                      variant="success"
                      disabled={event.status !== "preparation" || actionLoading === event.id + "start"}
                      onClick={() => setConfirm({ id: event.id, action: "start", name: event.name })}
                    >
                      ▶ Start
                    </Button>
                    <Button
                      variant="danger"
                      disabled={event.status !== "active" || actionLoading === event.id + "end"}
                      onClick={() => setConfirm({ id: event.id, action: "end", name: event.name })}
                    >
                      ■ End
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Confirm action modal */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "end" ? "⚠️ End Event?" : "Start Event?"}
      >
        <p className={styles.confirmText}>
          {confirm?.action === "end"
            ? `Are you sure you want to end "${confirm?.name}"? This permanently sets it to ended and closes attendance.`
            : `Start "${confirm?.name}"? It will become active and open to students.`}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant={confirm?.action === "end" ? "danger" : "success"}
            onClick={handleConfirmedAction}
            disabled={!!actionLoading}
          >
            {actionLoading ? "Please wait…" : `Yes, ${confirm?.action} it`}
          </Button>
        </div>
      </Modal>

      {/* Create Event Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create New Event">
        <div className={styles.formCol}>
          <Alert type="error" message={createError} />
          <Input
            label="Event Name *"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="e.g. Orientation Night"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              rows={3}
              placeholder="What is this event about?"
            />
          </div>
          <Input
            label="Location"
            value={createForm.location}
            onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
            placeholder="e.g. Main Gymnasium"
          />
          <Input
            label="Start Time"
            type="datetime-local"
            value={createForm.start_time}
            onChange={(e) => setCreateForm({ ...createForm, start_time: e.target.value })}
          />
          <Input
            label="End Time"
            type="datetime-local"
            value={createForm.end_time}
            onChange={(e) => setCreateForm({ ...createForm, end_time: e.target.value })}
          />
          <Button onClick={handleCreate} disabled={createLoading}>
            {createLoading ? "Creating…" : "Create Event"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}