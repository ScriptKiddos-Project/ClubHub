# ClubHub Frontend

A production-ready React + TypeScript frontend for the ClubHub campus management platform.

## 🚀 Tech Stack
- **React 19** + **Vite** – fast dev + builds
- **TypeScript** – full type safety
- **Tailwind CSS v4** – utility-first styling
- **Axios** – API calls with JWT refresh interceptor
- **React Router v6** – protected routing
- **Zustand** – lightweight global state
- **React Hook Form + Zod** – type-safe form validation
- **Recharts** – analytics charts
- **React Hot Toast** – toast notifications
- **Lucide React** – icons

## 📁 Folder Structure
```
src/
├── types/         → All TypeScript interfaces
├── services/      → Axios API layer (auth, clubs, events, users)
├── store/         → Zustand stores (auth, ui, notifications)
├── hooks/         → Custom hooks (useAuth, useEvents, useClubs, useNotifications)
├── utils/         → Formatters, cn(), color helpers
├── components/
│   ├── ui/        → Button, Input, Badge, Avatar, Modal, Card, Skeleton
│   ├── layout/    → Sidebar, Navbar, AppLayout, AuthLayout, ProtectedRoute
│   ├── events/    → EventCard
│   └── clubs/     → ClubCard
└── pages/
    ├── auth/      → Login, Register, ForgotPassword, Reset, Verify, CoreJoin
    ├── student/   → Dashboard, Events, Clubs, Attendance, Analytics, Profile, Messages, CreateEvent
    ├── admin/     → AdminDashboard
    └── misc.tsx   → Settings, Management, NotFound
```

## ⚙️ Setup & Run

```bash
# 1. Install dependencies
npm install

# 2. Set your API URL
cp .env.example .env
# Edit VITE_API_URL=http://localhost:3000/api/v1

# 3. Start dev server
npm run dev

# 4. Production build
npm run build
```

## 🔑 Auth Flow
- Login/Register store JWT in memory via Zustand (not localStorage – more secure)
- Token automatically attached to every request via Axios interceptor
- Silent refresh on 401 using httpOnly cookie (requires backend /auth/refresh)
- Role-based protected routes: `student | member | secretary | event_manager | super_admin`

## 🌐 API Base URL
Set `VITE_API_URL` in `.env`. All endpoints from the ClubHub Blueprint v4 are wired up.

## 📸 Pages Implemented (matching UI designs)
| Page | Route | Design Match |
|------|-------|-------------|
| Login | /login | ✅ |
| Register | /register | ✅ |
| Student Dashboard | /dashboard | ✅ |
| Event Discovery | /events | ✅ Filters + Today section |
| Create Event | /events/create | ✅ AI Strategy Hub sidebar |
| Clubs | /clubs | ✅ |
| Attendance | /attendance | ✅ BLE + QR + PIN |
| Analytics | /analytics | ✅ Charts |
| Profile | /profile | ✅ Experience + Badges + Skill Matrix |
| Messages | /messages | ✅ Activity Glass |
| Admin Dashboard | /admin/dashboard | ✅ |
| Settings | /settings | ✅ |
