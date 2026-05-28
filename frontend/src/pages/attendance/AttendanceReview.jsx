import { useEffect, useState } from "react";
import API from "../../api/axios";
import { getAttendanceForReview, reviewAttendance } from "../../api/attendance";
import { Badge, Button, Card, Select, Spinner, EmptyState, Alert, Modal } from "../../components/ui/UI";
import styles from "./AttendanceReview.module.css";

export function AttendanceReview() {
  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventId, setEventId] = useState("");
  const [attendance, setAttendance] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    API.get("/events/")
      .then((r) => {
        const ended = r.data.filter((e) => e.status === "ended");
        setEvents(ended);
        setEventsLoaded(true);
      })
      .catch(console.error);
  }, []);

  const fetchAttendance = async (id) => {
    if (!id) return;
    setLoading(true);
    setError("");
    setAttendance([]);
    try {
      const res = await getAttendanceForReview(id);
      setAttendance(res);
    } catch {
      setError("Failed to load attendance records.");
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (e) => {
    const id = e.target.value;
    setEventId(id);
    fetchAttendance(id);
  };

  const handleReview = async (id, reviewStatus) => {
    setActionLoading(id);
    try {
      await reviewAttendance(id, { status: reviewStatus, review_note: "" });
      setAttendance((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: reviewStatus } : item))
      );
      setSuccess(`Marked as ${reviewStatus}`);
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const filtered = attendance.filter((item) => {
    const matchStatus = item.status === filter;
    const matchSearch = item.student?.username?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const counts = {
    pending:  attendance.filter((a) => a.status === "pending").length,
    approved: attendance.filter((a) => a.status === "approved").length,
    rejected: attendance.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Attendance Review</h1>
        <p className={styles.subtitle}>
          Approve or reject student submissions · Only ended events are reviewable
        </p>
      </div>

      {eventsLoaded && events.length === 0 && (
        <EmptyState message="No ended events yet. Attendance review is available once an event has ended." />
      )}

      {eventsLoaded && events.length > 0 && (
        <>
          <div className={styles.filterRow}>
            <Select value={eventId} onChange={handleEventChange} style={{ minWidth: 240 }}>
              <option value="">Select an ended event…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </Select>
            <input
              placeholder="Search by username…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Filter tabs */}
          <div className={styles.tabBar}>
            {["pending", "approved", "rejected"].map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`${styles.tab} ${filter === t ? styles.tabActive : ""}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {eventId && (
                  <span className={filter === t ? styles.tabCount : styles.tabCountInactive}>
                    {counts[t]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {error   && <Alert type="error"   message={error}   />}
          {success && <Alert type="success" message={success} />}
          <div style={{ height: (error || success) ? 12 : 0 }} />

          {loading && <Spinner />}
          {!loading && eventId && filtered.length === 0 && (
            <EmptyState message={`No ${filter} submissions found.`} />
          )}
          {!eventId && !loading && (
            <EmptyState message="Select an ended event above to start reviewing." />
          )}

          <div className={styles.cardGrid}>
            {filtered.map((item) => (
              <Card key={item.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <p className={styles.studentName}>
                      {item.student?.first_name
                        ? `${item.student.first_name} ${item.student.last_name}`
                        : item.student?.username}
                    </p>
                    <p className={styles.studentMeta}>
                      @{item.student?.username} · {item.student?.course || "—"}
                    </p>
                  </div>
                  <Badge label={item.status} />
                </div>
                <img
                  src={item.image_proof}
                  alt="proof"
                  onClick={() => setSelectedImage(item.image_proof)}
                  className={styles.proofImg}
                />
                <p className={styles.submittedAt}>
                  Submitted: {new Date(item.submitted_at).toLocaleString()}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <Button
                    variant="success"
                    disabled={item.status === "approved" || actionLoading === item.id}
                    onClick={() => setConfirm({ id: item.id, status: "approved" })}
                    style={{ flex: 1 }}
                  >✓ Approve</Button>
                  <Button
                    variant="danger"
                    disabled={item.status === "rejected" || actionLoading === item.id}
                    onClick={() => setConfirm({ id: item.id, status: "rejected" })}
                    style={{ flex: 1 }}
                  >✕ Reject</Button>
                </div>
                {item.review_note && (
                  <p className={styles.reviewNote}>Note: {item.review_note}</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div className={styles.lightbox} onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="full proof" className={styles.lightboxImg} />
          <p className={styles.lightboxHint}>Click anywhere to close</p>
        </div>
      )}

      {/* Confirm modal */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Confirm ${confirm?.status === "approved" ? "Approval" : "Rejection"}`}>
        <p className={styles.confirmText}>
          Are you sure you want to mark this as <strong>{confirm?.status}</strong>?
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant={confirm?.status === "approved" ? "success" : "danger"}
            onClick={() => handleReview(confirm.id, confirm.status)}
            disabled={actionLoading === confirm?.id}
          >
            {actionLoading === confirm?.id ? "Saving…" : `Yes, ${confirm?.status}`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}