import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { startEvent, endEvent } from "../../api/events";
import { toggleAttendance } from "../../api/misc";
import { Badge, Button, Card, StatCard, Modal, Spinner } from "../../components/ui/UI";
import styles from "./AdminDashboard.module.css";

export function AdminDashboard() {
  const navigate = useNavigate();

  const [liveData, setLiveData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Confirm modal: { eventId, action: "start"|"end" }
  const [confirm, setConfirm] = useState(null);

  // Activity log — real entries built from live data diffs
  const [activityLog, setActivityLog] = useState([]);
  const prevEventsRef = useRef({});

  const addLog = (msg) => {
    const entry = { id: Date.now(), time: new Date().toLocaleTimeString(), msg };
    setActivityLog((prev) => [entry, ...prev].slice(0, 20));
  };

  const fetchData = async () => {
    try {
      const [analyticsRes, eventsRes] = await Promise.all([
        API.get("/analytics/live/"),
        API.get("/events/"),
      ]);
      const newEvents = eventsRes.data;
      const prev = prevEventsRef.current;

      newEvents.forEach((ev) => {
        const old = prev[ev.id];
        if (!old) return;
        if (old.status !== ev.status) {
          addLog(`"${ev.name}" changed status: ${old.status} → ${ev.status}`);
        }
        if (old.attendance_open !== ev.attendance_open) {
          addLog(`"${ev.name}" attendance ${ev.attendance_open ? "opened" : "closed"}`);
        }
        if (old.attendance_count !== ev.attendance_count) {
          addLog(`New attendance submission on "${ev.name}"`);
        }
        if (old.approved_attendance_count !== ev.approved_attendance_count) {
          addLog(`Attendance approved on "${ev.name}"`);
        }
      });

      const newRef = {};
      newEvents.forEach((ev) => { newRef[ev.id] = ev; });
      prevEventsRef.current = newRef;

      setLiveData(analyticsRes.data);
      setEvents(newEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const metrics = liveData ? {
    activeEvents:      liveData.events.filter((e) => e.status === "active").length,
    totalAttendance:   liveData.events.reduce((s, e) => s + e.attendance_population, 0),
    pendingAttendance: liveData.events.reduce(
      (s, e) => s + (e.attendance_population - e.approved_attendance_population), 0
    ),
    accidentCount: liveData.events.reduce((s, e) => s + e.accident_count, 0),
  } : null;

  const handleConfirmedAction = async () => {
    if (!confirm) return;
    const { eventId, action } = confirm;
    setActionLoading(eventId + action);
    try {
      if (action === "start") await startEvent(eventId);
      if (action === "end")   await endEvent(eventId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to ${action} event.`);
    } finally {
      setActionLoading(null);
      setConfirm(null);
    }
  };

  const handleToggle = async (eventId, currentOpen) => {
    setActionLoading(eventId + "toggle");
    try {
      await toggleAttendance(eventId, !currentOpen);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to toggle attendance.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !metrics) {
    return (
      <div style={{ padding: 40 }}>
        <Spinner />
        <p style={{ textAlign: "center", color: "#9ca3af" }}>Loading control center…</p>
      </div>
    );
  }

  const STATUS_ORDER = { active: 0, preparation: 1, ended: 2 };
  const sorted = [...events].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9)
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>🖥️ Admin Control Center</h1>
        <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af" }}>
          Live — refreshing every 5s · Last update: {new Date(liveData.timestamp).toLocaleTimeString()}
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard title="Active Events"    value={metrics.activeEvents}      icon="🟢" accent />
        <StatCard title="Total Attendance" value={metrics.totalAttendance}   icon="👥" />
        <StatCard title="Pending Reviews"  value={metrics.pendingAttendance} icon="🕐" />
        <StatCard title="Accidents"        value={metrics.accidentCount}     icon="🚨" />
      </div>

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>

        {/* Event control panel */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Event Control Panel</h2>
            <Button variant="outline" onClick={() => navigate("/events")}>
              + Manage Events
            </Button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {sorted.map((event) => {
              const isStarting = actionLoading === event.id + "start";
              const isEnding   = actionLoading === event.id + "end";
              const isToggling = actionLoading === event.id + "toggle";

              return (
                <Card key={event.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>{event.name}</p>
                      {event.location && (
                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>📍 {event.location}</p>
                      )}
                    </div>
                    <Badge label={event.status} />
                  </div>

                  <div style={{ display: "flex", gap: 16, fontSize: "12px", color: "#6b7280", marginBottom: 12 }}>
                    <span>👥 {event.attendance_count ?? 0}</span>
                    <span>✅ {event.approved_attendance_count ?? 0} approved</span>
                    <span style={{ color: event.attendance_open ? "#15803d" : "#9ca3af" }}>
                      {event.attendance_open ? "🟢 Attendance open" : "⚫ Closed"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button variant="ghost" onClick={() => navigate(`/events/${event.id}`)}>
                      View
                    </Button>
                    <Button
                      variant="success"
                      disabled={event.status !== "preparation" || !!isStarting}
                      onClick={() => setConfirm({ eventId: event.id, action: "start", name: event.name })}
                    >
                      {isStarting ? "Starting…" : "▶ Start"}
                    </Button>
                    <Button
                      variant="danger"
                      disabled={event.status !== "active" || !!isEnding}
                      onClick={() => setConfirm({ eventId: event.id, action: "end", name: event.name })}
                    >
                      {isEnding ? "Ending…" : "■ End"}
                    </Button>
                    <Button
                      variant={event.attendance_open ? "ghost" : "outline"}
                      disabled={event.status !== "active" || !!isToggling}
                      onClick={() => handleToggle(event.id, event.attendance_open)}
                    >
                      {isToggling ? "…" : event.attendance_open ? "🔒 Close Att." : "🔓 Open Att."}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        <div>
          <h2 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: 700 }}>📡 Activity Feed</h2>
          <Card style={{ padding: "12px 16px" }}>
            {activityLog.length === 0 && (
              <p style={{ margin: 0, fontSize: "13px", color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
                Monitoring… changes will appear here.
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activityLog.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex", gap: 10, alignItems: "flex-start",
                    padding: "6px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <span style={{ fontSize: "11px", color: "#9ca3af", flexShrink: 0, marginTop: 1 }}>
                    {entry.time}
                  </span>
                  <span style={{ fontSize: "12px", color: "#374151" }}>{entry.msg}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick links */}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <Button variant="ghost" onClick={() => navigate("/attendance-review")} style={{ textAlign: "left" }}>
              🔍 Review Attendance
            </Button>
            <Button variant="ghost" onClick={() => navigate("/analytics")} style={{ textAlign: "left" }}>
              📈 Analytics
            </Button>
            <Button variant="ghost" onClick={() => navigate("/accidents")} style={{ textAlign: "left" }}>
              🚨 Accident Reports
            </Button>
            <Button variant="ghost" onClick={() => navigate("/reports")} style={{ textAlign: "left" }}>
              📝 Committee Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Confirm modal */}
      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm?.action === "end" ? "⚠️ End Event?" : "▶ Start Event?"}
      >
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#4b5563" }}>
          {confirm?.action === "end"
            ? `Are you sure you want to end "${confirm?.name}"? This cannot be undone — the event status will be set to ended permanently.`
            : `Start "${confirm?.name}"? Its status will change to active and students will be able to pick and attend.`}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
          <Button
            variant={confirm?.action === "end" ? "danger" : "success"}
            onClick={handleConfirmedAction}
            disabled={!!actionLoading}
          >
            {actionLoading ? "Please wait…" : `Yes, ${confirm?.action} it`}
          </Button>
        </div>
      </Modal>
    </div>
  );
}