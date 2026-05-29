# VolunteerUA

A full-stack volunteer coordination platform built for Ukrainian civil organisations. Volunteers apply to join initiatives on an interactive map, coordinators review applications and manage tasks, and admins oversee users and organisations.

---

## Demo Accounts

The database is seeded automatically on first run with realistic data. Use these accounts to explore each role:

| Role | Email | Password |
|---|---|---|
| **SuperAdmin** | admin@volunteer.ua | Volunteer123! |
| **OrganizationAdmin** (Допомога Разом) | org1@volunteer.ua | Volunteer123! |
| **OrganizationAdmin** (Захисники України) | org2@volunteer.ua | Volunteer123! |
| **Coordinator** | coord1@volunteer.ua | Volunteer123! |
| **Coordinator** | coord2@volunteer.ua | Volunteer123! |
| **Volunteer** | vol1@volunteer.ua | Volunteer123! |
| **Volunteer** | vol2@volunteer.ua | Volunteer123! |

### What gets seeded

- **10 initiatives** across Kyiv, Lviv, Kharkiv and Odesa — Active, Planned, and Completed; including 2 emergency ones
- **20+ tasks** spread across initiatives, with statuses ranging from Pending → InProgress → Completed → Verified
- **16 application requests** from volunteers to initiatives (all Approved)
- **Notifications** including a system broadcast and per-user application confirmations
- All users are pre-confirmed/approved so you can log in and explore immediately

The seeder is idempotent — re-running the app never duplicates data.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 20, Angular Material, Mapbox GL |
| Backend | ASP.NET Core 9, MediatR (CQRS), FluentValidation |
| Auth | ASP.NET Identity + JWT (access + refresh tokens) |
| Database | SQL Server, Entity Framework Core 9 |
| Real-time | SignalR |
| Logging | Serilog |
| Containerisation | Docker + docker-compose |

---

## Features

- **Interactive map** — browse volunteer initiatives by category, urgency and location (Mapbox)
- **Applications workflow** — volunteers apply to initiatives; coordinators approve or reject
- **Role hierarchy** — Guest → Volunteer → Coordinator → OrganizationAdmin → SuperAdmin
- **Organisation onboarding** — org admins register their organisation, SuperAdmin approves
- **Task board** — coordinators create and manage tasks within initiatives
- **Real-time notifications** — SignalR push notifications for application status changes
- **Emergency banner** — platform-wide urgent announcements
- **Dashboard** — personal stats: applications sent, tasks assigned, initiatives joined
- **Admin panel** (SuperAdmin only) — manage all users, roles, and initiatives

---

## Project Structure

```
VolunteerPlatform/
├── VolunteerPlatform.API/          # Controllers, middleware, Program.cs, Dockerfiles
├── VolunteerPlatform.Application/  # CQRS commands/queries, DTOs, validators (MediatR)
├── VolunteerPlatform.Domain/       # Entities, enums, domain logic
├── VolunteerPlatform.Infrastructure/  # EF Core, token service, SignalR hub, migrations
├── volunteer-platform-ui/          # Angular 20 frontend
│   ├── src/app/
│   │   ├── core/          # Auth service, guards, interceptors, API services
│   │   ├── features/      # Pages: map, admin, applications, auth, dashboard, tasks…
│   │   └── shared/        # Models, reusable components
│   └── Dockerfile
├── docker-compose.yml
└── .gitignore
```

---

## Running Locally (without Docker)

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)
- SQL Server (or SQL Server Express) running locally
- A [Mapbox](https://mapbox.com) access token

### 1. Backend

```bash
cd VolunteerPlatform.API

# Set your local connection string in appsettings.json:
# "DefaultConnection": "Server=localhost\\SQLEXPRESS;Database=VolunteerPlatformDb;Trusted_Connection=True;TrustServerCertificate=True"

# Apply migrations
dotnet ef database update --project ../VolunteerPlatform.Infrastructure

# Run the API (HTTPS on port 6001)
dotnet run
```

Swagger UI: https://localhost:6001/swagger

### 2. Frontend

```bash
cd volunteer-platform-ui

# Add your Mapbox token to src/environments/environment.ts
# mapboxToken: 'YOUR_MAPBOX_TOKEN'

npm install
ng serve
```

App: http://localhost:4200

---

## Running with Docker

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
- A Mapbox token

### 1. Set your Mapbox token

The Angular build reads the token from the environment file at build time. Before running Docker, set it as a build arg or update the prod environment file:

```bash
# volunteer-platform-ui/src/environments/environment.prod.ts
mapboxToken: 'YOUR_MAPBOX_TOKEN'
```

### 2. Start everything

```bash
docker compose up --build
```

This starts three containers:

| Container | Description | Port |
|---|---|---|
| `volunteer_sqlserver` | SQL Server 2022 Express | 1433 |
| `volunteer_api` | ASP.NET Core API | 8080 |
| `volunteer_ui` | Angular app served via nginx | 4200 |

- **App**: http://localhost:4200
- **API**: http://localhost:8080/swagger

The API waits for SQL Server to be healthy, runs EF migrations on startup, and the UI proxies all `/api/` and `/hubs/` requests to the API container.

### Stop

```bash
docker compose down          # stop containers
docker compose down -v       # stop and delete database volume
```

---

## Environment Configuration

### Backend (`appsettings.json` / environment variables)

| Key | Description |
|---|---|
| `ConnectionStrings__DefaultConnection` | SQL Server connection string |
| `Jwt__Key` | JWT signing secret (min 32 chars) |
| `Jwt__Issuer` | JWT issuer |
| `Jwt__Audience` | JWT audience |
| `AllowedOrigins` | CORS allowed origins (e.g. `http://localhost:4200`) |

### Frontend (`src/environments/environment.ts`)

| Key | Description |
|---|---|
| `apiUrl` | Backend API base URL |
| `mapboxToken` | Mapbox public access token |
| `hubUrl` | SignalR hub path |

> **Note:** `environment.ts` and `environment.prod.ts` are listed in `.gitignore` to prevent secrets from being committed. Use the placeholder values in the repo as templates.

---

## Role System

| Role | Can do |
|---|---|
| **Guest** | View map, apply to become a Volunteer or register an Organisation |
| **Volunteer** | Apply to initiatives, view personal dashboard and tasks |
| **Coordinator** | All Volunteer permissions + review applications, manage tasks |
| **OrganizationAdmin** | All Coordinator permissions + manage own organisation's initiatives |
| **SuperAdmin** | Full access — manage all users, roles, initiatives, approve organisations |

---

## API Endpoints (summary)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new account |
| POST | `/api/auth/login` | — | Login, returns JWT + refresh token |
| POST | `/api/auth/refresh` | — | Refresh access token |
| GET | `/api/initiatives` | — | List / filter initiatives |
| POST | `/api/initiatives` | Volunteer+ | Create initiative |
| GET | `/api/applications/my` | Auth | My applications |
| POST | `/api/applications` | Auth | Apply to initiative |
| PUT | `/api/applications/{id}/approve` | Coordinator+ | Approve application |
| PUT | `/api/applications/{id}/reject` | Coordinator+ | Reject application |
| GET | `/api/users` | OrgAdmin+ | List all users |
| PUT | `/api/users/{id}/role` | OrgAdmin+ | Change user role |
| PUT | `/api/users/{id}/confirm-volunteer` | Coordinator+ | Confirm volunteer |
| PUT | `/api/users/{id}/approve-organization` | OrgAdmin+ | Approve organisation |
| GET | `/api/dashboard` | Auth | Personal dashboard stats |
| GET | `/api/tasks` | Auth | Tasks for an initiative |
| WS | `/hubs/notifications` | Auth | SignalR notification hub |

Full interactive docs at `/swagger` when running the API.

---

## Health Checks

| Endpoint | Description |
|---|---|
| `/health/live` | Liveness — is the process up? |
| `/health/ready` | Readiness — is the database reachable? |

Used by docker-compose to gate the UI container on API readiness.

---

## License

MIT
