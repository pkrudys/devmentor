# Wdrożenie standardów inżynieryjnych (fundament)

Źródło: `.ai/docs/engineering-standards.md`.

## Cel

Zbudować generyczną, wielokrotnego użytku infrastrukturę opisaną w dokumencie
(`core/src/http/*`, `ui/src/backend/*`, DI-scoping EntityManagera, konwencja
`base.entity.ts`) oraz jeden realny przykład referencyjny (koncept `auth`:
encja `User`, `UserService`, `/api/health`, `/api/users`, `/admin/users`),
dowodzący end-to-end (na realnym Postgresie), że warstwy faktycznie działają
razem — dokument zakładał istniejący kod demo, którego w tym repo nie ma.

## Zakres tej iteracji

W zakresie:
- `packages/db/src/entities/{base.entity.ts,define.ts,auth/user.entity.ts}`
- `packages/core/src/{config/env.ts,logger.ts,container/*,services/auth/*,http/*,validators/auth/*}`
- `packages/ui/src/backend/{api,forms,tables,feedback}/*`
- `packages/app/src/app/{api/health,api/users,admin/users}/*`
- Aktualizacja `AGENTS.md` (Sekcja 3 dokumentu: "Domain concept convention" +
  "Reusable API & UI layer")

Poza zakresem (świadomie odłożone, zgodnie z YAGNI z samego dokumentu):
- Puste foldery dla `mentors`/`availability`/`bookings`/`payments`/`messages`/
  `favorites`/`reviews` — tworzone dopiero przy ich pierwszej encji.
- `core/src/events/` (event bus) — dopiero gdy pierwsza funkcja go potrzebuje.
- Prawdziwy flow logowania/rejestracji (`passwordHash`, bcrypt, endpoint
  login/register) — `auth.ts` dostaje mechanizm weryfikacji JWT, ale nic
  jeszcze nie wystawia tokenu poza ręcznym testem weryfikacyjnym.
- CLI migracji MikroORM i docker-compose dla Postgresa (jak w poprzedniej
  spec monorepo) — używamy `getSchemaGenerator().updateSchema()` do
  developmentu.
- `docs/product-scope.md` — **nie istnieje w tym repo** (to plik z osobnego
  "training-pack"), więc punkt "reconcile product-scope.md" z Sekcji 3/5
  dokumentu jest N/A.

## Decyzje techniczne

- **`base.entity.ts` + `define.ts`**: MikroORM 7.2.5 `defineEntity()` nie ma
  wygodnego mechanizmu "bazowej encji" bez prawdziwego dziedziczenia tabel
  (`extends`/`inheritance: 'tpt'`). Zamiast tego: `baseEntityProperties(p)`
  (funkcja zwracająca `id`/`createdAt`/`updatedAt`) + `defineDomainEntity(meta)`
  (wrapper łączący bazowe properties z properties konceptu przez spread). To
  zgodne z zasadą "Composition over inheritance" z dokumentu.
- **UUID PK**: `id: p.uuid().primary().onCreate(() => randomUUID())` —
  `.default()` w API builderów przyjmuje tylko literał, nie callback, więc
  dynamiczna wartość idzie przez `onCreate`.
- **Zod 4.6.7**: `CrudForm` introspekcję pól robi przez `instanceof
  z.ZodString/ZodNumber/ZodBoolean/ZodOptional/ZodEnum` + `.unwrap()`, nigdy
  przez prywatne `_def` (API `_def` zmieniło się między zod 3 i 4).
- **`makeCrudRoute`**: jeden `route.ts` eksportuje `{ GET, POST, PUT, DELETE }`
  (zgodnie z dokumentem) — brak segmentu `[id]`, więc `PUT` bierze `id` z body,
  `DELETE` z query `?id=`.
- **DB connection**: `packages/db` czyta `DATABASE_URL` (jeśli ustawione) z
  fallbackiem na dyskretne `DB_*` zmienne — w tym sandboksie `DATABASE_URL`
  domyślnie wskazuje na współdzieloną bazę `open-mercato`; dla developmentu
  tego projektu zakładamy osobną bazę `devmentor`.
- **`dynamic = "force-dynamic"`**: każda trasa dotykająca `db`/`core`
  (`api/health`, `api/users`) ma ten eksport, zgodnie z wymogiem "the app must
  build and boot with no database reachable".
- **`/admin/users` pozostaje publiczne** w tej iteracji — `requireSession`/
  `requireRole` są zbudowane i działają, ale nie ma jeszcze żadnej trasy
  wystawiającej sesję, więc wymuszanie auth na jedynym demo byłoby fasadą.
  Odnotowane jako znane ograniczenie do usunięcia, gdy powstanie realny
  koncept `auth` (login/register).

## Status

Zaimplementowane w tej samej sesji — po `npm run typecheck`/`lint`/`build` i
ręcznej weryfikacji na żywym Postgresie, plik przenosi się do
`.ai/specs/implemented/`.
