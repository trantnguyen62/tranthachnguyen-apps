# @cloudify/cli

The official command-line interface for [Cloudify](https://cloudify.tranthachnguyen.com) -- a production-ready deployment platform.

## Installation

```bash
npm install -g @cloudify/cli
```

## Authentication

Log in to your Cloudify account:

```bash
cloudify login
```

You will be prompted to enter your API token. Get one from your [account settings](https://cloudify.tranthachnguyen.com/settings/tokens).

You can also pass the token directly:

```bash
cloudify login --token <your-api-token>
```

Verify your session:

```bash
cloudify whoami
```

Log out:

```bash
cloudify logout
```

## Project Setup

### Initialize a new project

```bash
cloudify init
cloudify init --name my-app --framework nextjs
```

### Link to an existing project

```bash
cloudify link
cloudify link --project my-app
```

### Unlink

```bash
cloudify unlink
```

## Deployment

### Deploy your project

```bash
cloudify deploy              # Preview deployment
cloudify deploy --prod       # Production deployment
cloudify deploy -m "v1.2.0"  # With a deployment message
```

### Rollback to a previous deployment

```bash
cloudify rollback
cloudify rollback --deployment <id>
```

### View deployment logs

```bash
cloudify logs
cloudify logs --follow       # Stream logs in real-time
cloudify logs -n 200         # Show last 200 lines
```

## Environment Variables

```bash
cloudify env list                              # List all env vars
cloudify env list -e production                # List for specific environment
cloudify env pull                              # Pull to .env.local
cloudify env push                              # Push .env file to Cloudify
cloudify env push -e production                # Push to specific environment
```

## Domains

```bash
cloudify domains list                          # List custom domains
cloudify domains add example.com               # Add a domain
cloudify domains remove example.com            # Remove a domain
cloudify domains verify example.com            # Verify DNS configuration
```

## Edge Functions

```bash
cloudify functions list                        # List all functions
cloudify functions deploy my-fn --file handler.ts   # Deploy a function
cloudify functions logs my-fn                  # View function logs
cloudify functions logs my-fn -n 100           # View last 100 log entries
cloudify functions invoke my-fn                # Invoke with no payload
cloudify functions invoke my-fn --data '{"key":"value"}'  # Invoke with JSON data
```

## Storage

### KV Store

```bash
cloudify storage kv list                       # List all key-value pairs
cloudify storage kv get my-key                 # Get a value
cloudify storage kv set my-key "my-value"      # Set a value
cloudify storage kv delete my-key              # Delete a key
```

### Blob Storage

```bash
cloudify storage blob list                     # List all blobs
cloudify storage blob upload ./photo.png       # Upload a file
cloudify storage blob download images/photo.png -o ./photo.png  # Download a blob
cloudify storage blob delete images/photo.png  # Delete a blob
```

## Teams

```bash
cloudify teams list                            # List your teams
cloudify teams create "My Team"                # Create a new team
cloudify teams members                         # List members of your team
cloudify teams members --team <teamId>         # List members of a specific team
cloudify teams invite user@example.com         # Invite a member (default role: member)
cloudify teams invite user@example.com --role admin  # Invite as admin
```

## Analytics

```bash
cloudify analytics overview                    # Show analytics summary (last 7 days)
cloudify analytics overview --period 30d       # Summary for last 30 days
cloudify analytics realtime                    # Show real-time visitor count
```

## Development

Start a local development server with Cloudify environment variables:

```bash
cloudify dev
cloudify dev --port 8080
cloudify dev --framework nextjs
```

## List Projects

```bash
cloudify list    # or: cloudify ls
```

## Configuration

The CLI stores its configuration in `~/.config/cloudify/`. Project-specific settings are saved in `cloudify.json` in your project root.

| Environment Variable   | Description                        |
|------------------------|------------------------------------|
| `CLOUDIFY_API_URL`     | Override the API base URL          |

## Requirements

- Node.js >= 18.0.0

## License

MIT
