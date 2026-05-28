import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { getAttendanceForReview, reviewAttendance } from "../../api/attendance";
import { createCommitteeReport } from "../../api/reports";
import { getBroadcasts } from "../../api/broadcasts";
import { Card, StatCard, Badge, Button, Modal, Select, Alert, Spinner, EmptyState, Input } from "../../components/ui/UI";
import styles from "./Staffdashboard.module.css";

export function StaffDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedEventId, setSelectedEventId] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState("pending");
  const [confirmReview, setConfirmReview] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportForm, setReportForm] = useState({ event: "", title: "", content: "", report_type: "update" });
  const [reportError, setReportError] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");

  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [committeesRes, broadcastsRes] = await Promise.all([
          API.get("/events/my-committees/"),
          getBroadcasts(),
        ]);
        setCommittees(committeesRes.data);
        setBroadcasts(broadcastsRes.slice(0, 5));

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

  const activeCommittees = committees.filter((m) => m.event.status === "active");

  const attCounts = {
    pending:  attendance.filter((a) => a.status === "pending").length,
    approved: attendance.filter((a) => a.status === "approved").length,
    rejected: attendance.filter((a) => a.status === "rejected").length,
  };

  const filtered = attendance.filter((a) => a.status === attendanceFilter);

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingName}>
          🤝 Welcome, {user?.first_name || user?.username}
        </h1>
        <p className={styles.greetingRole}>
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
          <div className={styles.statGrid}>
            <StatCard title="My Events"       value={committees.length}        icon="📅" accent />
            <StatCard title="Active Now"      value={activeCommittees.length}  icon="🟢" />
            <StatCard title="Pending Review"  value={attCounts.pending}        icon="🕐" />
            <StatCard title="Approved"        value={attCounts.approved}       icon="✅" />
          </div>

          {/* Main layout */}
          <div className={styles.mainLayout}>

            {/* ── Left: Attendance review ── */}
            <div>
              <div className={styles.panelHeader}>
                <h2 className={styles.panelTitle}>🔍 Attendance Review</h2>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <select
                    value={selectedEventId || ""}
                    onChange={(e) => setSelectedEventId(Number(e.target.value))}
                    style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border-2)", fontSize: "13px", background: "var(--bg-2)", color: "var(--text-primary)" }}
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
              <div className={styles.tabBar}>
                {["pending", "approved", "rejected"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setAttendanceFilter(t)}
                    className={`${styles.tab} ${attendanceFilter === t ? styles.tabActive : ""}`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    <span className={attendanceFilter === t ? styles.tabCount : styles.tabCountInactive}>
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
              <div className={styles.attendanceGrid}>
                {filtered.map((item) => (
                  <Card key={item.id} style={{ padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <p className={styles.attStudentName}>
                          {item.student?.first_name
                            ? `${item.student.first_name} ${item.student.last_name}`
                            : item.student?.username}
                        </p>
                        <p className={styles.attStudentUser}>
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
                        border: "1px solid var(--border)",
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
            <div className={styles.rightPanel}>

              {/* My assigned events */}
              <div>
                <h2 className={styles.rightTitle}>📅 My Events</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {committees.map((m) => (
                    <Card key={m.event.id} style={{ padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <p className={styles.eventCardName}>{m.event.name}</p>
                        <Badge label={m.event.status} />
                      </div>
                      {m.event.location && (
                        <p className={styles.eventCardLocation}>📍 {m.event.location}</p>
                      )}
                      <p style={{ margin: "0 0 8px", fontSize: "11px", color: m.event.attendance_open ? "var(--green)" : "var(--text-muted)" }}>
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
                  <h2 className={styles.rightTitle} style={{ margin: 0 }}>📣 Broadcasts</h2>
                  <Button variant="ghost" onClick={() => navigate("/broadcasts")} style={{ fontSize: "11px", padding: "4px 8px" }}>
                    All
                  </Button>
                </div>
                {broadcasts.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No broadcasts yet.</p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {broadcasts.map((b) => (
                    <Card key={b.id} style={{ padding: "10px 14px" }}>
                      <p className={styles.broadcastTitle}>{b.title}</p>
                      <p className={styles.broadcastBody}>{b.message}</p>
                      <p className={styles.broadcastMeta}>
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
        <p className={styles.confirmText}>
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
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)" }}>Content</label>
            <textarea
              value={reportForm.content}
              onChange={(e) => setReportForm({ ...reportForm, content: e.target.value })}
              rows={4}
              placeholder="Describe the update, request, or issue…"
            />
          </div>
          <Button onClick={handleReport} disabled={reportLoading}>
            {reportLoading ? "Submitting…" : "Submit Report"}
          </Button>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="proof" className={styles.lightboxImg} />
          <p className={styles.lightboxHint}>Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}