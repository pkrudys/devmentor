# @devmentor/db

Dostęp do danych: encje [MikroORM](https://mikro-orm.io/) i konfiguracja
połączenia z PostgreSQL (pula połączeń, migracje — patrz niżej).

- `src/entities/` — encje MikroORM zdefiniowane przez `defineEntity()` (API
  v7 zastępujące dekoratory `@Entity`/`@Property`, których `@mikro-orm/core`
  w tej wersji już nie eksportuje — patrz `node_modules/@mikro-orm/core/entity/defineEntity.d.ts`).
  Nowe encje dodawaj tutaj i rejestruj w `src/mikro-orm.config.ts`
  (`entities: [...]`).
- `src/mikro-orm.config.ts` — konfiguracja połączenia, czytana ze zmiennych
  środowiskowych (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
- `src/index.ts` — `initOrm()`, helper wołający `MikroORM.init(config)`.

## Lokalne uruchomienie

Wymaga działającego PostgreSQL pod zmiennymi środowiskowymi powyżej (domyślnie
`localhost:5432`, baza `devmentor`). Utworzenie bazy i uruchomienie migracji
MikroORM CLI (`mikro-orm migration:create` / `migration:up`) jest świadomie
poza zakresem obecnego fundamentu monorepo — dodać wraz z pierwszymi realnymi
encjami (patrz `.ai/specs/2026-10-18-devmentor-monorepo-foundation.md`).
