# Sequel RAG Chatbot — Multi-Agent System

A full-stack multi-agent RAG chatbot for **Sequel Anodizing Racks** that helps customers identify the correct anodizing rack parts, assemblies, and fasteners. Includes a customer-facing chat widget, query logging, and automated analytics.

## Architecture

| Agent | Purpose | Model |
|---|---|---|
| **RAG Agent** | Answers customer part ID questions using catalog data | Claude Sonnet |
| **Logger Agent** | Captures every query/response to SQLite | — |
| **Analytics Agent** | Generates weekly BI reports | Claude Opus |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Add your Anthropic API key to .env
#    Edit .env and replace "your_anthropic_api_key_here" with your real key

# 3. Start the server
node server.js

# 4. Open the demo page
open http://localhost:3000/demo.html

# 5. Open the admin dashboard
open http://localhost:3000/admin.html
# Password: sequel_admin_2024
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chat` | None | Customer chat — send message, get response |
| `GET` | `/api/analytics/stats` | `x-internal-key` header | Quick stats (counts, rates, top items) |
| `GET` | `/api/analytics/report` | `x-internal-key` header | Latest analytics report |
| `POST` | `/api/analytics/run` | `x-internal-key` header | Trigger report generation |
| `GET` | `/api/analytics/queries` | `x-internal-key` header | Recent queries table |
| `GET` | `/widget.js` | None | Embeddable chat widget script |
| `GET` | `/api/health` | None | Health check |

## Embedding the Widget

Add one line to any website:

```html
<script src="https://your-domain.com/widget.js"
        data-api-url="https://your-domain.com/api/chat">
</script>
```

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key (required) |
| `PORT` | Server port (default: 3000) |
| `INTERNAL_KEY` | Secret key for analytics API endpoints |
| `INTERNAL_PASSWORD` | Password for admin dashboard login |
| `NODE_ENV` | `development` or `production` |

## File Structure

```
sequel-rag/
├── server.js                     # Express entry point
├── agents/
│   ├── ragAgent.js               # RAG search + Claude API
│   ├── loggerAgent.js            # SQLite write agent
│   └── analyticsAgent.js         # Report generator + cron
├── data/                         # Catalog JSON files (6 files)
├── database/
│   └── db.js                     # SQLite schema + helpers
├── routes/
│   ├── chat.js                   # POST /api/chat
│   ├── analytics.js              # Analytics endpoints
│   └── widget.js                 # Embeddable widget JS
├── public/
│   ├── demo.html                 # Widget demo page
│   └── admin.html                # Analytics dashboard
└── reports/                      # Generated report files
```

## Deployment

Works on any Node.js host (Railway, Render, Fly.io, DigitalOcean, AWS EC2):

1. Ensure persistent storage for SQLite database
2. Set all `.env` variables as environment variables
3. Include the `data/` JSON files in your deployment
4. Run `node server.js`

## Support

For complex applications or questions not covered by the chatbot, call Sequel at **800-553-8273**.
