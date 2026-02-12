# Cloudify Backend Architecture Redesign Specification

**Author**: Senior Product Owner / Principal Architect
**Philosophy**: "We make the complex simple, not by ignoring complexity, but by managing it elegantly behind clean interfaces."
**Date**: 2026-02-12
**Scope**: Complete backend, API layer, data model, and system architecture audit

---

## Executive Summary

Cloudify is a functional deployment platform with real infrastructure (PostgreSQL, Redis, MinIO, K8s). The bones are solid. However, examined through the lens of Apple's engineering standards -- where every API call is predictable, every error is actionable, and every surface is consistent -- there are systemic issues that prevent this from being a platform developers trust implicitly.

**Critical findings**:
1. **Authorization is theatrical** -- `requireReadAccess` and `requireWriteAccess` are identical functions that only check authentication, not authorization
2. **Response shapes are inconsistent** -- some routes return raw arrays, others wrap in objects, error formats vary between routes
3. **Dual deployment APIs** -- `/api/deploy` and `/api/deployments` overlap, creating consumer confusion
4. **Rate limiting is in-memory only** -- lost on restart, not shared across instances
5. **Dual session systems** -- NextAuth JWT and custom JWT sessions running in parallel
6. **No request-level RBAC** -- team role checks are ad hoc, scattered across individual routes
7. **Database has deprecated columns** -- `commitMsg` vs `commitMessage` duplication
8. **N+1 patterns exist** -- several routes make sequential queries where batch operations would suffice

**What works well**:
- Build executor security (Docker isolation, command whitelisting, path traversal prevention)
- Structured logging with correlation IDs
- Error response system (standardized codes, request IDs for 500s)
- Webhook signature verification (HMAC with timing-safe comparison)
- Multi-stage Dockerfile with non-root user
- Health check endpoint with dependency checks

---

## Section 1: API Design Standards

### 1.1 Response Envelope Format

**Problem**: Some routes return `NextResponse.json(domains)` (raw array), others return `{ projects, pagination }`, others return `{ success: true, deployment }`. A consumer cannot predict the shape.

**Apple Standard**: Every response, success or failure, shares the same envelope. Think CloudKit's `CKRecordZone` responses -- always predictable.

**Redesign**: Standardize ALL responses through a single envelope.

```typescript
// File: lib/api/response.ts

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

interface ApiError {
  code: string;           // Machine-readable: "VALIDATION_ERROR", "NOT_FOUND"
  message: string;        // Human-readable: "Project name is required"
  details?: unknown;      // Developer details: field errors, constraint info
  requestId: string;      // Always present for traceability
}

interface ResponseMeta {
  pagination?: CursorPagination;
  rateLimit?: RateLimitInfo;
  timing?: { durationMs: number };
}

interface CursorPagination {
  cursor?: string;        // Opaque cursor for next page
  hasMore: boolean;
  total?: number;         // Optional total count (expensive for large datasets)
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;        // ISO 8601 timestamp
}
```

**Success response**:
```json
{
  "ok": true,
  "data": { "id": "proj_abc", "name": "My App" },
  "meta": {
    "timing": { "durationMs": 12 }
  }
}
```

**List response**:
```json
{
  "ok": true,
  "data": [{ "id": "proj_abc" }, { "id": "proj_def" }],
  "meta": {
    "pagination": { "cursor": "eyJpZCI6InByb2pfZGVmIn0", "hasMore": true, "total": 47 },
    "timing": { "durationMs": 23 }
  }
}
```

**Error response**:
```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "fields": [
        { "field": "name", "message": "Project name is required" }
      ]
    },
    "requestId": "req_a1b2c3d4"
  }
}
```

**Implementation**: Create response helpers in `lib/api/response.ts`:

```typescript
// File: lib/api/response.ts

import { NextResponse } from "next/server";

export function success<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function list<T>(items: T[], pagination: CursorPagination): NextResponse {
  return NextResponse.json({
    ok: true,
    data: items,
    meta: { pagination },
  });
}

export function error(
  status: number,
  code: string,
  message: string,
  details?: unknown
): NextResponse {
  return NextResponse.json({
    ok: false,
    error: { code, message, details, requestId: generateRequestId() },
  }, { status });
}
```

**Files to modify**: Every file in `app/api/` (97 route files). This is a P0 change -- do it incrementally, route group by route group.

### 1.2 Pagination: Cursor-Based

**Problem**: Routes mix `page`/`limit` (offset-based) with `offset`/`limit`. Some use cursors, some don't. The `/api/projects` route uses `page`, the `/api/deploy` GET uses `offset`, and `/api/storage/kv` uses `cursor`.

**Apple Standard**: Cursor-based pagination everywhere. Offset pagination breaks when data changes between requests (items shift, duplicates appear). Apple's CloudKit API uses opaque continuation tokens.

**Redesign**:

```typescript
// File: lib/api/pagination.ts

interface PaginationParams {
  cursor?: string;
  limit: number;  // Default 20, max 100
}

function decodeCursor(cursor: string): { id: string; createdAt: Date } {
  const decoded = Buffer.from(cursor, "base64url").toString();
  return JSON.parse(decoded);
}

function encodeCursor(record: { id: string; createdAt: Date }): string {
  return Buffer.from(
    JSON.stringify({ id: record.id, createdAt: record.createdAt })
  ).toString("base64url");
}

// Usage in Prisma queries:
function buildCursorWhere(cursor?: string) {
  if (!cursor) return {};
  const { id, createdAt } = decodeCursor(cursor);
  return {
    OR: [
      { createdAt: { lt: createdAt } },
      { createdAt, id: { lt: id } },
    ],
  };
}
```

**Priority**: P1 -- implement alongside response envelope migration.

### 1.3 Filtering and Sorting

**Problem**: Filtering is inconsistent. `/api/deployments` allows `status` filter as a query param. `/api/deploy` GET overloads between single-fetch and list-fetch via the same endpoint.

**Apple Standard**: Filtering via structured query parameters. Sorting via `sort` parameter.

```
GET /api/deployments?status=READY&sort=-createdAt&cursor=abc&limit=20
GET /api/projects?framework=nextjs&sort=name
```

**Conventions**:
- Filter by exact match: `?status=READY`
- Filter by multiple values: `?status=READY,BUILDING`
- Sort ascending: `?sort=name`
- Sort descending: `?sort=-createdAt`
- Nested resource filtering: `?projectId=proj_abc`

### 1.4 Rate Limiting Strategy

**Problem**: Rate limiting is in-memory (`Map<string, RateLimitEntry>`) in `lib/auth/rate-limit.ts`. This is lost on process restart and not shared across multiple instances. Only auth endpoints use it. General API routes have no rate limiting.

**Apple Standard**: Rate limiting is infrastructure, not application code. Every API response includes rate limit headers.

**Redesign**:

```typescript
// File: lib/security/redis-rate-limit.ts (already exists but underused)

// Rate limit tiers by auth level
const RATE_TIERS = {
  anonymous:    { requests: 60,   windowSeconds: 60 },
  free:         { requests: 100,  windowSeconds: 60 },
  pro:          { requests: 500,  windowSeconds: 60 },
  team:         { requests: 1000, windowSeconds: 60 },
  enterprise:   { requests: 5000, windowSeconds: 60 },
} as const;

// Sensitive endpoints get tighter limits
const ENDPOINT_OVERRIDES: Record<string, { requests: number; windowSeconds: number }> = {
  "POST /api/auth":                { requests: 5,  windowSeconds: 60 },
  "POST /api/auth/forgot-password": { requests: 3,  windowSeconds: 300 },
  "POST /api/deploy":              { requests: 10, windowSeconds: 60 },
  "POST /api/webhooks/*":          { requests: 30, windowSeconds: 60 },
};
```

**Response headers** (on every response):
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2026-02-12T10:30:00Z
Retry-After: 13  (only on 429)
```

**Implementation**: Add rate limiting as middleware in `middleware.ts` for API routes, using Redis sliding window. Move from in-memory `Map` to Redis `MULTI/EXEC` with `EXPIRE`.

**Files to modify**:
- `middleware.ts` -- add API rate limiting path
- `lib/security/redis-rate-limit.ts` -- use as primary rate limiter
- `lib/auth/rate-limit.ts` -- deprecate, keep as fallback when Redis is down

**Priority**: P0 -- security requirement.

### 1.5 API Versioning

**Problem**: No versioning. All routes are at `/api/*`. Breaking changes will break all consumers simultaneously.

**Apple Standard**: Version in the URL path. Apple uses `/v1/`, `/v2/` etc. The current API becomes v1. New, breaking-change APIs go to v2.

**Redesign**: For now, do NOT add versioning overhead. The platform is pre-1.0. Instead:
1. Add an `API-Version` response header: `API-Version: 2026-02-12`
2. Document that the current API is "preview" and may have breaking changes
3. When the API stabilizes, move to `/api/v1/` with the existing routes

**Priority**: P2 -- defer until post-launch stabilization.

---

## Section 2: Data Model Redesign

### 2.1 Models to Keep (No Changes)

| Model | Verdict | Reasoning |
|-------|---------|-----------|
| `User` | Keep | Well-structured with billing, onboarding fields |
| `Team` | Keep | Clean team model |
| `TeamMember` | Keep | Good composite unique on `[teamId, userId]` |
| `TeamInvitation` | Keep | Proper status tracking and expiry |
| `TeamProject` | Keep | Clean junction table |
| `Domain` | Keep | Good domain management with verification |
| `AcmeAccount` | Keep | Necessary for Let's Encrypt automation |
| `FeatureFlag` | Keep | Well-designed with rollout percentage |

### 2.2 Models to Fix

#### Deployment -- Remove Deprecated Column

**Problem**: Both `commitMsg` and `commitMessage` exist. The schema says `commitMsg` is deprecated but both are used.

```prisma
// CURRENT (bad)
commitMessage String?  @db.Text
commitMsg     String?  // Deprecated, use commitMessage

// REDESIGN
commitMessage String?  @db.Text
// Remove commitMsg entirely
```

**Files to update**:
- `prisma/schema.prisma` -- remove `commitMsg`
- `app/api/deploy/route.ts:114` -- change `commitMsg` to `commitMessage`
- `app/api/deployments/route.ts:63` -- change `commitMsg` references
- `app/api/webhooks/github/route.ts:167` -- change `commitMsg` to `commitMessage`

**Migration**: `ALTER TABLE "Deployment" DROP COLUMN "commitMsg"` after migrating data:
```sql
UPDATE "Deployment" SET "commitMessage" = "commitMsg" WHERE "commitMessage" IS NULL AND "commitMsg" IS NOT NULL;
```

**Priority**: P0 -- data integrity.

#### User -- Consolidate Image Fields

**Problem**: `avatar` and `image` fields both exist. `image` is for NextAuth, `avatar` is custom. The auth code does `session.user.image = dbUser.image || dbUser.avatar`.

```prisma
// CURRENT
avatar  String?
image   String?  // NextAuth OAuth profile image

// REDESIGN -- keep only image, migrate avatar data
image   String?  // Profile image (from OAuth or uploaded)
// Remove avatar
```

**Migration**:
```sql
UPDATE "User" SET "image" = "avatar" WHERE "image" IS NULL AND "avatar" IS NOT NULL;
ALTER TABLE "User" DROP COLUMN "avatar";
```

**Files to update**:
- `prisma/schema.prisma`
- `lib/auth/next-auth.ts:49,69` -- remove avatar fallback
- `lib/auth/session.ts:41,98` -- remove avatar field
- `app/api/teams/route.ts` -- update user select to use `image`

**Priority**: P1.

#### Session -- Consolidate with NextAuth

**Problem**: Two session systems exist: NextAuth JWT sessions and a custom `Session` model with JWT tokens. This is confusing and creates two attack surfaces.

**Redesign**: Keep NextAuth as the sole session mechanism. Remove the custom `Session` model and `lib/auth/session.ts`. The custom session was needed before NextAuth was added -- it is now redundant.

**Files to remove/modify**:
- `lib/auth/session.ts` -- deprecate, redirect to NextAuth
- `lib/auth/api-auth.ts` -- remove `getSessionFromRequest` fallback
- `app/api/auth/route.ts` -- migrate to NextAuth only
- Remove `Session` model from `prisma/schema.prisma`

**Priority**: P1 -- security simplification.

#### Account -- Add Missing Index

**Problem**: The `Account` model has `@@index([userId])` but queries also filter by `provider`. The OAuth lookup pattern `findUnique({ provider, providerAccountId })` is covered by the composite unique, but listing accounts by user+provider is not indexed.

```prisma
// ADD
@@index([userId, provider])
```

**Priority**: P2 -- performance.

### 2.3 Missing Indexes for Query Performance

After analyzing the API routes and their Prisma queries, these indexes are missing:

```prisma
// Deployment: frequently queried by projectId + status + isActive together
model Deployment {
  // existing indexes are good, but add:
  @@index([projectId, branch])          // For webhook branch matching
  @@index([siteSlug])                    // For site lookup by slug
}

// Activity: filtered by userId + type + createdAt for activity feeds
model Activity {
  // existing indexes are good, add composite:
  @@index([userId, type, createdAt])    // Activity feed queries
  @@index([projectId, type, createdAt]) // Project activity queries
}

// UsageRecord: aggregated by userId + type within date ranges
model UsageRecord {
  // existing indexes are good, add:
  @@index([userId, type, recordedAt])   // Aggregation queries
}

// AnalyticsEvent: high-volume, needs better indexing
model AnalyticsEvent {
  @@index([projectId, type, createdAt]) // Event type filtering
  @@index([visitorId, createdAt])       // Visitor tracking
}

// Notification: filtered by read status
model Notification {
  @@index([userId, read, createdAt])    // Unread notifications feed
}

// WebVital: aggregated by metric
model WebVital {
  @@index([projectId, metric, rating])  // Rating distribution queries
}
```

**Priority**: P1 -- performance.

### 2.4 Enum Consolidation

**Problem**: String-typed columns used as enums without Prisma enum definitions. This means no database-level constraint enforcement.

**Current string-type fields that should be enums**:

```prisma
// ADD these enums
enum SSLStatus {
  PENDING
  PROVISIONING
  ACTIVE
  ERROR
}

enum TeamRole {
  VIEWER
  MEMBER
  DEVELOPER
  ADMIN
  OWNER
}

enum InvitationStatus {
  PENDING
  ACCEPTED
  DECLINED
  EXPIRED
}

enum UsageType {
  BUILD_MINUTES
  BANDWIDTH
  REQUESTS
  FUNCTION_INVOCATIONS
  BLOB_STORAGE
  DEPLOYMENTS
}

enum DatabaseStatus {
  PROVISIONING
  ACTIVE
  ERROR
  SUSPENDED
}

enum DatabaseType {
  POSTGRESQL
  MYSQL
  REDIS
  MONGODB
}

enum PlanType {
  FREE
  PRO
  TEAM
  ENTERPRISE
}

enum NotificationChannel {
  EMAIL
  SLACK
  WEBHOOK
}
```

**Apply to models**:
```prisma
model Domain {
  sslStatus SSLStatus @default(PENDING)  // was String
}

model TeamMember {
  role TeamRole @default(MEMBER)  // was String
}

model User {
  plan PlanType @default(FREE)  // was String
}
```

**Priority**: P1 -- data integrity. Migrate incrementally.

### 2.5 Naming Convention Standardization

**Problem**: Mixed naming conventions:
- `commitMsg` vs `commitMessage` (abbreviated vs full)
- `buildCmd` vs `installCmd` (abbreviated)
- `envVars` on `ServerlessFunction` is `Json?` while `EnvVariable` is a separate model for projects

**Apple Standard**: Full, descriptive names. No abbreviations.

**Recommended renames** (via Prisma `@map` to avoid breaking DB):

```prisma
model Project {
  buildCommand   String @default("npm run build")  @map("buildCmd")
  installCommand String @default("npm install")    @map("installCmd")
  outputDirectory String @default(".next")          @map("outputDir")
  rootDirectory   String @default("./")             @map("rootDir")
  repositoryUrl   String?                           @map("repoUrl")
  repositoryBranch String @default("main")          @map("repoBranch")
}
```

**Priority**: P2 -- use `@map` for backwards compatibility so the DB column names stay the same while the Prisma client uses clean names.

---

## Section 3: Authentication & Authorization

### 3.1 The Core Problem

`requireReadAccess` and `requireWriteAccess` are **identical functions** that both just call `requireAuth`. There is no actual access control -- any authenticated user can read or write anything, as long as they pass the auth check.

```typescript
// CURRENT -- these are the same function
export async function requireReadAccess(request: NextRequest) {
  return requireAuth(request);  // Just checks if user is logged in
}
export async function requireWriteAccess(request: NextRequest) {
  return requireAuth(request);  // Same thing
}
```

The actual ownership checks happen inside each route handler with ad hoc `project.userId === user.id` checks. Some routes (like `/api/deployments/[id]`) check ownership; others (like the domains GET) use `where: { project: { userId: user.id } }` which silently returns empty results instead of 403.

### 3.2 RBAC Redesign

**Apple Standard**: Authorization is declarative, not imperative. You declare what access a route requires, and the framework enforces it.

```typescript
// File: lib/auth/rbac.ts

/**
 * Permission definitions -- what each role can do
 */
const PERMISSIONS = {
  // Project permissions
  "project:read":      ["viewer", "member", "developer", "admin", "owner"],
  "project:write":     ["member", "developer", "admin", "owner"],
  "project:delete":    ["admin", "owner"],
  "project:settings":  ["admin", "owner"],

  // Deployment permissions
  "deploy:read":       ["viewer", "member", "developer", "admin", "owner"],
  "deploy:create":     ["developer", "admin", "owner"],
  "deploy:cancel":     ["developer", "admin", "owner"],
  "deploy:rollback":   ["admin", "owner"],
  "deploy:promote":    ["admin", "owner"],

  // Domain permissions
  "domain:read":       ["viewer", "member", "developer", "admin", "owner"],
  "domain:create":     ["admin", "owner"],
  "domain:delete":     ["admin", "owner"],

  // Storage permissions
  "storage:read":      ["member", "developer", "admin", "owner"],
  "storage:write":     ["developer", "admin", "owner"],
  "storage:delete":    ["admin", "owner"],

  // Team permissions
  "team:read":         ["viewer", "member", "developer", "admin", "owner"],
  "team:invite":       ["admin", "owner"],
  "team:remove":       ["admin", "owner"],
  "team:settings":     ["owner"],

  // Billing permissions
  "billing:read":      ["admin", "owner"],
  "billing:write":     ["owner"],

  // Admin permissions
  "admin:read":        ["owner"],
  "admin:write":       ["owner"],
} as const;

type Permission = keyof typeof PERMISSIONS;

/**
 * Check if a role has a specific permission
 */
function hasPermission(role: string, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(role as any);
}

/**
 * Authorization middleware that checks project-level access
 */
export async function requireProjectAccess(
  request: NextRequest,
  projectId: string,
  permission: Permission
): Promise<{ user: AuthUser; access: ProjectAccess } | NextResponse> {
  const authResult = await requireAuth(request);
  if (isAuthError(authResult)) return authResult;

  const { user } = authResult;
  const access = await checkProjectAccess(user.id, projectId);

  if (!access.hasAccess) {
    return forbidden("You do not have access to this project");
  }

  // Project owner has all permissions
  if (access.isOwner) {
    return { user, access };
  }

  // Check team role permission
  const role = access.teamRole || "viewer";
  if (!hasPermission(role, permission)) {
    return forbidden(
      `This action requires ${permission} permission. Your role (${role}) does not have this permission.`
    );
  }

  return { user, access };
}
```

**Usage in routes**:
```typescript
// BEFORE (ad hoc, scattered ownership checks)
export async function DELETE(request: NextRequest, { params }) {
  const authResult = await requireWriteAccess(request);  // Just checks auth
  if (isAuthError(authResult)) return authResult;
  const { user } = authResult;

  const project = await prisma.project.findUnique({ where: { id } });
  if (project.userId !== user.id) {  // Manual ownership check
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}

// AFTER (declarative)
export async function DELETE(request: NextRequest, { params }) {
  const { id } = await params;
  const result = await requireProjectAccess(request, id, "project:delete");
  if (isAuthError(result)) return result;

  const { user } = result;
  // Access is already verified -- proceed with deletion
}
```

**Files to modify**:
- `lib/auth/api-auth.ts` -- add `requireProjectAccess`
- `lib/auth/rbac.ts` -- new file with permission definitions
- All route files that do manual ownership checks (approximately 40 files)

**Priority**: P0 -- security.

### 3.3 Session Management

**Problem**: Two parallel session systems (NextAuth + custom JWT). The custom `Session` model stores sessions in PostgreSQL and issues JWTs. NextAuth also uses JWT strategy.

**Redesign**:
1. **Keep NextAuth as the sole auth provider**
2. **Remove the custom session system** (`lib/auth/session.ts`, `Session` model)
3. **Use NextAuth's built-in session management** for all auth flows
4. **Add session metadata** to NextAuth (user agent, IP, last active) via custom token fields

**Migration path**:
1. Verify all auth consumers use `getAuthUser()` which already tries NextAuth first
2. Remove `getSessionFromRequest` fallback
3. Drop the `Session` model after confirming no routes depend on it
4. Move the custom `/api/auth` login endpoint to use NextAuth's `signIn`

**Priority**: P1.

### 3.4 Security Headers

**Current state**: Good. The middleware applies CSP, X-Frame-Options, HSTS, etc. One improvement needed:

```typescript
// ADD to CSP
"upgrade-insecure-requests",  // Force HTTPS for all sub-resources in production
```

**Also add** to API responses:
```
X-Request-Id: req_abc123  // Correlation ID for every request
```

**Priority**: P2.

---

## Section 4: API Route Audit

### 4.1 Authentication Routes (`/api/auth/*`)

**Current state**:
- `POST /api/auth` -- custom login endpoint (creates custom JWT session)
- `GET /api/auth/me` -- returns current user
- `/api/auth/[...nextauth]` -- NextAuth catch-all
- `/api/auth/forgot-password` -- password reset request
- `/api/auth/reset-password` -- password reset execution

**Apple critique**:
- Custom login endpoint duplicates NextAuth's `signIn` functionality
- Two auth systems means two security surfaces to audit
- `/api/auth/me` returns the full user object without field selection

**Redesign**:
1. Remove custom `POST /api/auth` -- use NextAuth `signIn("credentials")` exclusively
2. Keep `/api/auth/me` but standardize response:
   ```json
   { "ok": true, "data": { "id": "...", "email": "...", "name": "...", "plan": "free", "image": null } }
   ```
3. Add rate limiting to password endpoints (already exists but uses in-memory store -- move to Redis)

**Priority**: P0.

### 4.2 Project Routes (`/api/projects/*`)

**Current state**:
- `GET /api/projects` -- list user's projects (offset pagination)
- `POST /api/projects` -- create project
- `GET /api/projects/[id]` -- get single project
- `PATCH /api/projects/[id]` -- update project
- `DELETE /api/projects/[id]` -- delete project
- `GET /api/projects/by-slug/[slug]` -- lookup by slug
- `POST /api/projects/clone` -- clone a project

**Apple critique**:
- Offset pagination instead of cursor-based
- `GET /api/projects` returns deployment data via eager loading (N+1 potential)
- `POST /api/projects` does slug collision detection with a single findUnique, but doesn't handle race conditions

**Redesign**:
1. Switch to cursor-based pagination
2. Use `select` to limit deployment data in list endpoint
3. Add `IF NOT EXISTS` semantics or use Prisma upsert for slug creation
4. Standardize response envelope

**Specific code changes for `app/api/projects/route.ts`**:
```typescript
// BEFORE: offset pagination
const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));
const skip = (page - 1) * limit;

// AFTER: cursor pagination
const cursor = searchParams.get("cursor");
const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
const cursorWhere = cursor ? buildCursorWhere(cursor) : {};
```

**Priority**: P1.

### 4.3 Deployment Routes (`/api/deploy`, `/api/deployments/*`)

**Current state**: **Two overlapping route groups**.
- `/api/deploy` -- POST (create deployment), GET (list/get deployments), DELETE (cancel)
- `/api/deployments` -- GET (list deployments with different format)
- `/api/deployments/[id]` -- GET, PATCH, DELETE
- `/api/deployments/[id]/logs` -- GET
- `/api/deployments/[id]/rollback` -- POST
- `/api/deployments/[id]/cancel` -- POST
- `/api/deployments/[id]/trigger` -- POST
- `/api/deployments/[id]/stream` -- SSE stream
- `/api/deployments/[id]/diff` -- GET

**Apple critique**: This is the biggest API design violation. Two separate route groups (`/deploy` and `/deployments`) serve overlapping purposes with different response shapes. `/api/deploy` GET returns `{ deployment }` or `{ deployments }` depending on params. `/api/deployments` GET returns `{ deployments }` with a completely different shape (formatted for frontend). A consumer cannot tell which to use.

**Redesign**: Consolidate into a single resource under `/api/deployments`:

```
POST   /api/deployments              -- Create deployment (was POST /api/deploy)
GET    /api/deployments              -- List deployments
GET    /api/deployments/:id          -- Get single deployment
PATCH  /api/deployments/:id          -- Update deployment
DELETE /api/deployments/:id          -- Delete/cancel deployment
POST   /api/deployments/:id/cancel   -- Cancel (keep as explicit action)
POST   /api/deployments/:id/rollback -- Rollback
GET    /api/deployments/:id/logs     -- Get logs
GET    /api/deployments/:id/logs/stream -- SSE stream
POST   /api/deployments/:id/trigger  -- Re-trigger
GET    /api/deployments/:id/diff     -- Diff between deployments
```

**Remove**: `/api/deploy` route entirely. Redirect requests for backwards compatibility.

**Response standardization**: Both list endpoints return different shapes. Standardize:
```json
{
  "ok": true,
  "data": [{
    "id": "depl_abc",
    "projectId": "proj_def",
    "project": { "name": "My App", "slug": "my-app" },
    "status": "ready",
    "branch": "main",
    "commitSha": "abc1234",
    "commitMessage": "Fix login bug",
    "url": "https://my-app.tranthachnguyen.com",
    "buildTimeSeconds": 42,
    "isActive": true,
    "isPreview": false,
    "createdAt": "2026-02-12T10:00:00Z",
    "finishedAt": "2026-02-12T10:00:42Z"
  }],
  "meta": { "pagination": { "cursor": "...", "hasMore": true } }
}
```

**Files to modify**:
- `app/api/deploy/route.ts` -- migrate POST logic to `/api/deployments`, add redirect
- `app/api/deployments/route.ts` -- merge POST creation logic, standardize list format
- `app/api/deployments/[id]/route.ts` -- standardize single-fetch response

**Priority**: P0 -- API clarity.

### 4.4 Domain Routes (`/api/domains/*`)

**Current state**:
- `GET /api/domains` -- list domains (returns raw array, no pagination)
- `POST /api/domains` -- create domain
- `GET /api/domains/[id]` -- get domain
- `DELETE /api/domains/[id]` -- delete domain
- `POST /api/domains/[id]/verify` -- verify domain
- `POST /api/domains/[id]/ssl` -- provision SSL

**Apple critique**:
- `GET /api/domains` returns a raw array `NextResponse.json(domains)` with no envelope
- No pagination for domains
- Missing `PATCH` endpoint for updating domain settings
- Ownership check uses `project: { userId: user.id }` which silently filters instead of returning 403

**Redesign**:
1. Wrap in response envelope
2. Add cursor pagination (even if most users have few domains)
3. Add explicit 404 when accessing domain from another user's project
4. Add `PATCH /api/domains/[id]` for configuration updates

**Priority**: P1.

### 4.5 Team Routes (`/api/teams/*`)

**Current state**:
- `GET /api/teams` -- list teams (returns formatted array, no pagination, no envelope)
- `POST /api/teams` -- create team (returns status 200 instead of 201)
- `GET /api/teams/[id]` -- get team details
- `PATCH /api/teams/[id]` -- update team
- `DELETE /api/teams/[id]` -- delete team
- `GET /api/teams/[id]/members` -- list members
- `POST /api/teams/[id]/members` -- add member (via invitation?)
- `GET /api/teams/[id]/invitations` -- list invitations
- `POST /api/teams/[id]/invitations` -- create invitation

**Apple critique**:
- `POST /api/teams` returns `200` instead of `201`
- Team list includes all members with full user details -- potentially expensive
- Slug generation loop (`while (await prisma.team.findUnique({ where: { slug } }))`) is a race condition

**Redesign**:
1. Return `201` for creation
2. Use `select` to limit member data in list endpoint
3. Use `try/catch` with Prisma unique constraint instead of pre-check loop for slug uniqueness
4. Add team-level RBAC checks

**Priority**: P1.

### 4.6 Storage Routes (`/api/storage/*`)

**Current state**:
- `/api/storage/kv` -- KV operations (GET, POST, DELETE)
- `/api/storage/blobs` -- Blob operations

**Apple critique**:
- The KV route overloads `POST` for 7 different operations (create store, set key, batch set, increment, expire, restore, batch set). This violates REST conventions.
- Error responses are raw `NextResponse.json({ error: "..." })` instead of using the standardized error helpers

**Redesign**: Split KV operations into proper RESTful endpoints:

```
POST   /api/storage/kv/stores                -- Create store
GET    /api/storage/kv/stores                -- List stores
DELETE /api/storage/kv/stores/:id            -- Delete store
GET    /api/storage/kv/stores/:id/keys       -- List keys
GET    /api/storage/kv/stores/:id/keys/:key  -- Get key
PUT    /api/storage/kv/stores/:id/keys/:key  -- Set key
DELETE /api/storage/kv/stores/:id/keys/:key  -- Delete key
POST   /api/storage/kv/stores/:id/batch      -- Batch operations
POST   /api/storage/kv/stores/:id/restore    -- Restore from Postgres
```

**Priority**: P1.

### 4.7 Billing Routes (`/api/billing/*`)

**Current state**: Well-structured. `GET /api/billing` returns comprehensive subscription and usage data.

**Apple critique**: Minor -- response doesn't use the standard envelope.

**Priority**: P2.

### 4.8 Webhook Routes (`/api/webhooks/*`)

**Current state**: Well-implemented. GitHub webhook has HMAC signature verification, event-based dispatching, commit status updates.

**Apple critique**: Good security. Minor improvements:
1. Add idempotency check using `x-github-delivery` ID to prevent duplicate processing
2. Move response to standard envelope

**Files to modify**:
- `app/api/webhooks/github/route.ts` -- add delivery ID deduplication via Redis

**Priority**: P2.

### 4.9 Health Routes (`/api/health/*`)

**Current state**: Excellent. Checks database, Redis, MinIO, and build pipeline. Returns structured health status with latency metrics.

**Apple critique**: This is well-designed. One improvement:
- Add `/api/health/live` for Kubernetes liveness probe (just returns 200, no dependency checks)
- Keep `/api/health` as the deep health check for readiness
- The `/api/health/ready` already exists but should be the standard readiness endpoint

**Priority**: P2.

### 4.10 Analytics Routes (`/api/analytics/*`)

**Current state**:
- `GET /api/analytics` -- get analytics data
- `POST /api/analytics/ingest` -- ingest analytics events
- `GET /api/analytics/realtime` -- SSE for real-time analytics
- `GET /api/analytics/script/[projectId]` -- serve analytics tracking script
- `GET /api/analytics/usage-stats` -- usage statistics

**Apple critique**: The analytics ingest endpoint lacks rate limiting -- a critical omission since it's called from client-side JavaScript and could be used for DoS.

**Redesign**:
1. Add aggressive rate limiting to `POST /api/analytics/ingest` (1000/min per project)
2. Add request body size validation
3. Consider moving to a dedicated analytics service or batch ingestion

**Priority**: P1 -- performance and security.

---

## Section 5: Service Layer Architecture

### 5.1 Current Organization

```
lib/
  analytics/     -- Analytics injection
  api/           -- API utilities (error response, cache, logger, parse-body)
  audit/         -- Audit log helpers
  auth/          -- Authentication (NextAuth, session, rate-limit, RBAC)
  billing/       -- Stripe integration, pricing, metering
  build/         -- Build executor, K8s worker, site deployer, artifact manager
  cron/          -- Cron job management
  database/      -- Managed database operations
  deployments/   -- Deployment helpers
  domains/       -- Domain management, ACME/SSL
  edge/          -- Edge function execution
  functions/     -- Serverless function execution
  images/        -- Image optimization
  integrations/  -- GitHub, Cloudflare, Sentry, Datadog, Slack
  isr/           -- Incremental Static Regeneration
  logging/       -- Structured logging
  monitoring/    -- Metrics and monitoring
  notifications/ -- Multi-channel notifications
  preview/       -- Preview deployment management
  realtime/      -- SSE/WebSocket events
  security/      -- Input validation, CSRF, rate limiting
  storage/       -- Redis client, Blob service, KV service
  utils/         -- General utilities
  prisma.ts      -- Prisma client singleton
  utils.ts       -- Legacy utilities
```

**Apple critique**: The organization is good. Each domain has its own directory. The main issues are:
1. **No dependency injection** -- services directly import Prisma, Redis, MinIO clients
2. **No service boundaries** -- any module can import any other module
3. **Two utility locations** -- `lib/utils.ts` and `lib/utils/`
4. **Missing error propagation strategy** -- some services throw, some return booleans, some return `{ success, error }`

### 5.2 Service Boundaries

**Apple Standard**: Each service module has a clear contract. Services communicate through well-defined interfaces, not by reaching into each other's internals.

**Proposed service boundaries**:

```
lib/
  core/
    prisma.ts           -- Database client (keep as is)
    redis.ts            -- Redis client (keep as is)
    config.ts           -- Environment config validation (NEW)

  auth/                 -- Authentication boundary
    index.ts            -- Public API: getAuthUser, requireAuth, requireProjectAccess
    next-auth.ts        -- NextAuth configuration (internal)
    rbac.ts             -- Permission definitions (internal)
    password.ts         -- Password hashing (internal)

  projects/             -- Project management boundary
    service.ts          -- createProject, updateProject, deleteProject
    types.ts            -- Project types and interfaces

  deployments/          -- Deployment boundary
    service.ts          -- createDeployment, cancelDeployment, rollbackDeployment
    build-executor.ts   -- Build execution (internal)
    site-deployer.ts    -- K8s site deployment (internal)
    artifact-manager.ts -- MinIO artifact management (internal)

  billing/              -- Billing boundary
    service.ts          -- getSubscription, createCheckout, cancelSubscription
    metering.ts         -- Usage tracking (internal)
    pricing.ts          -- Plan definitions (internal)
    stripe.ts           -- Stripe SDK wrapper (internal)

  storage/              -- Storage boundary
    blob-service.ts     -- Blob storage operations
    kv-service.ts       -- KV store operations
    redis-client.ts     -- Redis connection (internal)
```

**Priority**: P2 -- refactoring.

### 5.3 Error Propagation Strategy

**Problem**: Mixed error patterns across services:
- `build/executor.ts` returns `boolean` (success/fail, error details lost)
- `build/site-deployer.ts` returns `{ success: boolean; error?: string }`
- `billing/metering.ts` returns data objects (no error indication)
- Some services throw exceptions, some return error objects

**Apple Standard**: Use a Result type pattern consistently.

```typescript
// File: lib/core/result.ts

type Result<T, E = Error> =
  | { ok: true; data: T }
  | { ok: false; error: E };

// Usage in services:
async function createDeployment(config: DeployConfig): Promise<Result<Deployment, ApiError>> {
  const project = await prisma.project.findUnique({ where: { id: config.projectId } });
  if (!project) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Project not found" } };
  }
  // ...
  return { ok: true, data: deployment };
}

// In routes:
const result = await createDeployment(config);
if (!result.ok) {
  return error(404, result.error.code, result.error.message);
}
return success(result.data, 201);
```

**Priority**: P2 -- adopt incrementally as services are touched.

### 5.4 Configuration Validation

**Problem**: Environment variables are accessed via `process.env.X || "fallback"` scattered throughout the codebase. Missing required variables fail silently at runtime.

**Redesign**: Create a validated configuration module that fails at startup.

```typescript
// File: lib/core/config.ts

import { z } from "zod";

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),

  // Required in production
  JWT_SECRET: z.string().min(32).optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),

  // Optional with defaults
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  BASE_DOMAIN: z.string().default("tranthachnguyen.com"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  USE_K3S_BUILDS: z.coerce.boolean().default(false),
  USE_DOCKER_ISOLATION: z.coerce.boolean().default(true),
});

export const config = envSchema.parse(process.env);
```

**Files to modify**: All files that access `process.env` directly (approximately 30 files).

**Priority**: P1 -- operational reliability.

### 5.5 Testing Strategy

**Current state**: Test infrastructure exists (`vitest.config.ts`, `test/`, `e2e/`) but no tests were observed in the API routes or services.

**Apple Standard**: Every service has unit tests. Every API route has integration tests.

**Testing pyramid**:
```
E2E Tests (Playwright)
  - Happy path flows: signup -> create project -> deploy -> verify site
  - Billing flow: upgrade plan -> verify limits increase

Integration Tests (Vitest + test database)
  - Each API route: auth, validation, happy path, error cases
  - Webhook handling: signature verification, event processing

Unit Tests (Vitest)
  - lib/security/validation.ts -- input sanitization
  - lib/billing/pricing.ts -- plan calculations
  - lib/auth/rbac.ts -- permission checks
  - lib/build/executor.ts -- command validation
```

**Priority**: P1 -- testing is the foundation of reliable deploys.

---

## Section 6: Build Pipeline & Deploy Architecture

### 6.1 Current Flow

```
User/Webhook → POST /api/deploy → Create Deployment record →
  triggerBuild (fire-and-forget) →
    cloneRepo → runInstall (Docker isolated) → runBuild (Docker isolated) →
    copyOutput → uploadToMinIO (if K3s) →
    deploySite (K8s deployment + service + DNS) →
    updateStatus(READY)
```

**What works well**:
- Docker isolation for builds (memory/CPU/PID limits, no network, read-only root)
- Command whitelisting with dangerous pattern detection
- Path traversal prevention in output copying
- Build cache volumes per project (node_modules, .next/cache)
- Separate init container fetches artifacts from MinIO
- Cloudflare DNS record automation for subdomains

### 6.2 Build Pipeline Improvements

#### 6.2.1 Build Queue Management

**Problem**: Builds are "fire and forget" -- `triggerBuild(deployment.id).catch(...)`. There's no queue, no concurrency control, no priority. If 10 users trigger builds simultaneously, all 10 run in parallel.

**Redesign**: Implement a proper build queue using Redis (BullMQ pattern):

```typescript
// File: lib/build/queue.ts

import { getRedisClient } from "@/lib/storage/redis-client";

interface BuildJob {
  deploymentId: string;
  projectId: string;
  userId: string;
  priority: number;  // 0 = highest
  createdAt: string;
}

// Use Redis sorted set as priority queue
// Score = timestamp + priority offset
async function enqueueJob(job: BuildJob): Promise<void> {
  const redis = getRedisClient();
  const score = Date.now() + (job.priority * 100000);
  await redis.zadd("build:queue", score, JSON.stringify(job));
  await redis.publish("build:new", job.deploymentId);
}

async function dequeueJob(): Promise<BuildJob | null> {
  const redis = getRedisClient();
  // Atomically pop the lowest-scored (highest priority, oldest) job
  const results = await redis.zpopmin("build:queue", 1);
  if (results.length === 0) return null;
  return JSON.parse(results[0]);
}
```

**Concurrency control**: Enforce `concurrentBuilds` from plan limits:
```typescript
async function canStartBuild(userId: string, plan: PlanType): Promise<boolean> {
  const redis = getRedisClient();
  const activeCount = await redis.scard(`build:active:${userId}`);
  const limit = getPlanLimits(plan).concurrentBuilds;
  return activeCount < limit;
}
```

**Priority**: P0 -- operational stability.

#### 6.2.2 Rollback Strategy

**Current state**: Rollback copies artifacts from a previous deployment's MinIO path to the current one, then redeploys. This is functional but slow.

**Redesign**: Keep all deployment artifacts in MinIO permanently (up to the last N deployments per project). Rollback becomes a pointer swap:
1. Update `isActive` flag on the target deployment
2. Update the K8s deployment to point to the rollback deployment's artifact path
3. No artifact copying needed

```typescript
// File: lib/build/rollback.ts

async function rollbackToDeployment(
  projectId: string,
  targetDeploymentId: string,
  userId: string
): Promise<Result<Deployment>> {
  const target = await prisma.deployment.findUnique({
    where: { id: targetDeploymentId },
    select: { id: true, projectId: true, siteSlug: true, artifactPath: true, status: true },
  });

  if (!target || target.projectId !== projectId || target.status !== "READY") {
    return { ok: false, error: "Target deployment not found or not ready" };
  }

  // Swap active deployment (single transaction)
  await prisma.$transaction([
    prisma.deployment.updateMany({
      where: { projectId, isActive: true },
      data: { isActive: false },
    }),
    prisma.deployment.update({
      where: { id: targetDeploymentId },
      data: {
        isActive: true,
        promotedAt: new Date(),
        promotedBy: userId,
      },
    }),
  ]);

  // Redeploy K8s site with existing artifacts (no rebuild)
  await deploySite({
    siteSlug: target.siteSlug!,
    projectId,
    deploymentId: targetDeploymentId,
  });

  return { ok: true, data: target };
}
```

**Priority**: P1.

#### 6.2.3 Preview Deployment Improvements

**Current state**: Preview deployments use the same site slug as production. This means a PR deployment overwrites the production site.

**Redesign**: Preview deployments should have a unique slug:

```typescript
function generateSiteSlug(projectSlug: string, deploymentId: string, isPreview: boolean): string {
  if (isPreview) {
    // Preview: project-slug-pr-123 or project-slug-abc1234
    return sanitizeSlug(`${projectSlug}-${deploymentId.slice(0, 8)}`);
  }
  // Production: project-slug
  return sanitizeSlug(projectSlug);
}
```

**Preview URL format**: `my-app-abc1234.tranthachnguyen.com`

**Auto-cleanup**: When a PR is closed (via webhook `handlePRClosed`), delete the preview K8s deployment and DNS record.

**Priority**: P1.

#### 6.2.4 Build Caching Improvements

**Current state**: Build cache volumes mount per-project `node_modules` and `.next/cache` directories. Good start.

**Improvements**:
1. **Layer caching**: Hash `package-lock.json` to detect when node_modules cache is stale
2. **Cache invalidation**: Add `?clean=true` parameter (already exists in deploy API) to force clean build
3. **Cache metrics**: Track cache hit/miss rates in build logs

**Priority**: P2.

---

## Section 7: Infrastructure

### 7.1 Docker / K8s Improvements

#### 7.1.1 Dockerfile Improvements

**Current state**: Well-structured multi-stage build with non-root user, dumb-init, health check. Good.

**Improvements**:
1. Pin image versions for reproducibility:
   ```dockerfile
   FROM node:20.11-slim AS deps  # Pin minor version
   ```
2. Add `.dockerignore` audit -- ensure `node_modules`, `.env`, `.git` are excluded
3. Add build-time secret handling for private npm registries (if needed):
   ```dockerfile
   RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
   ```

**Priority**: P2.

#### 7.1.2 K8s Improvements

**Current state**: Functional K3d setup with namespaces, MinIO, Redis, and Nginx site router.

**Improvements**:
1. **Resource quotas per namespace**:
   ```yaml
   apiVersion: v1
   kind: ResourceQuota
   metadata:
     name: site-quota
     namespace: cloudify-sites
   spec:
     hard:
       pods: "100"
       requests.cpu: "10"
       requests.memory: "5Gi"
   ```
2. **Network policies**: Isolate sites from each other:
   ```yaml
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: site-isolation
     namespace: cloudify-sites
   spec:
     podSelector: {}
     policyTypes: ["Ingress"]
     ingress:
       - from:
         - namespaceSelector:
             matchLabels:
               name: cloudify-system
   ```
3. **Pod disruption budgets** for zero-downtime deployments

**Priority**: P2.

### 7.2 Health Check Strategy

**Current state**: Good deep health check at `/api/health`. Add:
- `/api/health/live` -- liveness probe (just return 200, no dependency checks)
- `/api/health/ready` -- readiness probe (already exists, check dependencies)
- `/api/health/startup` -- startup probe (wait for database migration completion)

**K8s probe configuration**:
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 30
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3

startupProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 30
```

**Priority**: P1.

### 7.3 Monitoring and Alerting

**Current state**: Datadog metrics in middleware (request duration, count). Sentry error reporting. Structured logging.

**Improvements**:
1. **Add Prometheus metrics endpoint** (already exists at `/api/metrics/prometheus`)
2. **Business metrics to track**:
   - Deployments per minute (success/failure rate)
   - Build duration p50/p95/p99
   - Active sessions count
   - Queue depth (when build queue is implemented)
   - Error rate by endpoint
3. **Alert rules**:
   - Build failure rate > 20% in 5 minutes
   - API error rate > 5% in 5 minutes
   - Database latency > 500ms
   - Redis disconnection
   - Deployment queue depth > 10

**Priority**: P1.

### 7.4 Secret Management

**Current state**: Secrets in `.env.secrets` file, Docker environment variables with default values visible in `docker-compose.yml`:
```yaml
JWT_SECRET=${JWT_SECRET:-cloudify-jwt-secret-change-in-production-min-32-chars}
AUTH_SECRET=${AUTH_SECRET:-cloudify-auth-secret-change-in-production-min-32}
```

**Apple critique**: Default secrets in configuration files is a security risk. Even with "change in production" comments, defaults should never be valid secrets.

**Redesign**:
1. **Remove all default secret values** from `docker-compose.yml`
2. **Fail fast on missing secrets** in production:
   ```typescript
   if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
     throw new Error("JWT_SECRET must be set in production");
   }
   ```
   (This already exists in `session.ts` but not consistently applied)
3. **Use K8s secrets** for production deployment
4. **Rotate secrets**: Add a secret rotation mechanism for JWT signing keys

**Files to modify**:
- `docker-compose.yml` -- remove default secrets
- `lib/core/config.ts` -- validate all required secrets at startup

**Priority**: P0 -- security.

### 7.5 CI/CD Pipeline

**Current state**: No CI/CD pipeline configuration observed (no `.github/workflows/`, no `Jenkinsfile`).

**Redesign**: Add GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: cloudify_test
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx prisma db push
      - run: npm test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build

  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [lint, test, build]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t cloudify:${{ github.sha }} .
      # Deploy to production...
```

**Priority**: P1.

---

## Section 8: Performance

### 8.1 Database Query Optimization

#### N+1 Query Patterns

**Location**: `app/api/deployments/route.ts`
```typescript
// CURRENT: Fetches all deployments, then for each formats URL using project slug
const formattedDeployments = deployments.map((deployment) => ({
  url: deployment.siteSlug
    ? `${deployment.siteSlug}.cloudify.tranthachnguyen.com`
    : `${deployment.project.slug}.cloudify.tranthachnguyen.com`,
}));
```
This is fine because the include already fetches project data. But the list of unique projects is built by iterating all deployments:
```typescript
const projects = [...new Set(deployments.map((d) => d.project))].map((p) => ({...}));
```
The `Set` won't deduplicate objects. This creates duplicate project entries in the response.

**Fix**: Use `Map` for deduplication:
```typescript
const projectMap = new Map<string, typeof deployments[0]["project"]>();
deployments.forEach(d => projectMap.set(d.project.id, d.project));
const projects = Array.from(projectMap.values());
```

#### Missing Batch Operations

**Location**: `app/api/storage/kv/route.ts:362-365`
```typescript
// CURRENT: Sequential deletion in a loop
for (const k of result.keys) {
  await kvDelete(storeId, k);
}
```
**Fix**: Use Redis pipeline for batch deletion:
```typescript
const redis = getRedisClient();
const pipeline = redis.pipeline();
for (const k of result.keys) {
  pipeline.del(buildKey(KEY_PREFIX.KV, storeId, k));
}
await pipeline.exec();
```

#### Redundant Queries

**Location**: `app/api/deploy/route.ts`
```typescript
// Two separate queries to get user plan
const ownerRecord = await prisma.user.findUnique({
  where: { id: projectOwnerId },
  select: { plan: true },
});
// Could be combined with the project query above
```

**Fix**: Include user plan in the project query:
```typescript
const project = await prisma.project.findUnique({
  where: { id: projectId },
  select: {
    id: true, name: true, slug: true, userId: true, repoUrl: true, repoBranch: true,
    user: { select: { plan: true } },  // Include plan directly
  },
});
```

### 8.2 Caching Strategy

**Current state**: `withCache` helper adds `Cache-Control` headers. No server-side caching.

**Redesign**: Add Redis caching for expensive queries.

```typescript
// File: lib/api/cache.ts

import { getRedisClient, KEY_PREFIX } from "@/lib/storage/redis-client";

async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const redis = getRedisClient();
  const cacheKey = KEY_PREFIX.CACHE + key;

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch and cache
  const data = await fetcher();
  await redis.set(cacheKey, JSON.stringify(data), "EX", ttlSeconds);
  return data;
}

// Invalidation helper
async function invalidate(pattern: string): Promise<void> {
  const redis = getRedisClient();
  const keys = await redis.keys(KEY_PREFIX.CACHE + pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
```

**What to cache**:
| Data | TTL | Invalidation Trigger |
|------|-----|---------------------|
| User plan/limits | 5 min | Plan change |
| Project list | 30 sec | Project CRUD |
| Team membership | 5 min | Member change |
| Plan pricing | 1 hour | Never (static) |
| Usage summary | 1 min | Usage record |
| Analytics aggregates | 5 min | New events |

**Priority**: P1.

### 8.3 API Response Time Targets

| Endpoint Category | Target p95 | Current Estimate |
|-------------------|-----------|-----------------|
| Auth endpoints | < 100ms | ~50ms |
| Project CRUD | < 200ms | ~100-300ms |
| Deployment list | < 200ms | ~200-500ms (needs caching) |
| Deployment create | < 500ms | ~300ms (async build) |
| Storage operations | < 100ms | ~50-200ms |
| Analytics queries | < 500ms | ~500ms+ (needs indexing) |
| Health check | < 50ms | ~100-500ms (4 dependency checks) |
| Webhook processing | < 1000ms | ~500ms |

**Priority**: P1 -- measure first, then optimize.

### 8.4 Frontend Bundle Optimization

**Current state**: Next.js with standalone output mode (good). No bundle analysis observed.

**Recommendations**:
1. Add `@next/bundle-analyzer` to identify large dependencies
2. Lazy-load heavy components (code editors, charts) with `dynamic()`
3. Use `next/image` for all images with proper sizes
4. Ensure tree-shaking works for `lib/` imports (avoid barrel exports that import everything)

**Priority**: P2.

### 8.5 CDN Strategy

**Current state**: Cloudflare Tunnel proxies all traffic. Static assets served by Nginx in K8s.

**Improvements**:
1. **Set long cache headers for immutable assets** (already done in site-deployer Nginx config)
2. **Add Cloudflare page rules** for `*.tranthachnguyen.com`:
   - Cache Level: Standard
   - Edge Cache TTL: 1 month for `/static/*`, `/_next/static/*`
   - Browser Cache TTL: 1 year for hashed assets
3. **Add `Cache-Control: public, max-age=31536000, immutable`** for hashed Next.js assets

**Priority**: P2.

---

## Implementation Roadmap

### Phase 1: Security Foundation (P0) -- Weeks 1-2
1. Fix RBAC (`requireReadAccess`/`requireWriteAccess` to use actual permission checks)
2. Move rate limiting from in-memory to Redis
3. Remove default secrets from docker-compose
4. Remove deprecated `commitMsg` column
5. Consolidate deployment APIs (`/api/deploy` -> `/api/deployments`)

### Phase 2: API Quality (P1) -- Weeks 3-5
1. Implement response envelope (`{ ok, data, error, meta }`)
2. Implement cursor-based pagination
3. Add Redis caching for expensive queries
4. Add missing database indexes
5. Consolidate session systems (remove custom, keep NextAuth)
6. Implement build queue with concurrency control
7. Add validated configuration module
8. Fix preview deployment slug collision
9. Set up CI/CD pipeline
10. Health check improvements (liveness/readiness/startup probes)

### Phase 3: Polish (P2) -- Weeks 6-8
1. Enum consolidation (string columns to Prisma enums)
2. Naming convention standardization (via `@map`)
3. API versioning header
4. Service boundary refactoring
5. Result type adoption
6. Bundle optimization
7. CDN configuration
8. K8s resource quotas and network policies
9. Webhook idempotency
10. RESTful KV storage routes

---

## Appendix A: Files Changed Summary

| File | Change Type | Priority |
|------|------------|----------|
| `lib/auth/api-auth.ts` | Major rewrite (RBAC) | P0 |
| `lib/auth/rbac.ts` | New file | P0 |
| `lib/api/response.ts` | New file (response envelope) | P1 |
| `lib/api/pagination.ts` | New file (cursor pagination) | P1 |
| `lib/api/cache.ts` | New file (Redis caching) | P1 |
| `lib/core/config.ts` | New file (env validation) | P1 |
| `lib/core/result.ts` | New file (Result type) | P2 |
| `lib/build/queue.ts` | New file (build queue) | P0 |
| `lib/security/redis-rate-limit.ts` | Enhance | P0 |
| `lib/auth/rate-limit.ts` | Deprecate | P0 |
| `lib/auth/session.ts` | Deprecate | P1 |
| `middleware.ts` | Add API rate limiting | P0 |
| `prisma/schema.prisma` | Indexes, enums, cleanup | P0-P2 |
| `docker-compose.yml` | Remove default secrets | P0 |
| `app/api/deploy/route.ts` | Deprecate, redirect | P0 |
| `app/api/deployments/route.ts` | Merge deploy logic | P0 |
| `app/api/deployments/[id]/route.ts` | Standardize response | P1 |
| `app/api/projects/route.ts` | Cursor pagination, envelope | P1 |
| `app/api/domains/route.ts` | Add envelope, pagination | P1 |
| `app/api/teams/route.ts` | Fix status code, envelope | P1 |
| `app/api/storage/kv/route.ts` | Split into RESTful routes | P1 |
| All other API routes (~90 files) | Response envelope adoption | P1 |

## Appendix B: Apple Engineering Principles Applied

| Principle | How Applied |
|-----------|------------|
| "It just works" | Standardized response envelope -- consumers always know the shape |
| Elegant simplicity | Single auth system (NextAuth), single deployment API path |
| Convention over configuration | Sensible defaults in validated config, cursor pagination as standard |
| Progressive disclosure | Simple `{ ok, data }` response, with optional `meta` for advanced use |
| Performance | Redis caching, missing indexes, build queue, batch operations |
| Security by design | Real RBAC, Redis rate limiting, secret validation at startup |
| Consistency | One response format, one pagination style, one error code system |
| Observability | Correlation IDs on every request, structured logging, health probes |
