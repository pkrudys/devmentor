# @devmentor/db

Dostęp do danych: encje [MikroORM](https://mikro-orm.io/) i konfiguracja
połączenia z PostgreSQL (pula połączeń, migracje — patrz niżej).

- `src/entities/base.entity.ts` — `baseEntityProperties()`: kolumny wspólne
  dla każdej encji (`id` UUID, `createdAt`, `updatedAt`).
- `src/entities/define.ts` — `defineDomainEntity(meta)`: cienki wrapper nad
  `defineEntity()` z `@mikro-orm/core`, dokładający bazowe kolumny przez
  spread (kompozycja zamiast dziedziczenia tabel — MikroORM 7 nie eksportuje
  już dekoratorów `@Entity`/`@Property`, patrz
  `node_modules/@mikro-orm/core/entity/defineEntity.d.ts`). Nowe encje
  definiuj przez `defineDomainEntity`, nie przez `defineEntity` bezpośrednio.
- `src/entities/<concept>/<name>.entity.ts` — jedna encja per plik, w folderze
  nazwanym jak koncept domenowy (np. `auth/user.entity.ts`). Rejestruj w
  `src/entities/index.ts`.
- `src/mikro-orm.config.ts` — konfiguracja połączenia. Używa
  `DEVMENTOR_DATABASE_URL` (priorytet) lub `DATABASE_URL` (connection string),
  jeśli ustawione; w przeciwnym razie dyskretnych
  `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD`. `DEVMENTOR_DATABASE_URL`
  istnieje specjalnie na sandboksy/platformy, które same eksportują ogólny
  `DATABASE_URL` dla swojej domyślnej bazy — taki ambient env var nie da się
  nadpisać przez `.env.local` (Next.js nigdy nie nadpisuje już ustawionej
  zmiennej `process.env`), więc dedykowana nazwa jest jedynym niezawodnym
  sposobem na własną bazę w takim środowisku.
- `src/index.ts` — `initOrm()`, helper wołający `MikroORM.init(config)`.

## Lokalne uruchomienie

```bash
createdb devmentor  # albo: psql -c "CREATE DATABASE devmentor"
export DEVMENTOR_DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/devmentor
npm run db:sync-schema -w @devmentor/db
```

W tym konkretnym sandboksie `packages/app/.env.local` (nieśledzony przez git)
ustawia `DEVMENTOR_DATABASE_URL` tak, żeby podgląd (`workspace-preview`
PM2) używał dedykowanej bazy `devmentor` zamiast współdzielonej domyślnej
`open-mercato`.

Uruchomienie CLI migracji MikroORM jest świadomie poza zakresem — na tym
etapie schemat synchronizuje się przez `orm.schema.update()`
(`scripts/sync-schema.ts`; **nie** `getSchemaGenerator()`, ta metoda nie
istnieje w MikroORM 7 — patrz `.ai/lessons/mikro-orm-v7-api-changes.md`).
Dodać prawdziwe migracje wraz z pierwszym wdrożeniem produkcyjnym.

MikroORM 7 też już nie łączy się z bazą automatycznie w `MikroORM.init()` —
`packages/core/src/container/orm.ts` (`getOrm()`) woła `orm.connect()`
jawnie, inaczej `/api/health` zgłaszałby status `degraded` mimo działających
zapytań.
