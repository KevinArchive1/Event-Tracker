import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { startEvent, endEvent, pickEvent } from "../../api/events";
import { submitRating, toggleAttendance } from "../../api/misc";
import { Badge, Button, Card, Alert, Spinner, Modal, Input } from "../../components/ui/UI";
import styles from "./EventDetails.module.css";

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

  const [alreadyPicked, setAlreadyPicked] = useState(false);
  const [pickLoading, setPickLoading] = useState(false);

  const [ratingOpen, setRatingOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingMsg, setRatingMsg] = useState(null);

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

  const fetchPickedState = async () => {
    if (!isStudent) return;
    try {
      const res = await API.get("/events/my-selections/");
      setAlreadyPicked(res.data.includes(parseInt(id)));
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchPickedState();
  }, [id]);

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

  if (loading) return <Spinner />;
  if (error) return (
    <div>
      <p style={{ color: "var(--red)" }}>{error}</p>
      <Button variant="ghost" onClick={() => navigate("/events")}>← Back</Button>
    </div>
  );

  const fmt = (dt) => dt ? new Date(dt).toLocaleString() : "—";

  return (
    <div className={styles.page}>
      <button
        onClick={() => navigate("/events")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "13px", marginBottom: 16, padding: 0 }}
      >
        ← Back to Events
      </button>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <h1 className={styles.eventTitle}>{event.name}</h1>
          <Badge label={event.status} />
        </div>
        {event.description && (
          <p className={styles.eventDesc}>{event.description}</p>
        )}
        <div className={styles.detailGrid}>
          <span className={styles.detailItem}>📍 {event.location || "No location set"}</span>
          <span className={styles.detailItem}>🕐 Start: {fmt(event.start_time)}</span>
          <span className={styles.detailItem}>🏁 End: {fmt(event.end_time)}</span>
          <span className={event.attendance_open ? styles.detailItemGreen : styles.detailItem}>
            {event.attendance_open ? "🟢 Attendance open" : "⚫ Attendance closed"}
          </span>
        </div>
        <div className={styles.metaRow}>
          <span>👥 <span className={styles.metaNum}>{event.attendance_count ?? 0}</span> submissions</span>
          <span>✅ <span className={styles.metaNum}>{event.approved_attendance_count ?? 0}</span> approved</span>
          <span>🤝 <span className={styles.metaNum}>{event.committee_count ?? 0}</span> committee</span>
        </div>
      </Card>

      {actionMsg && <Alert type={actionMsg.type} message={actionMsg.text} />}
      <div style={{ height: actionMsg ? 12 : 0 }} />

      {/* Admin controls */}
      {isAdmin && (
        <Card style={{ marginBottom: 16 }}>
          <h3 className={styles.sectionTitle}>Admin Controls</h3>
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
          <h3 className={styles.sectionTitle}>Your Actions</h3>
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
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-display)", display: "block", marginBottom: 8 }}>
              Rating
            </label>
            <div className={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={styles.ratingBtn}
                  style={{
                    borderColor: rating >= n ? "#f59e0b" : "var(--border-2)",
                    background: rating >= n ? "rgba(245,158,11,0.12)" : "var(--surface)",
                    color: "inherit",
                  }}
                >⭐</button>
              ))}
            </div>
            <p className={styles.ratingHint}>{rating} / 5</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>Comment (optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Share your experience…"
            />
          </div>
          <Button onClick={handleRating} disabled={ratingLoading}>
            {ratingLoading ? "Submitting…" : "Submit Rating"}
          </Button>
        </div>
      </Modal>

      {/* Join Committee Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Committee">
        <div className={styles.codeModalCol}>
          {joinMsg && <Alert type={joinMsg.type} message={joinMsg.text} />}
          <p className={styles.joinHint}>
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