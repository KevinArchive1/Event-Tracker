import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { createAdminUser } from "../../api/misc";
import { Card, Badge, Button, Input, Alert, Modal } from "../../components/ui/UI";

export function Settings() {
  const { user } = useAuth();
  const isSuperuser = user?.is_superuser;

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ username: "", password: "", email: "", first_name: "", last_name: "" });
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const handleCreateAdmin = async () => {
    setAdminError("");
    setAdminSuccess("");
    if (!adminForm.username || !adminForm.password) {
      setAdminError("Username and password are required.");
      return;
    }
    setAdminLoading(true);
    try {
      await createAdminUser(adminForm);
      setAdminSuccess("Admin user created successfully.");
      setAdminForm({ username: "", password: "", email: "", first_name: "", last_name: "" });
    } catch (err) {
      setAdminError(err.response?.data?.detail || "Failed to create admin.");
    } finally {
      setAdminLoading(false);
    }
  };

  const FIELD_ROWS = [
    ["Username",   user?.username],
    ["Email",      user?.email || "—"],
    ["First Name", user?.first_name || "—"],
    ["Last Name",  user?.last_name || "—"],
    ["Course",     user?.course || "—"],
    ["Year",       user?.year || "—"],
    ["Age",        user?.age ?? "—"],
    ["Sex",        user?.sex || "—"],
  ];

  return (
    <div style={{ maxWidth: 600 }}>
      <h1 style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: 700 }}>Settings</h1>
      <p style={{ margin: "0 0 28px", color: "#9ca3af", fontSize: "13px" }}>Your account information</p>

      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ margin: 0, fontSize: "15px" }}>Profile</h3>
          <Badge label={user?.role} />
        </div>

        {/* Read-only notice */}
        <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#9ca3af", background: "#f9fafb", padding: "8px 12px", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
          ℹ️ Profile information is read-only. Contact an admin to update your details.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FIELD_ROWS.map(([label, value]) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
              <span style={{ fontSize: "13px", color: "#9ca3af", fontWeight: 600, textTransform: "capitalize" }}>{label}</span>
              <span style={{ fontSize: "13px", color: "#111827" }}>{value}</span>
            </div>
          ))}
        </div>
      </Card>

      {isSuperuser && (
        <Card>
          <h3 style={{ margin: "0 0 4px", fontSize: "15px" }}>Create Admin User</h3>
          <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#9ca3af" }}>Only superadmins can create admin accounts.</p>
          <Button onClick={() => setAdminOpen(true)}>+ Create Admin</Button>
        </Card>
      )}

      <Modal open={adminOpen} onClose={() => setAdminOpen(false)} title="Create Admin User">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Alert type="error"   message={adminError} />
          <Alert type="success" message={adminSuccess} />
          <Input label="Username"   value={adminForm.username}   onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}   placeholder="username" />
          <Input label="Password"   value={adminForm.password}   onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}   type="password" placeholder="password" />
          <Input label="Email"      value={adminForm.email}      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}      placeholder="email (optional)" />
          <Input label="First Name" value={adminForm.first_name} onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })} placeholder="first name (optional)" />
          <Input label="Last Name"  value={adminForm.last_name}  onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })}  placeholder="last name (optional)" />
          <Button onClick={handleCreateAdmin} disabled={adminLoading}>
            {adminLoading ? "Creating…" : "Create Admin"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}