import API from "./axios";

export const getEventSummary = async (eventId) => {
  const res = await API.get(`/analytics/event/${eventId}/summary/`);
  return res.data;
};

export const getEventCharts = async (eventId) => {
  const res = await API.get(`/analytics/event/${eventId}/charts/`);
  return res.data;
};

export const getLiveMetrics = async (eventId = null) => {
  const url = eventId ? `/analytics/live/?event_id=${eventId}` : "/analytics/live/";
  const res = await API.get(url);
  return res.data;
};

export const uploadJsonAnalyze = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await API.post("/analytics/upload-json/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};
