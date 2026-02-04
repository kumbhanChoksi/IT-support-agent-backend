# Voice IT Helpdesk — Backend

Node.js + TypeScript backend for a **voice-based IT helpdesk** powered by [VAPI](https://vapi.ai). Callers speak to an AI agent that collects details, confirms spellings, and creates support tickets via natural conversation.

---

## Overview

This service:

- **Exposes a VAPI webhook** so the voice assistant can invoke tools (create/edit ticket) during calls.
- **Starts VAPI sessions** on demand via `/api/session/start` for your frontend or clients.
- **Stores tickets** in a local JSON file (`tickets.json`) with draft state per call for multi-turn tool use.

The assistant is configured for **IT support**: it gathers first name, last name, email, phone, address, and issue type; confirms spellings; then creates a ticket and returns a confirmation number.

---

## Architecture

### Voice pipeline: STT → LLM → TTS

1. **STT (Speech-to-Text)**  
   VAPI uses **Deepgram** (`nova-2`) to transcribe the caller’s speech.

2. **LLM**  
   **OpenAI** (`gpt-4o-mini`) drives the conversation using a strict system prompt: collect and confirm name, email, phone, address, issue; no guessing; no interrupting.

3. **TTS (Text-to-Speech)**  
   **Cartesia** speaks the assistant’s replies with a configured voice.

All of this runs in VAPI’s cloud; this backend only receives **webhooks** and **creates sessions**.

### Tools and webhooks

- **Webhook URL:** `POST {VAPI_BASE_URL}/vapi/webhook`
- VAPI sends events to this URL. The backend handles:
  - **`tool-calls`** — Runs `create_ticket` or `edit_ticket` and returns results to VAPI.
  - **`assistant.ended` / `call.ended`** — Cleans up per-call draft state.

| Tool            | Purpose |
|-----------------|--------|
| `create_ticket` | Create a support ticket with `name`, `email`, `phone`, `address`, `issue`. |
| `edit_ticket`   | Update draft fields (e.g. name, email, phone) before creation. |

Supported **issue** values and prices: `wifi_not_working` ($20), `email_login_issue` ($15), `slow_laptop_performance` ($25), `printer_problem` ($10).

Draft state is kept in memory keyed by `call.id`; after `create_ticket` succeeds, the ticket is appended to `tickets.json`.

---

## Environment variables

| Variable           | Required | Description |
|--------------------|----------|-------------|
| `PORT`             | Yes      | Server port (e.g. `3000`). |
| `FRONTEND_URL`     | No       | Allowed CORS origin (default `http://localhost:3001`). |
| `VAPI_API_KEY`     | Yes      | VAPI API key (dashboard or CLI). |
| `VAPI_BASE_URL`    | Yes      | Public base URL of this backend (e.g. ngrok: `https://abc123.ngrok-free.app`). Used for webhook URL. |
| `VAPI_ASSISTANT_ID`| No       | If set, use this assistant; otherwise one is created on first session start. |

Copy `.env.example` to `.env` and fill in values.

---

## Local development setup

### 1. Install Node.js and pnpm

- **Node.js:** LTS (v20+) from [nodejs.org](https://nodejs.org) or your version manager.
- **pnpm:** This repo uses `pnpm` as the package manager.

```bash
# Install pnpm (if needed)
npm install -g pnpm
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. VAPI API key (and optional CLI)

- Sign up at [vapi.ai](https://vapi.ai) and get an **API key** from the dashboard.
- If you use the **VAPI CLI**, install and log in so you can use the same key or project:

```bash
# If VAPI provides a CLI (check their docs for current install)
npm install -g @vapi-ai/cli
vapi login
```

Set `VAPI_API_KEY` in `.env` (from dashboard or CLI config).

### 4. Start the backend

```bash
pnpm run dev
```

Server runs at `http://localhost:3000` (or whatever `PORT` you set).  
Health: `GET http://localhost:3000/health`.

### 5. Expose the webhook with ngrok

VAPI must reach your webhook at a **public URL**. Use ngrok to tunnel to your machine:

1. Install [ngrok](https://ngrok.com/download).
2. Start a tunnel to your backend port (e.g. 3000):

```bash
ngrok http 3000
```

3. Copy the **HTTPS** URL ngrok shows (e.g. `https://abc123.ngrok-free.app`).  
   That is your **base URL** — the webhook will be `{that_url}/vapi/webhook`.

### 6. Set VAPI_BASE_URL

In `.env`:

```env
VAPI_BASE_URL=https://your-subdomain.ngrok-free.app
```

Restart the backend so it picks up the new value. The assistant is created with:

`server.url = ${VAPI_BASE_URL}/vapi/webhook`

So VAPI will send tool-calls and end-of-call events to your local server via ngrok.

### 7. Test locally

**Health check:**

```bash
curl -s http://localhost:3000/health
# {"status":"ok"}
```

**Start a VAPI session** (returns `assistantId` and `sessionId` for your client):

```bash
curl -X POST http://localhost:3000/api/session/start \
  -H "Content-Type: application/json" \
  -s | jq
```

**Simulate a webhook** (optional; replace `YOUR_NGROK_URL`):

```bash
curl -X POST https://YOUR_NGROK_URL/vapi/webhook \
  -H "Content-Type: application/json" \
  -d '{"type":"tool-calls","call":{"id":"test-call-1"},"toolCalls":[{"id":"tc-1","function":{"name":"edit_ticket","arguments":"{\"name\":\"Test User\"}"}}]}'
```

End-to-end testing: use your frontend or a VAPI-capable client to place a call; the assistant should collect details and create a ticket. New tickets appear in `tickets.json` in the project root.

---

## Scripts

| Command        | Description                |
|----------------|----------------------------|
| `pnpm run dev` | Run with ts-node (development). |
| `pnpm run build` | Compile TypeScript to `dist/`. |
| `pnpm start`   | Run compiled `dist/index.js`. |

---

## License

See [LICENSE](LICENSE).
