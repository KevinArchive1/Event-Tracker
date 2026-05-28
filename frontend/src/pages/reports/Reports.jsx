import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCommitteeReports, createCommitteeReport, respondToReport } from "../../api/reports";
import { Card, Badge, Button, Modal, Input, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";
import API from "../../api/axios";

export function Reports() {
  const { user } = useAuth();
  const isAdmin  = user?.role === "admin";
  const isStaff  = user?.role === "staff";
  const canSubmit = isStaff;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [respondOpen, setRespondOpen] = useState(null);
  const [myCommitteeEvents, setMyCommitteeEvents] = useState([]);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({ event: "", title: "", content: "", report_type: "update" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const [respondForm, setRespondForm] = useState({ admin_response: "", is_resolved: true });
  const [respondError, setRespondError] = useState("");
  const [respondLoading, setRespondLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getCommitteeReports();
      setReports(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (isStaff) {
      API.get("/events/my-committees/")
        .then((r) => setMyCommitteeEvents(r.data.map((m) => m.event)))
        .catch(console.error);
    }
  }, []);

  const handleCreate = async () => {
    setFormError("");
    if (!form.event || !form.title || !form.content) { setFormError("All fields are required."); return; }
    setFormLoading(true);
    try {
      await createCommitteeReport(form);
      setCreateOpen(false);
      setForm({ event: "", title: "", content: "", report_type: "update" });
      load();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to create report.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRespond = async () => {
    setRespondError("");
    if (!respondForm.admin_response) { setRespondError("Response cannot be empty."); return; }
    setRespondLoading(true);
    try {
      await respondToReport(respondOpen.id, respondForm);
      setRespondOpen(null);
      setRespondForm({ admin_response: "", is_resolved: true });
      load();
    } catch (err) {
      setRespondError(err.response?.data?.detail || "Failed to respond.");
    } finally {
      setRespondLoading(false);
    }
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.report_type === filter);
  const COUNTS = ["update", "request", "issue"].reduce((a, t) => { a[t] = reports.filter((r) => r.report_type === t).length; return a; }, {});

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Committee Reports</h1>
          <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>
            {isAdmin ? "Review and respond to committee reports" : "Submit reports for your assigned events"}
          </p>
        </div>
        {canSubmit && <Button onClick={() => { setCreateOpen(true); setFormError(""); }}>+ New Report</Button>}
      </div>

      {!canSubmit && !isAdmin && (
        <Alert type="info" message="Only committee members can submit reports. Join a committee from an active event." />
      )}
      <div style={{ height: (!canSubmit && !isAdmin) ? 16 : 0 }} />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["all", "update", "request", "issue"].map((t) => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px",
            fontWeight: filter === t ? 700 : 400,
            background: filter === t ? "#6366f1" : "#f3f4f6",
            color: filter === t ? "#fff" : "#374151",
          }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t !== "all" && (
              <span style={{ marginLeft: 5, background: filter === t ? "rgba(255,255,255,0.25)" : "#e5e7eb", borderRadius: "99px", padding: "1px 7px", fontSize: "11px" }}>
                {COUNTS[t]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <Spinner />}
      {!loading && filtered.length === 0 && <EmptyState message="No reports found." />}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map((r) => (
          <Card key={r.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>{r.title}</p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>
                  by @{r.committee?.username} · {new Date(r.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge label={r.report_type} />
                <Badge label={r.is_resolved ? "resolved" : "pending"} />
              </div>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#4b5563", lineHeight: 1.6 }}>{r.content}</p>
            {r.admin_response && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", color: "#166534", marginBottom: 10 }}>
                <strong>Admin response:</strong> {r.admin_response}
              </div>
            )}
            {isAdmin && !r.is_resolved && (
              <Button variant="outline" onClick={() => { setRespondOpen(r); setRespondForm({ admin_response: "", is_resolved: true }); setRespondError(""); }}>
                Respond
              </Button>
            )}
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Submit New Report">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Alert type="error" message={formError} />
          {myCommitteeEvents.length === 0
            ? <Alert type="info" message="You are not assigned to any events. Join a committee first." />
            : <>
                <Select label="Event" value={form.event} onChange={(e) => setForm({ ...form, event: e.target.value })}>
                  <option value="">Select event…</option>
                  {myCommitteeEvents.map((ev) => <option key={ev.id} value={ev.id}>{ev.name} ({ev.status})</option>)}
                </Select>
                <Select label="Type" value={form.report_type} onChange={(e) => setForm({ ...form, report_type: e.target.value })}>
                  <option value="update">Update</option>
                  <option value="request">Request</option>
                  <option value="issue">Issue</option>
                </Select>
                <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Report title" />
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Content</label>
                  <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Describe the update, request, or issue…"
                    style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", resize: "vertical" }} />
                </div>
                <Button onClick={handleCreate} disabled={formLoading}>{formLoading ? "Submitting…" : "Submit Report"}</Button>
              </>
          }
        </div>
      </Modal>

      {/* Respond Modal */}
      <Modal open={!!respondOpen} onClose={() => setRespondOpen(null)} title="Respond to Report">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {respondOpen && <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>Responding to: <strong>{respondOpen.title}</strong></p>}
          <Alert type="error" message={respondError} />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Response</label>
            <textarea value={respondForm.admin_response} onChange={(e) => setRespondForm({ ...respondForm, admin_response: e.target.value })} rows={4} placeholder="Your response…"
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", resize: "vertical" }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "13px" }}>
            <input type="checkbox" checked={respondForm.is_resolved} onChange={(e) => setRespondForm({ ...respondForm, is_resolved: e.target.checked })} />
            Mark as resolved
          </label>
          <Button onClick={handleRespond} disabled={respondLoading}>{respondLoading ? "Saving…" : "Submit Response"}</Button>
        </div>
      </Modal>
    </div>
  );
}