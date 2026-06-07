# Deployment Guide — Vercel + Railway + Neon

This deploys the frontend to **Vercel**, the backend to **Railway**, and the database to **Neon**.

## 0. Push to GitHub

```bash
cd CIGPROJECT
git init
git add .
git commit -m "Event & Media Management Platform"
git branch -M main
git remote add origin https://github.com/<you>/cig-platform.git
git push -u origin main
```

The repo is a monorepo: `backend/` and `frontend/` deploy as separate services with their own root directories.

---

## 1. Database — Neon (free serverless PostgreSQL)

1. Sign up at https://neon.tech and create a project.
2. In the project dashboard, copy the **pooled** connection string. It looks like:
   ```
   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
3. Keep it handy for the backend env vars.

---

## 2. Backend — Railway

1. https://railway.app → **New Project → Deploy from GitHub repo** → select your repo.
2. In the service **Settings → Root Directory**, set it to `backend`.
3. **Variables** — add:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | your Neon pooled string |
   | `JWT_SECRET` | a long random string |
   | `NODE_ENV` | `production` |
   | `CLIENT_URL` | your Vercel URL (add after step 3) |
   | `PUBLIC_URL` | the Railway public URL of this service |
   | `STORAGE_DRIVER` | `local` (or `s3` — see below) |
4. Railway uses `railway.json`, which runs:
   ```
   npx prisma migrate deploy && node src/server.js
   ```
   On the **first** deploy, instead run a one-off `npx prisma db push` (Deployments → run command) to create the tables, or generate a migration locally first:
   ```bash
   cd backend && npx prisma migrate dev --name init
   git add prisma/migrations && git commit -m "init migration" && git push
   ```
5. Generate a public domain (Settings → Networking → Generate Domain). Copy it → this is your API URL.
6. (Optional) Seed demo data: run `npm run db:seed` as a one-off command.

> **Persistent media:** Railway's disk is ephemeral; uploaded files vanish on redeploy with the `local` driver. For a stable demo, either attach a **Railway Volume** mounted at `backend/uploads`, or use `STORAGE_DRIVER=s3`.

---

## 3. Frontend — Vercel

1. https://vercel.com → **Add New → Project** → import your repo.
2. Set **Root Directory** to `frontend`. Framework preset auto-detects **Vite**.
3. **Environment Variables:**
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | your Railway API URL (e.g. `https://cig.up.railway.app`) |
   | `VITE_FACE_MODELS_URL` | leave default CDN, or `/models` if self-hosting |
4. Deploy. `vercel.json` handles SPA fallback routing.
5. Copy the Vercel domain and set it as `CLIENT_URL` back in Railway, then redeploy the backend (so CORS + Socket.io accept the origin).

---

## 4. Verify

- Visit the Vercel URL → register (first account becomes Admin).
- Create an event → upload photos (watch AI tags + face counts appear) → like/comment.
- Open a second browser as another user, like a photo → original user gets a real-time toast.
- Set a profile selfie → "My Photos" finds matching uploads.

---

## Optional: AWS S3 storage

```bash
cd backend && npm i @aws-sdk/client-s3
```
Set on Railway:
```
STORAGE_DRIVER=s3
AWS_REGION=...           AWS_S3_BUCKET=...
AWS_ACCESS_KEY_ID=...    AWS_SECRET_ACCESS_KEY=...
```
Make the bucket objects publicly readable (or front with CloudFront). No code changes needed.

## Optional: self-host face-api models
Download the face-api weights into `frontend/public/models` and set
`VITE_FACE_MODELS_URL=/models`. This avoids any CDN dependency for facial recognition.

## Optional: Docker
A `backend/Dockerfile` is included for container deploys (Railway, Fly.io, Render, etc.).
