# API Sentinel (Phase 2)

Interview-ready API monitoring project with:

- Postman-style monitor creation (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Redis + BullMQ queue architecture
- Separate `scheduler`, `worker`, and `server` processes
- WebSocket real-time updates
- PostgreSQL history retention (latest 10 checks per API)
- Rate limiting + auth-protected API endpoints

## Tech Stack

- Backend: Node.js, Express, Prisma, PostgreSQL, Redis, BullMQ, WebSocket
- Frontend: React + Vite + TypeScript

## 1) Run infrastructure (Postgres + Redis)

```bash
docker compose up -d
```

## 2) Configure environment

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

## 3) Install and initialize backend

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

## 4) Run backend processes

Runs all 3 processes in one command:

```bash
npm run dev
```

- API + WebSocket server: `src/server.ts` on `http://localhost:4000`
- Scheduler: `src/scheduler.ts` (every 5 seconds by default)
- Worker: `src/worker.ts` (queue consumer, configurable concurrency)

## 5) Run frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Architecture (Simple Flow)

1. Scheduler reads all monitors and pushes jobs to Redis queue.
2. Worker consumes jobs, calls monitored APIs, stores checks in Postgres.
3. Worker trims each API history to latest 10 rows.
4. Worker publishes update events over Redis pub/sub.
5. Server broadcasts user-specific updates to browser via WebSocket.
6. Dashboard updates live every 5 seconds.

