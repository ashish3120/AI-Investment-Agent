import { API_BASE } from "./config.js";

export function streamResearch(ticker, query, onEvent) {
  const url = `${API_BASE}/api/research?ticker=${encodeURIComponent(ticker)}&query=${encodeURIComponent(query)}`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try { onEvent(JSON.parse(e.data)); } catch (_) {}
  };
  es.onerror = () => es.close();
  return () => es.close();
}
