# 🚀 ClubHub — Campus Club & Event Management System

> **Production-grade, full-stack campus platform** built with scalable architecture, strict build phases, and enterprise-level engineering practices.

---

# 🧠 System Overview

ClubHub is a **role-based, scalable campus management platform** designed to centralize:

* Club operations
* Event lifecycle
* Attendance tracking
* Student engagement analytics

It replaces fragmented tools with a **single, structured, high-performance system**.

---

# 🎯 Core Objectives 

* Eliminate **manual attendance fraud**
* Enable **centralized event discovery**
* Provide **real-time analytics dashboards**
* Ensure **secure role-based access**
* Handle **10,000+ dataset rendering efficiently**
* Build a **PWA with offline capability**

---

# 🏗️ System Architecture

```text
Client (React PWA)
        ↓
API Layer (Node.js + Express)
        ↓
PostgreSQL (Primary Database)
        ↓
Redis (Cache + Jobs + Rate Limiting)
```

### Key Design Decisions

* Non-blocking backend (Node.js)
* ACID-compliant DB (PostgreSQL)
* Background jobs via Redis + Bull
* Stateless authentication (JWT)
* Virtualized rendering for large datasets

---

# 🧱 Tech Stack

## Frontend

* React 18 + TypeScript
* Tailwind CSS + shadcn/ui
* Zustand (state)
* React Hook Form + Zod
* Recharts
* TanStack Table + react-window

## Backend

* Node.js + Express
* PostgreSQL + Prisma
* Redis + Bull Queue
* JWT + bcrypt

## Infrastructure

* Vercel (Frontend)
* Railway (Backend + DB + Redis)
* SendGrid (Email)
* Cloudinary (Media)

---

# 👥 Role-Based Access Control (RBAC)

| Role          | Permissions                         |
| ------------- | ----------------------------------- |
| Student       | Register, join clubs, attend events |
| Member        | Extended privileges                 |
| Secretary     | Attendance control (QR/PIN/manual)  |
| Event Manager | Event CRUD                          |
| Super Admin   | Full system control                 |

---

# 🔑 Core Systems 

## 🔐 Authentication System

* Register + email verification
* Login + JWT issuance
* Refresh token rotation
* Forgot/reset password
* Core member onboarding via access codes

---

## 📅 Clubs & Events System

* Club creation + approval flow
* Event creation, update, deletion
* Event registration with:

  * Capacity validation
  * Duplicate prevention
  * Deadline enforcement

---

## 📍 Attendance System

* QR-based attendance (HMAC secured)
* PIN-based attendance (Redis TTL)
* Manual + bulk attendance
* Attendance audit logs
* Points + volunteer hours system

---

## 📊 Analytics System

* Student dashboard stats
* Club analytics
* Admin analytics
* Global system metrics

---

## 🔔 Notifications System

* In-app notifications
* Email confirmations
* Reminder jobs (Bull Queue)

---

## ⚡ Performance System

* Virtual scrolling (10,000+ rows)
* Optimized rendering
* Lazy loading
* Skeleton loaders

---

## 📱 PWA System

* Installable web app
* Offline dashboard support
* Service worker caching

---

# 🧭 Build Phases (STRICT ORDER)

## 🚨 RULE

Backend must be fully completed **before frontend development begins**

---

## 🔹 Phase 1 — MVP (CURRENT)

### 1A — Backend

* Project setup
* Prisma schema
* Authentication system
* JWT + RBAC + middleware

### 1B — Backend

* Clubs system
* Events system
* Event registration

### 1C — Backend

* Attendance (QR + PIN)
* Notifications
* Redis + Bull Queue

### 1D — Backend

* Analytics APIs
* Security hardening
* Deployment setup

### 1E — Frontend

* Auth UI
* Dashboards
* Clubs & Events UI
* Attendance UI
* Analytics UI
* Virtual scrolling
* PWA

---

## 🔹 Phase 2–5 (Planned)

### Phase 2

* Club ranking system
* Advanced filters
* Suggestions system

### Phase 3

* Geo-fence attendance
* AICTE points multipliers
* Certificates + Resume export

### Phase 4

* Real-time chat (Socket.io)
* Recruitment system

### Phase 5

* AI recommendations
* Advanced analytics
* Performance optimization

---

# 📂 Folder Structure (DRY Principle)

## Backend

```text
server/src/
 ├── config/
 ├── middleware/
 ├── services/
 ├── controllers/
 ├── routes/
 ├── utils/
 ├── types/
 ├── jobs/
```

## Frontend

```text
client/src/
 ├── components/
 ├── pages/
 ├── hooks/
 ├── services/
 ├── store/
 ├── utils/
 ├── types/
```

---

# 🔗 API Structure

Base: `/api/v1`

### Auth

* POST /auth/register
* POST /auth/login
* POST /auth/refresh
* POST /auth/logout

### Clubs

* GET /clubs
* POST /clubs
* POST /clubs/:id/join

### Events

* GET /events
* POST /events
* POST /events/:id/register

### Attendance

* POST /events/qr-attendance
* POST /events/:id/pin-attendance

### Analytics

* GET /admin/analytics
* GET /users/me/stats

---

# ⚙️ Setup Instructions

## Backend

```bash
cd server
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Frontend

```bash
cd client
npm install
npm run dev
```

---

# 🔐 Security (Blueprint-Based)

* JWT (short-lived access + refresh rotation)
* HMAC-secured QR codes
* Rate limiting (auth + sensitive routes)
* Zod validation (all inputs)
* IDOR protection middleware
* Helmet.js security headers

---

# 🚀 Deployment Architecture

| Component | Platform           |
| --------- | ------------------ |
| Frontend  | Vercel             |
| Backend   | Railway            |
| Database  | Railway PostgreSQL |
| Cache     | Railway Redis      |

---

# 📊 Performance Targets

* API latency < 200ms (p95)
* 10,000+ rows @ 60fps
* Lighthouse > 80 (MVP)
* 1,000+ concurrent users

---

# 🏆 Key Highlights

* Strict **phase-based development system**
* Fully **RBAC-driven architecture**
* Designed for **real-world campus scale**
* Includes **virtualization + PWA from MVP**
* Built with **production deployment in mind**

---

```
clubhub_fixed
├─ .eslintrc.json
├─ ClubHub_PhaseB.postman_collection.json
├─ cypress
│  └─ e2e
│     └─ phase5.cy.ts
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  ├─ icons.svg
│  │  ├─ logo.png
│  │  └─ o.png
│  ├─ README.md
│  ├─ src
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  ├─ hero.png
│  │  │  ├─ react.svg
│  │  │  └─ vite.svg
│  │  ├─ components
│  │  │  ├─ ai
│  │  │  │  └─ RecommendationCards.tsx
│  │  │  ├─ analytics
│  │  │  │  ├─ ClubAnalyticsDashboard.tsx
│  │  │  │  ├─ LinkedInShareButton.tsx
│  │  │  │  ├─ MemberEngagementTable.tsx
│  │  │  │  └─ PushNotificationOptIn.tsx
│  │  │  ├─ attendance
│  │  │  │  ├─ AttendanceMethodConfig.tsx
│  │  │  │  ├─ GeoAttendance.tsx
│  │  │  │  └─ QRScanner.tsx
│  │  │  ├─ chat
│  │  │  │  └─ ChatWindow.tsx
│  │  │  ├─ clubs
│  │  │  │  ├─ ClubCard.tsx
│  │  │  │  └─ SuggestionBox.tsx
│  │  │  ├─ ErrorBoundary.tsx
│  │  │  ├─ events
│  │  │  │  ├─ AdvancedEventFilters.tsx
│  │  │  │  ├─ CalendarView.tsx
│  │  │  │  ├─ EventCard.tsx
│  │  │  │  ├─ EventTimelineView.tsx
│  │  │  │  └─ FeaturedEventsSection.tsx
│  │  │  ├─ layout
│  │  │  │  ├─ index.tsx
│  │  │  │  ├─ Navbar.tsx
│  │  │  │  └─ Sidebar.tsx
│  │  │  ├─ notifications
│  │  │  │  └─ NotificationBell.tsx
│  │  │  ├─ profile
│  │  │  │  ├─ BadgesShowcase.tsx
│  │  │  │  └─ CertificateList.tsx
│  │  │  ├─ rankings
│  │  │  │  ├─ RankingBadge.tsx
│  │  │  │  └─ RankingBreakdownModal.tsx
│  │  │  ├─ recruitment
│  │  │  │  ├─ InterviewManagementPanel.tsx
│  │  │  │  └─ RecruitmentApplicationForm.tsx
│  │  │  ├─ trends
│  │  │  │  └─ CampusTrends.tsx
│  │  │  ├─ ui
│  │  │  │  ├─ Button.tsx
│  │  │  │  ├─ index.tsx
│  │  │  │  └─ Input.tsx
│  │  │  └─ virtual-table
│  │  │     └─ Virtualtable.tsx
│  │  ├─ hooks
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useChat.ts
│  │  │  ├─ useClubs.ts
│  │  │  ├─ useEvents.ts
│  │  │  ├─ useNotifications.ts
│  │  │  ├─ usePhase2.ts
│  │  │  ├─ usePhase3.ts
│  │  │  ├─ useRecommendations.ts
│  │  │  ├─ useRecruitment.ts
│  │  │  └─ useSocket.ts
│  │  ├─ index.css
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ admin
│  │  │  │  ├─ AdminDashboardPage.tsx
│  │  │  │  ├─ AdminPhase2Page.tsx
│  │  │  │  ├─ AnnouncementComposePage.tsx
│  │  │  │  ├─ AttendanceConfigPage.tsx
│  │  │  │  ├─ AttendanceReportPage.tsx
│  │  │  │  ├─ MemberRosterPage.tsx
│  │  │  │  ├─ RecruitmentDashboardPage.tsx
│  │  │  │  ├─ SuperAdminPage.tsx
│  │  │  │  └─ SuperAdminUsersTab.tsx
│  │  │  ├─ auth
│  │  │  │  ├─ LoginPage.tsx
│  │  │  │  ├─ OtherAuthPages.tsx
│  │  │  │  └─ RegisterPage.tsx
│  │  │  ├─ misc.tsx
│  │  │  ├─ NotificationPreferencesPage.tsx
│  │  │  └─ student
│  │  │     ├─ AnalyticsPage.tsx
│  │  │     ├─ AnnouncementsPage.tsx
│  │  │     ├─ AttendancePage.tsx
│  │  │     ├─ ClubDetailPage.tsx
│  │  │     ├─ ClubDetailPagePhase2.tsx
│  │  │     ├─ ClubRankingsPage.tsx
│  │  │     ├─ ClubsPage.tsx
│  │  │     ├─ CreateEventPage.tsx
│  │  │     ├─ DashboardPage.tsx
│  │  │     ├─ EventDetailPage.tsx
│  │  │     ├─ EventsPage.tsx
│  │  │     ├─ EventsPagePhase2.tsx
│  │  │     ├─ MessagesPage.tsx
│  │  │     ├─ MessagesPagePhase4.tsx
│  │  │     ├─ NotificationPreferencesPage.tsx
│  │  │     ├─ PointsBreakdownPage.tsx
│  │  │     ├─ ProfilePage.tsx
│  │  │     ├─ ProfilePagePhase3.tsx
│  │  │     └─ RecruitmentApplicationPage.tsx
│  │  ├─ services
│  │  │  ├─ api.ts
│  │  │  ├─ authService.ts
│  │  │  ├─ clubService.ts
│  │  │  ├─ eventService.ts
│  │  │  ├─ featuredEventService.ts
│  │  │  ├─ normalizers.ts
│  │  │  ├─ phase3Service.ts
│  │  │  ├─ phase4Service.ts
│  │  │  ├─ rankingService.ts
│  │  │  ├─ suggestionService.ts
│  │  │  └─ userService.ts
│  │  ├─ store
│  │  │  ├─ authStore.ts
│  │  │  ├─ notificationStore.ts
│  │  │  └─ uiStore.ts
│  │  ├─ types
│  │  │  ├─ index.ts
│  │  │  ├─ phase2.ts
│  │  │  ├─ phase3.ts
│  │  │  └─ phase4.ts
│  │  ├─ utils
│  │  │  └─ index.ts
│  │  └─ vite-env.d.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ load-test.js
├─ nodemon.json
├─ package-lock.json
├─ package.json
├─ prisma
│  ├─ phase5_materialized_views.sql
│  ├─ schema-phase4-additions.prisma
│  ├─ schema.prisma
│  └─ seed.ts
├─ README.md
├─ src
│  ├─ app.ts
│  ├─ config
│  │  ├─ database.ts
│  │  ├─ email.ts
│  │  ├─ queues.ts
│  │  ├─ redis.ts
│  │  └─ socket.ts
│  ├─ controllers
│  │  ├─ analyticsController.ts
│  │  ├─ attendanceController.ts
│  │  ├─ authController.ts
│  │  ├─ chatController.ts
│  │  ├─ clubController.ts
│  │  ├─ clubControllers.ts
│  │  ├─ eventController.ts
│  │  ├─ geoAttendanceController.ts
│  │  ├─ notificationController.ts
│  │  ├─ phase5Controller.ts
│  │  ├─ profileController.ts
│  │  ├─ rankingController.ts
│  │  ├─ recruitmentController.ts
│  │  └─ suggestionController.ts
│  ├─ index-phase4-additions.ts
│  ├─ index.ts
│  ├─ jobs
│  │  ├─ certificateWorker.ts
│  │  ├─ emailWorker.ts
│  │  ├─ eventChatWorker.ts
│  │  ├─ notificationWorker.ts
│  │  ├─ phase5Jobs.ts
│  │  ├─ rankingCron.ts
│  │  └─ reminderWorker.ts
│  ├─ middleware
│  │  ├─ asyncHandler.ts
│  │  ├─ auth.ts
│  │  ├─ errorHandler.ts
│  │  ├─ ownership.ts
│  │  ├─ rateLimiter.ts
│  │  ├─ rbac.ts
│  │  └─ validate.ts
│  ├─ routes
│  │  ├─ admin.routes.ts
│  │  ├─ attendance.routes.ts
│  │  ├─ auth.routes.ts
│  │  ├─ club.routes.ts
│  │  ├─ event.routes.ts
│  │  ├─ health.routes.ts
│  │  ├─ index.ts
│  │  ├─ notification.routes.ts
│  │  ├─ phase2Routes.ts
│  │  ├─ phase3Routes.ts
│  │  ├─ phase4Routes.ts
│  │  ├─ phase5Routes.ts
│  │  └─ user.routes.ts
│  ├─ server.ts
│  ├─ services
│  │  ├─ analyticsService.ts
│  │  ├─ attendanceService.ts
│  │  ├─ authService.ts
│  │  ├─ certificateService.ts
│  │  ├─ chatService.ts
│  │  ├─ clubService.ts
│  │  ├─ emailService.ts
│  │  ├─ eventService.ts
│  │  ├─ geoAttendanceService.ts
│  │  ├─ linkedinService.ts
│  │  ├─ notificationService.ts
│  │  ├─ notificationServiceV2.ts
│  │  ├─ profileService.ts
│  │  ├─ rankingService.ts
│  │  ├─ recommendationService.ts
│  │  ├─ recruitmentService.ts
│  │  └─ suggestionService.ts
│  ├─ types
│  │  └─ index.ts
│  ├─ utils
│  │  ├─ AppError.ts
│  │  ├─ bcrypt.ts
│  │  ├─ certificateGenerator.ts
│  │  ├─ dateUtils.ts
│  │  ├─ geoUtils.ts
│  │  ├─ icsGenerator.ts
│  │  ├─ jwt.ts
│  │  ├─ qrGenerator.ts
│  │  ├─ response.ts
│  │  ├─ resumeGenerator.ts
│  │  └─ validators.ts
│  └─ validators
│     ├─ club.validator.ts
│     └─ event.validator.ts
└─ tsconfig.json

```