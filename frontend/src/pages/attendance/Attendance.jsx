import { useEffect, useState } from "react";
import API from "../../api/axios";
import { submitAttendance } from "../../api/attendance";
import { Badge, Button, Card, Select, Alert, Spinner, EmptyState } from "../../components/ui/UI";
import styles from "./Attendance.module.css";

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
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Attendance</h1>
        <p className={styles.subtitle}>Submit proof or check your submission status</p>
      </div>

      <div className={styles.tabBar}>
        {[{ key: "submit", label: "📸 Submit" }, { key: "my", label: "📋 My Submissions" }].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "submit" && (
        <div className={styles.submitWrap}>
          <Card>
            <h3 className={styles.formTitle}>Submit Attendance Proof</h3>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Select label="Event *" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
                <option value="">Select an event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id} disabled={ev.status !== "active" || !ev.attendance_open}>
                    {ev.name}{ev.status !== "active" ? ` (${ev.status})` : !ev.attendance_open ? " (closed)" : ""}
                  </option>
                ))}
              </Select>
              <label className={styles.fileLabel}>
                Image Proof * (max 5MB)
                <input type="file" accept="image/*" onChange={handleImageChange} className={styles.fileInput} />
              </label>
              {preview && (
                <img src={preview} alt="preview" className={styles.preview} />
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
          <div className={styles.subList}>
            {mySubmissions.map((item) => {
              const s = STATUS_STYLE[item.status] || STATUS_STYLE.pending;
              return (
                <Card key={item.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: "22px" }}>{s.icon}</span>
                        <div>
                          <p className={styles.subEventName}>{item.event_name}</p>
                          <p className={styles.subDate}>
                            Submitted {new Date(item.submitted_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: "99px", fontSize: "12px", fontWeight: 700, background: s.bg, color: s.color, marginBottom: item.review_note ? 8 : 0 }}>
                        {s.msg}
                      </div>
                      {item.review_note && <p className={styles.reviewNote}>Note: <em>{item.review_note}</em></p>}
                      {item.reviewed_at && <p className={styles.reviewedBy}>Reviewed by {item.reviewed_by} · {new Date(item.reviewed_at).toLocaleString()}</p>}
                    </div>
                    {item.image_proof && (
                      <img
                        src={item.image_proof}
                        alt="proof"
                        onClick={() => setLightbox(item.image_proof)}
                        className={styles.thumbnail}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {lightbox && (
        <div className={styles.lightbox} onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="proof" className={styles.lightboxImg} />
          <p className={styles.lightboxHint}>Click anywhere to close</p>
        </div>
      )}
    </div>
  );
}