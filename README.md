# DevMentor

DevMentor to marketplace mentoringowy dla programistów — platforma łącząca osoby chcące rozwijać swoje umiejętności techniczne z doświadczonymi mentorami, którzy oferują sesje 1:1, code review i wsparcie w rozwoju kariery.

## Status

Projekt we wczesnej fazie rozwoju, oparty o Next.js.

## Architektura

DevMentor to monorepo (npm workspaces) oparte na:

- **Next.js + TypeScript + React** — aplikacja.
- **PostgreSQL + [MikroORM](https://mikro-orm.io/)** — baza danych, migracje,
  pula połączeń.
- **[Awilix](https://github.com/jeffijoe/awilix)** — kontener Dependency
  Injection.
- **[Tailwind CSS](https://tailwindcss.com/)** — stylowanie stron
  frontendowych.
- **[shadcn-ui](https://ui.shadcn.com/)** — komponenty dla stron/paneli
  backendowych.

Kod jest podzielony na pakiety w `packages/`, w scope `@devmentor/*`:

```
packages/
  app/   @devmentor/app   — Next.js: strony, routing, kompozycja UI
  core/  @devmentor/core  — kontener Awilix (DI), logika domenowa
  db/    @devmentor/db    — encje MikroORM, konfiguracja PostgreSQL
  ui/    @devmentor/ui    — komponenty UI (shadcn-ui + Tailwind)
```

Szczegóły konwencji i decyzji projektowych — patrz `AGENTS.md` oraz
`.ai/specs/implemented/2026-10-18-devmentor-monorepo-foundation.md`.

## Rozwój

```bash
npm install
npm run dev
```

Aplikacja będzie dostępna pod adresem [http://localhost:3000](http://localhost:3000).
