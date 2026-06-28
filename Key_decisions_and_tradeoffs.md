# Key Decisions & Trade-offs

- **ReAct Agent vs. Simple LLM Chain:** 
  - *Decision:* I chose a Guided ReAct agent instead of a single LLM prompt. This allows the agent to dynamically decide which APIs to call based on the specific company (e.g., fetching REIT metrics vs Tech metrics). 
  - *Trade-off:* Higher latency and higher token usage per search, but it provides much higher accuracy and depth than a single prompt.

- **Direct SEC EDGAR vs. Paid Aggregator APIs:** 
  - *Decision:* I chose to parse raw XBRL from SEC EDGAR for financial metrics instead of a paid aggregator to ensure the agent uses canonical primary sources. 
  - *Trade-off:* Required complex mapping and error handling for missing data points in raw XBRL, but keeps the project completely free to run.

- **WebSocket for Voice vs REST Polling:** 
  - *Decision:* I chose WebSockets for the Gemini Live voice integration to enable real-time bidirectional streaming.
  - *Trade-off:* More complex state management on the frontend and backend compared to simple REST polling, but drastically minimizes audio latency for a conversational feel.

- **In-Memory Redis vs Relational DB:** 
  - *Decision:* I chose Redis for session and audio caching for speed and simplicity. 
  - *Trade-off:* Data is ephemeral, meaning historical research sessions are lost on server restart. This was deemed acceptable for a real-time research agent where current data is most important.

- **What I left out:** 
  - Persistent user accounts, portfolio tracking, and complex charting libraries were omitted. I decided to focus purely on the core AI reasoning, dynamic tool usage, and multimodal capabilities rather than building standard CRUD features.
