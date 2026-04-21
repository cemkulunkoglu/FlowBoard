# FlowBoard

Real-time collaborative Kanban board. Open two tabs, drag a card, watch it sync instantly.

> Portfolio showcase project — SignalR, EF Core, JWT auth, and a clean layered .NET architecture alongside a React + TypeScript + Tailwind frontend.

## Features

- **Auth** — Register / login with JWT, BCrypt password hashing
- **Board CRUD** — Create, rename, delete; each user sees only their boards
- **List + Card CRUD** — Inline rename, delete, optimistic updates
- **Drag & drop** — Reorder within a list or across lists (@dnd-kit)
- **SignalR realtime** — Two tabs sync instantly (cards, lists, labels, presence)
- **Multi-user** — Invite members by email, presence avatars show who is online
- **Labels + markdown** — Color labels per board, markdown card descriptions
- **Dark mode + mobile drawer** — System-aware theme, responsive sidebar
- **Command palette** — `⌘K` board search

## Tech Stack

**Backend** — .NET 10, ASP.NET Core Web API, SignalR, EF Core 10, PostgreSQL 16, JWT, BCrypt
**Frontend** — React 19, TypeScript 6, Vite 8, Tailwind CSS 4, @microsoft/signalr, @dnd-kit, react-markdown
**Infra** — Docker Compose (Postgres + API + Web)

## Architecture

```
FlowBoard/
├── backend/
│   ├── src/
│   │   ├── FlowBoard.Api/             # Controllers, SignalR hub, DI
│   │   ├── FlowBoard.Application/     # Entities, abstractions
│   │   └── FlowBoard.Infrastructure/  # EF Core DbContext, migrations
│   ├── tests/FlowBoard.Tests/         # xUnit tests
│   └── Dockerfile
├── frontend/                          # Vite + React + TS + Tailwind
│   └── Dockerfile
└── docker-compose.yml                 # Postgres + API + Web
```

Three-layer backend (Api → Application ← Infrastructure). Application owns domain entities and abstractions; Infrastructure provides EF Core implementation; Api composes them and exposes HTTP + SignalR.

## Quick start (Docker, all-in-one)

```bash
docker compose up --build
```

- Web: http://localhost:5173
- API: http://localhost:5296
- Swagger: http://localhost:5296/swagger

Demo login: `demo@flowboard.dev` / `demo1234`

## Local dev (separate processes)

**1. Start Postgres**

```bash
docker compose up -d postgres
```

**2. Apply migrations** (first run)

```bash
cd backend
dotnet ef database update --project src/FlowBoard.Infrastructure --startup-project src/FlowBoard.Api
```

**3. Run the API**

```bash
dotnet run --project src/FlowBoard.Api
```

API: http://localhost:5296 · SignalR hub: `/hubs/board` · Swagger: `/swagger`

**4. Run the frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Tests

**Backend:**
```bash
cd backend
dotnet test
```

**Frontend:**
```bash
cd frontend
npm test
```

## Roadmap

- [x] Project skeleton, Postgres, EF Core entities
- [x] Auth (register / login, JWT, BCrypt)
- [x] Board / List / Card CRUD
- [x] Drag & drop reorder (dnd-kit) with SignalR broadcast
- [x] Multi-user: invite by email + presence
- [x] Card details (description, due date, labels, markdown)
- [x] Dockerfiles + single-command `docker compose up` for the full stack
- [ ] Live demo on Railway/Fly.io

## License

MIT
