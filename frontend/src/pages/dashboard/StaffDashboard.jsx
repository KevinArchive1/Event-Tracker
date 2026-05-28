import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { getAttendanceForReview, reviewAttendance } from "../../api/attendance";
import { createCommitteeReport } from "../../api/reports";
import { getBroadcasts } from "../../api/broadcasts";
import { Card, StatCard, Badge, Button, Modal, Select, Alert, Spinner, EmptyState, Input } from "../../components/ui/UI";

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [committees, setCommittees] = useState([]); // from /events/my-committees/
  const [loading, setLoading] = useState(true);

  // Attendance review per event
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState("pending");
  const [confirmReview, setConfirmReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  // Quick report modal
  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ event: "", title: "", content: "", report_type: "update" });
  const [reportError, setReportError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");

  // Broadcasts
  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [committeesRes, broadcastsRes] = await Promise.all([
          API.get("/events/my-committees/"),
          getBroadcasts(),
        ]);
        setCommittees(committeesRes.data);
        setBroadcasts(broadcastsRes.slice(0, 5)); // latest 5

        // Auto-select first active event
        const first = committeesRes.data.find((m) => m.event.status === "active");
        if (first) setSelectedEventId(first.event.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Fetch attendance when selected event changes
  useEffect(() => {
    if (!selectedEventId) return;
    setAttendanceLoading(true);
    setAttendance([]);
    getAttendanceForReview(selectedEventId)
      .then(setAttendance)
      .catch(console.error)
      .finally(() => setAttendanceLoading(false));
  }, [selectedEventId]);

  const handleReview = async (id, status) => {
    setReviewLoading(id);
    try {
      await reviewAttendance(id, { status, review_note: "" });
      setAttendance((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      setConfirmReview(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to review.");
    } finally {
      setReviewLoading(null);
    }
  };

  const handleReport = async () => {
    setReportError("");
    setReportSuccess("");
    if (!reportForm.event || !reportForm.title || !reportForm.content) {
      setReportError("All fields are required.");
      return;
    }
    setReportLoading(true);
    try {
      await createCommitteeReport(reportForm);
      setReportSuccess("Report submitted!");
      setReportForm({ event: "", title: "", content: "", report_type: "update" });
      setTimeout(() => { setReportOpen(false); setReportSuccess(""); }, 1500);
    } catch (err) {
      setReportError(err.response?.data?.detail || "Failed to submit report.");
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <Spinner />;

  const activeCommittees  = committees.filter((m) => m.event.status === "active");
  const allEventIds       = committees.map((m) => m.event.id);
  const selectedCommittee = committees.find((m) => m.event.id === selectedEventId);

  const attCounts = {
    pending:  attendance.filter((a) => a.status === "pending").length,
    approved: attendance.filter((a) => a.status === "approved").length,
    rejected: attendance.filter((a) => a.status === "rejected").length,
  };

  const filtered = attendance.filter((a) => a.status === attendanceFilter);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
          🤝 Welcome, {user?.first_name || user?.username}
        </h1>
        <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>
          Committee Member · {committees.length} event{committees.length !== 1 ? "s" : ""} assigned
        </p>
      </div>

      {committees.length === 0 && (
        <Card>
          <EmptyState message="You're not assigned to any events yet. Ask your admin for a committee code and join from the Events page." />
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <Button onClick={() => navigate("/events")}>Browse Events</Button>
          </div>
        </Card>
      )}

      {committees.length > 0 && (
        <>
          {/* Stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            <StatCard title="My Events"       value={committees.length}        icon="📅" accent />
            <StatCard title="Active Now"      value={activeCommittees.length}  icon="🟢" />
            <StatCard title="Pending Review"  value={attCounts.pending}        icon="🕐" />
            <StatCard title="Approved"        value={attCounts.approved}       icon="✅" />
          </div>

          {/* Main layout */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

            {/* ── Left: Attendance review ── */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>🔍 Attendance Review</h2>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={selectedEventId || ""}
                    onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "13px" }}
                  >
                    {committees.map((m) => (
                      <option key={m.event.id} value={m.event.id}>
                        {m.event.name} ({m.event.status})
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => setReportOpen(true)} style={{ fontSize: "12px", padding: "6px 12px" }}>
                    + Report
                  </Button>
                </div>
              </div>

              {/* Filter tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["pending", "approved", "rejected"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setAttendanceFilter(t)}
                    style={{
                      padding: "6px 12px", borderRadius: "8px", border: "none",
                      cursor: "pointer", fontSize: "12px",
                      fontWeight: attendanceFilter === t ? 700 : 400,
                      background: attendanceFilter === t ? "#6366f1" : "#f3f4f6",
                      color: attendanceFilter === t ? "#fff" : "#374151",
                    }}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    <span style={{
                      marginLeft: 5,
                      background: attendanceFilter === t ? "rgba(255,255,255,0.25)" : "#e5e7eb",
                      borderRadius: "99px", padding: "1px 6px", fontSize: "10px",
                    }}>
                      {attCounts[t]}
                    </span>
                  </button>
                ))}
              </div>

              {attendanceLoading && <Spinner />}

              {!attendanceLoading && !selectedEventId && (
                <EmptyState message="Select an event above." />
              )}

              {!attendanceLoading && selectedEventId && filtered.length === 0 && (
                <EmptyState message={`No ${attendanceFilter} submissions.`} />
              )}

              {/* Attendance cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                {filtered.map((item) => (
                  <Card key={item.id} style={{ padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "13px" }}>
                          {item.student?.first_name
                            ? `${item.student.first_name} ${item.student.last_name}`
                            : item.student?.username}
                        </p>
                        <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                          @{item.student?.username}
                        </p>
                      </div>
                      <Badge label={item.status} />
                    </div>

                    <img
                      src={item.image_proof}
                      alt="proof"
                      onClick={() => setLightbox(item.image_proof)}
                      style={{
                        width: "100%", height: 130, objectFit: "cover",
                        borderRadius: "6px", cursor: "pointer", marginBottom: 8,
                        border: "1px solid #f1f5f9",
                      }}
                    />

                    <div style={{ display: "flex", gap: 6 }}>
                      <Button
                        variant="success"
                        disabled={item.status === "approved" || reviewLoading === item.id}
                        onClick={() => setConfirmReview({ id: item.id, status: "approved" })}
                        style={{ flex: 1, fontSize: "12px", padding: "5px" }}
                      >
                        ✓ Approve
                      </Button>
                      <Button
                        variant="danger"
                        disabled={item.status === "rejected" || reviewLoading === item.id}
                        onClick={() => setConfirmReview({ id: item.id, status: "rejected" })}
                        style={{ flex: 1, fontSize: "12px", padding: "5px" }}
                      >
                        ✕ Reject
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* ── Right: My events + broadcasts ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* My assigned events */}
              <div>
                <h2 style={{ margin: "0 0 12px", fontSize: "16px", fontWeight: 700 }}>📅 My Events</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {committees.map((m) => (
                    <Card key={m.event.id} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: "13px" }}>{m.event.name}</p>
                        <Badge label={m.event.status} />
                      </div>
                      {m.event.location && (
                        <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#9ca3af" }}>
                          📍 {m.event.location}
                        </p>
                      )}
                      <p style={{ margin: "0 0 8px", fontSize: "11px", color: m.event.attendance_open ? "#15803d" : "#9ca3af" }}>
                        {m.event.attendance_open ? "🟢 Attendance open" : "⚫ Attendance closed"}
                      </p>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button
                          variant="ghost"
                          onClick={() => navigate(`/events/${m.event.id}`)}
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setReportForm((f) => ({ ...f, event: String(m.event.id) }));
                            setReportOpen(true);
                          }}
                          style={{ fontSize: "11px", padding: "4px 8px" }}
                        >
                          + Report
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Broadcasts */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>📣 Broadcasts</h2>
                  <Button variant="ghost" onClick={() => navigate("/broadcasts")} style={{ fontSize: "11px", padding: "4px 8px" }}>
                    All
                  </Button>
                </div>
                {broadcasts.length === 0 && (
                  <p style={{ fontSize: "13px", color: "#9ca3af" }}>No broadcasts yet.</p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {broadcasts.map((b) => (
                    <Card key={b.id} style={{ padding: "10px 14px" }}>
                      <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "13px" }}>{b.title}</p>
                      <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#4b5563" }}>{b.message}</p>
                      <p style={{ margin: 0, fontSize: "10px", color: "#9ca3af" }}>
                        {b.admin?.username} · {new Date(b.created_at).toLocaleDateString()}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirm review modal */}
      <Modal
        open={!!confirmReview}
        onClose={() => setConfirmReview(null)}
        title={`Confirm ${confirmReview?.status === "approved" ? "Approval" : "Rejection"}`}
      >
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#4b5563" }}>
          Mark this submission as <strong>{confirmReview?.status}</strong>?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirmReview(null)}>Cancel</Button>
          <Button
            variant={confirmReview?.status === "approved" ? "success" : "danger"}
            onClick={() => handleReview(confirmReview.id, confirmReview.status)}
            disabled={reviewLoading === confirmReview?.id}
          >
            {reviewLoading === confirmReview?.id ? "Saving…" : `Yes, ${confirmReview?.status}`}
          </Button>
        </div>
      </Modal>

      {/* Quick report modal */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Submit Committee Report">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Alert type="error"   message={reportError} />
          <Alert type="success" message={reportSuccess} />
          <Select
            label="Event"
            value={reportForm.event}
            onChange={(e) => setReportForm({ ...reportForm, event: e.target.value })}
          >
            <option value="">Select event…</option>
            {committees.map((m) => (
              <option key={m.event.id} value={m.event.id}>{m.event.name}</option>
            ))}
          </Select>
          <Select
            label="Type"
            value={reportForm.report_type}
            onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
          >
            <option value="update">Update</option>
            <option value="request">Request</option>
            <option value="issue">Issue</option>
          </Select>
          <Input
            label="Title"
            value={reportForm.title}
            onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
            placeholder="Report title"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Content</label>
            <textarea
              value={reportForm.content}
              onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
              rows={4}
              placeholder="Describe the update, request, or issue…"
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", resize: "vertical" }}
            />
          </div>
          <Button onClick={handleReport} disabled={reportLoading}>
            {reportLoading ? "Submitting…" : "Submit Report"}
          </Button>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <img src={lightbox} alt="proof"
            style={{ maxWidth: "88%", maxHeight: "88%", borderRadius: "10px" }} />
          <p style={{ position: "absolute", bottom: 24, color: "#fff", fontSize: "13px" }}>
            Click anywhere to close
          </p>
        </div>
      )}
    </div>
  );
}