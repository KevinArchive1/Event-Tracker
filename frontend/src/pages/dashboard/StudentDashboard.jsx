import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import { pickEvent } from "../../api/events";
import { Card, StatCard, Badge, Button, Spinner, EmptyState, Alert } from "../../components/ui/UI";
import styles from "./StudentDashboard.module.css";

export function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [pickedIds, setPickedIds] = useState(new Set());
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pickMsg, setPickMsg] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [eventsRes, submissionsRes, selectionsRes] = await Promise.all([
          API.get("/events/"),
          API.get("/attendance/my/"),
          API.get("/events/my-selections/"),
        ]);
        setAllEvents(eventsRes.data);
        setSubmissions(submissionsRes.data);
        setPickedIds(new Set(selectionsRes.data));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePick = async (eventId, eventName) => {
    try {
      await pickEvent(eventId);
      setPickedIds((prev) => new Set([...prev, eventId]));
      setPickMsg((prev) => ({ ...prev, [eventId]: { type: "success", text: "Picked!" } }));
    } catch (err) {
      setPickMsg((prev) => ({
        ...prev,
        [eventId]: { type: "error", text: err.response?.data?.detail || "Failed to pick." },
      }));
    }
    setTimeout(() => setPickMsg((prev) => { const n = { ...prev }; delete n[eventId]; return n; }), 3000);
  };

  if (loading) return <Spinner />;

  const activeEvents = allEvents.filter((e) => e.status === "active");
  const pickedEvents = allEvents.filter((e) => pickedIds.has(e.id));
  const endedEvents  = allEvents.filter((e) => e.status === "ended");

  const stats = {
    picked:   pickedEvents.length,
    approved: submissions.filter((s) => s.status === "approved").length,
    pending:  submissions.filter((s) => s.status === "pending").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
  };

  const STATUS_COLOR = {
    approved: { bg: "#dcfce7", color: "#15803d", icon: "✅" },
    pending:  { bg: "#fef9c3", color: "#92400e", icon: "🕐" },
    rejected: { bg: "#fee2e2", color: "#b91c1c", icon: "❌" },
  };

  return (
    <div className={styles.page}>
      {/* Greeting */}
      <div className={styles.greeting}>
        <h1 className={styles.greetingName}>
          👋 Welcome back, {user?.first_name || user?.username}
        </h1>
        <p className={styles.greetingRole}>
          {user?.course && `${user.course} · `}{user?.year && `${user.year} · `}Student
        </p>
      </div>

      {/* Stat row */}
      <div className={styles.statGrid}>
        <StatCard title="Events Picked"    value={stats.picked}   icon="🎯" accent />
        <StatCard title="Approved"         value={stats.approved} icon="✅" />
        <StatCard title="Pending Review"   value={stats.pending}  icon="🕐" />
        <StatCard title="Rejected"         value={stats.rejected} icon="❌" />
      </div>

      {/* Two-column layout */}
      <div className={styles.twoCol}>

        {/* ── Active events to pick ── */}
        <div>
          <h2 className={styles.sectionTitle}>🟢 Active Events</h2>
          {activeEvents.length === 0 && (
            <EmptyState message="No active events right now." />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeEvents.map((ev) => {
              const picked = pickedIds.has(ev.id);
              const msg = pickMsg[ev.id];
              return (
                <Card key={ev.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <p
                      onClick={() => navigate(`/events/${ev.id}`)}
                      className={styles.eventName}
                    >
                      {ev.name}
                    </p>
                    <Badge label={ev.attendance_open ? "open" : "closed"} />
                  </div>
                  {ev.location && (
                    <p className={styles.eventLocation}>📍 {ev.location}</p>
                  )}
                  {msg && (
                    <div style={{
                      marginBottom: 8, padding: "4px 10px", borderRadius: "6px",
                      fontSize: "12px", fontWeight: 600,
                      background: msg.type === "success" ? "#dcfce7" : "#fee2e2",
                      color: msg.type === "success" ? "#15803d" : "#b91c1c",
                    }}>
                      {msg.text}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button variant="ghost" onClick={() => navigate(`/events/${ev.id}`)} style={{ fontSize: "12px", padding: "5px 10px" }}>
                      View
                    </Button>
                    <Button
                      variant={picked ? "ghost" : "primary"}
                      disabled={picked}
                      onClick={() => handlePick(ev.id, ev.name)}
                      style={{ fontSize: "12px", padding: "5px 10px" }}
                    >
                      {picked ? "✓ Picked" : "Pick Event"}
                    </Button>
                    {ev.attendance_open && (
                      <Button
                        variant="outline"
                        onClick={() => navigate("/attendance")}
                        style={{ fontSize: "12px", padding: "5px 10px" }}
                      >
                        Submit Proof
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* ── My recent submissions ── */}
        <div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>📋 My Submissions</h2>
            <Button variant="ghost" onClick={() => navigate("/attendance")} style={{ fontSize: "12px", padding: "5px 10px" }}>
              View all
            </Button>
          </div>

          {submissions.length === 0 && (
            <EmptyState message="No submissions yet." />
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {submissions.slice(0, 5).map((item) => {
              const s = STATUS_COLOR[item.status] || STATUS_COLOR.pending;
              return (
                <Card key={item.id} style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p className={styles.submissionName}>{item.event_name}</p>
                      <p className={styles.submissionDate}>
                        {new Date(item.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: "99px",
                      fontSize: "11px", fontWeight: 700,
                      background: s.bg, color: s.color,
                    }}>
                      <span>{s.icon}</span>
                      <span style={{ textTransform: "capitalize" }}>{item.status}</span>
                    </div>
                  </div>
                  {item.review_note && (
                    <p className={styles.reviewNote}>
                      Note: <em>{item.review_note}</em>
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Ended events — rate them ── */}
      {endedEvents.some((e) => pickedIds.has(e.id)) && (
        <div className={styles.rateSection}>
          <h2 className={styles.sectionTitle}>⭐ Rate Past Events</h2>
          <div className={styles.rateGrid}>
            {endedEvents.filter((e) => pickedIds.has(e.id)).map((ev) => (
              <Card key={ev.id} style={{ padding: "14px 16px" }}>
                <p className={styles.rateName}>{ev.name}</p>
                <p className={styles.rateLocation}>
                  {ev.location || "No location"}
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate(`/events/${ev.id}`)}
                  style={{ fontSize: "12px", padding: "5px 10px" }}
                >
                  ⭐ Rate this event
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}