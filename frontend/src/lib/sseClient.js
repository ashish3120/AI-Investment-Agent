export function streamResearch(ticker, query, onEvent) {
  const url = `/api/research?ticker=${encodeURIComponent(ticker)}&query=${encodeURIComponent(query)}`;
  const es = new EventSource(url);
  es.onmessage = (e) => {
    try { onEvent(JSON.parse(e.data)); } catch (_) {}
  };
  es.onerror = () => es.close();
  return () => es.close();
}
