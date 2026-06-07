# Architecture

## System overview

```mermaid
flowchart TB
    subgraph Client["React SPA — Vercel"]
        UI["UI / Pages / Components"]
        TF["TensorFlow.js MobileNet<br/>(smart tagging)"]
        FA["face-api.js<br/>(128-d face descriptors)"]
        WS["Socket.io client"]
    end

    subgraph API["Node.js + Express API — Railway"]
        AUTH["Auth + RBAC<br/>(JWT, 4 roles)"]
        CTRL["Controllers<br/>events / media / social / search / face / users"]
        IMG["Sharp service<br/>compress + thumbnail + watermark"]
        NOTIF["Notification service"]
        SOCK["Socket.io server"]
        STORE["Storage interface"]
        AISVC["AI interface<br/>(face matching)"]
    end

    DB[("PostgreSQL — Neon<br/>via Prisma")]
    LOCAL["Local disk /uploads"]
    S3["AWS S3<br/>(drop-in)"]
    REKOG["AWS Rekognition<br/>(drop-in)"]

    UI -->|REST /api| CTRL
    UI --> AUTH
    TF -->|tags| UI
    FA -->|descriptors| UI
    WS <-->|real-time| SOCK

    CTRL --> AUTH
    CTRL --> IMG
    CTRL --> NOTIF
    CTRL --> STORE
    CTRL --> AISVC
    NOTIF --> SOCK
    CTRL --> DB
    AUTH --> DB
    AISVC --> DB

    STORE --> LOCAL
    STORE -.swap.-> S3
    AISVC -.swap.-> REKOG
```

## Upload data flow

```mermaid
sequenceDiagram
    participant U as User (browser)
    participant TF as MobileNet / face-api
    participant API as Express API
    participant IMG as Sharp
    participant ST as Storage
    participant DB as PostgreSQL

    U->>U: Select / drop files (preview)
    U->>TF: Analyze each image
    TF-->>U: tags[] + faceDescriptors[]
    U->>API: POST /media/upload (files + meta JSON)
    API->>IMG: optimize + thumbnail
    IMG-->>API: compressed buffers
    API->>ST: save(optimized), save(thumbnail)
    ST-->>API: { url, key }
    API->>DB: create Media + Tags + FaceDescriptors
    API-->>U: created media
```

## Facial recognition ("Find my photos")

```mermaid
sequenceDiagram
    participant U as User
    participant FA as face-api.js
    participant API as Express API
    participant AI as AI service
    participant DB as PostgreSQL

    U->>FA: Upload selfie (in browser)
    FA-->>U: reference descriptor (128 floats)
    U->>API: POST /face/match { descriptor }
    API->>AI: matchFaces(descriptor)
    AI->>DB: load all face descriptors
    AI->>AI: euclidean distance ≤ threshold
    AI-->>API: ranked mediaIds
    API->>DB: fetch matching media (respecting visibility)
    API-->>U: personalized photos + confidence
```

## Real-time notifications

When a social action occurs (like / comment / tag), the relevant controller calls the
notification service, which (1) persists a `Notification` row and (2) emits a `notification`
event over Socket.io to the recipient's private room (`user:<id>`). The client shows a toast
and updates the unread badge instantly.

## Design principles

- **Client-side AI** keeps the backend dependency-light and key-free, while remaining swappable for managed cloud AI.
- **Driver interfaces** (`services/storage`, `services/ai`) isolate infrastructure choices from business logic.
- **Stateless API + JWT** so the backend scales horizontally; sticky sessions aren't required (Socket.io can use a Redis adapter for multi-instance scale).
- **Cursor pagination** powers the infinite-scroll gallery efficiently at any dataset size.
- **Scalability path for face search:** the current in-JS nearest-neighbour scan can be replaced with a `pgvector` similarity index or Rekognition collections without API changes.
