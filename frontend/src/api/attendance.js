import API from "./axios";

// GET all attendance for a specific event (review page)
export const getAttendanceForReview = async (eventId) => {
  const res = await API.get(`/attendance/review/${eventId}/`);
  return res.data;
};

// APPROVE / REJECT attendance
export const reviewAttendance = async (attendanceId, data) => {
  const res = await API.post(
    `/attendance/${attendanceId}/review/`,
    {
      status: data.status,
      review_note: data.review_note || "",
    }
  );

  return res.data;
};

// SUBMIT attendance (image upload)
export const submitAttendance = async (formData) => {
  const res = await API.post("/attendance/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};