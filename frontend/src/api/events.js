import API from "./axios";

export const getEvents = async () => {
  const res = await API.get("/events/");
  return res.data;
};

export const startEvent = async (eventId) => {
  const res = await API.post(`/events/${eventId}/start/`);
  return res.data;
};

export const endEvent = async (id) => {
  const res = await API.post(`/events/${id}/end/`);
  return res.data;
};

export const pickEvent = async (id) => {
  const res = await API.post(`/events/${id}/pick/`);
  return res.data;
};