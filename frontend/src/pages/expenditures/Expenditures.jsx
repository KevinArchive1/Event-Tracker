import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getExpenditures, addExpenditure } from "../../api/misc";
import API from "../../api/axios";
import { Card, StatCard, Button, Modal, Input, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";

export function Expenditures() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEvent = searchParams.get("event") || "";

  const isAdmin = user?.role === "admin";

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState(preselectedEvent);
  const [expenditures, setExpenditures] = useState([]);
  const [loading, setLoading] = useState(false);

  // Add modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", spent_on: today() });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

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

  useEffect(() => {
    load();
  }, [eventId]);

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

  // Group by date
  const grouped = expenditures.reduce((acc, e) => {
    const day = e.spent_on;
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Expenditures</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>Track event spending</p>
        </div>
        {isAdmin && eventId && (
          <Button onClick={() => setOpen(true)}>+ Add Expenditure</Button>
        )}
      </div>

      {/* Event selector */}
      <div style={{ marginBottom: 20 }}>
        <Select
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          style={{ minWidth: 220 }}
        >
          <option value="">Select an event…</option>
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </Select>
      </div>

      {!eventId && (
        <EmptyState message="Select an event to view expenditures." />
      )}

      {eventId && loading && <Spinner />}

      {eventId && !loading && (
        <>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
            <StatCard title="Total Spent"   value={`₱${total.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} accent icon="💰" />
            <StatCard title="Transactions"  value={expenditures.length} icon="🧾" />
            <StatCard title="Unique Days"   value={Object.keys(grouped).length} icon="📅" />
          </div>

          {expenditures.length === 0 && <EmptyState message="No expenditures logged for this event." />}

          {/* Grouped by date */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {Object.entries(grouped)
              .sort(([a], [b]) => new Date(b) - new Date(a))
              .map(([date, items]) => (
                <div key={date}>
                  <p style={{ margin: "0 0 8px", fontSize: "12px", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {new Date(date + "T00:00:00").toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  </p>
                  <Card>
                    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                      {items.map((item, idx) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "10px 0",
                            borderBottom: idx < items.length - 1 ? "1px solid #f1f5f9" : "none",
                          }}
                        >
                          <div>
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#111827" }}>
                              {item.description}
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                              Added by {item.added_by?.username} · {new Date(item.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "#15803d" }}>
                            ₱{parseFloat(item.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Day subtotal */}
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      paddingTop: 10,
                      marginTop: 4,
                      borderTop: "2px solid #f1f5f9",
                    }}>
                      <span style={{ fontSize: "13px", color: "#6b7280" }}>
                        Day total:&nbsp;
                        <strong style={{ color: "#111827" }}>
                          ₱{items.reduce((s, i) => s + parseFloat(i.amount || 0), 0)
                            .toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </strong>
                      </span>
                    </div>
                  </Card>
                </div>
              ))}
          </div>
        </>
      )}

      {/* Add Expenditure Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Add Expenditure">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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