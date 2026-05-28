import API from "./axios";

export const getCommitteeReports = async () => {
  const res = await API.get("/committee-reports/");
  return res.data;
};

export const createCommitteeReport = async (data) => {
  const res = await API.post("/committee-reports/create/", data);
  return res.data;
};

export const respondToReport = async (reportId, data) => {
  const res = await API.post(`/committee-reports/${reportId}/respond/`, data);
  return res.data;
};
