# @devmentor/app

Aplikacja Next.js (App Router) — strony, routing, kompozycja UI i server
actions DevMentor.

Korzysta z pozostałych pakietów workspace'u:

- `@devmentor/core` — kontener DI (Awilix), logika domenowa
- `@devmentor/db` — encje i konfiguracja MikroORM/PostgreSQL
- `@devmentor/ui` — komponenty UI (shadcn-ui + Tailwind)

Next.js-specific zasady dla agentów kodujących (auto-utrzymywane przez
`next dev`) są w `AGENTS.md` obok tego pliku — root `AGENTS.md` opisuje resztę
projektu.

Uruchamianie (z roota repozytorium):

```bash
npm install
npm run dev
```
