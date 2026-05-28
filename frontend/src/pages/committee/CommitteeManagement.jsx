import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { getCommitteeMembers, removeMember, prepareEvent } from "../../api/misc";
import { Card, Badge, Button, Modal, Alert, Spinner, EmptyState, Input } from "../../components/ui/UI";

export function CommitteeManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removeLoading, setRemoveLoading] = useState(null);

  // Confirm remove modal
  const [confirmRemove, setConfirmRemove] = useState(null); // membership object

  // Generate code modal
  const [codeOpen, setCodeOpen] = useState(false);
  const [expiryHours, setExpiryHours] = useState("72");
  const [generatedCode, setGeneratedCode] = useState(null);
  const [codeLoading, setCodeLoading] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Warn if event is active — generating code also sets status to preparation
  const eventIsActive = event?.status === "active";

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [eventsRes, membersRes] = await Promise.all([
        API.get("/events/"),
        getCommitteeMembers(eventId),
      ]);
      const found = eventsRes.data.find((e) => e.id === parseInt(eventId));
      setEvent(found || null);
      setMembers(membersRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [eventId]);

  const handleRemove = async (membership) => {
    setRemoveLoading(membership.id);
    try {
      await removeMember(eventId, membership.id);
      setMembers((prev) => prev.filter((m) => m.id !== membership.id));
      setConfirmRemove(null);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to remove member.");
    } finally {
      setRemoveLoading(null);
    }
  };

  const handleGenerateCode = async () => {
    setCodeError("");
    setCodeLoading(true);
    setGeneratedCode(null);
    try {
      // NOTE: prepareEvent also sets event status → preparation.
      // If the event is active, warn the admin before calling.
      const res = await prepareEvent(eventId, { expiry_hours: parseInt(expiryHours) || 72 });
      setGeneratedCode(res);
      // Refresh event data since status may have changed
      fetchAll();
    } catch (err) {
      setCodeError(err.response?.data?.detail || "Failed to generate code.");
    } finally {
      setCodeLoading(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code).catch(() => {});
  };

  if (loading) return <Spinner />;

  return (
    <div style={{ maxWidth: 720 }}>
      {/* Back */}
      <button
        onClick={() => navigate(event ? `/events/${event.id}` : "/events")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6b7280", fontSize: "13px", marginBottom: 16, padding: 0 }}
      >
        ← Back to Event
      </button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Committee Management</h1>
          {event && (
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#9ca3af" }}>
              {event.name} · <Badge label={event.status} />
            </p>
          )}
        </div>
        <Button onClick={() => { setCodeOpen(true); setGeneratedCode(null); setCodeError(""); }}>
          🔑 Generate Code
        </Button>
      </div>

      {/* Active event warning */}
      {eventIsActive && (
        <div style={{
          marginBottom: 16,
          padding: "10px 14px",
          borderRadius: "8px",
          background: "#fef9c3",
          border: "1px solid #fde68a",
          fontSize: "13px",
          color: "#92400e",
        }}>
          ⚠️ <strong>This event is currently active.</strong> Generating a new committee code will reset its status back to <strong>preparation</strong>. Only do this if you need to add more committee members before re-starting.
        </div>
      )}

      {/* Members */}
      <Card>
        <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 700 }}>
          Active Members ({members.length})
        </h3>

        {members.length === 0 && <EmptyState message="No committee members yet. Share a code to add members." />}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map((m) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#f8fafc",
                border: "1px solid #f1f5f9",
              }}
            >
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>
                  {m.user?.first_name && m.user?.last_name
                    ? `${m.user.first_name} ${m.user.last_name}`
                    : m.user?.username}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>
                  @{m.user?.username} · {m.user?.course || "No course"} · Joined {new Date(m.joined_at).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="danger"
                disabled={removeLoading === m.id}
                onClick={() => setConfirmRemove(m)}
                style={{ padding: "5px 12px", fontSize: "12px" }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Confirm remove modal */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove Committee Member?"
      >
        <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#4b5563" }}>
          Remove <strong>@{confirmRemove?.user?.username}</strong> from the committee?
          They will lose committee access for this event.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={() => setConfirmRemove(null)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={() => handleRemove(confirmRemove)}
            disabled={removeLoading === confirmRemove?.id}
          >
            {removeLoading === confirmRemove?.id ? "Removing…" : "Yes, remove"}
          </Button>
        </div>
      </Modal>

      {/* Generate Code Modal */}
      <Modal open={codeOpen} onClose={() => setCodeOpen(false)} title="Generate Committee Code">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>
            Share this code with students to let them join the committee.
          </p>

          {eventIsActive && (
            <Alert
              type="info"
              message="⚠️ Warning: generating a code will set this event's status back to preparation."
            />
          )}

          <Alert type="error" message={codeError} />

          <Input
            label="Expires in (hours)"
            type="number"
            min="1"
            max="720"
            value={expiryHours}
            onChange={(e) => setExpiryHours(e.target.value)}
          />

          <Button onClick={handleGenerateCode} disabled={codeLoading}>
            {codeLoading ? "Generating…" : "Generate Code"}
          </Button>

          {generatedCode && (
            <div style={{
              padding: "16px",
              borderRadius: "10px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              textAlign: "center",
            }}>
              <p style={{ margin: "0 0 6px", fontSize: "12px", color: "#6b7280" }}>Committee Code</p>
              <p style={{ margin: "0 0 10px", fontSize: "30px", fontWeight: 800, letterSpacing: "0.2em", color: "#15803d" }}>
                {generatedCode.code}
              </p>
              <p style={{ margin: "0 0 12px", fontSize: "12px", color: "#9ca3af" }}>
                Expires: {generatedCode.expires_at
                  ? new Date(generatedCode.expires_at).toLocaleString()
                  : "Never"}
              </p>
              <Button variant="ghost" onClick={() => copyCode(generatedCode.code)}>
                📋 Copy Code
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}