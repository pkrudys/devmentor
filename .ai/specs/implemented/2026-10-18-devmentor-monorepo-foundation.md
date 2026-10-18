# DevMentor — fundament monorepo

## Cel

Przejście z pojedynczej aplikacji Next.js na monorepo (npm workspaces) z
czterema pakietami, zgodnie z docelowym stackiem DevMentor:

- **Next.js + TypeScript + React** — aplikacja (`packages/app`)
- **PostgreSQL + MikroORM** — dostęp do danych, migracje, pula połączeń (`packages/db`)
- **Awilix** — kontener Dependency Injection (`packages/core`)
- **Tailwind CSS** — stylowanie stron frontendowych
- **shadcn-ui** — komponenty dla stron/paneli backendowych (`packages/ui`)

## Zakres

Fundament/szkielet: każdy pakiet się builduje i typechecki, z jednym działającym
przykładem na pakiet. Bez logiki biznesowej, bez CLI migracji MikroORM, bez
docker-compose dla lokalnego Postgresa (świadomie odłożone — patrz "Poza
zakresem").

## Struktura

```
packages/
  app/   @devmentor/app   — Next.js (App Router), strony, routing, kompozycja UI
  core/  @devmentor/core  — kontener Awilix (DI), typy/kontrakty wspólne dla domeny
  db/    @devmentor/db    — encje MikroORM, konfiguracja połączenia z PostgreSQL
  ui/    @devmentor/ui    — komponenty UI wielokrotnego użytku (shadcn-ui + Tailwind)
```

Konwencja: pakiety w scope `@devmentor/*`, importowane bezpośrednio jako
źródła TypeScript (bez osobnego kroku builda `tsc -> dist`) — Turbopack
transpiluje pakiety workspace'u automatycznie pod App Routerem (Next.js
16.3, potwierdzone w `node_modules/next/dist/docs/01-app/03-api-reference/
05-config/01-next-config-js/transpilePackages.md`).

Zasada przydziału kodu:
- logika domenowa, serwisy, rejestracje DI → `core`
- dostęp do danych, encje, konfiguracja ORM → `db`
- komponenty UI wielokrotnego użytku → `ui`
- strony, routing, kompozycja, server actions → `app`

## Decyzje techniczne

- **Package manager:** npm workspaces (zgodnie z istniejącym `package-lock.json`;
  bez wprowadzania pnpm/turborepo).
- **`next dev`/`next build` uruchamiane z roota jako `next dev packages/app` /
  `next build packages/app`** (nie przez zagnieżdżone `npm run`), żeby
  `openmercato.toml` (`npm run dev -- --hostname ... --port ...`) przekazywał
  flagi bezpośrednio do `next`.
- **`outputFileTracingRoot`** w `packages/app/next.config.ts` ustawiony na root
  monorepo — bez tego Next liczy `packages/app` jako root tracingu plików i
  pomija hoistowany root `node_modules`.
- **Zarządzany blok Next.js agent-rules** (`<!-- BEGIN:nextjs-agent-rules -->`)
  przenosi się z root `AGENTS.md` do `packages/app/AGENTS.md` +
  `packages/app/CLAUDE.md`, bo `next dev` utrzymuje ten blok względem katalogu
  przekazanego jako argument (`packages/app`), nie względem CWD repo. Szczegóły:
  `.ai/lessons/nextjs-agent-rules-monorepo.md`.
- **Tailwind v4** (CSS-first config, bez `tailwind.config.js`) w `packages/app`;
  `packages/app/src/app/globals.css` dostaje `@import 'tailwindcss';` oraz
  `@source '../../../ui/src';`, żeby klasy użyte w `@devmentor/ui` nie zostały
  odcięte przez automatyczne wykrywanie contentu.
- **MikroORM:** `@mikro-orm/core` + `@mikro-orm/postgresql`, konfiguracja przez
  `process.env` (`DB_*`), jedna przykładowa encja (`User`). **Uwaga:** w
  zainstalowanej wersji (7.2.5) `@mikro-orm/core` nie eksportuje już
  dekoratorów `@Entity`/`@PrimaryKey`/`@Property` — jedyne dostępne API to
  `defineEntity()` (property builders) i `EntitySchema`. Encja `User` używa
  `defineEntity()`. Zweryfikowano przy `npm run typecheck` (dekoratory dawały
  `TS2305`/`TS2724`).
- **Awilix:** `packages/core/src/container.ts` eksportuje `createAppContainer()`
  z przykładową rejestracją (np. logger) jako wzorzec do rozbudowy.
- **shadcn-ui:** zamiast interaktywnego `npx shadcn init` (niewygodne w sesji
  agenta), ręcznie odtworzony `components.json` wg oficjalnego schematu +
  komponent `Button` w standardowym kształcie generowanym przez CLI, żeby
  przyszłe `npx shadcn add <komponent>` uruchomione w `packages/ui` działało
  bez dodatkowej konfiguracji.

## Poza zakresem (świadomie odłożone)

- CLI migracji MikroORM (`mikro-orm.config.ts` do uruchamiania migracji,
  katalog `migrations/`) — do zrobienia, gdy pojawią się pierwsze realne encje.
- `docker-compose.yml` z lokalnym Postgresem.
- Rzeczywiste strony/funkcjonalności DevMentor (mentoring, sesje, itp.) —
  obecny starter page w `packages/app` zostaje nietknięty.
- Turborepo / zdalny cache buildów — można dodać później, gdy liczba
  pakietów/apek wzrośnie.

## Status

Zaimplementowane w tej samej sesji co ta specyfikacja — po weryfikacji
(`npm install`, typecheck, lint, build) plik przenosi się do
`.ai/specs/implemented/`.
