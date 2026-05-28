import API from "./axios";

// ---------- ACCIDENTS ----------
export const getAccidents = async (eventId = null) => {
  const url = eventId ? `/accidents/?event_id=${eventId}` : "/accidents/";
  const res = await API.get(url);
  return res.data;
};

export const reportAccident = async (data) => {
  const res = await API.post("/accidents/", data);
  return res.data;
};

// ---------- RATINGS ----------
// Uses update_or_create on the backend — safe to call multiple times
export const submitRating = async (data) => {
  const res = await API.post("/ratings/", data);
  return res.data;
};

// ---------- EXPENDITURES ----------
// Backend filters by ?event_id= query param
export const getExpenditures = async (eventId = null) => {
  const url = eventId ? `/expenditures/?event_id=${eventId}` : "/expenditures/";
  const res = await API.get(url);
  return res.data;
};

export const addExpenditure = async (data) => {
  const res = await API.post("/expenditures/", data);
  return res.data;
};

// ---------- USERS ----------
export const getMe = async () => {
  const res = await API.get("/auth/me/");
  return res.data;
};

export const createAdminUser = async (data) => {
  const res = await API.post("/auth/create-admin/", data);
  return res.data;
};

// ---------- COMMITTEE ----------
export const getCommitteeMembers = async (eventId) => {
  const res = await API.get(`/events/${eventId}/committee-members/`);
  return res.data;
};

export const removeMember = async (eventId, membershipId) => {
  const res = await API.delete(`/events/${eventId}/committee-members/${membershipId}/`);
  return res.data;
};

export const joinCommittee = async (eventId, code) => {
  const res = await API.post(`/events/${eventId}/join-committee/`, { code });
  return res.data;
};

// prepareEvent: sets status to preparation AND generates a committee code.
// Returns EventCommitteeCode: { id, event, code, expires_at, is_active, created_at }
export const prepareEvent = async (eventId, data = {}) => {
  const res = await API.post(`/events/${eventId}/prepare/`, data);
  return res.data;
};

export const toggleAttendance = async (eventId, attendance_open) => {
  const res = await API.post(`/events/${eventId}/attendance-toggle/`, { attendance_open });
  return res.data;
};

export const createEvent = async (data) => {
  // Strip empty optional fields so backend doesn't choke on empty strings for datetime fields
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
  const res = await API.post("/events/", payload);
  return res.data;
};