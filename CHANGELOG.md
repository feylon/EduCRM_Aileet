# Changelog

## [1.0.0] — 2024-09-14

First stable release.

### Backend
- NestJS 10 REST API with 13 domain modules: auth, users, students, teachers, courses, groups, schedules, attendance, payments, leads, dashboard, notifications, reports
- JWT access/refresh tokens with rotation, reuse detection and logout blacklist (Redis)
- RBAC via guards/decorators plus row-level access for teachers and students
- PostgreSQL schema managed by TypeORM migrations; idempotent demo seed
- Redis: token storage, brute-force protection, rate limiting, dashboard/debt/report caching
- Unified response and error format with stable error codes; Swagger at `/api/docs`

### Frontend
- Vue 3 + TypeScript SPA with Pinia, Vue Router, Tailwind CSS and Headless UI
- Role-based dashboards with Chart.js charts
- Full management UI: students, teachers, courses, groups, schedule, attendance, payments & debtors, leads (table + kanban), reports, administrators, notifications, profile
- Uzbek (default), Russian and English translations
- Responsive layout for desktop, tablet and mobile

### Infrastructure
- Docker images for backend (non-root) and frontend (nginx)
- `docker compose up -d` starts the whole stack; dev override with hot reload
