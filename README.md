# 🛡️ LastMinute AI — Procrastination Shield

LastMinute AI is a state-of-the-art, high-fidelity productivity workspace designed to conquer procrastination and help users beat inertia. Featuring custom glassmorphic themes, an interactive tough-love AI coach, real-time Firebase cloud synchronization, context-aware notification nudges, and speech-to-task parsing, it acts as a digital shield against distraction.

Built as a decoupled fullstack monorepo, it is powered by **Gemini 3.5 Flash** for intelligence and **Firebase** for serverless, real-time data persistence.

---

## 🏗️ Monorepo Architecture

The project is structured as an optimized monorepo using **npm workspaces** for dependency orchestration:

```
vide2hack-lastminute-ai/
├── backend/                  # Node.js / Express API Server
│   ├── src/
│   │   └── server.ts         # Gemini endpoints, CORS setup & static host
│   ├── .env.example          # Sample environment variables
│   ├── tsconfig.json         # TypeScript compiler configurations
│   └── package.json          # Node dependencies (express, cors, @google/genai)
├── frontend/                 # Vite / React Single Page Application
│   ├── src/
│   │   ├── components/       # UI Panels (FocusTimer, Dashboard, Coach, Habits...)
│   │   ├── firebase.ts       # Firebase initialization & client instances
│   │   ├── vite-env.d.ts     # Vite environment types declarations
│   │   ├── App.tsx           # Global state orchestrator & Firebase sync
│   │   ├── types.ts          # Core TS schemas (Task, Habit, Goal, ChatMessage)
│   │   └── sampleData.ts     # Onboarding structural configurations
│   ├── index.html            # SPA mount point
│   ├── vite.config.ts        # Path aliases and dev port proxying
│   ├── tsconfig.json         # React compiler settings
│   ├── .env.example          # Client environment variables
│   └── package.json          # Frontend dependencies (react, motion, lucide)
├── .gitignore                # Workspace gitignore configuration
├── README.md                 # Project documentation (This file)
└── package.json              # Monorepo Orchestration script
```

---

## ⚡ Technical Stack

*   **Frontend**: React 19, Vite, Tailwind CSS v4, Framer Motion (micro-animations), Lucide Icons
*   **Backend**: Node.js, Express, tsx (typescript execution watch), dotenv
*   **Database & Auth**: Cloud Firestore (Real-time synchronization), Firebase Auth (Anonymous Sign-In)
*   **AI Engine**: Official Google GenAI SDK (`@google/genai`) powered by `gemini-3.5-flash`

---

## 🚀 Setup & Installation

### Prerequisites
*   Node.js (v18.0.0 or higher)
*   npm (v7.0.0 or higher for workspaces support)

### 1. Clone & Install Dependencies
From the root project directory, run:
```bash
npm install
```
*(This automatically installs packages for both the backend and frontend workspaces).*

### 2. Configure environment files

#### A. Backend Config (`backend/.env`)
Create a file at `backend/.env` with the following variables:
```env
PORT=3000
NODE_ENV=development
GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
```

#### B. Frontend Config (`frontend/.env`)
Create a file at `frontend/.env` with your Firebase web configuration:
```env
VITE_FIREBASE_API_KEY="YOUR_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.firebasestorage.app"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_APP_ID"
```

### 3. Run the App
Launch both frontend and backend development environments concurrently:
```bash
npm run dev
```
*   **Frontend client**: Running at `http://localhost:5173`
*   **Backend API server**: Running at `http://localhost:3000`
*   *Vite is configured to automatically proxy `/api/*` calls directly to the Express server on port 3000, preventing CORS errors.*

### 4. Build for Production
To package the frontend assets and compile TypeScript:
```bash
npm run build
```
Run the production bundle:
```bash
npm run start
```
*(In production, the backend server automatically serves the compiled static files from `frontend/dist` on port 3000).*

---

## 🔥 Cloud Integration & Database Sync

Rather than using easily cleared local storage, LastMinute AI synchronizes all user workspaces in real time with Cloud Firestore:

1.  **Anonymous Authentication**: Upon loading, the app runs `signInAnonymously(auth)`. This establishes a unique session ID for every browser instance automatically—keeping data isolated and secure without requiring a login form.
2.  **Live Snapshots**: In `App.tsx`, active `onSnapshot` listeners query `tasks`, `habits`, `goals`, `focusSessions`, `chatHistory`, and `prefs` collections filtered by the authenticated user ID (`userId == uid`).
3.  **Real-Time Propagation**: Any UI interaction (adding a task, checking a habit, sending a coach message) makes an asynchronous write (`addDoc`, `updateDoc`, `deleteDoc`) directly to the Firestore collection. The changes propagate back instantly, keeping the UI aligned.

### Firestore Rules Setup
Ensure your Cloud Firestore security rules are configured to permit read/write operations (e.g. for development/hackathon testing):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

## 🤖 Gemini API Endpoints (The Intelligence Layer)

Our backend exposes 6 intelligent endpoints, leveraging structural prompts and strict JSON schema generation to drive custom app experiences:

### 1. Auto-Prioritization (`/api/gemini/prioritize`)
Sorts outstanding tasks based on urgency, remaining duration, category, and energy levels:
*   **Input**: JSON array of tasks, user's current energy state, and timestamp.
*   **Output**: Structured JSON containing prioritized ranks, urgency scores (0-100), and short descriptive rationales.

### 2. Smart Time-Blocking (`/api/gemini/schedule`)
Builds a daily calendar schedule allocating tasks to time slots:
*   **Input**: Active tasks list, workday boundaries (start/end hours), and break preferences.
*   **Output**: Sequential schedule with chronologically ordered time-blocks, designating work and break durations.

### 3. Voice Scribe Parsing (`/api/gemini/voice-parse`)
Processes raw transcripts from the Web Speech API into structured task entries:
*   **Input**: Voice transcription text and current ISO date.
*   **Output**: Hydrated task properties: `title`, `description`, resolved absolute `deadline_iso`, `priority` rating, `category`, and `estimated_minutes`.

### 4. Contextual Motivator Reminders (`/api/gemini/reminder`)
Fires customized motivating push notifications as deadlines approach:
*   **Input**: Single task context, time remaining, completion rate, and time of day.
*   **Output**: 1-2 sentence tough-love nudge tailored to the user's specific performance.

### 5. Habit Streaks Coach (`/api/gemini/habit-nudge`)
Provides tailored suggestions to maintain daily streaks:
*   **Input**: Habit name and current streak count.
*   **Output**: Short, high-impact motivational reminder.

### 6. Weekly Reviews Compiler (`/api/gemini/weekly-review`)
Synthesizes weekly achievements, grading performance and mapping out improvements:
*   **Input**: Total completed tasks, overdue counts, average completion speeds, and active streaks.
*   **Output**: Productivity Grade (0-100), descriptive grading summary, and 3 specific actionable roadmap steps.

---

## 🎨 Premium Themes & Aesthetics

LastMinute AI is designed to look stunning, utilizing custom glassmorphic panels, animated SVG progress indicators, and dynamic variables. Six themes are available via Settings:

*   🌌 **Cosmic Midnight** (Default): Cyberpunk neon purple and mint green accents on a dark space backdrop.
*   🪵 **Amber Wood**: Warm gold, forest emerald, and timber red accents for a calming workspace.
*   🌲 **Nordic Forest**: Muted sage, pale teal, and rose red accents on a deep spruce background.
*   📟 **Retro Term**: High-contrast amber text on obsidian black, mirroring an old-school console.
*   🔥 **Solar Eclipse**: Radiant crimson and crimson-teal on a solar eclipse dark grey.
*   🧵 **Stitch Bespoke**: Warm orange, gold-tan, and clay red, giving a tactile linen aesthetic.
*   ✨ **Aurora Glass** (Light Mode): Sunset orange and emerald green glows against a frosted white light backdrop.
