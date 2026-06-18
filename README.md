# cornea.ai — Frontend

The Next.js frontend for cornea.ai. Connects to the cornea.ai backend API and renders the full product blueprint with animated agent progress, tabbed results, and a live Mermaid architecture diagram.

## Setup

```bash
git clone https://github.com/YOUR_USERNAME/cornea-ai-frontend.git
cd cornea-ai-frontend
npm install
cp .env.local.example .env.local
```

Make sure your backend (cornea-ai / blueprint-ai) is running on `localhost:3000`.

## Run

```bash
npm run dev
```

Frontend runs on **http://localhost:3001** (or next available port).

## How it works

1. User types a product idea and clicks **"Focus your idea"**
2. The app calls `POST /api/blueprint` on the backend
3. While waiting, the loading screen animates through all 4 agents with wave effects
4. Results are displayed in 5 tabs: Overview, Features, Architecture, PRD, and Diagram
5. The Diagram tab renders the Mermaid architecture diagram as a visual flowchart
6. Users can export the full blueprint as JSON

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Framer Motion
- mermaid.js (diagram rendering)

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:3000` | URL of the cornea.ai backend |