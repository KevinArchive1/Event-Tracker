import { useEffect, useState } from "react";
import API from "../../api/axios";
import { submitAttendance } from "../../api/attendance";
import { Badge, Button, Card, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";

export function Attendance() {
  const [tab, setTab] = useState("submit");

  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [mySubmissions, setMySubmissions] = useState([]);
  const [myLoading, setMyLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    API.get("/events/").then((r) => setEvents(r.data)).catch(console.error);
  }, []);

  // Uses GET /attendance/my/ — no permission issues, returns only this user's records
  useEffect(() => {
    if (tab !== "my") return;
    setMyLoading(true);
    API.get("/attendance/my/")
      .then((r) => setMySubmissions(r.data))
      .catch(console.error)
      .finally(() => setMyLoading(false));
  }, [tab]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubmitError("");
    if (!file.type.startsWith("image/")) { setSubmitError("Only image files are allowed."); return; }
    if (file.size > 5 * 1024 * 1024) { setSubmitError("Image must be less than 5MB."); return; }
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    if (!selectedEvent) { setSubmitError("Please select an event."); return; }
    const eventObj = events.find((ev) => ev.id.toString() === selectedEvent);
    if (!eventObj) { setSubmitError("Invalid event."); return; }
    if (eventObj.status !== "active") { setSubmitError("You can only submit for active events."); return; }
    if (!eventObj.attendance_open) { setSubmitError("Attendance is currently closed for this event."); return; }
    if (!image) { setSubmitError("Please upload an image proof."); return; }

    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append("event", selectedEvent);
      formData.append("image_proof", image);
      await submitAttendance(formData);
      setSubmitSuccess("Submitted! Your attendance is pending review.");
      setSelectedEvent(""); setImage(null); setPreview(null);
    } catch (err) {
      const data = err.response?.data;
      setSubmitError(
        data?.detail || data?.non_field_errors?.[0] ||
        "Failed to submit. You may have already submitted, or you need to pick this event first."
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  const STATUS_STYLE = {
    approved: { bg: "#dcfce7", color: "#15803d", icon: "✅", msg: "Attendance confirmed" },
    pending:  { bg: "#fef9c3", color: "#92400e", icon: "🕐", msg: "Waiting for review" },
    rejected: { bg: "#fee2e2", color: "#b91c1c", icon: "❌", msg: "Submission rejected" },
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Attendance</h1>
        <p style={{ margin: 0, color: "#9ca3af", fontSize: "13px" }}>Submit proof or check your submission status</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[{ key: "submit", label: "📸 Submit" }, { key: "my", label: "📋 My Submissions" }].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: "8px 18px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "13px",
            fontWeight: tab === t.key ? 700 : 400,
            background: tab === t.key ? "#6366f1" : "#f3f4f6",
            color: tab === t.key ? "#fff" : "#374151",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "submit" && (
        <div style={{ maxWidth: 480 }}>
          <Card>
            <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700 }}>Submit Attendance Proof</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Select label="Event *" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                <option value="">Select an event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id} disabled={ev.status !== "active" || !ev.attendance_open}>
                    {ev.name}{ev.status !== "active" ? ` (${ev.status})` : !ev.attendance_open ? " (closed)" : ""}
                  </option>
                ))}
              </Select>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151" }}>Image Proof * (max 5MB)</label>
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ fontSize: "13px" }} />
              </div>
              {preview && (
                <img src={preview} alt="preview"
                  style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: "10px", border: "1px solid #e5e7eb" }} />
              )}
              <Alert type="error"   message={submitError} />
              <Alert type="success" message={submitSuccess} />
              <Button type="submit" disabled={submitLoading}>{submitLoading ? "Submitting…" : "Submit Attendance"}</Button>
            </form>
          </Card>
        </div>
      )}

      {tab === "my" && (
        <div>
          {myLoading && <Spinner />}
          {!myLoading && mySubmissions.length === 0 && (
            <EmptyState message="No submissions yet. Pick an active event and submit your proof." />
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mySubmissions.map((item) => {
              const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
              return (
                <Card key={item.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: "22px" }}>{s.icon}</span>
                        <div>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "15px" }}>{item.event_name}</p>
                          <p style={{ margin: 0, fontSize: "11px", color: "#9ca3af" }}>
                            Submitted {new Date(item.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700, background: s.bg, color: s.color, marginBottom: item.review_note ? 8 : 0 }}>
                        {s.msg}
                      </div>
                      {item.review_note && <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#6b7280" }}>Note: <em>{item.review_note}</em></p>}
                      {item.reviewed_at && <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#9ca3af" }}>Reviewed by {item.reviewed_by} · {new Date(item.reviewed_at).toLocaleString()}</p>}
                    </div>
                    {item.image_proof && (
                      <img src={item.image_proof} alt="proof" onClick={() => setLightbox(item.image_proof)}
                        style={{ width: 72, height: 72, objectFit: "cover", borderRadius: "8px", marginLeft: 16, cursor: "pointer", border: "1px solid #e5e7eb", flexShrink: 0 }} />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={lightbox} alt="proof" style={{ maxWidth: "88%", maxHeight: "88%", borderRadius: "10px" }} />
          <p style={{ position: "absolute", bottom: 24, color: "#fff", fontSize: "13px" }}>Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}