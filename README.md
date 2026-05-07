# TaskFlow

![TaskFlow hero](TaskFlow.Frontend/public/images/taskflow-hero-generated.png)

TaskFlow is a workspace-first task management app built with **ASP.NET Core 8** and **Next.js 16**.  
It combines team workspaces, project boards, task ownership, Discord delivery hooks, and a modern dark dashboard UI in one full-stack solution.

## What it does

- Create and manage **workspaces**
- Organize work inside **projects**
- Work with tasks on a **kanban board**
- Assign tasks to project members
- Track **My Tasks** and **Unassigned** work
- Manage **workspace members** and **project members**
- Configure **project-specific Discord webhooks**
- Add **comments** and **attachments** to tasks

## Tech stack

### Backend

- ASP.NET Core 8 Web API
- Entity Framework Core
- PostgreSQL
- ASP.NET Identity + JWT
- Redis
- RabbitMQ
- MinIO

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## Solution structure

```text
TaskFlow.Domain/          Core entities and enums
TaskFlow.Application/     Application services, DTOs, interfaces
TaskFlow.Infrastructure/  EF Core, persistence, external integrations
TaskFlow.WebAPI/          REST API
TaskFlow.Frontend/        Next.js frontend
TaskFlow.DevLauncher/     Visual Studio full-stack launcher
TaskFlow.Tests/           Backend tests
docker-compose.yml        Local infrastructure
```

## Main product flow

TaskFlow is designed around this hierarchy:

```text
Workspace -> Project -> Task
```

- A **workspace** is the top-level team space
- A **project** belongs to a workspace
- A **task** belongs to a project
- A **project page** acts as the main work surface with a kanban board

## Quick start

### Prerequisites

- .NET 8 SDK
- Node.js + npm
- Docker Desktop
- Visual Studio 2022 (recommended for one-click full-stack startup)

## Run with Visual Studio

The repository already includes a full-stack launcher.

1. Open [E:\.Net Project\TaskFlow\TaskFlow.sln](E:\.Net Project\TaskFlow\TaskFlow.sln)
2. Select the **TaskFlow Full Stack** launch profile
3. Press `F5`

This will:

- start Docker dependencies
- launch the backend
- launch the frontend
- open the app in the browser

## Run manually

### 1. Start infrastructure

```powershell
cd "E:\.Net Project\TaskFlow"
docker compose up -d
```

### 2. Start the backend

```powershell
cd "E:\.Net Project\TaskFlow\TaskFlow.WebAPI"
dotnet run --launch-profile http
```

Backend URL:

- [http://localhost:5240/swagger](http://localhost:5240/swagger)

### 3. Start the frontend

```powershell
cd "E:\.Net Project\TaskFlow\TaskFlow.Frontend"
npm install
npm run dev
```

Frontend URL:

- [http://127.0.0.1:3000](http://127.0.0.1:3000)

### Optional frontend env file

Create `TaskFlow.Frontend/.env.local` if you want to override the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5240/api
```

## Default admin account

On backend startup, TaskFlow automatically:

- applies pending EF Core migrations
- seeds the default roles
- creates a default admin account if it does not exist

Credentials:

- username: `admin`
- email: `admin@taskflow.local`
- password: `admin`

## Reset the local database

If you want a clean local environment:

```powershell
cd "E:\.Net Project\TaskFlow"
docker compose down -v
docker compose up -d
```

Then start the backend again. Migrations and the default admin user will be recreated automatically.

## Useful local URLs

- Frontend: [http://127.0.0.1:3000](http://127.0.0.1:3000)
- Swagger: [http://localhost:5240/swagger](http://localhost:5240/swagger)
- RabbitMQ: [http://localhost:15672](http://localhost:15672)
- MinIO console: [http://localhost:9001](http://localhost:9001)

Default local infrastructure credentials:

- PostgreSQL: `postgres / postgres`
- RabbitMQ: `guest / guest`
- MinIO: `admin / password123`

## Useful commands

### Backend build

```powershell
dotnet build "E:\.Net Project\TaskFlow\TaskFlow.WebAPI\TaskFlow.WebAPI.csproj" -v minimal
```

### Frontend production build

```powershell
cd "E:\.Net Project\TaskFlow\TaskFlow.Frontend"
npm run build
```

### Backend tests

```powershell
dotnet test "E:\.Net Project\TaskFlow\TaskFlow.sln" -v minimal
```

## Current highlights

- Unified dark UI across auth, workspace, project, task, member, and Discord pages
- Workspace-first sidebar navigation
- Quick-create modal flow for workspaces, projects, and tasks
- Project kanban board with drag-and-drop task status updates
- Discord integration UI with project-scoped webhook routing

## Notes

- The frontend expects the backend API at `http://localhost:5240/api` by default
- Swagger is the main backend landing page in development
- Docker services are defined in [E:\.Net Project\TaskFlow\docker-compose.yml](E:\.Net Project\TaskFlow\docker-compose.yml)

