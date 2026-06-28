# Example Runs

### 1. Google (GOOGL)
- **The Input:** "Google"
- **The Execution:** The 3-layer ticker resolver quickly mapped "Google" to GOOGL. The ReAct agent identified it as a Technology company, fetched revenue growth, gross margins, and ROIC via SEC EDGAR. 
- **The Result:** Scored it an 'A' with a strong composite score. 
- **Voice Interaction:** The Gemini Live assistant could seamlessly discuss its advertising dominance vs cloud growth based on the reasoning context loaded into its system prompt.

### 2. Realty Income (O)
- **The Input:** "Realty Income"
- **The Execution:** The agent accurately recognized it as a Retail REIT (Real Estate Investment Trust). Because of the sector-aware architecture, it intentionally skipped querying standard P/E ratios and instead fetched FFO (Funds From Operations) and AFFO from Finnhub/EDGAR.
- **The Result:** It provided a detailed breakdown of its dividend sustainability and occupancy rates.

### 3. SpaceX
- **The Input:** "SpaceX"
- **The Execution:** The agent used the LLM resolution fallback layer to identify the company, but immediately recognized it as a private entity.
- **The Result:** It gracefully halted the ReAct loop and returned an immediate UI notification to the user stating that US public market data is unavailable for private companies, saving API credits and preventing infinite loops.
