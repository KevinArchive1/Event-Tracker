import API from "./axios";

export const getBroadcasts = async () => {
  const res = await API.get("/broadcasts/");
  return res.data;
};

export const sendBroadcast = async (data) => {
  const res = await API.post("/broadcasts/", data);
  return res.data;
};
