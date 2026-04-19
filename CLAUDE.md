# Claro — Job Search Copilot

You are building Claro, a Claude-powered job search copilot for experienced professionals.

## Before every session
Read these files in order before writing any code:
- PRODUCT.md
- FEATURES.md
- ARCHITECTURE.md
- SESSIONS.md

## Rules
- Never build outside the current session's defined scope in SESSIONS.md
- When uncertain between two approaches, choose the simpler one and note your decision
- Never expose ANTHROPIC_API_KEY to the client — all Claude API calls go through /api routes only
- Use TypeScript strictly — no `any` types
- Do not add any npm package not listed in ARCHITECTURE.md without asking first
- All Claude prompts live in /lib/prompts.ts — never inline
