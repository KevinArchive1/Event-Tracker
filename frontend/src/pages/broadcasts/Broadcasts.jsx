import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getBroadcasts, sendBroadcast } from "../../api/broadcasts";
import { getCommitteeMembers } from "../../api/misc";
import { Card, Button, Modal, Input, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";
import API from "../../api/axios";

export function Broadcasts() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [form, setForm] = useState({ event: "", title: "", message: "", target_committee: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getBroadcasts();
      setBroadcasts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      API.get("/events/").then((r) => setEvents(r.data)).catch(console.error);
    }
  }, []);

  // When event changes, load that event's committee members for the target dropdown
  const handleEventChange = async (eventId) => {
    setForm((f) => ({ ...f, event: eventId, target_committee: "" }));
    if (!eventId) { setCommitteeMembers([]); return; }
    try {
      const members = await getCommitteeMembers(eventId);
      setCommitteeMembers(members);
    } catch {
      setCommitteeMembers([]);
    }
  };

  const handleSend = async () => {
    setFormError("");
    if (!form.event || !form.title || !form.message) {
      setFormError("Event, title and message are required.");
      return;
    }
    setFormLoading(true);
    try {
      const payload = {
        event: form.event,
        title: form.title,
        message: form.message,
        ...(form.target_committee ? { target_committee: parseInt(form.target_committee) } : {}),
      };
      await sendBroadcast(payload);
      setOpen(false);
      setForm({ event: "", title: "", message: "", target_committee: "" });
      setCommitteeMembers([]);
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to send broadcast.");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Broadcasts</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>
            {isAdmin ? "Send and view broadcasts" : "Messages from admins"}
          </p>
        </div>
        {isAdmin && <Button onClick={() => setOpen(true)}>📣 New Broadcast</Button>}
      </div>

      {loading && <Spinner />}
      {!loading && broadcasts.length === 0 && <EmptyState message="No broadcasts yet." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {broadcasts.map((b) => (
          <Card key={b.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>{b.title}</p>
              <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                {new Date(b.created_at).toLocaleString()}
              </p>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: "13px", color: "#4b5563" }}>{b.message}</p>
            <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
              From: {b.admin?.username}
              {b.target_committee && ` → targeted`}
            </p>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setCommitteeMembers([]); }} title="Send Broadcast">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Alert type="error" message={formError} />

          {/* Event selector — also loads committee members */}
          <Select
            label="Event"
            value={form.event}
            onChange={(e) => handleEventChange(e.target.value)}
          >
            <option value="">Select event…</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </Select>

          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Broadcast title"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="Your message…"
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", resize: "vertical" }}
            />
          </div>

          {/* Target — dropdown of committee members instead of raw ID */}
          <Select
            label="Target (optional — leave blank to send to all)"
            value={form.target_committee}
            onChange={(e) => setForm({ ...form, target_committee: e.target.value })}
          >
            <option value="">All committee members</option>
            {committeeMembers.map((m) => (
              <option key={m.id} value={m.user?.id}>
                {m.user?.first_name
                  ? `${m.user.first_name} ${m.user.last_name} (@${m.user.username})`
                  : `@${m.user?.username}`}
              </option>
            ))}
          </Select>
          {form.event && committeeMembers.length === 0 && (
            <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
              No committee members found for this event.
            </p>
          )}

          <Button onClick={handleSend} disabled={formLoading}>
            {formLoading ? "Sending…" : "Send"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}