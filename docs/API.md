# API Reference

Base URL: `<backend>/api`. Auth via `Authorization: Bearer <jwt>`.
Responses are JSON. Errors: `{ "error": "message" }` with an appropriate HTTP status.

## Auth

| Method | Endpoint | Auth | Body / notes |
|--------|----------|------|--------------|
| POST | `/auth/register` | – | `{ name, email, password, role?, clubName? }` → `{ user, token }`. First user becomes ADMIN. |
| POST | `/auth/login` | – | `{ email, password }` → `{ user, token }` |
| GET | `/auth/me` | ✓ | current user (incl. `hasFaceProfile`) |
| PATCH | `/auth/profile` | ✓ | `{ name?, clubName?, avatarUrl?, faceDescriptor? }` |

## Events

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/events` | optional | query: `sort=name\|date\|category`, `order`, `category`, `q` |
| GET | `/events/categories` | – | distinct categories |
| GET | `/events/:id` | optional | event + albums + counts |
| POST | `/events` | ADMIN/PHOTOGRAPHER | `{ name, description?, category?, clubName?, date?, coverUrl?, visibility? }` |
| PATCH | `/events/:id` | creator/ADMIN | update |
| DELETE | `/events/:id` | creator/ADMIN | |
| POST | `/events/:id/albums` | ADMIN/PHOTOGRAPHER | `{ name, description? }` |

## Media

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/media/upload` | ADMIN/PHOTOGRAPHER/CLUB_MEMBER | multipart: `files[]`, `eventId`, `albumId?`, `visibility?`, `meta` (JSON array of `{ tags, faces }` aligned to files) |
| GET | `/media` | optional | feed; query: `eventId?`, `albumId?`, `type?`, `sort=new\|popular`, `cursor?`, `limit?` → `{ media, nextCursor }` |
| GET | `/media/:id` | optional | media + comments + tags + userTags |
| DELETE | `/media/:id` | uploader/ADMIN | |
| GET | `/media/:id/download` | optional | returns **watermarked** image stream |
| GET | `/media/favorites/mine` | ✓ | current user's favourites |

## Social

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/media/:id/like` | ✓ | toggle → `{ liked, likeCount }` |
| POST | `/media/:id/favorite` | ✓ | toggle → `{ favorited }` |
| POST | `/media/:id/comments` | ✓ | `{ text }` |
| DELETE | `/media/:id/comments/:commentId` | author/ADMIN | |
| POST | `/media/:id/tag-user` | ✓ | `{ userId }` (tag a friend) |
| POST | `/media/:id/share` | ✓ | → `{ token, url }` (for QR/link) |

## Search

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/search` | optional | query: `q`, `tag`, `event`, `user`, `from`, `to`, `sort` |
| GET | `/search/tags` | – | popular tags with counts |

## Facial recognition

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| POST | `/face/match` | optional | `{ descriptor: number[128] }` → ranked media with `matchConfidence` |
| POST | `/face/match-me` | ✓ | uses stored profile selfie descriptor |

## Notifications

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/notifications` | ✓ | `{ notifications, unread }` |
| POST | `/notifications/read` | ✓ | `{ ids? }` (omit to mark all) |

Real-time: connect Socket.io with `auth: { token }`; listen for the `notification` event.

## Users / Admin

| Method | Endpoint | Auth | Notes |
|--------|----------|------|-------|
| GET | `/users` | ✓ | query `q` (for tagging / admin) |
| GET | `/users/stats` | ADMIN | analytics dashboard totals |
| PATCH | `/users/:id/role` | ADMIN | `{ role }` |

## Health

`GET /api/health` → `{ status: "ok", time }`
