import { useCallback, useEffect, useState } from "react";
import API from "../api/axios";

export function useLiveMetrics(eventId = null, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // useCallback ensures the interval always calls the latest version of fetchMetrics
  // without needing to restart the interval when eventId changes.
  const fetchMetrics = useCallback(async () => {
    try {
      const url = eventId ? `/analytics/live/?event_id=${eventId}` : "/analytics/live/";
      const res = await API.get(url);
      setData(res.data);
    } catch (err) {
      console.error("Live metrics error:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, interval);
    return () => clearInterval(timer);
  }, [fetchMetrics, interval]);

  return { data, loading };
}