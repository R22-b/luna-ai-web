# Luna AI Web

A browser-based web version of Luna AI with a React/Vite frontend and an Express backend. The application provides AI chat, image generation, document generation, research tools, student tools, provider settings, and an optional personal profile that can be shared with AI providers.

> **Project status:** This repository is a working web preview and foundation. The full Luna AI Desktop project contains additional desktop-only capabilities such as PC control, plugins, voice mode, and self-evolution.

## Features

| Feature | Description |
|---|---|
| AI Chat | Multi-provider chat with task modes, provider metadata, and in-memory response caching. |
| Provider Settings | Password fields for provider keys, encrypted local storage, masked saved-state display, and key removal. |
| Personal Profile | Optional name, nickname, role, location, interests, biography, and communication-style context. |
| Privacy Control | Profile context is sent to AI providers only when the sharing checkbox is enabled. |
| Image Generation | Pollinations image generation with Hugging Face fallback when configured. |
| Documents | Generation endpoints for Word, PDF, PowerPoint, and Excel documents. |
| Research | Web search through Serper, Brave, or DuckDuckGo followed by page-content enrichment and AI synthesis. |
| Student Tools | PDF study support, YouTube notes, Feynman explanations, flashcards, quizzes, and link summaries. |
| Anonymous Fallback | AI Horde community text workers can answer without a personal provider key, using its documented anonymous access mode. |

## Architecture

The repository is split into two independently runnable applications:

```text
luna-ai-web/
├── backend/
│   ├── server.js
│   ├── routes/
│   └── services/
└── frontend/
    ├── src/App.jsx
    ├── src/components/
    └── src/pages/
```

The frontend talks to the backend through `/api`. In development, Vite proxies API requests to `http://localhost:3001`. Provider keys remain server-side; the Settings page sends them to the backend over the application API and never receives the full values back.

## Requirements

Node.js 18 or newer and npm are recommended. The application can run without a personal AI-provider key because the backend includes AI Horde anonymous fallback support, although anonymous requests may be slow or unavailable during periods of high demand.

## Quick Start

Clone the repository and install dependencies in both packages:

```bash
git clone https://github.com/R22-b/luna-ai-web.git
cd luna-ai-web

cd backend
npm install
cp .env.example .env
node server.js
```

In a second terminal:

```bash
cd luna-ai-web/frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The backend listens on port `3001` by default. The frontend development server listens on port `5173`.

## Provider Keys

You can configure keys in the application at `/settings`. The backend stores entered keys in an encrypted local file under `backend/.luna-data/`. That directory is excluded by `.gitignore` and must never be committed.

You may also configure keys through `backend/.env`:

```env
GROQ_API_KEY=
GEMINI_API_KEY=
OPENROUTER_API_KEY=
NVIDIA_API_KEY=
COHERE_API_KEY=
MISTRAL_API_KEY=
TOGETHER_API_KEY=
HF_API_KEY=
DEEPSEEK_API_KEY=
CEREBRAS_API_KEY=
SAMBANOVA_API_KEY=
LEONARDO_API_KEY=
SERPER_API_KEY=
BRAVE_API_KEY=
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

The provider manager tries configured providers according to the selected task mode. It then tries Pollinations’ legacy text fallback and AI Horde anonymous mode. Current Pollinations generation documentation requires authentication for generation requests, so Pollinations should not be treated as a guaranteed keyless provider [1] [2]. AI Horde documents anonymous access with the API key `0000000000`, but anonymous requests receive the lowest priority in its community queue [3].

## Personalization and Privacy

Open **Settings → Your Luna profile** to save information that Luna may use to personalize chat. The profile is stored locally by the backend. When **Let AI providers use my profile in chat** is disabled, the profile is not inserted into the chat system context. Do not store passwords, API keys, financial information, or other highly sensitive information in the profile.

This implementation provides an explicit profile context, not automatic long-term memory extraction from every conversation. Automatic memory, authentication, per-user data isolation, and account-level encryption should be added before using this as a multi-user public service.

## Available API Routes

| Route | Purpose |
|---|---|
| `POST /api/chat` | Send a chat request. |
| `GET /api/chat/health` | Inspect provider health and cache state. |
| `GET /api/chat/models` | List currently available configured and no-key fallback models. |
| `POST /api/image/generate` | Generate an image. |
| `POST /api/documents/generate` | Generate a document file. |
| `POST /api/research` | Search, enrich, and synthesize research. |
| `POST /api/student/*` | Run student-support tools. |
| `GET /api/settings/keys` | Return safe provider metadata only. |
| `POST /api/settings/keys` | Encrypt and save or clear provider keys. |
| `GET /api/settings/profile` | Read the local profile. |
| `POST /api/settings/profile` | Save the local profile. |

## Production Considerations

The Settings API in this preview does not include user authentication. A production deployment should add authentication, per-user encrypted storage, HTTPS, rate limiting for settings writes, audit logging without secret values, and a secure secret-management service. Do not deploy a shared public instance that accepts API keys until those controls are in place.

The anonymous AI Horde fallback is useful for demonstrations and development, but it is community-powered and queue-dependent. For reliable production behavior, configure a provider key and monitor rate limits, usage, and provider failures.

## Development Commands

```bash
# Frontend development server
cd frontend && npm run dev

# Frontend production build
cd frontend && npm run build

# Backend server
cd backend && node server.js
```

## Relationship to Luna AI Desktop

The web application is a browser-oriented version of Luna AI. The desktop project is available at [github.com/R22-b/luna-AI](https://github.com/R22-b/luna-AI) and contains capabilities that require desktop privileges, including PC control, desktop plugins, voice mode, Project Guardian, and self-evolution.

## License

MIT License. Built by Ravikiran and contributors.

## References

[1]: https://gen.pollinations.ai/docs "Pollinations API Documentation"
[2]: https://pollinations.ai/play "Pollinations API Playground"
[3]: https://stablehorde.net/ "AI Horde Official Site"
