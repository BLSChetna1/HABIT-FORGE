# HabitForge — Full-Stack Habit Tracker

HabitForge is a full-stack gamified habit tracking web application built with a React/Vite frontend, Node.js + Express REST API backend, and PostgreSQL relational database.

---

## ⚡ Features

- **Authentication & Security:** User registration, login, bcrypt password hashing, and JWT authorization with automatic session expiration handling.
- **Habit Management:** Create, read, edit (custom modal with icon picker and categories), and delete user-specific habits.
- **Gamification & XP System:** Real-time level progression, level XP bar, and authoritative server-side +10 XP awards.
- **Streak Tracking & Protection:** Server-validated streaks with atomic database transactions and same-day duplicate completion prevention.
- **Badge Gallery:** Unlockable achievements including *Rising Star*, *XP Master*, *Habit Champion*, and *Consistency King*.
- **7-Day Analytics:** Weekly completion history chart powered by Chart.js and database completion logs.
- **Safe Anonymous Migration:** Detects browser `localStorage` habits on sign-in and offers 1-click migration into the database.

---

## 🏗️ Project Architecture

```
HABITFORGE/
│
├── frontend/                     # React + Vite Client
│   ├── src/
│   │   ├── components/           # UI Components & Modals
│   │   │   ├── AnalyticsSection.jsx
│   │   │   ├── AuthScreen.jsx
│   │   │   ├── BadgeGallery.jsx
│   │   │   ├── DailyProgressCard.jsx
│   │   │   ├── HabitCard.jsx
│   │   │   ├── HabitEditModal.jsx
│   │   │   ├── HabitFilters.jsx
│   │   │   ├── HabitForm.jsx
│   │   │   ├── HabitList.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── UserBar.jsx
│   │   │   └── XPLevelCard.jsx
│   │   ├── services/
│   │   │   └── api.js            # Centralized API service
│   │   ├── utils/                # Date and habit helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── .env.example
│
├── backend/                      # Express REST API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js       # PostgreSQL Pool & embedded adapter
│   │   │   └── schema.sql        # PostgreSQL Schema & Indexes
│   │   ├── controllers/          # Request handlers
│   │   ├── middleware/           # Auth (JWT), Validation, Error handling
│   │   ├── routes/               # API endpoint definitions
│   │   ├── services/             # Business logic & atomic transactions
│   │   ├── utils/                # JWT & Date utilities
│   │   ├── app.js                # Express app configuration & CORS
│   │   ├── server.js             # Server startup & DB initialization
│   │   └── test-api.js           # Full API test suite
│   ├── package.json
│   └── .env.example
│
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

Backend will run on **http://localhost:5000**.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on **http://localhost:5173**.

---

## 🗄️ PostgreSQL Database Configuration

### Environment Variables (`backend/.env`)

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/habitforge
JWT_SECRET=your_jwt_secret_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Database Schema (`backend/src/config/schema.sql`)

The database consists of 3 relational tables:
1. `users`: Stores user credentials (`password_hash`), safe profile info, and `total_xp`.
2. `habits`: Stores habits linked via foreign key to `users(id)`.
3. `habit_completions`: Stores completion logs with a composite unique constraint `UNIQUE (habit_id, completion_date)` preventing duplicate same-day completions.

---

## 📡 API Endpoints

### Health Check
- `GET /api/health` — API service status

### Authentication
- `POST /api/auth/register` — Register new user (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in user (`email`, `password`)
- `GET /api/auth/me` — Get current user profile (requires Bearer token)

### Habits
- `GET /api/habits` — List all habits for authenticated user
- `POST /api/habits` — Create a new habit (`name`, `icon`, `category`)
- `GET /api/habits/:id` — Get single habit details and completion history
- `PUT /api/habits/:id` — Update habit (`name`, `icon`, `category`)
- `DELETE /api/habits/:id` — Delete habit and associated completions
- `POST /api/habits/:id/complete` — Mark habit as completed for today (awards +10 XP, updates streak)
- `GET /api/habits/:id/completions` — List completion history for habit

### Analytics
- `GET /api/analytics/weekly` — Get 7-day completion counts for authenticated user

### User Profile
- `GET /api/users/me` — Safe user profile data

---

## 🧪 Testing

### Backend Test Suite
```bash
cd backend
node src/test-api.js
```

### Linting & Building
```bash
# Frontend
cd frontend
npm run lint
npm run build

# Backend
cd backend
npm run lint
```
