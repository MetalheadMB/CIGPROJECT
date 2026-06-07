# CIG · Event & Media Management Platform

A scalable, production-style platform where clubs, photographers and members can **upload, organize, discover and interact** with event media — with AI-powered tagging, in-browser facial recognition, social features, real-time notifications, dynamic watermarking and role-based access control.

Built for the *Event & Media Management Platform* problem statement.

- **Frontend:** React (Vite) → deploy to **Vercel**
- **Backend:** Node.js + Express + Prisma + Socket.io → deploy to **Railway**
- **Database:** PostgreSQL on **Neon**
- **Storage:** pluggable — local disk by default, **AWS S3** as a drop-in
- **AI:** TensorFlow.js (MobileNet) tagging + face-api.js facial recognition, running **in the browser** (no API keys)

---

## Table of contents

1. [Feature checklist](#feature-checklist)
2. [Architecture](#architecture)
3. [Project structure](#project-structure)
4. [Local setup](#local-setup)
5. [Environment variables](#environment-variables)
6. [Deployment (Vercel + Railway + Neon)](#deployment)
7. [Swapping in AWS S3 / Rekognition](#swapping-cloud-providers)
8. [API overview](#api-overview)
9. [Demo accounts](#demo-accounts)

---

## Feature checklist

Every core requirement from the problem statement is implemented:

| # | Requirement | Where |
|---|-------------|-------|
| 1 | **Event management** — create/manage events, event-wise albums, descriptions & metadata, sort by name/date/category | `events` API, `Events.jsx`, `EventDetail.jsx` |
| 2 | **Media upload** — photos & videos, bulk upload, drag-and-drop, preview before upload, optimized storage & compression | `media/upload`, `Upload.jsx`, `services/image.js` |
| 3 | **Access control & auth** — JWT auth, 4 roles (Admin, Photographer, Club Member, Viewer), public vs private media | `middleware/auth.js`, role checks across routes |
| 4 | **Social features** — like, comment, share (+QR), download, favourites, tag friends, real-time notifications | `socialController.js`, `socket.js`, `MediaDetail.jsx` |
| 5 | **AI/ML** — smart image tagging, advanced search (event/tag/date/user), facial recognition with reference selfie → personalized "My Photos" | `utils/tagging.js`, `utils/face.js`, `faceController.js`, `searchController.js` |
| 6 | **Cloud integration** — pluggable storage abstraction; AWS S3 driver included | `services/storage/` |
| 7 | **Watermarking** — automatic dynamic watermark on download (club + event + role) | `services/image.js → watermarkImage` |

**Bonus features included:** infinite-scroll gallery, QR-based sharing, analytics dashboard, PWA (manifest + service worker / offline caching), and code-splitting for performance.

---

## Architecture

```
                         ┌─────────────────────────────┐
                         │      React SPA (Vercel)      │
                         │  • TF.js MobileNet (tags)    │
                         │  • face-api.js (descriptors) │
                         │  • Socket.io client          │
                         └───────────┬─────────────────┘
                           HTTPS REST │  WebSocket
                                      ▼
                         ┌─────────────────────────────┐
                         │  Node/Express API (Railway)  │
                         │  • JWT auth + RBAC           │
                         │  • Sharp: compress+watermark │
                         │  • Socket.io notifications   │
                         │  • Prisma ORM                │
                         └──────┬───────────────┬───────┘
                                │               │
                   ┌────────────▼───┐     ┌─────▼──────────────┐
                   │ PostgreSQL     │     │ Storage driver     │
                   │ (Neon)         │     │ local disk / S3    │
                   └────────────────┘     └────────────────────┘
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the detailed diagram and data flow, and [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md) for the full schema.

A key design decision: **AI runs on the client**. MobileNet generates tags and face-api.js generates 128-dimension face descriptors in the browser at upload time. The backend stores those vectors and does nearest-neighbour matching in JS. This keeps the server light (no native ML deps), needs zero API keys, and the matching layer can be swapped for AWS Rekognition or pgvector without touching the rest of the app.

---

## Project structure

```
CIGPROJECT/
├── backend/                 # Node.js + Express API
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema (the data model)
│   │   └── seed.js           # Demo users + events
│   ├── src/
│   │   ├── config/           # env + Prisma client
│   │   ├── middleware/       # auth (JWT+RBAC), upload (multer), errors
│   │   ├── controllers/      # auth, events, media, social, search, face, users, notifications
│   │   ├── routes/           # REST routes
│   │   ├── services/
│   │   │   ├── storage/      # local + s3 drivers (pluggable)
│   │   │   ├── ai/           # local face matching + rekognition stub
│   │   │   ├── image.js      # sharp: optimize + watermark
│   │   │   └── notification.js
│   │   ├── socket.js         # Socket.io real-time
│   │   └── server.js
│   ├── railway.json / Procfile / Dockerfile
│   └── .env.example
├── frontend/                # React (Vite) SPA
│   ├── src/
│   │   ├── api/              # axios client
│   │   ├── context/         # Auth + Socket providers
│   │   ├── components/      # Navbar, MediaCard, InfiniteGallery, ui, toasts
│   │   ├── pages/           # Home, Events, EventDetail, Upload, MediaDetail,
│   │   │                    #   Search, Favorites, MyPhotos, Notifications,
│   │   │                    #   Profile, Admin, Login, Register
│   │   ├── utils/           # tagging (MobileNet), face (face-api), image helpers
│   │   └── styles/          # design system
│   ├── public/              # manifest + service worker (PWA)
│   ├── vercel.json
│   └── .env.example
└── docs/                    # ARCHITECTURE, DATABASE_SCHEMA, DEPLOYMENT, API
```

---

## Local setup

**Prerequisites:** Node 18+, a PostgreSQL database (a free [Neon](https://neon.tech) project works great).

### 1. Backend

```bash
cd backend
cp .env.example .env          # then edit DATABASE_URL + JWT_SECRET
npm install
npx prisma db push            # create tables from schema
npm run db:seed               # optional: demo users + events
npm run dev                   # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # leave VITE_API_URL blank for local (uses proxy)
npm install
npm run dev                   # http://localhost:5173
```

Open http://localhost:5173 and log in with a demo account (below).

---

## Environment variables

### Backend (`backend/.env`)

| Var | Description |
|-----|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) |
| `JWT_SECRET` | Long random string for signing tokens |
| `CLIENT_URL` | Allowed frontend origin(s), comma-separated |
| `PUBLIC_URL` | Public URL of the backend (for local media links) |
| `STORAGE_DRIVER` | `local` (default) or `s3` |
| `AWS_*` | Only needed when `STORAGE_DRIVER=s3` |
| `AI_DRIVER` | `local` (default) or `rekognition` |
| `FACE_MATCH_THRESHOLD` | Max descriptor distance for a match (default `0.55`) |

### Frontend (`frontend/.env`)

| Var | Description |
|-----|-------------|
| `VITE_API_URL` | Backend URL in production (e.g. `https://xxx.up.railway.app`). Blank in dev. |
| `VITE_FACE_MODELS_URL` | Where face-api weights load from (defaults to a CDN; can self-host in `public/models`) |

---

## Deployment

Full step-by-step guide in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Summary:

### Database — Neon
1. Create a project at neon.tech, copy the **pooled** connection string.

### Backend — Railway
1. New project → Deploy from GitHub → pick the repo, set **root directory** to `backend`.
2. Add env vars (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` = your Vercel URL, `PUBLIC_URL` = the Railway URL).
3. Railway runs `npx prisma migrate deploy && node src/server.js` (see `railway.json`).

> ⚠️ Railway's filesystem is ephemeral, so the **local** storage driver loses files on redeploy. For a persistent demo set `STORAGE_DRIVER=s3` (see below) or attach a Railway volume.

### Frontend — Vercel
1. New project → import repo, set **root directory** to `frontend`.
2. Framework auto-detects Vite. Set `VITE_API_URL` to your Railway backend URL.
3. Deploy. `vercel.json` already handles SPA routing.

---

## Swapping cloud providers

The app is built around interfaces so cloud services are drop-in:

**AWS S3 storage:**
```bash
cd backend && npm i @aws-sdk/client-s3
# .env: STORAGE_DRIVER=s3 + AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_S3_BUCKET
```
No other code changes — `services/storage/index.js` picks the driver.

**AWS Rekognition face matching:** implement `matchFaces()` in `services/ai/rekognition.js` and set `AI_DRIVER=rekognition`.

---

## API overview

Base path `/api`. Full reference in [`docs/API.md`](docs/API.md).

```
POST   /auth/register | /auth/login        GET /auth/me   PATCH /auth/profile
GET    /events  POST /events  GET /events/:id  POST /events/:id/albums
POST   /media/upload  GET /media  GET /media/:id  GET /media/:id/download
POST   /media/:id/like | /favorite | /comments | /tag-user | /share
GET    /search   GET /search/tags
POST   /face/match   POST /face/match-me
GET    /notifications   POST /notifications/read
GET    /users   GET /users/stats   PATCH /users/:id/role
```

---

## Demo accounts

After `npm run db:seed`:

| Email | Password | Role |
|-------|----------|------|
| admin@cig.dev | password123 | Admin |
| photo@cig.dev | password123 | Photographer |
| member@cig.dev | password123 | Club Member |
| viewer@cig.dev | password123 | Viewer |

> The **first** user to register on a fresh database is automatically promoted to Admin.
