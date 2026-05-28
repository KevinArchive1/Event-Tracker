import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getExpenditures, addExpenditure } from "../../api/misc";
import API from "../../api/axios";
import { Card, StatCard, Button, Modal, Input, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";
import styles from "./Expenditures.module.css";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function Expenditures() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const preselectedEvent = searchParams.get("event") || "";
  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(preselectedEvent);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", spent_on: today() });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const load = async (eid = eventId) => {
    if (!eid) return;
    setLoading(true);
    try {
      const data = await getExpenditures(eid);
      setExpenditures(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    API.get("/events/").then((r) => setEvents(r.data)).catch(console.error);
  }, []);

  useEffect(() => { load(); }, [eventId]);

  const handleAdd = async () => {
    setFormError("");
    if (!eventId) { setFormError("Select an event first."); return; }
    if (!form.description.trim()) { setFormError("Description is required."); return; }
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) <= 0) {
      setFormError("Enter a valid amount.");
      return;
    }
    setFormLoading(true);
    try {
      await addExpenditure({ event: eventId, ...form, amount: parseFloat(form.amount) });
      setOpen(false);
      setForm({ description: "", amount: "", spent_on: today() });
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to add expenditure.");
    } finally {
      setFormLoading(false);
    }
  };

  const total = expenditures.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

  const grouped = expenditures.reduce((acc, e) => {
    const day = e.spent_on;
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Expenditures</h1>
          <p className={styles.subtitle}>Track event spending</p>
        </div>
        {isAdmin && eventId && (
          <Button onClick={() => setOpen(true)}>+ Add Expenditure</Button>
        )}
      </div>

      <div className={styles.eventSelector}>
        <Select value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Select an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </Select>
      </div>

      {!eventId && <EmptyState message="Select an event to view expenditures." />}
      {eventId && loading && <Spinner />}

      {eventId && !loading && (
        <>
          <div className={styles.statGrid}>
            <StatCard
              title="Total Spent"
              value={`₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              accent
              icon="💰"
            />
            <StatCard title="Transactions" value={expenditures.length} icon="🧾" />
            <StatCard title="Unique Days" value={Object.keys(grouped).length} icon="📅" />
          </div>

          {expenditures.length === 0 && (
            <EmptyState message="No expenditures logged for this event." />
          )}

          <div className={styles.dayGroups}>
            {Object.entries(grouped)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, items]) => (
                <div key={date}>
                  <p className={styles.dayLabel}>
                    {new Date(date + "T00:00:00").toLocaleDateString("en-PH", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                  <Card>
                    <div className={styles.rowList}>
                      {items.map((item) => (
                        <div key={item.id} className={styles.row}>
                          <div>
                            <p className={styles.rowDesc}>{item.description}</p>
                            <p className={styles.rowAddedBy}>
                              Added by {item.added_by?.username} · {new Date(item.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <span className={styles.rowAmount}>
                            ₱{parseFloat(item.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.dayTotal}>
                      Day total:
                      <span className={styles.dayTotalNum}>
                        &nbsp;₱{items
                          .reduce((s, i) => s + parseFloat(i.amount || 0), 0)
                          .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </Card>
                </div>
              ))}
          </div>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Add Expenditure">
        <div className={styles.formCol}>
          <Alert type="error" message={formError} />
          <Input
            label="Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Venue rental"
          />
          <Input
            label="Amount (₱) *"
            type="number"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            placeholder="0.00"
          />
          <Input
            label="Date *"
            type="date"
            value={form.spent_on}
            onChange={(e) => setForm({ ...form, spent_on: e.target.value })}
          />
          <Button onClick={handleAdd} disabled={formLoading}>
            {formLoading ? "Saving…" : "Add Expenditure"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}