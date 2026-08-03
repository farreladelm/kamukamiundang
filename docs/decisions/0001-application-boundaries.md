# ADR-0001: Use a modular Next.js monolith with a server-only data access layer

## Status

Accepted

## Date

2026-08-03

## Context

Undango needs one responsive web application for public showroom, private customer workspace, and admin operations. The MVP must protect private invitation data while keeping the initial deployment and operational model small.

## Decision

Use one Next.js App Router application and one PostgreSQL database as a modular monolith.

- `src/app` owns routes, layouts, Server Components, Server Actions, and Route Handlers.
- Domain code lives in `src/features/*`.
- Shared server infrastructure lives in `src/lib/server/*` and imports `server-only`.
- Server Components read through a server-only data access layer; they do not call internal Route Handlers.
- Server Actions and Route Handlers validate input, authenticate, authorize, and delegate to server-only domain code.
- Prisma records do not cross into Client Components. Server code returns minimal safe DTOs.

## Alternatives Considered

### Separate frontend and API services

Rejected. Separate deployment, API contracts, and authentication boundaries add operational cost before MVP validation.

### Direct database reads from each Server Component

Rejected. Authorization and DTO rules would be duplicated and private records could cross client boundaries accidentally.

### Internal HTTP calls from Server Components

Rejected. Calls add latency and duplicate public-boundary behavior without providing a separate deployment boundary.

## Consequences

- Authorization stays close to every data read and mutation.
- Database and filesystem integrations cannot enter client bundles.
- Future extraction remains possible because domain modules are separate from routes.
