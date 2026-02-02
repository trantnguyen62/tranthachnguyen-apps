import { http, HttpResponse } from "msw";

// Mock API handlers for tests
export const handlers = [
  // Auth endpoints
  http.get("/api/auth", () => {
    return HttpResponse.json({ error: "Not authenticated" }, { status: 401 });
  }),

  http.post("/api/auth", async ({ request }) => {
    const body = (await request.json()) as { action?: string; email?: string };
    if (body.action === "signup") {
      return HttpResponse.json({
        success: true,
        user: { id: "test-user-id", email: body.email },
      });
    }
    if (body.action === "login") {
      return HttpResponse.json({
        success: true,
        user: { id: "test-user-id", email: body.email },
      });
    }
    return HttpResponse.json({ error: "Bad request" }, { status: 400 });
  }),

  // Projects endpoints
  http.get("/api/projects", () => {
    return HttpResponse.json([]);
  }),

  http.post("/api/projects", async ({ request }) => {
    const body = (await request.json()) as { name?: string };
    if (!body.name) {
      return HttpResponse.json({ error: "Name required" }, { status: 400 });
    }
    return HttpResponse.json({
      id: "test-project-id",
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, "-"),
    });
  }),

  // Deployments endpoints
  http.get("/api/deployments/:id", ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "QUEUED",
      logs: [],
    });
  }),

  http.post("/api/deployments/:id/trigger", () => {
    return HttpResponse.json({ success: true, message: "Build triggered" });
  }),

  // GitHub endpoints
  http.get("/api/github/repos", () => {
    return HttpResponse.json([
      { id: 1, name: "test-repo", fullName: "user/test-repo" },
    ]);
  }),

  // Webhooks
  http.post("/api/webhooks/github", () => {
    return HttpResponse.json({ triggered: true });
  }),
];

// Helper to create authenticated handlers
export const authenticatedHandlers = [
  http.get("/api/auth", () => {
    return HttpResponse.json({
      user: { id: "test-user-id", email: "test@example.com", name: "Test User" },
    });
  }),
];
