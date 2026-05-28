import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAccidents, reportAccident } from "../../api/misc";
import { Card, Badge, Button, Modal, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";
import API from "../../api/axios";
import styles from "./Accidents.module.css";

const ACCIDENT_TYPES = [
  { value: "injury",   label: "Injury" },
  { value: "medical",  label: "Medical" },
  { value: "property", label: "Property Damage" },
  { value: "security", label: "Security" },
  { value: "other",    label: "Other" },
];

const TYPE_ICON = { injury: "🤕", medical: "🏥", property: "🏗️", security: "🔒", other: "⚠️" };

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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Accident Reports</h1>
          <p className={styles.subtitle}>Log and track incidents during events</p>
        </div>
        <Button variant="danger" onClick={() => setOpen(true)}>🚨 Report Accident</Button>
      </div>

      <div className={styles.filterRow}>
        <Select
          value={eventFilter}
          onChange={(e) => { setEventFilter(e.target.value); load(e.target.value); }}
        >
          <option value="">All Events</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </Select>
      </div>

      {loading && <Spinner />}
      {!loading && accidents.length === 0 && <EmptyState message="No accidents reported." />}

      <div className={styles.cardGrid}>
        {accidents.map((a) => (
          <Card key={a.id}>
            <div className={styles.cardTop}>
              <span className={styles.cardIcon}>{TYPE_ICON[a.accident_type] || "⚠️"}</span>
              <Badge label={a.accident_type} />
            </div>
            <p className={styles.cardDesc}>
              {a.description || <em>No description provided</em>}
            </p>
            <div className={styles.cardMeta}>
              <span>{a.reporter?.username}</span>
              <span className={styles.cardMetaDot} />
              <span>{new Date(a.accident_time).toLocaleString()}</span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Report an Accident">
        <div className={styles.formCol}>
          <Alert type="error" message={formError} />
          <Select label="Event" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}>
            <option value="">Select event…</option>
            {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
          </Select>
          <Select label="Type" value={form.accident_type} onChange={(e) => setForm({ ...form, accident_type: e.target.value })}>
            {ACCIDENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <div>
            <label className={styles.formLabel}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              placeholder="Describe what happened…"
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