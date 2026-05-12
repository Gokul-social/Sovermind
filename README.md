# SoverMind

Privacy-first offline AI health companion. All inference runs locally, with the frontend and backend managed as a small npm workspace monorepo.

## Architecture

- `apps/app/` contains `@sovermind/app`, the React + Vite frontend.
- `apps/server/` contains `@sovermind/server`, the Fastify + TypeScript backend.
- `reference/` contains read-only design tokens, HTML explorations, and prototype screenshots.

The frontend talks to the backend over local HTTP/WebSocket endpoints. The backend binds to `127.0.0.1` only and serves the frontend build in production.

## Quick Start

```bash
npm install
npm run dev
```

Useful workspace commands:

```bash
npm run dev --workspace @sovermind/app
npm run dev --workspace @sovermind/server
npm run typecheck
npm run build
```

## Environment Setup

The backend owns environment configuration.

```bash
cp apps/server/.env.example apps/server/.env
```

Then edit `apps/server/.env` to point model-related variables such as `LLM_MODEL_PATH`, `WHISPER_MODEL_PATH`, `OCR_MODEL_PATH`, and `TRANSLATION_MODEL_PATH` at your local model files.

## Capabilities

| Capability | Status | Notes |
| --- | --- | --- |
| LLM | Local | Primary conversational inference via local model paths. |
| OCR | Local | Document/image text extraction through the backend. |
| Transcription | Local | Audio-to-text via local transcription models. |
| Translation | Local | Local translation pipeline exposed by the backend. |

## Repository Notes

- Root `.gitignore` is the source of truth for generated output, local assistant state, and environment files.
- `.claude/` is intentionally local-only and should never be pushed.
- `reference/` is documentation/reference material, not production runtime code.
