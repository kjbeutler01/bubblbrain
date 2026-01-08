# Render static site build design

## Context
- The app is a Vite + React static site deployed to Render.
- Build and publish settings should live in git for repeatable deploys.

## Goals
- Render builds succeed without manual dashboard setup.
- The static site serves the Vite output directory and handles deep links.
- Builds tolerate a missing `GEMINI_API_KEY` (optional at build time).

## Non-goals
- Adding backend services or server-side rendering.
- Changing runtime behavior beyond build-time safety.

## Approach
- Add `render.yaml` defining a Static Site service:
  - `buildCommand`: `npm install && npm run build`
  - `publishDir`: `dist`
  - `routes`: rewrite `/*` to `/index.html` for SPA routing
- Make `vite.config.ts` inject empty-string defaults when the env var is unset.

## Environment variables
- Optional: `GEMINI_API_KEY` (or `API_KEY`) set in Render for production builds.

## Verification
- `npm run build` locally.
- Render build logs show `vite build` succeeded and `dist` published.
