import { APIEndpoint } from "@/components/APIReference";
import { Callout } from "@/components/Callout";

export default function AIAPIPage() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1>AI API</h1>

      <p className="lead">
        Leverage AI-powered features for deployment analysis, code review, performance
        recommendations, and interactive conversations.
      </p>

      <Callout type="info">
        AI features are powered by Anthropic Claude and require the ANTHROPIC_API_KEY
        environment variable to be configured.
      </Callout>

      <h2>Deployment Analysis</h2>

      <APIEndpoint
        method="POST"
        endpoint="/api/ai/analyze"
        description="Analyze a deployment using AI to get insights, identify issues, and receive recommendations."
        requestBody={`{
  "deploymentId": "deploy_abc123",
  "analysisType": "general"  // "general", "error", or "performance"
}`}
        responseBody={`{
  "id": "analysis_xyz",
  "deploymentId": "deploy_abc123",
  "type": "general",
  "summary": "Build completed successfully with minor optimization opportunities",
  "insights": [
    {
      "category": "performance",
      "severity": "medium",
      "message": "Bundle size could be reduced",
      "suggestion": "Enable tree shaking and code splitting"
    }
  ],
  "score": 85,
  "createdAt": "2024-01-25T12:00:00Z"
}`}
      />

      <h2>Conversations</h2>

      <h3>List Conversations</h3>

      <APIEndpoint
        method="GET"
        endpoint="/api/ai/conversations"
        description="List all AI conversations for the authenticated user."
        parameters={[
          { name: "projectId", type: "string", description: "Filter by project ID" },
          { name: "page", type: "number", description: "Page number (default: 1)" },
          { name: "limit", type: "number", description: "Results per page (default: 20)" },
        ]}
        responseBody={`{
  "conversations": [
    {
      "id": "conv_abc123",
      "title": "Debugging build failure",
      "context": "deployment",
      "projectId": "proj_xyz",
      "project": {
        "name": "My App",
        "slug": "my-app"
      },
      "messageCount": 8,
      "createdAt": "2024-01-25T10:00:00Z",
      "updatedAt": "2024-01-25T12:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1,
    "hasMore": false
  }
}`}
      />

      <h3>Create Conversation</h3>

      <APIEndpoint
        method="POST"
        endpoint="/api/ai/conversations"
        description="Start a new AI conversation."
        requestBody={`{
  "projectId": "proj_xyz",        // Optional: associate with a project
  "title": "Help with deployment",
  "context": "deployment",        // "deployment", "error", "performance", "general"
  "initialMessage": "My build is failing with a memory error"  // Optional
}`}
        responseBody={`{
  "id": "conv_new123",
  "title": "Help with deployment",
  "context": "deployment",
  "projectId": "proj_xyz",
  "createdAt": "2024-01-25T14:00:00Z",
  "updatedAt": "2024-01-25T14:00:00Z"
}`}
      />

      <h3>Get Conversation</h3>

      <APIEndpoint
        method="GET"
        endpoint="/api/ai/conversations/:id"
        description="Get a conversation with all its messages."
        parameters={[
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ]}
        responseBody={`{
  "id": "conv_abc123",
  "title": "Debugging build failure",
  "context": "deployment",
  "projectId": "proj_xyz",
  "project": {
    "name": "My App",
    "slug": "my-app"
  },
  "createdAt": "2024-01-25T10:00:00Z",
  "updatedAt": "2024-01-25T12:30:00Z",
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "My build is failing with a memory error",
      "createdAt": "2024-01-25T10:00:00Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "I can help with that. The FATAL ERROR: JavaScript heap out of memory...",
      "createdAt": "2024-01-25T10:00:05Z"
    }
  ]
}`}
      />

      <h3>Send Message</h3>

      <APIEndpoint
        method="POST"
        endpoint="/api/ai/conversations/:id/messages"
        description="Send a message to a conversation and receive an AI response. Supports streaming."
        parameters={[
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ]}
        requestBody={`{
  "content": "How can I increase the memory limit?",
  "stream": false  // Set to true for streaming response
}`}
        responseBody={`{
  "userMessage": {
    "id": "msg_3",
    "role": "user",
    "content": "How can I increase the memory limit?",
    "createdAt": "2024-01-25T12:30:00Z"
  },
  "assistantMessage": {
    "id": "msg_4",
    "role": "assistant",
    "content": "You can increase the Node.js memory limit by setting the NODE_OPTIONS environment variable...",
    "createdAt": "2024-01-25T12:30:05Z"
  },
  "usage": {
    "inputTokens": 150,
    "outputTokens": 320
  }
}`}
      />

      <Callout type="info">
        When <code>stream: true</code>, the response is sent as Server-Sent Events (SSE)
        with <code>Content-Type: text/event-stream</code>. Each chunk contains{" "}
        <code>{"data: {\"text\": \"...\"}"}</code> and ends with{" "}
        <code>{"data: {\"done\": true, \"messageId\": \"...\"}"}</code>.
      </Callout>

      <h3>Delete Conversation</h3>

      <APIEndpoint
        method="DELETE"
        endpoint="/api/ai/conversations/:id"
        description="Delete a conversation and all its messages."
        parameters={[
          { name: "id", type: "string", required: true, description: "Conversation ID" },
        ]}
        responseBody={`// Returns 204 No Content on success`}
      />

      <h2>Code Review</h2>

      <APIEndpoint
        method="POST"
        endpoint="/api/ai/review"
        description="Perform AI-powered code review on deployment changes."
        requestBody={`{
  "deploymentId": "deploy_abc123",
  "scope": "full"  // "full", "security", or "performance"
}`}
        responseBody={`{
  "id": "review_xyz",
  "deploymentId": "deploy_abc123",
  "scope": "full",
  "summary": "Code quality is good with 2 minor suggestions",
  "score": 92,
  "issues": [
    {
      "severity": "warning",
      "category": "performance",
      "file": "src/components/List.tsx",
      "line": 42,
      "message": "Consider memoizing this component",
      "suggestion": "Wrap with React.memo() to prevent unnecessary re-renders"
    },
    {
      "severity": "suggestion",
      "category": "best-practice",
      "file": "src/utils/api.ts",
      "line": 15,
      "message": "Missing error handling",
      "suggestion": "Add try-catch block for API calls"
    }
  ],
  "highlights": [
    "Good use of TypeScript types",
    "Clean component structure"
  ],
  "createdAt": "2024-01-25T12:00:00Z"
}`}
      />

      <h3>Code Review Scopes</h3>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Scope</th>
            <th className="text-left">Focus Area</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>full</code></td>
            <td>Complete review including security, performance, and best practices</td>
          </tr>
          <tr>
            <td><code>security</code></td>
            <td>XSS, injection, exposed secrets, authentication flaws</td>
          </tr>
          <tr>
            <td><code>performance</code></td>
            <td>Render blocking, bundle size, caching, lazy loading</td>
          </tr>
        </tbody>
      </table>

      <h2>Performance Recommendations</h2>

      <APIEndpoint
        method="POST"
        endpoint="/api/ai/performance"
        description="Get AI-powered performance recommendations based on Web Vitals metrics."
        requestBody={`{
  "projectId": "proj_xyz",
  "vitals": {
    "lcp": 3200,    // Largest Contentful Paint (ms)
    "fid": 120,     // First Input Delay (ms)
    "cls": 0.15,    // Cumulative Layout Shift
    "ttfb": 900,    // Time to First Byte (ms)
    "fcp": 2100,    // First Contentful Paint (ms)
    "inp": 250      // Interaction to Next Paint (ms)
  }
}`}
        responseBody={`{
  "project": {
    "id": "proj_xyz",
    "name": "My App",
    "slug": "my-app",
    "framework": "nextjs"
  },
  "score": 72,
  "metrics": {
    "LCP": {
      "value": 3200,
      "status": "needs-improvement",
      "target": 2500
    },
    "FID": {
      "value": 120,
      "status": "needs-improvement",
      "target": 100
    },
    "CLS": {
      "value": 0.15,
      "status": "needs-improvement",
      "target": 0.1
    },
    "TTFB": {
      "value": 900,
      "status": "needs-improvement",
      "target": 800
    }
  },
  "analysis": {
    "summary": "Your site has several performance issues affecting user experience",
    "criticalIssues": [
      {
        "metric": "LCP",
        "currentValue": 3200,
        "targetValue": 2500,
        "issue": "Hero image is too large",
        "solution": "Optimize image format and enable lazy loading",
        "expectedImprovement": "700ms reduction"
      }
    ],
    "quickWins": [
      "Enable text compression (gzip/brotli)",
      "Add resource hints for critical resources"
    ],
    "longTermImprovements": [
      "Implement server-side rendering for dynamic content",
      "Set up a CDN for static assets"
    ]
  },
  "recommendations": [
    {
      "category": "lcp",
      "severity": "high",
      "issue": "Largest Contentful Paint is 3200ms (target: <2500ms)",
      "suggestion": "Optimize the largest element on the page",
      "codeExample": "import Image from 'next/image'\\n\\n<Image\\n  src=\\"/hero.jpg\\"\\n  priority\\n  width={1200}\\n  height={600}\\n/>",
      "impact": "Faster perceived load time",
      "estimatedImprovement": "350ms reduction possible"
    },
    {
      "category": "cls",
      "severity": "high",
      "issue": "Cumulative Layout Shift is 0.150 (target: <0.1)",
      "suggestion": "Add explicit dimensions to images and embeds",
      "impact": "Better visual stability"
    }
  ]
}`}
      />

      <h2>Web Vitals Thresholds</h2>

      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left">Metric</th>
            <th className="text-left">Good</th>
            <th className="text-left">Needs Improvement</th>
            <th className="text-left">Poor</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>LCP</strong> (Largest Contentful Paint)</td>
            <td className="text-green-600">&lt; 2.5s</td>
            <td className="text-yellow-600">2.5s - 4s</td>
            <td className="text-red-600">&gt; 4s</td>
          </tr>
          <tr>
            <td><strong>FID</strong> (First Input Delay)</td>
            <td className="text-green-600">&lt; 100ms</td>
            <td className="text-yellow-600">100ms - 300ms</td>
            <td className="text-red-600">&gt; 300ms</td>
          </tr>
          <tr>
            <td><strong>CLS</strong> (Cumulative Layout Shift)</td>
            <td className="text-green-600">&lt; 0.1</td>
            <td className="text-yellow-600">0.1 - 0.25</td>
            <td className="text-red-600">&gt; 0.25</td>
          </tr>
          <tr>
            <td><strong>TTFB</strong> (Time to First Byte)</td>
            <td className="text-green-600">&lt; 800ms</td>
            <td className="text-yellow-600">800ms - 1.8s</td>
            <td className="text-red-600">&gt; 1.8s</td>
          </tr>
          <tr>
            <td><strong>INP</strong> (Interaction to Next Paint)</td>
            <td className="text-green-600">&lt; 200ms</td>
            <td className="text-yellow-600">200ms - 500ms</td>
            <td className="text-red-600">&gt; 500ms</td>
          </tr>
        </tbody>
      </table>
    </article>
  );
}
