# @cloudify/sdk

Official JavaScript/TypeScript SDK for the Cloudify deployment platform.

## Installation

```bash
npm install @cloudify/sdk
# or
yarn add @cloudify/sdk
# or
pnpm add @cloudify/sdk
```

## Quick Start

```typescript
import { Cloudify } from '@cloudify/sdk';

const cloudify = new Cloudify({
  token: 'your-api-token',
  baseUrl: 'https://cloudify.tranthachnguyen.com/api', // optional
});

// List all projects
const projects = await cloudify.projects.list();
console.log(projects);
```

## API Reference

### Projects

```typescript
// List all projects
const projects = await cloudify.projects.list();

// Get a project by ID
const project = await cloudify.projects.get('project-id');

// Get a project by slug
const project = await cloudify.projects.getBySlug('my-app');

// Create a new project
const project = await cloudify.projects.create({
  name: 'My App',
  slug: 'my-app',
  framework: 'nextjs',
  gitRepository: 'https://github.com/user/repo',
});

// Update a project
const project = await cloudify.projects.update('project-id', {
  name: 'Updated Name',
});

// Delete a project
await cloudify.projects.delete('project-id');
```

### Deployments

```typescript
// List deployments for a project
const deployments = await cloudify.deployments.list('project-id');

// Get a deployment by ID
const deployment = await cloudify.deployments.get('deployment-id');

// Create a deployment
const deployment = await cloudify.deployments.create('project-id', {
  branch: 'main',
  commitSha: 'abc123',
});

// Deploy a file (tarball)
const deployment = await cloudify.deployments.deployFile('project-id', tarBuffer, {
  framework: 'nextjs',
});

// Get build logs
const logs = await cloudify.deployments.getLogs('deployment-id');

// Rollback to a previous deployment
const deployment = await cloudify.deployments.rollback('project-id', 'deployment-id');

// Wait for deployment to be ready
const deployment = await cloudify.deployments.waitForReady('deployment-id', {
  timeout: 300000, // 5 minutes
  pollInterval: 5000, // 5 seconds
});
```

### Domains

```typescript
// List domains for a project
const domains = await cloudify.domains.list('project-id');

// Add a domain
const domain = await cloudify.domains.add('project-id', {
  domain: 'example.com',
});

// Verify a domain
const domain = await cloudify.domains.verify('domain-id');

// Set as primary domain
const domain = await cloudify.domains.setPrimary('domain-id');

// Remove a domain
await cloudify.domains.remove('domain-id');
```

### Environment Variables

```typescript
// List environment variables
const variables = await cloudify.env.list('project-id');

// Get a single variable
const variable = await cloudify.env.get('project-id', 'DATABASE_URL');

// Set an environment variable
const variable = await cloudify.env.set('project-id', {
  key: 'DATABASE_URL',
  value: 'postgres://...',
  target: ['production', 'preview'],
});

// Set multiple variables
const variables = await cloudify.env.setMany('project-id', [
  { key: 'API_KEY', value: 'secret' },
  { key: 'DEBUG', value: 'false' },
]);

// Pull variables as a map (for local development)
const envMap = await cloudify.env.pull('project-id', 'development');
// Returns: { DATABASE_URL: '...', API_KEY: '...' }

// Delete a variable
await cloudify.env.delete('project-id', 'OLD_VAR');
```

### Serverless Functions

```typescript
// List functions
const functions = await cloudify.functions.list('project-id');

// Create a function
const fn = await cloudify.functions.create('project-id', {
  name: 'my-function',
  runtime: 'nodejs20',
  handler: 'index.handler',
  code: 'export const handler = async (event) => ({ body: "Hello" });',
});

// Deploy a function
const fn = await cloudify.functions.deploy('function-id');

// Invoke a function
const result = await cloudify.functions.invoke<{ message: string }>('function-id', {
  name: 'World',
});
console.log(result.result); // { message: 'Hello, World!' }

// Get function logs
const logs = await cloudify.functions.getLogs('function-id', {
  limit: 100,
});
```

### Storage (Blob & KV)

#### Blob Storage

```typescript
// List blob stores
const stores = await cloudify.storage.listBlobStores('project-id');

// Create a blob store
const store = await cloudify.storage.createBlobStore('project-id', {
  name: 'assets',
  isPublic: true,
});

// Upload a blob
const blob = await cloudify.storage.uploadBlob('store-id', {
  pathname: 'images/logo.png',
  content: fileBuffer,
  contentType: 'image/png',
});

// Get blob URL
const url = await cloudify.storage.getBlobUrl('store-id', 'images/logo.png');

// Delete a blob
await cloudify.storage.deleteBlob('store-id', 'images/logo.png');
```

#### KV Storage

```typescript
// List KV stores
const stores = await cloudify.storage.listKVStores('project-id');

// Create a KV store
const store = await cloudify.storage.createKVStore('project-id', 'cache');

// Set a value
await cloudify.storage.kvSet('store-id', 'user:123', JSON.stringify({ name: 'John' }), {
  expiresIn: 3600, // 1 hour in seconds
});

// Get a value
const value = await cloudify.storage.kvGet('store-id', 'user:123');
if (value) {
  const user = JSON.parse(value);
}

// List keys
const { keys, cursor } = await cloudify.storage.kvList('store-id', {
  prefix: 'user:',
  limit: 100,
});

// Get multiple values
const values = await cloudify.storage.kvGetMany('store-id', ['key1', 'key2', 'key3']);

// Set multiple values
await cloudify.storage.kvSetMany('store-id', [
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2', expiresIn: 3600 },
]);

// Delete a value
await cloudify.storage.kvDelete('store-id', 'user:123');
```

## Error Handling

```typescript
import { Cloudify, CloudifyError } from '@cloudify/sdk';

try {
  const project = await cloudify.projects.get('invalid-id');
} catch (error) {
  if (error instanceof CloudifyError) {
    console.error(`Error ${error.statusCode}: ${error.message}`);
    console.error(`Code: ${error.code}`);
  }
}
```

## TypeScript Support

The SDK is written in TypeScript and includes full type definitions:

```typescript
import type {
  Project,
  Deployment,
  Domain,
  EnvVariable,
  ServerlessFunction,
  BlobStore,
  KVStore,
  DeploymentStatus,
  Framework,
} from '@cloudify/sdk';
```

## License

MIT
