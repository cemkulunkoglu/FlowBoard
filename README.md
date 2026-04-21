# FlowBoard

Real-time collaborative Kanban board. Open two browsers side by side, drag a card, watch it sync instantly — same for new comments, checklist ticks, member invites, and activity.

> Portfolio project demonstrating a clean layered .NET 10 backend (SignalR + EF Core + JWT + refresh tokens + rate limiting + Serilog + health checks) alongside a React 19 + TypeScript + Tailwind v4 frontend with optimistic UI, undoable deletes, dark mode, command palette, and full realtime state reconciliation.

---

## Feature matrix

### Auth & accounts
- Email + password registration, BCrypt hashing
- JWT access token + rotating refresh token (30 days)
- Axios interceptor: 401 → silent refresh → retry original request
- Password reset flow (`/forgot-password` → emailed link → `/reset-password`)
- Email verification flow (`/verify-email?token=…`) + dashboard pill reminder
- `IEmailSender` abstraction with `ConsoleEmailSender` for dev; swap for SMTP in prod
- Rate limiting: 10 auth requests / min / IP, 200 global / min / IP

### Boards & membership
- Create, rename (inline in sidebar), delete (with undo toast)
- `BoardMember` many-to-many with `Owner` / `Member` roles
- Invite by email from board settings modal; owner-only actions gated server-side
- Each user sees only boards they are a member of
- SignalR `BoardHub`: membership-checked `JoinBoard` / `LeaveBoard`
- Presence: who is currently on the board (avatar stack in header)

### Lists & cards
- List CRUD (create / rename inline / delete with undo)
- Card CRUD (create / drag-reorder / drag across lists / delete with undo)
- `@dnd-kit` drag & drop with optimistic reducer + server reconciliation
- Position renormalization on the server for deterministic order across clients

### Card detail
- Title + markdown description (react-markdown + remark-gfm)
- Due date with `overdue` / `soon` / `later` semantic chips
- Labels: per-board color labels, attach/detach, inline create with color picker
- Assignees: pick from board members; avatar stack on the card face
- Checklist: items with done state, progress bar, `n / total · %` count
- Comments: threaded by `createdAt`, realtime add/delete, author-only delete

### Activity
- Every mutation recorded by `ActivityRecorder` (board/list/card/member events)
- Right-side drawer with humanized text + relative time ("3 dk önce")
- Feed prepends live via SignalR `ActivityRecorded`

### UX polish
- Semantic color tokens: `primary` / `success` / `danger` / `warning` / `info`
- Dark mode with Tailwind v4 `@custom-variant` and `<html class="dark">`
- Mobile sidebar drawer with overlay (md breakpoint)
- Command palette (`⌘K` / `Ctrl+K`) for board search
- Toast system: `success` / `error` / `info` / **undoable** (5 s grace)
- `ConfirmProvider` replaces native `window.confirm` with a themed modal
- `ErrorBoundary` for uncaught render errors
- All copy in Turkish (UI facing); README in English

### Platform
- Serilog request logging (console sink)
- Health endpoints: `/health/live` (always 200), `/health/ready` (Postgres connectivity)
- Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`
- Swagger UI at `/swagger` in development

---

## Tech stack

**Backend** — .NET 10, ASP.NET Core Web API, SignalR, EF Core 10, PostgreSQL 16, `Microsoft.AspNetCore.Authentication.JwtBearer`, `BCrypt.Net-Next`, Serilog, `AspNetCore.HealthChecks.NpgSql`, `Microsoft.AspNetCore.RateLimiting`

**Frontend** — React 19, TypeScript 6, Vite 8, Tailwind CSS 4, React Router 7, Axios, `@microsoft/signalr`, `@dnd-kit/core` + `@dnd-kit/sortable`, `react-markdown` + `remark-gfm`

**Infra & tests** — Docker Compose, Dockerfiles for backend (SDK → aspnet runtime) and frontend (node build → nginx static), xUnit (`FlowBoard.Tests`), Vitest (`frontend/src/**/*.test.ts`)

---

## Architecture

```
FlowBoard/
├── backend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── FlowBoard.Api/
│   │   │   ├── Auth/              # JwtTokenFactory, TokenHash, BoardAccess
│   │   │   ├── Contracts/         # Request/response DTOs
│   │   │   ├── Controllers/       # Auth, Boards, Lists, Cards, Labels,
│   │   │   │                      # BoardMembers, Checklist, Comments,
│   │   │   │                      # Activity
│   │   │   ├── Hubs/BoardHub.cs   # SignalR + presence
│   │   │   ├── Middleware/        # SecurityHeadersMiddleware
│   │   │   ├── Services/          # ActivityRecorder
│   │   │   └── Program.cs         # DI, auth, CORS, rate limit, health
│   │   ├── FlowBoard.Application/
│   │   │   ├── Abstractions/      # IAppDbContext, IPasswordHasher,
│   │   │   │                      # IEmailSender
│   │   │   └── Entities/          # Board, List, Card, Label, User,
│   │   │                          # BoardMember, ChecklistItem, Comment,
│   │   │                          # Activity, RefreshToken, ...
│   │   └── FlowBoard.Infrastructure/
│   │       ├── Email/             # ConsoleEmailSender
│   │       ├── Migrations/        # EF Core migrations
│   │       ├── Persistence/       # AppDbContext, DbSeeder
│   │       └── Security/          # BCryptPasswordHasher
│   └── tests/FlowBoard.Tests/     # xUnit
├── frontend/
│   ├── Dockerfile                 # node build → nginx
│   ├── nginx.conf
│   └── src/
│       ├── components/
│       │   ├── board/             # CardItem, ListColumn, CardDetailModal,
│       │   │                      # ActivityDrawer, BoardSettingsModal
│       │   ├── layout/            # AppLayout, Sidebar, Navbar
│       │   ├── CommandPalette.tsx
│       │   ├── ConfirmContext.tsx equivalents
│       │   ├── ErrorBoundary.tsx
│       │   └── ProtectedRoute.tsx
│       ├── contexts/              # Auth, Boards, Toast, Confirm, Theme
│       ├── hooks/useBoardHub.ts
│       ├── pages/                 # Login, Register, Forgot, Reset,
│       │                          # VerifyEmail, Boards, BoardDetail
│       ├── services/              # axios + REST wrappers
│       └── state/boardReducer.ts  # idempotent reducer for hub echo
└── docker-compose.yml             # postgres + api + web
```

**Three-layer backend.** `Application` owns entities + abstractions. `Infrastructure` provides EF Core, BCrypt, email sender. `Api` composes them and exposes HTTP + SignalR. The test project references `Application` + `Infrastructure` so unit tests can touch real persistence via `Microsoft.EntityFrameworkCore.InMemory`.

**Idempotent reducer.** SignalR rebroadcasts every mutation to the originating client too. The frontend reducer is idempotent (no-op on duplicate create/delete, stable `MOVE_CARD` under repeat) so optimistic + echo don't diverge.

---

## Quick start — one command (Docker)

```bash
docker compose up --build
```

- **Web:** http://localhost:5173
- **API:** http://localhost:5296
- **Swagger:** http://localhost:5296/swagger

**Demo account:** `demo@flowboard.dev` / `demo1234`

Two seeded boards (`Ürün Lansmanı`, `Kişisel Görevler`) ship with the demo user so the UI is alive on first login.

---

## Local development (split processes)

**1. Start just Postgres**

```bash
docker compose up -d postgres
```

**2. Apply migrations (first run or after pulling new ones)**

```bash
cd backend
dotnet ef database update \
  --project src/FlowBoard.Infrastructure \
  --startup-project src/FlowBoard.Api
```

If `dotnet-ef` isn't installed:
```bash
dotnet tool install --global dotnet-ef
export PATH="$PATH:$HOME/.dotnet/tools"   # add to ~/.zshrc for permanence
```

**3. Run the API**

```bash
dotnet run --project src/FlowBoard.Api
```

- API: http://localhost:5296
- SignalR hub: `/hubs/board`
- Swagger: `/swagger`
- Health: `/health/live`, `/health/ready`

**4. Run the frontend**

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173

---

## Configuration

Backend configuration lives in `backend/src/FlowBoard.Api/appsettings*.json` and is overridable via env vars (double-underscore convention):

| Key | Default | Purpose |
|---|---|---|
| `ConnectionStrings__Postgres` | `Host=localhost;Port=5432;Database=flowboard;Username=flowboard;Password=flowboard` | Postgres connection |
| `Jwt__Issuer` | `FlowBoard` | JWT `iss` |
| `Jwt__Audience` | `FlowBoard.Client` | JWT `aud` |
| `Jwt__Key` | dev-only string | HMAC-SHA256 signing key (32+ chars) |
| `Jwt__ExpiresInMinutes` | `1440` | Access token lifetime |

The frontend uses `VITE_API_URL` (defaults to `http://localhost:5296`).

### In production, at minimum

- Set `Jwt__Key` via secret store / env (never commit)
- Swap `ConsoleEmailSender` for a real SMTP implementation
- Restrict CORS origin (`Program.cs` has `WithOrigins("http://localhost:5173")` hard-coded — parameterize)
- Enable HTTPS redirect + HSTS

---

## Testing

**Backend** (xUnit + `EF Core InMemory`):

```bash
cd backend
dotnet test
```

Covers `BCryptPasswordHasher` and `DbSeeder` behavior (user/board/membership provisioning, legacy password upgrade, idempotency).

**Frontend** (Vitest + jsdom):

```bash
cd frontend
npm test
```

Covers the `boardReducer` across SET_BOARD, ADD_CARD (idempotent), DELETE_CARD, MOVE_CARD (cross-list renormalization), UPDATE_LIST, DELETE_LABEL (cascade from cards), SET_CARD_LABELS (id → object resolution).

---

## Try the realtime flow

1. Open http://localhost:5173 in **two browsers** (or normal + incognito).
2. Log in as `demo@flowboard.dev / demo1234` in both.
3. In one, open any seeded board. In the other, open the same board.
4. Drag a card in browser A → browser B updates within ~100 ms.
5. Click **Ayarlar** → invite a second account by email (register a new user first in a third tab if needed).
6. In the invited account, the new board appears in the sidebar. Open it.
7. Present avatars top-left show both users online.
8. Open a card in one, add a comment or tick a checklist → the other sees it live.
9. Open the **🕐 Aktivite** drawer → every action flows in real time.

---

## API surface

Auth:
- `POST /api/Auth/register` · `POST /api/Auth/login`
- `POST /api/Auth/refresh` · `POST /api/Auth/logout`
- `POST /api/Auth/forgot-password` · `POST /api/Auth/reset-password`
- `POST /api/Auth/send-verification-email` · `POST /api/Auth/verify-email`
- `GET  /api/Auth/me`

Boards & collaboration:
- `GET/POST/PUT/DELETE /api/Boards` (+ `/{id}`)
- `GET/POST /api/boards/{id}/members` · `DELETE /api/boards/{id}/members/{userId}`
- `GET /api/boards/{id}/activity`

Lists, cards, labels:
- `POST/PATCH/DELETE /api/Lists`
- `POST/PATCH/DELETE /api/Cards` · `POST /api/Cards/{id}/move`
- `POST/DELETE /api/Cards/{id}/labels/{labelId}` · `POST/DELETE /api/Cards/{id}/assignees/{userId}`
- `POST/DELETE /api/Labels`

Checklist & comments:
- `POST /api/cards/{cardId}/checklist` · `PATCH/DELETE /api/checklist/{itemId}`
- `GET/POST /api/cards/{cardId}/comments` · `DELETE /api/comments/{commentId}`

Health:
- `GET /health/live` · `GET /health/ready`

All endpoints except `Auth/*` and health require a Bearer JWT. The SignalR hub accepts the access token via `?access_token=…` query string (WebSocket-friendly).

---

## Roadmap

- [x] Project skeleton, Postgres, EF Core entities
- [x] Auth: register / login / JWT / refresh rotation / password reset / email verify
- [x] Board / List / Card CRUD with drag & drop and SignalR broadcast
- [x] Multi-user: invites, roles, presence
- [x] Card details: labels, assignees, markdown, due dates, checklist, comments
- [x] Activity log with live feed
- [x] Undo toasts, command palette, confirm modal, dark mode, mobile drawer
- [x] Rate limiting, security headers, structured logging, health checks
- [x] Dockerfiles + single-command `docker compose up` for the full stack
- [x] Backend xUnit + frontend Vitest coverage of critical paths
- [ ] Live demo on Railway / Fly.io
- [ ] Real SMTP sender (SendGrid / Resend adapter)
- [ ] GitHub Actions CI (dotnet test + npm test + lint)

---

## License

MIT
