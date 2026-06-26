import { useState } from "react";

export default function SearchBar({ onSearch, disabled }) {
  const [ticker, setTicker] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (ticker.trim() && onSearch) onSearch(ticker.toUpperCase());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        id="search-ticker-input"
        type="text"
        value={ticker}
        onChange={e => setTicker(e.target.value.toUpperCase())}
        placeholder="Ticker…"
        maxLength={6}
        className="input-field font-mono tracking-widest flex-1"
        disabled={disabled}
      />
      <button
        id="search-submit"
        type="submit"
        disabled={!ticker.trim() || disabled}
        className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Go
      </button>
    </form>
  );
}
