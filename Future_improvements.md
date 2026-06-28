# What I Would Improve With More Time (Future Improvements)

If given more time to expand the capabilities of this AI Investment Agent, I would focus on the following key features:

### 1. Support for Indian Markets (NSE/BSE)
Currently, the agent is highly optimized for US equities using SEC EDGAR and Finnhub. I would integrate data sources like NSE (National Stock Exchange) APIs or Screener.in to seamlessly support Indian companies. This would involve adapting the 3-layer ticker resolution system to map Indian company names to their respective `.NS` or `.BO` tickers.

### 2. Live Portfolio Tracking and Alerts
I would build a real-time portfolio tracker where users can save the stocks they've researched. The AI agent would actively monitor live stock prices and news feeds, sending proactive alerts (e.g., "Reliance Industries just released their Q3 earnings and revenue grew by 15%—would you like me to run a full analysis?").

### 3. RAG over SEC 10-K / Annual Reports
Implement a vector database (like Pinecone) to perform Retrieval-Augmented Generation (RAG) over the full text of annual reports. This would allow the agent to read the "Management Discussion and Analysis" section for qualitative insights, rather than just relying on quantitative XBRL data.

### 4. Database Persistence
Add a robust database layer (e.g., PostgreSQL) to persist user accounts, custom scoring weights, and historical voice chat transcripts, upgrading the app from a session-based tool to a permanent financial dashboard.
