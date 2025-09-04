# AI Collab Editor (Demo)

A live collaborative editor built with **Next.js 14**, **TipTap + Yjs (WebRTC)**, **Tailwind**, an **AI Chat** sidebar that can apply edits to the editor, a **Floating Toolbar** for AI-powered selection tools, and a **bonus Agent** that performs web search (Tavily) and summarizes results for insertion into the editor.

> Demo-quality code focused on showcasing skills. Not production-grade.

## Features

- **Live Collaboration**: Peer-to-peer using Yjs + y-webrtc. Share the URL to collaborate.
- **Editor with TipTap**: StarterKit, placeholder, character count.
- **Floating Toolbar**: On selection, run AI actions: Fix, Shorten, Lengthen, Rewrite, Convert to Table, with a preview modal (Original vs Suggestion) and Confirm/Cancel.
- **Chat Sidebar**: AI chat on the right; assistant replies can be inserted directly into the editor.
- **Agent (Bonus)**: Web search via Tavily API + simple crawl + LLM summarization; insert results into editor.

## Stack

- Frontend: Next.js 14 (App Router) + React 18 + Tailwind CSS
- Editor: TipTap v2 + Yjs + y-webrtc (no custom websocket server needed)
- AI Providers: OpenAI (recommended) or OpenRouter; Anthropic stub present but unused
- Agent Search: Tavily API (free tier available)

## Quick Start

```bash
pnpm i   # or npm i / yarn
cp .env.example .env
# Add at least OPENAI_API_KEY or OPENROUTER_API_KEY
pnpm dev
```

Open http://localhost:3000. A `room` id will be generated in the URL—share it to collaborate live.

## Environment Variables

- `OPENAI_API_KEY` (recommended) — for /api/ai and agent summarization
- `OPENROUTER_API_KEY` (+ optional `OPENROUTER_BASE_URL`) — alternative provider
- `ANTHROPIC_API_KEY` — not currently used in this demo
- `TAVILY_API_KEY` — required for the bonus agent web search
- `AI_MODEL` — default `gpt-4o-mini`

## Deploy (Vercel)

1. Create a new Vercel project, import this repo.
2. Set Environment Variables in Vercel Project Settings (see above).
3. Deploy. After deploy, open the URL; a `room` id will appear in the query string.
4. Share the link in two browsers to verify collaboration.

> Netlify also works for the Next.js app, but P2P WebRTC relies on open signaling servers included in `y-webrtc` config. If your network blocks them, adjust the signaling list in `components/Editor.tsx`.

## Notes

- **Convert to Table** produces a **Markdown table** and inserts as plain text (TipTap renders it as text unless you add a Markdown extension). For demo simplicity we keep it as text.
- The **Agent** uses Tavily to get top links, fetches content (best-effort), and asks the LLM for a concise summary. Results can be inserted into the editor with one click.
- If no AI key is configured, AI routes will echo or display placeholder text so you can still demo UX.

## License

MIT
