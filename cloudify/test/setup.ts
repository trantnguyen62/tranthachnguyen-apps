import "@testing-library/jest-dom/vitest";
import { beforeAll, afterAll, afterEach, vi } from "vitest";
import { server } from "./mocks/server";

// Setup MSW server - bypass unhandled requests to allow test-specific mocks
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock cookies for session tests
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }),
}));

// Environment variables for tests
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing";
process.env.NEXTAUTH_SECRET = "test-nextauth-secret";
// Use real database for integration tests (matches .env)
process.env.DATABASE_URL = "postgresql://cloudify:cloudify123@localhost:5432/cloudify";
