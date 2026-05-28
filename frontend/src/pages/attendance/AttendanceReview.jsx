import { useEffect, useState } from "react";
import API from "../../api/axios";
import { getAttendanceForReview, reviewAttendance } from "../../api/attendance";
import { Badge, Button, Card, Select, Spinner, EmptyState, Alert, Modal } from "../../components/ui/UI";

export function AttendanceReview() {
  const [events, setEvents] = useState([]);
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
        // Review endpoint only works for ended events — filter and label accordingly
        const ended = r.data.filter((e) => e.status === "ended");
        setEvents(ended);
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
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Attendance Review</h1>
        <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>
          Approve or reject student submissions · Only ended events are reviewable
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Select value={eventId} onChange={handleEventChange} style={{ minWidth: 240 }}>
          <option value="">Select an ended event…</option>
          {events.length === 0 && <option disabled>No ended events yet</option>}
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>{ev.name}</option>
          ))}
        </Select>
        <input
          placeholder="Search by username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", outline: "none", minWidth: 200 }}
        />
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["pending", "approved", "rejected"].map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              padding: "7px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
              fontSize: "13px", fontWeight: filter === t ? 700 : 400,
              background: filter === t ? "#6366f1" : "#f3f4f6",
              color: filter === t ? "#fff" : "#374151",
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {eventId && (
              <span style={{
                marginLeft: 6, background: filter === t ? "rgba(255,255,255,0.25)" : "#e5e7eb",
                borderRadius: "99px", padding: "1px 7px", fontSize: "11px",
              }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
        {filtered.map((item) => (
          <Card key={item.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "14px" }}>
                  {item.student?.first_name
                    ? `${item.student.first_name} ${item.student.last_name}`
                    : item.student?.username}
                </p>
                <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                  @{item.student?.username} · {item.student?.course || "—"}
                </p>
              </div>
              <Badge label={item.status} />
            </div>
            <img
              src={item.image_proof}
              alt="proof"
              onClick={() => setSelectedImage(item.image_proof)}
              style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", marginBottom: 10, border: "1px solid #f1f5f9" }}
            />
            <p style={{ margin: "0 0 10px", fontSize: "11px", color: "#9ca3af" }}>
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
              <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#6b7280" }}>Note: {item.review_note}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <img src={selectedImage} alt="full proof" style={{ maxWidth: "88%", maxHeight: "88%", borderRadius: "10px" }} />
          <p style={{ position: "absolute", bottom: 24, color: "#fff", fontSize: "13px" }}>Click anywhere to close</p>
        </div>
      )}

      {/* Confirm modal */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Confirm ${confirm?.status === "approved" ? "Approval" : "Rejection"}`}>
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#4b5563" }}>
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