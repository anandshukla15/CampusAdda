# Campus Adda

Local setup and run instructions for the Campus Adda project (backend + frontend).

Prerequisites
- Node.js (16+ recommended)
- npm
- MySQL running locally (or a configured DB matching backend/config/db.js)

Backend
1. Open terminal in `backend` folder.
2. Create a `.env` file based on `.env.example` (if present) and set `JWT_SECRET`, DB credentials, and `PORT`.
3. Install dependencies and start:

```powershell
cd backend
npm install
npm run dev
```

The backend will run on port 5000 by default.

AI service

The chatbot is a separate FastAPI/LangGraph service. It retains the existing
`POST /api/ai/chat` frontend contract and accepts an optional `thread_id` for
conversation memory.

```powershell
cd ai-service
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
$env:GOOGLE_API_KEY = "your Gemini API key"
$env:NODE_API_URL = "http://localhost:5000/api/ai"
..\.venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

Set `AI_SERVICE_URL=http://localhost:8000` in `backend/.env`. Event creation,
updates, and deletion synchronise Chroma through `/index-event`; chat requests
never index events. MySQL, accessed through the Node API, remains the source
of truth.

Backend admin login
- The app supports an environment-based admin login via `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`.
- If a login matches those credentials, the backend will issue a token with `role = admin`.

Frontend
1. Open terminal in `frontend` folder.
2. Install dependencies and start:

```powershell
cd frontend
npm install
npm start
```

The frontend dev server runs on port 3000.

Notes
- Login tokens are stored in `localStorage` under `token`.
- Admin users must have `role` = `admin` in the `users` table or use the `.env` admin credentials.
- President users can register as normal users, apply for president through the President dashboard, and wait for admin approval.
- Public event browsing only shows admin-approved events.

If you want, I can:
- Seed an admin account for testing.
- Add a small script to create an admin user.
- Continue polishing UI/theme.
