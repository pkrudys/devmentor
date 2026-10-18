# MikroORM 7 API zmiany (vs. dane treningowe / starsze wersje)

Zweryfikowane na `@mikro-orm/core@7.2.5`, `@mikro-orm/postgresql@7.2.5` w tym
repo. Ten projekt systematycznie ma biblioteki z API przesuniętym względem
tego, co "każdy wie" z danych treningowych (patrz też blok "Next.js w tym
repo" w `AGENTS.md` dla tego samego zjawiska u Next.js) — zawsze weryfikuj
faktyczne eksporty w `node_modules` przed pisaniem kodu.

## `MikroORM.init()` nie łączy się już automatycznie

`node_modules/@mikro-orm/core/MikroORM.js`, metoda `static async init()`:
odkrywa metadane (`discovery.discover()`) i tworzy `EntityManager`
(`createEntityManager()`), ale **nigdy nie woła `this.connect()`**. W v5/v6
`init()` domyślnie łączył się z bazą (opcja `connect: true` była domyślna).

Konsekwencje:
- Zapytania (`em.find()`, `em.persist().flush()`, ...) i tak działają — driver
  łączy się leniwie na żądanie przy pierwszym użyciu poola.
- `em.getConnection().isConnected()` zwraca `false` dopóki nie wywoła się
  jawnie `await orm.connect()` — sprawdza wewnętrzną flagę `connected`
  (`node_modules/@mikro-orm/sql/AbstractSqlConnection.js`, metoda
  `checkConnection()`), ustawianą tylko przez `connect()`.
- Health-checki/monitoring MUSZĄ więc wołać `orm.connect()` explicite po
  `initOrm()` — patrz `packages/core/src/container/orm.ts` (`getOrm()`).

## `persistAndFlush`/`removeAndFlush` usunięte

`EntityManager` w v7 ma tylko `persist(entity): this` i `remove(entity): this`
(stage) + osobne `flush(): Promise<void>` (commit). Wzorzec:

```ts
await em.persist(entity).flush();
await em.remove(entity).flush();
```

Zamiast starych wygodnych `persistAndFlush`/`removeAndFlush`, których
`node_modules/@mikro-orm/core/EntityManager.d.ts` w ogóle nie deklaruje.

## Generator schematu: `orm.schema`, nie `orm.getSchemaGenerator()`

`MikroORM` nie ma metody `getSchemaGenerator()` — ma gettera `schema` zwracającego
`ISchemaGenerator` (`create()`, `update()`, `drop()`, `refresh()`, ...).
Dla developmentu bez pełnych migracji: `await orm.schema.update()` (patrz
`packages/db/scripts/sync-schema.ts`).

## Dekoratory `@Entity`/`@PrimaryKey`/`@Property` nie istnieją

Patrz wpis w `.ai/lessons.md` z 2026-10-18 ("MikroORM 7.2.5 w tym repo nie
eksportuje dekoratorów encji") — jedyne API to `defineEntity()`/`EntitySchema`,
patrz `packages/db/src/entities/define.ts`.
