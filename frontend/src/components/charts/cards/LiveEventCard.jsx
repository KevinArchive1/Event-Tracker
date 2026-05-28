export function LiveEventCard({ event }) {
  return (
    <div
      style={{
        padding: "15px",
        border: "1px solid #ddd",
        borderRadius: "10px",
        background: "white",
      }}
    >
      <h3>{event.event_name}</h3>
      <p>Status: <b>{event.status}</b></p>
      <p>Attendance: {event.attendance_population}</p>
      <p>Approved: {event.approved_attendance_population}</p>
      <p>Accidents: {event.accident_count}</p>
      <p>Rating: ⭐ {event.avg_experience_rating}</p>
      <small style={{ color: "gray" }}>
        Updated: {new Date(event.updated_at).toLocaleTimeString()}
      </small>
    </div>
  );
}