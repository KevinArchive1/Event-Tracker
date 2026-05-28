import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";

import { Login }    from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";

import { Dashboard }      from "./pages/dashboard/Dashboard";
import { AdminDashboard } from "./pages/dashboard/AdminDashboard";

import { Events }       from "./pages/events/Events";
import { EventDetails } from "./pages/events/EventDetails";

import { Attendance }       from "./pages/attendance/Attendance";
import { AttendanceReview } from "./pages/attendance/AttendanceReview";

import { Analytics } from "./pages/analytics/Analytics";
import { Reports }   from "./pages/reports/Reports";
import { Broadcasts } from "./pages/broadcasts/Broadcasts";
import { Accidents }  from "./pages/accidents/Accidents";
import { CommitteeManagement } from "./pages/committee/CommitteeManagement";
import { Expenditures } from "./pages/expenditures/Expenditures";
import { Settings }     from "./pages/settings/Settings";

function Protected({ children, role }) {
  return (
    <ProtectedRoute requiredRole={role}>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: 12 }}>
      <p style={{ fontSize: "64px", margin: 0 }}>🔍</p>
      <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#111827" }}>Page not found</h1>
      <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ marginTop: 8, color: "#6366f1", fontSize: "14px", fontWeight: 600 }}>← Go to Dashboard</a>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* All authenticated */}
          <Route path="/"             element={<Protected><Dashboard /></Protected>} />
          <Route path="/events"       element={<Protected><Events /></Protected>} />
          <Route path="/events/:id"   element={<Protected><EventDetails /></Protected>} />
          <Route path="/attendance"   element={<Protected><Attendance /></Protected>} />
          <Route path="/reports"      element={<Protected><Reports /></Protected>} />
          <Route path="/broadcasts"   element={<Protected><Broadcasts /></Protected>} />
          <Route path="/accidents"    element={<Protected><Accidents /></Protected>} />
          <Route path="/expenditures" element={<Protected><Expenditures /></Protected>} />
          <Route path="/settings"     element={<Protected><Settings /></Protected>} />

          {/* Admin + staff */}
          <Route path="/attendance-review"  element={<Protected><AttendanceReview /></Protected>} />
          <Route path="/committee/:eventId" element={<Protected><CommitteeManagement /></Protected>} />

          {/* Admin only */}
          <Route path="/analytics" element={<Protected role="admin"><Analytics /></Protected>} />
          <Route path="/admin"     element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}