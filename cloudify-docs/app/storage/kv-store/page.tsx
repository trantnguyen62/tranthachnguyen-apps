import { CodeBlock } from "@/components/CodeBlock";
import { Callout } from "@/components/Callout";

export default function KVStorePage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>KV Store</h1>

      <p className="lead">
        Fast key-value storage for caching, sessions, and real-time data.
      </p>

      <h2>Overview</h2>

      <p>
        KV Store provides Redis-compatible key-value storage with sub-millisecond
        latency. Perfect for caching, session management, and real-time counters.
      </p>

      <h2>Quick Start</h2>

      <p>
        Install a Redis client like <code>ioredis</code>:
      </p>

      <CodeBlock
        code={`npm install ioredis`}
        language="bash"
      />

      <h3>Initialize the Client</h3>

      <CodeBlock
        code={`import Redis from "ioredis";

const redis = new Redis(process.env.KV_URL!);

// Or with options
const redis = new Redis(process.env.KV_URL!, {
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false,
});`}
        language="typescript"
      />

      <h2>Basic Operations</h2>

      <h3>Set and Get</h3>

      <CodeBlock
        code={`// Set a value
await redis.set("user:123", "John Doe");

// Get a value
const name = await redis.get("user:123");
// => "John Doe"

// Set with expiration (seconds)
await redis.set("session:abc", "data", "EX", 3600);

// Set with expiration (milliseconds)
await redis.set("cache:key", "value", "PX", 60000);`}
        language="typescript"
      />

      <h3>JSON Data</h3>

      <CodeBlock
        code={`// Store JSON
const user = { id: 123, name: "John", email: "john@example.com" };
await redis.set("user:123", JSON.stringify(user));

// Retrieve JSON
const data = await redis.get("user:123");
const user = data ? JSON.parse(data) : null;`}
        language="typescript"
      />

      <h3>Delete</h3>

      <CodeBlock
        code={`// Delete a key
await redis.del("user:123");

// Delete multiple keys
await redis.del("key1", "key2", "key3");`}
        language="typescript"
      />

      <h2>Common Patterns</h2>

      <h3>Caching</h3>

      <CodeBlock
        code={`async function getCachedData(key: string, fetchFn: () => Promise<any>) {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache for 5 minutes
  await redis.set(key, JSON.stringify(data), "EX", 300);

  return data;
}

// Usage
const user = await getCachedData(\`user:\${userId}\`, () =>
  fetchUserFromDB(userId)
);`}
        language="typescript"
      />

      <h3>Session Storage</h3>

      <CodeBlock
        code={`// Create session
async function createSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const session = { userId, createdAt: Date.now() };

  // Store with 24-hour expiration
  await redis.set(
    \`session:\${sessionId}\`,
    JSON.stringify(session),
    "EX",
    86400
  );

  return sessionId;
}

// Get session
async function getSession(sessionId: string) {
  const data = await redis.get(\`session:\${sessionId}\`);
  return data ? JSON.parse(data) : null;
}

// Destroy session
async function destroySession(sessionId: string) {
  await redis.del(\`session:\${sessionId}\`);
}`}
        language="typescript"
      />

      <h3>Rate Limiting</h3>

      <CodeBlock
        code={`async function checkRateLimit(ip: string, limit = 100, window = 60) {
  const key = \`ratelimit:\${ip}\`;

  // Increment counter
  const count = await redis.incr(key);

  // Set expiration on first request
  if (count === 1) {
    await redis.expire(key, window);
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetIn: await redis.ttl(key),
  };
}

// Usage in API route
export async function GET(request: Request) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const { allowed, remaining } = await checkRateLimit(ip);

  if (!allowed) {
    return new Response("Too many requests", { status: 429 });
  }

  // Process request...
}`}
        language="typescript"
      />

      <h3>Counters</h3>

      <CodeBlock
        code={`// Increment page views
await redis.incr("pageviews:homepage");

// Get count
const views = await redis.get("pageviews:homepage");

// Increment by specific amount
await redis.incrby("downloads:file123", 1);`}
        language="typescript"
      />

      <Callout type="info">
        Use <code>INCR</code> for atomic counters that need to be thread-safe
        across multiple function invocations.
      </Callout>

      <h2>Additional Operations</h2>

      <h3>Check if Key Exists</h3>

      <CodeBlock
        code={`const exists = await redis.exists("user:123");
// => 1 (exists) or 0 (doesn't exist)`}
        language="typescript"
      />

      <h3>Set Expiration</h3>

      <CodeBlock
        code={`// Set expiration on existing key (seconds)
await redis.expire("user:123", 3600);

// Get time to live
const ttl = await redis.ttl("user:123");`}
        language="typescript"
      />

      <h3>Hash Operations</h3>

      <CodeBlock
        code={`// Set hash fields
await redis.hset("user:123", {
  name: "John",
  email: "john@example.com",
  role: "admin",
});

// Get single field
const name = await redis.hget("user:123", "name");

// Get all fields
const user = await redis.hgetall("user:123");`}
        language="typescript"
      />

      <h2>Best Practices</h2>

      <ul>
        <li>Use meaningful key prefixes (e.g., <code>user:</code>, <code>session:</code>)</li>
        <li>Always set expiration for cache keys</li>
        <li>Use atomic operations for counters and flags</li>
        <li>Handle connection errors gracefully</li>
        <li>Don&apos;t store large objects (keep values under 1MB)</li>
      </ul>
    </article>
  );
}
