# Twitter Report Card — Frontend

Single-page React app that asks for a Twitter / X username, calls the
[backend](https://github.com/Akipka/twitter-analyzer-backend), and renders a
school-style report card grading the user across six subjects.

## Stack

- Vite 7 + React 19 + TypeScript 5
- Tailwind CSS v4 (via `@tailwindcss/vite`)
- `html2canvas` for the "share as image" feature

## Local development

```bash
npm install
cp .env.example .env       # set VITE_API_URL to your backend
npm run dev                # http://localhost:5173
```

## Build

```bash
npm run build              # outputs dist/
npm run preview            # local preview of the production build
```

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in Vercel, leave defaults (`vite` is auto-detected).
3. Set environment variable `VITE_API_URL` to the deployed backend URL on
   Render.
4. Re-deploy.

`vercel.json` already wires SPA-style routing.

## Design

Color palette: warm paper `#f3efe8`, ink `#1f1d1a`, neutral gray `#7f8082`,
crimson accent `#9c433e`.

Type system:
- **Fraunces** — display / headings (literary serif)
- **Manrope** — body
- **Caveat** — hand-written grade letters (red ink)
- **JetBrains Mono** — numbers and metadata
