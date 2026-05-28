import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { startEvent, endEvent, pickEvent } from "../../api/events";
import { submitRating, toggleAttendance } from "../../api/misc";
import { Badge, Button, Card, Alert, Spinner, Modal, Input } from "../../components/ui/UI";

export function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isStudent = user?.role === "student";

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState(null);

  // Track if this student already picked this event
  const [alreadyPicked, setAlreadyPicked] = useState(false);
  const [pickLoading, setPickLoading] = useState(false);

  // Rating modal
  const [ratingOpen, setRatingOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingMsg, setRatingMsg] = useState(null);

  // Join committee modal
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMsg, setJoinMsg] = useState(null);

  const showMsg = (type, text) => {
    setActionMsg({ type, text });
    setTimeout(() => setActionMsg(null), 3500);
  };

  const fetchEvent = async () => {
    try {
      const res = await API.get("/events/");
      const found = res.data.find((e) => e.id === parseInt(id));
      if (!found) setError("Event not found.");
      else setEvent(found);
    } catch {
      setError("Failed to load event.");
    } finally {
      setLoading(false);
    }
  };

  // Check if student already picked — prevents duplicate pick errors
  const fetchPickedState = async () => {
    if (!isStudent) return;
    try {
      const res = await API.get("/events/my-selections/");
      setAlreadyPicked(res.data.includes(parseInt(id)));
    } catch {
      // Non-critical — leave button enabled if check fails
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchPickedState();
  }, [id]);

  // ── Admin actions ─────────────────────────────────────────────────────────

  const handleStart = async () => {
    try {
      await startEvent(event.id);
      fetchEvent();
      showMsg("success", "Event started successfully.");
    } catch (err) {
      showMsg("error", err.response?.data?.detail || "Failed to start event.");
    }
  };

  const handleEnd = async () => {
    try {
      await endEvent(event.id);
      fetchEvent();
      showMsg("success", "Event ended.");
    } catch (err) {
      showMsg("error", err.response?.data?.detail || "Failed to end event.");
    }
  };

  const handleToggleAttendance = async () => {
    try {
      await toggleAttendance(event.id, !event.attendance_open);
      fetchEvent();
      showMsg("success", `Attendance ${!event.attendance_open ? "opened" : "closed"}.`);
    } catch (err) {
      showMsg("error", err.response?.data?.detail || "Failed to toggle attendance.");
    }
  };

  // ── Student actions ───────────────────────────────────────────────────────

  const handlePick = async () => {
    setPickLoading(true);
    try {
      await pickEvent(event.id);
      setAlreadyPicked(true);
      showMsg("success", "Event picked! You can now submit attendance.");
    } catch (err) {
      showMsg("error", err.response?.data?.detail || "Failed to pick event.");
    } finally {
      setPickLoading(false);
    }
  };

  const handleRating = async () => {
    setRatingLoading(true);
    setRatingMsg(null);
    try {
      await submitRating({ event: event.id, rating, comment });
      setRatingMsg({ type: "success", text: "Rating submitted!" });
      setTimeout(() => { setRatingOpen(false); setRatingMsg(null); }, 1500);
    } catch (err) {
      setRatingMsg({ type: "error", text: err.response?.data?.detail || "Failed to submit rating." });
    } finally {
      setRatingLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code.trim()) { setJoinMsg({ type: "error", text: "Enter a committee code." }); return; }
    setJoinLoading(true);
    setJoinMsg(null);
    try {
      await API.post(`/events/${event.id}/join-committee/`, { code });
      setJoinMsg({ type: "success", text: "You joined the committee!" });
      setTimeout(() => { setJoinOpen(false); setJoinMsg(null); setCode(""); fetchEvent(); }, 1500);
    } catch (err) {
      setJoinMsg({ type: "error", text: err.response?.data?.detail || "Invalid or expired code." });
    } finally {
      setJoinLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <Spinner />;
  if (error) return (
    <div>
      <p style={{ color: "#dc2626" }}>{error}</p>
      <Button variant="ghost" onClick={() => navigate("/events")}>← Back</Button>
    </div>
  );

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : "—";

  return (
    <div style={{ maxWidth: 720 }}>
      <button
        onClick={() => navigate("/events")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", marginBottom: 16, padding: 0 }}
      >
        ← Back to Events
      </button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{event.name}</h1>
          <Badge label={event.status} />
        </div>
        {event.description && (
          <p style={{ margin: "0 0 12px", fontSize: "14px", color: "#4b5563", lineHeight: 1.6 }}>{event.description}</p>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", fontSize: "13px", color: "#6b7280", marginBottom: 12 }}>
          <span>📍 {event.location || "No location set"}</span>
          <span>🕐 Start: {fmt(event.start_time)}</span>
          <span>🏁 End: {fmt(event.end_time)}</span>
          <span style={{ color: event.attendance_open ? "#15803d" : "#9ca3af" }}>
            {event.attendance_open ? "🟢 Attendance open" : "⚫ Attendance closed"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: "13px", color: "#6b7280" }}>
          <span>👥 {event.attendance_count ?? 0} submissions</span>
          <span>✅ {event.approved_attendance_count ?? 0} approved</span>
          <span>🤝 {event.committee_count ?? 0} committee</span>
        </div>
      </Card>

      {actionMsg && <Alert type={actionMsg.type} message={actionMsg.text} />}
      <div style={{ height: actionMsg ? 12 : 0 }} />

      {/* Admin controls */}
      {isAdmin && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>Admin Controls</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="success" disabled={event.status !== "preparation"} onClick={handleStart}>
              ▶ Start Event
            </Button>
            <Button variant="danger" disabled={event.status !== "active"} onClick={handleEnd}>
              ■ End Event
            </Button>
            <Button
              variant={event.attendance_open ? "ghost" : "outline"}
              disabled={event.status !== "active"}
              onClick={handleToggleAttendance}
            >
              {event.attendance_open ? "🔒 Close Attendance" : "🔓 Open Attendance"}
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/committee/${event.id}`)}>
              🤝 Manage Committee
            </Button>
            <Button variant="ghost" onClick={() => navigate(`/expenditures?event=${event.id}`)}>
              💰 Expenditures
            </Button>
          </div>
        </Card>
      )}

      {/* Student actions */}
      {isStudent && (
        <Card style={{ marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 700 }}>Your Actions</h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {event.status === "active" && (
              <Button
                variant={alreadyPicked ? "ghost" : "primary"}
                disabled={alreadyPicked || pickLoading}
                onClick={handlePick}
              >
                {pickLoading ? "Picking…" : alreadyPicked ? "✓ Already Picked" : "🎯 Pick This Event"}
              </Button>
            )}
            {/* Only show attendance button if attendance is actually open */}
            {event.status === "active" && event.attendance_open && (
              <Button variant="outline" onClick={() => navigate("/attendance")}>
                📸 Submit Attendance
              </Button>
            )}
            {event.status === "ended" && (
              <Button variant="outline" onClick={() => setRatingOpen(true)}>
                ⭐ Rate Experience
              </Button>
            )}
            <Button variant="ghost" onClick={() => setJoinOpen(true)}>
              🤝 Join Committee
            </Button>
          </div>
        </Card>
      )}

      {/* Rating Modal */}
      <Modal open={ratingOpen} onClose={() => setRatingOpen(false)} title="Rate Your Experience">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ratingMsg && <Alert type={ratingMsg.type} message={ratingMsg.text} />}
          <div>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>
              Rating
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  style={{
                    width: 40, height: 40, borderRadius: "8px", border: "2px solid",
                    borderColor: rating >= n ? "#f59e0b" : "#e5e7eb",
                    background: rating >= n ? "#fef9c3" : "#fff",
                    fontSize: "18px", cursor: "pointer",
                  }}
                >⭐</button>
              ))}
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#9ca3af" }}>{rating} / 5</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience…"
              style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", resize: "vertical" }}
            />
          </div>
          <Button onClick={handleRating} disabled={ratingLoading}>
            {ratingLoading ? "Submitting…" : "Submit Rating"}
          </Button>
        </div>
      </Modal>

      {/* Join Committee Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Committee">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {joinMsg && <Alert type={joinMsg.type} message={joinMsg.text} />}
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
            Enter the committee code provided by your admin.
          </p>
          <Input
            label="Committee Code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3D4"
          />
          <Button onClick={handleJoin} disabled={joinLoading}>
            {joinLoading ? "Joining…" : "Join Committee"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}