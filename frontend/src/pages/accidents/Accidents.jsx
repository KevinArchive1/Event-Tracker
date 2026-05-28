import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAccidents, reportAccident } from "../../api/misc";
import { Card, Badge, Button, Modal, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";
import API from "../../api/axios";

const ACCIDENT_TYPES = [
  { value: "injury",   label: "Injury" },
  { value: "medical",  label: "Medical" },
  { value: "property", label: "Property Damage" },
  { value: "security", label: "Security" },
  { value: "other",    label: "Other" },
];

export function Accidents() {
  const { user } = useAuth();
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [form, setForm] = useState({ event: "", accident_type: "other", description: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const load = async (eid = eventFilter) => {
    setLoading(true);
    try {
      const data = await getAccidents(eid || null);
      setAccidents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    API.get("/events/").then((r) => setEvents(r.data)).catch(console.error);
  }, []);

  const handleReport = async () => {
    setFormError("");
    if (!form.event || !form.accident_type) {
      setFormError("Event and type are required.");
      return;
    }
    setFormLoading(true);
    try {
      await reportAccident(form);
      setOpen(false);
      setForm({ event: "", accident_type: "other", description: "" });
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to submit.");
    } finally {
      setFormLoading(false);
    }
  };

  const TYPE_ICON = { injury: "🤕", medical: "🏥", property: "🏗️", security: "🔒", other: "⚠️" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Accident Reports</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>Log and track incidents during events</p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>🚨 Report Accident</Button>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: 16 }}>
        <Select
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); load(e.target.value); }}
          style={{ minWidth: 200 }}
        >
          <option value="">All Events</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </Select>
      </div>

      {loading && <Spinner />}
      {!loading && accidents.length === 0 && <EmptyState message="No accidents reported." />}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {accidents.map((a) => (
          <Card key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: "24px" }}>{TYPE_ICON[a.accident_type] || "⚠️"}</span>
              <Badge label={a.accident_type} />
            </div>
            <p style={{ margin: "0 0 4px", fontSize: "13px", color: "#4b5563" }}>
              {a.description || <em>No description</em>}
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#9ca3af" }}>
              Reporter: {a.reporter?.username} · {new Date(a.accident_time).toLocaleString()}
            </p>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Report an Accident">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Alert type="error" message={formError} />
          <Select label="Event" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}>
            <option value="">Select event…</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </Select>
          <Select label="Type" value={form.accident_type} onChange={(e) => setForm({ ...form, accident_type: e.target.value })}>
            {ACCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe what happened…"
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", resize: "vertical" }}
            />
          </div>
          <Button variant="danger" onClick={handleReport} disabled={formLoading}>
            {formLoading ? "Submitting…" : "Submit Report"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}