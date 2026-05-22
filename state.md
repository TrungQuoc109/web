# Project Progress (State)

## Completed Features
- **Authentication**: login, registration, JWT-based auth
- **Dashboard**: overview of projects and tasks (Highly Optimized database-level aggregation)
- **Real-time Collaboration**: WebSocket powered updates across clients
- **Project Management**: CRUD operations for projects (with high-performance DB pagination)
- **Task Management**: CRUD, status tracking, assignment
- **Messaging**: direct messages between team members (Decoupled & Event-driven architecture)
- **Notifications**: in‑app alerts for mentions, task updates (Decoupled & Event-driven architecture)
- **File Uploads**: handling of attachments and media (with strict double-layer validation)
- **Internationalization (i18n)**: multi‑language support

## Technical Debt Refactored (Audit Resolutions)
- **[RESOLVED] ARC-01 - Circular Dependency**: Decoupled `ProjectModule`, `TaskModule`, and `MessageModule` using an asynchronous event-driven system with `@nestjs/event-emitter`, removing all dangerous `forwardRef()` coupling.
- **[RESOLVED] ARC-02 - Map Rate Limit Hang**: Refactored `RateLimitGuard` to use distributed, non-blocking Redis `multi()` pipelines (`INCR` and `PTTL`), avoiding synchronous Event Loop blockages.
- **[RESOLVED] ARC-03 - Connection Pool Leak**: Patched `PrismaService` connection leak by implementing the NestJS `OnModuleDestroy` hook to cleanly release PostgreSQL connections.
- **[RESOLVED] DB-01 - In-Memory Pagination**: Optimized `listProjectCatalog` in `ProjectService` to use SQL-level `skip` and `take` inside parallel Prisma `$transaction` blocks.
- **[RESOLVED] DB-02 - In-Memory Aggregations**: Replaced heavy JS arrays `.filter()` and `.reduce()` operations in `DashboardService` with high-performance native PostgreSQL `groupBy` and `count` aggregates.
- **[RESOLVED] DB-03 - In-Memory Relation Count**: Optimized `listProjects` and `listProjectCatalog` in `ProjectService` to count active project members using Prisma native `_count` select and aggregate task statistics at the DB-level using parallel `groupBy` aggregates.
- **[RESOLVED] DB-04 - Task Search GIN Indexes**: Created trigram GIN indexes (`pg_trgm`) on `Task` `title` and `description` to eliminate Full Table Scans during raw case-insensitive searches.
- **[RESOLVED] RT-01 - Distributed Presence Sync**: Refactored online presence tracking to a distributed Redis store (`ioredis`) in `PresenceService`, guaranteeing horizontal socket scalability.
- **[RESOLVED] RT-02 - In-Memory Typing Lock-in**: Replaced local in-memory typing status `Map` in `RealtimeGateway` with a self-cleaning Redis Sorted Set (`ZSET`) in `PresenceService` utilizing absolute expiration timestamps.
- **[RESOLVED] RT-03 - Sync Heavy Serialization / Event Loop block during message broadcasts**: Implemented dynamic DTO pruning, manual ISO string date formatting, and room broadcast decoupling via `setImmediate()` to ensure the Node.js Event Loop is never blocked during massive broadcasts.
- **[RESOLVED] SEC-01 - Arbitrary File Upload**: Hardened `UploadsController` with a robust double-layer whitelist validator covering both actual file extensions and client-provided mimetypes.
- **[RESOLVED] SEC-02 - Helmet Security Headers**: Applied `helmet` globally with custom Content Security Policy (CSP) configurations preserving Swagger UI and uploading.
- **[RESOLVED] SEC-03 - Hang on WS Validation Exceptions**: Implemented `WsAllExceptionsFilter` to catch socket errors and respond gracefully via the acknowledgement (`ack`) callback to prevent client UI freeze.
- **[RESOLVED] SEC-04 - SOLID SRP WS Gateway**: Decoupled `RealtimeGateway` by outsourcing all presence and typing tracking to `PresenceService` and leaving it strictly responsible for WebSocket connection routing.

## Milestones
- **M1 – Core Backend API** – Completed (2026‑05‑10)
- **M2 – Frontend UI (Vite + React)** – Completed (2026‑05‑12)
- **M3 – Real‑time Sync** – In progress, expected completion 2026‑05‑30
- **M4 – CI/CD Pipeline** – Planned for Q2 2026
- **M5 – Mobile Application** – Planned for Q3 2026

*Last updated: 2026‑05‑22*
