# How to run it — Setup and Run Steps

### Prerequisites
- **Node.js** ≥ 18.x
- **Redis** server running locally (or adjust REDIS_URL)
- **API Keys**: Groq, Finnhub, Google Gemini (Note: I have pre-populated the `.env` file with free-tier keys for your convenience so you can run the app immediately).

### 1. Install Dependencies
Open a terminal in the project root and install dependencies for both the backend and frontend:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Environment Variables & API Keys
Since I want to make grading this assignment as easy as possible, **I have left my `.env` file intact in the `backend` folder.** It contains active, free-tier API keys for Groq, Finnhub, and Gemini. 

*If you prefer to use your own keys, edit `backend/.env` with:*
- `GROQ_API_KEY`
- `FINNHUB_API_KEY`
- `gemini-3.1-flash-live-preview_api`

### 3. Start Redis
Make sure your Redis server is running.
- **Windows (WSL) / Linux:** `sudo service redis-server start`
- **macOS:** `brew services start redis`

### 4. Start the Application
Open **two terminals**:

**Terminal 1 — Backend (runs on port 8000)**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend (runs on port 5173)**
```bash
cd frontend
npm run dev
```

### 5. Access the App
Navigate to **http://localhost:5173** in your browser. Enter a company name like "Apple", "Tesla", or "Realty Income" to begin.
