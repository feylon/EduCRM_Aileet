# EduCRM — O‘quv markazi CRM tizimi

O‘quv markazlarini boshqarish uchun to‘liq ishlaydigan CRM: o‘quvchilar, o‘qituvchilar, kurslar, guruhlar, dars jadvali, davomat, to‘lovlar va qarzdorlik, lidlar (savdo voronkasi), hisobotlar va real vaqt statistikasi bilan dashboard.

> **Holat:** ✅ v1.0.0 — loyiha yakunlangan. Backend, frontend, Docker, migration, seed, Swagger, RBAC, i18n va testlar tayyor (qarang: [CHANGELOG.md](CHANGELOG.md)).

Interfeys **3 tilda** ishlaydi (O‘zbek — standart, Русский, English), desktop, planshet va telefonga moslashgan.

---

## Mundarija

1. [Loyiha haqida](#1-loyiha-haqida)
2. [Imkoniyatlar](#2-imkoniyatlar)
3. [Texnologiyalar](#3-texnologiyalar)
4. [Loyiha tuzilmasi](#4-loyiha-tuzilmasi)
5. [Talablar](#5-talablar)
6. [Environment o‘zgaruvchilari](#6-environment-ozgaruvchilari)
7. [O‘rnatish](#7-ornatish)
8. [Docker orqali ishga tushirish](#8-docker-orqali-ishga-tushirish)
9. [Local development](#9-local-development)
10. [Database migration](#10-database-migration)
11. [Seed (demo ma’lumotlar)](#11-seed-demo-malumotlar)
12. [API haqida](#12-api-haqida)
13. [Foydalanuvchi rollari](#13-foydalanuvchi-rollari)
14. [Demo hisoblar](#14-demo-hisoblar)
15. [Frontend](#15-frontend)
16. [Backend](#16-backend)
17. [Redis](#17-redis)
18. [Git workflow](#18-git-workflow)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Loyiha haqida

EduCRM — monolit, lekin modullarga aniq ajratilgan tizim:

```
Brauzer ──► nginx (frontend, :8080) ──/api──► NestJS API (:3000) ──► PostgreSQL
                                                     │
                                                     └──────────────► Redis
```

- **Frontend** — Vue 3 SPA, nginx orqali beriladi; `/api` so‘rovlari backend konteyneriga proksi qilinadi.
- **Backend** — NestJS REST API. Har bir biznes-soha alohida modul (`module/controller/service/entity/dto`). Modullar o‘zaro **domain event**lar (`@nestjs/event-emitter`) orqali bog‘lanadi — keyinchalik ularni message broker bilan alohida microservice’larga ajratish oson.
- **PostgreSQL** — asosiy ma’lumotlar bazasi, sxema faqat **migration** orqali o‘zgaradi.
- **Redis** — refresh tokenlar, token blacklist, login urinishlari, rate limiting, dashboard/hisobot/qarzdorlik keshi.

## 2. Imkoniyatlar

| Modul | Nima qila oladi |
|---|---|
| **Autentifikatsiya** | Login, logout, access + refresh JWT, refresh token rotatsiyasi va qayta ishlatilganini aniqlash, brute-force himoya (5 xato → 15 daqiqa blok) |
| **RBAC** | Super admin, Admin, O‘qituvchi, O‘quvchi — Guard + Decorator’lar; o‘qituvchi va o‘quvchi faqat **o‘z** guruhlari/ma’lumotlarini ko‘radi (row-level) |
| **O‘quvchilar** | CRUD, qidiruv, filtr (holat, guruh), profil sahifasi (guruhlar, davomat, to‘lovlar, balans) |
| **O‘qituvchilar** | CRUD, malakali kurslar (ManyToMany), hisobni faollashtirish/bloklash |
| **Kurslar** | Narx, daraja, davomiylik, rang; guruhi bor kursni o‘chirib bo‘lmaydi |
| **Guruhlar** | O‘qituvchi, xona, sana, sig‘im; o‘quvchi qo‘shish/chiqarish (sig‘im nazorati) |
| **Dars jadvali** | Haftalik jadval; xona / o‘qituvchi / guruh bo‘yicha **to‘qnashuvni aniqlash** |
| **Davomat** | Guruh+sana bo‘yicha jurnal, “Hammasi keldi”, mavzu va uyga vazifa; o‘quvchiga kelmaganlik haqida bildirishnoma |
| **To‘lovlar** | Qabul qilish, qaytarish, filtrlar, umumiy summalar; **qarzdorlik** = a’zo bo‘lgan oylar × kurs narxi − to‘lovlar |
| **Lidlar** | Savdo voronkasi (jadval va Kanban), manba, mas’ul, keyingi aloqa vaqti, **o‘quvchiga aylantirish** |
| **Dashboard** | KPI kartalar va grafiklar (rolga qarab 3 xil dashboard), Redis kesh |
| **Hisobotlar** | Moliya, davomat, o‘qituvchilar yuklamasi, o‘quvchilar; to‘lovlarni **CSV** eksport |
| **Bildirishnomalar** | Tizim xabarlari (to‘lov, davomat, lid) va admin e’lonlari; o‘qilmaganlar soni Redis’da |
| **Administratorlar** | Super admin barcha foydalanuvchilarni boshqaradi |
| **Swagger** | `/api/docs` — barcha endpointlarni ko‘rish va sinash |

## 3. Texnologiyalar

Barcha paketlar 2023–2024 yillardagi barqaror (stable) versiyalarda, `package-lock.json` bilan qotirilgan.

**Backend:** NestJS 10, TypeScript 5.4, TypeORM 0.3.20, PostgreSQL 16, ioredis 5, Passport JWT, bcrypt, class-validator, Helmet, @nestjs/throttler, @nestjs/swagger 7, @nestjs/event-emitter.

**Frontend:** Vue 3.4 (Composition API, `<script setup>`), TypeScript, Vite 5, Vue Router 4, Pinia 2, Axios, vue-i18n 9, Tailwind CSS 3, Headless UI, Heroicons, Chart.js 4 + vue-chartjs.

**Infratuzilma:** Docker, Docker Compose, nginx 1.25, Node.js 20 (alpine).

## 4. Loyiha tuzilmasi

```
eduCRM/
├── docker-compose.yml          # production-ga yaqin stack (postgres, redis, backend, frontend)
├── docker-compose.dev.yml      # development override (hot reload)
├── .env.example                # docker compose uchun barcha o‘zgaruvchilar
├── backend/
│   ├── Dockerfile, docker-entrypoint.sh
│   ├── .env.example            # docker’siz local ishga tushirish uchun
│   └── src/
│       ├── main.ts             # bootstrap: helmet, CORS, validation, swagger
│       ├── app.module.ts
│       ├── config/             # configuration.ts, swagger.ts
│       ├── common/             # guards, decorators, filters, interceptors, dto, utils, events
│       ├── database/           # typeorm.config, data-source (CLI), migrations/, seeds/
│       ├── redis/              # RedisModule, RedisService, throttler storage
│       └── modules/
│           ├── auth/  users/  students/  teachers/  courses/  groups/
│           ├── schedules/  attendance/  payments/  leads/
│           └── dashboard/  notifications/  reports/
└── frontend/
    ├── Dockerfile, nginx.conf
    └── src/
        ├── pages/              # sahifalar (route komponentlari)
        ├── components/         # ui/ (dizayn tizimi), layout/, charts/, va domen komponentlari
        ├── layouts/            # AuthLayout, DashboardLayout
        ├── composables/        # useTable, useForm, useAsync, useConfirm, useToast ...
        ├── stores/             # Pinia: auth, ui, notifications, lookups
        ├── services/           # Axios + har bir resurs uchun servis
        ├── i18n/               # uz.ts, ru.ts, en.ts
        ├── router/             # route’lar va guard’lar
        ├── config/             # sidebar navigatsiyasi
        ├── types/              # API va model tiplari
        └── utils/              # formatlash, xatolar, statuslar
```

## 5. Talablar

**Docker orqali (tavsiya etiladi):**
- Docker 24+ va Docker Compose v2 (`docker compose version`)
- Bo‘sh portlar: `8080` (frontend) va `3000` (API). Boshqa port kerak bo‘lsa — `.env` dagi `FRONTEND_PORT`, `BACKEND_PORT`.

**Local development (Docker’siz):**
- Node.js 20 LTS (18+ ham ishlaydi), npm 10
- PostgreSQL 14+ va Redis 6+

## 6. Environment o‘zgaruvchilari

Root’dagi `.env.example` — docker compose uchun, `backend/.env.example` va `frontend/.env.example` — local development uchun. Haqiqiy `.env` fayllar **Git’ga qo‘shilmaydi** (`.gitignore`).

| O‘zgaruvchi | Standart | Tavsif |
|---|---|---|
| `FRONTEND_PORT` / `BACKEND_PORT` | 8080 / 3000 | Hostdagi portlar |
| `POSTGRES_HOST_PORT` / `REDIS_HOST_PORT` | 5432 / 6379 | Faqat dev compose: DB portlarini hostga ochish |
| `DATABASE_HOST` | postgres | Docker ichida servis nomi (localhost emas!) |
| `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER` | 5432, educrm, educrm | |
| `DATABASE_PASSWORD` | — | **Majburiy** |
| `DATABASE_RUN_MIGRATIONS` | true | Ilova start bo‘lganda migratsiyalarni qo‘llash |
| `REDIS_HOST`, `REDIS_PORT` | redis, 6379 | |
| `REDIS_PASSWORD` | — | Bo‘sh bo‘lsa parolsiz |
| `REDIS_KEY_PREFIX` | educrm: | Barcha kalitlar prefiksi |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | — | **Majburiy**, uzun tasodifiy satr (`openssl rand -hex 32`) |
| `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | 15m, 7d | Tokenlar muddati |
| `CORS_ORIGINS` | http://localhost:8080,... | Ruxsat etilgan originlar (vergul bilan) |
| `SWAGGER_ENABLED` | true | `/api/docs` |
| `RUN_SEED` | true | Start’da demo ma’lumot yaratish (idempotent) |
| `API_URL` | /api | Frontend API manzili (build vaqtida) |
| `SHOW_DEMO_ACCOUNTS` | true | Login sahifasida demo hisob tugmalari |
| `AUTH_MAX_LOGIN_ATTEMPTS`, `AUTH_LOCKOUT_SECONDS` | 5, 900 | Brute-force himoya |
| `THROTTLE_TTL`, `THROTTLE_LIMIT` | 60, 120 | IP bo‘yicha so‘rovlar limiti (soniya, soni) |

## 7. O‘rnatish

```bash
git clone <repository-url> eduCRM
cd eduCRM
cp .env.example .env
```

`.env` faylida kamida quyidagilarni o‘zgartiring:

```bash
# Linux / macOS uchun tez yo‘l:
sed -i "s/^DATABASE_PASSWORD=.*/DATABASE_PASSWORD=$(openssl rand -hex 16)/" .env
sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$(openssl rand -hex 16)/" .env
sed -i "s/^JWT_SECRET=.*/JWT_SECRET=$(openssl rand -hex 32)/" .env
sed -i "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$(openssl rand -hex 32)/" .env
```

## 8. Docker orqali ishga tushirish

```bash
docker compose up -d --build
```

Birinchi ishga tushishda image’lar build qilinadi (~1–3 daqiqa). Backend konteyneri avtomatik ravishda:
1. PostgreSQL va Redis tayyor bo‘lishini kutadi (healthcheck),
2. migratsiyalarni qo‘llaydi,
3. `RUN_SEED=true` bo‘lsa demo ma’lumotlarni yaratadi (bir marta).

Tekshirish:

```bash
docker compose ps                    # barcha servislar "healthy" bo‘lishi kerak
curl http://localhost:8080/api/health
# {"success":true,"data":{"status":"ok","database":"up","redis":"up",...}}
```

| Manzil | Nima |
|---|---|
| http://localhost:8080 | Web ilova |
| http://localhost:8080/api | REST API (nginx orqali) |
| http://localhost:3000/api/docs | Swagger UI |

Foydali buyruqlar:

```bash
docker compose logs -f backend       # backend loglari
docker compose restart backend
docker compose down                  # to‘xtatish (ma’lumotlar saqlanadi)
docker compose down -v               # to‘xtatish va BAZANI O‘CHIRISH
docker compose exec postgres psql -U educrm -d educrm
docker compose exec redis sh -c 'redis-cli -a "$REDIS_PASSWORD"'
```

Konteynerlar bir-biriga **servis nomi** orqali murojaat qiladi (`postgres`, `redis`, `backend`) — hech qayerda `localhost` hardcode qilinmagan.

## 9. Local development

### Variant A — Docker bilan hot reload

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

- Frontend (Vite, HMR): http://localhost:5173
- API: http://localhost:3000/api, Swagger: http://localhost:3000/api/docs
- `backend/` va `frontend/` papkalari konteynerga mount qilinadi — kod o‘zgarishi darhol qo‘llanadi.
- Agar hostda 5432/6379 band bo‘lsa: `POSTGRES_HOST_PORT=5433 REDIS_HOST_PORT=6380 docker compose -f docker-compose.yml -f docker-compose.dev.yml up`

### Variant B — Docker’siz

PostgreSQL va Redis’ni o‘zingiz ishga tushiring (yoki faqat ularni docker’da: `docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres redis`).

```bash
# Backend
cd backend
cp .env.example .env          # DATABASE_*, REDIS_*, JWT_* ni to‘ldiring (host: localhost)
npm install
npm run migration:run
npm run seed
npm run start:dev             # http://localhost:3000/api

# Frontend (yangi terminalda)
cd frontend
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173 (/api -> localhost:3000 ga proksi)
```

Build:

```bash
cd backend && npm run build       # dist/
cd frontend && npm run build      # type-check (vue-tsc) + dist/
```

## 10. Database migration

Sxema **faqat migratsiyalar orqali** o‘zgaradi (`synchronize: false`).

```bash
cd backend
npm run migration:run                                         # qo‘llash
npm run migration:revert                                      # oxirgisini bekor qilish
npm run migration:generate -- src/database/migrations/AddX    # entity o‘zgarishidan migratsiya yaratish
npm run migration:create -- src/database/migrations/CustomSql # bo‘sh migratsiya
```

Docker’da migratsiyalar backend start bo‘lganda avtomatik qo‘llanadi. Qo‘lda:

```bash
docker compose exec backend node node_modules/typeorm/cli.js -d dist/database/data-source.js migration:run
```

Asosiy jadvallar: `users`, `students`, `teachers`, `teacher_courses` (ManyToMany), `courses`, `groups`, `group_students` (a’zolik — qo‘shilgan/chiqqan sana bilan), `schedules`, `lessons`, `attendances`, `payments`, `leads`, `notifications`. Barcha bog‘lanishlar foreign key bilan, soft delete: `users`, `students`, `teachers`, `courses`, `groups`, `payments`, `leads`.

## 11. Seed (demo ma’lumotlar)

```bash
cd backend && npm run seed                                  # local
docker compose exec backend npm run seed:prod               # docker
```

Seed **idempotent**: demo super admin mavjud bo‘lsa hech narsa qilmaydi. Yaratiladi: 3 administrator, 6 kurs, 6 o‘qituvchi, 10 guruh (jadval bilan), 48 o‘quvchi, a’zoliklar, ~185 to‘lov (qarzdorlar bilan), so‘nggi 8 haftalik darslar va ~1000 davomat yozuvi, 36 lid, bildirishnomalar. Sanalar joriy sanaga nisbatan hisoblanadi — dashboard doim “jonli” ko‘rinadi.

Bazani tozalab, qaytadan seed qilish:

```bash
docker compose down -v && docker compose up -d
```

## 12. API haqida

- Prefiks: `/api`, format: JSON, auth: `Authorization: Bearer <accessToken>`
- Hujjat: **Swagger** — `http://localhost:3000/api/docs` (Login → `accessToken` → **Authorize**)

**Javob formati:**

```json
{ "success": true, "data": { ... } }
{ "success": true, "data": { "items": [ ... ], "meta": { "page": 1, "limit": 10, "total": 48, "totalPages": 5 } } }
```

**Xato formati** (`code` — frontend tarjima qiladigan barqaror kod):

```json
{
  "success": false,
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [{ "field": "email", "messages": ["email must be an email"] }],
  "path": "/api/students",
  "timestamp": "2024-09-01T10:00:00.000Z"
}
```

HTTP kodlar: `200/201/204`, `400` validatsiya, `401` auth, `403` ruxsat yo‘q, `404`, `409` konflikt (band email, jadval to‘qnashuvi), `429` limit.

**Ro‘yxat endpointlari** umumiy parametrlarni qabul qiladi: `page`, `limit` (≤100), `search`, `sortBy`, `sortOrder=ASC|DESC` + modulga xos filtrlar. `sortBy` faqat oq ro‘yxatdagi maydonlar bilan ishlaydi.

**Asosiy endpointlar:**

| Metod | Yo‘l | Rol |
|---|---|---|
| POST | `/api/auth/login`, `/api/auth/refresh` | public |
| POST | `/api/auth/logout` · GET `/api/auth/me` | har kim |
| GET/PATCH | `/api/profile`, PATCH `/api/profile/password` | har kim |
| CRUD | `/api/users` | super admin |
| CRUD | `/api/students` (`?status&groupId`), GET `/api/students/me` | admin (teacher — o‘qish) / student |
| CRUD | `/api/teachers` (`?courseId`), GET `/api/teachers/me` | admin / teacher |
| CRUD | `/api/courses` | o‘qish — hamma, yozish — admin |
| CRUD | `/api/groups`, GET/POST `/api/groups/:id/students`, DELETE `/api/groups/:id/students/:studentId` | admin (o‘qish rolga qarab) |
| CRUD | `/api/schedules` (`?groupId&teacherId&dayOfWeek`), GET `/api/schedules/today` | admin (o‘qish rolga qarab) |
| GET/POST | `/api/attendance`, `/api/attendance/sheet`, `/api/attendance/lessons`, GET `/api/attendance/me/summary` | admin, teacher / student |
| CRUD | `/api/payments`, GET `/api/payments/summary`, `/api/payments/debtors`, `/api/payments/students/:id/balance`, GET `/api/payments/me` | admin / student |
| CRUD | `/api/leads`, GET `/api/leads/stats`, `/api/leads/assignees`, POST `/api/leads/:id/convert` | admin |
| GET | `/api/dashboard/statistics`, `/charts` · `/teacher` · `/student` | admin · teacher · student |
| GET | `/api/reports/finance`, `/attendance`, `/teachers`, `/students`, `/payments/export` (CSV) | admin |
| GET/PATCH/DELETE | `/api/notifications`, `/unread-count`, `/:id/read`, `/read-all`; POST (e’lon) | har kim / admin |
| GET | `/api/health` | public |

Misol:

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@educrm.uz","password":"Admin123!"}' | jq -r .data.accessToken)

curl -s "http://localhost:8080/api/students?search=aziz&status=active&page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq
```

## 13. Foydalanuvchi rollari

| Imkoniyat | Super admin | Admin | O‘qituvchi | O‘quvchi |
|---|:-:|:-:|:-:|:-:|
| Administratorlarni boshqarish | ✅ | — | — | — |
| O‘quvchi, o‘qituvchi, kurs, guruh CRUD | ✅ | ✅ | — | — |
| O‘quvchilar ro‘yxati | ✅ | ✅ | faqat o‘z guruhlari | — |
| Guruhlar va jadval | ✅ | ✅ | o‘zi dars beradigan | o‘zi o‘qiydigan |
| Davomat belgilash | ✅ | ✅ | o‘z guruhlari | — |
| To‘lovlar, qarzdorlar, lidlar, hisobotlar | ✅ | ✅ | — | — |
| O‘z davomati va to‘lovlari | — | — | — | ✅ |
| Dashboard | admin | admin | shaxsiy | shaxsiy |

Backend’da: global `JwtAuthGuard` (+ `@Public()`), `RolesGuard` (+ `@Roles(...)`), `@CurrentUser()`; qator darajasidagi cheklovlar `GroupAccessService` orqali. Frontend’da: route `meta.roles` guard’i va rolga qarab sidebar.

## 14. Demo hisoblar

Seed’dan keyin (login sahifasidagi tugmalar ham ularni to‘ldiradi):

| Rol | Email | Parol |
|---|---|---|
| Super admin | `superadmin@educrm.uz` | `Admin123!` |
| Admin | `admin@educrm.uz` | `Admin123!` |
| Admin (savdo) | `manager@educrm.uz` | `Admin123!` |
| O‘qituvchi | `teacher@educrm.uz` | `Teacher123!` |
| O‘quvchi | `student@educrm.uz` | `Student123!` |

Boshqa o‘qituvchilar: `nargiza.saidova@`, `rustam.qosimov@`, `olga.petrova@`, `jahongir.ortiqov@`, `jiwoo.kim@educrm.uz` — parol `Teacher123!`. Barcha seed o‘quvchilari paroli — `Student123!`.

> ⚠️ Production’da `RUN_SEED=false` va `SHOW_DEMO_ACCOUNTS=false` qiling, demo parollarni o‘zgartiring.

## 15. Frontend

- **Dizayn tizimi** `components/ui/`: AppButton, AppInput, AppSelect, AppModal (mobilda bottom-sheet), ConfirmDialog, ToastContainer, DataTable (saralash, skeleton qatorlar, empty state), AppPagination, SearchInput (debounce), AppDropdown, AppTabs, StatCard, EmptyState, ErrorState, ChipSelect, AppToggle.
- **Holat:** Pinia — `auth` (sessiya, rollar), `ui` (toast, confirm, sidebar), `notifications` (polling), `lookups` (select’lar uchun kesh).
- **Composable’lar:** `useTable` (server pagination/filter/sort), `useForm` + `useRules` (tarjima qilingan validatsiya, API xatolarini maydonlarga bog‘lash), `useAsync`, `useConfirm`, `useToast`.
- **HTTP:** `services/http.ts` — token qo‘shadi, `Accept-Language` yuboradi, 401 da **bitta** refresh so‘rovi bilan barcha kutayotgan so‘rovlarni qayta yuboradi; refresh muvaffaqiyatsiz bo‘lsa login sahifasiga.
- **i18n:** `src/i18n/locales/{uz,ru,en}.ts` — barcha UI matnlari, validatsiya va API xato kodlari tarjimasi. Til tanlovi `localStorage` va foydalanuvchi profilida saqlanadi. Yangi matn qo‘shganda uchala faylga ham kalit qo‘shing.
- **Moslashuvchanlik:** sidebar mobilda off-canvas, jadvallar gorizontal scroll, jadval sahifasi mobilda kunlar bo‘yicha, modallar bottom-sheet.

## 16. Backend

- **Modul tuzilmasi:** `modules/<nom>/{<nom>.module.ts, controller, service, entities/, dto/}`.
- **Validatsiya:** global `ValidationPipe` (`whitelist`, `forbidNonWhitelisted`, `transform`) + class-validator DTO’lar.
- **Xatolar:** `AllExceptionsFilter` — yagona format, Postgres unique/FK xatolari `409` ga aylantiriladi.
- **Xavfsizlik:** bcrypt (10 round), parol hech qachon javobda qaytmaydi (`select: false` + `@Exclude`), Helmet, CORS whitelist, Redis’dagi rate limiting, login brute-force himoya, parametrlangan so‘rovlar (SQL injection’dan himoya), CSV formula-injection’dan himoya, non-root Docker image.
- **Domain event’lar** (`common/events/app-events.ts`): `payment.created`, `attendance.marked`, `lead.assigned` → bildirishnomalar; `*.changed` → dashboard va qarzdorlik keshini tozalash.
- **Qarzdorlik hisobi** (`payments/debts.service.ts`): har bir a’zolik uchun qo‘shilgan oydan chiqqan/joriy oygacha (guruh tugash sanasigacha) oylar × kurs narxi − shu guruh uchun to‘lovlar.

## 17. Redis

| Kalit (prefiks `educrm:`) | Maqsad | TTL |
|---|---|---|
| `auth:refresh:{userId}:{jti}` | Amaldagi refresh tokenlar (rotatsiya; qayta ishlatilsa — barcha sessiyalar bekor) | 7 kun |
| `auth:blacklist:{jti}` | Logout qilingan access tokenlar | token qolgan muddati |
| `auth:login-fail:{email}` | Noto‘g‘ri login urinishlari | 15 daqiqa |
| `throttle:*` | Rate limiting hisoblagichlari (bir nechta instansiya uchun umumiy) | 60 s |
| `cache:user:{id}` | Har bir so‘rovda JWT tekshiruvi uchun foydalanuvchi | 5 daqiqa |
| `cache:dashboard:*` | Dashboard statistikasi va grafiklari | 5 daqiqa / event bo‘yicha tozalanadi |
| `cache:debts:all` | Qarzdorlik hisobi | 5 daqiqa / event bo‘yicha tozalanadi |
| `cache:reports:*` | Hisobotlar | 2 daqiqa |
| `cache:notifications:unread:{userId}` | O‘qilmagan bildirishnomalar soni | 10 daqiqa |

Ko‘rish: `docker compose exec redis sh -c 'redis-cli -a "$REDIS_PASSWORD" --scan --pattern "educrm:*"'`

## 18. Git workflow

- Har bir mantiqiy ish — alohida commit, [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`.
- Tavsiya etilgan branch’lar: `main` (barqaror), `feature/<nom>`, `fix/<nom>` → Pull Request orqali `main` ga.
- Commit’dan oldin: `cd backend && npm run build`, `cd frontend && npm run build` (type-check ham bajariladi).
- `.env` fayllar hech qachon commit qilinmaydi — faqat `.env.example`.

```bash
git checkout -b feature/sms-reminders
git commit -m "feat: add sms reminders for debtors"
git push -u origin feature/sms-reminders
```

## 19. Troubleshooting

| Muammo | Yechim |
|---|---|
| `port is already allocated` | `.env` da `FRONTEND_PORT` / `BACKEND_PORT` ni o‘zgartiring; dev compose’da `POSTGRES_HOST_PORT` / `REDIS_HOST_PORT`. |
| `Set DATABASE_PASSWORD in .env` | `cp .env.example .env` qilinmagan yoki parol bo‘sh. |
| Backend `unhealthy` / qayta ishga tushyapti | `docker compose logs backend` — odatda `JWT_SECRET` yo‘q yoki DB paroli `.env` o‘zgargandan keyin eski volume bilan mos emas: `docker compose down -v` (ma’lumot o‘chadi). |
| `password authentication failed for user "educrm"` | Postgres volume avvalgi parol bilan yaratilgan. `docker compose down -v` yoki eski parolni qaytaring. |
| `NOAUTH Authentication required` (Redis) | `REDIS_PASSWORD` backend va redis uchun bir xil bo‘lishi kerak (ikkalasi ham `.env` dan oladi). |
| Login’da `429 Too Many Requests` | 5 ta xato urinishdan keyin 15 daqiqa blok yoki daqiqasiga 10 tadan ortiq login. Kuting yoki: `docker compose exec redis sh -c 'redis-cli -a "$REDIS_PASSWORD" --scan --pattern "educrm:auth:login-fail*" \| xargs -r redis-cli -a "$REDIS_PASSWORD" del'` |
| Local’da `bcrypt` xatosi (`Cannot find module bcrypt_lib.node`) | `cd backend && npm rebuild bcrypt` (npm 11 install skriptlarini bloklasa: `npm install-scripts approve bcrypt`). |
| Frontend’da `Network Error` (local dev) | Backend ishlayotganini va `frontend/.env` dagi `VITE_PROXY_TARGET` to‘g‘riligini tekshiring. |
| CORS xatosi | Frontend manzilini `CORS_ORIGINS` ga qo‘shing va backend’ni qayta ishga tushiring. |
| Dashboard raqamlari eskirgan | Kesh 5 daqiqa yashaydi va o‘zgarishlarda tozalanadi; qo‘lda: `redis-cli ... --scan --pattern "educrm:cache:*"` → `del`. |
| Migratsiya xatosi | `docker compose exec postgres psql -U educrm -d educrm -c 'select * from migrations'` — qaysi migratsiya qo‘llangani. |

---

Litsenziya: MIT.
