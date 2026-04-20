# FlowBoard

Real-time Kanban board. Open two tabs, drag a card, watch it sync instantly.

> Portfolio showcase project — built to demonstrate SignalR, EF Core, and a clean layered .NET architecture alongside a React + TypeScript frontend.

## Tech Stack

**Backend** — .NET 10, ASP.NET Core Web API, SignalR, EF Core, PostgreSQL, JWT auth
**Frontend** — React 18, TypeScript, Vite, @microsoft/signalr, @dnd-kit
**Infra** — Docker Compose (Postgres)

## Architecture

```
FlowBoard/
├── backend/
│   ├── src/
│   │   ├── FlowBoard.Api/             # Controllers, SignalR hubs, DI wiring
│   │   ├── FlowBoard.Application/     # Entities, abstractions, services
│   │   └── FlowBoard.Infrastructure/  # EF Core DbContext, migrations
│   └── tests/FlowBoard.Tests/
├── frontend/                          # Vite + React + TS
└── docker-compose.yml                 # Postgres
```

Three-layer layout (Api → Application ← Infrastructure). Application owns domain entities and abstractions; Infrastructure provides the EF Core implementation; Api composes them and exposes HTTP + SignalR.

## Running locally

**1. Start Postgres**

```bash
docker compose up -d
```

**2. Apply migrations** (first run)

```bash
cd backend
dotnet ef migrations add Initial --project src/FlowBoard.Infrastructure --startup-project src/FlowBoard.Api
dotnet ef database update --project src/FlowBoard.Infrastructure --startup-project src/FlowBoard.Api
```

**3. Run the API**

```bash
cd backend
dotnet run --project src/FlowBoard.Api
```

API: http://localhost:5000 · SignalR hub: `/hubs/board` · OpenAPI: `/openapi/v1.json`

**4. Run the frontend**

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Roadmap

- [x] Project skeleton, Postgres, EF Core entities
- [ ] Auth (register / login, JWT)
- [ ] Board / List / Card CRUD
- [ ] Drag & drop reorder (dnd-kit) with SignalR broadcast
- [ ] Multi-user: invite by email
- [ ] Card details (description, due date, labels)
- [ ] Dockerfiles + single-command `docker compose up` for the full stack
- [ ] Live demo on Railway/Fly.io

## License

MIT
